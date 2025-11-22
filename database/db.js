const path = require('path');
const fs = require('fs-extra');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const config = require('../config/config');
const logger = require('../utils/logger');

// Database file paths
const DB_DIR = config.DB_PATH;
const USERS_DB_PATH = path.join(DB_DIR, 'users.json');
const SETTINGS_DB_PATH = path.join(DB_DIR, 'settings.json');
const FEATURES_DB_PATH = path.join(DB_DIR, 'features.json');
const STATS_DB_PATH = path.join(DB_DIR, 'stats.json');
const LOGS_DB_PATH = path.join(DB_DIR, 'logs.json');

// Database instances
let usersDb = null;
let settingsDb = null;
let featuresDb = null;
let statsDb = null;
let logsDb = null;

/**
 * Initialize a database file with default data if it doesn't exist
 * @param {string} filePath - Path to database file
 * @param {Object} defaultData - Default data structure
 * @returns {Promise<Low>} Database instance
 */
async function initDbFile(filePath, defaultData) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    
    // Check if file exists, if not create with default data
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      await fs.writeJSON(filePath, defaultData, { spaces: 2 });
      logger.info(`Created database file: ${filePath}`);
    }
    
    try {
      // Initialize lowdb
      const adapter = new JSONFile(filePath);
      const db = new Low(adapter);
      await db.read();
      
      // Ensure data structure
      if (!db.data) {
        db.data = defaultData;
        await db.write();
      }
      
      return db;
    } catch (dbError) {
      logger.error(`Error initializing database adapter for ${filePath}:`, dbError.message);
      // Return a minimal working database instance
      return {
        data: defaultData,
        write: async () => {
          try {
            await fs.writeJSON(filePath, defaultData, { spaces: 2 });
          } catch (writeErr) {
            logger.error('Error writing database file:', writeErr.message);
          }
        },
        read: async () => {
          try {
            const data = await fs.readJSON(filePath);
            this.data = data;
          } catch (readErr) {
            logger.error('Error reading database file:', readErr.message);
          }
        }
      };
    }
  } catch (error) {
    logger.error(`Error initializing database file ${filePath}:`, error.message);
    // Return fallback database instance
    return {
      data: defaultData,
      write: async () => {
        logger.warn('Database write failed - using in-memory storage only');
      },
      read: async () => {
        logger.warn('Database read failed - using cached data');
      }
    };
  }
}

/**
 * Initialize all database files
 * @returns {Promise<void>}
 */
async function initDatabase() {
  try {
    // Ensure database directory exists
    await fs.ensureDir(DB_DIR);
    
    // Initialize users database
    usersDb = await initDbFile(USERS_DB_PATH, { users: [] });
    
    // Initialize settings database
    settingsDb = await initDbFile(SETTINGS_DB_PATH, { 
      botSettings: {
        keyboardStyle: config.DEFAULT_KEYBOARD_STYLE,
        notificationStyle: config.DEFAULT_NOTIFICATION_STYLE,
        language: 'en',
      },
      userSettings: {}
    });
    
    // Initialize features database
    featuresDb = await initDbFile(FEATURES_DB_PATH, { features: [] });
    
    // Initialize stats database
    statsDb = await initDbFile(STATS_DB_PATH, { 
      usageStats: {
        commandsUsed: {},
        featuresUsed: {},
        userActivity: {},
      },
      performanceStats: {
        responseTime: [],
        errors: [],
        memoryUsage: [],
      }
    });
    
    // Initialize logs database
    logsDb = await initDbFile(LOGS_DB_PATH, { logs: [] });
    
    logger.info('All databases initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize databases:', error.message);
    logger.warn('Bot will continue with limited functionality');
    // Don't throw - allow bot to continue with in-memory databases
  }
}

// Get database instances
function getUsersDb() {
  if (!usersDb) throw new Error('Users database not initialized');
  return usersDb;
}

function getSettingsDb() {
  if (!settingsDb) throw new Error('Settings database not initialized');
  return settingsDb;
}

function getFeaturesDb() {
  if (!featuresDb) throw new Error('Features database not initialized');
  return featuresDb;
}

function getStatsDb() {
  if (!statsDb) throw new Error('Stats database not initialized');
  return statsDb;
}

function getLogsDb() {
  if (!logsDb) throw new Error('Logs database not initialized');
  return logsDb;
}

// Database backup functionality
async function backupDatabases() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DB_DIR, 'backups', timestamp);
    
    await fs.ensureDir(backupDir);
    
    // Copy all database files to backup directory
    await fs.copy(USERS_DB_PATH, path.join(backupDir, 'users.json'));
    await fs.copy(SETTINGS_DB_PATH, path.join(backupDir, 'settings.json'));
    await fs.copy(FEATURES_DB_PATH, path.join(backupDir, 'features.json'));
    await fs.copy(STATS_DB_PATH, path.join(backupDir, 'stats.json'));
    await fs.copy(LOGS_DB_PATH, path.join(backupDir, 'logs.json'));
    
    logger.info(`Created database backup at ${backupDir}`);
    return backupDir;
  } catch (error) {
    logger.error('Failed to backup databases:', error);
    throw error;
  }
}

// Database restore functionality
async function restoreFromBackup(backupDir) {
  try {
    if (!await fs.pathExists(backupDir)) {
      throw new Error(`Backup directory ${backupDir} does not exist`);
    }
    
    // Create a backup before restoring (just in case)
    await backupDatabases();
    
    // Copy backup files to main database directory
    await fs.copy(path.join(backupDir, 'users.json'), USERS_DB_PATH, { overwrite: true });
    await fs.copy(path.join(backupDir, 'settings.json'), SETTINGS_DB_PATH, { overwrite: true });
    await fs.copy(path.join(backupDir, 'features.json'), FEATURES_DB_PATH, { overwrite: true });
    await fs.copy(path.join(backupDir, 'stats.json'), STATS_DB_PATH, { overwrite: true });
    await fs.copy(path.join(backupDir, 'logs.json'), LOGS_DB_PATH, { overwrite: true });
    
    // Reinitialize databases
    await initDatabase();
    
    logger.info(`Restored database from backup: ${backupDir}`);
    return true;
  } catch (error) {
    logger.error(`Failed to restore from backup ${backupDir}:`, error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  getUsersDb,
  getSettingsDb,
  getFeaturesDb,
  getStatsDb,
  getLogsDb,
  backupDatabases,
  restoreFromBackup,
};
