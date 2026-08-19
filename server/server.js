require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const { runMigrations } = require("./src/migrate");
const { driver } = require("./src/db");

const authRoutes = require("./src/routes/auth");
const sessionsRoutes = require("./src/routes/sessions");
const dashboardRoutes = require("./src/routes/dashboard");
const circleRoutes = require("./src/routes/circle");
const visionRoutes = require("./src/routes/vision");
const chatRoutes = require("./src/routes/chat");
const notificationsRoutes = require("./src/routes/notifications");
const profileRoutes = require("./src/routes/profile");

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
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/profile", profileRoutes);

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

const DEV_SECRET_PATH = path.join(__dirname, "data", ".jwt-secret");

function ensureJwtSecret() {
  if (process.env.JWT_SECRET) return;
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET env var is required in production. Refusing to start.");
    process.exit(1);
  }
  // Local/dev convenience only: reuse a secret cached on disk across
  // restarts so "remember me" sessions actually survive `npm start`
  // being stopped and started again (the whole point of remember-me is
  // defeated if every local restart invalidates every existing cookie).
  // Still never used in production — the check above guarantees that,
  // and this file lives under data/, which is git-ignored.
  try {
    fs.mkdirSync(path.dirname(DEV_SECRET_PATH), { recursive: true });
    if (fs.existsSync(DEV_SECRET_PATH)) {
      const cached = fs.readFileSync(DEV_SECRET_PATH, "utf8").trim();
      if (cached) {
        process.env.JWT_SECRET = cached;
        console.warn("WARNING: JWT_SECRET not set — reusing the cached dev secret at server/data/.jwt-secret. " +
          "Set JWT_SECRET yourself before deploying anywhere real.");
        return;
      }
    }
    const generated = require("crypto").randomBytes(32).toString("hex");
    fs.writeFileSync(DEV_SECRET_PATH, generated, { mode: 0o600 });
    process.env.JWT_SECRET = generated;
    console.warn("WARNING: JWT_SECRET not set — generated one and cached it at server/data/.jwt-secret " +
      "so local sessions survive restarts. Set JWT_SECRET yourself before deploying anywhere real.");
  } catch (e) {
    // Filesystem not writable for some reason — fall back to the old
    // throwaway-per-run behavior rather than crashing local dev entirely.
    process.env.JWT_SECRET = require("crypto").randomBytes(32).toString("hex");
    console.warn("WARNING: JWT_SECRET not set and couldn't cache one to disk (" + e.message + ") — " +
      "generated a temporary one for this run only. Sessions will reset on every restart.");
  }
}

async function start() {
  ensureJwtSecret();

  if (driver === "sqlite") {
    console.warn("No DATABASE_URL set — using a local SQLite file (server/data/maison-de-merde.db). " +
      "Fine for local preview; set DATABASE_URL before deploying anywhere real.");
  }

  try {
    await runMigrations();
  } catch (e) {
    console.error("FATAL: migrations failed", e);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Maison de Merde server listening on :${PORT} (db driver: ${driver})`);
    if (!process.env.OPENAI_API_KEY) {
      console.warn("WARNING: OPENAI_API_KEY not set — photo analysis endpoint will return 503 until it is.");
    }
  });
}

start();

module.exports = app;
