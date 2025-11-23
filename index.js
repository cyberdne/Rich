const { Telegraf, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const i18n = require('./middleware/i18n');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config/config');
const commandHandler = require('./handlers/commandHandler');
const callbackHandler = require('./handlers/callbackHandler');
const inlineQueryHandler = require('./handlers/inlineQueryHandler');
const adminHandler = require('./handlers/adminHandler');
const textHandler = require('./handlers/textHandler');
const errorHandler = require('./handlers/errorHandler');
const logger = require('./utils/logger');
const { initDatabase } = require('./database/db');
const { loadFeatures } = require('./features/featureLoader');
const { setupLogger } = require('./middleware/logger');
const { setupAuth } = require('./middleware/auth');
const { setupRateLimiter } = require('./middleware/rateLimiter');
const { setupStatsTracker } = require('./middleware/statsTracker');
const autoFixer = require('./modules/ai/autoFixer');

// Initialize bot with token from .env
const bot = new Telegraf(config.BOT_TOKEN);

// Setup localization
const i18nInstance = i18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'en'
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
bot.use(setupStatsTracker());

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

// Set up generic text handler (for echo flows, etc.)
textHandler(bot);

// Set up admin handler
adminHandler(bot);

// Error handling
bot.catch(errorHandler);

// Start the bot
(async () => {
  try {
    // Basic validation for BOT_TOKEN to avoid hard-to-debug 404 from Telegram
    const TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{35,}$/;
    if (!config.BOT_TOKEN || !TOKEN_REGEX.test(config.BOT_TOKEN)) {
      logger.error('BOT_TOKEN is missing or appears invalid. Please set a valid BOT_TOKEN in your .env file.');
      process.exit(1);
    }
    await bot.launch();
    
    try {
      const botInfo = await bot.telegram.getMe();
      logger.info(`Bot started as @${botInfo.username}`);
    } catch (error) {
      logger.warn('Could not fetch bot info:', error.message);
    }
    
    // Send startup notification to admin (non-blocking)
    const startupMessage = `🚀 Bot started successfully!\n\n` +
                         `📊 Node.js: ${process.version}\n` +
                         `🔧 Environment: ${config.NODE_ENV}\n` +
                         `⏱ Started at: ${new Date().toISOString()}`;
    
    // Use setImmediate to send notifications without blocking
    setImmediate(async () => {
      for (const adminId of config.ADMIN_IDS) {
        try {
          await bot.telegram.sendMessage(adminId, startupMessage);
        } catch (err) {
          logger.error(`Failed to send startup notification to admin ${adminId}:`, err.message);
        }
      }

      // Send startup log to log channel if configured
      if (config.LOG_CHANNEL_ID) {
        try {
          await bot.telegram.sendMessage(config.LOG_CHANNEL_ID, `📝 Bot started at ${new Date().toISOString()}`);
        } catch (err) {
          logger.error('Failed to send log to channel:', err.message);
        }
      }
    });
    
    // Schedule auto-fixer scans if enabled
    if (config.AUTO_FIX_ENABLED) {
      const intervalMs = config.AUTO_FIX_INTERVAL_MS || 1000 * 60 * 5; // default 5 minutes
      setInterval(async () => {
        try {
          await autoFixer.scanAndFix(bot);
        } catch (err) {
          logger.error('AutoFixer periodic scan failed:', err.message);
        }
      }, intervalMs);
      logger.info(`AutoFixer scheduled every ${intervalMs}ms`);
    }
    
    logger.info('Bot is running and listening for updates');
  } catch (err) {
    logger.error('Error starting bot:', err);
    process.exit(1);
  }
})();

// Enable graceful stop
process.once('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    await bot.stop('SIGINT');
    logger.info('Bot stopped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.once('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  try {
    await bot.stop('SIGTERM');
    logger.info('Bot stopped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export bot for testing purposes
module.exports = bot;
