const logger = require('../utils/logger');
const { getStatsDb } = require('../database/db');

/**
 * Setup stats tracking middleware
 * Automatically tracks all commands, features, and interactions
 * @returns {Function} Middleware function
 */
function setupStatsTracker() {
  return async (ctx, next) => {
    try {
      // Skip if no user information
      if (!ctx.from) {
        return await next();
      }
      
      const userId = ctx.from.id.toString();
      const startTime = Date.now();
      
      // Track command if this is a command message
      if (ctx.message && ctx.message.entities) {
        for (const entity of ctx.message.entities) {
          if (entity.type === 'bot_command') {
            const commandText = ctx.message.text.substring(entity.offset + 1, entity.offset + entity.length);
            const command = commandText.split('@')[0]; // Remove bot mention if present
            
            try {
              const statsDb = getStatsDb();
              
              // Initialize command stats if not exists
              if (!statsDb.data.usageStats.commandsUsed[command]) {
                statsDb.data.usageStats.commandsUsed[command] = 0;
              }
              
              // Increment command usage
              statsDb.data.usageStats.commandsUsed[command]++;
              
              // Initialize user activity if not exists
              if (!statsDb.data.usageStats.userActivity[userId]) {
                statsDb.data.usageStats.userActivity[userId] = {
                  commandsUsed: 0,
                  featuresUsed: 0,
                  callbacksTriggered: 0,
                  firstSeen: new Date().toISOString(),
                  lastActivity: new Date().toISOString(),
                };
              }
              
              // Increment user's command usage
              statsDb.data.usageStats.userActivity[userId].commandsUsed++;
              statsDb.data.usageStats.userActivity[userId].lastActivity = new Date().toISOString();
              
              await statsDb.write();
            } catch (error) {
              logger.warn(`Failed to track command ${command}:`, error.message);
            }
          }
        }
      }
      
      // Track callback queries
      if (ctx.callbackQuery) {
        try {
          const statsDb = getStatsDb();
          
          // Initialize user activity if not exists
          if (!statsDb.data.usageStats.userActivity[userId]) {
            statsDb.data.usageStats.userActivity[userId] = {
              commandsUsed: 0,
              featuresUsed: 0,
              callbacksTriggered: 0,
              firstSeen: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
            };
          }
          
          // Increment callback interactions
          statsDb.data.usageStats.userActivity[userId].callbacksTriggered++;
          statsDb.data.usageStats.userActivity[userId].lastActivity = new Date().toISOString();
          
          await statsDb.write();
        } catch (error) {
          logger.warn(`Failed to track callback:`, error.message);
        }
      }
      
      // Store start time for response time tracking
      ctx.state.statsStartTime = startTime;
      
      // Continue to next middleware
      await next();
      
      // Track response time (after response is processed)
      const responseTime = Date.now() - startTime;
      
      try {
        const statsDb = getStatsDb();
        
        // Add response time to stats (keep only last 100)
        if (!Array.isArray(statsDb.data.performanceStats.responseTime)) {
          statsDb.data.performanceStats.responseTime = [];
        }
        
        statsDb.data.performanceStats.responseTime.push(responseTime);
        if (statsDb.data.performanceStats.responseTime.length > 100) {
          statsDb.data.performanceStats.responseTime = statsDb.data.performanceStats.responseTime.slice(-100);
        }
        
        await statsDb.write();
      } catch (error) {
        logger.debug(`Failed to track response time:`, error.message);
      }
    } catch (error) {
      logger.error('Error in stats tracker middleware:', error);
      await next();
    }
  };
}

module.exports = {
  setupStatsTracker,
};
