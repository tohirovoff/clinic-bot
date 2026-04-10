const { initSchema, closePool } = require('./connection');

initSchema()
  .then(() => {
    console.log('✅ Database initialized successfully (PostgreSQL)');
    console.log('Tables created: users, patients, sessions, payments');
    return closePool();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });
