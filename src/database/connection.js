const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('⚠️ PostgreSQL pool error:', err.message);
});

// ─── Helper: SQLite-compatible prepare() wrapper ─────────────────────
// Converts @param → $n (named) and ? → $n (positional)
// Returns object with async .get(), .all(), .run() methods

function prepare(sql) {
  const namedParamMap = {};
  let paramCount = 0;
  let pgSql = sql;

  // Replace @param_name with $n (same param = same $n)
  pgSql = pgSql.replace(/@(\w+)/g, (_, name) => {
    if (!(name in namedParamMap)) {
      namedParamMap[name] = ++paramCount;
    }
    return `$${namedParamMap[name]}`;
  });

  const namedParams = Object.keys(namedParamMap).sort(
    (a, b) => namedParamMap[a] - namedParamMap[b]
  );
  const isNamed = namedParams.length > 0;

  // If no named params, replace ? with $n
  if (!isNamed) {
    paramCount = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramCount}`);
  }

  function extractValues(args) {
    if (isNamed) {
      return namedParams.map((n) => args[0][n]);
    }
    return args;
  }

  return {
    /** Returns first row or undefined */
    get: async (...args) => {
      const values = extractValues(args);
      const { rows } = await pool.query(pgSql, values);
      return rows[0] || undefined;
    },

    /** Returns all rows */
    all: async (...args) => {
      const values = extractValues(args);
      const { rows } = await pool.query(pgSql, values);
      return rows;
    },

    /** Executes query, returns { changes } */
    run: async (...args) => {
      const values = extractValues(args);
      const result = await pool.query(pgSql, values);
      return { changes: result.rowCount };
    },
  };
}

// ─── Schema (PostgreSQL) ─────────────────────────────────────────────
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      full_name     TEXT    NOT NULL,
      region        TEXT    NOT NULL,
      birth_year    INTEGER NOT NULL,
      password      TEXT    NOT NULL UNIQUE,
      telegram_id   BIGINT  UNIQUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Tashkent')
    );

    CREATE TABLE IF NOT EXISTS patients (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL,
      full_name     TEXT    NOT NULL,
      region        TEXT    NOT NULL,
      birth_year    INTEGER NOT NULL,
      department    TEXT    NOT NULL DEFAULT 'Umumiy',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Tashkent'),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      telegram_id   BIGINT  PRIMARY KEY,
      user_id       INTEGER,
      lang          TEXT    NOT NULL DEFAULT 'uz_latin',
      state         TEXT,
      state_data    TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL,
      amount        INTEGER NOT NULL,
      admin_id      BIGINT  NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Tashkent'),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_patients_user_id    ON patients(user_id);
    CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_password      ON users(password);
  `);

  console.log('✅ PostgreSQL schema initialized');
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, prepare, initSchema, closePool };
