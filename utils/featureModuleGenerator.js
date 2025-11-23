const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Generate a proper feature module template
 * @param {Object} feature - Feature object
 * @returns {string} Generated JavaScript code for the feature module
 */
function generateFeatureModuleCode(feature) {
  // Generate action handlers with polished messages
  const actionHandlers = feature.actions?.map(action => `
    case '${action.id}':
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(\`
🎯 *${action.name}*

${action.description || 'No description provided.'}

_Tip: this action was generated automatically. If you are the admin you can customize its behavior._
\`);
      break;`).join('\n') || `
    default:
      await ctx.answerCbQuery();
      await ctx.reply('⚠️ Unknown action.');
      break;`;

  // Generate submenu action handlers
  const submenuActions = (feature.submenus || []).flatMap(submenu =>
    (submenu.actions || []).map(action => `
    case '${submenu.id}:${action.id}':
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(\`📋 *${submenu.name}* > *${action.name}*\n\n${action.description || 'No description provided.'}\`);
      break;`)
  ).join('\n') || '';

  // Generate submenu handlers
  const submenuHandlers = (feature.submenus || []).map(submenu => `
    case '${submenu.id}':
      await ctx.answerCbQuery();
      const submenuText = \`🎯 *${submenu.name}*\n\n${submenu.description || 'No description provided.'}\n\nSelect an option:\`;
      
      const submenuKeyboard = [
        ${(submenu.actions || []).map(action => `{ text: '${action.emoji || "⚙️"} ${action.name}', callback_data: '${feature.id}:${submenu.id}:${action.id}' }`).join(',\n        ')}${(submenu.actions || []).length > 0 ? ',\n        ' : ''}{ text: '🔙 Back', callback_data: 'feature:${feature.id}' }
      ];
      
      try {
        await ctx.editMessageText(submenuText, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [submenuKeyboard] }
        });
      } catch (editError) {
        await ctx.reply(submenuText, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [submenuKeyboard] }
        });
      }
      break;`).join('\n') || '';

  const code = `
// ${feature.name} Feature
// Generated: ${new Date().toISOString()}
// Feature ID: ${feature.id}

const logger = require('../../utils/logger');

module.exports = {
  /**
   * Initialize the feature
   * Called when the bot starts
   */
  async init(bot, feature) {
    logger.info('${feature.name} feature initialized');
    // Add any initialization code here
    // For example: load data from external APIs, setup timers, etc.
  },

  /**
   * Handle action callbacks for this feature
   * Called when user interacts with action buttons
   */
  async handleAction(ctx, action, feature) {
    try {
      logger.debug(\`${feature.name}: handleAction called for action: \${action.id}\`);
      
      switch (action.id) {
${actionHandlers}
      }

      return true;
    } catch (error) {
      logger.error(\`Error in ${feature.id} handleAction:\`, error);
      await ctx.answerCbQuery();
      
      try {
        await ctx.reply('❌ An error occurred while processing your request: ' + error.message);
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
      
      return false;
    }
  },

  /**
   * Handle custom callbacks for this feature
   * Called for any callbacks matching this feature's ID
   */
  async handleCallback(ctx, callbackData) {
    try {
      logger.debug(\`${feature.name}: handleCallback called with data: \${callbackData}\`);
      
      // Check if this callback is for this feature
      if (!callbackData.startsWith('${feature.id}:')) {
        return false;
      }

      const parts = callbackData.split(':');
      
      // Handle different callback patterns
      if (parts.length === 2) {
        // Direct feature action: feature_id:action_id
        const actionId = parts[1];
        
        switch (actionId) {
${submenuHandlers}
          default:
            await ctx.answerCbQuery('Unknown action');
            return false;
        }
      } else if (parts.length === 3) {
        // Submenu action: feature_id:submenu_id:action_id
        const submenuId = parts[1];
        const actionId = parts[2];
        const callbackKey = \`\${submenuId}:\${actionId}\`;
        
        switch (callbackKey) {
${submenuActions}
          default:
            await ctx.answerCbQuery('Unknown action');
            return false;
        }
      }

      return true;
    } catch (error) {
      logger.error(\`Error in ${feature.id} handleCallback:\`, error);
      
      try {
        await ctx.answerCbQuery();
        await ctx.reply('❌ An error occurred: ' + error.message);
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
      
      return false;
    }
  }
};
`;

  return code;
}

/**
 * Create a new feature with proper module structure
 * @param {Object} featureData - Feature data object
 * @returns {Promise<Object>} Created feature
 */
async function createFeatureWithModule(featureData) {
  try {
    // Validate required fields
    if (!featureData.id || !featureData.name || !featureData.description) {
      throw new Error('Feature must have id, name, and description');
    }

    // Validate feature ID (alphanumeric + underscore only)
    if (!/^[a-z0-9_]+$/.test(featureData.id)) {
      throw new Error('Feature ID must contain only lowercase letters, numbers, and underscores');
    }

    // Create feature directory
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, featureData.id);
    await fs.ensureDir(featureDir);

    // Generate module code
    const moduleCode = generateFeatureModuleCode(featureData);

    // Write module file
    const moduleFile = path.join(featureDir, `${featureData.id}.js`);
    await fs.writeFile(moduleFile, moduleCode);

    logger.info(`Created feature module: ${featureData.id}`);

    // Add timestamps
    const feature = {
      ...featureData,
      id: featureData.id,
      name: featureData.name,
      description: featureData.description,
      emoji: featureData.emoji || '🎯',
      enabled: featureData.enabled !== false,
      submenus: featureData.submenus || [],
      actions: featureData.actions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return feature;
  } catch (error) {
    logger.error('Error creating feature with module:', error);
    throw error;
  }
}

/**
 * Update an existing feature module
 * @param {string} featureId - Feature ID
 * @param {Object} featureData - Updated feature data
 * @returns {Promise<void>}
 */
async function updateFeatureModule(featureId, featureData) {
  try {
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, featureId);

    // Generate updated module code
    const moduleCode = generateFeatureModuleCode(featureData);

    // Write updated module file
    const moduleFile = path.join(featureDir, `${featureId}.js`);
    await fs.writeFile(moduleFile, moduleCode);

    logger.info(`Updated feature module: ${featureId}`);
  } catch (error) {
    logger.error('Error updating feature module:', error);
    throw error;
  }
}

module.exports = {
  generateFeatureModuleCode,
  createFeatureWithModule,
  updateFeatureModule
};
