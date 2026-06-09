-- Run once in the Supabase SQL Editor.
-- Lets players see everyone's picks for a match — but only from that match's
-- kickoff onward — and stops anyone reading others' picks before then.
-- Safe to run on the live database.

-- 1) Players can read only their OWN raw predictions. (Standings + the reveal
--    view below are database views, which bypass this and still work.)
drop policy if exists "predictions readable for standings" on public.predictions;
drop policy if exists "users read own predictions" on public.predictions;
create policy "users read own predictions"
  on public.predictions for select using (auth.uid() = user_id);

-- 2) Reveal view: everyone's pick for a fixture, visible only once it kicks off.
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
where f.kickoff_utc <= now();

grant select on public.revealed_predictions to anon, authenticated;
