const { Telegraf, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const i18n = require('telegraf-i18n');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config/config');
const commandHandler = require('./handlers/commandHandler');
const callbackHandler = require('./handlers/callbackHandler');
const inlineQueryHandler = require('./handlers/inlineQueryHandler');
const adminHandler = require('./handlers/adminHandler');
const errorHandler = require('./handlers/errorHandler');
const logger = require('./utils/logger');
const { initDatabase } = require('./database/db');
const { loadFeatures } = require('./features/featureLoader');
const { setupLogger } = require('./middleware/logger');
const { setupAuth } = require('./middleware/auth');
const { setupRateLimiter } = require('./middleware/rateLimiter');

// Initialize bot with token from .env
const bot = new Telegraf(config.BOT_TOKEN);

// Setup localization
const i18nInstance = new i18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'en',
  sessionName: 'session',
  useSession: true,
  templateData: {
    pluralize: count => {
      return count === 1 ? '' : 's';
    }
  }
});

// Initialize database
initDatabase()
  .then(() => logger.info('Database initialized successfully'))
  .catch(err => {
    logger.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Set up middleware
bot.use(new LocalSession({ database: 'sessions.json' }).middleware());
bot.use(i18nInstance.middleware());
bot.use(setupLogger());
bot.use(setupAuth());
bot.use(setupRateLimiter());

// Load dynamic features
loadFeatures(bot)
  .then(featuresCount => {
    logger.info(`Loaded ${featuresCount} features successfully`);
  })
  .catch(err => {
    logger.error('Failed to load features:', err);
  });

// Set up command handlers
commandHandler(bot);

// Set up callback query handler
callbackHandler(bot);

// Set up inline query handler
inlineQueryHandler(bot);

// Set up admin handler
adminHandler(bot);

// Error handling
bot.catch(errorHandler);

// Start the bot
bot.launch()
  .then(() => {
    const botInfo = bot.telegram.getMe();
    logger.info(`Bot started as @${botInfo.username}`);
    
    // Send startup notification to admin
    const startupMessage = `🚀 Bot started successfully!\n\n` +
                         `📊 Node.js: ${process.version}\n` +
                         `🔧 Environment: ${config.NODE_ENV}\n` +
                         `⏱ Started at: ${new Date().toISOString()}`;
    
    config.ADMIN_IDS.forEach(adminId => {
      bot.telegram.sendMessage(adminId, startupMessage)
        .catch(err => logger.error(`Failed to send startup notification to admin ${adminId}:`, err));
    });

    // Send startup log to log channel if configured
    if (config.LOG_CHANNEL_ID) {
      bot.telegram.sendMessage(config.LOG_CHANNEL_ID, `📝 Bot started at ${new Date().toISOString()}`)
        .catch(err => logger.error('Failed to send log to channel:', err));
    }
  })
  .catch(err => {
    logger.error('Error starting bot:', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Export bot for testing purposes
module.exports = bot;
