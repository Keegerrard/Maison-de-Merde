# Deploying Maison de Merde to Render + Neon

This backend (`/server`) is a single Node/Express service that serves both
the API and the static frontend (`server/public/`), backed by a managed
Postgres database. Render hosts the app; Neon hosts the database — Render's
own free Postgres expires after 30 days, Neon's free tier doesn't.

## 0. Prerequisites

- A GitHub account with this repo pushed.
- An OpenAI API key with access to a vision-capable model (`gpt-4o-mini` by
  default — see `src/vision.js` if you want to change the model), from
  https://platform.openai.com/api-keys. Real photo analysis won't work
  without this, but everything else in the app will.
- A Render account: https://render.com (sign in with GitHub is easiest).
- A Neon account: https://neon.tech (sign in with GitHub is easiest).

## 1. Create the Neon database

1. In the Neon console, click **New Project**. Give it a name (e.g.
   `maison-de-merde`) and pick a region — ideally close to whichever region
   you'll pick for the Render service in step 2.
2. Neon creates a default database and role for you immediately, no
   further setup needed.
3. Open **Connection Details** on the project dashboard and copy the
   connection string. It looks like:
   ```
   postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
   ```
   Keep this tab open — you'll paste it into Render in step 3.

Neon's free tier: 100 compute-hours/month, 0.5GB storage per project, no
credit card required, no expiry. It scales to zero when idle and wakes up
on the next query (sub-second to a couple seconds), which is a non-issue
for a friend-group app.

**On SSL:** Neon's connection string includes `?sslmode=require`. `src/db.js`
already sets `ssl: { rejectUnauthorized: false }` on the Postgres pool by
default (controlled by the `PGSSL` env var), which is compatible — you
don't need to change anything, just paste Neon's connection string as-is
into `DATABASE_URL`.

## 2. Create the Render web service

1. In the Render dashboard, click **New → Web Service**.
2. Connect your GitHub account if you haven't, and pick this repository.
3. Fill in the service settings:

   | Field | Value |
   |---|---|
   | Name | `maison-de-merde` (or anything) |
   | Region | Same region you picked for Neon, if possible |
   | Branch | `main` (or whatever you push to) |
   | Root Directory | `server` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

4. You don't need to set `PORT` — Render injects it automatically
   (`server.js` already reads `process.env.PORT`, and Express binds to
   `0.0.0.0` by default, which is what Render requires).

## 3. Set environment variables

Still on the service creation page (or later under **Environment**), add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from step 1 |
| `JWT_SECRET` | A long random string. Generate one locally with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OPENAI_API_KEY` | Your OpenAI key. Leave unset if you want to launch without photo analysis for now — the rest of the app works fine, and `/api/vision/analyze` just returns a clear 503 instead of crashing. |
| `NODE_ENV` | `production` |

Then click **Create Web Service**.

## 4. Deploy

Render builds and deploys automatically on every push to your connected
branch. On first boot, `server.js` runs the SQL migrations in
`src/migrations/` against the Neon database before it starts accepting
requests — there's no separate manual migration step.

Watch the **Logs** tab; once it says `Maison de Merde server listening on :10000
(db driver: postgres)`, it's live at the `*.onrender.com` URL shown at the
top of the service page.

**Free tier caveat:** the free instance type spins down after 15 minutes of
no traffic and takes roughly a minute to wake back up on the next request.
Fine for a casual friend group; if that cold start bugs you, Render's paid
Starter tier ($7/month) keeps it always-on.

## 5. Alternative: Blueprint (Infrastructure-as-Code)

A `render.yaml` is included in `/server` for Render's Blueprint deploys —
click **New → Blueprint** in the Render dashboard, point it at this repo,
and it pre-fills the service config from that file. You'll still need to
fill in `DATABASE_URL`, `JWT_SECRET`, and `OPENAI_API_KEY` manually in the
dashboard since those are marked `sync: false` (never commit secrets to
the repo).

## 6. Share it with friends

Send them the `*.onrender.com` URL (or a custom domain, set up under the
service's **Settings → Custom Domains**). They hit **Sign Up**, create an
account, and can add each other as friends from the **Circle** tab by
username to show up on each other's leaderboard.

## Costs

Render's free web service tier and Neon's free Postgres tier are both
genuinely free with no credit card and no trial expiration — the only
practical cost is the 15-minute-idle cold start described above. Pricing
and limits change over time — check https://render.com/pricing and
https://neon.tech/pricing for current numbers before you commit real usage.

## Local preview (zero setup, no Postgres needed)

For just trying the app out on your own machine before deploying anywhere,
you don't need Postgres, Docker, or a `.env` file at all:

```bash
cd server
npm install
npm start
```

Open http://localhost:3000. With no `DATABASE_URL` set, the server
automatically falls back to a local SQLite database (`server/data/maison-de-merde.db`,
git-ignored) and generates a temporary session secret for you — you'll see
warnings about both in the terminal, which is expected. That temporary
secret means everyone gets logged out if you restart the server, and the
SQLite fallback is meant for kicking the tires, not for actually running
the thing day-to-day with friends — for that, follow the Render + Neon
steps above so you get real Postgres and a stable secret.

Photo analysis still needs `OPENAI_API_KEY` set (see step 3) even in local
mode — without it, that one endpoint returns a clear error instead of
working, but everything else runs fine.

## Local development against real Postgres

If you want to develop against the same database engine you'll deploy to:

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL (Neon or any local Postgres), JWT_SECRET, OPENAI_API_KEY
npm install
npm run migrate        # optional — server.js also runs migrations on boot
npm start               # serves http://localhost:3000
```

You can point `DATABASE_URL` at the same Neon project you'll deploy with —
Neon's free tier supports separate branches per environment if you want to
keep dev data isolated from production later, but a single database is
fine to start.

## Tests

Run all three suites with `npm test`:
- `test/streak.test.js` — pure-logic streak/grace-token/achievement checks, no DB at all.
- `test/db.test.js` — the real Express routes against an in-memory Postgres mock (pg-mem), so the Postgres-path SQL is verified without needing a live database.
- `test/db.sqlite.test.js` — the same kind of coverage against the real local SQLite fallback (no mocking), since that's what most people will actually run first.
