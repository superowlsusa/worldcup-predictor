# Automated score sync

This pulls **final scores** from [football-data.org](https://www.football-data.org/) and
feeds them into Supabase. The database then recalculates every player's points and the
**league table updates itself** — no manual entry needed.

It uses the same `finalize_fixture_score` function the `/admin` page uses, so manual and
automatic updates are fully compatible (you can always override a score in `/admin`).

## One-time setup

### 1. Get a free football-data.org token
Register at https://www.football-data.org/client/register — you'll receive an API token by
email. The free tier covers the World Cup and is more than enough for a 15-minute schedule.

### 2. Get your Supabase service role key
Supabase dashboard → **Settings → API → Project API keys → `service_role`**. Copy it.
**This key is powerful — keep it secret. Never put it in `NEXT_PUBLIC_*` or the browser.**

### 3. Add them to `.env.local` (for local runs)
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FOOTBALL_DATA_TOKEN=your-football-data-org-token
```

## Run it locally

```bash
npm run sync-scores:dry   # shows what WOULD change, writes nothing
npm run sync-scores       # applies final scores
```

Run the dry version first to confirm matches line up.

## Run it automatically in the cloud (GitHub Actions — recommended)

A workflow is included at `.github/workflows/sync-scores.yml`. It runs every 15 minutes,
even when your computer is off.

1. Push this project to a GitHub repository.
2. In the repo: **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `SUPABASE_URL` — your `https://….supabase.co` URL
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FOOTBALL_DATA_TOKEN`
3. The job starts running on schedule. You can also trigger it any time from the **Actions**
   tab (“Run workflow”).

## How matching works

Each finished match is matched to a fixture by its **two team names** (in any home/away
order — scores are flipped to our orientation automatically) and the **closest kickoff
date**. Team-name spelling differences (e.g. "Korea Republic", "Türkiye", "Côte d'Ivoire")
are handled by the alias table in `scripts/sync-scores.mjs`.

### Knockout matches (auto-filled)
Knockout fixtures start with placeholder names ("Group A winners", etc.). The sync now
**auto-fills the real team names** once the bracket is known — it matches each slot by round
and kickoff time. If a slot is ever ambiguous (e.g. two matches within the time window), it's
left untouched and logged so you can set it in `/admin`. So in the normal case, knockout team
names are hands-off.

### If a match shows "⚠ No fixture matched"
The provider used a team spelling we don't recognise yet. Add it to the `ALIASES` map in
`scripts/sync-scores.mjs` (map the normalised spelling to our seed name) and re-run.

### A note on extra time / penalties
The script uses the provider's full-time score. For knockout games decided in extra time or
on penalties, double-check the result in `/admin` and override if your league scores those
differently.
