const os = require('os');
const cron = require('node-cron');
const logger = require('../../utils/logger');
const config = require('../../config/config');

/**
 * Initialize performance monitoring
 * @param {Object} bot - Telegraf bot instance
 */
function initPerformanceMonitoring(bot) {
  try {
    // Record initial stats
    recordPerformanceStats();
    
    // Schedule regular performance logging
    cron.schedule('*/30 * * * *', async () => { // Every 30 minutes
      await recordPerformanceStats();
    });
    
    // Schedule daily performance report
    cron.schedule('0 0 * * *', async () => { // Every day at midnight
      await sendPerformanceReport(bot);
    });
    
    logger.info('Performance monitoring initialized');
  } catch (error) {
    logger.error('Error initializing performance monitoring:', error);
  }
}

/**
 * Record current performance stats
 * @returns {Promise<Object>} Performance stats
 */
async function recordPerformanceStats() {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Get system stats
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };
    const loadAvg = os.loadavg();
    
    // Create stats object
    const stats = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        loadAvg: loadAvg,
        uptime: os.uptime(),
        cpus: os.cpus().length,
        memory: systemMemory,
      },
      process: {
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0,
        },
        memoryUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
    };
    
    // Add to stats database
    statsDb.data.performanceStats.memoryUsage.push(stats);
    
    // Keep only the last 1000 entries
    if (statsDb.data.performanceStats.memoryUsage.length > 1000) {
      statsDb.data.performanceStats.memoryUsage = statsDb.data.performanceStats.memoryUsage.slice(-1000);
    }
    
    await statsDb.write();
    
    if (config.DEBUG_MODE) {
      logger.debug('Performance stats recorded', { stats });
    }
    
    return stats;
  } catch (error) {
    logger.error('Error recording performance stats:', error);
    throw error;
  }
}

/**
 * Send performance report to admins
 * @param {Object} bot - Telegraf bot instance
 * @returns {Promise<void>}
 */
async function sendPerformanceReport(bot) {
  try {
    // Get stats
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Get recent memory usage (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentStats = statsDb.data.performanceStats.memoryUsage.filter(
      stat => new Date(stat.timestamp) > oneDayAgo
    );
    
    if (recentStats.length === 0) {
      logger.warn('No performance stats available for report');
      return;
    }
    
    // Calculate averages
    const avgHeapUsed = recentStats.reduce((sum, stat) => sum + stat.process.memory.heapUsed, 0) / recentStats.length;
    const avgHeapTotal = recentStats.reduce((sum, stat) => sum + stat.process.memory.heapTotal, 0) / recentStats.length;
    const avgMemoryPercent = recentStats.reduce((sum, stat) => sum + stat.process.memoryUsagePercent, 0) / recentStats.length;
    const avgLoadAvg = recentStats.reduce((sum, stat) => sum + stat.system.loadAvg[0], 0) / recentStats.length;
    
    // Get latest stats
    const latestStats = recentStats[recentStats.length - 1];
    
    // Count errors in the last 24 hours
    const recentErrors = statsDb.data.performanceStats.errors.filter(
      error => new Date(error.timestamp) > oneDayAgo
    ).length;
    
    // Create report message
    const reportMessage = `📊 *Daily Performance Report*\n\n` +
                        `🕒 *Report Time:* ${new Date().toISOString()}\n\n` +
                        `💾 *Memory Usage:*\n` +
                        `- Current: ${formatBytes(latestStats.process.memory.heapUsed)} / ${formatBytes(latestStats.process.memory.heapTotal)} (${latestStats.process.memoryUsagePercent.toFixed(2)}%)\n` +
                        `- 24h Avg: ${formatBytes(avgHeapUsed)} / ${formatBytes(avgHeapTotal)} (${avgMemoryPercent.toFixed(2)}%)\n\n` +
                        `🖥️ *System:*\n` +
                        `- Platform: ${latestStats.system.platform} ${latestStats.system.arch}\n` +
                        `- CPUs: ${latestStats.system.cpus}\n` +
                        `- Load Avg: ${latestStats.system.loadAvg[0].toFixed(2)} (Current), ${avgLoadAvg.toFixed(2)} (24h Avg)\n\n` +
                        `⏱️ *Uptime:*\n` +
                        `- Bot: ${formatUptime(latestStats.process.uptime)}\n` +
                        `- System: ${formatUptime(latestStats.system.uptime)}\n\n` +
                        `❌ *Errors (24h):* ${recentErrors}`;
    
    // Send to admins
    for (const adminId of config.ADMIN_IDS) {
      try {
        await bot.telegram.sendMessage(adminId, reportMessage, {
          parse_mode: 'Markdown',
        });
      } catch (error) {
        logger.error(`Error sending performance report to admin ${adminId}:`, error);
      }
    }
    
    // Send to log channel if configured
    if (config.LOG_CHANNEL_ID) {
      try {
        await bot.telegram.sendMessage(config.LOG_CHANNEL_ID, reportMessage, {
          parse_mode: 'Markdown',
        });
      } catch (error) {
        logger.error('Error sending performance report to log channel:', error);
      }
    }
    
    logger.info('Performance report sent');
  } catch (error) {
    logger.error('Error sending performance report:', error);
  }
}

/**
 * Track response time for a command or callback
 * @param {number} responseTime - Response time in milliseconds
 * @returns {Promise<void>}
 */
async function trackResponseTime(responseTime) {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    statsDb.data.performanceStats.responseTime.push(responseTime);
    
    // Keep only the last 1000 entries
    if (statsDb.data.performanceStats.responseTime.length > 1000) {
      statsDb.data.performanceStats.responseTime = statsDb.data.performanceStats.responseTime.slice(-1000);
    }
    
    await statsDb.write();
  } catch (error) {
    logger.error('Error tracking response time:', error);
  }
}

/**
 * Get performance statistics
 * @param {string} timeframe - Timeframe to get stats for ('day', 'week', 'month')
 * @returns {Promise<Object>} Performance statistics
 */
async function getPerformanceStats(timeframe = 'day') {
  try {
    const { getStatsDb } = require('../../database/db');
    const statsDb = getStatsDb();
    
    // Determine cutoff date
    let cutoff = new Date();
    switch (timeframe) {
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'day':
      default:
        cutoff.setDate(cutoff.getDate() - 1);
        break;
    }
    
    // Get stats within timeframe
    const memoryStats = statsDb.data.performanceStats.memoryUsage.filter(
      stat => new Date(stat.timestamp) > cutoff
    );
    
    const responseTimes = statsDb.data.performanceStats.responseTime;
    const errors = statsDb.data.performanceStats.errors.filter(
      error => new Date(error.timestamp) > cutoff
    );
    
    // Calculate statistics
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    const maxResponseTime = responseTimes.length > 0
      ? Math.max(...responseTimes)
      : 0;
    
    // Group memory stats by hour
    const memoryByHour = {};
    for (const stat of memoryStats) {
      const hour = new Date(stat.timestamp).getHours();
      if (!memoryByHour[hour]) {
        memoryByHour[hour] = [];
      }
      memoryByHour[hour].push(stat.process.memoryUsagePercent);
    }
    
    // Calculate average memory usage by hour
    const memoryUsageByHour = Object.entries(memoryByHour).map(([hour, values]) => ({
      hour: parseInt(hour),
      avgUsage: values.reduce((sum, val) => sum + val, 0) / values.length,
    }));
    
    return {
      timeframe,
      avgResponseTime,
      maxResponseTime,
      errorCount: errors.length,
      memoryStats: {
        current: memoryStats.length > 0 ? memoryStats[memoryStats.length - 1].process.memoryUsagePercent : 0,
        average: memoryStats.length > 0
          ? memoryStats.reduce((sum, stat) => sum + stat.process.memoryUsagePercent, 0) / memoryStats.length
          : 0,
        byHour: memoryUsageByHour,
      },
    };
  } catch (error) {
    logger.error('Error getting performance stats:', error);
    throw error;
  }
}

// Utility functions
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds - minutes * 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  initPerformanceMonitoring,
  recordPerformanceStats,
  sendPerformanceReport,
  trackResponseTime,
  getPerformanceStats,
};
