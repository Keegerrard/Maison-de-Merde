# Maison de Merde — Frontend Rebuild Plan

**Status:** architecture + design specification. No implementation code in this file.
**Executor:** Sonnet coding agent, working task-by-task from §F with `CLAUDE.md` + this file + only the files each task names.
**Deliverable of the whole plan:** the current plain HTML/CSS/JS frontend in `server/public/` is replaced by a Next.js + TypeScript + Tailwind + Framer Motion + Lucide application in a new `web/` workspace, comprising a brand-new public landing page and a full redesign of every in-app screen. The Express backend in `server/` is **not modified** except for its deploy documentation and `render.yaml`.

---

## 0. Verification findings (read before anything else)

These three things were checked in the actual code, because the plan depends on them being exactly right.

### 0.1 CORS + cookie setup — `server/server.js` lines 20–25, `server/src/auth.js` lines 4, 27–34

```
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}
```

- CORS middleware is **only mounted when `CORS_ORIGIN` is set**. By default there is no CORS layer at all.
- The session cookie is named `maison_de_merde_session` and is set with:
  `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, `maxAge: 30 days`.
- **The decisive fact: `sameSite: "lax"`.** A lax cookie is *not* sent on cross-site `fetch`/XHR — only on top-level GET navigations. So even with `CORS_ORIGIN` set and `credentials: "include"`, a Next.js app served from a *different origin* than the API would authenticate on login and then fail every subsequent request, because the browser would refuse to attach the cookie. Fixing that would require editing `server/src/auth.js` to `sameSite: "none"; secure: true`, and the backend is explicitly out of scope.
- **Therefore the architecture is same-origin, non-negotiable.** Dev uses a Next.js rewrite proxy so the browser only ever sees one origin; production serves the exported Next.js build from the same Express process. `CORS_ORIGIN` is left unset in both. Do not "fix" an auth problem by setting `CORS_ORIGIN` — it will not work and it is the wrong lever.

### 0.2 Static-file serving and deep links — `server/server.js` lines 35–41

```
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
```

- `express.static` is called with **no options**, so it uses `serve-static` defaults: `index: "index.html"` (directory requests serve the directory's `index.html`), `redirect: true` (a request for an existing directory without a trailing slash gets a 301 to the trailing-slash form), and **`extensions: false`** (it will *not* try `<path>.html`).
- **This breaks the naive setup.** With Next.js `output: "export"` and the default `trailingSlash: false`, the route `/app` is emitted as `out/app.html`. `express.static` will not resolve `/app` → `app.html`, so the request falls through to the catch-all and gets served `public/index.html` — which is the compiled **landing page**, not the app. The user would deep-link to `/app` and land on marketing copy with a hydration mismatch.
- **The fix, and it requires zero server changes: `trailingSlash: true` in `next.config.mjs`.** Export then emits `out/app/index.html`, `out/journal/streak-engine/index.html`, and so on. `GET /app` → serve-static 301s to `/app/` → serves `out/app/index.html`. Correct page, correct assets, no Express edit.
- Consequence for the executor: **every internal link must be written with a trailing slash** (`/app/`, `/journal/bristol-scale/`). `next/link` normalizes this when `trailingSlash: true`, but raw `href` strings, `router.push`, and `window.location` assignments must include it explicitly.
- The catch-all still fires for genuinely unknown paths and serves the landing page as a soft 404. That is acceptable and is the current behavior; do not add a `404.html` expectation, because the catch-all takes precedence over it.

### 0.3 Exact enum values accepted by `server/src/routes/sessions.js` (lines 9–11, 17–31)

Copy these **verbatim** into `web/lib/enums.ts`. Any drift produces a 400 that looks like a UI bug.

| Field | Wire key (POST body) | Accepted values |
|---|---|---|
| Bristol type | `bristolType` | integer `1`–`7`, or `null` / omitted. Non-integer, `<1`, or `>7` → 400 `"bristolType must be an integer 1-7."` |
| Colour | `color` | `"brown"`, `"dark-brown"`, `"green"`, `"yellow"`, `"pale"`, `"black"`, `"red"` (falsy/omitted allowed → stored `null`) |
| Odour | `odor` | `"typical"`, `"mild"`, `"strong"`, `"severe"` (US spelling `odor` on the wire — non-negotiable) |
| Pain / straining | `pain` | `"none"`, `"mild"`, `"moderate"`, `"severe"` |
| Symptoms | `symptoms` | any array of strings; non-strings filtered out, **truncated to the first 10**. No server-side enum — the client's four chips (`bloating`, `urgency`, `incomplete`, `cramping`) are a client-side convention only. |
| Visible food | `visibleFood` | coerced with `!!` — any truthy value |
| Blood flag | `bloodFlag` | coerced with `!!` |
| AI suggested | `aiSuggested` | coerced with `!!` |
| AI confidence | `aiConfidence` | stored only if `typeof === "number"`, else `null` |
| Notes | `notes` | string, **sliced to 2000 chars** server-side |
| Photo | `keepPhoto` + `photoDataUrl` | stored only when *both* are truthy; the data URL is sliced to 5,000,000 chars |

Two further contract facts that matter for typing:

- **`GET /api/sessions` returns raw snake_case DB columns**, not camelCase: `{ id, occurred_at, bristol_type, color, odor, pain, visible_food, blood_flag, symptoms (already JSON-parsed to an array), notes }`. The POST body is camelCase and the GET response is snake_case. This asymmetry is real; model both shapes separately in `web/lib/types.ts`.
- `POST /api/sessions` responds `201` with `{ session: { id, occurred_at }, streak, graceTokens, graceGranted, newlyUnlocked: [{ id, icon, name, desc }] }`.

### 0.4 Full API contract (fixed — build the client against this)

| Method + path | Body | Response |
|---|---|---|
| `POST /api/auth/signup` | `{ username, email, password }` | `201 { id, username }` + sets cookie. Validation: username 3–24 chars `[a-zA-Z0-9_]+`, valid email, password ≥ 8. `409` on duplicate username/email. |
| `POST /api/auth/login` | `{ username, password }` (`username` also matches an email) | `200 { id, username }` + sets cookie. `401 { error: "Invalid credentials." }` |
| `POST /api/auth/logout` | — | `{ ok: true }`, clears cookie |
| `GET /api/auth/me` | — | `200 { id, username, email }` or `401` |
| `POST /api/sessions` | see §0.3 | see §0.3 |
| `GET /api/sessions?limit=N` | — | `{ sessions: [...] }`, `limit` clamped 1–100, default 15 |
| `GET /api/dashboard` | — | `{ streak: { current, longest, tokensUsed }, graceTokens, streakFreezeUntil, heatmap: [{ day: "YYYY-MM-DD", count }] (91 entries, chronological), bristolCounts: number[7], badges: [{ id, icon, name, desc, unlocked }], totalSessions }` |
| `POST /api/dashboard/freeze` | `{ days }` — integer 1–60 | `{ streakFreezeUntil: "YYYY-MM-DD" }` |
| `GET /api/dashboard/export` | — | `text/plain` with `Content-Disposition: attachment`. **Must be triggered as a navigation (`window.location.href` or a plain `<a>`), never `fetch`** — the download depends on the browser handling the disposition header with the cookie attached. |
| `GET /api/circle` | — | `{ leaderboard: [{ username, streak, longest, consistency (0–1 float), isMe, userId }] }`, pre-sorted |
| `POST /api/circle/friends` | `{ username }` | `201 { ok: true }`; `404` unknown user; `400` self-friend |
| `GET /api/circle/requests` | — | `{ requests: [{ id, username }] }` |
| `POST /api/circle/requests/:userId/accept` | — | `{ ok: true }` |
| `POST /api/vision/analyze` | `multipart/form-data`, field name **`photo`**, ≤ 8 MB, `image/*` | `{ withheld: true, confidence }` when confidence < 0.4, else `{ withheld: false, confidence, bristolTypeGuess, colorGuess, visibleFoodGuess, notes }`. `503` when `OPENAI_API_KEY` is unset — surface that message verbatim, it is a real and expected state. |
| `GET /api/health` | — | `{ ok: true }` (used by `render.yaml` healthCheckPath) |

The nine badge ids from `server/src/streak.js` are fixed: `milestone_first`, `streak_7`, `streak_30`, `streak_100`, `streak_365`, `completeness_10`, `completeness_50`, `milestone_100_sessions`, `milestone_first_photo`.

### 0.5 The README §6.2 / paywall contradiction — preserve it, do not resolve it

`graphify-out/GRAPH_REPORT.md` flags an **AMBIGUOUS** edge: `Streak Freeze` → `Gold Circle paywall (dummy/satirical)`, sourced from `server/public/index.html`. It is a genuine contradiction with README §6.2, which states streak freeze is *"disclosed clearly rather than hidden as a monetized feature."* The shipped app hides it behind a fake Gold Circle paywall.

**This is the joke and it is load-bearing. Do not fix it.** The README is the earnest academic paper the product wears as a costume; the app is the wellness product that betrays the paper the moment money is mentioned. The gap between the two *is* the satire — a joke about how health apps write beautiful ethics sections and then paywall the anxiety-relief feature. Concrete consequences for this build:

1. The paywall stays exactly where it is, gating **Freeze Streak** and **Recover a Missed Day**. Restyle only.
2. The landing page states the earnest §6.2 policy — *"Miss one and a grace token absorbs it. Travelling? Freeze the whole thing in advance."* — with **no mention of price, tiers, or Gold Circle anywhere on the landing page**. The gag lands as an in-app ambush, which is both funnier and closer to how the real dark pattern works.
3. The `/journal/streak-engine/` entry describes the grace-token and freeze policy in fully sincere README voice, which makes the in-app paywall a sharper betrayal.
4. The only landing-page seed is one deadpan line under the signup CTA: *"Free. No card. The Gold Circle will find you on its own."*
5. The paywall's honest fine print — *"no card is real, no payment is processed"* — is retained verbatim in substance. The satire never becomes an actual deception.

Also from the graph report: `server/public/app.js` is a low-cohesion (0.088) 29-node god-community, and `server/public/index.html` is the single most connected node (11 edges). Both are being deleted, which resolves that structural finding by construction — the new `web/components/` tree replaces one 819-line file with ~50 single-responsibility components.

---

## A. Architecture decision

### A.1 Monorepo layout

`web/` at the repo root, sibling to `server/`, wired as an npm workspace.

```
Maison-de-Merde/
├── README.md                       (edited: §12 Getting Started only)
├── plan.md                         (this file)
├── package.json                    NEW — workspace root, dev/build/start scripts
├── package-lock.json               (regenerated by the root install)
├── .gitignore                      NEW — node_modules, web/.next, web/out, server/public
├── graphify-out/                   untouched
├── app/                            DELETED in T24 (dead legacy prototype)
└── server/                         backend — logic untouched
    ├── server.js                   UNTOUCHED
    ├── src/                        UNTOUCHED
    ├── package.json                UNTOUCHED
    ├── render.yaml                 EDITED (T23)
    ├── DEPLOY.md                   EDITED (T23)
    ├── .env.example                EDITED (T23)
    └── public/                     BUILD ARTIFACT ONLY — git-ignored, populated by the web build
└── web/                            NEW Next.js application
    ├── package.json
    ├── next.config.mjs
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── next-env.d.ts               (generated)
    ├── scripts/sync-public.mjs     copies web/out → server/public
    ├── public/                     favicon.ico, grain.svg
    ├── app/
    │   ├── layout.tsx              root layout, fonts, GrainOverlay, ToastProvider
    │   ├── globals.css             design tokens + Tailwind layers
    │   ├── page.tsx                landing page (server component)
    │   ├── journal/
    │   │   ├── streak-engine/page.tsx
    │   │   ├── bristol-scale/page.tsx
    │   │   └── photographs/page.tsx
    │   └── app/page.tsx            the product SPA entry → served at /app/
    ├── components/
    │   ├── ui/                     design-system primitives
    │   ├── landing/                landing-only sections
    │   └── app/                    in-app screens
    ├── hooks/
    └── lib/
```

Everything under `web/` is new. `server/src/**` and `server/server.js` are read-only for the whole plan.

### A.2 Dev: Next.js rewrite proxy, no CORS

- Express runs on **:3001** (`PORT=3001`, set with `cross-env` so it works in PowerShell — the user is on Windows and `PORT=3001 npm start` is a bash-ism that fails in cmd/PowerShell).
- `next dev` runs on **:3000**. The browser only ever talks to `http://localhost:3000`.
- `next.config.mjs` declares `rewrites()` mapping `/api/:path*` → `http://localhost:3001/api/:path*`. Next proxies server-side; the `Set-Cookie` from Express carries no `Domain` attribute, so the browser scopes it to `localhost:3000`. Same-site, `sameSite: "lax"` satisfied, cookie flows on every subsequent `fetch`.
- **`CORS_ORIGIN` stays unset.** There is no cross-origin request to permit.
- **Gotcha that will bite:** `rewrites()` is ignored (and warns) when `output: "export"` is set. The config must therefore switch on an env flag — `output` is `"export"` only when `NEXT_OUTPUT_EXPORT === "1"`, and `rewrites()` is only defined when it is not. The build script sets the flag; `next dev` never does. Spelled out in T02.

Two-terminal fallback is documented, but the root `dev` script runs both with `concurrently`.

### A.3 Production: static export, served by the existing Express process

`next build` with `output: "export"` produces `web/out/` — plain HTML/JS/CSS. `web/scripts/sync-public.mjs` empties `server/public/` and copies `web/out/` into it. Express serves it exactly as it does today. **One Render service, one origin, no reverse proxy, no second deploy target, no `output: "standalone"`, no Node server for Next.**

Why static export is correct here and not a compromise:
- Every byte of data is fetched client-side from `/api/*` with a session cookie. There is no request-time server rendering to lose — no server component fetches user data, no `cookies()`, no middleware, no route handlers, no `next/image` optimization (set `images: { unoptimized: true }`).
- The landing page and the three journal pages are genuinely static.
- `/app/` is a client-rendered SPA by nature (auth gate + four stateful tabs), which is precisely what a static shell + client fetching is for.
- It keeps the deploy story at one free Render service and one Neon database, which is the right amount of infrastructure for a friend-group app. Introducing a second service (Next on Render + API on Render) would break the cookie (§0.1) and double the cold starts for zero benefit.

Required `next.config.mjs` settings, all three load-bearing:
- `output: "export"` (gated by env flag, §A.2)
- `trailingSlash: true` (§0.2 — without this `/app/` is broken)
- `images: { unoptimized: true }` (export fails the build otherwise if any `next/image` is used)

### A.4 Changes to the deploy story (`server/DEPLOY.md`, `server/render.yaml`)

The build now needs the repo root, not `server/`. Exact diffs are specified in T23; the summary:

| | Before | After |
|---|---|---|
| Render **Root Directory** | `server` | *(blank — repo root)* |
| Render **Build Command** | `npm install` | `npm install && npm run build` |
| Render **Start Command** | `npm start` | `npm start` (root script → `npm --prefix server run start`) |
| `render.yaml` `rootDir` | `rootDir: server` | *(removed)* |
| Env vars | `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `NODE_ENV` | **unchanged** — no new variables, `CORS_ORIGIN` still unset |
| healthCheckPath | `/api/health` | unchanged |
| Local preview | `cd server && npm install && npm start` | `npm install && npm run build` once at root, then `npm start` (or `npm run dev` for the two-process hot-reload loop) |

`npm --prefix server run start` runs the script with cwd set to `server/`, so `require("dotenv").config()` still finds `server/.env`, and `path.join(__dirname, "public")` in `server.js` resolves correctly regardless of cwd anyway.

One new failure mode to document loudly in DEPLOY.md: **`server/public/` is git-ignored and is now a build artifact.** Running the server without having built `web/` first serves an empty directory — Express returns the catch-all `sendFile` for a file that does not exist and 500s. DEPLOY.md gets an explicit "run `npm run build` at the root first" note in both the local-preview and deploy sections.

### A.5 Auth: no new library, confirmed

`server/src/auth.js` issues a JWT in an **httpOnly** cookie. The Next.js app therefore needs exactly one thing: `fetch(..., { credentials: "include" })` against same-origin `/api/*`. Explicitly:

- **No NextAuth, no Auth.js, no iron-session, no JWT library on the client.** The token is httpOnly; client JS can never read it and must never try.
- Auth state is derived, not stored: `GET /api/auth/me` returns `200` (logged in) or `401` (not). That single call is the entire session check, exactly as `checkAuth()` does today in `server/public/app.js`.
- `credentials: "include"` is technically redundant for same-origin requests (the default is `same-origin`) but is kept because it is correct through the dev proxy and is unambiguous.
- Logout is `POST /api/auth/logout`; the client clears its in-memory user and re-renders the auth panel. There is nothing in `localStorage` to clear except the satirical premium flag, which deliberately survives logout.
- No middleware-based route protection. `/app/` is a static shell that renders the auth panel until `/api/auth/me` resolves. This is the only option under `output: "export"` and is also the honest one — there is no secret in the shell.

### A.6 App Router, and the server/client split

**App Router.** Justification, briefly: it is the current default and the only router receiving new features; `next/font` (needed for the self-hosted Geist + Instrument Serif stack) and the metadata API are first-class in it; nested layouts let the marketing pages and the app shell share a root layout while diverging cleanly; and `output: "export"` supports it completely for pages that are either fully static or fully client-rendered — which is every page here. The Pages Router would only pay off if we needed `getServerSideProps`, and we need the opposite.

**The split, stated concretely so no task has to guess:**

*Server components (no `"use client"`):*
- `app/layout.tsx` — fonts, `<html>`/`<body>` classes, metadata, renders `GrainOverlay` and `ToastProvider` (both client) as children.
- `app/page.tsx` — landing. Pure composition: it imports and arranges the section components. Zero hooks.
- `app/journal/*/page.tsx` — three static articles.
- Presentational primitives with no hooks and no motion props: `DoubleBezelCard`, `EyebrowTag`, `SectionHeading`, `EditorialSplit`, `Rule`, `EmptyState`, `SkeletonRow`, `SkeletonBlock`, `FooterWordmark`, `CitationCard`, `CommitmentRow`, `JournalCard`.

*Client components (`"use client"` at the top of the file):*
- `Reveal` and `Stagger` — the scroll-entry wrappers. **This is the key trick:** rather than making every section client-side to get `whileInView`, one small client wrapper wraps server-rendered children. `<Reveal><DoubleBezelCard>…</DoubleBezelCard></Reveal>` keeps the card's markup server-rendered and only the animating wrapper on the client.
- `FloatingNav`, `ScrollDescentHero`, `BristolMorphPath`, `BristolLegendRail`, `ServiceRow` (hover choreography), `SubsystemCard` (hover), `EnterPanel` (form state), `GrainOverlay`, `ToastProvider`, `Modal`, `PressButton`, `ArrowCTAButton`, `Icon`.
- **The entire `components/app/` tree, without exception.** `app/app/page.tsx` is a three-line `"use client"` file that renders `<AppShell />`; everything below it is stateful, fetches on mount, and is client-side. Do not attempt a partial split there — it is a SPA and pretending otherwise adds only ceremony.

*Routing inside `/app/`:* one route, four tabs held in React state — **not** four nested routes. Reasons: it mirrors the existing SPA, it avoids exporting four more HTML shells that would each re-run the auth check on navigation, and per the animation framework in `emil-design-eng`, tab switching is a **tens-of-times-per-session** action, so it must be instant with no page transition. Tab state is mirrored to `sessionStorage` so a reload restores the tab, and `?tab=circle` is read once on mount from `useSearchParams()` **inside a `<Suspense>` boundary** (a missing boundary is a hard build failure under `output: "export"` — see §G).

### A.7 Pinned versions (use these exact ranges; do not let `create-next-app` pick)

| Package | Version | Why pinned |
|---|---|---|
| `next` | `14.2.15` | App Router + `output: "export"` are mature here; avoids React 19 / Next 15 churn colliding with Framer Motion. |
| `react` / `react-dom` | `18.3.1` | Matches Next 14.2. |
| `framer-motion` | `^11.11.0` | Import path is **`"framer-motion"`**. The `"motion/react"` entry point belongs to the separate `motion` package (v12+) and does not exist here. |
| `lucide-react` | `^0.454.0` | Icons. |
| `tailwindcss` | `^3.4.14` | **v3 deliberately, not v4.** v4's CSS-first `@theme` config is a different authoring model; pinning v3 means `tailwind.config.ts` + `postcss.config.mjs` behave exactly as written in T02/T03 with no ambiguity. |
| `postcss` | `^8.4.47` | Tailwind v3 peer. |
| `autoprefixer` | `^10.4.20` | Tailwind v3 peer. |
| `geist` | `^1.3.1` | Official Vercel font package, self-hosted, no network fetch at build. |
| `typescript` | `^5.6.3` | — |
| `@types/react`, `@types/react-dom`, `@types/node` | latest matching the above | — |
| `concurrently` | `^9.0.1` (root devDep) | Runs both processes for `npm run dev`. |
| `cross-env` | `^7.0.3` (root devDep) | `PORT=3001` and `NEXT_OUTPUT_EXPORT=1` must work in PowerShell. |

`Instrument Serif` comes from `next/font/google` (no package install). `Geist Sans` and `Geist Mono` come from the `geist` package (`geist/font/sans`, `geist/font/mono`).

---

## B. Design system foundation

Built once, in T03, before any page. Everything downstream references these tokens by name.

### B.1 Variance Engine selection

**Vibe Archetype: 2 — Editorial Luxury.**
Justified by the README, not by taste. The document is written as an academic paper — abstract, numbered sections, a citations list, an "Evaluation Criteria" table — and it is wearing the name of a French fashion house, complete with the existing auth-screen line *"Établie 2026 · Purveyors of Fine Digestive Distinction."* Editorial Luxury is the literal rendering of that: warm cream paper, espresso ink, high-contrast display serif, a hairline rule system, a film-grain overlay at 3% so it reads as printed rather than emitted. The comedy comes from the restraint — a subject nobody will discuss, typeset like a medical journal published by a maison. It is also a hard reset away from the rejected gold-on-black ornate theme rather than a repaint of it: no gold, no medallions, no wax seals, no sparkles.

**Layout Archetype: 3 — The Editorial Split.**
Every major section is a two-column split: a **left rail** carrying the eyebrow tag, the massive serif heading, and a short lede; a **right column** carrying the actual content (the scroll animation, a list, a card stack, a chart). This gives the landing page a running editorial spine — the same relationship a journal's running head has to its body column — and it maps cleanly onto the user's template structure, where nearly every section is "statement on one side, content on the other." Section-internal grids (the four-subsystem stack, the badge grid) live *inside* the right column and stay subordinate to the split; they never become a competing top-level layout. Below `md` the split collapses to a full-width vertical stack: rail on top, content beneath, `w-full px-4`.

### B.2 Typography

Three real faces, no invented ones. None are on the banned list.

| Role | Face | Source | Usage |
|---|---|---|---|
| Display | **Instrument Serif** (400 + 400 italic) | `next/font/google`, `subsets: ["latin"]`, `weight: ["400"]`, `style: ["normal","italic"]` | H1/H2/H3, the manifesto statement, the footer wordmark, big stat numerals. Single weight is correct — at display sizes a 400-weight high-contrast serif reads expensive; faux-bolding it would ruin it. Emphasis comes from *size* and *italic*, never from weight. |
| Body / UI | **Geist Sans** | `geist/font/sans` | Every paragraph, label, button, input, nav link. |
| Data | **Geist Mono** | `geist/font/mono` | Eyebrow tags, tag pills, dates, Bristol type numbers, streak counts, percentages, leaderboard stats, citation metadata, heatmap tooltips. |

The typographic joke is the system: **serif = the maison, mono = the clinic.** Every screen carries both.

CSS variables exposed on `<html>` by `app/layout.tsx`: `--font-display`, `--font-sans`, `--font-mono`, mapped in `tailwind.config.ts` to `fontFamily.display`, `fontFamily.sans` (also the `body` default), `fontFamily.mono`.

Type scale (fluid, `clamp()`), defined as Tailwind `fontSize` entries:

| Token | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| `text-hero` | `clamp(3.25rem, 9vw, 8.5rem)` | `0.92` | `-0.03em` | Landing H1 only |
| `text-display` | `clamp(2.5rem, 5.5vw, 4.75rem)` | `0.96` | `-0.025em` | Section H2, manifesto |
| `text-title` | `clamp(1.75rem, 2.6vw, 2.5rem)` | `1.06` | `-0.02em` | Card titles, in-app H2 |
| `text-lede` | `clamp(1.0625rem, 1.35vw, 1.25rem)` | `1.55` | `-0.005em` | Section ledes |
| `text-body` | `1rem` | `1.65` | `0` | Paragraphs |
| `text-small` | `0.875rem` | `1.5` | `0` | Secondary text |
| `text-eyebrow` | `0.625rem` | `1` | `0.22em`, uppercase | Eyebrow tags, tag pills |
| `text-numeral` | `clamp(2.75rem, 6vw, 4.5rem)` | `0.9` | `-0.02em` | Streak / stat figures (display serif, `tabular-nums` via `font-variant-numeric`) |

Measure caps: body `max-w-[62ch]`, ledes `max-w-[46ch]`, manifesto `max-w-[24ch]`. The `gpt-taste` "no six-line wraps" instinct applies — nothing wider than 62 characters.

### B.3 Colour tokens

Defined as raw CSS custom properties on `:root` in `globals.css`, then referenced in `tailwind.config.ts` (e.g. `paper: "var(--paper)"`) so both `bg-paper` and arbitrary `[--paper]` usage work.

**Surfaces**
```
--paper:          #F6F2EA   page background (warm cream)
--paper-raised:   #FBF8F2   inner core of a Double-Bezel card
--paper-sunk:     #EDE7DC   outer shell of a Double-Bezel card, wells, inactive tracks
--paper-deep:     #E4DCCD   pressed/active states, heatmap level-0
```

**Ink**
```
--ink-900:  #14110F   primary text, display headings
--ink-700:  #3A332C   body text
--ink-500:  #6B6157   secondary / muted
--ink-300:  #9C9187   tertiary, placeholder, disabled
--rule:            rgba(20,17,15,0.10)   hairline borders
--rule-strong:     rgba(20,17,15,0.18)   emphasised hairlines
--shadow-ambient:  0 24px 60px -30px rgba(20,17,15,0.28)
--shadow-inner:    inset 0 1px 0 rgba(255,255,255,0.85)
```
No `1px solid gray` borders anywhere and no dark drop shadows — every border is an alpha-ink hairline, every shadow is a wide, low-opacity ambient diffusion. This is a hard rule from the design skill's anti-pattern list.

**Accent — clinical sage** (the "this is a real health instrument" signal: primary buttons, active states, positive chart fills)
```
--sage-700: #3F5646
--sage-600: #4F6B57
--sage-500: #5F7F68
--sage-200: #C6D5CB
--sage-100: #DDE6DF
```

**Signal — claret** (blood flag, severe pain, anomaly copy, destructive actions; used sparingly and never decoratively)
```
--claret-600: #8A2E39
--claret-200: #E4C4C8
--claret-100: #F2E2E4
```

**Bristol ramp — a diverging scale, seven stops.** This is a deliberate dataviz decision, not a gradient: Bristol 3–4 is the clinically normal band, so the scale diverges from a saturated anchor at Type 4 out toward desaturated extremes in both directions — constipated types (1–2) pull toward dry clay, loose types (6–7) toward washed amber. It reads correctly at a glance in the distribution chart *and* in the picker *and* in the hero morph, all from one array.
```
--bristol-1: #C9B79A   --bristol-2: #B79E7C   --bristol-3: #A5875F
--bristol-4: #8E6C43   (anchor — deepest, most saturated)
--bristol-5: #9C7C4E   --bristol-6: #B29066   --bristol-7: #C7A87F
```
Exported from `lib/bristol.ts` as an ordered array so chart, picker, legend, and morph animation can never disagree.

**No dark mode.** A single committed light palette. Editorial Luxury *is* a paper aesthetic; a dark variant would either look like the theme we just deleted or dilute the identity into a generic dashboard, and it would double the surface area of every task. Stated here so no downstream task invents one. `<meta name="color-scheme" content="light">` in the root layout prevents browser auto-inversion of form controls.

### B.4 Spacing, radii, container

- **Spacing:** Tailwind's default 4px scale, unextended. Discipline comes from usage, not new tokens.
- **Section rhythm:** `py-28 md:py-40` on every landing section; `py-20 md:py-28` in-app. Never tighter. The layout breathes heavily or the archetype fails.
- **Container:** `mx-auto w-full max-w-[1180px] px-5 md:px-10`.
- **Editorial Split:** `grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-16`; rail `md:col-span-4`, content `md:col-span-8`. Rail is `md:sticky md:top-28 md:self-start` on long sections (Services, Foundations) so the heading holds while the list scrolls.
- **Radii (concentric, mathematically derived — not eyeballed):**
  ```
  --r-shell: 28px    outer bezel
  --r-core:  22px    inner core  (28 − 6px shell padding)
  --r-sm:    14px    inputs, chips, small cards
  --r-core-sm: 10px  (14 − 4px)
  --r-pill:  9999px  buttons, tags, nav
  ```
- **Full-height sections:** always `min-h-[100dvh]`, never `h-screen` (iOS Safari viewport jump).

### B.5 `DoubleBezelCard` specification

The single most-reused visual object. Every card, panel, form well, modal, and chart frame is built from it. Two nested elements, always:

- **Outer shell:** `bg-[--paper-sunk] p-1.5 rounded-[--r-shell] ring-1 ring-[--rule] shadow-[--shadow-ambient]`
- **Inner core:** `bg-[--paper-raised] rounded-[--r-core] shadow-[--shadow-inner] p-6 md:p-8`

Props: `as` (element type, default `div`), `tone` (`"default" | "sunken" | "signal"` — `signal` swaps the shell ring to `--claret-200` for blood-flagged rows), `padding` (`"none" | "tight" | "default"` — `none` for cards whose child needs to reach the core's edge, e.g. the heatmap), `interactive` (adds the hover lift + `:active` press, off by default because most cards are not buttons), `className` for the shell, `coreClassName` for the core.

The small variant (`DoubleBezelCard size="sm"`) uses `p-1 rounded-[--r-sm]` / `rounded-[--r-core-sm] p-4` and is used for chips, badge tiles, and leaderboard rows.

**Never place a card, image, input, or chart flatly on the page background.** If it is a surface, it is bezelled.

### B.6 `ArrowCTAButton` — the button-in-button spec

Primary CTAs are fully-rounded pills with a **nested circular icon well** flush to the right inner padding — the arrow never floats naked beside the text.

- Shell: `group inline-flex items-center gap-3 rounded-full pl-6 pr-1.5 py-1.5 bg-[--ink-900] text-[--paper]`
- Label: `text-small font-medium tracking-[-0.01em]`
- Icon well: `w-9 h-9 rounded-full bg-[--paper]/12 grid place-items-center shrink-0`
- Icon: Lucide `ArrowUpRight`, `size={16}`, `strokeWidth={1.25}`
- Hover (gated behind `@media (hover:hover) and (pointer:fine)`): the whole button `bg-[--sage-700]`; the icon well `scale-105` and `translate-x-[3px] -translate-y-[1px]` — internal kinetic tension, not a colour flip.
- Press: `active:scale-[0.97]`, `transition: transform 140ms var(--ease-out)`.
- Secondary variant: `bg-transparent text-[--ink-900] ring-1 ring-[--rule-strong]`, icon well `bg-[--ink-900]/6`.

`PressButton` is the base for everything else (`primary` sage-filled, `secondary` hairline-ringed, `ghost`, `danger` claret) and always carries `active:scale-[0.97]` with `transition-transform duration-[140ms]` on the custom ease-out. A button with no press state is a defect.

### B.7 Motion tokens

Exported both as CSS variables (`globals.css`) and as a TypeScript object (`lib/motion.ts`) so Tailwind classes and Framer Motion props draw from one source.

**Easing** — custom curves only; the built-in CSS easings are too weak and `ease-in` is banned outright on UI (it delays the first frame, which is the frame the user is watching).
```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)      entering, exiting, hover, press
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)     on-screen movement / morphs
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)      sheets, modals, the mobile nav overlay
```

**Durations**
| Interaction | Duration | Ease |
|---|---|---|
| Button press / release | 140ms | `--ease-out` |
| Tag, chip, tooltip | 160ms | `--ease-out` |
| Tab indicator slide | 180ms | `--ease-out` |
| Dropdown, select, chip expand | 200ms | `--ease-out` |
| Toast enter | 320ms / exit 200ms | `--ease-out` (asymmetric: exits are faster than entrances) |
| Modal / paywall enter | 260ms / exit 180ms | `--ease-drawer` |
| Scroll reveal | 700ms | `--ease-out` |
| Mobile nav overlay | 420ms | `--ease-drawer` |

Nothing interactive exceeds 300ms. Only scroll-reveals and the marketing hero are allowed to be slower.

**Springs** (Apple parameterisation — easier to reason about than stiffness/damping):
- Specimen settle / streak numeral bump: `{ type: "spring", duration: 0.5, bounce: 0.2 }`
- Layout shifts, tab indicator `layoutId`: `{ type: "spring", duration: 0.4, bounce: 0 }`
- Drag/swipe return: `{ type: "spring", duration: 0.45, bounce: 0.15 }`

**Standing motion rules, binding on every task:**
1. Animate **only `transform` and `opacity`** (plus `fill`, `pathLength`, and the hero's `d`). Never `top`/`left`/`width`/`height`/`margin`/`padding`.
2. Never `transition: all`. Name the properties.
3. Never enter from `scale(0)`. Entrances start at `scale(0.95)`+ with `opacity: 0`.
4. Popovers scale from their trigger (`transform-origin` set to the trigger edge). **Modals are the exception and stay `transform-origin: center`** — they are not anchored to anything.
5. Use CSS transitions, not keyframes, for anything that can be re-triggered rapidly (toasts, chips, tab indicator) so it can be interrupted and retargeted.
6. Gate every hover animation behind `@media (hover: hover) and (pointer: fine)`.
7. Stagger grouped entrances by 60ms, never more; stagger never blocks interaction.
8. `useReducedMotion()` from Framer Motion is honoured in every animated component: keep opacity and colour transitions, drop all position/scale movement, and collapse scroll-linked sections to static compositions. Reduced motion means *gentler*, not *none*.
9. Under load, prefer CSS/WAAPI for predetermined animations; use Framer Motion for interruptible and scroll-linked ones. Where Framer Motion drives a transform, prefer the full `transform` string over the `x`/`y`/`scale` shorthands on the hero specimen, which animates continuously during scroll (the shorthands run on the main thread via rAF and drop frames while the page is busy).

### B.8 Icon strategy — the Lucide contradiction, resolved

The user's template prompt specifies Lucide. The `high-end-visual-design` skill bans *"standard thick-stroked Lucide."*

**Resolution: keep `lucide-react`, ban the default stroke weight.** The skill's objection is to the 2px default stroke, which is what makes Lucide look like a bootstrapped admin panel — not to the library, whose geometry is clean and whose stroke width is a first-class prop. A Lucide glyph at `strokeWidth={1.25}` and 18–20px is visually equivalent to Phosphor Light, and keeping Lucide preserves the user's stated dependency, tree-shaking, and a 1,500-icon set with no new package.

Enforced structurally, not by convention:
- `components/ui/Icon.tsx` is the **only** file permitted to import from `lucide-react`. It re-exports a curated map and applies `strokeWidth` and `size` defaults.
- Defaults: `strokeWidth={1.25}`, `size={18}`. Large decorative icons (≥ 32px) drop to `strokeWidth={1}`. Nothing ever renders above `1.5`.
- Curated set (import only these): `ArrowUpRight`, `ArrowRight`, `ArrowDown`, `Check`, `X`, `Plus`, `Minus`, `Menu`, `Flame`, `Snowflake`, `Users`, `UserPlus`, `Award`, `FileText`, `Download`, `Camera`, `Image`, `AlertTriangle`, `Droplet`, `Circle`, `CircleDot`, `Clock`, `Calendar`, `TrendingUp`, `Lock`, `Crown`, `Loader2`, `ChevronDown`, `ChevronRight`, `Sparkle`.
- Icons are decorative unless they are the only content of a control; they carry `aria-hidden="true"` by default and the wrapper exposes an `label` prop that switches them to `role="img"` + `aria-label`.
- **Emoji are banned from the UI chrome.** The backend returns emoji in `badges[].icon` and that contract is untouched, but the client does not render them — `lib/badgeIcons.ts` maps each of the nine known badge ids to a Lucide icon + a serif numeral, with the server emoji retained only as an `aria-hidden` fallback for an unrecognised id. See T20.

### B.9 The scroll animation — **"La Chute"** (the descent)

The single most important creative decision in this plan, specified to buildable detail.

#### Concept

The user asked for a toilet seat doing something, or a turd falling as you scroll. Both, done as **hairline technical illustration** — a specimen plate from a monograph, not clip art. A porcelain rim is drawn in plan view as two concentric hairline ellipses; a lid swings open; a single abstract form descends the frame and **morphs continuously through Bristol Types 1 → 7 as it falls**, with a scroll-synced legend naming each type as it passes. It reaches the water, two hairline ripples expand, the lid closes.

It earns its place because it is not decoration: it *teaches the Bristol Stool Scale*, which is the product's entire taxonomy. The purpose is **explanation**, which is the one category where a long marketing animation is unambiguously justified. And the joke is delivered by restraint — the most undignified possible subject, rendered as a plate in a scientific monograph.

#### Structure

`components/landing/ScrollDescentHero.tsx` — client component.

- Outer section: `relative h-[220vh] md:h-[320vh]`, `ref={heroRef}`.
- Inner stage: `sticky top-0 h-[100dvh] overflow-hidden grid place-items-center` — pinned while the outer section scrolls past.
- `const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] })` → `p` ∈ [0, 1].
- Three stacked layers inside the stage, all absolutely positioned within a `relative` wrapper:
  1. **Copy block** (`z-20`) — eyebrow, H1, lede, CTAs. Left-aligned per the Editorial Split.
  2. **Legend rail** (`z-20`) — `BristolLegendRail`, seven rows.
  3. **The plate** (`z-10`) — the SVG stack.

#### The plate — SVG structure

The plate is **two SVGs plus one wrapper div**, not one SVG, because the lid needs a real 3D rotation and 3D transforms on SVG child elements are unreliable across browsers. Putting the lid in its own absolutely-positioned SVG lets the rotation be a plain CSS transform on a `<motion.div>` — GPU-composited and dependable.

```
<div class="relative" style="perspective: 900px">          ← plate wrapper (blurs/fades at the end)
  <svg viewBox="0 0 400 900">                              ← base plate
    <motion.ellipse id="rim-outer"  cx=200 cy=700 rx=150 ry=46  fill=none stroke=--rule-strong stroke-width=1 />
    <motion.ellipse id="rim-inner"  cx=200 cy=700 rx=118 ry=34  fill=none stroke=--rule        stroke-width=1 />
    <ellipse        id="water"      cx=200 cy=702 rx=108 ry=30  fill=--paper-sunk />
    <motion.g id="specimen">                               ← transform-driven descent
      <motion.path d={morphedD} fill={morphedFill} />
    </motion.g>
    <motion.ellipse id="ripple-a" cx=200 cy=702 rx=60 ry=17 fill=none stroke=--rule-strong />
    <motion.ellipse id="ripple-b" cx=200 cy=702 rx=60 ry=17 fill=none stroke=--rule />
  </svg>

  <motion.div class="absolute inset-0" style={{ transformOrigin: "50% 78%", transform: lidTransform }}>
    <svg viewBox="0 0 400 900">                            ← lid, its own SVG
      <path id="lid" d="…" fill=--paper-raised stroke=--rule-strong stroke-width=1 />
      <path id="lid-seam" d="…" fill=none stroke=--rule stroke-width=1 />
    </svg>
  </motion.div>
</div>
```

`lidTransform = useTransform(p, [0, 0.06, 0.16, 0.94, 1], ["rotateX(0deg)", "rotateX(0deg)", "rotateX(-104deg)", "rotateX(-104deg)", "rotateX(0deg)"])` — a full transform string, not the `rotateX` shorthand, so it composites off the main thread.

The lid `d` is a simple rounded-oval outline matching the outer rim (a closed path of four cubic segments around `cx=200, cy=700, rx=150, ry=46`) with a hairline seam arc inset by 10px. It is a shape, not a drawing of a toilet lid — it reads as the lid only because of where it sits and how it hinges.

#### The specimen morph — the buildable trick

`lib/bristol.ts` exports `BRISTOL_PATHS: readonly [string, string, string, string, string, string, string]`.

**Hard constraint, and the whole thing depends on it: all seven path strings must have an identical command sequence and an identical count of numbers.** Framer Motion interpolates strings by tokenising numbers out of a fixed surrounding structure; if the structure differs by even one command or one number, it silently snaps between values instead of morphing. Every path is authored as:

```
M <x0> <y0> C <x1> <y1> <x2> <y2> <x3> <y3> C … C … C … Z
```

— exactly four cubic segments, four anchors, 26 numbers, `Z` close. All seven shapes are the *same topology* with different control points:

| Type | Shape read | How the control points differ |
|---|---|---|
| 1 | Separate hard lumps | Anchors pulled tight to a ~70px box; control points *inside* the hull, producing four hard concave notches → reads as a knot of pellets |
| 2 | Lumpy sausage | Elongated horizontally to ~150px; alternating shallow concave/convex controls → a bumpy log |
| 3 | Cracked sausage | Same elongation, controls near the hull with two shallow notches → surface fissures |
| 4 | Smooth soft sausage | Fully convex, near-circular control offsets, ~160×58px → the clean ideal |
| 5 | Soft blobs | Shorter, taller, controls splayed outward asymmetrically → separated soft masses |
| 6 | Mushy, ragged | Widened to ~200px, flattened to ~42px, controls pushed far out laterally → spread with ragged edges |
| 7 | Entirely liquid | ~240×26px, controls almost horizontal → a flat pool |

Driven by:
```
const morphedD    = useTransform(p, MORPH_STOPS, BRISTOL_PATHS)
const morphedFill = useTransform(p, MORPH_STOPS, BRISTOL_COLORS)
const MORPH_STOPS = [0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88]
```

#### Scroll-progress breakpoints (authoritative)

| `p` | What happens | Property |
|---|---|---|
| 0.00 → 0.20 | Copy block settles out of the way: `y 0 → -48px`, `opacity 1 → 0` (finishes by 0.20 so it never fights the plate) | transform + opacity |
| 0.02 → 0.14 | Rim ellipses draw in: `pathLength 0 → 1`, `opacity 0 → 1` | `pathLength` |
| 0.06 → 0.16 | Lid swings open: `rotateX(0) → rotateX(-104deg)` | transform string |
| 0.16 → 0.22 | Specimen appears at the top of the frame: `opacity 0 → 1`, `scale 0.86 → 0.92`. **Never from `scale(0)`.** | transform + opacity |
| 0.22 → 0.88 | **The descent.** `translateY(-40px → 560px)`, `rotate(-6deg → 8deg)`, `scale(0.92 → 1)`, `d` morphs across the seven `MORPH_STOPS`, `fill` interpolates across the seven ramp colours | transform + `d` + `fill` |
| 0.22 → 0.88 | Legend rail: active row index = `clamp(floor((p − 0.22) / 0.0943), 0, 6)` | opacity + `clip-path` |
| 0.88 → 0.94 | Contact. Specimen `opacity 1 → 0` over 0.90–0.94. Ripple A `scale 0.4 → 1.6`, `opacity 1 → 0`; ripple B same with a 0.015 lag | transform + opacity |
| 0.94 → 1.00 | Lid closes: `rotateX(-104deg) → rotateX(0deg)`. Plate wrapper `opacity 1 → 0.35`, `filter: blur(0 → 3px)` | transform + opacity + blur |

The terminal blur is capped at 3px and applies to the pinned, fixed-size plate wrapper — never to a scrolling container. That is the one permitted blur outside fixed chrome.

#### Legend rail

`components/landing/BristolLegendRail.tsx`. Seven rows: a mono index (`01`–`07`), the clinical name (`Separate hard lumps` … `Entirely liquid`), and a leader rule.

- Non-active rows: `opacity-[0.28]`.
- Active row: `opacity-100`, and its leader rule draws in with `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` over 320ms on `--ease-out`. A clip-path draw is the right tool here — it is one GPU-friendly property and gives a genuine "line being ruled across the page" feel that a width animation cannot.
- The active index comes from `useMotionValueEvent(p, "change", …)` writing to `useState` **only when the integer index actually changes** — seven state updates across the whole scroll, not one per frame. Do not bind React state directly to `scrollYProgress`.

#### Reduced-motion fallback

`const reduce = useReducedMotion()`. When true:
- The outer section collapses from `h-[320vh]` to `min-h-[100dvh]` — **no scroll-jacking whatsoever**, the page scrolls normally.
- The plate renders as a **static composition**: lid open, rim fully drawn, specimen fixed at Type 4 sitting above the water at its mid-descent position, no ripples.
- The legend rail renders all seven rows at full opacity with all leader rules drawn — it becomes a plain reference list, which is arguably the more useful artefact.
- `useScroll` is still called (hooks cannot be conditional) but none of its derived values are bound to style. Guard by returning static values from a `useTransform` wrapper, not by skipping the hook.
- Copy block, CTAs, and the legend content are identical in both modes. Nothing is only reachable through motion.

#### Mobile

Below `md`: section `h-[220vh]`; the plate scales to `min(88vw, 380px)` and centres; the legend rail moves beneath the plate as a single horizontal mono strip showing only the active type (`04 — Smooth, soft sausage`) with a cross-fade on change; the copy block sits above the plate and fades out by `p = 0.16` instead of 0.20. No rotations or overlaps that would create touch-target conflicts.

#### Performance

Only `transform`, `opacity`, `fill`, `pathLength`, and one small path's `d` ever change. `will-change: transform` is set on the specimen group and the lid wrapper **only** — the two elements that animate continuously — and nowhere else. No `backdrop-blur` in the hero. No `window.addEventListener("scroll")` anywhere in the codebase; scroll reveals use Framer Motion's `whileInView` (IntersectionObserver under the hood) and the hero uses `useScroll`.

---

## C. Landing page, section by section

`app/page.tsx` composes these in order. Every section is an `EditorialSplit` unless noted. Every section entrance uses `Reveal` (fade-up 16px + `blur(6px) → 0`, 700ms, `--ease-out`, `whileInView` with `{ once: true, margin: "-100px" }`). Copy below is final — write it verbatim, it is not placeholder.

### C.1 `FloatingNav` — floating pill navigation

**Purpose:** persistent wayfinding plus the one conversion action, without an edge-to-edge sticky bar glued to the top.

**Structure:** outer `fixed top-0 inset-x-0 z-40 pointer-events-none`; inner `mt-6 mx-auto w-max pointer-events-auto rounded-full bg-[--paper-raised]/80 backdrop-blur-xl ring-1 ring-[--rule] shadow-[--shadow-ambient] pl-5 pr-1.5 py-1.5 flex items-center gap-6`. Backdrop blur is permitted here — fixed chrome, not scrolling content.

**Contents:** wordmark `Maison de Merde` (display serif, `text-small`, `tracking-[-0.01em]`) · links `Le Système` (→ `#systeme`), `Le Cercle` (→ `#cercle`), `Le Journal` (→ `#journal`) · `ArrowCTAButton` labelled **`Entrer`** → `/app/`.

**Motion:**
- Past 40px of scroll the pill tightens: a single `useScroll` + `useTransform` driving `scale(0.98)` and ring opacity. Transform only, no layout change.
- Link hover: the label underline draws with `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`, 160ms `--ease-out`, gated behind `(hover:hover) and (pointer:fine)`.
- Active-section dot in `--sage-600` rendered with `layoutId="nav-dot"` so it springs between links (`duration: 0.4, bounce: 0`). Section tracking via one `IntersectionObserver` over the three anchors — never a scroll listener.

**Mobile (`< md`):** links collapse to a hamburger. The two bars **morph** into an X — `translateY(±4px) → 0` then `rotate(45deg)` / `rotate(-45deg)`, absolutely positioned, 260ms `--ease-drawer`. They never fade out and swap. Opening reveals a full-screen overlay: `fixed inset-0 z-50 bg-[--paper]/92 backdrop-blur-2xl`, links at `text-display` in display serif, each entering `translate-y-12 opacity-0 → translate-y-0 opacity-100` staggered 60ms. Body scroll locked while open; Escape closes; focus trapped.

**Reduced motion:** dot jumps instead of springing; overlay cross-fades with no translate; the hamburger still morphs (rotation is the affordance) but at 160ms.

### C.2 Hero — `ScrollDescentHero`

Full mechanic in §B.9. The copy that sits in it:

- **Eyebrow:** `ÉTABLIE 2026 · PURVEYORS OF FINE DIGESTIVE DISTINCTION`
- **H1** (`text-hero`, Instrument Serif, second line italic):
  > A complete record of the one thing
  > *you have never written down.*
- **Lede** (`text-lede`, `max-w-[46ch]`):
  > Maison de Merde is a longitudinal analytics platform for bowel movements, built on the Bristol Stool Scale. A minimal entry takes under ten seconds. The streak keeps you honest. The export is for your doctor.
- **CTAs:** `ArrowCTAButton` **`Ouvrir le registre`** → `/app/`; secondary ghost link **`Lire la méthodologie`** → `#systeme`.
- **Caption under the plate** (mono, `text-eyebrow`, `--ink-300`): `FIG. 1 — APERTURE, PLAN VIEW · SPECIMEN DESCENDING · BRISTOL TYPES I–VII`

**Mobile collapse:** copy block above the plate, both centred, legend as the single-line strip described in §B.9.

### C.3 `IntroSection` — the "Hey!"-equivalent

**Purpose:** the template's warm first-person introduction becomes the plain-language statement of *what this literally is*, so a visitor who has just scrolled past a morphing specimen knows within three sentences whether it is a joke or a product. It is both, and saying so is the point.

**Component:** `components/landing/IntroSection.tsx`. Editorial Split. Rail: eyebrow `UNE INTRODUCTION`, H2 *"We are entirely serious about this."* Right column: two paragraphs plus a `SpecimenCard`.

**Copy:**
> We built this because *"is this normal for me?"* has no answer without a baseline, and almost nobody has one. Digestive health is universal and unspeakable at the same time, which is a reliable recipe for an information vacuum.
>
> Everything else here — the streaks, the ranks, the medals, the discreet talk of a Gold Circle — exists to solve one problem: a record with gaps in it is not a record. Maison de Merde is a tracking and pattern-recognition instrument. It is not a medical device, it does not diagnose anything, and it will tell you so until you are bored of hearing it.

**`SpecimenCard`:** a `DoubleBezelCard` rendering one plausible session entry as a filing card — mono timestamp, a Bristol swatch chip (`04 · Smooth, soft sausage` on `--bristol-4`), tag pills (`brown`, `typical`, `no straining`), and a hairline-ruled footer reading `ENTRY 0041 · MAISON DE MERDE`. Static, attributed to no one, tilted `-1.5deg` on `md+` and reset to `0deg` below `md`.

**Motion:** paragraphs `Reveal` with 60ms stagger; card enters `translate-y-16 blur-md opacity-0 → 0` over 800ms.

### C.4 `ManifestoStatement` — the quiet statement

**Purpose:** the template's manifesto beat. One centred statement, no card, no split, maximum air — the page's held breath. The section where the deadpan does all the work.

**Component:** `components/landing/ManifestoStatement.tsx`. Full-bleed `py-40 md:py-56`, centred, `max-w-[24ch] mx-auto`, `text-display` display serif, `--ink-900`. A single 80px hairline rule sits above it.

**Copy (H2):**
> Your data is yours. The theatre is ours.

**Sub-statement** (`text-lede`, `--ink-500`, `max-w-[52ch]`):
> Photographs are deleted the moment the model has finished looking at them. Health data is never sold — not as a policy that could be revised, as a constraint the product is built around. Everything we hold can be exported or destroyed on your instruction. The medals and the leaderboard are entertainment, and we would like you to enjoy them.

**Motion:** the statement enters in three word-groups, 80ms stagger, `translate-y-8 opacity-0 blur-[8px] → 0`, 800ms `--ease-out`. The rule above draws with `clip-path` over 600ms. Reduced motion: one opacity fade, rule already drawn.

### C.5 `ServicesList` — the Services-equivalent (row + tags list)

**Purpose:** the template's services list mapped one-to-one onto the app's actual capability set. The page's densest section and the one a sceptical reader actually reads.

**Component:** `components/landing/ServicesList.tsx` + `ServiceRow.tsx`. Anchor `id="systeme"`. Editorial Split with a **sticky rail** (`md:sticky md:top-28`): eyebrow `LES SERVICES`, H2 *"Five instruments."*, lede *"Four of them are boring on purpose. One of them looks at a photograph."*

**Row structure:** hairline-ruled row (`border-t border-[--rule]`, last row also `border-b`), `py-8 md:py-10`, grid `md:grid-cols-12` — mono index `md:col-span-1`; French name + English subtitle `md:col-span-4`; description `md:col-span-5`; tag pills `md:col-span-2`.

**The five rows, verbatim:**

| # | Name | Description | Tags |
|---|---|---|---|
| 01 | **La Saisie** — Structured logging | One tap records a session. Add depth when you want it: seven Bristol types, six clinical colour categories, odour, straining, symptoms, and a note if the moment calls for one. | `BRISTOL I–VII` `UNDER 10s` `DEPTH OPTIONAL` |
| 02 | **Le Rythme** — The streak engine | A day with at least one entry extends the streak. Miss one and a grace token quietly absorbs it. Travelling? Freeze the whole thing in advance, before you need to. | `GRACE TOKENS` `FREEZE` `NO PENALTY` |
| 03 | **Le Cercle** — Private circles | Invite people by name. Ranked on streak and consistency — never on volume, because rewarding volume in this particular domain would be irresponsible. | `OPT-IN` `STREAK & CONSISTENCY` `NO PHOTOS SHARED` |
| 04 | **Le Dossier** — Doctor export | A plain, de-identified summary: totals, Bristol distribution, and every session flagged for blood or severe straining. Written to be handed over, not to be admired. | `DE-IDENTIFIED` `PLAIN TEXT` `YOURS` |
| 05 | **L'Œil** — Assisted visual analysis | Photograph a session and a vision model proposes a Bristol type and a colour. Below its confidence threshold it says nothing at all. You confirm; it never submits on your behalf. | `OPTIONAL` `CONFIDENCE-GATED` `DELETED AFTER INFERENCE` |

Row 02's copy is the earnest README §6.2 position (§0.5). No price, no tier, no Gold Circle anywhere on this page.

**Motion:** on row hover (gated `(hover:hover) and (pointer:fine)`) the row's left leader rule extends via `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` over 200ms, the index numeral shifts to `--sage-600`, and the row translates `translate-x-[6px]`. No background fill, no shadow. Rows `Reveal` with 60ms stagger. Below `md` each row stacks vertically (index + name, description, tags) with no hover state.

### C.6 `SubsystemGrid` — the Featured-Projects-equivalent

**Purpose:** the template's project bento becomes the four subsystems from README §5, each presented as a specimen with a small live-looking visual. Where a technical reader sees there is an actual system underneath.

**Component:** `components/landing/SubsystemGrid.tsx` + `SubsystemCard.tsx`. Editorial Split; rail carries eyebrow `LES QUATRE SYSTÈMES`, H2 *"Four services, one ledger."*, lede *"The vision model is deliberately kept out of the critical path. A ten-second log must never wait on inference."* Right column: `grid grid-cols-1 md:grid-cols-2 gap-4`, with card 01 spanning `md:row-span-2` so the grid is asymmetric rather than a tidy 2×2.

Each card is a `DoubleBezelCard` containing a mono index, title, one-line description, and a **mini-visual** built from the same primitives the app uses.

| # | Title | Description | Mini-visual |
|---|---|---|---|
| 01 | Logging Service | CRUD and sync. The only part of the system permitted to be boring. | Four stacked hairline session rows with mono timestamps and Bristol swatches; the top row enters on view |
| 02 | Streak & Rewards Engine | A per-user state machine. Increments on any day with an entry; consumes a grace token instead of resetting. | A hairline ring at 62% with a `Flame` glyph and the numeral `14` in display serif |
| 03 | Social / Leaderboard Service | Ranks a circle on streak and consistency. Aggregate figures only — the details never leave your account. | Three leaderboard rows with mono ranks and streak figures; names replaced by hairline redaction bars |
| 04 | Vision Analysis Service | Asynchronous and queued. Withholds its answer entirely below 0.4 confidence. | A horizontal confidence gauge with a marked threshold at 0.40 and a needle resting just below it |

**Motion:** cards `Reveal` staggered 70ms. Hover (`(hover:hover)`): shell lifts `translate-y-[-4px]`, ambient shadow deepens, the mini-visual's accent element shifts to `--sage-600`; 260ms `--ease-out`. **Mobile: single column, no `row-span`, no lift, no rotation.**

### C.7 `FoundationsWall` — the Testimonials-equivalent

**Purpose, and the justification for replacing it outright:** the template calls for a testimonial/logo wall. This product has not launched and has no users, so literal testimonials would have to be **fabricated quotes attributed to fabricated people** — dishonest, explicitly out of scope, and off-voice besides. The README's register is *citational*, not testimonial: it cites Lewis & Heaton, it cites loss aversion, it lists prior art. So the social-proof beat becomes a **works-cited wall plus a commitments wall** — the intellectual credentials the product actually rests on and the promises it actually makes. It occupies the same structural slot (a wide band of small repeated cards; a "here is why you should believe this" moment), it is funnier because it treats a bowel-movement tracker as a paper with a bibliography, and every word of it is true.

**Component:** `components/landing/FoundationsWall.tsx` + `CitationCard.tsx` + `CommitmentRow.tsx`. Put the `id="cercle"` anchor on this section's wrapper.

**Row 1 — Citations** (two `CitationCard`s; render *only* these two, both real):
- **Lewis, S. J. & Heaton, K. W. (1997).** *Stool Form Scale as a Useful Guide to Intestinal Transit Time.* Scandinavian Journal of Gastroenterology, 32(9), 920–924. — Gloss: *"The seven types. We adopted them rather than inventing our own, for the obvious reason."*
- **Kahneman, D. & Tversky, A. (1979).** *Prospect Theory: An Analysis of Decision under Risk.* Econometrica, 47(2), 263–291. — Gloss: *"Loss aversion. Why an unbroken streak is harder to abandon than a new one is to begin."*

**Do not invent a third citation.** If more visual weight is needed, widen the two cards. A fabricated reference is the same failure mode as a fabricated testimonial.

**Row 2 — Prior art** (three plain hairline-ruled text cells, deliberately *not* formatted as citations so they cannot be mistaken for references): `Streak mechanics in habit-formation apps` · `Opt-in leaderboards in social fitness` · `Photo-in, structured-data-out consumer health tools`. Each with a one-line note on what was borrowed.

**Row 3 — Commitments** (four `CommitmentRow`s, hairline-ruled, mono label + serif statement, drawn from README §8):
- `PHOTOGRAPHS` — Deleted after inference. Retained only if you explicitly ask.
- `HEALTH DATA` — Never sold. Not a policy that could be revised — a constraint.
- `PORTABILITY` — Export everything, or destroy everything, at any time.
- `SCOPE` — Not a medical device. Not a diagnosis. Flags point you at a doctor, never at a conclusion.

**Motion:** citation cards `Reveal` staggered 80ms; commitment rows draw their hairline rules with `clip-path` on entry, staggered 60ms. **No marquee** — a marquee would undercut the stillness this section needs.

### C.8 `JournalTeaserGrid` — the Thoughts/blog-equivalent

**Decision: keep and repurpose, do not cut.** A health-adjacent app that gamifies a bodily function has three questions it must answer in public before anyone will trust it: how the streak works, why this taxonomy, and what happens to the photograph. A decorative blog would be filler; these three entries are load-bearing trust content the product owes its users, and they double as the sincere half of the satire (§0.5). Three entries, all written. No "coming soon", no fourth placeholder card.

**Component:** `components/landing/JournalTeaserGrid.tsx` + `JournalCard.tsx`. Anchor `id="journal"`. Editorial Split; rail: eyebrow `LE JOURNAL`, H2 *"Three things worth reading before you start."* Right column: `grid grid-cols-1 md:grid-cols-3 gap-4`.

| Slug | Title | Standfirst | Kicker |
|---|---|---|---|
| `/journal/streak-engine/` | How the streak actually works | Grace tokens, freezes, and why a missed Tuesday is not a moral failure. | `MÉTHODOLOGIE` |
| `/journal/bristol-scale/` | Why we did not invent our own scale | A clinically validated seven-point taxonomy already exists. Using it was the entire decision. | `TAXONOMIE` |
| `/journal/photographs/` | What happens to your photograph | It goes to a model once, the model answers, and then it is gone. Unless you say otherwise. | `CONFIDENTIALITÉ` |

Each card: mono kicker, serif title, standfirst, and a `Read →` affordance whose arrow translates `translate-x-1` on hover.

**The three article pages** (`app/journal/*/page.tsx`) are static server components on a shared reading layout: `max-w-[62ch] mx-auto`, serif H1, Geist Sans body at `text-lede`, a mono metadata line, hairline rules between sections, a back-link to `/#journal`, and the `FooterWordmark`. Each is 500–800 words in README voice. **Three separate concrete route files, not a `[slug]` dynamic route** — dynamic routes under `output: "export"` require `generateStaticParams`, and three files is less machinery than one file plus a params generator.

Content briefs (full prose written in T13):
- **streak-engine** — the state machine, the ≥1-entry-per-day rule, grace tokens (one per 14-day milestone, capped at 3, per `maybeGrantGraceToken` in `server/src/streak.js`), the freeze, and an explicit paragraph acknowledging that streak anxiety is a known failure mode of this design and that grace tokens are a mitigation rather than a guarantee (README §10). Mirror §6.2's *"disclosed clearly rather than hidden as a monetized feature"* sincerely — this is precisely what the in-app paywall later betrays.
- **bristol-scale** — all seven types with clinical descriptions, why 3–4 is the normal band, why a validated scale beats a bespoke one for both credibility and doctor-legibility, and a note that a type is a description, not a verdict.
- **photographs** — the pipeline from README §6.5 and `server/src/vision.js`: client-side compression, a single inference call, the 0.40 confidence gate, human-in-the-loop correction, and the default-delete policy. State plainly that the image is held in memory and forwarded once, never written to disk unless the user ticks *keep*.

### C.9 `EnterPanel` — the Contact-equivalent

**Purpose:** the template's contact form has no counterpart here — there is no inbox and no sales motion. It becomes the **conversion panel into the real signup flow**, which is the honest version of the same beat: one field, one button, straight into the product.

**Component:** `components/landing/EnterPanel.tsx`. Full-width band, centred, a single wide `DoubleBezelCard`.

**Copy:** eyebrow `ENTREZ` · H2 (`text-display`, serif) *"There is no waiting list."* · lede *"Choose a name. The ledger opens immediately."*

**Form:** one `TextInput` (label `Nom d'utilisateur`, mono input text, `placeholder="3–24 characters"`), validated client-side against the server's exact rule `/^[a-zA-Z0-9_]{3,24}$/` (from `server/src/auth.js` `validateSignupInput`), with an inline hairline error, plus an `ArrowCTAButton` labelled **`Ouvrir le registre`**.

**Behaviour:** submit does **not** call the API. It routes to `/app/?intent=signup&username=<encodeURIComponent(value)>`. `AppShell` reads those params (inside `<Suspense>`, §G) and opens the auth panel on the **Sign Up** tab with the username prefilled and focus moved to the email field. If validation fails, no navigation; the error renders inline.

**Fine print beneath, mono, `--ink-300`** — the only Gold Circle seed on the whole landing page:
> Free. No card. The Gold Circle will find you on its own.

**Motion:** the card enters `translate-y-16 blur-md opacity-0 → 0` at 800ms. Input focus raises a hairline `ring-[--sage-500]` over 160ms — a ring transition, never a border-width change. The button shows a `Loader2` spin only during the route transition.

### C.10 `FooterWordmark`

**Purpose:** the template's giant background wordmark, plus the legal and navigational floor.

**Component:** `components/ui/FooterWordmark.tsx` (shared with the journal pages).

**Structure:** `relative overflow-hidden pt-24 pb-0`. Three link columns above — `LE SYSTÈME` (Les Services / Les Quatre Systèmes / Le Cercle) · `LE JOURNAL` (the three article links) · `LA MAISON` (Entrer / Méthodologie → the repo README / Confidentialité → `/journal/photographs/`) — then a hairline rule, then the disclaimer, then the wordmark.

**The wordmark:** `MAISON DE MERDE` in Instrument Serif at `text-[clamp(3rem,15vw,13rem)]`, `leading-[0.8]`, colour `--ink-900` at 7% opacity, `select-none pointer-events-none whitespace-nowrap`, translated down so its lower third is clipped by the page edge (`translate-y-[18%]`). It is background texture, not a heading — never an `<h*>`, always `aria-hidden`.

**Disclaimer line** (mono, `text-eyebrow`, `--ink-300`):
> MAISON DE MERDE IS A TRACKING AND PATTERN-RECOGNITION TOOL. IT IS NOT A MEDICAL DEVICE AND DOES NOT DIAGNOSE ANY CONDITION. · ÉTABLIE 2026 · PURVEYORS OF FINE DIGESTIVE DISTINCTION

**Motion:** the wordmark drifts `translateY(24px → 0)` across its own `useScroll` range as the footer enters — parallax on transform only. Reduced motion: static. **Mobile:** columns stack; wordmark drops to `text-[clamp(2.25rem,18vw,5rem)]` and may wrap to two lines at `leading-[0.85]`.

---

## D. In-app page redesigns

All of these live under `/app/` (a single route, four tabs — §A.6) and share the design system from §B. The governing shift from the current build: **every panel becomes a `DoubleBezelCard`**, every gold ornament is deleted, every emoji is replaced by a thin Lucide glyph or a serif numeral, and the ambient sparkle layer and card-tilt handler are removed outright (a document-level `pointermove` listener writing inline transforms on every card is a per-move style thrash and has no place here).

### D.0 Shell — `AppShell`, `TopBar`, `TabRail`

`components/app/AppShell.tsx` (client). Responsibilities: run the auth gate, hold `user`, hold the active tab, own the toast and modal portals.

- **Auth gate:** on mount, `GET /api/auth/me`. Three states — `checking` renders a centred `SkeletonBlock` plate (no spinner flash under 200ms: render nothing for the first 200ms, then the skeleton); `anon` renders `AuthPanel`; `authed` renders the shell.
- **Deep-link params:** `?tab=` and `?intent=signup&username=` read once on mount via `useSearchParams()` **inside a `<Suspense fallback={null}>` boundary** (§G). Tab also mirrored to `sessionStorage` under `mdm_tab`.
- **`TopBar`:** left — wordmark in display serif with a hairline `Établie 2026` sub-line on `md+`; centre — `TabRail`; right — `StreakPill` and a ghost `Se déconnecter` button. Sticky: `sticky top-0 z-30 bg-[--paper]/85 backdrop-blur-xl border-b border-[--rule]` (fixed chrome, blur allowed).
- **`TabRail`:** four items — `Journal` (log), `Analyse` (dashboard), `Cercle` (circle), `Distinctions` (achievements), each with its English subtitle as a `title` attribute. The active indicator is a hairline bar beneath the label with `layoutId="tab-indicator"`, spring `{ duration: 0.4, bounce: 0 }`. **The panels themselves do not animate on tab switch** — no cross-fade, no slide. Tab switching happens tens of times per session; per the animation decision framework, that class of action must be instant. Only the 180ms indicator moves.
- **Mobile:** `TabRail` becomes a bottom bar, `fixed bottom-0 inset-x-0 z-30`, four equal cells with a 16px Lucide glyph above an 10px mono label, `pb-[env(safe-area-inset-bottom)]`. `TopBar` keeps the wordmark and `StreakPill` only; logout moves into a small overflow menu.
- **Data:** `hooks/useDashboard.ts` fetches `GET /api/dashboard` once and exposes `{ data, loading, error, refresh }` through a context, so the streak pill, dashboard tab, and achievements tab share **one** request instead of the current three separate `/dashboard` calls.

### D.1 Auth screen — `AuthPanel`

**Files:** `components/app/AuthPanel.tsx`.

**What changes:** the ornate gold auth card with the 💩 medallion is replaced by a **full-height Editorial Split**. Left half (`md:col-span-6`), on `--paper`: the wordmark, the `ÉTABLIE 2026 · PURVEYORS OF FINE DIGESTIVE DISTINCTION` eyebrow, a `text-display` serif line — *"The ledger is open."* — and, at the bottom, the same non-diagnostic disclaimer from the footer in mono at `text-eyebrow`. Right half: one `DoubleBezelCard` holding the form. Below `md` the left half collapses to a compact header above the card.

**Tabs:** `Se connecter` / `Créer un compte` as a two-item segmented control inside a `--paper-sunk` well; the active pill is a `--paper-raised` block with `layoutId="auth-tab"`, spring `{ duration: 0.4, bounce: 0 }`. Switching **cross-fades the two forms** (opacity + `translateY(6px)`, 200ms `--ease-out`) rather than toggling `hidden`, and the card's height animates with `layout` on the same spring — a raw height jump between a 2-field and a 3-field form is the single most visible flaw in the current screen.

**Fields:** `TextInput` primitives — login: `Nom d'utilisateur ou email` + `Mot de passe`. Signup: `Nom d'utilisateur`, `Email`, `Mot de passe`. Client-side validation mirrors `validateSignupInput` exactly (username `/^[a-zA-Z0-9_]{3,24}$/`, email regex, password ≥ 8) with inline hairline errors; the server's message still wins when a request fails.

**Prefill:** when `?intent=signup&username=` is present, open on the signup tab, prefill the username, focus the email field.

**Interaction detail:** the submit button shows an inline `Loader2` at `strokeWidth={1.25}` spinning on a 700ms linear rotation. A *fast* spinner makes the request feel faster than the identical request behind a slow one — this is the one place `linear` is correct. Server errors render in a claret-ringed strip that enters with `translateY(-4px) → 0` + opacity over 200ms, using a transition, not a keyframe, so rapid retries retarget cleanly.

**Reduced motion:** tab pill jumps, forms cross-fade on opacity only, card height snaps.

### D.2 Log tab — `LogPanel`

**Files:** `components/app/LogPanel.tsx`, `QuickLogCard.tsx`, `DetailLogForm.tsx`, `BristolPicker.tsx`, `SymptomChips.tsx`, `PhotoField.tsx`, `AiSuggestionNote.tsx`, `SessionList.tsx`, `SessionRow.tsx`, `StampMark.tsx`.

**Structure:** two-column on `md+` — left `md:col-span-7` (quick log + detail form), right `md:col-span-5` (recent sessions, `md:sticky md:top-28`). Single column below `md`.

**`QuickLogCard`:** `DoubleBezelCard`. Eyebrow `SAISIE RAPIDE`, serif title *"Log a session."*, one line of body — *"One tap records it now. Details can follow, or not."* Primary `PressButton` (sage fill, `text-small`, full-width on mobile) labelled **`Enregistrer maintenant`**; secondary ghost **`Ajouter les détails`** toggles the detail form. The emoji is gone from both labels.

**Reveal of the detail form:** currently a `hidden` class toggle. Replace with a Framer Motion `AnimatePresence` + `layout` height animation, `{ duration: 0.4, bounce: 0 }` spring, content fading in at `opacity 0 → 1` with a 60ms delay so the container has started opening first. Exit is faster (200ms).

**`BristolPicker` — the seven-option selector.** This is the app's signature control and gets the most attention:
- Seven cells in a `--paper-sunk` well, `grid grid-cols-7` on `md+`, `grid-cols-4` (4 + 3) below `sm`, each a `role="radio"` button inside a `role="radiogroup"`.
- Each cell: a **mini silhouette** rendered from `BRISTOL_PATHS[i]` (the exact same path constants the hero uses — one source of truth), filled with `BRISTOL_COLORS[i]`, above a serif numeral and a mono two-word label.
- Selected state: the cell's own inner core lifts to `--paper-raised`, a hairline `ring-[--sage-600]` appears, and a **shared `layoutId="bristol-selection"` block springs** between cells (`{ duration: 0.4, bounce: 0 }`) so the selection physically travels rather than blinking. That interruptible spring is exactly the case springs exist for: users scrub across the seven options, and a spring retains velocity where a keyframe would restart.
- Press: `active:scale-[0.97]`, 140ms.
- Hover (gated): silhouette `scale(1.04)`, 160ms `--ease-out`.
- Full keyboard support: arrow keys move selection within the group, `Home`/`End` jump to 1/7. **Keyboard-driven selection changes skip the spring** and update instantly — keyboard actions get no animation.
- Selecting is optional; nothing is preselected, matching the API (`bristolType: null` is valid).

**Colour / odour / pain:** three `SelectField`s in a `md:grid-cols-3` row. Options and values come from `lib/enums.ts` (§0.3) — never inline literals. Colour options render a small filled circle swatch beside each label. Labels: `Couleur` / `Odeur` / `Douleur ou effort`. Option display text stays English-clinical (`Brown (typical)`, `Milder than usual`, `Moderate`, …) exactly as today; only the values are contractual.

**Flags:** two `Checkbox` controls — `Visible undigested food` and `Blood present`. The blood checkbox, when ticked, turns its row's hairline to `--claret-200` and reveals a mono note: *"Flagged sessions appear in your doctor export."* Revealed with `AnimatePresence` height + opacity, 200ms.

**`SymptomChips`:** four toggle chips (`bloating`, `urgency`, `incomplete`, `cramping`) with display labels `Bloating`, `Urgency`, `Incomplete evacuation`, `Cramping`. Chip toggle is a 160ms transition on `background-color` and `ring-color` only (a transition, not a keyframe — chips get toggled rapidly). Selected chips fill `--sage-100` with a `--sage-600` hairline and show a 14px `Check`. Client caps selection at 10 to match the server slice, though four chips make that theoretical.

**`PhotoField`:** file input styled as a bezelled drop well with a `Camera` glyph, label `Photographie (optionnelle)` and the honest sub-line kept from today: *"Sent once for analysis. Not stored unless you tick keep."* On selection: preview thumbnail enters at `scale(0.96) opacity-0 → 1`, 260ms; `AiSuggestionNote` shows a shimmering `SkeletonRow` while `POST /api/vision/analyze` is in flight.
- `withheld: true` → *"The model was not confident enough to call this one. Please set the fields yourself."* in `--ink-500`, no prefill.
- Otherwise → mono confidence figure, the guesses in prose, and the mandatory framing sentence kept verbatim in substance: *"This is a pattern-recognition aid, not a diagnosis. Please confirm or correct the fields above."*
- Prefills `color`, `bristolType` (which triggers the `BristolPicker` selection spring — a nice moment where the form fills itself in), and ticks `visibleFood`. It **never** submits.
- `503` → surface the server's "photo analysis isn't configured" message as-is; do not disguise it as a generic failure.
- `keepPhoto` checkbox defaults off, sub-labelled *"off by default"*.

**Submit:** builds the camelCase body per §0.3, `POST /api/sessions`. On success: reset, collapse the form, refresh the session list and the shared dashboard, fire `StampMark` on the new row, and pass `newlyUnlocked` to the celebration queue.

**`SessionList` / `SessionRow`:** `DoubleBezelCard padding="none"` with hairline-separated rows. Each row: mono timestamp (`12 Aug · 14:20`), a Bristol swatch + `Type 4` chip or a `quick log` chip, colour chip, and a claret `blood flagged` chip where set. Reads `occurred_at`, `bristol_type`, `blood_flag` — **snake_case** (§0.3). Loading renders three `SkeletonRow`s; empty renders `EmptyState` with the copy *"Nothing recorded yet. The first entry is the hard one."* New rows enter with a 60ms stagger, `translateY(8px) opacity-0 → 0`, 300ms.

**`StampMark` — replaces the confetti-on-every-log.** A letterpress-style impression reading `ENREGISTRÉ` in mono at `text-eyebrow` inside a hairline oval, absolutely positioned over the newest session row, rotated `-8deg`. Enters `scale(1.55) opacity-0 → scale(1) opacity-1` over 260ms `--ease-out`, holds 900ms, fades over 200ms. Rationale: logging is a **daily** action. Firing 50 confetti particles across the whole viewport every single time is exactly the animation the frequency table says to remove; a quiet stamp is the correct weight for a routine confirmation, and it is also spatially anchored to the thing that changed. Confetti is reserved for achievement unlocks only (§D.6).

### D.3 Dashboard tab — `DashboardPanel`

**Files:** `components/app/DashboardPanel.tsx`, `StatTriad.tsx`, `GoldCircleActions.tsx`, `FreezeDialog.tsx`, `ConsistencyHeatmap.tsx`, `BristolDistribution.tsx`, `DoctorExportCard.tsx`.

**Layout:** asymmetric grid inside the content column — `StatTriad` full width, then `ConsistencyHeatmap` (`md:col-span-8`) beside `BristolDistribution` (`md:col-span-4`)… inverted, actually: the heatmap is wide (13 weeks × 7 rows), so heatmap `md:col-span-8`, distribution `md:col-span-4` stacked over `DoctorExportCard`. Single column below `md`.

**`StatTriad`:** one `DoubleBezelCard` with three hairline-divided cells — `Série en cours` / `Record` / `Jetons de grâce`, each a `text-numeral` display-serif figure with `tabular-nums` over a mono label. Figures **count up** on first render: 500ms, cubic ease-out, via `requestAnimationFrame` writing `textContent` (not React state per frame). Subsequent refreshes animate only if the value changed. A value of 0 renders instantly with no count-up — counting up to zero is absurd.

**`GoldCircleActions` — the satirical gate, restyled not removed (§0.5).** Two `PressButton secondary` controls sitting in a `--paper-sunk` well beneath the stats, hairline-separated from them:
- **`Geler la série` — Freeze streak**, and **`Récupérer un jour manqué` — Recover a missed day.**
- Each carries a small `Lock` glyph (16px, `strokeWidth={1.25}`) and a mono `GOLD` tag pill in `--ink-900`/`--paper` — **the only near-black-on-cream inversion in the app**, so it reads as an intrusion into an otherwise honest interface. No crowns, no gold gradient, no 👑.
- Above them, a mono line in `--ink-300`: `RÉSERVÉ AUX MEMBRES DU CERCLE D'OR`.
- Clicking either calls `gateWithPaywall(reason, action)` from `hooks/usePremium.ts` — unchanged behaviour: if the `maison_de_merde_premium_v1` localStorage flag is set, run the action; otherwise open `GoldCirclePaywall` with the pending action queued.
- **Freeze** replaces the current `window.prompt()` — `prompt()` is blocked in sandboxed contexts, is unstyleable, and is the single ugliest interaction in the app. It becomes `FreezeDialog`: a `Modal` with four preset `PressButton`s (3 / 7 / 14 / 30 days) and a numeric field for a custom value, clamped 1–60 to match the server, then `POST /api/dashboard/freeze { days }`. On success, a toast and a refresh; the frozen state renders as a `Snowflake` glyph plus `Gelée jusqu'au <date>` beside the current-streak figure.
- **Recover a missed day** has no backend endpoint and must stay cosmetic and honestly labelled, exactly as today — a toast reading *"A member of our staff has been dispatched to discreetly recover your missed day."* No API call, no fake state change.

**`ConsistencyHeatmap`:** replaces the div-grid. Rendered as **SVG** — 13 columns × 7 rows of `rect`s with `rx=3`, gap 3px, `viewBox` sized to the data so it scales without media queries. Levels 0–3 map to `--paper-deep`, `--sage-200`, `--sage-500`, `--sage-700` (a sequential ramp, correctly single-hue — this is count data with no meaningful midpoint, unlike the Bristol scale). Level thresholds keep the existing per-user normalisation (`count / maxCount` at 0.33 / 0.66). Bucketing into weeks by `getUTCDay()` is ported verbatim from `renderHeatmap()` — it is correct and the API contract depends on it. Each cell carries `<title>` for the native tooltip plus `aria-label`. Cells fade in with a 6ms-per-cell stagger capped at a 400ms total, opacity only. Below `md` the SVG scrolls horizontally inside an `overflow-x-auto` well with the day-of-week rail sticky-left. Legend: `Moins` · four swatches · `Plus`.

**`BristolDistribution`:** replaces the `<canvas>` (which drew a hardcoded `#4fae72` and 11px `sans-serif`, both off-system now). **SVG horizontal bars**, seven rows: serif numeral, mini silhouette from `BRISTOL_PATHS[i]`, the bar filled with `BRISTOL_COLORS[i]`, and a mono count at the end. Horizontal beats vertical here — the labels are seven words, not seven numbers, and horizontal bars give them room. Bars animate their `transform: scaleX(0 → 1)` with `transform-origin: left`, 600ms `--ease-out`, staggered 40ms, `whileInView` once. All-zero state renders the seven rows at zero width with the `EmptyState` line *"No typed entries yet."* Types 3 and 4 carry a hairline `--sage-600` bracket labelled `TYPICAL RANGE` — a real clinical fact and the section's one editorial flourish.

**`DoctorExportCard`:** `DoubleBezelCard` with a `FileText` glyph, serif title *"Doctor export."*, body *"Totals, Bristol distribution, and every session flagged for blood or severe straining. De-identified by default."*, and an `ArrowCTAButton` with a `Download` icon labelled **`Exporter le résumé (.txt)`**. It must be a **plain `<a href="/api/dashboard/export" download>`**, not a fetch — §0.4. Beneath it, mono: *"Written to be handed over, not to be admired."*

### D.4 Circle tab — `CirclePanel`

**Files:** `components/app/CirclePanel.tsx`, `AddFriendField.tsx`, `FriendRequestRow.tsx`, `LeaderboardRow.tsx`.

**Layout:** Editorial Split. Rail: eyebrow `LE CERCLE`, serif H2 *"Ranked on consistency."*, lede *"Never on volume. Rewarding volume here would be irresponsible."* — the README §7 guardrail stated in the product, not just the paper. Content: `AddFriendField`, then pending requests, then the leaderboard.

**`AddFriendField`:** a bezelled inline group — `TextInput` (`Ajouter par nom d'utilisateur`, mono) plus a `PressButton primary` with a `UserPlus` glyph. `POST /api/circle/friends`. Distinct handling per status: `404` → inline *"No account with that name."*; `400` → *"You cannot add yourself."*; success → the field clears and a toast confirms. Errors render inline beneath the field, not as a toast — the error belongs next to the input that caused it.

**`FriendRequestRow`:** only rendered when `requests.length > 0`; the entire block is absent otherwise (no empty header). Each row: `Users` glyph, `<name> souhaite rejoindre votre cercle`, and an `Accepter` button → `POST /api/circle/requests/:userId/accept`. **Note the id source:** `GET /api/circle/requests` returns `{ id, username }` where `id` is the *requesting user's* id — that is the value the accept path takes. Accepted rows exit with a height+opacity collapse (200ms) before the list refetches, so the row does not vanish mid-frame.

**`LeaderboardRow`:** hairline-separated rows inside one `DoubleBezelCard padding="none"`.
- Rank: display-serif numeral, `--ink-300` for 4th and below, `--ink-900` for the top three.
- Avatar: **no emoji** — a 32px circle in `--paper-sunk` with a hairline ring containing the user's first initial in mono. The current user's circle is filled `--sage-100` with a `--sage-600` ring.
- Name, with a mono `(vous)` suffix for the current user; the whole row for the current user gets a `--sage-100/40` inner-core tint and a left hairline in `--sage-600`.
- Stats, mono: `<streak>j · <consistency>% de régularité`, using `Math.round(consistency * 100)`.
- A hairline consistency bar beneath each name, `scaleX` to the consistency ratio, `transform-origin: left`, animating in over 600ms staggered 50ms.
- Rows enter staggered 50ms. When the list reorders after a refresh, rows use `layout` with `{ duration: 0.4, bounce: 0 }` so ranks visibly swap rather than snapping.
- Solo state (leaderboard length 1): `EmptyState` beneath the single row — *"A circle of one is still a circle. Add someone by name above."*

### D.5 Achievements tab — `AchievementsPanel`

**Files:** `components/app/AchievementsPanel.tsx`, `BadgeGrid.tsx`, `BadgeMedal.tsx`, `lib/badgeIcons.ts`.

**Data:** reuses the shared `useDashboard()` result — `badges: [{ id, icon, name, desc, unlocked }]`. **No second `/api/dashboard` request.**

**`lib/badgeIcons.ts`** maps each of the nine fixed badge ids (§0.4) to `{ icon: LucideName, numeral: string }`, replacing the server emoji entirely:

| id | Icon | Numeral |
|---|---|---|
| `milestone_first` | `CircleDot` | `I` |
| `streak_7` | `Flame` | `VII` |
| `streak_30` | `Flame` | `XXX` |
| `streak_100` | `Flame` | `C` |
| `streak_365` | `Award` | `CCCLXV` |
| `completeness_10` | `FileText` | `X` |
| `completeness_50` | `FileText` | `L` |
| `milestone_100_sessions` | `TrendingUp` | `C` |
| `milestone_first_photo` | `Camera` | `I` |

Roman numerals in display serif — the medal-plate joke, and the one place the academic-monograph register is allowed to be openly funny. Unknown ids fall back to `Circle` plus the server's emoji rendered `aria-hidden` beside the accessible name, so a future backend badge degrades rather than crashes.

**`BadgeMedal`:** a `DoubleBezelCard size="sm"` per badge in a `grid grid-cols-2 md:grid-cols-3 gap-4`.
- **Unlocked:** inner core `--paper-raised`, hairline `ring-[--sage-600]/40`, icon at 28px `strokeWidth={1}` in `--sage-700`, numeral in display serif, name in serif, description in `--ink-500`, and a mono `OBTENUE` line with the hairline rule above it.
- **Locked:** inner core `--paper-sunk`, everything at `opacity-40`, icon swapped for `Lock`, and the description still fully legible — a locked achievement must state what earns it, or the grid is decoration.
- No wax seals, no stamps, no gold. The distinction between states is *material* (raised vs sunk, full vs faded), not ornamental.

**Motion:** medals `Reveal` with a 50ms stagger, `whileInView once`. Hover on unlocked medals (gated): `translate-y-[-3px]` and the icon `scale(1.06)`, 260ms `--ease-out`. Locked medals have no hover state — a hover response on a disabled thing is a lie.

**Header:** eyebrow `LES DISTINCTIONS`, serif H2 *"Nine distinctions."*, and a mono progress line `<n> SUR 9 OBTENUES` with a hairline progress rule animating `scaleX` on mount.

### D.6 Gold Circle paywall + celebration overlay

**Files:** `components/app/GoldCirclePaywall.tsx`, `components/app/CelebrationModal.tsx`, `components/app/PaperFlecks.tsx`, `components/ui/Modal.tsx`, `hooks/usePremium.ts`.

#### `Modal` (shared primitive)
Backdrop `fixed inset-0 z-50 bg-[--ink-900]/25 backdrop-blur-sm` (fixed → blur permitted). Panel is a `DoubleBezelCard`, `max-w-[440px]`, centred. Enter: `opacity 0 → 1`, `scale(0.96) → 1`, 260ms `--ease-drawer`. Exit: 180ms — **exits are faster than entrances**. **`transform-origin: center`, deliberately** — modals are the documented exception to the origin-aware rule because they are not anchored to a trigger. Escape closes, backdrop click closes, focus is trapped, focus returns to the trigger on close, `aria-modal` + `role="dialog"` + a labelled title. Body scroll locked while open.

#### `GoldCirclePaywall`
The joke survives intact; only the styling changes. Content, in order:
- Close button (`X`, 16px) top-right.
- A hairline-ruled crest block: no 👑 — a `Crown` Lucide glyph at 32px `strokeWidth={1}` in `--ink-900`, inside a hairline circle. Restraint makes it funnier.
- Serif H2 **`Le Cercle d'Or`**; sub-line = the caller's `reason` string (*"Streak Freeze is a privilege of the Gold Circle."* / *"Missed-Day Recovery is a privilege of the Gold Circle."*).
- **Tier selector:** two options in a `--paper-sunk` well — `Mensuel $4.99/mo` and `Annuel $39.99/yr` with a mono `MEILLEURE VALEUR` tag; annual preselected. Selection moves via a shared `layoutId="tier-selection"` spring.
- **Perks list**, three hairline-ruled rows, copy retained from today: *"Unlimited streak freezes, for the travelling connoisseur"* · *"Missed-day recovery, discreetly arranged"* · *"A mark beside your name, so the Circle knows."* (third line reworded off "gold medallion" since there is no gold left).
- **Card fields** — number (auto-spaced in groups of four, 16 digits), expiry (`MM / YY`), CVC — all `inputMode="numeric"`, all decorative. Formatting handlers ported verbatim from the current `app.js`.
- **Submit:** `Rejoindre le Cercle d'Or — $39.99/yr`. On submit: label swaps to a spinning `Loader2` for 1400ms, then the button fills `--sage-700` and the label **cross-fades through a 2px blur** to `Bienvenue au Cercle d'Or` — blur-masked crossfade, because without it you see two texts overlapping and it looks broken. 1100ms later the modal closes and the queued action runs.
- **Fine print retained verbatim in substance and never softened:** *"This is a demo paywall for a satirical app — no card is real, no payment is processed, and nothing is charged. Any details entered here go nowhere."* Rendered in mono at `text-eyebrow`, `--ink-500` — legible, not hidden. The satire must never become an actual deception.
- On success `setPremium()` writes `maison_de_merde_premium_v1 = "1"` and the `TopBar` reveals a small mono `MEMBRE` tag beside the wordmark (replacing today's `👑 Gold Member`).

#### `CelebrationModal` + `PaperFlecks` — replacing the canvas confetti
The existing implementation is a full-viewport `<canvas>` fixed over the page, which already caused a blank-page regression (commit `13bb068`). It is deleted, not ported.

- `CelebrationModal` uses the shared `Modal`, queued exactly as today so simultaneous unlocks show one at a time (`queueCelebration` / `showNextCelebration` logic ported to a small reducer in `AppShell`).
- Content: the badge's Lucide glyph at 40px `strokeWidth={1}`, its Roman numeral, serif `<name> obtenue`, the description, and a `PressButton` **`Bien.`**
- **`PaperFlecks`:** ~26 absolutely-positioned 2×6px divs in `--ink-700`, `--sage-600`, `--claret-600`, `--bristol-4` — hairline paper flecks, not party confetti. They live **inside the modal panel's own `relative overflow-hidden` bounds**, `pointer-events-none`, animated with `transform` (translate + rotate) and `opacity` only via Framer Motion, and unmount when the modal closes. Never full-viewport, never a persistent canvas. That is a direct structural fix for the earlier bug class.
- Achievement unlocks are genuinely rare and first-time, which is the one frequency band where delight is unambiguously warranted — this is the only place in the app that celebrates.
- **Reduced motion:** flecks are not rendered at all; the modal cross-fades and the numeral scales from `0.98 → 1`.

---

## E. Component inventory

Every downstream task references these by name rather than re-describing them.

### `components/ui/` — design system
| Component | Responsibility |
|---|---|
| `DoubleBezelCard` | The nested outer-shell/inner-core surface; every panel, well, and modal is built from it (§B.5) |
| `PressButton` | Base button — `primary`/`secondary`/`ghost`/`danger`, always `active:scale-[0.97]` |
| `ArrowCTAButton` | Pill CTA with the nested circular trailing-arrow well (§B.6) |
| `EyebrowTag` | Mono uppercase micro-pill preceding every major heading |
| `SectionHeading` | Eyebrow + serif H2 + optional lede; the left rail of an Editorial Split |
| `EditorialSplit` | The 12-column rail/content layout primitive; collapses to a stack below `md` |
| `Rule` | Hairline divider, optionally drawn in with `clip-path` |
| `Reveal` | Client wrapper adding the `whileInView` fade-up-and-deblur; honours reduced motion |
| `Stagger` | Container that delays child `Reveal`s by a fixed step (default 60ms) |
| `Icon` | The only file importing `lucide-react`; enforces `strokeWidth` 1.25 and the curated set (§B.8) |
| `TextInput` | Labelled text field on the bezel system, with inline error slot |
| `SelectField` | Labelled native `<select>`, restyled, with optional colour swatches |
| `Checkbox` | Labelled checkbox with a hairline box and a `Check` glyph |
| `Chip` | Toggleable tag pill used by symptoms and tag lists |
| `Modal` | Centred dialog primitive — focus trap, Escape, scroll lock, asymmetric enter/exit |
| `Toast` / `ToastProvider` | Bottom-centre transition-based toast, swipe-to-dismiss with a velocity threshold of 0.11 |
| `SkeletonRow` / `SkeletonBlock` | Loading placeholders in `--paper-sunk` with a subtle shimmer |
| `EmptyState` | Hairline-ruled empty message with optional action |
| `GrainOverlay` | Fixed, `pointer-events-none`, 3%-opacity noise; the film-grain layer of the Editorial Luxury vibe |
| `FooterWordmark` | The giant clipped background wordmark plus the footer columns and disclaimer |

### `components/landing/`
| Component | Responsibility |
|---|---|
| `FloatingNav` | Floating glass pill nav, hamburger morph, full-screen staggered mobile overlay |
| `ScrollDescentHero` | The pinned scroll stage: rim, lid, specimen, ripples, copy block (§B.9) |
| `BristolMorphPath` | The single interpolating `<path>` — `d` and `fill` driven by scroll progress |
| `BristolLegendRail` | The seven-row scroll-synced legend with clip-path leader rules |
| `IntroSection` | "Une Introduction" — plain statement of what the product is |
| `SpecimenCard` | The static example session entry rendered as a filing card |
| `ManifestoStatement` | The centred single-statement section |
| `ServicesList` / `ServiceRow` | The five-capability row list with tag pills and hover leader rules |
| `SubsystemGrid` / `SubsystemCard` | The four README §5 services as an asymmetric card grid with mini-visuals |
| `FoundationsWall` / `CitationCard` / `CommitmentRow` | Citations, prior art, and the four privacy commitments |
| `JournalTeaserGrid` / `JournalCard` | Three article teasers linking to the journal routes |
| `EnterPanel` | The username-first CTA that routes into the real signup flow |

### `components/app/`
| Component | Responsibility |
|---|---|
| `AppShell` | Auth gate, user state, tab state, toast/modal/celebration portals |
| `AuthPanel` | Login/signup split screen with an animated segmented control |
| `TopBar` | Sticky app header: wordmark, `TabRail`, `StreakPill`, logout |
| `TabRail` | Four-tab navigation with a `layoutId` indicator; bottom bar on mobile |
| `StreakPill` | Streak figure with count-up, tier styling, and a `Flame`/`Snowflake` glyph |
| `LogPanel` | Log tab composition |
| `QuickLogCard` | One-tap log plus the detail-form toggle |
| `DetailLogForm` | The full structured-analysis form and its submit |
| `BristolPicker` | The seven-option radiogroup with the shared-layout selection spring |
| `SymptomChips` | The four symptom toggles |
| `PhotoField` | File input, preview, and the vision request lifecycle |
| `AiSuggestionNote` | Confidence-gated model output with the non-diagnostic framing |
| `SessionList` / `SessionRow` | Recent sessions with chips, skeletons, and empty state |
| `StampMark` | The `ENREGISTRÉ` impression fired on a successful log |
| `DashboardPanel` | Dashboard tab composition |
| `StatTriad` | Current streak / longest / grace tokens with count-up numerals |
| `GoldCircleActions` | The two paywall-gated buttons and their `GOLD` tags |
| `FreezeDialog` | Preset + custom freeze-duration modal replacing `window.prompt()` |
| `ConsistencyHeatmap` | SVG 13×7 contribution grid with a sequential sage ramp |
| `BristolDistribution` | SVG horizontal bar chart on the diverging Bristol ramp |
| `DoctorExportCard` | Export description and the plain `<a download>` trigger |
| `CirclePanel` | Circle tab composition |
| `AddFriendField` | Username input with per-status inline errors |
| `FriendRequestRow` | Pending incoming request with accept action |
| `LeaderboardRow` | Rank, initial avatar, name, stats, consistency bar, reorder animation |
| `AchievementsPanel` | Achievements tab composition and the progress line |
| `BadgeGrid` / `BadgeMedal` | The nine distinctions in locked/unlocked material states |
| `GoldCirclePaywall` | The satirical Gold Circle modal with tiers, dummy card fields, honest fine print |
| `CelebrationModal` | Queued achievement-unlock celebration |
| `PaperFlecks` | Bounded, in-modal celebratory flecks replacing the viewport canvas confetti |

### `lib/` and `hooks/`
| Module | Responsibility |
|---|---|
| `lib/api.ts` | `apiFetch<T>()` — `credentials: "include"`, JSON vs `FormData`, throws `ApiError` carrying `.status` |
| `lib/types.ts` | Types for every response in §0.4, including the snake_case session row shape |
| `lib/enums.ts` | The exact colour/odour/pain/symptom constants from §0.3, with display labels |
| `lib/bristol.ts` | `BRISTOL_LABELS`, `BRISTOL_COLORS`, `BRISTOL_PATHS` — one source of truth for hero, picker, and chart |
| `lib/badgeIcons.ts` | Badge id → Lucide icon + Roman numeral |
| `lib/motion.ts` | Easing curves, durations, spring configs as TS constants mirroring the CSS variables |
| `lib/format.ts` | Date/time formatting, percentage rounding, initial extraction |
| `hooks/useAuth.ts` | `/api/auth/me` gate, login, signup, logout |
| `hooks/useDashboard.ts` | Single shared `/api/dashboard` fetch with `refresh()`, consumed by three components |
| `hooks/useSessions.ts` | Recent-sessions list with `refresh()` |
| `hooks/useCircle.ts` | Leaderboard + requests, fetched in parallel |
| `hooks/usePremium.ts` | The localStorage premium flag and `gateWithPaywall(reason, action)` |
| `hooks/useToast.ts` | Toast queue |
| `hooks/useCountUp.ts` | rAF numeral count-up that writes to a ref, never to state |

---

## F. Ordered task list for the Sonnet executor

Rules that apply to every task: **no placeholder code, no `// ...`, no `// rest of implementation`, no truncation** — every file is written complete. Every component listed in §E is implemented in full when its task comes up. Do not modify `server/server.js` or anything under `server/src/`. Run `npm run build` at the repo root after any task marked ✅BUILD and fix errors before moving on.

---

### T01 — Root workspace scaffold
**Creates:** `package.json` (root), `.gitignore` (root)
**Depends on:** nothing
**Do:**
- Root `package.json`: `{ "name": "maison-de-merde", "private": true, "workspaces": ["web", "server"] }` plus scripts:
  - `dev`: `concurrently -n api,web -c magenta,cyan "cross-env PORT=3001 npm --prefix server run start" "npm --prefix web run dev"`
  - `build`: `npm --prefix web run build`
  - `start`: `npm --prefix server run start`
  - `sync`: `node web/scripts/sync-public.mjs`
- devDependencies: `concurrently@^9.0.1`, `cross-env@^7.0.3`.
- Root `.gitignore`: `node_modules/`, `.env`, `*.log`, `web/.next/`, `web/out/`, `server/public/`, `server/data/`, `.DS_Store`.
**Acceptance:** `npm install` at the repo root completes and links both workspaces; `server/public/` is git-ignored; `git status` shows the existing `server/public/*` files as still tracked (they are deleted explicitly in T24, not silently by the ignore rule).

### T02 — Next.js app scaffold and config ✅BUILD
**Creates:** `web/package.json`, `web/next.config.mjs`, `web/tsconfig.json`, `web/postcss.config.mjs`, `web/tailwind.config.ts`, `web/scripts/sync-public.mjs`, `web/public/grain.svg`, `web/public/favicon.ico`, `web/app/layout.tsx` (minimal), `web/app/page.tsx` (minimal placeholder replaced in T15)
**Depends on:** T01
**Do:**
- `web/package.json` with the exact versions in §A.7. Scripts: `dev`: `next dev`, `build`: `cross-env NEXT_OUTPUT_EXPORT=1 next build && node scripts/sync-public.mjs`, `lint`: `next lint`.
- `web/next.config.mjs` — **all three of these are load-bearing (§0.2, §A.2, §A.3):**
  - `const isExport = process.env.NEXT_OUTPUT_EXPORT === "1"`
  - `output: isExport ? "export" : undefined`
  - `trailingSlash: true`
  - `images: { unoptimized: true }`
  - `rewrites()` defined **only when `!isExport`**, mapping `/api/:path*` → `http://localhost:3001/api/:path*`. Rewrites are ignored under `output: "export"` and must not be emitted there.
- `web/tsconfig.json` — `strict: true`, `paths: { "@/*": ["./*"] }`.
- `web/tailwind.config.ts` — `content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"]`; theme extension wiring the §B.3 colours, §B.2 `fontFamily` + `fontSize`, §B.4 `borderRadius`, and `transitionTimingFunction` for the three eases. No plugins.
- `web/scripts/sync-public.mjs` — Node ESM: resolve `../out` and `../../server/public`, `fs.rmSync(dest, { recursive: true, force: true })`, `fs.cpSync(src, dest, { recursive: true })`, log the file count. Fail loudly with a non-zero exit if `out/` does not exist.
- `web/public/grain.svg` — an SVG `feTurbulence` fractal-noise tile used as the `GrainOverlay` background.
- Minimal `layout.tsx` and `page.tsx` so the build passes.
**Acceptance:** `npm --prefix web run dev` serves a page at `:3000`; `npm run build` at the root produces `web/out/` and copies it into `server/public/`; `npm start` then serves that page from Express at `:3000`.

### T03 — Design tokens, fonts, root layout ✅BUILD
**Creates/edits:** `web/app/globals.css`, `web/app/layout.tsx`, `web/lib/motion.ts`, `web/components/ui/GrainOverlay.tsx`
**Depends on:** T02
**Do:**
- `globals.css`: `@tailwind base/components/utilities`; `:root` block with every token from §B.3 and §B.7; base layer setting `body { background: var(--paper); color: var(--ink-700); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }`; a `::selection` rule in `--sage-100`; a global `@media (prefers-reduced-motion: reduce)` block that drops `animation-duration`/`transition-duration` to 0.01ms for anything not explicitly opted out; `.tabular` utility for `font-variant-numeric: tabular-nums`.
- `layout.tsx`: import `Instrument_Serif` from `next/font/google` (`weight: ["400"]`, `style: ["normal","italic"]`, `subsets: ["latin"]`, `variable: "--font-display"`), `GeistSans` from `geist/font/sans` and `GeistMono` from `geist/font/mono`; apply all three variable classes to `<html>`; set `metadata` (title `Maison de Merde — Purveyors of Fine Digestive Distinction`, description, `openGraph`); add `<meta name="color-scheme" content="light">`; render `GrainOverlay` and `ToastProvider` (the latter added in T06 — stub the import order so T06 only has to fill it in).
- `lib/motion.ts`: `EASE`, `DURATION`, `SPRING` constants mirroring §B.7 exactly.
- `GrainOverlay`: `fixed inset-0 pointer-events-none z-[45]`, `opacity-[0.03]`, background `url(/grain.svg)`, `mix-blend-multiply`. Fixed only — never attached to a scrolling container.
**Acceptance:** a test page renders Instrument Serif, Geist Sans, and Geist Mono correctly; every token resolves in DevTools; the grain layer is visible and does not intercept clicks.

### T04 — Data layer ✅BUILD
**Creates:** `web/lib/api.ts`, `web/lib/types.ts`, `web/lib/enums.ts`, `web/lib/bristol.ts`, `web/lib/format.ts`
**Depends on:** T02
**Reads for reference:** `server/src/routes/sessions.js`, `server/src/routes/dashboard.js`, `server/src/routes/circle.js`, `server/src/routes/auth.js`, `server/src/streak.js`
**Do:**
- `api.ts`: `apiFetch<T>(path, opts)` mirroring the existing `api()` in `server/public/app.js` — `credentials: "include"`, `Content-Type: application/json` only when the body is not `FormData`, parse JSON defensively, throw a typed `ApiError` with `.status` and the server's `error` string.
- `types.ts`: every shape in §0.4. **Two distinct session types** — `SessionCreateBody` (camelCase) and `SessionRow` (snake_case: `occurred_at`, `bristol_type`, `visible_food`, `blood_flag`, `symptoms: string[]`).
- `enums.ts`: `COLORS`, `ODORS`, `PAIN_LEVELS` as `as const` tuples copied **verbatim** from `server/src/routes/sessions.js` lines 9–11, each with a parallel display-label map, plus `SYMPTOMS`. Head the file with a comment naming the source file and line numbers.
- `bristol.ts`: `BRISTOL_LABELS` (the seven clinical descriptions already in `server/public/index.html`), `BRISTOL_COLORS` (the §B.3 diverging ramp), and `BRISTOL_PATHS` — the seven path strings. **Verify before committing: every string must have an identical command sequence and an identical number count.** Add a dev-only assertion that throws if the counts diverge; a silent morph failure is otherwise invisible until someone scrolls the hero.
- `format.ts`: `formatSessionTime`, `formatPercent`, `initialOf`.
**Acceptance:** `tsc --noEmit` is clean; the path-count assertion passes; the enum arrays are character-identical to the server's.

### T05 — UI primitives, batch A (surfaces and controls) ✅BUILD
**Creates:** `web/components/ui/DoubleBezelCard.tsx`, `PressButton.tsx`, `ArrowCTAButton.tsx`, `EyebrowTag.tsx`, `SectionHeading.tsx`, `EditorialSplit.tsx`, `Rule.tsx`, `Icon.tsx`
**Depends on:** T03, T04
**Do:** implement each exactly to §B.5, §B.6, §B.8, §B.4. `Icon.tsx` is the sole `lucide-react` importer and exports the curated set with the enforced `strokeWidth`.
**Acceptance:** a scratch page renders all eight; every button responds to `:active` with a 0.97 scale; card radii are visibly concentric; no `lucide-react` import exists outside `Icon.tsx` (grep to confirm).

### T06 — UI primitives, batch B (motion, feedback, forms) ✅BUILD
**Creates:** `web/components/ui/Reveal.tsx`, `Stagger.tsx`, `Modal.tsx`, `Toast.tsx`, `ToastProvider.tsx`, `SkeletonRow.tsx`, `SkeletonBlock.tsx`, `EmptyState.tsx`, `TextInput.tsx`, `SelectField.tsx`, `Checkbox.tsx`, `Chip.tsx`; `web/hooks/useToast.ts`
**Edits:** `web/app/layout.tsx` (mount `ToastProvider`)
**Depends on:** T05
**Do:** all per §B.7 and §E. `Reveal` calls `useReducedMotion()` and degrades to an opacity-only fade. `Modal` implements focus trap, Escape, scroll lock, asymmetric 260/180ms timings, and centred transform origin. `Toast` uses CSS transitions (not keyframes) and supports swipe-to-dismiss with the 0.11 velocity threshold and pointer capture.
**Acceptance:** toasts can be fired rapidly and interrupt smoothly rather than restarting; the modal traps focus and returns it on close; every form control is keyboard-operable and has a visible focus ring.

### T07 — `FloatingNav` ✅BUILD
**Creates:** `web/components/landing/FloatingNav.tsx`
**Depends on:** T05, T06
**Do:** per §C.1 — floating pill, `IntersectionObserver` section tracking, `layoutId` dot, hamburger→X morph, full-screen staggered mobile overlay, scroll lock, Escape.
**Acceptance:** the pill floats detached from the top edge; the hamburger visibly rotates into an X rather than swapping; mobile links stagger in at 60ms; the nav is fully keyboard-navigable.

### T08 — `ScrollDescentHero` (the scroll animation) ✅BUILD
**Creates:** `web/components/landing/ScrollDescentHero.tsx`, `BristolMorphPath.tsx`, `BristolLegendRail.tsx`
**Depends on:** T04 (`BRISTOL_PATHS`), T05
**Do:** implement §B.9 in full — the sticky stage, the two-SVG-plus-wrapper plate structure, every breakpoint in the progress table, the legend rail with `useMotionValueEvent` integer-only state updates, the reduced-motion static composition, and the mobile variant. Use full `transform` strings rather than the `x`/`y`/`scale` shorthands on the specimen group and the lid wrapper.
**Acceptance:** scrolling the hero morphs the specimen smoothly through all seven shapes with no snapping (a snap means the path strings diverge — fix `bristol.ts`, not this file); the lid opens and closes; the legend tracks; with `prefers-reduced-motion: reduce` the section is one viewport tall, does not pin, and shows a complete static composition; DevTools shows no layout or paint thrash beyond the single morphing path.

### T09 — Intro and manifesto sections ✅BUILD
**Creates:** `web/components/landing/IntroSection.tsx`, `SpecimenCard.tsx`, `ManifestoStatement.tsx`
**Depends on:** T05, T06
**Do:** per §C.3 and §C.4, with the copy written verbatim.
**Acceptance:** copy matches this plan word for word; the manifesto's three word-groups stagger at 80ms; the specimen card's tilt resets to 0deg below `md`.

### T10 — `ServicesList` ✅BUILD
**Creates:** `web/components/landing/ServicesList.tsx`, `ServiceRow.tsx`
**Depends on:** T05, T06
**Do:** per §C.5 — five rows, verbatim copy and tags, sticky rail, clip-path leader rule on hover gated behind `(hover:hover) and (pointer:fine)`, vertical stacking below `md`.
**Acceptance:** all five rows present with exact copy; no price or Gold Circle mention anywhere in this component; hover animates transform and clip-path only.

### T11 — `SubsystemGrid` ✅BUILD
**Creates:** `web/components/landing/SubsystemGrid.tsx`, `SubsystemCard.tsx`
**Depends on:** T05, T06
**Do:** per §C.6 — four cards, the asymmetric `md:row-span-2` on card 01, and all four mini-visuals built as real markup/SVG (not images).
**Acceptance:** the grid is visibly asymmetric on desktop and a plain single column below `md` with no `row-span` and no hover lift.

### T12 — `FoundationsWall` ✅BUILD
**Creates:** `web/components/landing/FoundationsWall.tsx`, `CitationCard.tsx`, `CommitmentRow.tsx`
**Depends on:** T05, T06
**Do:** per §C.7 — exactly two citations, three prior-art cells, four commitment rows.
**Acceptance:** **no fabricated citations and no testimonial quotes attributed to any person, real or invented.** Exactly the two references named in §C.7 appear.

### T13 — Journal teasers and the three article pages ✅BUILD
**Creates:** `web/components/landing/JournalTeaserGrid.tsx`, `JournalCard.tsx`, `web/app/journal/streak-engine/page.tsx`, `web/app/journal/bristol-scale/page.tsx`, `web/app/journal/photographs/page.tsx`, `web/components/ui/ArticleLayout.tsx`
**Depends on:** T05, T06, T14 (`FooterWordmark`) — if T14 has not run, stub the footer import and fill it in immediately after
**Do:** per §C.8. Write each article at 500–800 words of real prose in README voice against the briefs given. Three concrete routes, **no `[slug]` dynamic route**. Each page exports `metadata`.
**Acceptance:** all three routes build under `output: "export"` and resolve at `/journal/<slug>/`; no lorem ipsum; the streak-engine article states the §6.2 policy sincerely.

### T14 — `EnterPanel` and `FooterWordmark` ✅BUILD
**Creates:** `web/components/landing/EnterPanel.tsx`, `web/components/ui/FooterWordmark.tsx`
**Depends on:** T05, T06
**Do:** per §C.9 and §C.10. `EnterPanel` validates against `/^[a-zA-Z0-9_]{3,24}$/` and routes to `/app/?intent=signup&username=…` (**trailing slash required**). The wordmark is `aria-hidden`, `select-none`, `pointer-events-none`, and is never a heading element.
**Acceptance:** valid usernames navigate with the params attached; invalid ones show an inline error and do not navigate; the wordmark is clipped by the page edge and does not cause horizontal overflow at any width.

### T15 — Landing page assembly ✅BUILD
**Edits:** `web/app/page.tsx`
**Depends on:** T07–T14
**Do:** compose, in order — `FloatingNav`, `ScrollDescentHero`, `IntroSection`, `ManifestoStatement`, `ServicesList` (`id="systeme"`), `SubsystemGrid`, `FoundationsWall` (`id="cercle"`), `JournalTeaserGrid` (`id="journal"`), `EnterPanel`, `FooterWordmark`. Keep it a **server component** — zero hooks in this file. Set page metadata.
**Acceptance:** the full page scrolls end to end with no horizontal overflow at 360px, 768px, 1280px, and 1920px; every section's padding is at least `py-28`; all three anchors work from the nav.

### T16 — App shell, auth, top bar ✅BUILD
**Creates:** `web/app/app/page.tsx`, `web/components/app/AppShell.tsx`, `AuthPanel.tsx`, `TopBar.tsx`, `TabRail.tsx`, `StreakPill.tsx`; `web/hooks/useAuth.ts`, `useDashboard.ts`, `usePremium.ts`, `useCountUp.ts`
**Depends on:** T04, T05, T06
**Do:** per §D.0 and §D.1. `app/app/page.tsx` is `"use client"` and renders `<AppShell />`. **Wrap the `useSearchParams()` consumer in `<Suspense fallback={null}>`** — this is a hard build failure otherwise (§G). Tab switching animates the indicator only; panels do not transition.
**Acceptance:** `/app/` resolves; an unauthenticated visitor sees the auth panel; signup and login both work end to end against the dev proxy and land in the shell; logout returns to the auth panel; `?tab=circle` opens the Circle tab; `?intent=signup&username=x` opens the signup tab prefilled; the production build does **not** error on `useSearchParams`.

### T17 — Log tab ✅BUILD
**Creates:** `web/components/app/LogPanel.tsx`, `QuickLogCard.tsx`, `DetailLogForm.tsx`, `BristolPicker.tsx`, `SymptomChips.tsx`, `PhotoField.tsx`, `AiSuggestionNote.tsx`, `SessionList.tsx`, `SessionRow.tsx`, `StampMark.tsx`; `web/hooks/useSessions.ts`
**Depends on:** T16
**Do:** per §D.2 in full. All enum values come from `lib/enums.ts`. The vision request posts `FormData` with the field name **`photo`**. `StampMark` replaces confetti on log.
**Acceptance:** a quick log with an empty body returns 201 and the streak updates; a full detailed log with every field set saves without a 400 (this is the enum-drift check — if it 400s, compare against §0.3); the Bristol selection springs between cells with a pointer and jumps instantly with arrow keys; a photo upload with no `OPENAI_API_KEY` surfaces the server's 503 message verbatim; the session list renders `occurred_at`/`bristol_type` correctly (snake_case).

### T18 — Dashboard tab ✅BUILD
**Creates:** `web/components/app/DashboardPanel.tsx`, `StatTriad.tsx`, `GoldCircleActions.tsx`, `FreezeDialog.tsx`, `ConsistencyHeatmap.tsx`, `BristolDistribution.tsx`, `DoctorExportCard.tsx`
**Depends on:** T16, T21 (`GoldCirclePaywall`) — build `GoldCircleActions` against the `usePremium` interface and let T21 supply the modal; if T21 has not run, the gate falls through to the action, which is acceptable mid-build but must be re-verified after T21
**Do:** per §D.3. Both gated buttons keep the satirical paywall (§0.5). `FreezeDialog` replaces `window.prompt()`. Export is a plain `<a download>`, never a fetch. Heatmap and chart are SVG, not canvas and not div grids.
**Acceptance:** stat numerals count up once and do not re-animate on unchanged refreshes; the heatmap matches the 91-day API payload with correct day-of-week alignment; the freeze dialog posts a value in 1–60 and the returned `streakFreezeUntil` renders; the export downloads a `.txt`; **the freeze and recover buttons are still gated behind the paywall.**

### T19 — Circle tab ✅BUILD
**Creates:** `web/components/app/CirclePanel.tsx`, `AddFriendField.tsx`, `FriendRequestRow.tsx`, `LeaderboardRow.tsx`; `web/hooks/useCircle.ts`
**Depends on:** T16
**Do:** per §D.4. Accept posts to `/api/circle/requests/${request.id}/accept` where `request.id` is the **requesting user's** id from `GET /api/circle/requests`.
**Acceptance:** adding a nonexistent user shows the inline "no account with that name" error rather than a toast; adding yourself shows the self-friend error; two accounts can friend each other and both appear on each other's leaderboard; the current user's row is visibly distinguished without an emoji.

### T20 — Achievements tab ✅BUILD
**Creates:** `web/components/app/AchievementsPanel.tsx`, `BadgeGrid.tsx`, `BadgeMedal.tsx`, `web/lib/badgeIcons.ts`
**Depends on:** T16
**Do:** per §D.5. Consume the shared `useDashboard()` result — **do not issue a second `/api/dashboard` request.** Map all nine badge ids to Lucide icons and Roman numerals; never render the server's emoji except as an `aria-hidden` fallback for an unknown id.
**Acceptance:** all nine badges render; locked ones are materially sunken and still state their unlock condition; no emoji is visible; only one `/api/dashboard` request appears in the Network panel when switching between the Dashboard and Achievements tabs.

### T21 — Paywall and celebration ✅BUILD
**Creates:** `web/components/app/GoldCirclePaywall.tsx`, `CelebrationModal.tsx`, `PaperFlecks.tsx`
**Edits:** `web/components/app/AppShell.tsx` (mount both, add the celebration queue reducer)
**Depends on:** T16, T18
**Do:** per §D.6. Port the card-formatting handlers verbatim from `server/public/app.js`. Keep the honest fine print. `PaperFlecks` renders **inside the modal panel's bounds only** — no full-viewport canvas, ever.
**Acceptance:** clicking Freeze Streak as a non-member opens the paywall; "subscribing" sets the localStorage flag, closes the modal, and then runs the queued freeze action; the fine print is legible and unaltered in meaning; unlocking multiple badges at once queues the celebrations one at a time; closing the celebration leaves no fixed-position element over the page (this is the regression from commit `13bb068` — verify by clicking through the whole app afterwards).

### T22 — Build pipeline verification ✅BUILD
**Edits:** none expected; fix whatever the build surfaces
**Depends on:** T15, T21
**Do:** run `npm run build` at the root, then `npm start`, then exercise the production build from Express: load `/`, deep-link `/app`, `/app/`, `/journal/bristol-scale/`, and an unknown path. Confirm the `/app` → `/app/` 301 works and that `/app/` serves the app, not the landing page (§0.2). Confirm assets under `/_next/` resolve.
**Acceptance:** every route above loads the correct page from the Express-served build with no console errors and no hydration warnings.

### T23 — Deploy documentation and config
**Edits:** `server/DEPLOY.md`, `server/render.yaml`, `server/.env.example`
**Depends on:** T22
**Do:**
- `render.yaml`: remove `rootDir: server`; `buildCommand: npm install && npm run build`; `startCommand: npm start`; leave `healthCheckPath` and all four env vars unchanged.
- `DEPLOY.md`: retitle the service-settings table per §A.4; add a new section describing the two-workspace layout and the fact that `server/public/` is now a **build artifact** that is git-ignored and must be produced by `npm run build` before the server will serve anything; rewrite "Local preview" as `npm install && npm run build && npm start` at the root; add a "Local development" section describing `npm run dev` (Express on 3001, Next on 3000, proxied); add an explicit note that **`CORS_ORIGIN` must stay unset** and why (`sameSite: "lax"`, §0.1); keep the Neon, SSL, free-tier, cold-start, and test sections as they are.
- `.env.example`: replace the stale Railway references with Render; expand the `CORS_ORIGIN` comment to say that a separate-origin frontend deploy is **not supported** without changing the cookie's `sameSite` attribute.
**Acceptance:** DEPLOY.md contains no instruction that would produce a broken deploy; a reader following it from scratch gets a working service.

### T24 — Cleanup and README
**Deletes:** `server/public/index.html`, `server/public/app.js`, `server/public/style.css`, and the entire `app/` directory
**Edits:** `README.md` (§12 Getting Started only)
**Depends on:** T22
**Do:**
- `git rm` the three old frontend files and the whole legacy `app/` prototype (dead code, no auth, served by nothing, and the source of a whole misleading community in the knowledge graph).
- README §12: replace the placeholder block with the real stack (Next.js 14 App Router + TypeScript + Tailwind + Framer Motion on the client; Express + Postgres/SQLite-fallback on the server) and the real commands (`npm install`, `npm run dev`, `npm run build`, `npm start`). **Change nothing else in README.md** — §1–§11 are the product spec and the source of the app's voice, and §6.2 must keep saying what it says (§0.5).
**Acceptance:** `git status` shows the deletions; nothing in the repo references `server/public/app.js` or the `app/` prototype; the app still builds and runs.

### T25 — Final verification pass
**Edits:** whatever the checks surface
**Depends on:** T24
**Do:** walk the whole build against this checklist and fix every failure:
1. No banned fonts (Inter, Roboto, Arial, Open Sans, Helvetica) anywhere — grep the CSS and config.
2. No `lucide-react` import outside `components/ui/Icon.tsx`; no icon rendering above `strokeWidth` 1.5.
3. No emoji in any rendered UI string.
4. Every card and panel uses `DoubleBezelCard`; nothing sits flat on the background.
5. No `transition: all`, no `ease-in` on a UI element, no `scale(0)` entrance, no `1px solid` gray border, no `shadow-md`-class dark shadow.
6. Every section is at least `py-24`; nothing uses `h-screen` (all `min-h-[100dvh]`).
7. Every hover animation is gated behind `@media (hover: hover) and (pointer: fine)`.
8. Only `transform`, `opacity`, `fill`, `pathLength`, and the hero's `d` are animated.
9. `backdrop-blur` appears only on fixed/sticky elements (nav, top bar, modal backdrop, mobile overlay).
10. `prefers-reduced-motion: reduce` produces a usable, non-pinned, fully-legible page everywhere.
11. No horizontal overflow at 360px; every wide element (heatmap, tables) scrolls inside its own `overflow-x-auto`.
12. All four in-app tabs load, all API calls succeed, and no `/api/dashboard` request is duplicated.
13. The Gold Circle paywall still gates Freeze Streak and Recover a Missed Day (§0.5).
14. No fabricated testimonials or citations.
15. `npm run build && npm start` serves everything correctly from Express.
**Acceptance:** all fifteen pass.

---

## G. Risk register

| # | Risk | How it shows up | Mitigation baked into this plan |
|---|---|---|---|
| R01 | **Wrong Framer Motion import path** | `Module not found: 'motion/react'` or a silently absent export | §A.7 pins `framer-motion@^11` and states the import is `"framer-motion"`. `motion/react` belongs to the separate `motion` package (v12+) and does not exist here. |
| R02 | **`useSearchParams()` without `<Suspense>`** | `next build` fails with *"useSearchParams() should be wrapped in a suspense boundary"* — a hard failure under `output: "export"`, not a warning | T16 requires the consumer to sit inside `<Suspense fallback={null}>`. Called out again in §A.6 and §D.0. |
| R03 | **`output: "export"` silently kills `rewrites()`** | Dev works, prod build warns and drops the proxy; or the proxy is dropped in dev too if the flag leaks | §A.2 / T02: `output` and `rewrites()` are both gated on `NEXT_OUTPUT_EXPORT`, set only by the build script. |
| R04 | **Deep link `/app` serves the landing page** | Visiting `/app` renders marketing copy with a hydration mismatch (§0.2) | `trailingSlash: true` in `next.config.mjs`, so export emits `out/app/index.html` and `express.static`'s default directory-index behaviour resolves it. All internal links written with a trailing slash. |
| R05 | **Enum drift against `sessions.js`** | A detailed log 400s with "Invalid color value" and looks like a UI bug | §0.3 tabulates the exact arrays; T04 copies them verbatim with a source comment; T17's acceptance criterion is a full-field save that must not 400. |
| R06 | **snake_case / camelCase confusion** | Session rows render `undefined` timestamps and no Bristol type | §0.3 and §E: `SessionCreateBody` (camelCase) and `SessionRow` (snake_case) are separate types; T17's acceptance names the fields explicitly. |
| R07 | **Path morph snaps instead of interpolating** | The hero specimen jumps between shapes | §B.9 states the identical-command/identical-number-count constraint; T04 adds a dev assertion that throws on divergence; T08's acceptance treats snapping as a `bristol.ts` bug. |
| R08 | **Font loading** — an invented font, a bad variable axis, or a Google Fonts fetch failure at build | Build error, or the page silently falls back to a system serif | §B.2 uses only real faces: Instrument Serif via `next/font/google` at weight 400 (no variable axes to misconfigure), Geist Sans/Mono from the self-hosted `geist` npm package (no network fetch). If `next/font/google` is unreachable in the build environment, self-host Instrument Serif from `@fontsource/instrument-serif` — same family, no design change. |
| R09 | **Cross-origin deploy breaks auth** | Login succeeds, then every request 401s | §0.1: `sameSite: "lax"` makes a separate-origin frontend unworkable without editing the backend. The architecture is same-origin in both dev and prod; T23 documents that `CORS_ORIGIN` must stay unset. |
| R10 | **Render config still points at `server/`** | Deploy builds only the backend and serves an empty `public/` | T23 removes `rootDir: server` from `render.yaml` and rewrites the DEPLOY.md table; §A.4 states every field's before/after. |
| R11 | **`server/public/` is empty at runtime** | Express 500s on the catch-all `sendFile` for a missing `index.html` | The directory is git-ignored (T01) and produced by `npm run build`; DEPLOY.md gets an explicit build-first note in both the local and deploy sections (T23). |
| R12 | **Windows env-var syntax** | `PORT=3001 npm start` fails in PowerShell with "The term 'PORT=3001' is not recognized" | `cross-env` is a root devDependency and is used in every script that sets an env var (T01, T02). |
| R13 | **Tailwind v4 vs v3 config mismatch** | `tailwind.config.ts` is silently ignored; every custom token resolves to nothing | §A.7 pins `tailwindcss@^3.4.14` with an explicit `postcss.config.mjs`. Do not run a v4 upgrade. |
| R14 | **Full-viewport confetti regression** | A fixed canvas sits over the whole page and blanks it (the exact bug fixed in commit `13bb068`) | §D.6 deletes the canvas entirely. `PaperFlecks` renders inside the modal's own `overflow-hidden` bounds and unmounts with it. T21's acceptance requires clicking through the app afterwards to confirm nothing fixed remains. |
| R15 | **`window.prompt()` carried over for the freeze flow** | Blocked in some browser contexts; always unstyled; breaks the design system | §D.3 replaces it with `FreezeDialog`, a real `Modal` with presets and a 1–60 clamp matching the server. |
| R16 | **Duplicate `/api/dashboard` requests** | Three components each fetch it (as the current `app.js` does), tripling load on a cold Render instance | `hooks/useDashboard.ts` is a single shared fetch behind context (§D.0); T20's acceptance verifies exactly one request in the Network panel. |
| R17 | **`dotenv` cannot find `server/.env`** | Local Postgres dev silently falls back to SQLite | All root scripts use `npm --prefix server run start`, which sets cwd to `server/`, so `require("dotenv").config()` resolves `server/.env` unchanged (§A.4). |
| R18 | **Someone "fixes" the README §6.2 / paywall contradiction** | The joke is removed and the product loses its point | §0.5 states explicitly that the contradiction is intentional satire; T18 and T21 both carry "still gated" as an acceptance criterion; T25 checks it again. |
| R19 | **Scroll-linked React state thrash** | The hero re-renders every frame and drops to single-digit FPS | §B.9: `useMotionValueEvent` writes state only when the integer legend index changes — seven updates per full scroll. Motion values are bound to style, never to `useState`. |
| R20 | **`next/image` used anywhere** | `next build` fails under `output: "export"` without `unoptimized` | `images: { unoptimized: true }` is set in T02, and the design uses zero raster imagery — every visual is SVG, type, or CSS. |

---

## H. Design-decision summary

The archetype pair is **Editorial Luxury × The Editorial Split**, and both fall out of the README rather than out of preference. The README is written as an academic paper — an abstract, numbered sections, a related-work list, an evaluation-criteria table — while the product is named like a French fashion house and already describes itself on screen as *"Établie 2026 · Purveyors of Fine Digestive Distinction."* Editorial Luxury renders that literally: warm cream paper, espresso ink, a single high-contrast display serif, hairline rules instead of borders, diffused ambient shadows instead of hard ones, and a 3% film grain so the whole thing reads as printed rather than emitted. The typography carries the joke structurally — **Instrument Serif is the maison, Geist Mono is the clinic**, and every screen wears both at once, which is exactly the tension the product is built on. The Editorial Split then gives the page a running spine: a statement rail on the left, evidence on the right, section after section, the way a journal's running head relates to its body column. It is also a deliberate hard reset away from the gold-on-black ornate theme that was just rejected — not a repaint of it. There is no gold, no medallion, no wax seal, no sparkle layer, and no dark mode, because a paper aesthetic that also has a dark variant is not committed to being paper. The scroll animation, **"La Chute"**, is the one place the plan spends real ambition: a hairline technical illustration of a rim in plan view, a lid that hinges open on a genuine 3D rotation, and a single abstract form that descends the frame while morphing continuously through Bristol Types 1 → 7 — one path, seven vertex-matched control-point variants, one diverging colour ramp — with a legend that names each type as it passes, before the form reaches the water, two hairline ripples expand, and the lid closes. It earns three hundred vertical viewport heights because it is not decoration: it teaches the Bristol Stool Scale, which is the entire taxonomy the product is built on, so its purpose is *explanation* — the one category where a long marketing animation is unambiguously justified. And it is the funniest possible treatment of the brief, because the humour comes from total commitment to the register: the least dignified subject imaginable, rendered as Figure 1 of a monograph, in a serif, on good paper.
