const logger = require('../../utils/logger');
const config = require('../../config/config');
const { getStatsDb, backupDatabases } = require('../../database/db');
const { reloadFeatures } = require('../../features/featureLoader');
const { generateDebugSuggestions } = require('./aiService');

/**
 * Auto-fixer: scans recent errors and attempts safe automated fixes.
 * - Uses AI to generate suggestions (if available)
 * - Can apply non-destructive fixes: reload features, restore from last backup
 * - Not a miracle: complex code changes are only suggested and sent to admins
 */
async function scanAndFix(bot, options = {}) {
  try {
    if (!bot) {
      logger.warn('AutoFixer: bot instance not provided');
      return { ok: false, message: 'No bot instance' };
    }

    const statsDb = getStatsDb();
    if (!statsDb) {
      logger.warn('AutoFixer: stats DB not available');
      return { ok: false, message: 'Stats DB not available' };
    }

    // Get recent errors (last 20)
    const errors = (statsDb.data.performanceStats.errors || []).slice(-20);
    if (errors.length === 0) {
      logger.debug('AutoFixer: no recent errors to analyze');
      return { ok: true, message: 'No errors' };
    }

    // Summarize errors for AI analysis
    const errorSummary = errors.map(e => ({ timestamp: e.timestamp, message: e.message, stack: e.stack })).slice(-10);

    // Attempt to get AI suggestions
    let suggestions = null;
    try {
      if (typeof generateDebugSuggestions === 'function') {
        suggestions = await generateDebugSuggestions(errorSummary);
      }
    } catch (aiErr) {
      logger.warn('AutoFixer: AI suggestions failed:', aiErr.message);
    }

    // Compose admin notification
    const adminMessage = `🛠️ AutoFixer scanned recent errors (count: ${errors.length}).\n` +
      `Suggestions:\n${suggestions ? suggestions : 'No AI suggestions available.'}`;

    // Send suggestions to admins (non-blocking)
    if (config.ADMIN_IDS && Array.isArray(config.ADMIN_IDS) && config.ADMIN_IDS.length > 0) {
      for (const adminId of config.ADMIN_IDS) {
        try {
          await bot.telegram.sendMessage(adminId, adminMessage, { parse_mode: 'Markdown' });
        } catch (err) {
          logger.warn(`AutoFixer: failed to notify admin ${adminId}: ${err.message}`);
        }
      }
    }

    // If auto-fix disabled, only notify
    if (!config.AUTO_FIX_ENABLED) {
      logger.info('AutoFixer: AUTO_FIX_ENABLED is false — no automatic fixes applied');
      return { ok: true, message: 'Not applying fixes (disabled)', suggestions };
    }

    // Apply safe fixes: reload features if many module errors detected
    const moduleLoadErrors = errors.filter(e => (e.message || '').toLowerCase().includes('failed to load feature') || (e.stack || '').toLowerCase().includes('require'));
    if (moduleLoadErrors.length > 0) {
      logger.info('AutoFixer: Detected module load errors, attempting to reload features');
      try {
        const loaded = await reloadFeatures(bot);
        logger.info(`AutoFixer: reloadFeatures completed, loaded ${loaded} features`);
        // Notify admins about reload result
        for (const adminId of config.ADMIN_IDS) {
          try {
            await bot.telegram.sendMessage(adminId, `🔁 AutoFixer reloaded dynamic features. Loaded: ${loaded}`);
          } catch (err) {
            logger.debug('AutoFixer: failed to notify admin about reload');
          }
        }
      } catch (reloadErr) {
        logger.error('AutoFixer: reloadFeatures failed:', reloadErr);
      }
    }

    // If many errors and AUTO_FIX_RESTORE_ENABLED, try restore from last backup
    const frequentErrors = errors.length;
    if (frequentErrors >= (config.AUTO_FIX_ERROR_THRESHOLD || 20) && config.AUTO_FIX_RESTORE_ENABLED) {
      try {
        const backupDir = await backupDatabases();
        logger.info('AutoFixer: Created pre-restore backup at', backupDir);

        // Notify admins that restore is recommended (do not auto-restore unless explicitly allowed)
        for (const adminId of config.ADMIN_IDS) {
          try {
            await bot.telegram.sendMessage(adminId, `⚠️ AutoFixer detected ${frequentErrors} recent errors. A backup was created at ${backupDir}. Consider restoring from a known-good backup.`);
          } catch (err) {
            logger.debug('AutoFixer: failed to notify admin about backup');
          }
        }
      } catch (backupErr) {
        logger.error('AutoFixer: failed to create backup before restore suggestion:', backupErr);
      }
    }

    return { ok: true, suggestions };
  } catch (error) {
    logger.error('AutoFixer.scanAndFix error:', error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  scanAndFix
};
