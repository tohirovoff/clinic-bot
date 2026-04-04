const { t } = require('../locales');
const { sessionQueries } = require('../database/queries');
const { getSession, isAdmin } = require('../utils/helpers');
const config = require('../config');
const {
  langKeyboard,
  registrationKeyboard,
  adminMenuKeyboard,
  userMenuKeyboard,
} = require('../keyboards');

/**
 * Handle /start command.
 */
function handleStart(bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const session = getSession(chatId);

    // If already logged in, show appropriate menu
    if (session.user_id || isAdmin(chatId)) {
      if (isAdmin(chatId)) {
        const lang = session.lang || 'uz_latin';
        return bot.sendMessage(chatId, t(lang, 'admin_welcome'), {
          parse_mode: 'MarkdownV2',
          ...adminMenuKeyboard(lang),
        });
      } else {
        const lang = session.lang || 'uz_latin';
        return bot.sendMessage(chatId, t(lang, 'already_logged_in'), {
          parse_mode: 'MarkdownV2',
          ...userMenuKeyboard(lang),
        });
      }
    }

    // Show language selection
    bot.sendMessage(chatId, "👋 Assalomu alaykum! Tilni tanlang:\n👋 Ассалому алайкум! Тилни танланг:", langKeyboard());
  });
}

/**
 * Handle language selection callback.
 */
function handleLangSelection(bot) {
  bot.on('callback_query', (query) => {
    if (!query.data.startsWith('lang:')) return;

    const chatId = query.message.chat.id;
    const lang = query.data.split(':')[1]; // uz_latin or uz_cyrillic

    sessionQueries.setLang.run(chatId, lang, lang);
    bot.answerCallbackQuery(query.id);

    // Delete the language selection message
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

    // If admin, go straight to admin menu
    if (isAdmin(chatId)) {
      return bot.sendMessage(chatId, t(lang, 'admin_welcome'), {
        parse_mode: 'MarkdownV2',
        ...adminMenuKeyboard(lang),
      });
    }

    // Show registration button
    bot.sendMessage(chatId, t(lang, 'registration'), registrationKeyboard(lang));
  });
}

/**
 * Handle registration button click → show clinic info.
 */
function handleRegistration(bot) {
  bot.on('callback_query', (query) => {
    if (query.data !== 'register') return;

    const chatId = query.message.chat.id;
    const session = getSession(chatId);
    const lang = session.lang || 'uz_latin';

    bot.answerCallbackQuery(query.id);
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

    const infoText = t(lang, 'clinic_info', {
      clinic_name: config.CLINIC_NAME,
      phone: config.CLINIC_PHONE,
    });

    bot.sendMessage(chatId, infoText, { parse_mode: 'MarkdownV2' });

    // Set state to waiting for password
    sessionQueries.setState.run('awaiting_password', null, chatId);

    setTimeout(() => {
      bot.sendMessage(chatId, t(lang, 'enter_password'));
    }, 500);
  });
}

module.exports = { handleStart, handleLangSelection, handleRegistration };
