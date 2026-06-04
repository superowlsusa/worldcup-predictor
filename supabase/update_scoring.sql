-- Run this once in the Supabase SQL Editor to:
--   1) fix the lock trigger so finalizing/clearing a played match isn't blocked
--   2) add clear_fixture_score so a wrong result can be undone
-- Safe to run on the existing database; it only replaces/adds functions.

create or replace function public.prevent_late_prediction()
returns trigger language plpgsql as $$
declare ko timestamptz;
begin
  if tg_op = 'INSERT'
     or new.predicted_home_score is distinct from old.predicted_home_score
     or new.predicted_away_score is distinct from old.predicted_away_score then
    select kickoff_utc into ko from public.fixtures where id = new.fixture_id;
    if now() >= ko - interval '1 hour' then
      raise exception 'Predictions lock one hour before kick-off';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.clear_fixture_score(p_fixture_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.fixtures
  set home_score = null,
      away_score = null,
      status = 'scheduled',
      updated_at = now()
  where id = p_fixture_id;

  update public.predictions
  set points = 0,
      updated_at = now()
  where fixture_id = p_fixture_id;
end;
$$;
