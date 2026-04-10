const config = require('../config');
const { sessionQueries } = require('../database/queries');
const { t } = require('../locales');

/**
 * Get session for a Telegram user (creates one if missing).
 */
async function getSession(telegramId) {
  let session = await sessionQueries.get.get(telegramId);
  if (!session) {
    await sessionQueries.upsert.run({
      telegram_id: telegramId,
      user_id: null,
      lang: 'uz_latin',
      state: null,
      state_data: null,
    });
    session = await sessionQueries.get.get(telegramId);
  }
  return session;
}

/**
 * Check if user is any admin (super or sub).
 */
function isAdmin(telegramId) {
  return config.ALL_ADMINS.includes(telegramId);
}

/**
 * Check if user is the SUPER admin (full access).
 */
function isSuperAdmin(telegramId) {
  return telegramId === config.ADMIN_ID;
}

/**
 * Check if user is a SUB admin (limited access: add patients, view stats).
 */
function isSubAdmin(telegramId) {
  return config.SUB_ADMINS.includes(telegramId);
}

/**
 * Check if user is authorized (logged in).
 */
async function isAuthorized(telegramId) {
  const session = await getSession(telegramId);
  return session && session.user_id !== null;
}

/**
 * Get language for user.
 */
async function getLang(telegramId) {
  const session = await getSession(telegramId);
  return session ? session.lang : 'uz_latin';
}

/**
 * Escape MarkdownV2 special characters in dynamic text.
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

module.exports = { getSession, isAdmin, isSuperAdmin, isSubAdmin, isAuthorized, getLang, escapeMarkdown };
