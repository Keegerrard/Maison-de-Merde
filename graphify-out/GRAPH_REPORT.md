# Graph Report - .  (2026-08-18)

## Corpus Check
- Corpus is ~18,550 words - fits in a single context window. You may not need a graph.

## Summary
- 293 nodes · 456 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 89% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.71)
- Token cost: 90,000 input · 7,546 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Live App Frontend (serverpublicapp.js)|Live App Frontend (server/public/app.js)]]
- [[_COMMUNITY_Legacy Prototype Frontend (appapp.js)|Legacy Prototype Frontend (app/app.js)]]
- [[_COMMUNITY_Express Server Bootstrap|Express Server Bootstrap]]
- [[_COMMUNITY_Circle & Dashboard API Routes|Circle & Dashboard API Routes]]
- [[_COMMUNITY_Bristol Scale & Structured Analysis Spec|Bristol Scale & Structured Analysis Spec]]
- [[_COMMUNITY_Auth & Session Logic|Auth & Session Logic]]
- [[_COMMUNITY_Server package.json Dependencies|Server package.json Dependencies]]
- [[_COMMUNITY_Legacy Frontend UI vs README Reward Spec|Legacy Frontend UI vs README Reward Spec]]
- [[_COMMUNITY_Postgrespg-mem Integration Tests|Postgres/pg-mem Integration Tests]]
- [[_COMMUNITY_SQLite Fallback Integration Tests|SQLite Fallback Integration Tests]]
- [[_COMMUNITY_Render + Neon Deployment Guide|Render + Neon Deployment Guide]]
- [[_COMMUNITY_SessionAnalysis Data Model|Session/Analysis Data Model]]
- [[_COMMUNITY_CircleUser Data Model|Circle/User Data Model]]
- [[_COMMUNITY_Streak Data Model|Streak Data Model]]

## God Nodes (most connected - your core abstractions)
1. `server/public/index.html (frontend page, luxury redesign)` - 11 edges
2. `Deploying Maison de Merde to Render + Neon (guide)` - 11 edges
3. `System Architecture (services-oriented backend)` - 10 edges
4. `calcStreak()` - 9 edges
5. `Maison de Merde (Project)` - 9 edges
6. `persistAndRefresh()` - 8 edges
7. `recomputeAfterNewSession()` - 8 edges
8. `app/index.html (frontend page, plain version)` - 8 edges
9. `getStreakInfo()` - 7 edges
10. `api()` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Streak & Habit-Formation Layer** — readme_streak_engine, readme_grace_tokens, readme_reminder_nudges, readme_streak_freeze, readme_reward_system [INFERRED 0.85]
- **Maison de Merde Backend Microservices** — readme_api_gateway, readme_logging_service, readme_streak_rewards_engine, readme_social_leaderboard_service, readme_vision_analysis_service [EXTRACTED 1.00]
- **Render + Neon Deployment Stack** — server_deploy_render_platform, server_deploy_neon_platform, server_render_config [EXTRACTED 1.00]

## Communities (14 total, 3 thin omitted)

### Community 0 - "Live App Frontend (server/public/app.js)"
Cohesion: 0.09
Nodes (29): animateConfetti(), api(), celebrationQueue, checkAuth(), CONFETTI_COLORS, confettiCanvas, confettiParticles, drawBristolChart() (+21 more)

### Community 1 - "Legacy Prototype Frontend (app/app.js)"
Cohesion: 0.11
Nodes (28): addSession(), BADGES, buildLeaderboard(), calcStreak(), checkAchievements(), daysBetween(), defaultState(), DEMO_FRIENDS (+20 more)

### Community 2 - "Express Server Bootstrap"
Cohesion: 0.07
Nodes (30): app, authRoutes, circleRoutes, cookieParser, cors, dashboardRoutes, { driver }, ensureJwtSecret() (+22 more)

### Community 3 - "Circle & Dashboard API Routes"
Cohesion: 0.13
Nodes (25): { calcStreak, daysBetween, todayISO, toISODateString, toISOStringSafe }, computeUserRow(), express, { query }, { requireAuth }, router, { calcStreak, BADGES, todayISO, toISODateString, toISOStringSafe }, express (+17 more)

### Community 4 - "Bristol Scale & Structured Analysis Spec"
Cohesion: 0.09
Nodes (27): Session Details form (analysisForm), Anomaly Flags, API Gateway (auth, rate limiting, routing), Bristol Stool Scale, Cache / Pub-Sub (streak state, leaderboards), Consumer Computer-Vision Health Tools (related work), Duolingo (cited example), Evaluation Criteria (+19 more)

### Community 5 - "Auth & Session Logic"
Cohesion: 0.12
Nodes (21): bcrypt, clearSessionCookie(), getJwtSecret(), hashPassword(), jwt, requireAuth(), setSessionCookie(), signToken() (+13 more)

### Community 6 - "Server package.json Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, jsonwebtoken, multer (+15 more)

### Community 7 - "Legacy Frontend UI vs README Reward Spec"
Cohesion: 0.15
Nodes (22): Circle panel (demo leaderboard), Dashboard panel (streak stats, freq/bristol charts, export), app/index.html (frontend page, plain version), Quick Log card, Recent Sessions list, Streak pill (day streak counter), Achievement (data model entity), Circles (Private Leaderboards) (+14 more)

### Community 8 - "Postgres/pg-mem Integration Tests"
Cohesion: 0.13
Nodes (19): assert(), authRoutes, circleRoutes, cookieParser, dashboardRoutes, express, extractCookie(), http (+11 more)

### Community 9 - "SQLite Fallback Integration Tests"
Cohesion: 0.15
Nodes (16): assert(), authRoutes, circleRoutes, cookieParser, dashboardRoutes, { driver }, express, extractCookie() (+8 more)

### Community 10 - "Render + Neon Deployment Guide"
Cohesion: 0.19
Nodes (13): src/db.js (Postgres pool + SSL config), Environment variables (DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, NODE_ENV), Deploying Maison de Merde to Render + Neon (guide), src/migrations/ (SQL migrations), Neon (managed Postgres), pg-mem (in-memory Postgres mock), Render (hosting platform), server.js (entrypoint, PORT binding, migration runner) (+5 more)

## Ambiguous Edges - Review These
- `Streak Freeze` → `Gold Circle paywall (dummy/satirical)`  [AMBIGUOUS]
  server/public/index.html · relation: conceptually_related_to
- `Session Details form (analysisForm)` → `src/vision.js (OpenAI vision model config)`  [AMBIGUOUS]
  app/index.html · relation: conceptually_related_to

## Knowledge Gaps
- **129 isolated node(s):** `state`, `BADGES`, `DEMO_FRIENDS`, `pendingSymptoms`, `{ calcStreak }` (+124 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Streak Freeze` and `Gold Circle paywall (dummy/satirical)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Session Details form (analysisForm)` and `src/vision.js (OpenAI vision model config)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Maison de Merde (Project)` connect `Bristol Scale & Structured Analysis Spec` to `Legacy Frontend UI vs README Reward Spec`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Deploying Maison de Merde to Render + Neon (guide)` connect `Render + Neon Deployment Guide` to `Bristol Scale & Structured Analysis Spec`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `src/vision.js (OpenAI vision model config)` connect `Bristol Scale & Structured Analysis Spec` to `Render + Neon Deployment Guide`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `state`, `BADGES`, `DEMO_FRIENDS` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Live App Frontend (server/public/app.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._