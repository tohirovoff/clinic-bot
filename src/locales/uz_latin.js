module.exports = {
  lang_name: "O'zbek (Lotin)",

  // General
  welcome: "👋 Assalomu alaykum! Tilni tanlang:",
  registration: "📋 Ro'yxatdan o'tish",
  clinic_info:
    "🏥 *{clinic_name}*\n\n" +
    "Klinikamizga xush kelibsiz\\!\n\n" +
    "📞 Telefon: `{phone}`\n\n" +
    "Ro'yxatdan o'tish uchun yuqoridagi raqamga qo'ng'iroq qiling va admin sizga parol beradi\\.",
  enter_password: "🔑 4 xonali parolni kiriting:",
  wrong_password: "❌ Noto'g'ri parol. Qayta urinib ko'ring.",
  login_success: "✅ Muvaffaqiyatli kirdingiz\\! Xush kelibsiz, *{name}*\\!",
  already_logged_in: "ℹ️ Siz allaqachon tizimga kirgansiz\\.",

  // User menu
  menu_stats: "📊 Statistika",
  stats_daily: "📅 Kunlik",
  stats_weekly: "📆 Haftalik",
  stats_monthly: "🗓 Oylik",
  stats_yearly: "📈 Yillik",
  back: "⬅️ Orqaga",
  main_menu: "🏠 Bosh menyu",

  // Stats display
  stats_title: "📊 *{name} \\- {period} statistikasi*",
  stats_total: "Jami bemorlar: *{count}*",
  stats_empty: "Bu davr uchun bemorlar topilmadi\\.",
  stats_patient_row: "{i}\\. {name} \\- {region} \\({year}\\) \\- {department}",

  // Admin menu
  admin_welcome: "👋 Xush kelibsiz, Admin\\!",
  admin_add_user: "➕ Shifokor qo'shish",
  admin_add_patient: "➕ Bemor qo'shish",
  admin_user_list: "👥 Shifokorlar ro'yxati",
  admin_overall_stats: "📊 Umumiy statistika",

  // Admin — Add user flow
  enter_user_fullname: "👤 Shifokor to'liq ismini kiriting:",
  enter_user_region: "📍 Qayerdanligini kiriting (viloyat/shahar):",
  enter_user_birthyear: "📅 Tug'ilgan yilini kiriting (masalan: 1990):",
  user_added_success:
    "✅ Shifokor muvaffaqiyatli qo'shildi\\!\n\n" +
    "👤 Ism: *{name}*\n" +
    "📍 Hudud: *{region}*\n" +
    "📅 Tug'ilgan yil: *{year}*\n" +
    "🔑 Parol: `{password}`",

  // Admin — Add patient flow
  select_user_for_patient: "👤 Bemorni qaysi shifokor yubordi? Ro'yxatdan tanlang:",
  enter_patient_fullname: "👤 Bemor to'liq ismini kiriting:",
  enter_patient_region: "📍 Bemor qayerdan (viloyat/shahar):",
  enter_patient_birthyear: "📅 Bemor tug'ilgan yilini kiriting (masalan: 1985):",
  enter_patient_department: "🏥 Bemor qaysi bo'limga keldi?",
  dept_rentgen: "Rentgen",
  dept_uzi: "Ayollar UZI",
  dept_pediatr: "Bolalar shifokori",
  patient_added_success:
    "✅ Bemor muvaffaqiyatli qo'shildi\\!\n\n" +
    "👤 Bemor: *{name}*\n" +
    "📍 Hudud: *{region}*\n" +
    "📅 Tug'ilgan yil: *{year}*\n" +
    "🏥 Bo'lim: *{department}*\n" +
    "👥 Shifokor: *{user}*",

  // Admin — User list
  user_list_title: "👥 *Shifokorlar ro'yxati*",
  user_list_item: "{i}\\. {name} \\- {region}",
  user_list_empty: "Hozircha shifokorlar yo'q\\.",
  user_detail:
    "👤 *{name}*\n" +
    "📍 Hudud: {region}\n" +
    "📅 Tug'ilgan yil: {year}\n" +
    "🔑 Parol: `{password}`\n" +
    "📅 Qo'shilgan: {created}",

  // Admin — Overall stats
  overall_stats_title: "📊 *Umumiy statistika \\- {period}*",
  overall_stats_total: "Jami bemorlar: *{count}*",
  overall_stats_by_user: "👤 {name}: *{count}* bemor",
  overall_stats_empty: "Bu davr uchun ma'lumotlar topilmadi\\.",

  // Periods
  period_daily: "Kunlik",
  period_weekly: "Haftalik",
  period_monthly: "Oylik",
  period_yearly: "Yillik",

  // Errors
  not_authorized: "⛔ Sizga ruxsat yo'q. Iltimos, avval ro'yxatdan o'ting.",
  invalid_year: "❌ Noto'g'ri yil formati. Qayta kiriting (masalan: 1990):",
  user_not_found: "❌ Shifokor topilmadi.",
  unknown_command: "❓ Noma'lum buyruq. Menyu tugmalaridan foydalaning.",
  cancel: "❌ Bekor qilish",
  cancelled: "✅ Bekor qilindi.",

  // Delete
  admin_delete_user: "🗑 Shifokor o'chirish",
  confirm_delete_user: "⚠️ *{name}* ni o'chirishni xohlaysizmi? Barcha ma'lumotlari o'chib ketadi\\!",
  confirm_yes: "✅ Ha, o'chirish",
  confirm_no: "❌ Yo'q",
  user_deleted: "✅ *{name}* muvaffaqiyatli o'chirildi\\.",
};
