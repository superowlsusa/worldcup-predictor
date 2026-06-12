// Server-only sync logic, shared by the /api/sync route (and runnable anywhere
// with the right env vars). Mirrors scripts/sync-scores.mjs:
//   1) auto-fills knockout team names once a round's bracket is known
//   2) posts final scores via finalize_fixture_score (recalculates standings)
//
// Required env (server-side only — never NEXT_PUBLIC):
//   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, FOOTBALL_DATA_TOKEN

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN || '';

function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const ALIASES: Record<string, string> = {
  mexico: 'Mexico', southafrica: 'South Africa',
  southkorea: 'South Korea', korearepublic: 'South Korea', korea: 'South Korea', republicofkorea: 'South Korea',
  czechrepublic: 'Czech Republic', czechia: 'Czech Republic',
  canada: 'Canada', bosniaherzegovina: 'Bosnia & Herzegovina', bosniaandherzegovina: 'Bosnia & Herzegovina',
  qatar: 'Qatar', switzerland: 'Switzerland', brazil: 'Brazil', morocco: 'Morocco', haiti: 'Haiti', scotland: 'Scotland',
  usa: 'USA', unitedstates: 'USA', unitedstatesofamerica: 'USA',
  paraguay: 'Paraguay', australia: 'Australia', turkey: 'Turkey', turkiye: 'Turkey', germany: 'Germany',
  curacao: 'Curacao', ivorycoast: 'Ivory Coast', cotedivoire: 'Ivory Coast', ecuador: 'Ecuador',
  netherlands: 'Netherlands', holland: 'Netherlands', japan: 'Japan', sweden: 'Sweden', tunisia: 'Tunisia',
  spain: 'Spain', capeverde: 'Cape Verde', caboverde: 'Cape Verde', saudiarabia: 'Saudi Arabia', uruguay: 'Uruguay',
  belgium: 'Belgium', egypt: 'Egypt', iran: 'Iran', iriran: 'Iran', newzealand: 'New Zealand',
  france: 'France', senegal: 'Senegal', iraq: 'Iraq', norway: 'Norway', argentina: 'Argentina', algeria: 'Algeria',
  austria: 'Austria', jordan: 'Jordan', portugal: 'Portugal',
  drcongo: 'DR Congo', congodr: 'DR Congo', democraticrepublicofcongo: 'DR Congo', democraticrepublicofthecongo: 'DR Congo',
  uzbekistan: 'Uzbekistan', colombia: 'Colombia', england: 'England', croatia: 'Croatia', ghana: 'Ghana', panama: 'Panama',
};
const COUNTRY_SET = new Set(Object.values(ALIASES));
const canon = (name: string) => ALIASES[normalize(name)] || name;
const isKnownCountry = (name?: string) => !!name && COUNTRY_SET.has(canon(name));

function stageBucket(s: string): string {
  const x = (s || '').toUpperCase();
  if (x.includes('GROUP')) return 'GROUP';
  if (x.includes('32')) return 'R32';
  if (x.includes('16')) return 'R16';
  if (x.includes('QUARTER') || x === 'QF') return 'QF';
  if (x.includes('SEMI')) return 'SF';
  if (x.includes('THIRD') || x.includes('3RD') || x.includes('PLAYOFF') || x.includes('PLAY-OFF')) return '3RD';
  if (x.includes('FINAL')) return 'F';
  return x;
}

const SB_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
async function sbPatch(path: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${path} failed: ${res.status} ${await res.text()}`);
}
async function finalizeFixture(fixtureId: string, homeScore: number, awayScore: number) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/finalize_fixture_score`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_fixture_id: fixtureId, p_home_score: homeScore, p_away_score: awayScore }),
  });
  if (!res.ok) throw new Error(`finalize_fixture_score failed: ${res.status} ${await res.text()}`);
}
async function fetchAllMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FD_TOKEN },
  });
  if (res.status === 403) throw new Error('football-data.org 403 — token may not include the World Cup.');
  if (!res.ok) throw new Error(`football-data.org failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.matches || [];
}

const TOLERANCE_MS = 2.5 * 60 * 60 * 1000;

export async function runSync(opts: { dryRun?: boolean } = {}) {
  const dryRun = !!opts.dryRun;
  const log: string[] = [];
  if (!SUPABASE_URL || !SERVICE_KEY || !FD_TOKEN) {
    throw new Error('Missing env: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FOOTBALL_DATA_TOKEN');
  }

  const fixtures: any[] = await sbGet(
    'fixtures?select=id,match_no,stage,home_team,away_team,kickoff_utc,status,home_score,away_score&order=match_no.asc'
  );
  const matches: any[] = await fetchAllMatches();
  const finished = matches.filter((m) => m.status === 'FINISHED');
  log.push(`Fetched ${matches.length} matches (${finished.length} finished); ${fixtures.length} fixtures.`);

  // Pass 1 — knockout name auto-fill
  let renamed = 0;
  const realMatches = matches.filter((m) => isKnownCountry(m.homeTeam?.name) && isKnownCountry(m.awayTeam?.name));
  for (const f of fixtures) {
    if (isKnownCountry(f.home_team) && isKnownCountry(f.away_team)) continue;
    const bucket = stageBucket(f.stage);
    const ft = new Date(f.kickoff_utc).getTime();
    const cands = realMatches.filter(
      (m) => stageBucket(m.stage) === bucket && Math.abs(new Date(m.utcDate).getTime() - ft) <= TOLERANCE_MS
    );
    if (cands.length !== 1) {
      if (cands.length > 1) log.push(`⚠ Match ${f.match_no} (${f.stage}): ${cands.length} possible matchups — left for manual.`);
      continue;
    }
    const m = cands[0];
    const nh = canon(m.homeTeam.name), na = canon(m.awayTeam.name);
    if (nh === f.home_team && na === f.away_team) continue;
    log.push(`✎ Match ${f.match_no} (${f.stage}): ${f.home_team}/${f.away_team} -> ${nh}/${na}`);
    if (!dryRun) await sbPatch(`fixtures?id=eq.${f.id}`, { home_team: nh, away_team: na });
    f.home_team = nh; f.away_team = na; renamed++;
  }

  // Pass 2 — final scores
  let scored = 0, alreadyFinal = 0, noScore = 0, unmatched = 0;
  for (const m of finished) {
    const ph = m.score?.fullTime?.home ?? m.score?.regularTime?.home ?? null;
    const pa = m.score?.fullTime?.away ?? m.score?.regularTime?.away ?? null;
    if (ph == null || pa == null) {
      log.push(`• Finished but NO score from API yet: ${m.homeTeam?.name} vs ${m.awayTeam?.name} — score=${JSON.stringify(m.score)}`);
      noScore++; continue;
    }
    const pHome = canon(m.homeTeam?.name), pAway = canon(m.awayTeam?.name);
    const pDate = new Date(m.utcDate).getTime();
    const candidates = fixtures.filter((f) => {
      const set = new Set([canon(f.home_team), canon(f.away_team)]);
      return set.has(pHome) && set.has(pAway) && pHome !== pAway;
    });
    if (candidates.length === 0) {
      log.push(`⚠ No fixture matched: ${m.homeTeam?.name} vs ${m.awayTeam?.name} (${m.utcDate}).`);
      unmatched++; continue;
    }
    candidates.sort((a, b) =>
      Math.abs(new Date(a.kickoff_utc).getTime() - pDate) - Math.abs(new Date(b.kickoff_utc).getTime() - pDate));
    const fixture = candidates[0];
    const homeIsProviderHome = canon(fixture.home_team) === pHome;
    const homeScore = homeIsProviderHome ? ph : pa;
    const awayScore = homeIsProviderHome ? pa : ph;
    if (fixture.status === 'final' && fixture.home_score === homeScore && fixture.away_score === awayScore) {
      alreadyFinal++; continue;
    }
    log.push(`✓ Match ${fixture.match_no}: ${fixture.home_team} ${homeScore}-${awayScore} ${fixture.away_team}`);
    if (!dryRun) await finalizeFixture(fixture.id, homeScore, awayScore);
    scored++;
  }

  const summary = { ok: true, dryRun, fetched: matches.length, finished: finished.length, renamed, scored, alreadyFinal, noScore, unmatched };
  log.push(`Done. renamed: ${renamed} · scored: ${scored} · alreadyFinal: ${alreadyFinal} · finishedNoScore: ${noScore} · unmatched: ${unmatched}`);
  return { ...summary, log };
}
