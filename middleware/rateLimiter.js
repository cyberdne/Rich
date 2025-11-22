const logger = require('../utils/logger');
const config = require('../config/config');

// Store for rate limiting
const userRequests = {};

/**
 * Setup rate limiter middleware
 * @returns {Function} Middleware function
 */
function setupRateLimiter() {
  return async (ctx, next) => {
    try {
      // Skip if no user information
      if (!ctx.from) {
        return await next();
      }
      
      const userId = ctx.from.id;
      const now = Date.now();
      
      // Initialize user in the store if needed
      if (!userRequests[userId]) {
        userRequests[userId] = {
          requests: [],
          blocked: false,
          blockUntil: 0,
        };
      }
      
      const userStore = userRequests[userId];
      
      // Check if user is currently blocked
      if (userStore.blocked && now < userStore.blockUntil) {
        const remainingSeconds = Math.ceil((userStore.blockUntil - now) / 1000);
        
        // Skip the middleware chain
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery(`You're sending requests too quickly. Please wait ${remainingSeconds} seconds.`, { show_alert: true });
        }
        
        return;
      }
      
      // User is no longer blocked
      if (userStore.blocked && now >= userStore.blockUntil) {
        userStore.blocked = false;
      }
      
      // Filter out old requests
      userStore.requests = userStore.requests.filter(time => now - time < config.RATE_LIMIT.window);
      
      // Add current request
      userStore.requests.push(now);
      
      // Check if rate limit is exceeded
      if (userStore.requests.length > config.RATE_LIMIT.limit) {
        // Block user
        userStore.blocked = true;
        userStore.blockUntil = now + config.RATE_LIMIT.userBlockTimeout;
        
        const remainingSeconds = Math.ceil(config.RATE_LIMIT.userBlockTimeout / 1000);
        
        logger.warn(`Rate limit exceeded for user ${userId}, blocked for ${remainingSeconds} seconds`);
        
        // Inform user
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery(`You're sending requests too quickly. Please wait ${remainingSeconds} seconds.`, { show_alert: true });
        } else {
          await ctx.reply(`⚠️ You're sending requests too quickly. Please wait ${remainingSeconds} seconds before trying again.`);
        }
        
        return;
      }
      
      // Continue processing
      await next();
    } catch (error) {
      logger.error('Error in rate limiter middleware:', error);
      await next();
    }
  };
}

module.exports = {
  setupRateLimiter,
};
