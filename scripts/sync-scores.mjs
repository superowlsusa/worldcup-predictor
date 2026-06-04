#!/usr/bin/env node
/*
 * Auto-syncs final scores from football-data.org into Supabase.
 *
 * It fetches FINISHED World Cup matches, matches each one to a fixture in our
 * database (by the two team names, regardless of home/away order, picking the
 * closest kickoff date), and calls the `finalize_fixture_score` function — the
 * exact same function the /admin page uses. That recalculates every player's
 * points and the standings view updates automatically.
 *
 * Zero dependencies: uses built-in fetch (Node 18+).
 *
 * Required env vars (from .env.local, .env, or the process environment):
 *   NEXT_PUBLIC_SUPABASE_URL   (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Settings → API → service_role key)
 *   FOOTBALL_DATA_TOKEN        (free token from football-data.org)
 *
 * Usage:
 *   node scripts/sync-scores.mjs            # apply updates
 *   node scripts/sync-scores.mjs --dry-run  # show what would change, change nothing
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// --- Minimal .env loader (no dotenv dependency) ---------------------------
function loadEnvFile(name) {
  try {
    const text = readFileSync(join(ROOT, name), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file may not exist — that's fine */
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN;

function requireEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!FD_TOKEN) missing.push('FOOTBALL_DATA_TOKEN');
  if (missing.length) {
    console.error('Missing required environment variables:\n  - ' + missing.join('\n  - '));
    process.exit(1);
  }
}

// --- Team name canonicalisation -------------------------------------------
// Normalises any spelling to one of our seed team names so provider names
// ("Korea Republic", "Türkiye", "Côte d'Ivoire"...) line up with our fixtures.
function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const ALIASES = {
  mexico: 'Mexico',
  southafrica: 'South Africa',
  southkorea: 'South Korea', korearepublic: 'South Korea', korea: 'South Korea', republicofkorea: 'South Korea',
  czechrepublic: 'Czech Republic', czechia: 'Czech Republic',
  canada: 'Canada',
  bosniaherzegovina: 'Bosnia & Herzegovina', bosniaandherzegovina: 'Bosnia & Herzegovina',
  qatar: 'Qatar',
  switzerland: 'Switzerland',
  brazil: 'Brazil',
  morocco: 'Morocco',
  haiti: 'Haiti',
  scotland: 'Scotland',
  usa: 'USA', unitedstates: 'USA', unitedstatesofamerica: 'USA',
  paraguay: 'Paraguay',
  australia: 'Australia',
  turkey: 'Turkey', turkiye: 'Turkey',
  germany: 'Germany',
  curacao: 'Curacao',
  ivorycoast: 'Ivory Coast', cotedivoire: 'Ivory Coast',
  ecuador: 'Ecuador',
  netherlands: 'Netherlands', holland: 'Netherlands',
  japan: 'Japan',
  sweden: 'Sweden',
  tunisia: 'Tunisia',
  spain: 'Spain',
  capeverde: 'Cape Verde', caboverde: 'Cape Verde',
  saudiarabia: 'Saudi Arabia',
  uruguay: 'Uruguay',
  belgium: 'Belgium',
  egypt: 'Egypt',
  iran: 'Iran', iriran: 'Iran',
  newzealand: 'New Zealand',
  france: 'France',
  senegal: 'Senegal',
  iraq: 'Iraq',
  norway: 'Norway',
  argentina: 'Argentina',
  algeria: 'Algeria',
  austria: 'Austria',
  jordan: 'Jordan',
  portugal: 'Portugal',
  drcongo: 'DR Congo', congodr: 'DR Congo', democraticrepublicofcongo: 'DR Congo', democraticrepublicofthecongo: 'DR Congo',
  uzbekistan: 'Uzbekistan',
  colombia: 'Colombia',
  england: 'England',
  croatia: 'Croatia',
  ghana: 'Ghana',
  panama: 'Panama',
};

function canon(name) {
  const n = normalize(name);
  return ALIASES[n] || name; // fall back to original if unknown
}

// --- Supabase REST helpers -------------------------------------------------
async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function finalizeFixture(fixtureId, homeScore, awayScore) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/finalize_fixture_score`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_fixture_id: fixtureId, p_home_score: homeScore, p_away_score: awayScore }),
  });
  if (!res.ok) throw new Error(`finalize_fixture_score failed: ${res.status} ${await res.text()}`);
}

// --- football-data.org -----------------------------------------------------
async function fetchFinishedMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED', {
    headers: { 'X-Auth-Token': FD_TOKEN },
  });
  if (res.status === 403) {
    throw new Error('football-data.org returned 403 — your token may not include the World Cup competition.');
  }
  if (!res.ok) throw new Error(`football-data.org failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.matches || [];
}

// --- Main ------------------------------------------------------------------
async function main() {
  requireEnv();
  console.log(`World Cup score sync ${DRY_RUN ? '(DRY RUN — no changes will be written)' : ''}`);

  const fixtures = await sbGet(
    'fixtures?select=id,match_no,home_team,away_team,kickoff_utc,status,home_score,away_score&order=match_no.asc'
  );
  const matches = await fetchFinishedMatches();
  console.log(`Fetched ${matches.length} finished match(es) from football-data.org; ${fixtures.length} fixtures in DB.`);

  let updated = 0, alreadyFinal = 0, unmatched = 0;

  for (const m of matches) {
    const ph = m.score?.fullTime?.home;
    const pa = m.score?.fullTime?.away;
    if (ph == null || pa == null) continue; // no usable score

    const pHome = canon(m.homeTeam?.name);
    const pAway = canon(m.awayTeam?.name);
    const pDate = new Date(m.utcDate).getTime();

    // Candidate fixtures with the same pair of teams (ignoring home/away order).
    const candidates = fixtures.filter(f => {
      const set = new Set([canon(f.home_team), canon(f.away_team)]);
      return set.has(pHome) && set.has(pAway) && pHome !== pAway;
    });
    if (candidates.length === 0) {
      console.warn(`  ⚠ No fixture matched: ${m.homeTeam?.name} vs ${m.awayTeam?.name} (${m.utcDate}). Add aliases or set knockout team names in /admin.`);
      unmatched++;
      continue;
    }
    // Closest kickoff date wins (disambiguates a repeated pairing).
    candidates.sort((a, b) =>
      Math.abs(new Date(a.kickoff_utc).getTime() - pDate) - Math.abs(new Date(b.kickoff_utc).getTime() - pDate));
    const fixture = candidates[0];

    // Map provider scores onto OUR home/away orientation.
    const homeIsProviderHome = canon(fixture.home_team) === pHome;
    const homeScore = homeIsProviderHome ? ph : pa;
    const awayScore = homeIsProviderHome ? pa : ph;

    // Skip if already finalised with the same score.
    if (fixture.status === 'final' && fixture.home_score === homeScore && fixture.away_score === awayScore) {
      alreadyFinal++;
      continue;
    }

    console.log(`  ✓ Match ${fixture.match_no}: ${fixture.home_team} ${homeScore}-${awayScore} ${fixture.away_team}`);
    if (!DRY_RUN) await finalizeFixture(fixture.id, homeScore, awayScore);
    updated++;
  }

  console.log(`\nDone. ${DRY_RUN ? 'Would update' : 'Updated'}: ${updated} · already final: ${alreadyFinal} · unmatched: ${unmatched}`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
