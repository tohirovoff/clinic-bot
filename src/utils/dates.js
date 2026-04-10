/**
 * Date range helpers for statistics filtering.
 * All calculations are forced to UTC+5 (Tashkent time).
 */

function getTashkentNow() {
  // Get current UTC time and add 5 hours
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5));
}

function getToday() {
  const now = getTashkentNow();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTomorrow() {
  const now = getTashkentNow();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateRange(period) {
  const now = getTashkentNow();
  let start, end;

  switch (period) {
    case 'daily': {
      start = getToday();
      end = getTomorrow();
      break;
    }
    case 'weekly': {
      const day = now.getDay() || 7; // Monday = 1
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      start = formatDate(monday);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      end = formatDate(nextMonday);
      break;
    }
    case 'monthly': {
      const y = now.getFullYear();
      const m = now.getMonth();
      start = formatDate(new Date(y, m, 1));
      end = formatDate(new Date(y, m + 1, 1));
      break;
    }
    case 'yearly': {
      const y = now.getFullYear();
      start = `${y}-01-01`;
      end = `${y + 1}-01-01`;
      break;
    }
    default:
      throw new Error(`Unknown period: ${period}`);
  }

  return { start, end };
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { getDateRange, formatDate, getTashkentNow };
