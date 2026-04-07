const cron = require('node-cron');
const config = require('../config');
const { userQueries, patientQueries } = require('../database/queries');
const { getDateRange } = require('../utils/dates');
const db = require('../database/connection');

// ─── Get all active user telegram IDs ────────────────────────────────
const getActiveUserTelegramIds = db.prepare(`
  SELECT s.telegram_id, s.lang, u.full_name
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.user_id IS NOT NULL
`);

// ─── Reminder messages ───────────────────────────────────────────────
const reminderMessages = {
  uz_latin: {
    morning:
      '🌅 *Xayrli tong\\!*\n\n' +
      '🏥 Bugun ham bemorlaringizni klinikamizga yo\'naltiring\\!\n\n' +
      '📊 Kechagi natijangiz: *{count}* bemor\n\n' +
      '💪 Bugun ham yaxshi natijaga erishamiz\\!',
    evening:
      '🌇 *Xayrli kech\\!*\n\n' +
      '📊 Bugungi natijangiz: *{count}* bemor\n\n' +
      '🙏 Bugungi harakatingiz uchun rahmat\\!\n\n' +
      '✨ Ertaga ham davom etamiz\\!',
  },
  uz_cyrillic: {
    morning:
      '🌅 *Хайрли тонг\\!*\n\n' +
      '🏥 Бугун ҳам беморларингизни клиникамизга йўналтиринг\\!\n\n' +
      '📊 Кечаги натижангиз: *{count}* бемор\n\n' +
      '💪 Бугун ҳам яхши натижага эришамиз\\!',
    evening:
      '🌇 *Хайрли кеч\\!*\n\n' +
      '📊 Бугунги натижангиз: *{count}* бемор\n\n' +
      '🙏 Бугунги ҳаракатингиз учун раҳмат\\!\n\n' +
      '✨ Эртага ҳам давом этамиз\\!',
  },
};

// ─── Admin reminder messages ─────────────────────────────────────────
const adminReminderMessages = {
  uz_latin: {
    morning:
      '🌅 *Xayrli tong, Admin\\!*\n\n' +
      '📊 Kechagi umumiy natija: *{count}* bemor\n\n' +
      '👥 Faol shifokorlar soni: *{activeUsers}*\n\n' +
      '🏥 Bugun ham muvaffaqiyatli kun tilaymiz\\!',
    evening:
      '🌇 *Xayrli kech, Admin\\!*\n\n' +
      '📊 Bugungi umumiy natija: *{count}* bemor\n\n' +
      '👥 Faol shifokorlar soni: *{activeUsers}*\n\n' +
      '✅ Bugungi kun yakunlandi\\!',
  },
  uz_cyrillic: {
    morning:
      '🌅 *Хайрли тонг, Админ\\!*\n\n' +
      '📊 Кечаги умумий натижа: *{count}* бемор\n\n' +
      '👥 Фаол шифокорлар сони: *{activeUsers}*\n\n' +
      '🏥 Бугун ҳам муваффақиятли кун тилаймиз\\!',
    evening:
      '🌇 *Хайрли кеч, Админ\\!*\n\n' +
      '📊 Бугунги умумий натижа: *{count}* бемор\n\n' +
      '👥 Фаол шифокорлар сони: *{activeUsers}*\n\n' +
      '✅ Бугунги кун якунланди\\!',
  },
};

/**
 * Send reminder to a single user.
 */
async function sendUserReminder(bot, telegramId, lang, userId, type) {
  try {
    const locale = reminderMessages[lang] || reminderMessages.uz_latin;
    let message = locale[type];

    // Get today's/yesterday's patient count for this user
    const { start, end } = getDateRange('daily');
    let count = 0;

    if (type === 'morning') {
      // Morning: show yesterday's results
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStart = formatDateLocal(yesterday);
      const yEnd = start; // today's start = yesterday's end
      const row = patientQueries.countByUserAndDateRange.get(userId, yStart, yEnd);
      count = row ? row.count : 0;
    } else {
      // Evening: show today's results
      const row = patientQueries.countByUserAndDateRange.get(userId, start, end);
      count = row ? row.count : 0;
    }

    message = message.replace(/\{count\}/g, String(count));
    await bot.sendMessage(telegramId, message, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error(`Reminder error (user ${telegramId}):`, err.message);
  }
}

/**
 * Send reminder to an admin (super or sub).
 */
async function sendAdminReminder(bot, type, targetId) {
  try {
    const adminSession = db.prepare('SELECT lang FROM sessions WHERE telegram_id = ?').get(targetId);
    const lang = adminSession ? adminSession.lang : 'uz_latin';
    const locale = adminReminderMessages[lang] || adminReminderMessages.uz_latin;
    let message = locale[type];

    const { start, end } = getDateRange('daily');
    const activeUsers = userQueries.getAll.all().length;
    let count = 0;

    if (type === 'morning') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStart = formatDateLocal(yesterday);
      const yEnd = start;
      const row = patientQueries.countByDateRange.get(yStart, yEnd);
      count = row ? row.count : 0;
    } else {
      const row = patientQueries.countByDateRange.get(start, end);
      count = row ? row.count : 0;
    }

    message = message.replace(/\{count\}/g, String(count));
    message = message.replace(/\{activeUsers\}/g, String(activeUsers));

    await bot.sendMessage(targetId, message, { parse_mode: 'MarkdownV2' });
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
  console.log(`📢 ${type === 'morning' ? '🌅 Ertalabki' : '🌇 Kechki'} eslatmalar yuborilmoqda...`);

  // Send to all logged-in users (skip all admins — they get separate messages)
  const allAdminIds = config.ALL_ADMINS;
  const activeUsers = getActiveUserTelegramIds.all();
  for (const user of activeUsers) {
    if (allAdminIds.includes(user.telegram_id)) continue;

    const userId = db.prepare('SELECT user_id FROM sessions WHERE telegram_id = ?').get(user.telegram_id);
    if (userId && userId.user_id) {
      await sendUserReminder(bot, user.telegram_id, user.lang || 'uz_latin', userId.user_id, type);
    }
  }

  // Send to all admins (super + sub)
  for (const adminId of allAdminIds) {
    await sendAdminReminder(bot, type, adminId);
  }

  console.log(`✅ ${type === 'morning' ? 'Ertalabki' : 'Kechki'} eslatmalar yuborildi (${activeUsers.length} foydalanuvchi, ${allAdminIds.length} admin)`);
}

/**
 * Start the reminder scheduler.
 * Default: Morning at 09:00, Evening at 18:00 (Tashkent time).
 */
function startReminderScheduler(bot) {
  const morningTime = config.REMINDER_MORNING || '0 9 * * *';
  const eveningTime = config.REMINDER_EVENING || '0 18 * * *';

  // Morning reminder
  cron.schedule(morningTime, () => {
    sendReminders(bot, 'morning');
  }, {
    timezone: 'Asia/Tashkent',
  });

  // Evening reminder
  cron.schedule(eveningTime, () => {
    sendReminders(bot, 'evening');
  }, {
    timezone: 'Asia/Tashkent',
  });

  console.log(`⏰ Eslatmalar rejalashtirild:`);
  console.log(`   🌅 Ertalab: ${morningTime} (Toshkent vaqti)`);
  console.log(`   🌇 Kechqurun: ${eveningTime} (Toshkent vaqti)`);
}

module.exports = { startReminderScheduler, sendReminders };
