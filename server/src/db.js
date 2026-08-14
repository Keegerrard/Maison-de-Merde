/* =========================================================================
   DB adapter — Postgres in production, a local SQLite file when no
   DATABASE_URL is set (zero-setup local preview, see DEPLOY.md).

   Both branches expose the same shape used everywhere else in the app:
     query(text, params) -> Promise<{ rows: [...] }>
     execRaw(sql)         -> Promise<void>   (multi-statement DDL, migrations)
     driver                -> "postgres" | "sqlite"

   Route/helper code (statsHelpers.js, routes/*) is written against $1, $2...
   placeholders (Postgres style) and never imports 'pg' or 'sql.js' directly
   — the driver differences are fully contained here.

   The SQLite fallback uses sql.js (SQLite compiled to WebAssembly) rather
   than a native addon like better-sqlite3. That's a deliberate choice: this
   is meant to be a true zero-setup local preview, and native modules need a
   matching prebuilt binary or a working C++ toolchain, which fails silently
   in some environments (restricted networks, unusual Node versions, no
   build tools). sql.js has no native dependency at all, at the cost of
   being an in-memory DB that we explicitly flush to disk after writes.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const driver = process.env.DATABASE_URL ? "postgres" : "sqlite";

let pool;
let query;
let execRaw;

if (driver === "postgres") {
  const { Pool } = require("pg");
  // Railway (and most managed Postgres hosts) require SSL but use a
  // self-signed/short chain cert that Node rejects by default — the
  // standard fix is rejectUnauthorized: false, not disabling SSL outright.
  const useSSL = process.env.PGSSL !== "off";
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });

  query = async (text, params = []) => pool.query(text, params);
  execRaw = async (sql) => { await pool.query(sql); };
} else {
  const initSqlJs = require("sql.js");

  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "..", "data", "maison-de-merde.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  let sqljsDb = null;
  const ready = initSqlJs().then((SQL) => {
    const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
    sqljsDb = new SQL.Database(fileBuffer);
    sqljsDb.run("PRAGMA foreign_keys = ON;");
  });

  // sql.js keeps the whole database in memory; disk writes are an explicit
  // export+writeFileSync of the entire file. Doing that synchronously after
  // every single INSERT/UPDATE gets slow as the file grows (each write is
  // O(database size), not O(change size)) and can visibly stall a request
  // under any filesystem latency. Debounce instead: queries always read
  // from the live in-memory DB (so correctness is unaffected), and disk
  // writes coalesce into one flush ~150ms after the last mutation, plus a
  // synchronous flush on graceful shutdown so a Ctrl+C doesn't lose data.
  let persistTimer = null;
  let dirty = false;

  function flushSync() {
    if (!sqljsDb || !dirty) return;
    fs.writeFileSync(dbPath, Buffer.from(sqljsDb.export()));
    dirty = false;
  }

  function schedulePersist() {
    dirty = true;
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      try {
        flushSync();
      } catch (e) {
        console.error("[sqlite] failed to persist database file:", e.message);
      }
    }, 150);
    if (persistTimer.unref) persistTimer.unref();
  }

  process.on("beforeExit", () => {
    try { flushSync(); } catch (e) { /* best effort */ }
  });
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      try { flushSync(); } catch (e) { /* best effort */ }
      process.exit(0);
    });
  }

  // sql.js rejects raw JS booleans as bind parameters — the rest of the app
  // passes real booleans (e.g. !!body.bloodFlag) because that's what the
  // Postgres driver wants, so we normalize just for this branch instead of
  // pushing driver-awareness into every route file.
  const sanitizeParam = (p) => {
    if (typeof p === "boolean") return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  };

  query = async (text, params = []) => {
    await ready;
    const sqliteText = text.replace(/\$\d+/g, "?");
    const bound = params.map(sanitizeParam);
    const stmt = sqljsDb.prepare(sqliteText);
    let rows = [];
    try {
      stmt.bind(bound);
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sqliteText)) schedulePersist();
    return { rows };
  };

  execRaw = async (sql) => {
    await ready;
    sqljsDb.run(sql);
    // Migrations/DDL: flush immediately rather than debouncing, so the
    // schema is durably on disk before the caller (server.js) proceeds to
    // accept requests.
    dirty = true;
    flushSync();
  };

  pool = { export: () => sqljsDb && sqljsDb.export() };
}

module.exports = { pool, query, execRaw, driver };
