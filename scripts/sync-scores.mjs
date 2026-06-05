#!/usr/bin/env node
/*
 * Syncs the World Cup from football-data.org into Supabase. It does two things:
 *
 *   1) AUTO-FILLS knockout team names. Knockout fixtures start with placeholders
 *      ("Group A winners", "Match 74 winners"...). Once the bracket is known, this
 *      replaces them with the real teams — matched by round + kickoff time, and
 *      ONLY when exactly one match fits (ambiguous ones are left for manual /admin,
 *      so the bracket can never be mis-assigned).
 *
 *   2) Posts FINAL scores via `finalize_fixture_score` — the same function the
 *      /admin page uses — which recalculates points and the standings.
 *
 * Zero dependencies: uses built-in fetch (Node 18+).
 *
 * Required env (from .env.local, .env, or the process environment):
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, FOOTBALL_DATA_TOKEN
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
      const val = m[2].replace(/^["']|["']$/g, '');
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

const COUNTRY_SET = new Set(Object.values(ALIASES));

function canon(name) {
  const n = normalize(name);
  return ALIASES[n] || name;
}

// A "real" team is one we recognise as a country (not a placeholder).
function isKnownCountry(name) {
  return !!name && COUNTRY_SET.has(canon(name));
}

// Maps any stage label (ours or the provider's) to a common bucket.
function stageBucket(s) {
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

// --- Supabase REST helpers -------------------------------------------------
const SB_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${path} failed: ${res.status} ${await res.text()}`);
}

async function finalizeFixture(fixtureId, homeScore, awayScore) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/finalize_fixture_score`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_fixture_id: fixtureId, p_home_score: homeScore, p_away_score: awayScore }),
  });
  if (!res.ok) throw new Error(`finalize_fixture_score failed: ${res.status} ${await res.text()}`);
}

// --- football-data.org -----------------------------------------------------
async function fetchAllMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FD_TOKEN },
  });
  if (res.status === 403) {
    throw new Error('football-data.org returned 403 — your token may not include the World Cup competition.');
  }
  if (!res.ok) throw new Error(`football-data.org failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.matches || [];
}

const TOLERANCE_MS = 2.5 * 60 * 60 * 1000; // how close a kickoff must be to match a slot

// --- Pass 1: auto-fill knockout team names ---------------------------------
function autofillKnockoutNames(fixtures, matches, dryRun) {
  const realMatches = matches.filter(m => isKnownCountry(m.homeTeam?.name) && isKnownCountry(m.awayTeam?.name));
  const updates = [];

  for (const f of fixtures) {
    const needs = !isKnownCountry(f.home_team) || !isKnownCountry(f.away_team);
    if (!needs) continue; // already has real teams (group stage, or already filled)

    const bucket = stageBucket(f.stage);
    const ft = new Date(f.kickoff_utc).getTime();
    const cands = realMatches.filter(
      m => stageBucket(m.stage) === bucket && Math.abs(new Date(m.utcDate).getTime() - ft) <= TOLERANCE_MS
    );

    if (cands.length !== 1) {
      if (cands.length > 1) {
        console.warn(`  ⚠ Match ${f.match_no} (${f.stage}): ${cands.length} possible matchups in window — leaving for manual /admin.`);
      }
      continue;
    }

    const m = cands[0];
    const newHome = canon(m.homeTeam.name);
    const newAway = canon(m.awayTeam.name);
    if (newHome === f.home_team && newAway === f.away_team) continue;

    updates.push({ f, newHome, newAway });
  }
  return updates;
}

// --- Main ------------------------------------------------------------------
async function main() {
  requireEnv();
  console.log(`World Cup sync ${DRY_RUN ? '(DRY RUN — no changes will be written)' : ''}`);

  const fixtures = await sbGet(
    'fixtures?select=id,match_no,stage,home_team,away_team,kickoff_utc,status,home_score,away_score&order=match_no.asc'
  );
  const matches = await fetchAllMatches();
  const finished = matches.filter(m => m.status === 'FINISHED');
  console.log(`Fetched ${matches.length} match(es) (${finished.length} finished); ${fixtures.length} fixtures in DB.`);

  // Pass 1 — knockout names
  const renames = autofillKnockoutNames(fixtures, matches, DRY_RUN);
  for (const { f, newHome, newAway } of renames) {
    console.log(`  ✎ Match ${f.match_no} (${f.stage}): ${f.home_team} / ${f.away_team} -> ${newHome} / ${newAway}`);
    if (!DRY_RUN) await sbPatch(`fixtures?id=eq.${f.id}`, { home_team: newHome, away_team: newAway });
    f.home_team = newHome; // update in-memory so scoring below can match by team
    f.away_team = newAway;
  }

  // Pass 2 — final scores
  let updated = 0, alreadyFinal = 0, unmatched = 0;
  for (const m of finished) {
    const ph = m.score?.fullTime?.home;
    const pa = m.score?.fullTime?.away;
    if (ph == null || pa == null) continue;

    const pHome = canon(m.homeTeam?.name);
    const pAway = canon(m.awayTeam?.name);
    const pDate = new Date(m.utcDate).getTime();

    const candidates = fixtures.filter(f => {
      const set = new Set([canon(f.home_team), canon(f.away_team)]);
      return set.has(pHome) && set.has(pAway) && pHome !== pAway;
    });
    if (candidates.length === 0) {
      console.warn(`  ⚠ No fixture matched: ${m.homeTeam?.name} vs ${m.awayTeam?.name} (${m.utcDate}).`);
      unmatched++;
      continue;
    }
    candidates.sort((a, b) =>
      Math.abs(new Date(a.kickoff_utc).getTime() - pDate) - Math.abs(new Date(b.kickoff_utc).getTime() - pDate));
    const fixture = candidates[0];

    const homeIsProviderHome = canon(fixture.home_team) === pHome;
    const homeScore = homeIsProviderHome ? ph : pa;
    const awayScore = homeIsProviderHome ? pa : ph;

    if (fixture.status === 'final' && fixture.home_score === homeScore && fixture.away_score === awayScore) {
      alreadyFinal++;
      continue;
    }

    console.log(`  ✓ Match ${fixture.match_no}: ${fixture.home_team} ${homeScore}-${awayScore} ${fixture.away_team}`);
    if (!DRY_RUN) await finalizeFixture(fixture.id, homeScore, awayScore);
    updated++;
  }

  console.log(
    `\nDone. ${DRY_RUN ? 'Would rename' : 'Renamed'}: ${renames.length} · ` +
    `${DRY_RUN ? 'would score' : 'scored'}: ${updated} · already final: ${alreadyFinal} · unmatched: ${unmatched}`
  );
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
