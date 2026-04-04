const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { registerHandlers } = require('./handlers');

// ─── Initialize Bot ──────────────────────────────────────────────────
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🏥 Clinic Referral Bot ishga tushdi!');
console.log(`  👤 Admin ID: ${config.ADMIN_ID}`);
console.log(`  🏥 Klinika: ${config.CLINIC_NAME}`);
console.log(`  📞 Telefon: ${config.CLINIC_PHONE}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ─── Register All Handlers ──────────────────────────────────────────
registerHandlers(bot);

// ─── Error Handling ─────────────────────────────────────────────────
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🔴 Bot to\'xtatilmoqda...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔴 Bot to\'xtatilmoqda...');
  bot.stopPolling();
  process.exit(0);
});
