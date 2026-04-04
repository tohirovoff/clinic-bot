const { handleStart, handleLangSelection, handleRegistration } = require('./start');
const { handleAuth } = require('./auth');
const { handleUserStats } = require('./user');
const {
  handleAdminCallbacks,
  handleAdminTextInput,
  handleAdminBackToMenu,
} = require('./admin');

/**
 * Register all bot handlers.
 * Order matters — more specific handlers should come before generic ones.
 */
function registerHandlers(bot) {
  // 1. Command handlers
  handleStart(bot);

  // 2. Callback query handlers
  handleLangSelection(bot);
  handleRegistration(bot);
  handleAdminCallbacks(bot);
  handleAdminBackToMenu(bot);
  handleUserStats(bot);

  // 3. Text input handlers (order matters for state-based routing)
  handleAdminTextInput(bot);
  handleAuth(bot);
}

module.exports = { registerHandlers };
