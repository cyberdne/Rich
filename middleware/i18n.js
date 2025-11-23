const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

function createI18n(options = {}) {
  const directory = options.directory || path.resolve(__dirname, '..', 'locales');
  const defaultLanguage = options.defaultLanguage || 'en';

  // Load available locale files
  let locales = {};
  try {
    const files = fs.readdirSync(directory).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const lang = path.basename(file, '.json');
      try {
        locales[lang] = fs.readJsonSync(path.join(directory, file));
      } catch (err) {
        logger.warn(`Failed to load locale ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.warn(`No locales directory found at ${directory}`);
  }

  function t(ctx, key, vars) {
    const lang = (ctx.session && ctx.session.language) || defaultLanguage;
    const dict = locales[lang] || {};
    let str = dict[key] || key;
    if (vars && typeof vars === 'object') {
      for (const k of Object.keys(vars)) {
        str = str.replace(new RegExp(`\\{\\{\s*${k}\s*\\}\\}`, 'g'), vars[k]);
      }
    }
    return str;
  }

  return {
    middleware() {
      return async (ctx, next) => {
        ctx.i18n = {
          locale(code) {
            if (!ctx.session) ctx.session = {};
            ctx.session.language = code;
          },
          t: (key, vars) => t(ctx, key, vars),
          language: () => (ctx.session && ctx.session.language) || defaultLanguage
        };
        await next();
      };
    }
  };
}

module.exports = createI18n;
