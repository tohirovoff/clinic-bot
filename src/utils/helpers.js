const config = require('../config');
const { sessionQueries } = require('../database/queries');
const { t } = require('../locales');

/**
 * Get session for a Telegram user (creates one if missing).
 */
function getSession(telegramId) {
  let session = sessionQueries.get.get(telegramId);
  if (!session) {
    sessionQueries.upsert.run({
      telegram_id: telegramId,
      user_id: null,
      lang: 'uz_latin',
      state: null,
      state_data: null,
    });
    session = sessionQueries.get.get(telegramId);
  }
  return session;
}

/**
 * Check if user is admin.
 */
function isAdmin(telegramId) {
  return telegramId === config.ADMIN_ID;
}

/**
 * Check if user is authorized (logged in).
 */
function isAuthorized(telegramId) {
  const session = getSession(telegramId);
  return session && session.user_id !== null;
}

/**
 * Get language for user.
 */
function getLang(telegramId) {
  const session = getSession(telegramId);
  return session ? session.lang : 'uz_latin';
}

/**
 * Escape MarkdownV2 special characters in dynamic text.
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

module.exports = { getSession, isAdmin, isAuthorized, getLang, escapeMarkdown };
