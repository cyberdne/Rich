const { Markup } = require('telegraf');
const { getKeyboardStyle } = require('../database/settings');
const { addUser, updateUserActivity } = require('../database/users');
const { getMainMenuKeyboard } = require('../config/keyboards');
const { getFeaturesDb } = require('../database/db');
const logger = require('../utils/logger');
const config = require('../config/config');
const fs = require('fs-extra');
const path = require('path');

module.exports = (bot) => {
  // Start command
  bot.command('start', async (ctx) => {
    try {
      logger.info(`Start command from user ${ctx.from.id}`);
      
      // Add or update user in database
      const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
      await addUser(ctx.from, isAdmin);
      await updateUserActivity(ctx.from.id);
      
      // Get keyboard style for user
      const keyboardStyle = await getKeyboardStyle(ctx.from.id);
      
      // Get all features
      const featuresDb = getFeaturesDb();
      const features = featuresDb.data?.features || [];
      
      logger.debug(`Start command: user ${ctx.from.id}, keyboard style: ${keyboardStyle}, features: ${features.length}`);
      
      // Send welcome message with main menu
      const welcomeMessage = `🚀 *Welcome to ${config.BOT_NAME}!*\n\n` +
                             `I am a powerful and versatile Telegram bot with many features.\n` +
                             `Use the buttons below to explore what I can do!\n\n` +
                             `🔍 *Need help?* Use /help command for assistance.`;
      
      await ctx.replyWithMarkdown(
        welcomeMessage,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getMainMenuKeyboard(keyboardStyle, features, ctx).inline_keyboard)
        }
      );
    } catch (error) {
      logger.error(`Error in start command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong while starting the bot. Please try again.');
    }
  });
  
  // Help command
  bot.command('help', async (ctx) => {
    try {
      logger.info(`Help command from user ${ctx.from.id}`);
      await updateUserActivity(ctx.from.id);
      
      const helpMessage = `📚 *Bot Help*\n\n` +
                          `Here are the available commands:\n\n` +
                          `*/start* - Start the bot and show main menu\n` +
                          `*/help* - Show this help message\n` +
                          `*/settings* - Configure your bot settings\n` +
                          `*/menu* - Show the main menu\n\n` +
                          `You can also use the inline buttons to navigate through features.`;
      
      await ctx.replyWithMarkdown(helpMessage);
    } catch (error) {
      logger.error(`Error in help command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the help command. Please try again.');
    }
  });
  
  // Settings command
  bot.command('settings', async (ctx) => {
    try {
      logger.info(`Settings command from user ${ctx.from.id}`);
      await updateUserActivity(ctx.from.id);
      
      const { getSettingsKeyboard } = require('../config/keyboards');
      
      await ctx.reply(
        '⚙️ *Settings*\n\nCustomize your bot experience:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getSettingsKeyboard(ctx).inline_keyboard)
        }
      );
    } catch (error) {
      logger.error(`Error in settings command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the settings command. Please try again.');
    }
  });
  
  // Menu command
  bot.command('menu', async (ctx) => {
    try {
      logger.info(`Menu command from user ${ctx.from.id}`);
      await updateUserActivity(ctx.from.id);
      
      // Get keyboard style for user
      const keyboardStyle = await getKeyboardStyle(ctx.from.id);
      
      // Get all features
      const featuresDb = getFeaturesDb();
      const features = featuresDb.data?.features || [];
      
      logger.debug(`Menu command: fetched ${features.length} features for user ${ctx.from.id}`);
      
      await ctx.reply(
        '📋 *Main Menu*\n\nSelect a feature:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getMainMenuKeyboard(keyboardStyle, features, ctx).inline_keyboard)
        }
      );
    } catch (error) {
      logger.error(`Error in menu command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the menu command. Please try again.');
    }
  });
  
  // Admin command
  bot.command('admin', async (ctx) => {
    try {
      logger.info(`Admin command from user ${ctx.from.id}`);
      
      // Check if user is admin
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ You do not have permission to access admin functions.');
      }
      
      await updateUserActivity(ctx.from.id);
      
      const { getAdminKeyboard } = require('../config/keyboards');
      
      await ctx.reply(
        '🔧 *Admin Panel*\n\nWelcome to the admin panel. Select an option:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(getAdminKeyboard(ctx).inline_keyboard)
        }
      );
    } catch (error) {
      logger.error(`Error in admin command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the admin command. Please try again.');
    }
  });
  
  // Stats command (admin only)
  bot.command('stats', async (ctx) => {
    try {
      // Check if user is admin
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ You do not have permission to access statistics.');
      }
      
      logger.info(`Stats command from user ${ctx.from.id}`);
      await updateUserActivity(ctx.from.id);
      
      const { getAllUsers, getActiveUsers } = require('../database/users');
      const { getStatsDb } = require('../database/db');
      
      const users = await getAllUsers();
      const activeUsers = await getActiveUsers();
      const statsDb = getStatsDb();
      
      // Calculate actual statistics from database
      const totalCommands = Object.values(statsDb.data.usageStats.commandsUsed || {})
        .reduce((acc, val) => acc + val, 0);
      const totalFeatureUsage = Object.values(statsDb.data.usageStats.featuresUsed || {})
        .reduce((acc, val) => acc + val, 0);
      const totalInteractions = Object.values(statsDb.data.usageStats.userActivity || {})
        .reduce((acc, val) => acc + (val.callbacksTriggered || 0), 0);
      
      // Get memory stats
      const memUsage = process.memoryUsage();
      
      const statsMessage = `📊 *Bot Statistics*\n\n` +
                          `👥 Total users: ${users.length}\n` +
                          `👤 Active users (30d): ${activeUsers.length}\n` +
                          `🤖 Bot uptime: ${formatUptime(process.uptime())}\n\n` +
                          `*Usage Statistics:*\n` +
                          `📝 Total commands used: ${totalCommands}\n` +
                          `🎯 Total features accessed: ${totalFeatureUsage}\n` +
                          `🔔 Total interactions: ${totalInteractions}\n\n` +
                          `*Top Commands:*\n${formatTopCommands(statsDb.data.usageStats.commandsUsed)}\n\n` +
                          `*Top Features:*\n${formatTopFeatures(statsDb.data.usageStats.featuresUsed)}\n\n` +
                          `*System Resources:*\n` +
                          `🧠 Memory: ${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}`;
      
      await ctx.replyWithMarkdown(statsMessage);
    } catch (error) {
      logger.error(`Error in stats command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the stats command. Please try again.');
    }
  });
  
  // Debug command (admin only)
  bot.command('debug', async (ctx) => {
    try {
      // Check if user is admin
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        return ctx.reply('⛔ You do not have permission to access debug functions.');
      }
      
      logger.info(`Debug command from user ${ctx.from.id}`);
      
      // Parse debug command arguments
      const args = ctx.message.text.split(' ').slice(1);
      if (args.length === 0) {
        // Show debug help
        const debugHelp = `🔍 *Debug Commands*\n\n` +
                          `/debug status - Show system status\n` +
                          `/debug logs [count] - Show recent logs\n` +
                          `/debug config - Show bot configuration\n` +
                          `/debug user [userId] - Show user information\n` +
                          `/debug feature [featureId] - Show feature information\n` +
                          `/debug backup - Create a database backup\n` +
                          `/debug memory - Show memory usage`;
        
        return ctx.replyWithMarkdown(debugHelp);
      }
      
      const debugCommand = args[0].toLowerCase();
      
      switch (debugCommand) {
        case 'status':
          await handleDebugStatus(ctx);
          break;
        case 'logs':
          await handleDebugLogs(ctx, args[1]);
          break;
        case 'config':
          await handleDebugConfig(ctx);
          break;
        case 'user':
          await handleDebugUser(ctx, args[1]);
          break;
        case 'feature':
          await handleDebugFeature(ctx, args[1]);
          break;
        case 'backup':
          await handleDebugBackup(ctx);
          break;
        case 'memory':
          await handleDebugMemory(ctx);
          break;
        default:
          await ctx.reply(`Unknown debug command: ${debugCommand}. Use /debug for help.`);
      }
    } catch (error) {
      logger.error(`Error in debug command: ${error.message}`, error);
      await ctx.reply(`Debug error: ${error.message}`);
    }
  });
  
  // Broadcast command (admin only)
  bot.command('broadcast', async (ctx) => {
    try {
      // Check if user is admin
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
          // Send a rich local banner image (if present) then the welcome message
          const bannerPath = path.resolve(__dirname, '..', 'assets', 'start_banner.svg');

          const welcomeMessage = `🚀 *Welcome to ${config.BOT_NAME}!*
          \n` +
                                 `I am a powerful and versatile Telegram bot with many features.\n` +
                                 `Use the buttons below to explore what I can do!\n\n` +
                                 `🔍 *Need help?* Use /help command for assistance.`;

          try {
            if (await fs.pathExists(bannerPath)) {
              await ctx.replyWithPhoto({ source: fs.createReadStream(bannerPath) });
            }
          } catch (imgErr) {
            logger.debug('Could not send start banner image:', imgErr.message);
          }

          await ctx.replyWithMarkdown(
            welcomeMessage,
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard(getMainMenuKeyboard(keyboardStyle, features, ctx).inline_keyboard)
            }
          );
      
      await ctx.reply(
        `📣 *Broadcast Confirmation*\n\nYou are about to send this message to all users:\n\n${message}\n\nAre you sure?`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Yes, send it', 'broadcast_confirm'),
              Markup.button.callback('❌ Cancel', 'broadcast_cancel')
            ]
          ])
        }
      );
    } catch (error) {
      logger.error(`Error in broadcast command: ${error.message}`, error);
      await ctx.reply('Sorry, something went wrong with the broadcast command. Please try again.');
    }
  });
};

// Debug helper functions
async function handleDebugStatus(ctx) {
  const os = require('os');
  const { version } = require('../package.json');
  
  const status = `🖥 *System Status*\n\n` +
                `Bot version: ${version}\n` +
                `Node.js: ${process.version}\n` +
                `Platform: ${os.platform()} ${os.release()}\n` +
                `Uptime: ${formatUptime(process.uptime())}\n` +
                `Memory: ${formatMemory(process.memoryUsage())}\n` +
                `CPU: ${os.cpus()[0].model}\n` +
                `Load: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}`;
  
  await ctx.replyWithMarkdown(status);
}

async function handleDebugLogs(ctx, countArg) {
  const count = parseInt(countArg) || 10;
  const { getLogsDb } = require('../database/db');
  const logsDb = getLogsDb();
  
  const logs = logsDb.data.logs.slice(-count);
  
  if (logs.length === 0) {
    return ctx.reply('No logs found.');
  }
  
  const logsMessage = `📋 *Recent Logs (${logs.length})*\n\n` +
                      logs.map(log => `[${log.timestamp}] ${log.level}: ${log.message}`).join('\n\n');
  
  // If message is too long, split it
  if (logsMessage.length > 4000) {
    const chunks = logsMessage.match(/.{1,4000}/gs);
    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk);
    }
  } else {
    await ctx.replyWithMarkdown(logsMessage);
  }
}

async function handleDebugConfig(ctx) {
  // Create a sanitized config (without sensitive data)
  const sanitizedConfig = { ...config };
  delete sanitizedConfig.BOT_TOKEN;
  delete sanitizedConfig.OPENAI_API_KEY;
  
  const configMessage = `⚙️ *Bot Configuration*\n\n` +
                       `\`\`\`json\n${JSON.stringify(sanitizedConfig, null, 2)}\n\`\`\``;
  
  await ctx.replyWithMarkdown(configMessage);
}

async function handleDebugUser(ctx, userIdArg) {
  const { getUser } = require('../database/users');
  const userId = parseInt(userIdArg);
  
  if (!userId) {
    return ctx.reply('Please provide a valid user ID. Example: /debug user 123456789');
  }
  
  const user = await getUser(userId);
  
  if (!user) {
    return ctx.reply(`User with ID ${userId} not found.`);
  }
  
  const userInfo = `👤 *User Information*\n\n` +
                  `ID: ${user.id}\n` +
                  `Name: ${user.first_name} ${user.last_name || ''}\n` +
                  `Username: ${user.username ? '@' + user.username : 'None'}\n` +
                  `Admin: ${user.isAdmin ? '✅' : '❌'}\n` +
                  `Language: ${user.settings?.language || 'en'}\n` +
                  `Created: ${user.createdAt}\n` +
                  `Last activity: ${user.lastActivity}\n\n` +
                  `Settings:\n\`\`\`json\n${JSON.stringify(user.settings, null, 2)}\n\`\`\``;
  
  await ctx.replyWithMarkdown(userInfo);
}

async function handleDebugFeature(ctx, featureId) {
  const { getFeaturesDb } = require('../database/db');
  
  if (!featureId) {
    return ctx.reply('Please provide a feature ID. Example: /debug feature example_feature');
  }
  
  const featuresDb = getFeaturesDb();
  const feature = featuresDb.data.features.find(f => f.id === featureId);
  
  if (!feature) {
    return ctx.reply(`Feature with ID ${featureId} not found.`);
  }
  
  const featureInfo = `🔍 *Feature Information*\n\n` +
                     `ID: ${feature.id}\n` +
                     `Name: ${feature.name}\n` +
                     `Emoji: ${feature.emoji}\n` +
                     `Description: ${feature.description}\n` +
                     `Enabled: ${feature.enabled ? '✅' : '❌'}\n` +
                     `Created: ${feature.createdAt}\n\n` +
                     `Submenus: ${feature.submenus?.length || 0}\n` +
                     `Actions: ${feature.actions?.length || 0}\n\n` +
                     `Details:\n\`\`\`json\n${JSON.stringify(feature, null, 2)}\n\`\`\``;
  
  await ctx.replyWithMarkdown(featureInfo);
}

async function handleDebugBackup(ctx) {
  const { backupDatabases } = require('../database/db');
  
  await ctx.reply('Creating database backup...');
  
  try {
    const backupDir = await backupDatabases();
    await ctx.reply(`✅ Database backup created successfully!\nLocation: ${backupDir}`);
  } catch (error) {
    logger.error('Backup error:', error);
    await ctx.reply(`❌ Failed to create backup: ${error.message}`);
  }
}

async function handleDebugMemory(ctx) {
  const memory = process.memoryUsage();
  
  const memoryInfo = `🧠 *Memory Usage*\n\n` +
                    `RSS: ${formatBytes(memory.rss)}\n` +
                    `Heap Total: ${formatBytes(memory.heapTotal)}\n` +
                    `Heap Used: ${formatBytes(memory.heapUsed)}\n` +
                    `External: ${formatBytes(memory.external)}\n` +
                    `Array Buffers: ${formatBytes(memory.arrayBuffers || 0)}\n\n` +
                    `Heap Usage: ${((memory.heapUsed / memory.heapTotal) * 100).toFixed(2)}%`;
  
  await ctx.replyWithMarkdown(memoryInfo);
}

// Utility functions for formatting
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds - minutes * 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatMemory(memory) {
  return `${(memory.rss / 1024 / 1024).toFixed(2)} MB`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatTopCommands(commandsUsed) {
  const commands = Object.entries(commandsUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (commands.length === 0) return 'No commands used yet';
  
  return commands.map(([cmd, count]) => `/${cmd}: ${count}`).join('\n');
}

function formatTopFeatures(featuresUsed) {
  const features = Object.entries(featuresUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (features.length === 0) return 'No features used yet';
  
  return features.map(([feature, count]) => `${feature}: ${count}`).join('\n');
}
