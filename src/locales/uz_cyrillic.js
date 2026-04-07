module.exports = {
  lang_name: "Ўзбек (Кирилл)",

  // General
  welcome: "👋 Ассалому алайкум! Тилни танланг:",
  registration: "📋 Рўйхатдан ўтиш",
  clinic_info:
    "🏥 *{clinic_name}*\n\n" +
    "Клиникамизга хуш келибсиз\\!\n\n" +
    "📞 Телефон: `{phone}`\n\n" +
    "Рўйхатдан ўтиш учун юқоридаги рақамга қўнғироқ қилинг ва админ сизга парол беради\\.",
  enter_password: "🔑 4 хонали паролни киритинг:",
  wrong_password: "❌ Нотўғри парол. Қайта уриниб кўринг.",
  login_success: "✅ Муваффақиятли кирдингиз\\! Хуш келибсиз, *{name}*\\!",
  already_logged_in: "ℹ️ Сиз аллақачон тизимга кирганасиз\\.",

  // User menu
  menu_stats: "📊 Статистика",
  stats_daily: "📅 Кунлик",
  stats_weekly: "📆 Ҳафталик",
  stats_monthly: "🗓 Ойлик",
  stats_yearly: "📈 Йиллик",
  back: "⬅️ Орқага",
  main_menu: "🏠 Бош меню",

  // Stats display
  stats_title: "📊 *{name} \\- {period} статистикаси*",
  stats_total: "Жами беморлар: *{count}*",
  stats_empty: "Бу давр учун беморлар топилмади\\.",
  stats_patient_row: "{i}\\. {name} \\- {region} \\({year}\\) \\- {department}",

  // Admin menu
  admin_welcome: "👋 Хуш келибсиз, Админ\\!",
  admin_add_user: "➕ Шифокор қўшиш",
  admin_add_patient: "➕ Бемор қўшиш",
  admin_user_list: "👥 Шифокорлар рўйхати",
  admin_overall_stats: "📊 Умумий статистика",

  // Admin — Add user flow
  enter_user_fullname: "👤 Шифокор тўлиқ исмини киритинг:",
  enter_user_region: "📍 Қаерданлигини киритинг (вилоят/шаҳар):",
  enter_user_birthyear: "📅 Туғилган йилини киритинг (масалан: 1990):",
  user_added_success:
    "✅ Шифокор муваффақиятли қўшилди\\!\n\n" +
    "👤 Исм: *{name}*\n" +
    "📍 Ҳудуд: *{region}*\n" +
    "📅 Туғилган йил: *{year}*\n" +
    "🔑 Парол: `{password}`",

  // Admin — Add patient flow
  select_user_for_patient: "👤 Беморни қайси шифокор юборди? Рўйхатдан танланг:",
  enter_patient_fullname: "👤 Бемор тўлиқ исмини киритинг:",
  enter_patient_region: "📍 Бемор қаердан (вилоят/шаҳар):",
  enter_patient_birthyear: "📅 Бемор туғилган йилини киритинг (масалан: 1985):",
  enter_patient_department: "🏥 Бемор қайси бўлимга келди?",
  dept_rentgen: "Ренген",
  dept_uzi: "Аёллар узиси",
  dept_pediatr: "Узи",
  patient_added_success:
    "✅ Бемор муваффақиятли қўшилди\\!\n\n" +
    "👤 Бемор: *{name}*\n" +
    "📍 Ҳудуд: *{region}*\n" +
    "📅 Туғилган йил: *{year}*\n" +
    "🏥 Бўлим: *{department}*\n" +
    "👥 Шифокор: *{user}*",

  // Admin — User list
  user_list_title: "👥 *Шифокорлар рўйхати*",
  user_list_item: "{i}\\. {name} \\- {region}",
  user_list_empty: "Ҳозирча шифокорлар йўқ\\.",
  user_detail:
    "👤 *{name}*\n" +
    "📍 Ҳудуд: {region}\n" +
    "📅 Туғилган йил: {year}\n" +
    "🔑 Парол: `{password}`\n" +
    "📅 Қўшилган: {created}",

  // Admin — Overall stats
  overall_stats_title: "📊 *Умумий статистика \\- {period}*",
  overall_stats_total: "Жами беморлар: *{count}*",
  overall_stats_by_user: "👤 {name}: *{count}* бемор",
  overall_stats_empty: "Бу давр учун маълумотлар топилмади\\.",

  // Periods
  period_daily: "Кунлик",
  period_weekly: "Ҳафталик",
  period_monthly: "Ойлик",
  period_yearly: "Йиллик",

  // Errors
  not_authorized: "⛔ Сизга рухсат йўқ. Илтимос, аввал рўйхатдан ўтинг.",
  invalid_year: "❌ Нотўғри йил формати. Қайта киритинг (масалан: 1990):",
  user_not_found: "❌ Шифокор топилмади.",
  unknown_command: "❓ Номаълум буйруқ. Меню тугмаларидан фойдаланинг.",
  cancel: "❌ Бекор қилиш",
  cancelled: "✅ Бекор қилинди.",

  // Delete
  admin_delete_user: "🗑 Шифокор ўчириш",
  confirm_delete_user: "⚠️ *{name}* ни ўчиришни хоҳлайсизми? Барча маълумотлари ўчиб кетади\\!",
  confirm_yes: "✅ Ҳа, ўчириш",
  confirm_no: "❌ Йўқ",
  user_deleted: "✅ *{name}* муваффақиятли ўчирилди\\.",
};
