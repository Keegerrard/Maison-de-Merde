# Maison de Merde

**A Longitudinal, Gamified, Computer-Vision-Assisted Framework for Personal Defecation Analytics**

> "What gets measured gets managed." — Peter Drucker (almost certainly not talking about this)

---

## Abstract

Despite bowel movements being a universal, high-frequency biological event with well-established diagnostic value (stool form, color, odor, and frequency are all clinically recognized indicators of gastrointestinal health), the modern individual has no structured way to track, analyze, or socially contextualize their own defecation habits. Existing solutions are either purely clinical (undertaken only after symptoms already warrant a doctor's visit) or nonexistent for everyday preventive use. **Maison de Merde** proposes a mobile-first system that closes this gap through four integrated subsystems: (1) a low-friction logging engine, (2) a behavioral-psychology-driven streak and habit-formation layer, (3) an opt-in social/competitive layer, and (4) a manual- and computer-vision-assisted stool analysis pipeline built on the clinically validated Bristol Stool Scale. We present the problem motivation, related work, system architecture, data methodology, and evaluation criteria for the platform, along with an explicit treatment of the privacy and ethical considerations inherent to collecting this class of data.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Related Work](#3-related-work)
4. [Objectives](#4-objectives)
5. [System Architecture](#5-system-architecture)
6. [Methodology](#6-methodology)
7. [Feature Specification](#7-feature-specification)
8. [Data Privacy, Security & Ethics](#8-data-privacy-security--ethics)
9. [Evaluation Criteria](#9-evaluation-criteria)
10. [Risks & Limitations](#10-risks--limitations)
11. [Roadmap](#11-roadmap)
12. [Getting Started](#12-getting-started)
13. [Contributing](#13-contributing)
14. [License](#14-license)

---

## 1. Introduction

Digestive health sits at an odd cultural crossroads: it is simultaneously universal (everyone does it, roughly daily) and taboo (almost no one talks about it, tracks it, or has any baseline for what "normal" looks like for them personally). This creates an information vacuum. People are frequently unable to answer basic questions about their own GI health — "Is this normal for me?", "Has this changed over the last month?", "Is this correlated with what I ate or how much water I drank?" — because no record exists to answer them.

Maison de Merde reframes defecation as a trackable health signal, applies established habit-formation and gamification design patterns to encourage consistent logging, and layers social and AI-assisted tooling on top to make the data both more fun to generate and more useful once generated.

---

## 2. Problem Statement

We identify four distinct but related problems:

**P1 — No baseline.** Individuals have no historical record of their own bowel habits, making it difficult to notice meaningful deviations (a precursor signal for various GI conditions) versus normal day-to-day variation.

**P2 — No incentive to log.** Health-tracking behaviors (hydration, food, sleep) fail primarily due to lack of sustained motivation, not lack of awareness. A logging tool with no retention mechanism will not generate enough data density to be useful.

**P3 — No shared vocabulary or social context.** Digestive health is rarely discussed even among close friends, despite widespread curiosity and shared experience (dietary changes, travel, illness, etc. affect everyone). There is no lightweight, low-stakes way to compare notes.

**P4 — No structured self-assessment.** When something *does* feel off, most people have no framework for describing it precisely (to themselves or a doctor) beyond vague, non-clinical language.

Maison de Merde addresses P1–P4 directly via, respectively: a logging/history system, a streak and reward engine, an opt-in competitive social layer, and a structured (optionally AI-assisted) analysis form.

---

## 3. Related Work

- **The Bristol Stool Scale** (Lewis & Heaton, 1997) — a clinically validated 7-point classification of stool form, used globally in gastroenterology. Maison de Merde adopts this scale as the backbone of its manual logging taxonomy rather than inventing a new one, for both clinical credibility and user familiarity.
- **Habit-formation and streak mechanics** — as popularized by language-learning and fitness apps (e.g., Duolingo, Snapchat), streak-based design reliably increases daily active usage by leveraging loss aversion (users are more motivated to avoid breaking a streak than to build a new one).
- **Social fitness competition** — platforms like Strava demonstrate that adding a lightweight, opt-in leaderboard to an otherwise solitary/private health activity meaningfully increases engagement without requiring the activity itself to be inherently social.
- **Consumer computer-vision health tools** — food-logging apps that use photo input plus a vision model to auto-estimate nutritional content offer a proof of concept for the "photo in, structured health data out" pattern Maison de Merde applies to stool analysis.

Maison de Merde's contribution is not any one of these ideas in isolation, but their combination applied to a specific, underserved category of personal health data.

---

## 4. Objectives

| ID | Objective |
|----|-----------|
| O1 | Enable fast, frictionless logging of bowel movements (target: under 10 seconds for a minimal log) |
| O2 | Increase logging consistency via streaks and habit-formation mechanics |
| O3 | Introduce lightweight, opt-in social competition to make consistent logging more engaging |
| O4 | Provide a structured, clinically-informed self-assessment framework for each session |
| O5 | Offer AI-assisted photo analysis as an optional aid to structured self-assessment (not a diagnostic replacement) |
| O6 | Surface trends and anomalies over time in a way that is useful to share with a healthcare provider if needed |

---

## 5. System Architecture

Maison de Merde is designed as a mobile-first application with a thin client and a services-oriented backend, so the vision pipeline and analytics engine can evolve independently of the logging UI.

```
┌─────────────────────┐
│   Mobile Client      │  Quick-log widget, streak UI, leaderboard, session detail form
│  (iOS / Android)     │
└──────────┬───────────┘
           │ REST/GraphQL
┌──────────▼───────────┐
│   API Gateway         │  Auth, rate limiting, request routing
└──────────┬───────────┘
           │
   ┌───────┼────────────────┬─────────────────────┬───────────────────┐
   │                         │                     │                    │
┌──▼───────────┐   ┌─────────▼─────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ Logging       │   │ Streak & Rewards   │  │ Social /         │  │ Vision Analysis  │
│ Service       │   │ Engine             │  │ Leaderboard      │  │ Service          │
│ (CRUD, sync)  │   │ (state machine)    │  │ Service          │  │ (async, queued)  │
└──┬────────────┘   └─────────┬──────────┘  └────────┬─────────┘  └────────┬─────────┘
   │                          │                       │                     │
   └──────────────┬───────────┴───────────┬───────────┴──────────┬─────────┘
                   │                       │                      │
           ┌───────▼───────┐      ┌────────▼────────┐    ┌────────▼────────┐
           │ Primary DB     │      │ Cache / Pub-Sub  │    │ Object Storage   │
           │ (relational)   │      │ (streak state,   │    │ (photos, encrypted│
           │                │      │  leaderboards)   │    │  at rest, TTL'd)  │
           └────────────────┘      └──────────────────┘    └──────────────────┘
```

**Notes on the vision service:** photo analysis runs as an asynchronous job, not inline with the request, since inference latency should never block the core (sub-10-second) logging flow. Photos are processed, reduced to structured attributes, and — per the retention policy in §8 — deleted or de-identified rather than retained indefinitely by default.

---

## 6. Methodology

### 6.1 Data Model (core entities)

- **User** — account, privacy settings, friend graph, notification preferences.
- **Session** — one bowel movement log: timestamp, duration, location tag (optional), and a foreign key to zero-or-one `Analysis`.
- **Analysis** — structured self-assessment data for a session (see 6.4) plus optional AI-derived attributes (see 6.5).
- **Streak** — derived state per user: current streak length, longest streak, grace-period tokens remaining.
- **Circle** — a friend group / competitive cohort; users opt in per-circle.
- **Achievement** — unlockable badge tied to a rule (see 6.3).

### 6.2 Streak Engine

The streak engine is a per-user state machine that increments on any day with ≥1 logged session and resets (or consumes a "grace token") on a missed day.

- **Grace tokens**: a small number of forgiveness tokens earned periodically, so a single missed day (illness, travel, etc.) doesn't punitively erase progress — reducing the anxiety-inducing side effects sometimes associated with strict streak mechanics.
- **Reminder nudges**: opt-in push notifications scheduled around the user's own historical logging times (not a fixed global time), sent only as the streak is at risk.
- **Streak freeze**: users can proactively pause their streak (e.g., during travel) without penalty, which is disclosed clearly rather than hidden as a monetized feature.

### 6.3 Reward System

A tiered achievement system tied to both consistency and data-quality behaviors, not just raw frequency (to avoid incentivizing unhealthy over-logging):

- **Consistency badges** — 7/30/100/365-day streaks.
- **Completeness badges** — for consistently filling out full session analysis rather than minimal logs.
- **Milestone badges** — total sessions logged, first AI-analyzed photo, first circle joined.
- **Non-transferable, cosmetic-only rewards** — badges and profile flair only; no mechanic that could pressure real-world behavior (e.g., no rewards for logging *more often* than a healthy baseline).

### 6.4 Structured Session Analysis

Rather than free text, each optional analysis uses a constrained taxonomy so data stays comparable over time and exportable in a form a physician could actually parse:

| Attribute | Basis |
|---|---|
| Form / consistency | Bristol Stool Scale (Types 1–7) |
| Color | Standard clinical color categories (brown, green, yellow, black, red, pale/clay) |
| Odor | Self-reported relative intensity scale (typical → significantly stronger than typical) |
| Pain / straining | Self-reported scale (none, mild, moderate, severe), with a flag for blood or visible pain indicators |
| Visible undigested food | Boolean + optional note |
| Duration | Auto-timed or manually entered |
| Associated symptoms | Optional tags (bloating, urgency, incomplete evacuation, etc.) |

### 6.5 AI-Assisted Visual Analysis Pipeline

An entirely optional module: users may photograph a session and submit it for automated attribute extraction, pre-filling (never auto-submitting) the structured form above.

1. **Capture** — client-side compression and immediate on-device blur/preview before any upload confirmation.
2. **Preprocessing** — normalization, lighting correction.
3. **Inference** — a vision model (e.g., a fine-tuned CNN or vision-transformer classifier) trained to estimate Bristol type, color category, and presence of visible undigested matter from the image.
4. **Confidence-gated output** — predictions below a confidence threshold are withheld rather than guessed, and the UI always frames output as *"our best estimate — please confirm"* rather than a diagnosis.
5. **Human-in-the-loop correction** — user-corrected labels are what get stored as ground truth, and (with explicit separate consent) may be used to improve the model.

This module is explicitly a **convenience and pattern-recognition aid**, not a diagnostic tool, and is labeled as such throughout the product (see §8 and §10).

---

## 7. Feature Specification

Beyond the five capabilities in the original brief (tracking, streaks, competition, rewards, session/photo analysis), the following are proposed as part of a complete v1 scope:

- **Trend dashboard** — frequency, form distribution, and symptom trends over rolling 7/30/90-day windows.
- **Correlation insights** — optional cross-referencing with user-logged diet, hydration, sleep, or medication data to surface possible correlations (explicitly framed as observational, not causal).
- **Doctor export** — a clean, de-identified-by-default PDF/CSV summary of trends and flagged anomalies, meant to be genuinely useful in a real medical appointment.
- **Anomaly flags** — rule-based (not just AI-based) alerts for patterns worth medical attention (e.g., persistent Bristol Type 1/2 beyond N days, reported blood, sudden black/pale coloration), each with a plain-language "consider seeing a doctor" note — never a diagnosis.
- **Circles (private leaderboards)** — opt-in friend groups with configurable competitive metrics (streak length, consistency %, badge count) — deliberately *not* frequency-maximizing metrics, to avoid gamifying unhealthy behavior.
- **Granular privacy controls** — per-field sharing settings; photos and detailed symptom data are never shared to a Circle by default, only aggregate/streak data is.
- **Hydration & fiber reminders** — lightweight, optional nudges correlated with the user's own logged patterns.

---

## 8. Data Privacy, Security & Ethics

This is one of the most sensitive categories of personal data a consumer app can collect (health data, and in the case of photos, unusually intimate biometric-adjacent imagery). Non-negotiable design commitments:

- **Photos are opt-in, per-session**, never required to use core features.
- **Default-delete policy** — raw images are deleted after inference completes unless the user explicitly opts in to retention for their own personal history.
- **Encryption at rest and in transit** for all health data, with stricter access controls on the photo storage tier than on general app data.
- **No sale of health data**, ever, to advertisers or third parties — this is treated as a hard constraint, not a policy that trades off against monetization.
- **Clear diagnostic disclaimers** — the product is a tracking and pattern-recognition tool, not a medical device, and does not claim to diagnose any condition. Flagged anomalies direct users to consult a professional rather than offering a conclusion.
- **Data portability** — users can export or delete all of their data at any time.
- **Minors** — the product is not directed at children; age-gating and stricter defaults apply if any underage usage is detected.

---

## 9. Evaluation Criteria

Success is measured less by raw engagement and more by whether the product achieves its stated health-utility goals:

- **D7/D30 retention** and **average streak length** — proxies for whether the habit-formation mechanics are working.
- **Analysis completion rate** — percentage of sessions with a full structured analysis, not just a bare log (data usefulness depends on this).
- **AI suggestion acceptance/correction rate** — how often users accept vs. correct AI-estimated attributes, used to monitor model quality and calibrate confidence thresholds.
- **Anomaly-flag-to-doctor-visit self-reported follow-through** (optional survey signal) — a proxy for whether the product is actually helping users act on meaningful signals rather than just generating data for its own sake.
- **Circle participation without frequency inflation** — engagement with the social layer should not correlate with artificially increased (unhealthy) logging frequency; this is actively monitored as a guardrail metric, not just a growth metric.

---

## 10. Risks & Limitations

- **Model accuracy** — a vision classifier for stool attributes has no large, standardized, publicly available labeled dataset comparable to mainstream computer-vision domains; initial model quality will likely lag well behind user expectations and requires honest confidence communication.
- **Over-gamification risk** — poorly tuned streak/reward mechanics risk encouraging compulsive or anxiety-driven behavior around a bodily function; grace tokens and non-frequency-based rewards (§6.2, §6.3) are mitigations, not guarantees, and require ongoing UX research.
- **Stigma and adoption friction** — the core barrier to this category of app is social/psychological, not technical; the competitive/social layer must remain strictly opt-in and low-stakes to avoid discouraging honest logging.
- **Regulatory exposure** — depending on jurisdiction and how strongly the product frames its anomaly detection, it may brush up against medical device / health app regulation (e.g., FDA software-as-a-medical-device considerations in the US); this needs legal review before any diagnostic-adjacent language ships.
- **Not a diagnostic tool** — every risk above compounds if users mistake pattern-recognition output for medical advice; this must be prevented through product design, not just a terms-of-service disclaimer.

---

## 11. Roadmap

- **v0.1** — Core logging, manual structured analysis form, basic streak engine.
- **v0.2** — Rewards/achievements, reminder notifications, trend dashboard.
- **v0.3** — Circles (opt-in social/competitive layer).
- **v0.4** — AI photo analysis (beta, conservative confidence thresholds).
- **v0.5** — Doctor export, correlation insights, anomaly flagging.
- **v1.0** — Public launch, third-party clinical/UX review of anomaly-flagging language.

---

## 12. Getting Started

_Stack and setup instructions to be finalized as implementation begins. Planned foundation:_

- **Client**: cross-platform mobile (React Native or Flutter)
- **Backend**: REST/GraphQL API service (Node.js or Python), relational database (PostgreSQL) for structured data, object storage for photos with TTL-based lifecycle rules
- **Vision service**: separately deployable inference service (Python), decoupled from the main request path via a job queue

```bash
# placeholder — to be replaced once the initial scaffold exists
git clone <repo-url>
cd maison-de-merde
# setup instructions TBD
```

---

## 13. Contributing

Contribution guidelines TBD. Given the sensitivity of the data domain, any contributor working on the analysis or vision pipeline should read §8 (Privacy, Security & Ethics) before opening a PR that touches data handling.

---

## 14. License

TBD.
