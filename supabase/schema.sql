-- Run this in Supabase SQL Editor.
-- It creates auth-linked profiles, fixtures, predictions, and standings scoring.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  id uuid primary key default uuid_generate_v4(),
  match_no integer not null unique,
  stage text not null,
  group_name text,
  home_team text not null,
  away_team text not null,
  kickoff_utc timestamptz not null,
  venue_city text,
  venue_country text,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','final')),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default uuid_generate_v4(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  predicted_home_score integer not null check (predicted_home_score >= 0),
  predicted_away_score integer not null check (predicted_away_score >= 0),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixture_id, user_id)
);

create or replace function public.score_prediction(ph integer, pa integer, ah integer, aa integer)
returns integer language plpgsql immutable as $$
declare pred_outcome text; actual_outcome text;
begin
  if ph = ah and pa = aa then return 3; end if;
  pred_outcome := case when ph > pa then 'H' when ph < pa then 'A' else 'D' end;
  actual_outcome := case when ah > aa then 'H' when ah < aa then 'A' else 'D' end;
  if pred_outcome = actual_outcome then return 1; end if;
  return 0;
end;
$$;

create or replace function public.prevent_late_prediction()
returns trigger language plpgsql as $$
declare ko timestamptz;
begin
  -- Only enforce the one-hour lock when a player is creating or changing their
  -- actual prediction. System updates to points (finalize/clear a result) must
  -- pass through, otherwise scoring a finished match would be blocked.
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

drop trigger if exists predictions_lock_trigger on public.predictions;
create trigger predictions_lock_trigger
before insert or update on public.predictions
for each row execute procedure public.prevent_late_prediction();

create or replace function public.finalize_fixture_score(p_fixture_id uuid, p_home_score integer, p_away_score integer)
returns void language plpgsql security definer as $$
begin
  update public.fixtures
  set home_score = p_home_score,
      away_score = p_away_score,
      status = 'final',
      updated_at = now()
  where id = p_fixture_id;

  update public.predictions p
  set points = public.score_prediction(p.predicted_home_score, p.predicted_away_score, p_home_score, p_away_score),
      updated_at = now()
  where p.fixture_id = p_fixture_id;
end;
$$;

-- Undo a result entered in error: clears the score, reopens the fixture, and
-- resets every prediction's points for that match back to 0.
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

create or replace view public.standings as
select
  p.user_id,
  coalesce(pr.display_name, 'Player') as display_name,
  sum(p.points)::integer as total_points,
  count(*) filter (where p.points = 3)::integer as exact_scores,
  count(*) filter (where p.points = 1)::integer as correct_outcomes,
  count(*)::integer as predictions_made
from public.predictions p
join public.profiles pr on pr.id = p.user_id
group by p.user_id, pr.display_name
order by total_points desc, exact_scores desc, correct_outcomes desc;

alter table public.profiles enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "fixtures readable" on public.fixtures;
create policy "fixtures readable" on public.fixtures for select using (true);
drop policy if exists "admins manage fixtures" on public.fixtures;
create policy "admins manage fixtures" on public.fixtures for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "predictions readable for standings" on public.predictions;
create policy "predictions readable for standings" on public.predictions for select using (true);
drop policy if exists "users insert own predictions" on public.predictions;
create policy "users insert own predictions" on public.predictions for insert with check (auth.uid() = user_id);
drop policy if exists "users update own predictions" on public.predictions;
create policy "users update own predictions" on public.predictions for update using (auth.uid() = user_id);
