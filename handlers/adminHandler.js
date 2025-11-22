const { Markup } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const { getFeaturesDb } = require('../database/db');
const { addUser, getUser, setUserAdmin } = require('../database/users');
const { createFeatureFromTemplate } = require('../modules/ai/featureGenerator');
const { generateFeatureWithAI } = require('../modules/ai/aiService');

module.exports = (bot) => {
  // Handle text messages from admins (for feature generation etc.)
  bot.on('text', async (ctx, next) => {
    try {
      // Check if we're in feature generation mode
      if (ctx.session.featureGeneratorState && config.ADMIN_IDS.includes(ctx.from.id)) {
        // Handle based on current state
        switch (ctx.session.featureGeneratorState) {
          case 'awaiting_template_info':
            await handleTemplateInfo(ctx);
            return; // Stop processing
          
          case 'awaiting_ai_description':
            await handleAIDescription(ctx);
            return; // Stop processing
          
          case 'awaiting_json_import':
            await handleJsonImport(ctx);
            return; // Stop processing
          
          case 'awaiting_custom_info':
            await handleCustomInfo(ctx);
            return; // Stop processing
          
          case 'awaiting_custom_code':
            await handleCustomCode(ctx);
            return; // Stop processing
        }
      }
      
      // Handle /makeadmin command
      if (ctx.message.text.startsWith('/makeadmin') && config.ADMIN_IDS.includes(ctx.from.id)) {
        await handleMakeAdmin(ctx);
        return; // Stop processing
      }
      
      // Handle /removeadmin command
      if (ctx.message.text.startsWith('/removeadmin') && config.ADMIN_IDS.includes(ctx.from.id)) {
        await handleRemoveAdmin(ctx);
        return; // Stop processing
      }
      
      // If we get here, continue to next middleware
      await next();
    } catch (error) {
      logger.error('Error in admin text handler:', error);
      await ctx.reply('Error in admin handler: ' + error.message);
    }
  });
  
  // Handle file uploads for JSON import
  bot.on('document', async (ctx) => {
    try {
      // Check if we're expecting a JSON file import
      if (ctx.session.featureGeneratorState === 'awaiting_json_import' && config.ADMIN_IDS.includes(ctx.from.id)) {
        // Get file information
        const fileInfo = await ctx.telegram.getFile(ctx.message.document.file_id);
        
        // Check if it's a JSON file
        if (!ctx.message.document.file_name.endsWith('.json')) {
          await ctx.reply('❌ Please upload a JSON file. The file should have a .json extension.');
          return;
        }
        
        // Download the file
        const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${fileInfo.file_path}`;
        const response = await fetch(fileUrl);
        const jsonText = await response.text();
        
        // Process the JSON import
        await processJsonImport(ctx, jsonText);
      }
    } catch (error) {
      logger.error('Error handling document upload:', error);
      await ctx.reply('Error processing uploaded file: ' + error.message);
    }
  });
};

// Handle /makeadmin command
async function handleMakeAdmin(ctx) {
  try {
    // Parse user ID from command
    const userId = parseInt(ctx.message.text.split(' ')[1]);
    
    if (!userId) {
      return ctx.reply('❌ Please provide a valid user ID. Usage: /makeadmin 123456789');
    }
    
    // Check if user exists
    const user = await getUser(userId);
    
    if (!user) {
      return ctx.reply(`❌ User with ID ${userId} not found.`);
    }
    
    // Check if user is already an admin
    if (user.isAdmin) {
      return ctx.reply(`❌ User ${user.first_name} (${userId}) is already an admin.`);
    }
    
    // Make user an admin
    await setUserAdmin(userId, true);
    
    await ctx.reply(`✅ User ${user.first_name} (${userId}) is now an admin.`);
    
    // Notify the user they've been made an admin
    await ctx.telegram.sendMessage(userId, 
      `🎉 Congratulations! You have been granted admin privileges for ${config.BOT_NAME}. Use /admin to access the admin panel.`
    );
    
    // Log the action
    logger.info(`User ${user.first_name} (${userId}) was made admin by ${ctx.from.id}`);
  } catch (error) {
    logger.error('Error in handleMakeAdmin:', error);
    await ctx.reply('Error making user an admin: ' + error.message);
  }
}

// Handle /removeadmin command
async function handleRemoveAdmin(ctx) {
  try {
    // Parse user ID from command
    const userId = parseInt(ctx.message.text.split(' ')[1]);
    
    if (!userId) {
      return ctx.reply('❌ Please provide a valid user ID. Usage: /removeadmin 123456789');
    }
    
    // Check if user exists
    const user = await getUser(userId);
    
    if (!user) {
      return ctx.reply(`❌ User with ID ${userId} not found.`);
    }
    
    // Check if user is an admin
    if (!user.isAdmin) {
      return ctx.reply(`❌ User ${user.first_name} (${userId}) is not an admin.`);
    }
    
    // Check if user is removing themselves
    if (userId === ctx.from.id) {
      return ctx.reply('❌ You cannot remove yourself as admin.');
    }
    
    // Remove admin privileges
    await setUserAdmin(userId, false);
    
    await ctx.reply(`✅ Admin privileges removed from user ${user.first_name} (${userId}).`);
    
    // Notify the user
    await ctx.telegram.sendMessage(userId, 
      `ℹ️ Your admin privileges for ${config.BOT_NAME} have been removed.`
    );
    
    // Log the action
    logger.info(`Admin privileges removed from user ${user.first_name} (${userId}) by ${ctx.from.id}`);
  } catch (error) {
    logger.error('Error in handleRemoveAdmin:', error);
    await ctx.reply('Error removing admin: ' + error.message);
  }
}

// Handle template information
async function handleTemplateInfo(ctx) {
  try {
    const text = ctx.message.text;
    
    // Check for cancel command
    if (text.toLowerCase() === '/cancel') {
      ctx.session.featureGeneratorState = null;
      return ctx.reply('Feature generation cancelled.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      });
    }
    
    // Parse template info
    const idMatch = text.match(/ID:\s*([a-z0-9_]+)/i);
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const descriptionMatch = text.match(/Description:\s*(.+)/i);
    const emojiMatch = text.match(/Emoji:\s*(\S+)/i);
    
    // Validate input
    if (!idMatch || !nameMatch || !descriptionMatch || !emojiMatch) {
      return ctx.reply(
        '❌ Invalid format. Please provide all required information in the correct format.\n\n' +
        'Example:\n' +
        'ID: weather\n' +
        'Name: Weather Forecast\n' +
        'Description: Get weather forecasts for any location\n' +
        'Emoji: 🌤'
      );
    }
    
    const featureId = idMatch[1].trim().toLowerCase();
    const featureName = nameMatch[1].trim();
    const featureDescription = descriptionMatch[1].trim();
    const featureEmoji = emojiMatch[1].trim();
    
    // Create feature from template
    await ctx.reply('⏳ Creating feature from template...');
    
    const feature = await createFeatureFromTemplate(featureId, featureName, featureDescription, featureEmoji);
    
    // Reset generator state
    ctx.session.featureGeneratorState = null;
    
    // Notify success
    await ctx.reply(
      `✅ Feature "${featureName}" created successfully!\n\n` +
      `ID: ${featureId}\n` +
      `Emoji: ${featureEmoji}\n\n` +
      `The feature is now available in the main menu.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleTemplateInfo:', error);
    await ctx.reply('Error creating feature: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}

// Handle AI description
async function handleAIDescription(ctx) {
  try {
    const description = ctx.message.text;
    
    // Check for cancel command
    if (description.toLowerCase() === '/cancel') {
      ctx.session.featureGeneratorState = null;
      return ctx.reply('Feature generation cancelled.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      });
    }
    
    // Validate description
    if (description.length < 10) {
      return ctx.reply('❌ Please provide a more detailed description of the feature you want to create.');
    }
    
    // Generate feature with AI
    await ctx.reply('⏳ Generating feature with AI... This may take a moment.');
    
    try {
      const feature = await generateFeatureWithAI(description);
      
      // Reset generator state
      ctx.session.featureGeneratorState = null;
      
      // Notify success
      await ctx.reply(
        `✅ Feature "${feature.name}" created successfully!\n\n` +
        `ID: ${feature.id}\n` +
        `Emoji: ${feature.emoji}\n\n` +
        `Description: ${feature.description}\n\n` +
        `The feature is now available in the main menu.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
            ]
          }
        }
      );
    } catch (error) {
      logger.error('AI feature generation error:', error);
      await ctx.reply(
        `❌ Failed to generate feature with AI: ${error.message}\n\n` +
        'Please try again with a more specific description or use a template instead.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
            ]
          }
        }
      );
    }
  } catch (error) {
    logger.error('Error in handleAIDescription:', error);
    await ctx.reply('Error creating feature: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}

// Handle JSON import
async function handleJsonImport(ctx) {
  try {
    // Check for cancel command
    if (ctx.message.text.toLowerCase() === '/cancel') {
      ctx.session.featureGeneratorState = null;
      return ctx.reply('Feature import cancelled.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      });
    }
    
    // Process the JSON text
    await processJsonImport(ctx, ctx.message.text);
  } catch (error) {
    logger.error('Error in handleJsonImport:', error);
    await ctx.reply('Error importing feature: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}

// Process JSON import
async function processJsonImport(ctx, jsonText) {
  try {
    // Parse JSON
    let featureData;
    try {
      featureData = JSON.parse(jsonText);
    } catch (error) {
      return ctx.reply('❌ Invalid JSON format. Please check your JSON and try again.');
    }
    
    // Validate feature data
    if (!featureData.id || !featureData.name || !featureData.description || !featureData.emoji) {
      return ctx.reply(
        '❌ Invalid feature data. The JSON must include id, name, description, and emoji fields.'
      );
    }
    
    // Check if feature with same ID already exists
    const featuresDb = getFeaturesDb();
    const existingFeature = featuresDb.data.features.find(f => f.id === featureData.id);
    
    if (existingFeature) {
      return ctx.reply(
        `❌ A feature with ID "${featureData.id}" already exists.\n\n` +
        'Please use a different feature ID or remove the existing feature first.'
      );
    }
    
    // Create directories for the feature
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, featureData.id);
    await fs.ensureDir(featureDir);
    
    // Create feature files
    const featureFile = path.join(featureDir, `${featureData.id}.js`);
    
    // Create basic feature module
    const featureModuleCode = `
// ${featureData.name} Feature
// Generated from JSON import at ${new Date().toISOString()}

module.exports = {
  // Handle action callbacks for this feature
  async handleAction(ctx, action, feature) {
    try {
      ctx.answerCbQuery();
      
      switch (action.id) {
        // Add cases for your actions here
        default:
          await ctx.reply(\`Action \${action.id} not implemented yet.\`);
          break;
      }
      
      return true;
    } catch (error) {
      console.error(\`Error in ${featureData.id} handleAction:\`, error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  },
  
  // Handle custom callbacks for this feature
  async handleCallback(ctx, callbackData) {
    try {
      // Check if this callback is for this feature
      if (!callbackData.startsWith('${featureData.id}:')) {
        return false;
      }
      
      const parts = callbackData.split(':');
      const action = parts[1];
      
      switch (action) {
        // Add cases for your custom callbacks here
        default:
          return false;
      }
    } catch (error) {
      console.error(\`Error in ${featureData.id} handleCallback:\`, error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  }
};
`;
    
    await fs.writeFile(featureFile, featureModuleCode);
    
    // Add feature to database
    const newFeature = {
      id: featureData.id,
      name: featureData.name,
      description: featureData.description,
      emoji: featureData.emoji,
      enabled: featureData.enabled !== false, // Default to true if not specified
      submenus: featureData.submenus || [],
      actions: featureData.actions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    featuresDb.data.features.push(newFeature);
    await featuresDb.write();
    
    // Reset generator state
    ctx.session.featureGeneratorState = null;
    
    // Notify success
    await ctx.reply(
      `✅ Feature "${featureData.name}" imported successfully!\n\n` +
      `ID: ${featureData.id}\n` +
      `Emoji: ${featureData.emoji}\n\n` +
      `The feature is now available in the main menu.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in processJsonImport:', error);
    await ctx.reply('Error importing feature: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}

// Handle custom feature info
async function handleCustomInfo(ctx) {
  try {
    const text = ctx.message.text;
    
    // Check for cancel command
    if (text.toLowerCase() === '/cancel') {
      ctx.session.featureGeneratorState = null;
      return ctx.reply('Feature generation cancelled.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      });
    }
    
    // Parse template info
    const idMatch = text.match(/ID:\s*([a-z0-9_]+)/i);
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const descriptionMatch = text.match(/Description:\s*(.+)/i);
    const emojiMatch = text.match(/Emoji:\s*(\S+)/i);
    
    // Validate input
    if (!idMatch || !nameMatch || !descriptionMatch || !emojiMatch) {
      return ctx.reply(
        '❌ Invalid format. Please provide all required information in the correct format.\n\n' +
        'Example:\n' +
        'ID: weather\n' +
        'Name: Weather Forecast\n' +
        'Description: Get weather forecasts for any location\n' +
        'Emoji: 🌤'
      );
    }
    
    const featureId = idMatch[1].trim().toLowerCase();
    const featureName = nameMatch[1].trim();
    const featureDescription = descriptionMatch[1].trim();
    const featureEmoji = emojiMatch[1].trim();
    
    // Check if feature with same ID already exists
    const featuresDb = getFeaturesDb();
    const existingFeature = featuresDb.data.features.find(f => f.id === featureId);
    
    if (existingFeature) {
      return ctx.reply(
        `❌ A feature with ID "${featureId}" already exists.\n\n` +
        'Please use a different feature ID or remove the existing feature first.'
      );
    }
    
    // Store feature info in session
    ctx.session.customFeatureInfo = {
      id: featureId,
      name: featureName,
      description: featureDescription,
      emoji: featureEmoji
    };
    
    // Update generator state to await code
    ctx.session.featureGeneratorState = 'awaiting_custom_code';
    
    // Prompt for code
    await ctx.reply(
      `📝 Now, please send me the custom code for your feature. This should be JavaScript code for a module with at least these functions:\n\n` +
      `- \`handleAction(ctx, action, feature)\`: Handle actions\n` +
      `- \`handleCallback(ctx, callbackData)\`: Handle custom callbacks\n\n` +
      `Example:\n\`\`\`javascript
module.exports = {
  async handleAction(ctx, action, feature) {
    try {
      // Handle action
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  },
  
  async handleCallback(ctx, callbackData) {
    try {
      // Handle callback
      return true/false;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  }
};
\`\`\`\n\n` +
      `Send your code as a text message or use /cancel to abort.`
    );
  } catch (error) {
    logger.error('Error in handleCustomInfo:', error);
    await ctx.reply('Error processing feature information: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}

// Handle custom code
async function handleCustomCode(ctx) {
  try {
    const code = ctx.message.text;
    
    // Check for cancel command
    if (code.toLowerCase() === '/cancel') {
      ctx.session.featureGeneratorState = null;
      ctx.session.customFeatureInfo = null;
      return ctx.reply('Feature generation cancelled.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      });
    }
    
    // Get feature info from session
    const featureInfo = ctx.session.customFeatureInfo;
    
    if (!featureInfo) {
      return ctx.reply('❌ Feature information not found. Please start over.');
    }
    
    // Create directories for the feature
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, featureInfo.id);
    await fs.ensureDir(featureDir);
    
    // Create feature files
    const featureFile = path.join(featureDir, `${featureInfo.id}.js`);
    
    // Save custom code
    await fs.writeFile(featureFile, code);
    
    // Add feature to database
    const featuresDb = getFeaturesDb();
    const newFeature = {
      id: featureInfo.id,
      name: featureInfo.name,
      description: featureInfo.description,
      emoji: featureInfo.emoji,
      enabled: true,
      submenus: [],
      actions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    featuresDb.data.features.push(newFeature);
    await featuresDb.write();
    
    // Reset generator state
    ctx.session.featureGeneratorState = null;
    ctx.session.customFeatureInfo = null;
    
    // Notify success
    await ctx.reply(
      `✅ Feature "${featureInfo.name}" created successfully with custom code!\n\n` +
      `ID: ${featureInfo.id}\n` +
      `Emoji: ${featureInfo.emoji}\n\n` +
      `The feature is now available in the main menu.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in handleCustomCode:', error);
    await ctx.reply('Error creating feature: ' + error.message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin', callback_data: 'admin' }]
        ]
      }
    });
  }
}
