require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const { runMigrations } = require("./src/migrate");
const { driver } = require("./src/db");

const authRoutes = require("./src/routes/auth");
const sessionsRoutes = require("./src/routes/sessions");
const dashboardRoutes = require("./src/routes/dashboard");
const circleRoutes = require("./src/routes/circle");
const visionRoutes = require("./src/routes/vision");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/circle", circleRoutes);
app.use("/api/vision", visionRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built frontend (single-service deploy: one Railway app serves
// both the API and the static client).
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Central error handler — keeps stack traces out of API responses.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

function ensureJwtSecret() {
  if (process.env.JWT_SECRET) return;
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET env var is required in production. Refusing to start.");
    process.exit(1);
  }
  // Local/dev convenience only: generate a throwaway secret so `npm start`
  // works with zero config. Sessions won't survive a restart (everyone gets
  // logged out), and this must never be reached in production — the check
  // above guarantees that.
  process.env.JWT_SECRET = require("crypto").randomBytes(32).toString("hex");
  console.warn("WARNING: JWT_SECRET not set — generated a temporary one for this run. " +
    "Set JWT_SECRET yourself for anything beyond local preview (sessions reset on every restart otherwise).");
}

async function start() {
  ensureJwtSecret();

  if (driver === "sqlite") {
    console.warn("No DATABASE_URL set — using a local SQLite file (server/data/proshitute.db). " +
      "Fine for local preview; set DATABASE_URL before deploying anywhere real.");
  }

  try {
    await runMigrations();
  } catch (e) {
    console.error("FATAL: migrations failed", e);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Proshitute server listening on :${PORT} (db driver: ${driver})`);
    if (!process.env.OPENAI_API_KEY) {
      console.warn("WARNING: OPENAI_API_KEY not set — photo analysis endpoint will return 503 until it is.");
    }
  });
}

start();

module.exports = app;
