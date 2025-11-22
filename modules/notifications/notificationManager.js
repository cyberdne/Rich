const logger = require('../../utils/logger');
const config = require('../../config/config');
const { getNotificationStyle } = require('../../database/settings');
const { getTemplateByName } = require('./templates');

/**
 * Send a notification to a user
 * @param {Object} ctx - Telegraf context
 * @param {number} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<boolean>} Success status
 */
async function sendNotification(ctx, userId, type, data = {}) {
  try {
    // Get user's notification style
    const style = await getNotificationStyle(userId);
    
    // Get notification template
    const template = getTemplateByName(type, style);
    
    if (!template) {
      logger.warn(`Notification template not found for type: ${type}, style: ${style}`);
      return false;
    }
    
    // Format message and prepare options
    const message = formatTemplate(template.text, data);
    const options = {
      parse_mode: template.parseMode || 'Markdown',
      disable_web_page_preview: template.disablePreview || false,
    };
    
    // Add reply markup if provided in template
    if (template.keyboard) {
      options.reply_markup = {
        inline_keyboard: template.keyboard,
      };
    }
    
    // Send notification
    await ctx.telegram.sendMessage(userId, message, options);
    logger.info(`Notification sent to user ${userId}: ${type}`);
    
    // Log notification to log channel if configured
    if (config.LOG_CHANNEL_ID) {
      try {
        const logMessage = `📣 *Notification Sent*\n\n` +
                          `Type: ${type}\n` +
                          `User: ${userId}\n` +
                          `Time: ${new Date().toISOString()}\n` +
                          `Style: ${style}`;
        
        await ctx.telegram.sendMessage(config.LOG_CHANNEL_ID, logMessage, {
          parse_mode: 'Markdown',
        });
      } catch (logError) {
        logger.error('Failed to log notification to channel:', logError);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send a notification to all users
 * @param {Object} ctx - Telegraf context
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Result with success and failure counts
 */
async function broadcastNotification(ctx, type, data = {}) {
  try {
    // Get all users
    const { getAllUsers } = require('../../database/users');
    const users = await getAllUsers();
    
    let successCount = 0;
    let failureCount = 0;
    
    // Send notification to each user
    for (const user of users) {
      try {
        const success = await sendNotification(ctx, user.id, type, data);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // Add a small delay to prevent flood limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (userError) {
        logger.error(`Error sending broadcast to user ${user.id}:`, userError);
        failureCount++;
      }
    }
    
    // Log broadcast to log channel if configured
    if (config.LOG_CHANNEL_ID) {
      try {
        const logMessage = `📣 *Broadcast Notification*\n\n` +
                          `Type: ${type}\n` +
                          `Total Users: ${users.length}\n` +
                          `Successful: ${successCount}\n` +
                          `Failed: ${failureCount}\n` +
                          `Time: ${new Date().toISOString()}`;
        
        await ctx.telegram.sendMessage(config.LOG_CHANNEL_ID, logMessage, {
          parse_mode: 'Markdown',
        });
      } catch (logError) {
        logger.error('Failed to log broadcast to channel:', logError);
      }
    }
    
    return {
      total: users.length,
      success: successCount,
      failure: failureCount,
    };
  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    throw error;
  }
}

/**
 * Send a popup notification via callback query answer
 * @param {Object} ctx - Telegraf context
 * @param {string} text - Notification text
 * @param {boolean} showAlert - Whether to show as alert
 * @returns {Promise<boolean>} Success status
 */
async function sendPopupNotification(ctx, text, showAlert = false) {
  try {
    await ctx.answerCbQuery(text, { show_alert: showAlert });
    return true;
  } catch (error) {
    logger.error('Error sending popup notification:', error);
    return false;
  }
}

/**
 * Format a template string with data
 * @param {string} template - Template string with placeholders
 * @param {Object} data - Data to insert into template
 * @returns {string} Formatted string
 */
function formatTemplate(template, data) {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    return data[key] !== undefined ? data[key] : `{${key}}`;
  });
}

/**
 * Register notification handlers for bot events
 * @param {Object} bot - Telegraf bot instance
 */
function registerNotificationHandlers(bot) {
  // User join notification
  bot.on('new_chat_members', async (ctx) => {
    try {
      const newMembers = ctx.message.new_chat_members;
      
      for (const member of newMembers) {
        // Skip if the new member is the bot itself
        if (member.id === ctx.botInfo.id) continue;
        
        // Send welcome notification
        await sendNotification(ctx, ctx.chat.id, 'welcome', {
          userName: member.first_name,
          chatName: ctx.chat.title || 'the chat',
        });
      }
    } catch (error) {
      logger.error('Error handling new chat members:', error);
    }
  });
  
  // User leave notification
  bot.on('left_chat_member', async (ctx) => {
    try {
      const member = ctx.message.left_chat_member;
      
      // Skip if the leaving member is the bot itself
      if (member.id === ctx.botInfo.id) return;
      
      // Send goodbye notification
      await sendNotification(ctx, ctx.chat.id, 'goodbye', {
        userName: member.first_name,
        chatName: ctx.chat.title || 'the chat',
      });
    } catch (error) {
      logger.error('Error handling left chat member:', error);
    }
  });
}

module.exports = {
  sendNotification,
  broadcastNotification,
  sendPopupNotification,
  registerNotificationHandlers,
};
