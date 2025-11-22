const { getSettingsDb } = require('./db');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Get global bot settings
 * @returns {Promise<Object>} Bot settings
 */
async function getBotSettings() {
  try {
    const db = getSettingsDb();
    return db.data.botSettings;
  } catch (error) {
    logger.error('Error getting bot settings:', error);
    throw error;
  }
}

/**
 * Update global bot settings
 * @param {Object} settings - New settings
 * @returns {Promise<Object>} Updated settings
 */
async function updateBotSettings(settings) {
  try {
    const db = getSettingsDb();
    db.data.botSettings = {
      ...db.data.botSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await db.write();
    logger.info('Bot settings updated');
    return db.data.botSettings;
  } catch (error) {
    logger.error('Error updating bot settings:', error);
    throw error;
  }
}

/**
 * Get user settings
 * @param {number} userId - Telegram user ID
 * @returns {Promise<Object>} User settings
 */
async function getUserSettings(userId) {
  try {
    const db = getSettingsDb();
    if (!db.data.userSettings[userId]) {
      // Create default settings for the user
      db.data.userSettings[userId] = {
        keyboardStyle: config.DEFAULT_KEYBOARD_STYLE,
        notificationStyle: config.DEFAULT_NOTIFICATION_STYLE,
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.write();
    }
    return db.data.userSettings[userId];
  } catch (error) {
    logger.error(`Error getting settings for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user settings
 * @param {number} userId - Telegram user ID
 * @param {Object} settings - New settings
 * @returns {Promise<Object>} Updated settings
 */
async function updateUserSettings(userId, settings) {
  try {
    const db = getSettingsDb();
    
    // Create default settings if they don't exist
    if (!db.data.userSettings[userId]) {
      db.data.userSettings[userId] = {
        keyboardStyle: config.DEFAULT_KEYBOARD_STYLE,
        notificationStyle: config.DEFAULT_NOTIFICATION_STYLE,
        language: 'en',
        createdAt: new Date().toISOString()
      };
    }
    
    // Update settings
    db.data.userSettings[userId] = {
      ...db.data.userSettings[userId],
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    logger.info(`Settings updated for user ${userId}`);
    return db.data.userSettings[userId];
  } catch (error) {
    logger.error(`Error updating settings for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get keyboard style for a user
 * @param {number} userId - Telegram user ID
 * @returns {Promise<string>} Keyboard style
 */
async function getKeyboardStyle(userId) {
  try {
    const settings = await getUserSettings(userId);
    return settings.keyboardStyle || config.DEFAULT_KEYBOARD_STYLE;
  } catch (error) {
    logger.error(`Error getting keyboard style for user ${userId}:`, error);
    return config.DEFAULT_KEYBOARD_STYLE;
  }
}

/**
 * Set keyboard style for a user
 * @param {number} userId - Telegram user ID
 * @param {string} style - Keyboard style
 * @returns {Promise<Object>} Updated settings
 */
async function setKeyboardStyle(userId, style) {
  try {
    if (!config.KEYBOARD_STYLES.includes(style)) {
      throw new Error(`Invalid keyboard style: ${style}`);
    }
    return updateUserSettings(userId, { keyboardStyle: style });
  } catch (error) {
    logger.error(`Error setting keyboard style for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get notification style for a user
 * @param {number} userId - Telegram user ID
 * @returns {Promise<string>} Notification style
 */
async function getNotificationStyle(userId) {
  try {
    const settings = await getUserSettings(userId);
    return settings.notificationStyle || config.DEFAULT_NOTIFICATION_STYLE;
  } catch (error) {
    logger.error(`Error getting notification style for user ${userId}:`, error);
    return config.DEFAULT_NOTIFICATION_STYLE;
  }
}

/**
 * Set notification style for a user
 * @param {number} userId - Telegram user ID
 * @param {string} style - Notification style
 * @returns {Promise<Object>} Updated settings
 */
async function setNotificationStyle(userId, style) {
  try {
    if (!config.NOTIFICATION_STYLES.includes(style)) {
      throw new Error(`Invalid notification style: ${style}`);
    }
    return updateUserSettings(userId, { notificationStyle: style });
  } catch (error) {
    logger.error(`Error setting notification style for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user language
 * @param {number} userId - Telegram user ID
 * @returns {Promise<string>} Language code
 */
async function getUserLanguage(userId) {
  try {
    const settings = await getUserSettings(userId);
    return settings.language || 'en';
  } catch (error) {
    logger.error(`Error getting language for user ${userId}:`, error);
    return 'en';
  }
}

/**
 * Set user language
 * @param {number} userId - Telegram user ID
 * @param {string} language - Language code
 * @returns {Promise<Object>} Updated settings
 */
async function setUserLanguage(userId, language) {
  return updateUserSettings(userId, { language });
}

module.exports = {
  getBotSettings,
  updateBotSettings,
  getUserSettings,
  updateUserSettings,
  getKeyboardStyle,
  setKeyboardStyle,
  getNotificationStyle,
  setNotificationStyle,
  getUserLanguage,
  setUserLanguage,
};
