/**
 * Generate a unique 4-digit password that doesn't exist in the database.
 */
const { userQueries } = require('../database/queries');

function generatePassword() {
  let password;
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  do {
    password = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
    attempts++;
    if (attempts > MAX_ATTEMPTS) {
      throw new Error('Could not generate unique password after max attempts');
    }
  } while (userQueries.passwordExists.get(password));

  return password;
}

module.exports = { generatePassword };
