require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
  ADMIN_ID: parseInt(process.env.ADMIN_ID, 10) || 123456789,
  CLINIC_NAME: process.env.CLINIC_NAME || 'MedLife Klinikasi',
  CLINIC_PHONE: process.env.CLINIC_PHONE || '+998 90 123 45 67',
};
