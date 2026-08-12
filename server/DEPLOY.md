# Deploying Proshitute to Railway

This backend (`/server`) is a single Node/Express service that serves both
the API and the static frontend (`server/public/`), backed by a managed
Postgres database. Railway can host both the app and the database.

## 0. Prerequisites

- A GitHub account with this repo pushed (or use the Railway CLI to deploy
  without GitHub — see step 6).
- An OpenAI API key with access to a vision-capable model (`gpt-4o-mini` by
  default — see `src/vision.js` if you want to change the model), from
  https://platform.openai.com/api-keys. Real photo analysis won't work
  without this, but everything else in the app will.
- A Railway account: https://railway.app (sign in with GitHub is easiest).

## 1. Create the Railway project

1. In the Railway dashboard, click **New Project → Deploy from GitHub repo**
   and pick this repository.
2. Railway will try to build from the repo root. Since the backend lives in
   `/server`, open the new service's **Settings → Source** and set
   **Root Directory** to `server`. Redeploy after changing this.

## 2. Add a Postgres database

1. In the same project, click **New → Database → Add PostgreSQL**.
2. Railway provisions it and creates a `DATABASE_URL` variable on the
   Postgres service automatically.

## 3. Wire the database to the app

1. Open your web service's **Variables** tab.
2. Add `DATABASE_URL` and set its value to a **reference variable**:
   `${{Postgres.DATABASE_URL}}` (Railway autocompletes this — pick your
   Postgres service from the dropdown instead of typing it by hand).

## 4. Set the remaining environment variables

On the web service's **Variables** tab, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | A long random string. Generate one locally with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OPENAI_API_KEY` | Your OpenAI key. Leave unset if you want to launch without photo analysis for now — the rest of the app works fine, and `/api/vision/analyze` just returns a clear 503 instead of crashing. |
| `NODE_ENV` | `production` |

You do **not** need to set `PORT` — Railway injects it automatically and
`server.js` reads `process.env.PORT`.

## 5. Deploy

Railway redeploys automatically on every push to your connected branch.
On first boot, `server.js` runs the SQL migrations in
`src/migrations/` against the Postgres database before it starts accepting
requests (see the `start()` function at the bottom of `server.js`) — there's
no separate manual migration step for a normal deploy.

Watch the **Deployments** tab; once it's live, Railway gives you a public
`*.up.railway.app` URL under **Settings → Networking → Public Networking**
(click **Generate Domain** if one isn't there yet).

## 6. Alternative: deploy without GitHub (Railway CLI)

```bash
npm install -g @railway/cli
cd server
railway login
railway init
railway up
```

Then set the same environment variables via `railway variables set KEY=value`
or the dashboard, and add Postgres via the dashboard as in step 2.

## 7. Share it with friends

Send them the `*.up.railway.app` URL (or a custom domain, set up under
**Settings → Networking → Custom Domain**). They hit **Sign Up**, create an
account, and can add each other as friends from the **Circle** tab by
username to show up on each other's leaderboard.

## Costs

Railway's free trial gives new accounts $5 of one-time usage credit for 30
days with no credit card required. After that it moves to a metered Free
plan with a small monthly credit, or you can move to the Hobby plan
(currently $5/month base, usage billed on top) if you want the app to stay
up reliably for more than casual friend-group use. Postgres usage is billed
as part of the same metered usage, not a separate flat fee. Pricing changes
over time — check https://railway.app/pricing for current numbers before
you commit real usage to it.

## Local preview (zero setup, no Postgres needed)

For just trying the app out on your own machine before deploying anywhere,
you don't need Postgres, Docker, or a `.env` file at all:

```bash
cd server
npm install
npm start
```

Open http://localhost:3000. With no `DATABASE_URL` set, the server
automatically falls back to a local SQLite database (`server/data/proshitute.db`,
git-ignored) and generates a temporary session secret for you — you'll see
warnings about both in the terminal, which is expected. That temporary
secret means everyone gets logged out if you restart the server, and the
SQLite fallback is meant for kicking the tires, not for actually running
the thing day-to-day with friends — for that, follow the Railway steps
above so you get real Postgres and a stable secret.

Photo analysis still needs `OPENAI_API_KEY` set (see step 4) even in local
mode — without it, that one endpoint returns a clear error instead of
working, but everything else runs fine.

## Local development against real Postgres

If you want to develop against the same database engine you'll deploy to:

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL (a local or Railway Postgres), JWT_SECRET, OPENAI_API_KEY
npm install
npm run migrate        # optional — server.js also runs migrations on boot
npm start               # serves http://localhost:3000
```

## Tests

Run all three suites with `npm test`:
- `test/streak.test.js` — pure-logic streak/grace-token/achievement checks, no DB at all.
- `test/db.test.js` — the real Express routes against an in-memory Postgres mock (pg-mem), so the Postgres-path SQL is verified without needing a live database.
- `test/db.sqlite.test.js` — the same kind of coverage against the real local SQLite fallback (no mocking), since that's what most people will actually run first.
