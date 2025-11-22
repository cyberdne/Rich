const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Error handler for Telegraf errors
 * @param {Error} error - The error object
 * @param {Context} ctx - Telegraf context
 */
module.exports = async (error, ctx) => {
  try {
    // Log error
    logger.error('Bot error:', error);
    
    // Add to error stats
    const { getStatsDb } = require('../database/db');
    const statsDb = getStatsDb();
    
    statsDb.data.performanceStats.errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      update: ctx?.update
    });
    
    // Keep only the last 100 errors
    if (statsDb.data.performanceStats.errors.length > 100) {
      statsDb.data.performanceStats.errors = statsDb.data.performanceStats.errors.slice(-100);
    }
    
    await statsDb.write();
    
    // Send error to log channel if configured
    if (config.LOG_CHANNEL_ID) {
      try {
        const errorMessage = `❌ *Bot Error*\n\n` +
                           `Message: \`${error.message}\`\n` +
                           `Time: ${new Date().toISOString()}\n` +
                           `User: ${ctx?.from ? `${ctx.from.first_name} (${ctx.from.id})` : 'Unknown'}\n` +
                           `Chat: ${ctx?.chat ? `${ctx.chat.title || 'Private'} (${ctx.chat.id})` : 'Unknown'}\n` +
                           `Update: ${JSON.stringify(ctx?.update).substring(0, 500)}...`;
        
        await ctx.telegram.sendMessage(config.LOG_CHANNEL_ID, errorMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } catch (logError) {
        logger.error('Failed to send error to log channel:', logError);
      }
    }
    
    // Notify user if there was an error
    if (ctx && ctx.chat) {
      try {
        // Generate error suggestions based on the error type
        const suggestions = generateErrorSuggestions(error);
        
        // Basic error message
        let userMessage = '❌ Sorry, an error occurred while processing your request.';
        
        // Add debug info if in debug mode
        if (config.DEBUG_MODE) {
          userMessage += `\n\nError: ${error.message}`;
        }
        
        // Add suggestions if available
        if (suggestions) {
          userMessage += `\n\n${suggestions}`;
        }
        
        await ctx.reply(userMessage);
      } catch (replyError) {
        logger.error('Failed to send error message to user:', replyError);
      }
    }
  } catch (handlerError) {
    console.error('Error in error handler:', handlerError);
  }
};

/**
 * Generate user-friendly suggestions based on error type
 * @param {Error} error - The error object
 * @returns {string|null} Suggestions or null if no suggestions
 */
function generateErrorSuggestions(error) {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('bot was blocked by the user')) {
    return null; // No suggestions for blocked users
  } else if (errorMessage.includes('message is not modified')) {
    return '🔍 It seems the message couldn\'t be updated. Try using the bot again.';
  } else if (errorMessage.includes('message to edit not found')) {
    return '🔍 The message you\'re trying to interact with is no longer available. Please try again.';
  } else if (errorMessage.includes('timed out')) {
    return '⏱️ The operation timed out. Please check your internet connection and try again.';
  } else if (errorMessage.includes('too many requests')) {
    return '⏳ You\'re using the bot too quickly. Please wait a moment and try again.';
  } else if (errorMessage.includes('forbidden')) {
    return '🔐 The bot doesn\'t have permission to perform this action. Try adding the bot as an admin or using it in a different chat.';
  } else if (errorMessage.includes('network')) {
    return '📶 A network issue occurred. Please check your connection and try again.';
  } else {
    return '🛠️ This appears to be a temporary issue. Please try again later or contact the bot administrator if the problem persists.';
  }
}
