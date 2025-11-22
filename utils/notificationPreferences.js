const { updateUserSettings, getUserSettings } = require('../database/settings');
const logger = require('../utils/logger');

/**
 * Set user notification preferences
 * @param {number} userId - User ID
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} Updated preferences
 */
async function setNotificationPreferences(userId, preferences) {
  try {
    // Merge with existing preferences
    const currentSettings = await getUserSettings(userId);
    const existingPrefs = currentSettings.notificationPreferences || {};
    
    const updatedPrefs = {
      ...existingPrefs,
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    
    return updateUserSettings(userId, { notificationPreferences: updatedPrefs });
  } catch (error) {
    logger.error(`Error setting notification preferences for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user notification preferences
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User notification preferences
 */
async function getNotificationPreferences(userId) {
  try {
    const settings = await getUserSettings(userId);
    
    const defaults = {
      enableNotifications: true,
      enableEmailNotifications: false,
      quietHourStart: null,
      quietHourEnd: null,
      notifyFeatureErrors: true,
      notifyFeatureUpdates: true,
      notifyAdminMessages: true,
      dailyDigest: false,
      dailyDigestTime: '09:00',
      perFeatureNotifications: {}
    };
    
    return { ...defaults, ...(settings.notificationPreferences || {}) };
  } catch (error) {
    logger.error(`Error getting notification preferences for user ${userId}:`, error);
    return {
      enableNotifications: true,
      enableEmailNotifications: false,
      quietHourStart: null,
      quietHourEnd: null,
      notifyFeatureErrors: true,
      notifyFeatureUpdates: true,
      notifyAdminMessages: true,
      dailyDigest: false,
      dailyDigestTime: '09:00',
      perFeatureNotifications: {}
    };
  }
}

/**
 * Check if user is in quiet hours
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if currently in quiet hours
 */
async function isInQuietHours(userId) {
  try {
    const prefs = await getNotificationPreferences(userId);
    
    if (!prefs.quietHourStart || !prefs.quietHourEnd) {
      return false;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMin] = prefs.quietHourStart.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHourEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  } catch (error) {
    logger.error(`Error checking quiet hours for user ${userId}:`, error);
    return false;
  }
}

/**
 * Enable notifications for a specific feature
 * @param {number} userId - User ID
 * @param {string} featureId - Feature ID
 * @returns {Promise<Object>} Updated preferences
 */
async function enableFeatureNotifications(userId, featureId) {
  try {
    const prefs = await getNotificationPreferences(userId);
    const perFeatureNotifications = prefs.perFeatureNotifications || {};
    perFeatureNotifications[featureId] = true;
    
    return setNotificationPreferences(userId, { perFeatureNotifications });
  } catch (error) {
    logger.error(`Error enabling notifications for feature ${featureId}:`, error);
    throw error;
  }
}

/**
 * Disable notifications for a specific feature
 * @param {number} userId - User ID
 * @param {string} featureId - Feature ID
 * @returns {Promise<Object>} Updated preferences
 */
async function disableFeatureNotifications(userId, featureId) {
  try {
    const prefs = await getNotificationPreferences(userId);
    const perFeatureNotifications = prefs.perFeatureNotifications || {};
    perFeatureNotifications[featureId] = false;
    
    return setNotificationPreferences(userId, { perFeatureNotifications });
  } catch (error) {
    logger.error(`Error disabling notifications for feature ${featureId}:`, error);
    throw error;
  }
}

/**
 * Check if notifications enabled for specific feature
 * @param {number} userId - User ID
 * @param {string} featureId - Feature ID
 * @returns {Promise<boolean>} True if feature notifications are enabled
 */
async function isFeatureNotificationEnabled(userId, featureId) {
  try {
    const prefs = await getNotificationPreferences(userId);
    const perFeatureNotifications = prefs.perFeatureNotifications || {};
    
    // Default to true if not explicitly set to false
    return perFeatureNotifications[featureId] !== false;
  } catch (error) {
    logger.error(`Error checking feature notification status:`, error);
    return true; // Default to enabled
  }
}

/**
 * Format notification preferences for display
 * @param {number} userId - User ID
 * @returns {Promise<string>} Formatted preferences
 */
async function formatPreferencesForDisplay(userId) {
  try {
    const prefs = await getNotificationPreferences(userId);
    
    return `
📋 *Notification Preferences*

Notifications: ${prefs.enableNotifications ? '✅ Enabled' : '❌ Disabled'}
Email Notifications: ${prefs.enableEmailNotifications ? '✅ Enabled' : '❌ Disabled'}
Notify Errors: ${prefs.notifyFeatureErrors ? '✅ Yes' : '❌ No'}
Notify Updates: ${prefs.notifyFeatureUpdates ? '✅ Yes' : '❌ No'}
Admin Messages: ${prefs.notifyAdminMessages ? '✅ Yes' : '❌ No'}
Daily Digest: ${prefs.dailyDigest ? '✅ Enabled' : '❌ Disabled'}
${prefs.dailyDigest ? `Digest Time: ${prefs.dailyDigestTime}` : ''}
${prefs.quietHourStart ? `Quiet Hours: ${prefs.quietHourStart} - ${prefs.quietHourEnd}` : 'Quiet Hours: Not set'}
    `.trim();
  } catch (error) {
    logger.error(`Error formatting preferences for user ${userId}:`, error);
    return 'Error loading preferences';
  }
}

module.exports = {
  setNotificationPreferences,
  getNotificationPreferences,
  isInQuietHours,
  enableFeatureNotifications,
  disableFeatureNotifications,
  isFeatureNotificationEnabled,
  formatPreferencesForDisplay,
};
