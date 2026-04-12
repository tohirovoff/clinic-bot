const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_reminder_id BIGINT;');
    console.log('✅ Column last_reminder_id added successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
