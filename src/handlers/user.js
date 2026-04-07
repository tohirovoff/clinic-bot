const { t } = require('../locales');
const { patientQueries, sessionQueries } = require('../database/queries');
const { getSession, escapeMarkdown } = require('../utils/helpers');
const { getDateRange } = require('../utils/dates');
const { userMenuKeyboard, statsKeyboard } = require('../keyboards');

/**
 * Handle user statistics menu and period selection.
 */
function handleUserStats(bot) {
  bot.on('callback_query', (query) => {
    if (!query.data.startsWith('user:') && !query.data.startsWith('user_stats:')) return;

    const chatId = query.message.chat.id;
    const session = getSession(chatId);
    const lang = session.lang || 'uz_latin';

    if (!session.user_id) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      return bot.sendMessage(chatId, t(lang, 'not_authorized'));
    }

    bot.answerCallbackQuery(query.id).catch(() => {});

    // Show stats period selection
    if (query.data === 'user:stats') {
      return bot.editMessageText(t(lang, 'menu_stats'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...statsKeyboard(lang, 'user_stats'),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'menu_stats'), statsKeyboard(lang, 'user_stats'));
      });
    }

    // Back to user menu
    if (query.data === 'user_stats:back') {
      return bot.editMessageText(t(lang, 'main_menu'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...userMenuKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'main_menu'), userMenuKeyboard(lang));
      });
    }

    // Show stats for a period
    const period = query.data.replace('user_stats:', '');
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) return;

    const { start, end } = getDateRange(period);
    const patients = patientQueries.getByUserAndDateRange.all(session.user_id, start, end);
    const count = patients.length;

    const paymentQueries = require('../database/queries').paymentQueries;
    const payments = paymentQueries.getByUserAndDateRange.all(session.user_id, start, end);
    const paymentSumRow = paymentQueries.sumByUserAndDateRange.get(session.user_id, start, end);
    const paymentTotal = paymentSumRow ? (paymentSumRow.total || 0) : 0;

    const periodKey = `period_${period}`;
    const user = require('../database/queries').userQueries.findById.get(session.user_id);
    const userName = user ? escapeMarkdown(user.full_name) : '—';

    let text = t(lang, 'stats_title', { name: userName, period: t(lang, periodKey) }) + '\n\n';
    text += t(lang, 'stats_total', { count: String(count) }) + '\n\n';

    if (patients.length > 0) {
      patients.forEach((p, i) => {
        text += t(lang, 'stats_patient_row', {
          i: String(i + 1),
          name: escapeMarkdown(p.full_name),
          region: escapeMarkdown(p.region),
          year: String(p.birth_year),
          department: escapeMarkdown(p.department),
        }) + '\n';
      });
      text += '\n';
    }

    text += t(lang, 'stats_total_payment', { amount: escapeMarkdown(paymentTotal.toLocaleString('ru-RU').replace(/,/g, ' ')) }) + '\n\n';

    if (payments.length > 0) {
      payments.forEach((py, i) => {
        const datePart = py.created_at.split(' ')[0] + ' ' + py.created_at.split(' ')[1].substring(0, 5);
        text += t(lang, 'stats_payment_row', {
          i: String(i + 1),
          amount: escapeMarkdown(py.amount.toLocaleString('ru-RU').replace(/,/g, ' ')),
          date: escapeMarkdown(datePart)
        }) + '\n';
      });
    }

    if (patients.length === 0 && payments.length === 0) {
      text += t(lang, 'stats_empty');
    }

    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'MarkdownV2',
      ...statsKeyboard(lang, 'user_stats'),
    }).catch(() => {
      bot.sendMessage(chatId, text, {
        parse_mode: 'MarkdownV2',
        ...statsKeyboard(lang, 'user_stats'),
      });
    });
  });
}

module.exports = { handleUserStats };
