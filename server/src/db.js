const { Pool } = require("pg");

// Railway (and most managed Postgres hosts) require SSL but use a
// self-signed/short chain cert that Node rejects by default — the standard
// fix is rejectUnauthorized: false on the ssl object, not disabling SSL.
const useSSL = process.env.PGSSL !== "off";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
