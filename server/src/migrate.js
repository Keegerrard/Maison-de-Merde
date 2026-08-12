const fs = require("fs");
const path = require("path");

/**
 * Runs every .sql file in src/migrations against the given queryable
 * (anything with a .query(text) method — a real pg Pool, or a pg-mem
 * adapter in tests). Migrations are written with CREATE TABLE IF NOT
 * EXISTS, so this is safe to call on every boot instead of needing a
 * separate migration-tracking table for a project this size.
 */
async function runMigrations(db) {
  const dir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await db.query(sql);
    console.log(`[migrate] applied ${file}`);
  }
}

if (require.main === module) {
  const { pool } = require("./db");
  runMigrations(pool)
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
