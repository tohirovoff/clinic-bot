const db = require('./connection');

// ─── User Queries ────────────────────────────────────────────────────

const userQueries = {
  create: db.prepare(`
    INSERT INTO users (full_name, region, birth_year, password)
    VALUES (@full_name, @region, @birth_year, @password)
  `),

  findByPassword: db.prepare(`
    SELECT * FROM users WHERE password = ?
  `),

  findById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  findByTelegramId: db.prepare(`
    SELECT u.* FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.telegram_id = ?
  `),

  getAll: db.prepare(`
    SELECT * FROM users ORDER BY created_at DESC
  `),

  deleteById: db.prepare(`
    DELETE FROM users WHERE id = ?
  `),

  passwordExists: db.prepare(`
    SELECT 1 FROM users WHERE password = ?
  `),

  updateTelegramId: db.prepare(`
    UPDATE users SET telegram_id = ? WHERE id = ?
  `),
};

// ─── Patient Queries ─────────────────────────────────────────────────

const patientQueries = {
  create: db.prepare(`
    INSERT INTO patients (user_id, full_name, region, birth_year, department)
    VALUES (@user_id, @full_name, @region, @birth_year, @department)
  `),

  /** Patients by user within a date range */
  getByUserAndDateRange: db.prepare(`
    SELECT * FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
    ORDER BY created_at DESC
  `),

  /** Count by user within a date range */
  countByUserAndDateRange: db.prepare(`
    SELECT COUNT(*) as count FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
  `),

  /** All patients within a date range (for overall stats) */
  getAllByDateRange: db.prepare(`
    SELECT p.*, u.full_name as user_name FROM patients p
    JOIN users u ON u.id = p.user_id
    WHERE p.created_at >= ?
      AND p.created_at < ?
    ORDER BY p.created_at DESC
  `),

  /** Count per user within a date range (for overall stats) */
  countPerUserByDateRange: db.prepare(`
    SELECT u.id, u.full_name, COUNT(p.id) as count
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
      AND p.created_at >= ?
      AND p.created_at < ?
    GROUP BY u.id
    ORDER BY count DESC
  `),

  /** Total count in a date range */
  countByDateRange: db.prepare(`
    SELECT COUNT(*) as count FROM patients
    WHERE created_at >= ?
      AND created_at < ?
  `),
};

// ─── Session Queries ─────────────────────────────────────────────────

const sessionQueries = {
  get: db.prepare(`
    SELECT * FROM sessions WHERE telegram_id = ?
  `),

  upsert: db.prepare(`
    INSERT INTO sessions (telegram_id, user_id, lang, state, state_data)
    VALUES (@telegram_id, @user_id, @lang, @state, @state_data)
    ON CONFLICT(telegram_id)
    DO UPDATE SET
      user_id    = COALESCE(@user_id, sessions.user_id),
      lang       = COALESCE(@lang, sessions.lang),
      state      = @state,
      state_data = @state_data
  `),

  setLang: db.prepare(`
    INSERT INTO sessions (telegram_id, lang)
    VALUES (?, ?)
    ON CONFLICT(telegram_id)
    DO UPDATE SET lang = ?
  `),

  setState: db.prepare(`
    UPDATE sessions SET state = ?, state_data = ? WHERE telegram_id = ?
  `),

  clearState: db.prepare(`
    UPDATE sessions SET state = NULL, state_data = NULL WHERE telegram_id = ?
  `),

  setUserId: db.prepare(`
    UPDATE sessions SET user_id = ? WHERE telegram_id = ?
  `),

  deleteByUserId: db.prepare(`
    DELETE FROM sessions WHERE user_id = ?
  `),
};

module.exports = { userQueries, patientQueries, sessionQueries };
