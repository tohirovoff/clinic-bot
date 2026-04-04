const { t } = require('../locales');
const { userQueries, sessionQueries } = require('../database/queries');
const { getSession } = require('../utils/helpers');
const { userMenuKeyboard } = require('../keyboards');

/**
 * Handle password authentication.
 * Listens for text messages when user is in 'awaiting_password' state.
 */
function handleAuth(bot) {
  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId);

    if (session.state !== 'awaiting_password') return;

    const lang = session.lang || 'uz_latin';
    const password = msg.text.trim();

    // Validate 4-digit format
    if (!/^\d{4}$/.test(password)) {
      return bot.sendMessage(chatId, t(lang, 'wrong_password'));
    }

    // Look up user by password
    const user = userQueries.findByPassword.get(password);

    if (!user) {
      return bot.sendMessage(chatId, t(lang, 'wrong_password'));
    }

    // Check if another user already linked to this password
    // (edge case: someone else already used this password)
    if (user.telegram_id && user.telegram_id !== chatId) {
      return bot.sendMessage(chatId, t(lang, 'wrong_password'));
    }

    // Link the Telegram account to this user
    userQueries.updateTelegramId.run(chatId, user.id);
    sessionQueries.setUserId.run(user.id, chatId);
    sessionQueries.clearState.run(chatId);

    // Welcome message
    const escapedName = user.full_name.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
    bot.sendMessage(chatId, t(lang, 'login_success', { name: escapedName }), {
      parse_mode: 'MarkdownV2',
      ...userMenuKeyboard(lang),
    });
  });
}

module.exports = { handleAuth };
