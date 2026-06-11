-- Run once in the Supabase SQL Editor.
-- Reveal everyone's picks for a match as soon as its STAGE is locked (1 hour
-- before that stage's first match) — i.e. the moment predictions can no longer
-- change — instead of waiting for each individual match to kick off.
-- Safe to run on the live database (replaces one view).

create or replace view public.revealed_predictions as
select
  p.fixture_id,
  p.user_id,
  pr.display_name,
  p.predicted_home_score,
  p.predicted_away_score,
  p.points
from public.predictions p
join public.profiles pr on pr.id = p.user_id
join public.fixtures f on f.id = p.fixture_id
where (
  select min(f2.kickoff_utc) from public.fixtures f2 where f2.stage = f.stage
) - interval '1 hour' <= now();

grant select on public.revealed_predictions to anon, authenticated;
