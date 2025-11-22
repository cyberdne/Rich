const logger = require('../../utils/logger');

const performanceMetrics = {
  responseTimes: [],
  memoryUsage: [],
  errorCount: 0,
};

/**
 * Track response time
 * @param {number} time - Response time in milliseconds
 */
async function trackResponseTime(time) {
  try {
    performanceMetrics.responseTimes.push({
      time,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 measurements
    if (performanceMetrics.responseTimes.length > 1000) {
      performanceMetrics.responseTimes = performanceMetrics.responseTimes.slice(-1000);
    }
  } catch (error) {
    logger.error('Error tracking response time:', error);
  }
}

/**
 * Track memory usage
 * @returns {Object} Memory usage statistics
 */
function trackMemoryUsage() {
  try {
    const memUsage = process.memoryUsage();
    
    performanceMetrics.memoryUsage.push({
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 measurements
    if (performanceMetrics.memoryUsage.length > 1000) {
      performanceMetrics.memoryUsage = performanceMetrics.memoryUsage.slice(-1000);
    }

    return memUsage;
  } catch (error) {
    logger.error('Error tracking memory usage:', error);
    return process.memoryUsage();
  }
}

/**
 * Get performance statistics
 * @returns {Object} Performance metrics
 */
function getPerformanceStats() {
  try {
    const responseTimes = performanceMetrics.responseTimes;
    const memoryUsage = performanceMetrics.memoryUsage;

    let avgResponseTime = 0;
    if (responseTimes.length > 0) {
      const sum = responseTimes.reduce((acc, m) => acc + m.time, 0);
      avgResponseTime = sum / responseTimes.length;
    }

    let avgMemory = 0;
    if (memoryUsage.length > 0) {
      const sum = memoryUsage.reduce((acc, m) => acc + m.heapUsed, 0);
      avgMemory = sum / memoryUsage.length;
    }

    return {
      averageResponseTime: avgResponseTime,
      averageMemoryUsage: avgMemory,
      totalMeasurements: responseTimes.length,
      errorCount: performanceMetrics.errorCount,
      uptime: process.uptime(),
      currentMemory: process.memoryUsage()
    };
  } catch (error) {
    logger.error('Error getting performance stats:', error);
    return {};
  }
}

/**
 * Increment error count
 */
function incrementErrorCount() {
  performanceMetrics.errorCount++;
}

module.exports = {
  trackResponseTime,
  trackMemoryUsage,
  getPerformanceStats,
  incrementErrorCount,
};
