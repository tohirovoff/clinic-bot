const { t } = require('../locales');

/**
 * Build inline keyboard markup for Telegram.
 * @param {Array<Array<{text: string, callback_data: string}>>} buttons
 */
function inlineKeyboard(buttons) {
  return { reply_markup: { inline_keyboard: buttons } };
}

// ─── Standard Keyboards ─────────────────────────────────────────────

function langKeyboard() {
  return inlineKeyboard([
    [
      { text: "🇺🇿 O'zbek (Lotin)", callback_data: 'lang:uz_latin' },
      { text: '🇺🇿 Ўзбек (Кирилл)', callback_data: 'lang:uz_cyrillic' },
    ],
  ]);
}

function registrationKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'registration'), callback_data: 'register' }],
  ]);
}

function userMenuKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'menu_stats'), callback_data: 'user:stats' }],
  ]);
}

function statsKeyboard(lang, prefix = 'user_stats') {
  return inlineKeyboard([
    [
      { text: t(lang, 'stats_daily'), callback_data: `${prefix}:daily` },
      { text: t(lang, 'stats_weekly'), callback_data: `${prefix}:weekly` },
    ],
    [
      { text: t(lang, 'stats_monthly'), callback_data: `${prefix}:monthly` },
      { text: t(lang, 'stats_yearly'), callback_data: `${prefix}:yearly` },
    ],
    [{ text: t(lang, 'back'), callback_data: `${prefix}:back` }],
  ]);
}

function adminMenuKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'admin_add_user'), callback_data: 'admin:add_user' }],
    [{ text: t(lang, 'admin_add_patient'), callback_data: 'admin:add_patient' }],
    [{ text: t(lang, 'admin_edit_patient'), callback_data: 'admin:edit_patient' }],
    [{ text: t(lang, 'admin_delete_patient'), callback_data: 'admin:delete_patient' }],
    [{ text: t(lang, 'admin_user_list'), callback_data: 'admin:user_list' }],
    [{ text: t(lang, 'admin_overall_stats'), callback_data: 'admin:overall_stats' }],
  ]);
}

function subAdminMenuKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'admin_add_user'), callback_data: 'admin:add_user' }],
    [{ text: t(lang, 'admin_add_patient'), callback_data: 'admin:add_patient' }],
    [{ text: t(lang, 'admin_edit_patient'), callback_data: 'admin:edit_patient' }],
    [{ text: t(lang, 'admin_delete_patient'), callback_data: 'admin:delete_patient' }],
    [{ text: t(lang, 'admin_user_list'), callback_data: 'admin:user_list' }],
    [{ text: t(lang, 'admin_overall_stats'), callback_data: 'admin:overall_stats' }],
  ]);
}

function overallStatsKeyboard(lang) {
  return statsKeyboard(lang, 'overall_stats');
}

function cancelKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'cancel'), callback_data: 'cancel' }],
  ]);
}

function departmentKeyboard(lang) {
  return inlineKeyboard([
    [{ text: t(lang, 'dept_rentgen'), callback_data: 'select_dept:Rengen' }],
    [{ text: t(lang, 'dept_uzi'), callback_data: 'select_dept:Ayollar uzisi' }],
    [{ text: t(lang, 'dept_pediatr'), callback_data: 'select_dept:Uzi' }],
    [{ text: t(lang, 'cancel'), callback_data: 'cancel' }],
  ]);
}

function confirmDeleteKeyboard(lang, userId) {
  return inlineKeyboard([
    [
      { text: t(lang, 'confirm_yes'), callback_data: `delete_user_yes:${userId}` },
      { text: t(lang, 'confirm_no'), callback_data: 'admin:user_list' },
    ],
  ]);
}

function userDetailKeyboard(lang, userId, isSuper = false) {
  const kb = [
    [
      { text: t(lang, 'stats_daily'), callback_data: `admin_user_stats:${userId}:daily` },
      { text: t(lang, 'stats_weekly'), callback_data: `admin_user_stats:${userId}:weekly` },
    ],
    [
      { text: t(lang, 'stats_monthly'), callback_data: `admin_user_stats:${userId}:monthly` },
      { text: t(lang, 'stats_yearly'), callback_data: `admin_user_stats:${userId}:yearly` },
    ]
  ];

  if (isSuper) {
    kb.push([{ text: t(lang, 'admin_delete_user'), callback_data: `delete_user:${userId}` }]);
  }

  kb.push([{ text: t(lang, 'admin_edit_user'), callback_data: `edit_user:${userId}` }]);
  kb.push([{ text: t(lang, 'admin_add_payment'), callback_data: `add_payment:${userId}` }]);
  kb.push([{ text: t(lang, 'back'), callback_data: 'admin:user_list' }]);
  
  return inlineKeyboard(kb);
}

function editUserFieldKeyboard(lang, userId) {
  return inlineKeyboard([
    [{ text: t(lang, 'field_name'), callback_data: `edit_user_field:${userId}:name` }],
    [{ text: t(lang, 'field_region'), callback_data: `edit_user_field:${userId}:region` }],
    [{ text: t(lang, 'field_year'), callback_data: `edit_user_field:${userId}:year` }],
    [{ text: t(lang, 'field_password'), callback_data: `edit_user_field:${userId}:password` }],
    [{ text: t(lang, 'back'), callback_data: `user_detail:${userId}` }],
  ]);
}

function editPatientFieldKeyboard(lang, patientId) {
  return inlineKeyboard([
    [{ text: t(lang, 'field_name'), callback_data: `edit_patient_field:${patientId}:name` }],
    [{ text: t(lang, 'field_region'), callback_data: `edit_patient_field:${patientId}:region` }],
    [{ text: t(lang, 'field_year'), callback_data: `edit_patient_field:${patientId}:year` }],
    [{ text: t(lang, 'field_department'), callback_data: `edit_patient_field:${patientId}:dept` }],
    [{ text: t(lang, 'cancel'), callback_data: `cancel` }],
  ]);
}

module.exports = {
  inlineKeyboard,
  langKeyboard,
  registrationKeyboard,
  userMenuKeyboard,
  statsKeyboard,
  adminMenuKeyboard,
  subAdminMenuKeyboard,
  overallStatsKeyboard,
  cancelKeyboard,
  departmentKeyboard,
  confirmDeleteKeyboard,
  userDetailKeyboard,
  editUserFieldKeyboard,
  editPatientFieldKeyboard,
};
