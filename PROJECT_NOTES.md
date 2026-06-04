# Project Notes

## Scoring

The scoring logic exists in both:

- `lib/scoring.ts` for readable frontend logic
- `supabase/schema.sql` as the `score_prediction` Postgres function

The database is the source of truth. When an admin finalizes a score, Supabase recalculates all predictions for that fixture.

## Prediction lock

The frontend disables predictions one hour before kick-off for the user experience. The database trigger also enforces the one-hour lock so players cannot bypass it.

## Knockout stage updates

The seed file includes fixture placeholders for the knockout rounds. Once matchups are known, go to `/admin` and change the placeholder teams. Players can then submit predictions for those matches until the one-hour lock.

## Future improvement: automatic score API

You can replace manual admin updates with an API job that calls a football data provider and then invokes the Supabase `finalize_fixture_score` function.
