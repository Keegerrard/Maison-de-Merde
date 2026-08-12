const fs = require("fs");
const path = require("path");
const { execRaw, driver } = require("./db");

/**
 * Runs every .sql file in src/migrations/<driver>/ in order. Migrations are
 * written with CREATE TABLE IF NOT EXISTS, so this is safe to call on every
 * boot instead of needing a separate migration-tracking table for a project
 * this size. Which driver's migration set runs is decided by src/db.js
 * (Postgres if DATABASE_URL is set, otherwise the local SQLite fallback).
 */
async function runMigrations() {
  const dir = path.join(__dirname, "migrations", driver);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await execRaw(sql);
    console.log(`[migrate] (${driver}) applied ${file}`);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("[migrate] done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[migrate] failed", err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
