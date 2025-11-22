const logger = require('../utils/logger');
const { getAllUsers } = require('../database/users');

/**
 * Send a message to all users with error handling dan retry logic
 * @param {Telegraf} bot - Bot instance
 * @param {string} message - Message to send
 * @param {Object} options - Additional options (parseMode, etc.)
 * @returns {Promise<Object>} Result dengan statistics
 */
async function broadcastToAllUsers(bot, message, options = {}) {
  try {
    const defaultOptions = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    };
    
    const users = await getAllUsers();
    
    if (users.length === 0) {
      return {
        success: true,
        totalUsers: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        blocked: 0,
        message: 'No users to broadcast to'
      };
    }
    
    logger.info(`Starting broadcast to ${users.length} users`);
    
    let sentCount = 0;
    let failedCount = 0;
    let blockedCount = 0;
    let skippedCount = 0;
    const failedUsers = [];
    const blockedUsers = [];
    
    // Send with rate limiting (50ms between each send to avoid flood limit)
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      try {
        // Validate user
        if (!user || !user.id) {
          logger.warn(`Invalid user data at index ${i}`);
          skippedCount++;
          continue;
        }
        
        try {
          // Try to send message
          await bot.telegram.sendMessage(user.id, message, defaultOptions);
          sentCount++;
          
          logger.debug(`Broadcast sent to user ${user.id}`);
        } catch (sendError) {
          const errorMsg = sendError.message.toLowerCase();
          
          // Check if user blocked the bot
          if (errorMsg.includes('blocked by the user') || 
              errorMsg.includes('user is deactivated') ||
              errorMsg.includes('bot was blocked')) {
            blockedCount++;
            blockedUsers.push(user.id);
            logger.warn(`User ${user.id} has blocked the bot`);
          } else if (errorMsg.includes('forbidden') || errorMsg.includes('not found')) {
            failedCount++;
            failedUsers.push({ id: user.id, error: sendError.message });
            logger.error(`Failed to send to user ${user.id}: ${sendError.message}`);
          } else {
            // Try retry once
            try {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              await bot.telegram.sendMessage(user.id, message, defaultOptions);
              sentCount++;
              logger.debug(`Broadcast sent to user ${user.id} on retry`);
            } catch (retryError) {
              failedCount++;
              failedUsers.push({ id: user.id, error: retryError.message });
              logger.error(`Failed to send to user ${user.id} on retry: ${retryError.message}`);
            }
          }
        }
      } catch (error) {
        logger.error(`Error processing user ${user.id}:`, error);
        skippedCount++;
      }
      
      // Rate limit: add delay every 10 messages (Telegram's flood limit is 30 msgs/second)
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const result = {
      success: true,
      totalUsers: users.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      blocked: blockedCount,
      failedUsers: failedUsers.slice(0, 10), // Only return first 10 for logs
      blockedUsers: blockedUsers.length > 0 ? `${blockedUsers.length} users` : 0,
      successRate: `${((sentCount / users.length) * 100).toFixed(2)}%`
    };
    
    logger.info(`Broadcast completed: ${sentCount}/${users.length} sent, ${failedCount} failed, ${blockedCount} blocked`);
    
    return result;
  } catch (error) {
    logger.error('Error in broadcastToAllUsers:', error);
    return {
      success: false,
      error: error.message,
      sent: 0
    };
  }
}

/**
 * Send a message to specific users
 * @param {Telegraf} bot - Bot instance
 * @param {Array<number>} userIds - Array of user IDs
 * @param {string} message - Message to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result dengan statistics
 */
async function broadcastToUsers(bot, userIds, message, options = {}) {
  try {
    const defaultOptions = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    };
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {
        success: false,
        error: 'No user IDs provided',
        sent: 0
      };
    }
    
    logger.info(`Broadcasting to ${userIds.length} specific users`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      try {
        // Validate user ID
        if (!Number.isInteger(userId)) {
          logger.warn(`Invalid user ID: ${userId}`);
          failedCount++;
          continue;
        }
        
        await bot.telegram.sendMessage(userId, message, defaultOptions);
        sentCount++;
        
        // Rate limiting
        if ((i + 1) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        logger.error(`Failed to send to user ${userId}:`, error.message);
        failedCount++;
      }
    }
    
    return {
      success: failedCount === 0,
      totalUsers: userIds.length,
      sent: sentCount,
      failed: failedCount,
      successRate: `${((sentCount / userIds.length) * 100).toFixed(2)}%`
    };
  } catch (error) {
    logger.error('Error in broadcastToUsers:', error);
    return {
      success: false,
      error: error.message,
      sent: 0
    };
  }
}

module.exports = {
  broadcastToAllUsers,
  broadcastToUsers
};
