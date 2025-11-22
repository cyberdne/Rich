const logger = require('../../utils/logger');

/**
 * Track usage statistics
 * @param {Object} statsDb - Stats database instance
 * @param {string} commandName - Command name
 * @param {number} userId - User ID
 */
async function trackCommandUsage(statsDb, commandName, userId) {
  try {
    if (!statsDb.data.usageStats.commandsUsed[commandName]) {
      statsDb.data.usageStats.commandsUsed[commandName] = 0;
    }
    statsDb.data.usageStats.commandsUsed[commandName]++;

    const userIdStr = userId.toString();
    if (!statsDb.data.usageStats.userActivity[userIdStr]) {
      statsDb.data.usageStats.userActivity[userIdStr] = {
        commandsUsed: 0,
        featuresUsed: 0,
        callbacksTriggered: 0,
        lastActivity: new Date().toISOString()
      };
    }
    statsDb.data.usageStats.userActivity[userIdStr].commandsUsed++;
    statsDb.data.usageStats.userActivity[userIdStr].lastActivity = new Date().toISOString();

    await statsDb.write();
  } catch (error) {
    logger.error('Error tracking command usage:', error);
  }
}

/**
 * Track feature usage
 * @param {Object} statsDb - Stats database instance
 * @param {string} featureId - Feature ID
 * @param {number} userId - User ID
 */
async function trackFeatureUsage(statsDb, featureId, userId) {
  try {
    if (!statsDb.data.usageStats.featuresUsed[featureId]) {
      statsDb.data.usageStats.featuresUsed[featureId] = 0;
    }
    statsDb.data.usageStats.featuresUsed[featureId]++;

    const userIdStr = userId.toString();
    if (!statsDb.data.usageStats.userActivity[userIdStr]) {
      statsDb.data.usageStats.userActivity[userIdStr] = {
        commandsUsed: 0,
        featuresUsed: 0,
        callbacksTriggered: 0,
        lastActivity: new Date().toISOString()
      };
    }
    statsDb.data.usageStats.userActivity[userIdStr].featuresUsed++;
    statsDb.data.usageStats.userActivity[userIdStr].lastActivity = new Date().toISOString();

    await statsDb.write();
  } catch (error) {
    logger.error('Error tracking feature usage:', error);
  }
}

/**
 * Get usage statistics
 * @param {Object} statsDb - Stats database instance
 * @returns {Object} Usage statistics
 */
function getUsageStats(statsDb) {
  try {
    return statsDb.data.usageStats;
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    return {};
  }
}

module.exports = {
  trackCommandUsage,
  trackFeatureUsage,
  getUsageStats,
};
