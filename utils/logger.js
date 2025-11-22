const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const { nanoid } = require('nanoid');
const config = require('../config/config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
fs.ensureDirSync(logsDir);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata);
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: config.DEBUG_MODE ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'bot-service' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    
    // Write to all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write errors to error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write debug info to debug log
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add database logging
if (config.LOG_TO_DB) {
  logger.on('logged', async (info) => {
    try {
      // Store log in database
      const { getLogsDb } = require('../database/db');
      
      const logsDb = getLogsDb();
      logsDb.data.logs.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: info.level,
        message: info.message,
        metadata: info.metadata,
      });
      
      // Limit logs to 1000 entries
      if (logsDb.data.logs.length > 1000) {
        logsDb.data.logs = logsDb.data.logs.slice(-1000);
      }
      
      await logsDb.write();
    } catch (error) {
      // Don't use logger here to avoid infinite recursion
      console.error('Failed to store log in database:', error);
    }
  });
}

// Add bot-specific logging methods
logger.botError = (message, error, ctx) => {
  const userId = ctx?.from?.id;
  const chatId = ctx?.chat?.id;
  const updateType = ctx?.updateType;
  
  logger.error(`${message} (User: ${userId}, Chat: ${chatId}, Type: ${updateType})`, {
    error: {
      message: error.message,
      stack: error.stack,
    },
    update: ctx?.update,
  });
};

logger.botInfo = (message, ctx) => {
  const userId = ctx?.from?.id;
  const chatId = ctx?.chat?.id;
  const updateType = ctx?.updateType;
  
  logger.info(`${message} (User: ${userId}, Chat: ${chatId}, Type: ${updateType})`);
};

// Export logger
module.exports = logger;
