const logger = require('../../utils/logger');
const config = require('../../config/config');

/**
 * Track command usage
 * @param {string} command - Command name
 * @param {number} userId - User ID who used the command
 * @returns {Promise<void>}
 */
async function trackCommandUsage(command, userId) {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Remove leading slash from command if present
    const commandName = command.startsWith('/') ? command.substring(1) : command;
    
    // Increment command counter
    if (!statsDb.data.usageStats.commandsUsed[commandName]) {
      statsDb.data.usageStats.commandsUsed[commandName] = 0;
    }
    statsDb.data.usageStats.commandsUsed[commandName]++;
    
    // Update user activity
    await trackUserActivity(userId, 'command');
    
    await statsDb.write();
  } catch (error) {
    logger.error(`Error tracking command usage for ${command}:`, error);
  }
}

/**
 * Track feature usage
 * @param {string} featureId - Feature ID
 * @param {number} userId - User ID who used the feature
 * @returns {Promise<void>}
 */
async function trackFeatureUsage(featureId, userId) {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Increment feature counter
    if (!statsDb.data.usageStats.featuresUsed[featureId]) {
      statsDb.data.usageStats.featuresUsed[featureId] = 0;
    }
    statsDb.data.usageStats.featuresUsed[featureId]++;
    
    // Update user activity
    await trackUserActivity(userId, 'feature');
    
    await statsDb.write();
  } catch (error) {
    logger.error(`Error tracking feature usage for ${featureId}:`, error);
  }
}

/**
 * Track callback query usage
 * @param {string} callbackData - Callback query data
 * @param {number} userId - User ID who triggered the callback
 * @returns {Promise<void>}
 */
async function trackCallbackUsage(callbackData, userId) {
  try {
    // Update user activity
    await trackUserActivity(userId, 'callback');
  } catch (error) {
    logger.error(`Error tracking callback usage for ${callbackData}:`, error);
  }
}

/**
 * Track user activity
 * @param {number} userId - User ID
 * @param {string} activityType - Type of activity
 * @returns {Promise<void>}
 */
async function trackUserActivity(userId, activityType) {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Ensure userId is a string
    const userIdStr = userId.toString();
    
    // Initialize user activity data if it doesn't exist
    if (!statsDb.data.usageStats.userActivity[userIdStr]) {
      statsDb.data.usageStats.userActivity[userIdStr] = {
        commandsUsed: 0,
        featuresUsed: 0,
        callbacksTriggered: 0,
        lastActivity: new Date().toISOString()
      };
    }
    
    // Update user activity stats
    const userStats = statsDb.data.usageStats.userActivity[userIdStr];
    
    userStats.lastActivity = new Date().toISOString();
    
    switch (activityType) {
      case 'command':
        userStats.commandsUsed++;
        break;
      case 'feature':
        userStats.featuresUsed++;
        break;
      case 'callback':
        userStats.callbacksTriggered++;
        break;
    }
    
    await statsDb.write();
    
    // Also update user's last activity in the users database
    const { updateUserActivity } = require('../../database/users');
    await updateUserActivity(userId);
  } catch (error) {
    logger.error(`Error tracking user activity for ${userId}:`, error);
  }
}

/**
 * Get usage statistics
 * @param {string} timeframe - Timeframe to get stats for ('day', 'week', 'month', 'all')
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStats(timeframe = 'all') {
  try {
    const { getStatsDb } = require('../../database/db');
    const { getAllUsers } = require('../../database/users');
    const statsDb = getStatsDb();
    
    // Get cutoff date based on timeframe
    let cutoffDate = null;
    const now = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'week':
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'all':
      default:
        // No cutoff date for all-time stats
        break;
    }
    
    // Get users
    const allUsers = await getAllUsers();
    
    // Filter active users based on timeframe
    const activeUsers = timeframe === 'all'
      ? allUsers
      : allUsers.filter(user => new Date(user.lastActivity) > cutoffDate);
    
    // Get command usage
    const commandsUsed = Object.entries(statsDb.data.usageStats.commandsUsed)
      .sort((a, b) => b[1] - a[1]);
    
    // Get feature usage
    const featuresUsed = Object.entries(statsDb.data.usageStats.featuresUsed)
      .sort((a, b) => b[1] - a[1]);
    
    // Get most active users
    const userActivity = Object.entries(statsDb.data.usageStats.userActivity)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
        totalInteractions: stats.commandsUsed + stats.featuresUsed + stats.callbacksTriggered,
      }))
      .filter(user => timeframe === 'all' || new Date(user.lastActivity) > cutoffDate)
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, 10); // Top 10 users
    
    return {
      timeframe,
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      topCommands: commandsUsed.slice(0, 10),
      topFeatures: featuresUsed.slice(0, 10),
      mostActiveUsers: userActivity,
    };
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    throw error;
  }
}

/**
 * Register usage statistics handlers for bot events
 * @param {Object} bot - Telegraf bot instance
 */
function registerUsageStatsHandlers(bot) {
  // Track command usage
  bot.on('text', async (ctx, next) => {
    try {
      const message = ctx.message.text;
      
      // Check if message is a command
      if (message.startsWith('/')) {
        const command = message.split(' ')[0]; // Get the command part
        await trackCommandUsage(command, ctx.from.id);
      }
      
      // Continue processing
      await next();
    } catch (error) {
      logger.error('Error in command usage tracking:', error);
      await next();
    }
  });
  
  // Track callback query usage
  bot.on('callback_query', async (ctx, next) => {
    try {
      await trackCallbackUsage(ctx.callbackQuery.data, ctx.from.id);
      
      // Check if callback is for a feature
      if (ctx.callbackQuery.data.startsWith('feature:')) {
        const featureId = ctx.callbackQuery.data.split(':')[1];
        await trackFeatureUsage(featureId, ctx.from.id);
      }
      
      // Continue processing
      await next();
    } catch (error) {
      logger.error('Error in callback usage tracking:', error);
      await next();
    }
  });
}

module.exports = {
  trackCommandUsage,
  trackFeatureUsage,
  trackCallbackUsage,
  trackUserActivity,
  getUsageStats,
  registerUsageStatsHandlers,
};
