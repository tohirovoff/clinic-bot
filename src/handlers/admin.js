const config = require('../config');
const { t } = require('../locales');
const {
  userQueries,
  patientQueries,
  sessionQueries,
  paymentQueries,
} = require('../database/queries');
const { getSession, isAdmin, isSuperAdmin, isSubAdmin, escapeMarkdown } = require('../utils/helpers');
const { generatePassword } = require('../utils/password');
const { getDateRange } = require('../utils/dates');
const {
  adminMenuKeyboard,
  subAdminMenuKeyboard,
  cancelKeyboard,
  inlineKeyboard,
  overallStatsKeyboard,
  userDetailKeyboard,
  confirmDeleteKeyboard,
  departmentKeyboard,
  editUserFieldKeyboard,
  editPatientFieldKeyboard,
} = require('../keyboards');

/**
 * Get the correct menu keyboard for the admin role.
 */
function getMenuKeyboard(chatId, lang) {
  if (isSuperAdmin(chatId)) {
    return adminMenuKeyboard(lang);
  }
  return subAdminMenuKeyboard(lang);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Admin menu callback handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleAdminCallbacks(bot) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (!isAdmin(chatId)) return;

    const data = query.data;
    const session = await getSession(chatId);
    const lang = session.lang || 'uz_latin';

    // ── Cancel ────────────────────────────────────────────────────
    if (data === 'cancel') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      await sessionQueries.clearState.run(chatId);
      bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      return bot.sendMessage(chatId, t(lang, 'cancelled'), getMenuKeyboard(chatId, lang));
    }

    // ── Add User (SUPER ADMIN ONLY) ──────────────────────────────
    if (data === 'admin:add_user') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '⛔ Sizda bu amalni bajarishga ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
      }
      await sessionQueries.setState.run('admin_add_user_name', null, chatId);
      return bot.editMessageText(t(lang, 'enter_user_fullname'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_user_fullname'), cancelKeyboard(lang));
      });
    }

    // ── Add Patient ───────────────────────────────────────────────
    if (data === 'admin:add_patient') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const users = await userQueries.getAll.all();
      if (users.length === 0) {
        return bot.editMessageText(t(lang, 'user_list_empty'), {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'MarkdownV2',
          ...getMenuKeyboard(chatId, lang),
        }).catch(() => {
          bot.sendMessage(chatId, t(lang, 'user_list_empty'), {
            parse_mode: 'MarkdownV2',
            ...getMenuKeyboard(chatId, lang),
          });
        });
      }

      const buttons = users.map((u) => [
        { text: `${u.full_name} — ${u.region}`, callback_data: `select_user:${u.id}` },
      ]);
      buttons.push([{ text: t(lang, 'cancel'), callback_data: 'cancel' }]);

      return bot.editMessageText(t(lang, 'select_user_for_patient'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...inlineKeyboard(buttons),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'select_user_for_patient'), inlineKeyboard(buttons));
      });
    }

    // ── Select user for patient ───────────────────────────────────
    if (data.startsWith('select_user:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const userId = parseInt(data.split(':')[1], 10);
      await sessionQueries.setState.run(
        'admin_add_patient_name',
        JSON.stringify({ user_id: userId }),
        chatId
      );
      return bot.editMessageText(t(lang, 'enter_patient_fullname'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_patient_fullname'), cancelKeyboard(lang));
      });
    }

    // ── Select department for patient ─────────────────────────────
    if (data.startsWith('select_dept:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const sessionState = session.state;

      // Handle edit patient department
      if (sessionState === 'admin_edit_patient_field') {
        const stateData = session.state_data ? JSON.parse(session.state_data) : {};
        if (stateData.field !== 'dept') return;
        
        const patientId = stateData.patient_id;
        const department = data.split(':')[1];

        try {
          await patientQueries.update.run({
            id: patientId,
            full_name: null,
            region: null,
            birth_year: null,
            department: department
          });
          await sessionQueries.clearState.run(chatId);
          bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
          return bot.sendMessage(chatId, t(lang, 'edit_success'), {
            ...getMenuKeyboard(chatId, lang)
          });
        } catch (err) {
          console.error('Error updating patient dept:', err);
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
        }
      }

      if (sessionState !== 'admin_add_patient_department') return;

      const department = data.split(':')[1];
      const stateData = session.state_data ? JSON.parse(session.state_data) : {};
      stateData.department = department;

      try {
        await patientQueries.create.run({
          user_id: stateData.user_id,
          full_name: stateData.full_name,
          region: stateData.region,
          birth_year: stateData.year,
          department: stateData.department,
        });
      } catch (err) {
        console.error('Error creating patient:', err);
        await sessionQueries.clearState.run(chatId);
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        return bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
      }

      const user = await userQueries.findById.get(stateData.user_id);
      await sessionQueries.clearState.run(chatId);

      let deptText = department;
      if (department === 'Rengen') deptText = t(lang, 'dept_rentgen');
      if (department === 'Ayollar uzisi') deptText = t(lang, 'dept_uzi');
      if (department === 'Uzi') deptText = t(lang, 'dept_pediatr');

      const successText = t(lang, 'patient_added_success', {
        name: escapeMarkdown(stateData.full_name),
        region: escapeMarkdown(stateData.region),
        year: String(stateData.year),
        department: escapeMarkdown(deptText),
        user: escapeMarkdown(user ? user.full_name : '—'),
      });

      bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      return bot.sendMessage(chatId, successText, {
        parse_mode: 'MarkdownV2',
        ...getMenuKeyboard(chatId, lang),
      });
    }

    // ── User List (ALL ADMINS) ─────────────────────────────
    if (data === 'admin:user_list') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      return showUserList(bot, chatId, query.message.message_id, lang);
    }

    // ── Delete Patient (ALL ADMINS) ──────────────────────────────
    if (data === 'admin:delete_patient') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      await sessionQueries.setState.run('admin_delete_patient_id', null, chatId);
      return bot.editMessageText(t(lang, 'enter_patient_id_to_delete'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_patient_id_to_delete'), cancelKeyboard(lang));
      });
    }

    // ── Edit Patient (ALL ADMINS) ────────────────────────────────
    if (data === 'admin:edit_patient') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      await sessionQueries.setState.run('admin_edit_patient_id', null, chatId);
      return bot.editMessageText(t(lang, 'enter_patient_id_to_edit'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_patient_id_to_edit'), cancelKeyboard(lang));
      });
    }

    // ── User Detail (ALL ADMINS) ───────────────────────────
    if (data.startsWith('user_detail:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const userId = parseInt(data.split(':')[1], 10);
      return showUserDetail(bot, chatId, query.message.message_id, lang, userId, isSuperAdmin(chatId));
    }

    // ── Edit User (ALL ADMINS) ───────────────────────────────────
    if (data.startsWith('edit_user:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const userId = parseInt(data.split(':')[1], 10);
      return bot.editMessageText(t(lang, 'select_field_to_edit'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...editUserFieldKeyboard(lang, userId)
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'select_field_to_edit'), editUserFieldKeyboard(lang, userId));
      });
    }

    // ── Edit User Field Selection ────────────────────────────────
    if (data.startsWith('edit_user_field:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const parts = data.split(':');
      const userId = parseInt(parts[1], 10);
      const field = parts[2];

      await sessionQueries.setState.run(
        'admin_edit_user_field',
        JSON.stringify({ user_id: userId, field }),
        chatId
      );
      return bot.editMessageText(t(lang, 'enter_new_value'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_new_value'), cancelKeyboard(lang));
      });
    }

    // ── Edit Patient Field Selection ────────────────────────────────
    if (data.startsWith('edit_patient_field:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const parts = data.split(':');
      const patientId = parseInt(parts[1], 10);
      const field = parts[2];

      await sessionQueries.setState.run(
        'admin_edit_patient_field',
        JSON.stringify({ patient_id: patientId, field }),
        chatId
      );
      
      if (field === 'dept') {
        return bot.editMessageText(t(lang, 'enter_patient_department'), {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...departmentKeyboard(lang),
        }).catch(() => {
          bot.sendMessage(chatId, t(lang, 'enter_patient_department'), departmentKeyboard(lang));
        });
      }

      return bot.editMessageText(t(lang, 'enter_new_value'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_new_value'), cancelKeyboard(lang));
      });
    }

    // ── User Stats (admin viewing a user — ALL ADMINS) ─────
    if (data.startsWith('admin_user_stats:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const parts = data.split(':');
      const userId = parseInt(parts[1], 10);
      const period = parts[2];
      return showUserStatsForAdmin(bot, chatId, query.message.message_id, lang, userId, period, isSuperAdmin(chatId));
    }

    // ── Add Payment (ALL ADMINS) ──────────────────────────────────
    if (data.startsWith('add_payment:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const userId = parseInt(data.split(':')[1], 10);
      await sessionQueries.setState.run(
        'admin_add_payment_amount',
        JSON.stringify({ user_id: userId }),
        chatId
      );
      return bot.editMessageText(t(lang, 'enter_payment_amount'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...cancelKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'enter_payment_amount'), cancelKeyboard(lang));
      });
    }

    // ── Delete User (confirm — SUPER ADMIN ONLY) ─────────────────
    if (data.startsWith('delete_user:') && !data.startsWith('delete_user_yes:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      if (!isSuperAdmin(chatId)) {
        return bot.sendMessage(chatId, '⛔ Sizda bu amalni bajarishga ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
      }
      const userId = parseInt(data.split(':')[1], 10);
      const user = await userQueries.findById.get(userId);
      if (!user) return;

      const escapedName = escapeMarkdown(user.full_name);
      return bot.editMessageText(t(lang, 'confirm_delete_user', { name: escapedName }), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'MarkdownV2',
        ...confirmDeleteKeyboard(lang, userId),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'confirm_delete_user', { name: escapedName }), {
          parse_mode: 'MarkdownV2',
          ...confirmDeleteKeyboard(lang, userId),
        });
      });
    }

    // ── Delete User (execute — SUPER ADMIN ONLY) ─────────────────
    if (data.startsWith('delete_user_yes:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      if (!isSuperAdmin(chatId)) {
        return bot.sendMessage(chatId, '⛔ Sizda bu amalni bajarishga ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
      }
      const userId = parseInt(data.split(':')[1], 10);
      const user = await userQueries.findById.get(userId);
      if (!user) return;

      const escapedName = escapeMarkdown(user.full_name);
      await sessionQueries.deleteByUserId.run(userId);
      await userQueries.deleteById.run(userId);

      return bot.editMessageText(t(lang, 'user_deleted', { name: escapedName }), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'MarkdownV2',
        ...adminMenuKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'user_deleted', { name: escapedName }), {
          parse_mode: 'MarkdownV2',
          ...adminMenuKeyboard(lang),
        });
      });
    }

    // ── Overall Stats Menu ────────────────────────────────────────
    if (data === 'admin:overall_stats') {
      bot.answerCallbackQuery(query.id).catch(() => {});
      return bot.editMessageText(t(lang, 'admin_overall_stats'), {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...overallStatsKeyboard(lang),
      }).catch(() => {
        bot.sendMessage(chatId, t(lang, 'admin_overall_stats'), overallStatsKeyboard(lang));
      });
    }

    // ── Overall Stats Period ──────────────────────────────────────
    if (data.startsWith('overall_stats:')) {
      bot.answerCallbackQuery(query.id).catch(() => {});
      const period = data.replace('overall_stats:', '');

      if (period === 'back') {
        return bot.editMessageText(t(lang, 'admin_welcome'), {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...getMenuKeyboard(chatId, lang),
        }).catch(() => {
          bot.sendMessage(chatId, t(lang, 'admin_welcome'), getMenuKeyboard(chatId, lang));
        });
      }

      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) return;

      return showOverallStats(bot, chatId, query.message.message_id, lang, period);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Admin text input handler (multi-step forms)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleAdminTextInput(bot) {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;

    const session = await getSession(chatId);
    if (!session.state || !session.state.startsWith('admin_')) return;

    const lang = session.lang || 'uz_latin';
    const stateData = session.state_data ? JSON.parse(session.state_data) : {};
    const input = msg.text.trim();

    switch (session.state) {
      // ── Add User Flow (SUPER ADMIN ONLY) ────────────────────
      case 'admin_add_user_name': {
        if (!isAdmin(chatId)) {
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '⛔ Ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
        }
        stateData.full_name = input;
        await sessionQueries.setState.run(
          'admin_add_user_region',
          JSON.stringify(stateData),
          chatId
        );
        bot.sendMessage(chatId, t(lang, 'enter_user_region'), cancelKeyboard(lang));
        break;
      }

      case 'admin_add_user_region': {
        if (!isAdmin(chatId)) {
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '⛔ Ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
        }
        stateData.region = input;
        await sessionQueries.setState.run(
          'admin_add_user_year',
          JSON.stringify(stateData),
          chatId
        );
        bot.sendMessage(chatId, t(lang, 'enter_user_birthyear'), cancelKeyboard(lang));
        break;
      }

      case 'admin_add_user_year': {
        if (!isAdmin(chatId)) {
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '⛔ Ruxsat yo\'q.', getMenuKeyboard(chatId, lang));
        }
        const year = parseInt(input, 10);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
          return bot.sendMessage(chatId, t(lang, 'invalid_year'), cancelKeyboard(lang));
        }

        const password = await generatePassword();
        try {
          await userQueries.create.run({
            full_name: stateData.full_name,
            region: stateData.region,
            birth_year: year,
            password,
          });
        } catch (err) {
          console.error('Error creating user:', err);
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', adminMenuKeyboard(lang));
        }

        await sessionQueries.clearState.run(chatId);

        const successText = t(lang, 'user_added_success', {
          name: escapeMarkdown(stateData.full_name),
          region: escapeMarkdown(stateData.region),
          year: String(year),
          password,
        });

        bot.sendMessage(chatId, successText, {
          parse_mode: 'MarkdownV2',
          ...adminMenuKeyboard(lang),
        });
        break;
      }

      // ── Add Patient Flow (ALL ADMINS) ─────────────────────────
      case 'admin_add_patient_name': {
        stateData.full_name = input;
        await sessionQueries.setState.run(
          'admin_add_patient_region',
          JSON.stringify(stateData),
          chatId
        );
        bot.sendMessage(chatId, t(lang, 'enter_patient_region'), cancelKeyboard(lang));
        break;
      }

      case 'admin_add_patient_region': {
        stateData.region = input;
        await sessionQueries.setState.run(
          'admin_add_patient_year',
          JSON.stringify(stateData),
          chatId
        );
        bot.sendMessage(chatId, t(lang, 'enter_patient_birthyear'), cancelKeyboard(lang));
        break;
      }

      case 'admin_add_patient_year': {
        const year = parseInt(input, 10);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
          return bot.sendMessage(chatId, t(lang, 'invalid_year'), cancelKeyboard(lang));
        }

        stateData.year = year;
        await sessionQueries.setState.run(
          'admin_add_patient_department',
          JSON.stringify(stateData),
          chatId
        );
        bot.sendMessage(chatId, t(lang, 'enter_patient_department'), departmentKeyboard(lang));
        break;
      }

      // ── Add Payment Flow (ALL ADMINS) ─────────────────────────
      case 'admin_add_payment_amount': {
        const amountStr = input.replace(/\D/g, ''); // Extract only numbers
        const amount = parseInt(amountStr, 10);
        
        if (isNaN(amount) || amount <= 0) {
          return bot.sendMessage(chatId, t(lang, 'invalid_amount'), cancelKeyboard(lang));
        }

        const userId = stateData.user_id;

        try {
          await paymentQueries.create.run({
            user_id: userId,
            amount: amount,
            admin_id: chatId,
          });
        } catch (err) {
          console.error('Error creating payment:', err);
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
        }

        const user = await userQueries.findById.get(userId);
        await sessionQueries.clearState.run(chatId);

        const successText = t(lang, 'payment_added_success', {
          name: escapeMarkdown(user ? user.full_name : '—'),
          amount: escapeMarkdown(amount.toLocaleString('ru-RU').replace(/,/g, ' ')),
        });

        bot.sendMessage(chatId, successText, {
          parse_mode: 'MarkdownV2',
          ...getMenuKeyboard(chatId, lang),
        });
        break;
      }

      // ── Delete Patient Flow (ALL ADMINS) ─────────────────────────
      case 'admin_delete_patient_id': {
        const patientId = parseInt(input, 10);
        if (isNaN(patientId)) {
          return bot.sendMessage(chatId, t(lang, 'patient_not_found'), cancelKeyboard(lang));
        }

        const patient = await patientQueries.findById.get(patientId);
        
        const dept = config.SUB_ADMIN_DEPARTMENTS[chatId];
        if (!patient || (dept && patient.department !== dept && !isSuperAdmin(chatId))) {
           await sessionQueries.clearState.run(chatId);
           return bot.sendMessage(chatId, t(lang, 'patient_not_found'), getMenuKeyboard(chatId, lang));
        }

        try {
          await patientQueries.deleteById.run(patientId);
        } catch (err) {
          console.error('Error deleting patient:', err);
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
        }

        await sessionQueries.clearState.run(chatId);

        bot.sendMessage(chatId, t(lang, 'patient_deleted_success'), {
          ...getMenuKeyboard(chatId, lang),
        });
        break;
      }

      // ── Edit Patient Flow (ALL ADMINS) ─────────────────────────
      case 'admin_edit_patient_id': {
        const patientId = parseInt(input, 10);
        if (isNaN(patientId)) {
          return bot.sendMessage(chatId, t(lang, 'patient_not_found'), cancelKeyboard(lang));
        }

        const patient = await patientQueries.findById.get(patientId);
        
        const dept = config.SUB_ADMIN_DEPARTMENTS[chatId];
        if (!patient || (dept && patient.department !== dept && !isSuperAdmin(chatId))) {
           await sessionQueries.clearState.run(chatId);
           return bot.sendMessage(chatId, t(lang, 'patient_not_found'), getMenuKeyboard(chatId, lang));
        }

        await sessionQueries.clearState.run(chatId);
        bot.sendMessage(chatId, t(lang, 'select_field_to_edit'), editPatientFieldKeyboard(lang, patientId));
        break;
      }

      // ── Edit User Field Value ─────────────────────────────────────
      case 'admin_edit_user_field': {
        const userId = stateData.user_id;
        const field = stateData.field;
        let user = await userQueries.findById.get(userId);
        if (!user) {
          await sessionQueries.clearState.run(chatId);
          return bot.sendMessage(chatId, t(lang, 'user_not_found'), getMenuKeyboard(chatId, lang));
        }

        let updateData = { id: userId, full_name: null, region: null, birth_year: null, password: null };
        
        if (field === 'year') {
           const year = parseInt(input, 10);
           if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
             return bot.sendMessage(chatId, t(lang, 'invalid_year'), cancelKeyboard(lang));
           }
           updateData.birth_year = year;
        } else if (field === 'name') {
           updateData.full_name = input;
        } else if (field === 'region') {
           updateData.region = input;
        } else if (field === 'password') {
           updateData.password = input;
        }

        try {
          await userQueries.update.run(updateData);
          await sessionQueries.clearState.run(chatId);
          bot.sendMessage(chatId, t(lang, 'edit_success'), getMenuKeyboard(chatId, lang));
        } catch (err) {
          console.error('Error updating user:', err);
          await sessionQueries.clearState.run(chatId);
          bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
        }
        break;
      }

      // ── Edit Patient Field Value ──────────────────────────────────
      case 'admin_edit_patient_field': {
        const patientId = stateData.patient_id;
        const field = stateData.field;
        let patient = await patientQueries.findById.get(patientId);
        const dept = config.SUB_ADMIN_DEPARTMENTS[chatId];

        if (!patient || (dept && patient.department !== dept && !isSuperAdmin(chatId))) {
           await sessionQueries.clearState.run(chatId);
           return bot.sendMessage(chatId, t(lang, 'patient_not_found'), getMenuKeyboard(chatId, lang));
        }

        let updateData = { id: patientId, full_name: null, region: null, birth_year: null, department: null };
        
        if (field === 'year') {
           const year = parseInt(input, 10);
           if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
             return bot.sendMessage(chatId, t(lang, 'invalid_year'), cancelKeyboard(lang));
           }
           updateData.birth_year = year;
        } else if (field === 'name') {
           updateData.full_name = input;
        } else if (field === 'region') {
           updateData.region = input;
        } else if (field === 'dept') {
           updateData.department = input; // Covered by select_dept: mostly, but just in case
        }

        try {
          await patientQueries.update.run(updateData);
          await sessionQueries.clearState.run(chatId);
          bot.sendMessage(chatId, t(lang, 'edit_success'), getMenuKeyboard(chatId, lang));
        } catch (err) {
          console.error('Error updating patient:', err);
          await sessionQueries.clearState.run(chatId);
          bot.sendMessage(chatId, '❌ Xatolik yuz berdi.', getMenuKeyboard(chatId, lang));
        }
        break;
      }

      default:
        break;
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helper: Show user list (ALL ADMINS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function showUserList(bot, chatId, messageId, lang) {
  const users = await userQueries.getAll.all();

  if (users.length === 0) {
    return bot.editMessageText(t(lang, 'user_list_empty'), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'MarkdownV2',
      ...getMenuKeyboard(chatId, lang),
    }).catch(() => {
      bot.sendMessage(chatId, t(lang, 'user_list_empty'), {
        parse_mode: 'MarkdownV2',
        ...getMenuKeyboard(chatId, lang),
      });
    });
  }

  const buttons = users.map((u, i) => [
    {
      text: `${i + 1}. ${u.full_name} — ${u.region}`,
      callback_data: `user_detail:${u.id}`,
    },
  ]);
  buttons.push([{ text: t(lang, 'back'), callback_data: 'admin_back_to_menu' }]);

  bot.editMessageText(t(lang, 'user_list_title'), {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'MarkdownV2',
    ...inlineKeyboard(buttons),
  }).catch(() => {
    bot.sendMessage(chatId, t(lang, 'user_list_title'), {
      parse_mode: 'MarkdownV2',
      ...inlineKeyboard(buttons),
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helper: Show user detail (ALL ADMINS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function showUserDetail(bot, chatId, messageId, lang, userId, isSuper) {
  const user = await userQueries.findById.get(userId);
  if (!user) {
    return bot.editMessageText(t(lang, 'user_not_found'), {
      chat_id: chatId,
      message_id: messageId,
      ...getMenuKeyboard(chatId, lang),
    }).catch(() => {});
  }

  const text = t(lang, 'user_detail', {
    name: escapeMarkdown(user.full_name),
    region: escapeMarkdown(user.region),
    year: String(user.birth_year),
    password: user.password,
    created: escapeMarkdown(user.created_at),
  });

  bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'MarkdownV2',
    ...userDetailKeyboard(lang, userId, isSuper),
  }).catch(() => {
    bot.sendMessage(chatId, text, {
      parse_mode: 'MarkdownV2',
      ...userDetailKeyboard(lang, userId, isSuper),
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helper: Show user stats (ALL ADMINS viewing a specific user)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function showUserStatsForAdmin(bot, chatId, messageId, lang, userId, period, isSuper) {
  const user = await userQueries.findById.get(userId);
  if (!user) return;

  const { start, end } = getDateRange(period);
  const dept = config.SUB_ADMIN_DEPARTMENTS[chatId];
  
  let patients, payments, paymentTotal;
  if (!isSuperAdmin(chatId)) {
    // Sub-admin: filter patients by department and payments by their own ID
    patients = dept ? await patientQueries.getByUserDateRangeAndDept.all(userId, start, end, dept) : [];
    payments = await paymentQueries.getByUserDateRangeAndAdmin.all(userId, start, end, chatId);
    const paymentSumRow = await paymentQueries.sumByUserDateRangeAndAdmin.get(userId, start, end, chatId);
    paymentTotal = paymentSumRow ? (paymentSumRow.total || 0) : 0;
  } else {
    // Super-admin: see everything
    patients = await patientQueries.getByUserAndDateRange.all(userId, start, end);
    payments = await paymentQueries.getByUserAndDateRange.all(userId, start, end);
    const paymentSumRow = await paymentQueries.sumByUserAndDateRange.get(userId, start, end);
    paymentTotal = paymentSumRow ? (paymentSumRow.total || 0) : 0;
  }
  const count = patients.length;

  const periodKey = `period_${period}`;
  const userName = escapeMarkdown(user.full_name);

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
        id: String(p.id),
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
    message_id: messageId,
    parse_mode: 'MarkdownV2',
    ...userDetailKeyboard(lang, userId, isSuper),
  }).catch(() => {
    bot.sendMessage(chatId, text, {
      parse_mode: 'MarkdownV2',
      ...userDetailKeyboard(lang, userId, isSuper),
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Helper: Show overall stats (ALL ADMINS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function showOverallStats(bot, chatId, messageId, lang, period) {
  const { start, end } = getDateRange(period);
  const dept = config.SUB_ADMIN_DEPARTMENTS[chatId];
  
  let totalRow, perUser, totalPayment, paymentPerUser;
  if (!isSuperAdmin(chatId)) {
    // Sub-admin: restricted view
    totalRow = dept ? await patientQueries.countByDateRangeAndDept.get(start, end, dept) : { count: 0 };
    perUser = dept ? await patientQueries.countPerUserDateRangeAndDept.all(start, end, dept) : [];
    
    // Payments made by THIS sub-admin
    const paymentSumRow = await paymentQueries.sumByDateRangeAndAdmin.get(start, end, chatId);
    totalPayment = paymentSumRow ? (paymentSumRow.total || 0) : 0;
    paymentPerUser = await paymentQueries.sumPerUserDateRangeAndAdmin.all(start, end, chatId);
  } else {
    // Super-admin: see everything
    totalRow = await patientQueries.countByDateRange.get(start, end);
    perUser = await patientQueries.countPerUserByDateRange.all(start, end);
    
    const paymentSumRow = await paymentQueries.sumByDateRange.get(start, end);
    totalPayment = paymentSumRow ? (paymentSumRow.total || 0) : 0;
    paymentPerUser = await paymentQueries.sumPerUserByDateRange.all(start, end);
  }

  const periodKey = `period_${period}`;
  let text = t(lang, 'overall_stats_title', { period: t(lang, periodKey) }) + '\n\n';
  text += t(lang, 'overall_stats_total', { count: String(totalRow.count) }) + '\n';
  text += t(lang, 'overall_stats_total_payment', { amount: escapeMarkdown(totalPayment.toLocaleString('ru-RU').replace(/,/g, ' ')) }) + '\n\n';

  const usersMap = {};
  perUser.forEach(u => {
    usersMap[u.id] = { name: u.full_name, patients: u.count, payments: 0 };
  });
  paymentPerUser.forEach(p => {
    if (!usersMap[p.id]) {
      usersMap[p.id] = { name: p.full_name, patients: 0, payments: p.total || 0 };
    } else {
      usersMap[p.id].payments = p.total || 0;
    }
  });

  const merged = Object.values(usersMap).sort((a, b) => b.patients - a.patients);

  if (merged.length === 0) {
    text += t(lang, 'overall_stats_empty');
  } else {
    merged.forEach((u) => {
      text += t(lang, 'overall_stats_by_user', {
        name: escapeMarkdown(u.name),
        count: String(u.patients),
      }) + '\n';
      if (u.payments > 0) {
        text += '  ' + t(lang, 'stats_total_payment', { amount: escapeMarkdown(u.payments.toLocaleString('ru-RU').replace(/,/g, ' ')) }) + '\n';
      }
    });
  }

  bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'MarkdownV2',
    ...overallStatsKeyboard(lang),
  }).catch(() => {
    bot.sendMessage(chatId, text, {
      parse_mode: 'MarkdownV2',
      ...overallStatsKeyboard(lang),
    });
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Admin back-to-menu callback
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleAdminBackToMenu(bot) {
  bot.on('callback_query', async (query) => {
    if (query.data !== 'admin_back_to_menu') return;
    const chatId = query.message.chat.id;
    if (!isAdmin(chatId)) return;

    const session = await getSession(chatId);
    const lang = session.lang || 'uz_latin';
    bot.answerCallbackQuery(query.id).catch(() => {});

    bot.editMessageText(t(lang, 'admin_welcome'), {
      chat_id: chatId,
      message_id: query.message.message_id,
      ...getMenuKeyboard(chatId, lang),
    }).catch(() => {
      bot.sendMessage(chatId, t(lang, 'admin_welcome'), getMenuKeyboard(chatId, lang));
    });
  });
}

module.exports = {
  handleAdminCallbacks,
  handleAdminTextInput,
  handleAdminBackToMenu,
};
