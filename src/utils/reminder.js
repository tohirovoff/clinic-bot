const cron = require('node-cron');
const config = require('../config');
const { userQueries, patientQueries } = require('../database/queries');
const { getDateRange, getTashkentNow } = require('../utils/dates');
const { pool, prepare } = require('../database/connection');

// ─── Prepared queries for reminder ───────────────────────────────────
const getActiveUserTelegramIds = prepare(`
  SELECT s.telegram_id, s.lang, u.full_name, s.last_reminder_id
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.user_id IS NOT NULL
`);

const getSessionLang = prepare(
  'SELECT lang FROM sessions WHERE telegram_id = ?'
);

const getSessionUserId = prepare(
  'SELECT user_id FROM sessions WHERE telegram_id = ?'
);

const clearAllSessionStates = prepare(
  'UPDATE sessions SET state = NULL, state_data = NULL'
);

// ─── Reminder messages ───────────────────────────────────────────────
const reminderMessages = {
  uz_latin: {
    morning:
      '📢 *Hurmatli foydalanuvchilar\\!*\n' +
      'Musayev Klinikasi o‘z faoliyatini davom ettirmoqda va sizlarga sifatli tibbiy xizmatlarni taklif etadi\\.\n\n' +
      '🏥 *Klinikamizda quyidagi xizmatlar mavjud:*\n' +
      '🔹 UZI \\(ultratovush tekshiruvi\\)\n' +
      '🔹 Rentgen \\(Rengen\\) xizmati\n' +
      '🔹 Ayollar uchun maxsus UZI tekshiruvi\n\n' +
      '👩‍⚕️ Malakali shifokorlar va zamonaviy uskunalar yordamida siz o‘z sog‘lig‘ingizni ishonch bilan tekshirtirishingiz mumkin\\.',
    periodic:
      '📢 *Hurmatli foydalanuvchilar\\!*\n' +
      'Musayev Klinikasi o‘z faoliyatini davom ettirmoqda va sizlarga sifatli tibbiy xizmatlarni taklif etadi\\.\n\n' +
      '🏥 *Klinikamizda quyidagi xizmatlar mavjud:*\n' +
      '🔹 UZI \\(ultratovush tekshiruvi\\)\n' +
      '🔹 Rentgen \\(Rengen\\) xizmati\n' +
      '🔹 Ayollar uchun maxsus UZI tekshiruvi\n\n' +
      '👩‍⚕️ Malakali shifokorlar va zamonaviy uskunalar yordamida siz o‘z sog‘lig‘ingizni ishonch bilan tekshirtirishingiz mumkin\\.',
  },
  uz_cyrillic: {
    morning:
      '📢 *Ҳурматли фойдаланувчилар\\!*\n' +
      'Мусаев Клиникаси ўз фаолиятини давом эттирмоқда ва сизларга сифатли тиббий хизматларни таклиф этади\\.\n\n' +
      '🏥 *Клиникамизда қуйидаги хизматлар мавжуд:*\n' +
      '🔹 УЗИ \\(ультратовуш текшируви\\)\n' +
      '🔹 Рентген \\(Ренген\\) хизмати\n' +
      '🔹 Аёллар учун махсус УЗИ текшируви\n\n' +
      '👩‍⚕️ Малакали шифокорлар ва замонавий ускуналар ёрдамида сиз ўз соғлиғингизни ишонч билан текширтиришингиз мумкин\\.',
    periodic:
      '📢 *Ҳурматли фойдаланувчилар\\!*\n' +
      'Мусаев Клиникаси ўз фаолиятини давом эттирмоқда ва сизларга сифатли тиббий хизматларни таклиф этади\\.\n\n' +
      '🏥 *Клиникамизда қуйидаги хизматлар мавжуд:*\n' +
      '🔹 УЗИ \\(ультратовуш текшируви\\)\n' +
      '🔹 Рентген \\(Ренген\\) хизмати\n' +
      '🔹 Аёллар учун махсус УЗИ текшируви\n\n' +
      '👩‍⚕️ Малакали шифокорлар ва замонавий ускуналар ёрдамида сиз ўз соғлиғингизни ишонч билан текширтиришингиз мумкин\\.',
  },
};

// ─── Admin reminder messages ─────────────────────────────────────────
const adminReminderMessages = {
  uz_latin: {
    morning:
      '🌅 *Xayrli tong, Admin\\!*\n\n' +
      '🏥 *Musayev Klinikasi* faoliyatda\\.\n\n' +
      '📊 Kechagi umumiy natija: *{count}* bemor\n\n' +
      '👥 Faol shifokorlar soni: *{activeUsers}*',
    periodic:
      '🔔 *Eslatma, Admin\\!*\n\n' +
      '📊 Bugungi umumiy natija: *{count}* bemor\n\n' +
      '👥 Faol shifokorlar soni: *{activeUsers}*',
  },
  uz_cyrillic: {
    morning:
      '🌅 *Хайрли тонг, Админ\\!*\n\n' +
      '🏥 *Мусаев Клиникаси* фаолиятда\\.\n\n' +
      '📊 Кечаги умумий натижа: *{count}* бемор\n\n' +
      '👥 Фаол шифокорлар сони: *{activeUsers}*',
    periodic:
      '🔔 *Эслатма, Админ\\!*\n\n' +
      '📊 Бугунги умумий натижа: *{count}* бемор\n\n' +
      '👥 Фаол шифокорлар сони: *{activeUsers}*',
  },
};

/**
 * Send reminder to a single user.
 */
async function sendUserReminder(bot, telegramId, lang, userId, type, session) {
  try {
    const locale = reminderMessages[lang] || reminderMessages.uz_latin;
    let message = locale[type];

    // Get today's/yesterday's patient count for this user
    const { start, end } = getDateRange('daily');
    let count = 0;

    if (type === 'morning') {
      // Morning: show yesterday's results
      const yesterday = getTashkentNow();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStart = formatDateLocal(yesterday);
      const yEnd = start; // today's start = yesterday's end
      const row = await patientQueries.countByUserAndDateRange.get(userId, yStart, yEnd);
      count = row ? row.count : 0;
    } else {
      // Evening: show today's results
      const row = await patientQueries.countByUserAndDateRange.get(userId, start, end);
      count = row ? row.count : 0;
    }

    message = message.replace(/\{count\}/g, String(count));
    
    // Delete old reminder if exists
    if (session.last_reminder_id) {
      bot.deleteMessage(telegramId, session.last_reminder_id).catch(() => {});
    }

    const sent = await bot.sendMessage(telegramId, message, { parse_mode: 'MarkdownV2' });
    if (sent) {
      await sessionQueries.setLastReminderId.run(sent.message_id, telegramId);
    }
  } catch (err) {
    console.error(`Reminder error (user ${telegramId}):`, err.message);
  }
}

/**
 * Send reminder to an admin (super or sub).
 */
async function sendAdminReminder(bot, type, targetId) {
  try {
    const adminSession = await getSessionLang.get(targetId);
    const lang = adminSession ? adminSession.lang : 'uz_latin';
    const locale = adminReminderMessages[lang] || adminReminderMessages.uz_latin;
    let message = locale[type];

    const { start, end } = getDateRange('daily');
    const allUsers = await userQueries.getAll.all();
    const activeUsers = allUsers.length;
    let count = 0;

    if (type === 'morning') {
      const yesterday = getTashkentNow();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStart = formatDateLocal(yesterday);
      const yEnd = start;
      const row = await patientQueries.countByDateRange.get(yStart, yEnd);
      count = row ? row.count : 0;
    } else {
      const row = await patientQueries.countByDateRange.get(start, end);
      count = row ? row.count : 0;
    }

    message = message.replace(/\{count\}/g, String(count));
    message = message.replace(/\{activeUsers\}/g, String(activeUsers));

    // Get admin session to delete old message
    const session = await getSessionLang.get(targetId); // getSessionLang actually returns the whole row in this context? No, let's check.
    // Wait, let's use a more direct way to get last_reminder_id for admin
    const adminSessionRow = await pool.query('SELECT last_reminder_id FROM sessions WHERE telegram_id = $1', [targetId]);
    const lastId = adminSessionRow.rows[0]?.last_reminder_id;
    if (lastId) {
      bot.deleteMessage(targetId, lastId).catch(() => {});
    }

    const sent = await bot.sendMessage(targetId, message, { parse_mode: 'MarkdownV2' });
    if (sent) {
      await sessionQueries.setLastReminderId.run(sent.message_id, targetId);
    }
  } catch (err) {
    console.error(`Admin reminder error (${targetId}):`, err.message);
  }
}

/**
 * Format date as YYYY-MM-DD.
 */
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Send reminders to all active users and all admins.
 */
async function sendReminders(bot, type) {
  const typeMap = {
    morning: '🌅 Ertalabki',
    noon: '🕛 Tushki',
    afternoon: '🕒 Kunduzgi'
  };
  console.log(`📢 ${typeMap[type] || type} eslatmalar yuborilmoqda...`);

  // Send to all logged-in users (skip all admins — they get separate messages)
  const allAdminIds = config.ALL_ADMINS;
  const activeUsers = await getActiveUserTelegramIds.all();
  for (const user of activeUsers) {
    if (allAdminIds.includes(user.telegram_id)) continue;

    const userIdRow = await getSessionUserId.get(user.telegram_id);
    if (userIdRow && userIdRow.user_id) {
      await sendUserReminder(bot, user.telegram_id, user.lang || 'uz_latin', userIdRow.user_id, type, user);
    }
  }

  // Send to all admins (super + sub)
  for (const adminId of allAdminIds) {
    await sendAdminReminder(bot, type, adminId);
  }

  console.log(`✅ Eslatmalar yuborildi (${activeUsers.length} foydalanuvchi, ${allAdminIds.length} admin)`);
}

/**
 * Start the reminder scheduler.
 * Default: Morning at 09:00, Noon at 12:00, Afternoon at 14:00 (Tashkent time).
 */
function startReminderScheduler(bot) {
  const morningTime = config.REMINDER_MORNING || '0 9 * * *';
  const noonTime = config.REMINDER_NOON || '0 12 * * *';
  const afternoonTime = config.REMINDER_AFTERNOON || '0 14 * * *';
  const cleanupTime = config.CLEANUP_MIDNIGHT || '0 0 * * *';

  // Morning reminder
  cron.schedule(morningTime, () => {
    sendReminders(bot, 'morning');
  }, { timezone: 'Asia/Tashkent' });

  // Noon reminder
  cron.schedule(noonTime, () => {
    sendReminders(bot, 'periodic');
  }, { timezone: 'Asia/Tashkent' });

  // Afternoon reminder
  cron.schedule(afternoonTime, () => {
    sendReminders(bot, 'periodic');
  }, { timezone: 'Asia/Tashkent' });

  // No more midnight state clearance as requested
  
  console.log(`⏰ Eslatmalar rejalashtirildi: 09:00, 12:00, 14:00 (Toshkent vaqti)`);
}

module.exports = { startReminderScheduler, sendReminders };
