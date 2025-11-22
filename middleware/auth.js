const { addUser, getUser } = require('../database/users');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Authentication middleware
 * @returns {Function} Middleware function
 */
function setupAuth() {
  return async (ctx, next) => {
    try {
      const startTime = Date.now();
      
      // Skip if no user information
      if (!ctx.from) {
        return await next();
      }
      
      // Check if user exists, create if not
      const user = await getUser(ctx.from.id);
      
      if (!user) {
        // Add new user to database
        const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
        await addUser(ctx.from, isAdmin);
        
        // Log new user
        logger.info(`New user: ${ctx.from.first_name} (${ctx.from.id})`);
      }
      
      // Store performance metrics
      ctx.state.startTime = startTime;
      
      // Process next middleware
      await next();
    } catch (error) {
      logger.error('Error in auth middleware:', error);
      await next();
    }
  };
}

/**
 * Admin-only middleware
 * @returns {Function} Middleware function
 */
function adminOnly() {
  return async (ctx, next) => {
    try {
      // Check if user is an admin
      if (!config.ADMIN_IDS.includes(ctx.from.id)) {
        await ctx.reply('⛔ You do not have permission to access this command.');
        return;
      }
      
      // User is an admin, continue
      await next();
    } catch (error) {
      logger.error('Error in adminOnly middleware:', error);
      await next();
    }
  };
}

module.exports = {
  setupAuth,
  adminOnly,
};
