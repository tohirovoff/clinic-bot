const db = require('./connection');

console.log('✅ Database initialized successfully at data/clinic.db');
console.log('Tables created: users, patients, sessions');

db.close();
process.exit(0);
