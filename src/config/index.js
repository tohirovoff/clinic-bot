require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
  ADMIN_ID: parseInt(process.env.ADMIN_ID, 10) || 123456789,
  SUB_ADMIN_1: parseInt(process.env.SUB_ADMIN_1, 10) || 0,
  SUB_ADMIN_2: parseInt(process.env.SUB_ADMIN_2, 10) || 0,
  CLINIC_NAME: process.env.CLINIC_NAME || 'MedLife Klinikasi',
  CLINIC_PHONE: process.env.CLINIC_PHONE || '+998 90 123 45 67',

  // Reminder schedule (cron format) — default: 09:00 and 18:00 Tashkent time
  REMINDER_MORNING: process.env.REMINDER_MORNING || '0 9 * * *',
  REMINDER_EVENING: process.env.REMINDER_EVENING || '0 18 * * *',
};

// Computed properties
const cfg = module.exports;
cfg.SUB_ADMINS = [cfg.SUB_ADMIN_1, cfg.SUB_ADMIN_2].filter(id => id !== 0);
cfg.ALL_ADMINS = [cfg.ADMIN_ID, ...cfg.SUB_ADMINS];
