-- Run once in the Supabase SQL Editor.
-- Changes the prediction lock from "per match, 1 hour before kick-off" to
-- "per stage, 1 hour before that stage's FIRST match". So all group-stage
-- predictions lock 1 hour before the first group game, all Round-of-32
-- predictions lock 1 hour before the first R32 game, and so on.
-- Safe to run on the live database (only replaces one function).

create or replace function public.prevent_late_prediction()
returns trigger language plpgsql as $$
declare lock_at timestamptz;
begin
  -- Only enforce when a player creates/changes their pick; system point updates pass through.
  if tg_op = 'INSERT'
     or new.predicted_home_score is distinct from old.predicted_home_score
     or new.predicted_away_score is distinct from old.predicted_away_score then
    select min(kickoff_utc) into lock_at
    from public.fixtures
    where stage = (select stage from public.fixtures where id = new.fixture_id);
    if now() >= lock_at - interval '1 hour' then
      raise exception 'Predictions for this stage are locked (close 1 hour before the stage''s first match)';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
