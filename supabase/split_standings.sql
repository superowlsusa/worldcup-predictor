-- Run once in the Supabase SQL Editor.
-- Splits the league into two separate tables: one scored on GROUP-stage games
-- only, one on KNOCKOUT games only. Safe to run on the live database.

create or replace view public.standings_group as
select
  p.user_id,
  coalesce(pr.display_name, 'Player') as display_name,
  sum(p.points)::integer as total_points,
  count(*) filter (where p.points = 3)::integer as exact_scores,
  count(*) filter (where p.points = 1)::integer as correct_outcomes,
  count(*)::integer as predictions_made
from public.predictions p
join public.profiles pr on pr.id = p.user_id
join public.fixtures f on f.id = p.fixture_id
where f.stage = 'Group Stage'
group by p.user_id, pr.display_name
order by total_points desc, exact_scores desc, correct_outcomes desc;

create or replace view public.standings_knockout as
select
  p.user_id,
  coalesce(pr.display_name, 'Player') as display_name,
  sum(p.points)::integer as total_points,
  count(*) filter (where p.points = 3)::integer as exact_scores,
  count(*) filter (where p.points = 1)::integer as correct_outcomes,
  count(*)::integer as predictions_made
from public.predictions p
join public.profiles pr on pr.id = p.user_id
join public.fixtures f on f.id = p.fixture_id
where f.stage <> 'Group Stage'
group by p.user_id, pr.display_name
order by total_points desc, exact_scores desc, correct_outcomes desc;

grant select on public.standings_group to anon, authenticated;
grant select on public.standings_knockout to anon, authenticated;
