const { prepare } = require('./connection');

// ─── User Queries ────────────────────────────────────────────────────

const userQueries = {
  create: prepare(`
    INSERT INTO users (full_name, region, birth_year, password)
    VALUES (@full_name, @region, @birth_year, @password)
  `),

  findByPassword: prepare(`
    SELECT id, full_name, region, birth_year, password, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM users WHERE password = ?
  `),

  findById: prepare(`
    SELECT id, full_name, region, birth_year, password, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM users WHERE id = ?
  `),

  findByTelegramId: prepare(`
    SELECT u.id, u.full_name, u.region, u.birth_year, u.password, 
           TO_CHAR(u.created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.telegram_id = ?
  `),

  getAll: prepare(`
    SELECT id, full_name, region, birth_year, password, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM users ORDER BY full_name ASC
  `),

  deleteById: prepare(`
    DELETE FROM users WHERE id = ?
  `),

  passwordExists: prepare(`
    SELECT 1 FROM users WHERE password = ?
  `),

  updateTelegramId: prepare(`
    UPDATE users SET telegram_id = ? WHERE id = ?
  `),
};

// ─── Patient Queries ─────────────────────────────────────────────────

const patientQueries = {
  create: prepare(`
    INSERT INTO patients (user_id, full_name, region, birth_year, department)
    VALUES (@user_id, @full_name, @region, @birth_year, @department)
  `),

  /** Patients by user within a date range */
  getByUserAndDateRange: prepare(`
    SELECT id, user_id, full_name, region, birth_year, department, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
    ORDER BY patients.created_at DESC
  `),

  /** Patients by user, date range and department */
  getByUserDateRangeAndDept: prepare(`
    SELECT id, user_id, full_name, region, birth_year, department, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
      AND department = ?
    ORDER BY patients.created_at DESC
  `),

  /** Count by user within a date range */
  countByUserAndDateRange: prepare(`
    SELECT COUNT(*)::int as count FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
  `),

  /** Count by user, date range and department */
  countByUserDateRangeAndDept: prepare(`
    SELECT COUNT(*)::int as count FROM patients
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
      AND department = ?
  `),

  /** All patients within a date range (for overall stats) */
  getAllByDateRange: prepare(`
    SELECT p.id, p.user_id, p.full_name, p.region, p.birth_year, p.department, 
           u.full_name as user_name,
           TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM patients p
    JOIN users u ON u.id = p.user_id
    WHERE p.created_at >= ?
      AND p.created_at < ?
    ORDER BY p.created_at DESC
  `),

  /** Count per user within a date range (for overall stats) */
  countPerUserByDateRange: prepare(`
    SELECT u.id, u.full_name, COUNT(p.id)::int as count
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
      AND p.created_at >= ?
      AND p.created_at < ?
    GROUP BY u.id, u.full_name
    ORDER BY count DESC
  `),

  /** Count per user within a date range and department */
  countPerUserDateRangeAndDept: prepare(`
    SELECT u.id, u.full_name, COUNT(p.id)::int as count
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
      AND p.created_at >= ?
      AND p.created_at < ?
      AND p.department = ?
    GROUP BY u.id, u.full_name
    ORDER BY count DESC
  `),

  /** Total count in a date range */
  countByDateRange: prepare(`
    SELECT COUNT(*)::int as count FROM patients
    WHERE created_at >= ?
      AND created_at < ?
  `),

  /** Total count in a date range and department */
  countByDateRangeAndDept: prepare(`
    SELECT COUNT(*)::int as count FROM patients
    WHERE created_at >= ?
      AND created_at < ?
      AND department = ?
  `),
};

// ─── Session Queries ─────────────────────────────────────────────────

const sessionQueries = {
  get: prepare(`
    SELECT * FROM sessions WHERE telegram_id = ?
  `),

  upsert: prepare(`
    INSERT INTO sessions (telegram_id, user_id, lang, state, state_data)
    VALUES (@telegram_id, @user_id, @lang, @state, @state_data)
    ON CONFLICT(telegram_id)
    DO UPDATE SET
      user_id    = COALESCE(@user_id, sessions.user_id),
      lang       = COALESCE(@lang, sessions.lang),
      state      = @state,
      state_data = @state_data
  `),

  setLang: prepare(`
    INSERT INTO sessions (telegram_id, lang)
    VALUES (?, ?)
    ON CONFLICT(telegram_id)
    DO UPDATE SET lang = ?
  `),

  setState: prepare(`
    UPDATE sessions SET state = ?, state_data = ? WHERE telegram_id = ?
  `),

  clearState: prepare(`
    UPDATE sessions SET state = NULL, state_data = NULL WHERE telegram_id = ?
  `),

  setUserId: prepare(`
    UPDATE sessions SET user_id = ? WHERE telegram_id = ?
  `),

  deleteByUserId: prepare(`
    DELETE FROM sessions WHERE user_id = ?
  `),

  setLastReminderId: prepare(`
    UPDATE sessions SET last_reminder_id = ? WHERE telegram_id = ?
  `),
};

// ─── Payment Queries ─────────────────────────────────────────────────

const paymentQueries = {
  create: prepare(`
    INSERT INTO payments (user_id, amount, admin_id)
    VALUES (@user_id, @amount, @admin_id)
  `),

  /** Get all payments by user within a date range */
  getByUserAndDateRange: prepare(`
    SELECT id, user_id, amount, admin_id,
           TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM payments
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
    ORDER BY payments.created_at DESC
  `),

  /** Get all payments by user, date range and admin */
  getByUserDateRangeAndAdmin: prepare(`
    SELECT id, user_id, amount, admin_id,
           TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM payments
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
      AND admin_id = ?
    ORDER BY payments.created_at DESC
  `),

  /** Sum amount per user within a date range */
  sumByUserAndDateRange: prepare(`
    SELECT COALESCE(SUM(amount), 0)::int as total FROM payments
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
  `),

  /** Sum amount per user, date range and admin */
  sumByUserDateRangeAndAdmin: prepare(`
    SELECT COALESCE(SUM(amount), 0)::int as total FROM payments
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
      AND admin_id = ?
  `),

  /** Sum per user within a date range (for overall stats) */
  sumPerUserByDateRange: prepare(`
    SELECT u.id, u.full_name, COALESCE(SUM(py.amount), 0)::int as total
    FROM users u
    LEFT JOIN payments py ON py.user_id = u.id
      AND py.created_at >= ?
      AND py.created_at < ?
    GROUP BY u.id, u.full_name
    ORDER BY total DESC
  `),

  /** Sum per user within a date range and admin */
  sumPerUserDateRangeAndAdmin: prepare(`
    SELECT u.id, u.full_name, COALESCE(SUM(py.amount), 0)::int as total
    FROM users u
    LEFT JOIN payments py ON py.user_id = u.id
      AND py.created_at >= ?
      AND py.created_at < ?
      AND py.admin_id = ?
    GROUP BY u.id, u.full_name
    ORDER BY total DESC
  `),

  /** Total sum in a date range */
  sumByDateRange: prepare(`
    SELECT COALESCE(SUM(amount), 0)::int as total FROM payments
    WHERE created_at >= ?
      AND created_at < ?
  `),

  /** Total sum in a date range and admin */
  sumByDateRangeAndAdmin: prepare(`
    SELECT COALESCE(SUM(amount), 0)::int as total FROM payments
    WHERE created_at >= ?
      AND created_at < ?
      AND admin_id = ?
  `),
};

module.exports = { userQueries, patientQueries, sessionQueries, paymentQueries };
