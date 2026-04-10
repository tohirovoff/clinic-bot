const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'clinic.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    region        TEXT    NOT NULL,
    birth_year    INTEGER NOT NULL,
    password      TEXT    NOT NULL UNIQUE,
    telegram_id   INTEGER UNIQUE,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+5 hours'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    full_name     TEXT    NOT NULL,
    region        TEXT    NOT NULL,
    birth_year    INTEGER NOT NULL,
    department    TEXT    NOT NULL DEFAULT 'Umumiy',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+5 hours')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    telegram_id   INTEGER PRIMARY KEY,
    user_id       INTEGER,
    lang          TEXT    NOT NULL DEFAULT 'uz_latin',
    state         TEXT,
    state_data    TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    amount        INTEGER NOT NULL,
    admin_id      INTEGER NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+5 hours')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_patients_user_id   ON patients(user_id);
  CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_password      ON users(password);
`);

module.exports = db;
