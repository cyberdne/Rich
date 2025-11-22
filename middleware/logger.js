const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Setup logging middleware
 * @returns {Function} Middleware function
 */
function setupLogger() {
  return async (ctx, next) => {
    try {
      // Log incoming update
      const updateType = ctx.updateType || 'unknown';
      const updateId = ctx.update.update_id;
      const userId = ctx.from ? ctx.from.id : 'unknown';
      const username = ctx.from ? (ctx.from.username || ctx.from.first_name) : 'unknown';
      
      // Create log message based on update type
      let logMessage = `Update #${updateId} from ${username} (${userId}) - Type: ${updateType}`;
      
      if (updateType === 'message' && ctx.message) {
        if (ctx.message.text) {
          logMessage += ` - Text: ${ctx.message.text.substring(0, 50)}${ctx.message.text.length > 50 ? '...' : ''}`;
        } else if (ctx.message.photo) {
          logMessage += ' - Photo';
        } else if (ctx.message.document) {
          logMessage += ` - Document: ${ctx.message.document.file_name}`;
        }
      } else if (updateType === 'callback_query' && ctx.callbackQuery) {
        logMessage += ` - Callback: ${ctx.callbackQuery.data}`;
      }
      
      logger.info(logMessage);
      
      // Continue processing
      await next();
      
      // Log performance if enabled
      if (config.DEBUG_MODE && ctx.state.startTime) {
        const responseTime = Date.now() - ctx.state.startTime;
        logger.debug(`Response time: ${responseTime}ms for update #${updateId}`);
        
        // Track response time
        const { trackResponseTime } = require('../modules/analytics/performanceMonitor');
        await trackResponseTime(responseTime);
      }
    } catch (error) {
      logger.error('Error in logger middleware:', error);
      await next();
    }
  };
}

/**
 * Log message to channel middleware
 * @returns {Function} Middleware function
 */
function logToChannel() {
  return async (ctx, next) => {
    try {
      // Continue processing
      await next();
      
      // Check if log channel is configured
      if (!config.LOG_CHANNEL_ID) {
        return;
      }
      
      // Check if this is an admin command
      const isAdminCommand = ctx.message && 
                            ctx.message.text && 
                            ctx.message.text.startsWith('/') &&
                            config.ADMIN_IDS.includes(ctx.from.id);
      
      if (isAdminCommand) {
        // Log admin commands to channel
        const command = ctx.message.text.split(' ')[0];
        const userId = ctx.from.id;
        const username = ctx.from.username || ctx.from.first_name;
        
        const logMessage = `🛠️ *Admin Command*\n\n` +
                          `Command: \`${command}\`\n` +
                          `User: ${username} (${userId})\n` +
                          `Time: ${new Date().toISOString()}\n` +
                          `Chat: ${ctx.chat.id}`;
        
        await ctx.telegram.sendMessage(config.LOG_CHANNEL_ID, logMessage, {
          parse_mode: 'Markdown',
        });
      }
    } catch (error) {
      logger.error('Error in logToChannel middleware:', error);
    }
  };
}

module.exports = {
  setupLogger,
  logToChannel,
};
