const { getUsersDb } = require('./db');
const logger = require('../utils/logger');

/**
 * Add a new user to the database
 * @param {Object} user - User object containing id, first_name, etc.
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Object>} The added user
 */
async function addUser(user, isAdmin = false) {
  try {
    const db = getUsersDb();
    
    // Check if user already exists
    const existingUser = db.data.users.find(u => u.id === user.id);
    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, {
        ...user,
        isAdmin,
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await db.write();
      return existingUser;
    }
    
    // Create new user
    const newUser = {
      ...user,
      isAdmin,
      // verification: admins auto-verified, others must verify via button
      verified: !!isAdmin,
      settings: {
        language: 'en',
        keyboardStyle: 'modern',
        notificationStyle: 'standard',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    db.data.users.push(newUser);
    await db.write();
    logger.info(`New user added: ${user.id} (${user.first_name})`);
    return newUser;
  } catch (error) {
    logger.error(`Error adding user ${user.id}:`, error);
    throw error;
  }
}

/**
 * Get a user by ID
 * @param {number} userId - Telegram user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
async function getUser(userId) {
  try {
    const db = getUsersDb();
    return db.data.users.find(user => user.id === userId) || null;
  } catch (error) {
    logger.error(`Error getting user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update a user's information
 * @param {number} userId - Telegram user ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object|null>} The updated user or null if not found
 */
async function updateUser(userId, updates) {
  try {
    const db = getUsersDb();
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      logger.warn(`Attempted to update non-existent user: ${userId}`);
      return null;
    }
    
    // Apply updates
    db.data.users[userIndex] = {
      ...db.data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    return db.data.users[userIndex];
  } catch (error) {
    logger.error(`Error updating user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user's last activity timestamp
 * @param {number} userId - Telegram user ID
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function updateUserActivity(userId) {
  try {
    const db = getUsersDb();
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return false;
    
    db.data.users[userIndex].lastActivity = new Date().toISOString();
    await db.write();
    return true;
  } catch (error) {
    logger.error(`Error updating activity for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of all users
 */
async function getAllUsers() {
  try {
    const db = getUsersDb();
    return [...db.data.users];
  } catch (error) {
    logger.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Get all admin users
 * @returns {Promise<Array>} Array of admin users
 */
async function getAdmins() {
  try {
    const db = getUsersDb();
    return db.data.users.filter(user => user.isAdmin);
  } catch (error) {
    logger.error('Error getting admin users:', error);
    throw error;
  }
}

/**
 * Set user admin status
 * @param {number} userId - Telegram user ID
 * @param {boolean} isAdmin - Whether the user should be an admin
 * @returns {Promise<Object|null>} The updated user or null if not found
 */
async function setUserAdmin(userId, isAdmin) {
  return updateUser(userId, { isAdmin });
}

/**
 * Update user settings
 * @param {number} userId - Telegram user ID
 * @param {Object} settings - New settings
 * @returns {Promise<Object|null>} The updated user or null if not found
 */
async function updateUserSettings(userId, settings) {
  try {
    const db = getUsersDb();
    const userIndex = db.data.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      logger.warn(`Attempted to update settings for non-existent user: ${userId}`);
      return null;
    }
    
    // Apply updates
    db.data.users[userIndex].settings = {
      ...db.data.users[userIndex].settings,
      ...settings
    };
    
    db.data.users[userIndex].updatedAt = new Date().toISOString();
    await db.write();
    return db.data.users[userIndex];
  } catch (error) {
    logger.error(`Error updating settings for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get active users (active in the last 30 days)
 * @returns {Promise<Array>} Array of active users
 */
async function getActiveUsers() {
  try {
    const db = getUsersDb();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return db.data.users.filter(user => {
      const lastActivity = new Date(user.lastActivity);
      return lastActivity > thirtyDaysAgo;
    });
  } catch (error) {
    logger.error('Error getting active users:', error);
    throw error;
  }
}

/**
 * Ban a user (prevent bot usage)
 * @param {number} userId - User ID to ban
 * @param {string} reason - Reason for ban (optional)
 * @returns {Promise<Object>} Updated user object
 */
async function banUser(userId, reason = 'No reason provided') {
  try {
    const db = getUsersDb();
    const userIndex = db.data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error(`User ${userId} not found`);
    }
    
    db.data.users[userIndex].banned = true;
    db.data.users[userIndex].banReason = reason;
    db.data.users[userIndex].bannedAt = new Date().toISOString();
    db.data.users[userIndex].updatedAt = new Date().toISOString();
    
    await db.write();
    logger.info(`User ${userId} banned: ${reason}`);
    return db.data.users[userIndex];
  } catch (error) {
    logger.error(`Error banning user ${userId}:`, error);
    throw error;
  }
}

/**
 * Unban a user
 * @param {number} userId - User ID to unban
 * @returns {Promise<Object>} Updated user object
 */
async function unbanUser(userId) {
  try {
    const db = getUsersDb();
    const userIndex = db.data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error(`User ${userId} not found`);
    }
    
    db.data.users[userIndex].banned = false;
    db.data.users[userIndex].banReason = null;
    db.data.users[userIndex].bannedAt = null;
    db.data.users[userIndex].updatedAt = new Date().toISOString();
    
    await db.write();
    logger.info(`User ${userId} unbanned`);
    return db.data.users[userIndex];
  } catch (error) {
    logger.error(`Error unbanning user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if user is banned
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is banned
 */
async function isUserBanned(userId) {
  try {
    const user = await getUser(userId);
    return user && user.banned === true;
  } catch (error) {
    logger.error(`Error checking ban status for user ${userId}:`, error);
    return false;
  }
}

/**
 * Set user verified flag
 * @param {number} userId
 * @param {boolean} verified
 * @returns {Promise<Object|null>} Updated user
 */
async function setUserVerified(userId, verified = true) {
  try {
    return await updateUser(userId, { verified });
  } catch (error) {
    logger.error(`Error setting verified for user ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  addUser,
  getUser,
  updateUser,
  updateUserActivity,
  getAllUsers,
  getAdmins,
  setUserAdmin,
  updateUserSettings,
  getActiveUsers,
  banUser,
  unbanUser,
  isUserBanned,
  setUserVerified,
};
