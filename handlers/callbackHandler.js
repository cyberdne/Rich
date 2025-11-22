const { Markup } = require('telegraf');
const { getKeyboardStyle, setKeyboardStyle, getNotificationStyle, setNotificationStyle, setUserLanguage } = require('../database/settings');
const { updateUserActivity, getUser } = require('../database/users');
const { getFeaturesDb } = require('../database/db');
const config = require('../config/config');
const logger = require('../utils/logger');
const keyboards = require('../config/keyboards');

module.exports = (bot) => {
  // Handle callback queries
  bot.on('callback_query', async (ctx) => {
    try {
      const callbackData = ctx.callbackQuery.data;
      logger.info(`Callback query from user ${ctx.from.id}: ${callbackData}`);
      
      // Update user activity
      await updateUserActivity(ctx.from.id);
      
      // Parse callback data
      if (callbackData === 'main_menu') {
        await handleMainMenu(ctx);
      } else if (callbackData === 'settings') {
        await handleSettings(ctx);
      } else if (callbackData === 'admin' && config.ADMIN_IDS.includes(ctx.from.id)) {
        await handleAdmin(ctx);
      } else if (callbackData.startsWith('settings:')) {
        await handleSettingsOption(ctx, callbackData.split(':')[1]);
      } else if (callbackData.startsWith('set_keyboard_style:')) {
        await handleSetKeyboardStyle(ctx, callbackData.split(':')[1]);
      } else if (callbackData.startsWith('set_notification_style:')) {
        await handleSetNotificationStyle(ctx, callbackData.split(':')[1]);
      } else if (callbackData.startsWith('set_language:')) {
        await handleSetLanguage(ctx, callbackData.split(':')[1]);
      } else if (callbackData.startsWith('feature:')) {
        await handleFeature(ctx, callbackData.split(':')[1]);
      } else if (callbackData.startsWith('submenu:')) {
        const parts = callbackData.split(':');
        await handleSubmenu(ctx, parts[1], parts[2]);
      } else if (callbackData.startsWith('action:')) {
        const parts = callbackData.split(':');
        await handleAction(ctx, parts[1], parts[2]);
      } else if (callbackData.startsWith('admin:')) {
        await handleAdminOption(ctx, callbackData.split(':')[1]);
      } else if (callbackData === 'broadcast_confirm') {
        await handleBroadcastConfirm(ctx);
      } else if (callbackData === 'broadcast_cancel') {
        await handleBroadcastCancel(ctx);
      } else if (callbackData.startsWith('feature_gen:')) {
        await handleFeatureGenerator(ctx, callbackData.split(':')[1]);
      } else {
        // Handle dynamic callbacks from features
        await handleDynamicCallback(ctx, callbackData);
      }
      
      // Answer callback query to remove loading indicator
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error(`Error handling callback query: ${error.message}`, error);
      await ctx.answerCbQuery('An error occurred. Please try again.');
      
      // Send error notification if configured
      if (config.DEBUG_MODE) {
        await ctx.reply(`Error in callback handler: ${error.message}`);
      }
    }
  });
};

// Handle main menu callback
async function handleMainMenu(ctx) {
  try {
    // Get keyboard style for user
    const keyboardStyle = await getKeyboardStyle(ctx.from.id);
    
    // Get all features
    const featuresDb = getFeaturesDb();
    const features = featuresDb.data.features.filter(feature => feature.enabled);
    
    const menuText = '📋 *Main Menu*\n\nSelect a feature:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(menuText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getMainMenuKeyboard(keyboardStyle, features, ctx)
      });
    } catch (error) {
      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getMainMenuKeyboard(keyboardStyle, features, ctx)
      });
    }
  } catch (error) {
    logger.error('Error in handleMainMenu:', error);
    throw error;
  }
}

// Handle settings callback
async function handleSettings(ctx) {
  try {
    const settingsText = '⚙️ *Settings*\n\nCustomize your bot experience:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(settingsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getSettingsKeyboard(ctx)
      });
    } catch (error) {
      await ctx.reply(settingsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getSettingsKeyboard(ctx)
      });
    }
  } catch (error) {
    logger.error('Error in handleSettings:', error);
    throw error;
  }
}

// Handle admin callback
async function handleAdmin(ctx) {
  try {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply('⛔ You do not have permission to access admin functions.');
    }
    
    const adminText = '🔧 *Admin Panel*\n\nWelcome to the admin panel. Select an option:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(adminText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getAdminKeyboard(ctx)
      });
    } catch (error) {
      await ctx.reply(adminText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getAdminKeyboard(ctx)
      });
    }
  } catch (error) {
    logger.error('Error in handleAdmin:', error);
    throw error;
  }
}

// Handle settings options
async function handleSettingsOption(ctx, option) {
  try {
    switch (option) {
      case 'keyboard_style':
        await handleKeyboardStyleSettings(ctx);
        break;
      case 'notification_style':
        await handleNotificationStyleSettings(ctx);
        break;
      case 'language':
        await handleLanguageSettings(ctx);
        break;
      case 'profile':
        await handleProfileSettings(ctx);
        break;
      case 'stats':
        await handleUserStats(ctx);
        break;
      default:
        await ctx.reply(`Unknown settings option: ${option}`);
    }
  } catch (error) {
    logger.error(`Error in handleSettingsOption (${option}):`, error);
    throw error;
  }
}

// Handle keyboard style settings
async function handleKeyboardStyleSettings(ctx) {
  try {
    // Get current keyboard style
    const currentStyle = await getKeyboardStyle(ctx.from.id);
    
    const text = '🎨 *Keyboard Style*\n\nSelect your preferred keyboard style:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getKeyboardStyleSelector(currentStyle)
      });
    } catch (error) {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getKeyboardStyleSelector(currentStyle)
      });
    }
  } catch (error) {
    logger.error('Error in handleKeyboardStyleSettings:', error);
    throw error;
  }
}

// Handle notification style settings
async function handleNotificationStyleSettings(ctx) {
  try {
    // Get current notification style
    const currentStyle = await getNotificationStyle(ctx.from.id);
    
    const text = '🔔 *Notification Style*\n\nSelect your preferred notification style:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getNotificationStyleSelector(currentStyle)
      });
    } catch (error) {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getNotificationStyleSelector(currentStyle)
      });
    }
  } catch (error) {
    logger.error('Error in handleNotificationStyleSettings:', error);
    throw error;
  }
}

// Handle language settings
async function handleLanguageSettings(ctx) {
  try {
    // Get user
    const user = await getUser(ctx.from.id);
    const currentLang = user?.settings?.language || 'en';
    
    const text = '🌐 *Language Settings*\n\nSelect your preferred language:';
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getLanguageSelector(currentLang)
      });
    } catch (error) {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getLanguageSelector(currentLang)
      });
    }
  } catch (error) {
    logger.error('Error in handleLanguageSettings:', error);
    throw error;
  }
}

// Handle profile settings
async function handleProfileSettings(ctx) {
  try {
    // Get user
    const user = await getUser(ctx.from.id);
    
    if (!user) {
      return ctx.reply('User not found. Please restart the bot with /start.');
    }
    
    const profileText = `👤 *Your Profile*\n\n` +
                        `Name: ${user.first_name} ${user.last_name || ''}\n` +
                        `Username: ${user.username ? '@' + user.username : 'None'}\n` +
                        `User ID: \`${user.id}\`\n` +
                        `Language: ${user.settings?.language || 'en'}\n` +
                        `Keyboard Style: ${user.settings?.keyboardStyle || config.DEFAULT_KEYBOARD_STYLE}\n` +
                        `Notification Style: ${user.settings?.notificationStyle || config.DEFAULT_NOTIFICATION_STYLE}\n` +
                        `Joined: ${new Date(user.createdAt).toLocaleDateString()}\n` +
                        `Last Activity: ${new Date(user.lastActivity).toLocaleDateString()}`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(profileText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(profileText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    }
  } catch (error) {
    logger.error('Error in handleProfileSettings:', error);
    throw error;
  }
}

// Handle user stats
async function handleUserStats(ctx) {
  try {
    const { getStatsDb } = require('../database/db');
    const statsDb = getStatsDb();
    
    // Get user-specific stats
    const userId = ctx.from.id.toString();
    const userStats = statsDb.data.usageStats.userActivity[userId] || {
      commandsUsed: 0,
      featuresUsed: 0,
      callbacksTriggered: 0,
      lastActivity: new Date().toISOString()
    };
    
    const statsText = `📊 *Your Usage Statistics*\n\n` +
                      `Commands Used: ${userStats.commandsUsed || 0}\n` +
                      `Features Accessed: ${userStats.featuresUsed || 0}\n` +
                      `Interactions: ${userStats.callbacksTriggered || 0}\n` +
                      `Last Activity: ${new Date(userStats.lastActivity).toLocaleDateString()}`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(statsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(statsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    }
  } catch (error) {
    logger.error('Error in handleUserStats:', error);
    throw error;
  }
}

// Handle set keyboard style
async function handleSetKeyboardStyle(ctx, style) {
  try {
    // Validate style
    if (!config.KEYBOARD_STYLES.includes(style)) {
      return ctx.reply(`Invalid keyboard style: ${style}`);
    }
    
    // Update user settings
    await setKeyboardStyle(ctx.from.id, style);
    
    // Show success message
    const successText = `✅ Keyboard style updated to *${style}*!\n\nThis will affect how buttons are displayed throughout the bot.`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    }
  } catch (error) {
    logger.error(`Error in handleSetKeyboardStyle (${style}):`, error);
    throw error;
  }
}

// Handle set notification style
async function handleSetNotificationStyle(ctx, style) {
  try {
    // Validate style
    if (!config.NOTIFICATION_STYLES.includes(style)) {
      return ctx.reply(`Invalid notification style: ${style}`);
    }
    
    // Update user settings
    await setNotificationStyle(ctx.from.id, style);
    
    // Show success message
    const successText = `✅ Notification style updated to *${style}*!\n\nThis will affect how notifications are displayed.`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    }
  } catch (error) {
    logger.error(`Error in handleSetNotificationStyle (${style}):`, error);
    throw error;
  }
}

// Handle set language
async function handleSetLanguage(ctx, language) {
  try {
    // Update user settings
    await setUserLanguage(ctx.from.id, language);
    
    // Update session language
    ctx.i18n.locale(language);
    
    // Show success message
    const successText = `✅ Language updated to *${language}*!`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(successText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Settings', callback_data: 'settings' }]
          ]
        }
      });
    }
  } catch (error) {
    logger.error(`Error in handleSetLanguage (${language}):`, error);
    throw error;
  }
}

// Handle feature
async function handleFeature(ctx, featureId) {
  try {
    // Get feature from database
    const featuresDb = getFeaturesDb();
    const feature = featuresDb.data.features.find(f => f.id === featureId);
    
    if (!feature) {
      return ctx.reply(`Feature with ID ${featureId} not found.`);
    }
    
    // Check if feature is enabled
    if (!feature.enabled) {
      return ctx.reply(`The feature "${feature.name}" is currently disabled.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    
    // Update usage stats
    const { getStatsDb } = require('../database/db');
    const statsDb = getStatsDb();
    
    if (!statsDb.data.usageStats.featuresUsed[feature.id]) {
      statsDb.data.usageStats.featuresUsed[feature.id] = 0;
    }
    statsDb.data.usageStats.featuresUsed[feature.id]++;
    await statsDb.write();
    
    // Get keyboard style for user
    const keyboardStyle = await getKeyboardStyle(ctx.from.id);
    
    // Prepare feature text
    const featureText = `${feature.emoji} *${feature.name}*\n\n${feature.description}`;
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(featureText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getFeatureSubmenu(feature, keyboardStyle)
      });
    } catch (error) {
      await ctx.reply(featureText, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getFeatureSubmenu(feature, keyboardStyle)
      });
    }
  } catch (error) {
    logger.error(`Error in handleFeature (${featureId}):`, error);
    throw error;
  }
}

// Handle submenu
async function handleSubmenu(ctx, featureId, submenuId) {
  try {
    // Get feature from database
    const featuresDb = getFeaturesDb();
    const feature = featuresDb.data.features.find(f => f.id === featureId);
    
    if (!feature) {
      return ctx.reply(`Feature with ID ${featureId} not found.`);
    }
    
    // Find submenu
    const submenu = feature.submenus.find(s => s.id === submenuId);
    
    if (!submenu) {
      return ctx.reply(`Submenu with ID ${submenuId} not found.`);
    }
    
    // Prepare submenu text
    const submenuText = `${submenu.emoji} *${submenu.name}*\n\n${submenu.description}`;
    
    // Prepare keyboard
    const keyboard = [];
    
    // Add submenu actions if they exist
    if (submenu.actions && submenu.actions.length > 0) {
      const actionButtons = submenu.actions.map(action => ({
        text: `${action.emoji} ${action.name}`,
        callback_data: `action:${featureId}:${action.id}`
      }));
      
      // Split into rows of 2
      for (let i = 0; i < actionButtons.length; i += 2) {
        keyboard.push(actionButtons.slice(i, i + 2));
      }
    }
    
    // Add back button
    keyboard.push([{ text: '🔙 Back to Feature', callback_data: `feature:${featureId}` }]);
    
    // Try to edit the message if possible, otherwise send a new one
    try {
      await ctx.editMessageText(submenuText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      await ctx.reply(submenuText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
  } catch (error) {
    logger.error(`Error in handleSubmenu (${featureId}/${submenuId}):`, error);
    throw error;
  }
}

// Handle action
async function handleAction(ctx, featureId, actionId) {
  try {
    // Get feature from database
    const featuresDb = getFeaturesDb();
    const feature = featuresDb.data.features.find(f => f.id === featureId);
    
    if (!feature) {
      return ctx.reply(`Feature with ID ${featureId} not found.`);
    }
    
    // Find action (can be in feature actions or submenu actions)
    let action = feature.actions?.find(a => a.id === actionId);
    
    if (!action) {
      // Look in submenus
      for (const submenu of feature.submenus || []) {
        const submenuAction = submenu.actions?.find(a => a.id === actionId);
        if (submenuAction) {
          action = submenuAction;
          break;
        }
      }
    }
    
    if (!action) {
      return ctx.reply(`Action with ID ${actionId} not found.`);
    }
    
    // Execute action handler
    const featureModule = require(`../features/${featureId}/${featureId}.js`);
    
    if (!featureModule.handleAction) {
      return ctx.reply(`The feature module for ${featureId} does not support actions.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Feature', callback_data: `feature:${featureId}` }]
          ]
        }
      });
    }
    
    await featureModule.handleAction(ctx, action, feature);
    
  } catch (error) {
    logger.error(`Error in handleAction (${featureId}/${actionId}):`, error);
    throw error;
  }
}

// Handle admin options
async function handleAdminOption(ctx, option) {
  try {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply('⛔ You do not have permission to access admin functions.');
    }
    
    switch (option) {
      case 'users':
        await handleAdminUsers(ctx);
        break;
      case 'analytics':
        await handleAdminAnalytics(ctx);
        break;
      case 'bot_settings':
        await handleAdminBotSettings(ctx);
        break;
      case 'system_status':
        await handleAdminSystemStatus(ctx);
        break;
      case 'add_feature':
        await handleAdminAddFeature(ctx);
        break;
      case 'edit_features':
        await handleAdminEditFeatures(ctx);
        break;
      case 'logs':
        await handleAdminLogs(ctx);
        break;
      case 'broadcast':
        await handleAdminBroadcast(ctx);
        break;
      default:
        await ctx.reply(`Unknown admin option: ${option}`);
    }
  } catch (error) {
    logger.error(`Error in handleAdminOption (${option}):`, error);
    throw error;
  }
}

// Handle admin users
async function handleAdminUsers(ctx) {
  try {
    const { getAllUsers, getActiveUsers } = require('../database/users');
    
    const users = await getAllUsers();
    const activeUsers = await getActiveUsers();
    
    // Sort users by last activity
    users.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    // Prepare user stats
    const usersText = `👥 *User Management*\n\n` +
                     `Total users: ${users.length}\n` +
                     `Active users (30d): ${activeUsers.length}\n\n` +
                     `Recent users:\n` +
                     users.slice(0, 5).map(u => `- ${u.first_name} (${u.id}) - ${new Date(u.lastActivity).toLocaleDateString()}`).join('\n');
    
    await ctx.editMessageText(usersText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 User Stats', callback_data: 'admin:user_stats' },
            { text: '🔍 Find User', callback_data: 'admin:find_user' }
          ],
          [
            { text: '📝 Export Users', callback_data: 'admin:export_users' }
          ],
          [
            { text: '🔙 Back to Admin', callback_data: 'admin' }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error('Error in handleAdminUsers:', error);
    throw error;
  }
}

// Handle admin analytics
async function handleAdminAnalytics(ctx) {
  try {
    const { getStatsDb } = require('../database/db');
    const statsDb = getStatsDb();
    
    // Prepare analytics text
    const analyticsText = `📊 *Analytics*\n\n` +
                         `Feature Usage:\n${formatTopFeatures(statsDb.data.usageStats.featuresUsed, 5)}\n\n` +
                         `Command Usage:\n${formatTopCommands(statsDb.data.usageStats.commandsUsed, 5)}\n\n` +
                         `Performance:\n` +
                         `- Average response time: ${formatResponseTime(statsDb.data.performanceStats.responseTime)}\n` +
                         `- Errors (24h): ${countRecentErrors(statsDb.data.performanceStats.errors)}`;
    
    await ctx.editMessageText(analyticsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Detailed Stats', callback_data: 'admin:detailed_stats' },
            { text: '📈 Performance', callback_data: 'admin:performance' }
          ],
          [
            { text: '📝 Export Data', callback_data: 'admin:export_stats' }
          ],
          [
            { text: '🔙 Back to Admin', callback_data: 'admin' }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error('Error in handleAdminAnalytics:', error);
    throw error;
  }
}

// Handle admin bot settings
async function handleAdminBotSettings(ctx) {
  try {
    const { getBotSettings } = require('../database/settings');
    const settings = await getBotSettings();
    
    // Prepare settings text
    const settingsText = `⚙️ *Bot Settings*\n\n` +
                        `Default keyboard style: ${settings.keyboardStyle || config.DEFAULT_KEYBOARD_STYLE}\n` +
                        `Default notification style: ${settings.notificationStyle || config.DEFAULT_NOTIFICATION_STYLE}\n` +
                        `Default language: ${settings.language || 'en'}\n\n` +
                        `Log channel: ${config.LOG_CHANNEL_ID ? `Configured ✅` : `Not configured ❌`}\n` +
                        `Debug mode: ${config.DEBUG_MODE ? `Enabled ✅` : `Disabled ❌`}`;
    
    await ctx.editMessageText(settingsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎨 Default Keyboard', callback_data: 'admin:set_default_keyboard' },
            { text: '🔔 Default Notifications', callback_data: 'admin:set_default_notification' }
          ],
          [
            { text: '🌐 Default Language', callback_data: 'admin:set_default_language' },
            { text: '📝 Log Channel', callback_data: 'admin:set_log_channel' }
          ],
          [
            { text: '🐛 Toggle Debug Mode', callback_data: 'admin:toggle_debug' }
          ],
          [
            { text: '🔙 Back to Admin', callback_data: 'admin' }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error('Error in handleAdminBotSettings:', error);
    throw error;
  }
}

// Handle admin system status
async function handleAdminSystemStatus(ctx) {
  try {
    const os = require('os');
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Get system uptime
    const systemUptime = os.uptime();
    const botUptime = process.uptime();
    
    // Get load average
    const loadAvg = os.loadavg();
    
    // Prepare status text
    const statusText = `🖥️ *System Status*\n\n` +
                      `*System Information:*\n` +
                      `- Platform: ${os.platform()} ${os.release()}\n` +
                      `- Architecture: ${os.arch()}\n` +
                      `- CPUs: ${os.cpus().length}\n\n` +
                      `*Memory Usage:*\n` +
                      `- System: ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${Math.round((usedMem / totalMem) * 100)}%)\n` +
                      `- Bot: ${formatBytes(memoryUsage.rss)}\n` +
                      `- Heap: ${formatBytes(memoryUsage.heapUsed)} / ${formatBytes(memoryUsage.heapTotal)}\n\n` +
                      `*Uptime:*\n` +
                      `- System: ${formatUptime(systemUptime)}\n` +
                      `- Bot: ${formatUptime(botUptime)}\n\n` +
                      `*Load Average:* ${loadAvg.map(l => l.toFixed(2)).join(', ')}`;
    
    await ctx.editMessageText(statusText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Refresh', callback_data: 'admin:system_status' },
            { text: '📊 Performance Logs', callback_data: 'admin:performance_logs' }
          ],
          [
            { text: '💾 Create Backup', callback_data: 'admin:create_backup' },
            { text: '🧹 Clean Logs', callback_data: 'admin:clean_logs' }
          ],
          [
            { text: '🔙 Back to Admin', callback_data: 'admin' }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error('Error in handleAdminSystemStatus:', error);
    throw error;
  }
}

// Handle admin add feature
async function handleAdminAddFeature(ctx) {
  try {
    await ctx.editMessageText(
      '✨ *Add New Feature*\n\nSelect a method to create a new feature:',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboards.getFeatureGeneratorKeyboard()
      }
    );
  } catch (error) {
    logger.error('Error in handleAdminAddFeature:', error);
    throw error;
  }
}

// Handle admin edit features
async function handleAdminEditFeatures(ctx) {
  try {
    // Get all features
    const featuresDb = getFeaturesDb();
    const features = featuresDb.data.features;
    
    if (features.length === 0) {
      return ctx.editMessageText(
        '❌ *No Features Found*\n\nThere are no features to edit. Add features first.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Add New Feature', callback_data: 'admin:add_feature' }],
              [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
            ]
          }
        }
      );
    }
    
    // Create feature list keyboard
    const keyboard = [];
    features.forEach(feature => {
      keyboard.push([{
        text: `${feature.emoji} ${feature.name} ${feature.enabled ? '✅' : '❌'}`,
        callback_data: `admin:edit_feature:${feature.id}`
      }]);
    });
    
    // Add navigation buttons
    keyboard.push([
      { text: '✨ Add New Feature', callback_data: 'admin:add_feature' },
      { text: '🔙 Back to Admin', callback_data: 'admin' }
    ]);
    
    await ctx.editMessageText(
      '🔧 *Edit Features*\n\nSelect a feature to edit:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleAdminEditFeatures:', error);
    throw error;
  }
}

// Handle admin logs
async function handleAdminLogs(ctx) {
  try {
    // Get recent logs
    const { getLogsDb } = require('../database/db');
    const logsDb = getLogsDb();
    const logs = logsDb.data.logs.slice(-10); // Get last 10 logs
    
    let logsText = '📝 *Recent Logs*\n\n';
    
    if (logs.length === 0) {
      logsText += 'No logs found.';
    } else {
      logs.forEach(log => {
        logsText += `[${log.timestamp}] ${log.level}: ${log.message}\n\n`;
      });
    }
    
    await ctx.editMessageText(logsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔍 Error Logs', callback_data: 'admin:error_logs' },
            { text: '📊 Info Logs', callback_data: 'admin:info_logs' }
          ],
          [
            { text: '🧹 Clear Logs', callback_data: 'admin:clear_logs' },
            { text: '📤 Export Logs', callback_data: 'admin:export_logs' }
          ],
          [
            { text: '🔙 Back to Admin', callback_data: 'admin' }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error('Error in handleAdminLogs:', error);
    throw error;
  }
}

// Handle admin broadcast
async function handleAdminBroadcast(ctx) {
  try {
    await ctx.editMessageText(
      '📣 *Broadcast Message*\n\nSend a message to all users. Use the command:\n\n`/broadcast Your message here`\n\nYou can use Markdown formatting in your message.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleAdminBroadcast:', error);
    throw error;
  }
}

// Handle broadcast confirm
async function handleBroadcastConfirm(ctx) {
  try {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply('⛔ You do not have permission to broadcast messages.');
    }
    
    const message = ctx.session.pendingBroadcast;
    
    if (!message) {
      return ctx.editMessageText(
        '❌ Broadcast failed: No message found in session. Please try again.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
            ]
          }
        }
      );
    }
    
    // Get all users
    const { getAllUsers } = require('../database/users');
    const users = await getAllUsers();
    
    await ctx.editMessageText('📣 Broadcasting message to all users...');
    
    // Send message to all users
    let sentCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.id, message, { parse_mode: 'Markdown' });
        sentCount++;
      } catch (error) {
        logger.error(`Failed to send broadcast to user ${user.id}:`, error);
        errorCount++;
      }
      
      // Add a small delay to prevent flood limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Clear pending broadcast
    ctx.session.pendingBroadcast = null;
    
    // Send completion message
    await ctx.reply(
      `✅ Broadcast completed!\n\n` +
      `- Message sent to: ${sentCount} users\n` +
      `- Failed: ${errorCount} users`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleBroadcastConfirm:', error);
    throw error;
  }
}

// Handle broadcast cancel
async function handleBroadcastCancel(ctx) {
  try {
    // Clear pending broadcast
    ctx.session.pendingBroadcast = null;
    
    await ctx.editMessageText(
      '❌ Broadcast cancelled.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleBroadcastCancel:', error);
    throw error;
  }
}

// Handle feature generator
async function handleFeatureGenerator(ctx, method) {
  try {
    // Check if user is admin
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply('⛔ You do not have permission to generate features.');
    }
    
    switch (method) {
      case 'template':
        await handleFeatureGeneratorTemplate(ctx);
        break;
      case 'ai':
        await handleFeatureGeneratorAI(ctx);
        break;
      case 'import':
        await handleFeatureGeneratorImport(ctx);
        break;
      case 'custom':
        await handleFeatureGeneratorCustom(ctx);
        break;
      default:
        await ctx.reply(`Unknown feature generation method: ${method}`);
    }
  } catch (error) {
    logger.error(`Error in handleFeatureGenerator (${method}):`, error);
    throw error;
  }
}

// Handle feature generator template
async function handleFeatureGeneratorTemplate(ctx) {
  try {
    await ctx.editMessageText(
      '📋 *Create Feature from Template*\n\n' +
      'To create a feature from a template, send me the following information:\n\n' +
      '1. Feature ID (alphanumeric, no spaces)\n' +
      '2. Feature Name\n' +
      '3. Feature Description\n' +
      '4. Feature Emoji\n\n' +
      'Example:\n' +
      '```\n' +
      'ID: weather\n' +
      'Name: Weather Forecast\n' +
      'Description: Get weather forecasts for any location\n' +
      'Emoji: 🌤\n' +
      '```\n\n' +
      'Send this information in a single message or use /cancel to abort.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'admin:add_feature' }]
          ]
        }
      }
    );
    
    // Set session state to expect feature template info
    ctx.session.featureGeneratorState = 'awaiting_template_info';
  } catch (error) {
    logger.error('Error in handleFeatureGeneratorTemplate:', error);
    throw error;
  }
}

// Handle feature generator AI
async function handleFeatureGeneratorAI(ctx) {
  try {
    await ctx.editMessageText(
      '🤖 *AI-Assisted Feature Creation*\n\n' +
      'Describe the feature you want to create, and I\'ll generate it for you. Be as detailed as possible about what the feature should do.\n\n' +
      'Example: *"Create a feature that lets users search for recipes by ingredients. It should have options to filter by cuisine type and cooking time."*\n\n' +
      'Send your description in a single message or use /cancel to abort.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'admin:add_feature' }]
          ]
        }
      }
    );
    
    // Set session state to expect feature AI description
    ctx.session.featureGeneratorState = 'awaiting_ai_description';
  } catch (error) {
    logger.error('Error in handleFeatureGeneratorAI:', error);
    throw error;
  }
}

// Handle feature generator import
async function handleFeatureGeneratorImport(ctx) {
  try {
    await ctx.editMessageText(
      '📥 *Import Feature from JSON*\n\n' +
      'Send me a JSON file or paste the JSON code for the feature you want to import.\n\n' +
      'The JSON should follow this structure:\n' +
      '```json\n' +
      '{\n' +
      '  "id": "feature_id",\n' +
      '  "name": "Feature Name",\n' +
      '  "description": "Feature Description",\n' +
      '  "emoji": "🔍",\n' +
      '  "enabled": true,\n' +
      '  "submenus": [...],\n' +
      '  "actions": [...]\n' +
      '}\n' +
      '```\n\n' +
      'Send your JSON or use /cancel to abort.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'admin:add_feature' }]
          ]
        }
      }
    );
    
    // Set session state to expect feature JSON
    ctx.session.featureGeneratorState = 'awaiting_json_import';
  } catch (error) {
    logger.error('Error in handleFeatureGeneratorImport:', error);
    throw error;
  }
}

// Handle feature generator custom
async function handleFeatureGeneratorCustom(ctx) {
  try {
    await ctx.editMessageText(
      '🧩 *Custom Feature Code*\n\n' +
      'This option allows you to create a feature with custom code. First, provide the basic feature information:\n\n' +
      '1. Feature ID (alphanumeric, no spaces)\n' +
      '2. Feature Name\n' +
      '3. Feature Description\n' +
      '4. Feature Emoji\n\n' +
      'After providing this information, you\'ll be prompted to send the custom code.\n\n' +
      'Send this information in a single message or use /cancel to abort.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'admin:add_feature' }]
          ]
        }
      }
    );
    
    // Set session state to expect feature custom info
    ctx.session.featureGeneratorState = 'awaiting_custom_info';
  } catch (error) {
    logger.error('Error in handleFeatureGeneratorCustom:', error);
    throw error;
  }
}

// Handle dynamic callback (for dynamically added features)
async function handleDynamicCallback(ctx, callbackData) {
  try {
    // Get all features
    const featuresDb = getFeaturesDb();
    const features = featuresDb.data.features;
    
    // Look through all features to find a matching handler
    for (const feature of features) {
      try {
        // Try to load the feature module
        const featureModule = require(`../features/${feature.id}/${feature.id}.js`);
        
        // Check if the module has a handleCallback method
        if (typeof featureModule.handleCallback === 'function') {
          // Try to handle the callback with this feature
          const handled = await featureModule.handleCallback(ctx, callbackData);
          
          // If the feature handled the callback, we're done
          if (handled) return true;
        }
      } catch (error) {
        // Silently ignore errors loading individual feature modules
        logger.debug(`Error checking feature ${feature.id} for callback handler:`, error);
      }
    }
    
    // If we get here, no feature handled the callback
    logger.warn(`No handler found for callback data: ${callbackData}`);
    return false;
  } catch (error) {
    logger.error(`Error in handleDynamicCallback (${callbackData}):`, error);
    throw error;
  }
}

// Utility functions
function formatTopFeatures(featuresUsed, limit = 5) {
  const features = Object.entries(featuresUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  if (features.length === 0) return 'No features used yet';
  
  return features.map(([feature, count]) => `- ${feature}: ${count}`).join('\n');
}

function formatTopCommands(commandsUsed, limit = 5) {
  const commands = Object.entries(commandsUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  if (commands.length === 0) return 'No commands used yet';
  
  return commands.map(([cmd, count]) => `- /${cmd}: ${count}`).join('\n');
}

function formatResponseTime(responseTimes) {
  if (!responseTimes || responseTimes.length === 0) return 'No data';
  
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  return `${(sum / responseTimes.length).toFixed(2)}ms`;
}

function countRecentErrors(errors) {
  if (!errors || errors.length === 0) return 0;
  
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return errors.filter(e => new Date(e.timestamp) > oneDayAgo).length;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds - minutes * 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}
