const uzLatin = require('./uz_latin');
const uzCyrillic = require('./uz_cyrillic');

const locales = {
  uz_latin: uzLatin,
  uz_cyrillic: uzCyrillic,
};

/**
 * Get translation text by key for the given language.
 * Supports placeholder replacement: {key} → value.
 */
function t(lang, key, params = {}) {
  const locale = locales[lang] || locales.uz_latin;
  let text = locale[key] || key;

  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }

  return text;
}

module.exports = { t, locales };
