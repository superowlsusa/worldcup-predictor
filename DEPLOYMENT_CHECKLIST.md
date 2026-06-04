# Deployment Checklist

## Supabase

- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql`
- [ ] Run `supabase/seed_fixtures.sql`
- [ ] In Authentication settings, configure the Site URL after Vercel deployment
- [ ] Sign up as the first user
- [ ] Set your profile `is_admin` to `true`

## Vercel

- [ ] Create GitHub repo
- [ ] Upload this project
- [ ] Import into Vercel
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy
- [ ] Add custom domain if desired

## Before sharing with players

- [ ] Test sign-up
- [ ] Test prediction save
- [ ] Test one-hour lock by changing a fixture time in test data
- [ ] Test admin score update
- [ ] Test standings update
- [ ] Confirm kickoff times are correct for your preferred display timezone
