# World Cup Predictor - Mobile Web App

This is a mobile-friendly web app for a private World Cup prediction league. It is designed to be shared as a normal link, for example `https://worldcup.yourdomain.com`, so players do **not** need to install an iPhone or Android app.

## What it does

- Player sign-up and sign-in
- Fixture list for the 2026 World Cup
- Score predictions for each match
- Predictions can be changed until one hour before kick-off
- Exact score = 3 points
- Correct winner or correct draw = 1 point
- Wrong outcome = 0 points
- Live standings table
- Admin screen for entering final scores
- Knockout placeholder team names can be updated after matchups are known
- Mobile-first design for iPhone and Samsung
- Can be added to a phone home screen like an app

## Tech stack

- Next.js
- React
- Supabase Auth
- Supabase Postgres
- Vercel deployment recommended

## Quick setup

### 1. Create a Supabase project

Go to Supabase and create a new project.

### 2. Add the database tables

Open Supabase SQL Editor and run:

```sql
supabase/schema.sql
```

Then run:

```sql
supabase/seed_fixtures.sql
```

This loads the 104 World Cup fixtures included with this package.

### 3. Set your first admin

After you create your own account in the app, go to Supabase > Table Editor > `profiles` and set your row:

```text
is_admin = true
```

This unlocks the `/admin` page for you.

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Deploy to a public link with Vercel

1. Push this folder to GitHub.
2. Create a Vercel account.
3. Import the GitHub repo into Vercel.
4. Add the same two environment variables in Vercel.
5. Deploy.
6. Optional: connect your own domain, such as `worldcup.lwrsoccer.com`.

## How players use it

Send everyone the website link. They can open it on iPhone or Samsung, sign up, and save it to their home screen.

### iPhone

Open the site in Safari > Share > Add to Home Screen.

### Samsung / Android

Open the site in Chrome > three dots menu > Add to Home screen.

## Admin workflow

- Before the tournament: confirm fixtures and kickoff times.
- During group stage: enter final scores in `/admin`.
- After knockout matchups are known: update placeholder team names in `/admin`.
- Players make new knockout predictions after teams are updated.
- Final scores automatically recalculate points.

## Notes

The app is intentionally simple so it is easy to run for 50+ players. For a larger public competition, add email confirmation rules, stronger admin tooling, and an automated football data API for fixtures and final scores.
