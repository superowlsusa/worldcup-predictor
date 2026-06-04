-- Security hardening — run once in the Supabase SQL Editor before sharing the
-- public link. Safe to run on the live database (only replaces functions / adds
-- one trigger; touches no data).
--
-- It does two things:
--   1) Restricts setting/clearing match results to admins (or the service-role
--      sync job). Previously anyone with the public anon key could call them.
--   2) Stops a signed-up player from making THEMSELVES an admin.
--
-- "auth.jwt() is null" allows trusted direct connections (the Supabase Table
-- Editor / SQL Editor), so you can still set the first admin from the dashboard.

create or replace function public.finalize_fixture_score(p_fixture_id uuid, p_home_score integer, p_away_score integer)
returns void language plpgsql security definer as $$
begin
  if not (
       auth.jwt() is null
       or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
       or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
     ) then
    raise exception 'Only an admin can set match results';
  end if;

  update public.fixtures
  set home_score = p_home_score, away_score = p_away_score, status = 'final', updated_at = now()
  where id = p_fixture_id;

  update public.predictions p
  set points = public.score_prediction(p.predicted_home_score, p.predicted_away_score, p_home_score, p_away_score),
      updated_at = now()
  where p.fixture_id = p_fixture_id;
end;
$$;

create or replace function public.clear_fixture_score(p_fixture_id uuid)
returns void language plpgsql security definer as $$
begin
  if not (
       auth.jwt() is null
       or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
       or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
     ) then
    raise exception 'Only an admin can clear match results';
  end if;

  update public.fixtures
  set home_score = null, away_score = null, status = 'scheduled', updated_at = now()
  where id = p_fixture_id;

  update public.predictions
  set points = 0, updated_at = now()
  where fixture_id = p_fixture_id;
end;
$$;

-- Block players from changing their own is_admin flag (unauthorized changes are
-- silently reverted). Admins and the dashboard can still grant admin.
create or replace function public.guard_profile_admin()
returns trigger language plpgsql security definer as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if not (
         auth.jwt() is null
         or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
         or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
       ) then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_admin_guard on public.profiles;
create trigger profiles_admin_guard before update on public.profiles
for each row execute function public.guard_profile_admin();
