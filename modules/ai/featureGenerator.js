const fs = require('fs-extra');
const path = require('path');
const { nanoid } = require('nanoid');
const logger = require('../../utils/logger');
const config = require('../../config/config');
const { addFeature } = require('../../features/featureLoader');

/**
 * Create a feature from template
 * @param {string} id - Feature ID
 * @param {string} name - Feature name
 * @param {string} description - Feature description
 * @param {string} emoji - Feature emoji
 * @returns {Promise<Object>} Created feature
 */
async function createFeatureFromTemplate(id, name, description, emoji) {
  try {
    logger.info(`Creating feature from template: ${id}`);
    
    // Validate ID
    if (!/^[a-z0-9_]+$/.test(id)) {
      throw new Error('Feature ID must contain only lowercase letters, numbers, and underscores');
    }
    
    // Create feature object
    const feature = {
      id,
      name,
      description,
      emoji,
      enabled: true,
      submenus: [
        {
          id: 'info',
          name: 'Information',
          description: 'Learn more about this feature',
          emoji: 'ℹ️',
          actions: [
            {
              id: 'help',
              name: 'Help',
              description: 'Get help with this feature',
              emoji: '❓'
            }
          ]
        }
      ],
      actions: [
        {
          id: 'start',
          name: 'Start',
          description: 'Start using this feature',
          emoji: '▶️'
        }
      ]
    };
    
    // Add feature to database
    await addFeature(feature);
    
    // Create feature module
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, id);
    await fs.ensureDir(featureDir);
    
    const featureFile = path.join(featureDir, `${id}.js`);
    
    // Create feature module template
    const moduleTemplate = `
// ${name} Feature
// Created from template at ${new Date().toISOString()}

module.exports = {
  // Initialize the feature (optional)
  async init(bot, feature) {
    console.log('${name} feature initialized');
  },
  
  // Handle action callbacks for this feature
  async handleAction(ctx, action, feature) {
    try {
      // Answer callback query to remove loading indicator
      ctx.answerCbQuery();
      
      switch (action.id) {
        case 'start':
          await ctx.reply('${emoji} *${name}*\\n\\n${description}\\n\\nYou\'ve started using this feature!', {
            parse_mode: 'Markdown'
          });
          break;
        
        case 'help':
          await ctx.reply('${emoji} *Help for ${name}*\\n\\n${description}\\n\\nThis is a template feature. The admin can customize it further.', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'feature:${id}' }]
              ]
            }
          });
          break;
        
        default:
          await ctx.reply(\`Action \${action.id} not implemented yet.\`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'feature:${id}' }]
              ]
            }
          });
          break;
      }
      
      return true;
    } catch (error) {
      console.error(\`Error in ${id} handleAction:\`, error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  },
  
  // Handle custom callbacks for this feature
  async handleCallback(ctx, callbackData) {
    try {
      // Check if this callback is for this feature
      if (!callbackData.startsWith('${id}:')) {
        return false;
      }
      
      const parts = callbackData.split(':');
      const action = parts[1];
      
      // Answer callback query
      ctx.answerCbQuery();
      
      switch (action) {
        // Add custom callback handlers here
        default:
          return false;
      }
    } catch (error) {
      console.error(\`Error in ${id} handleCallback:\`, error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  }
};
`;
    
    await fs.writeFile(featureFile, moduleTemplate);
    
    logger.info(`Feature ${id} created from template`);
    return feature;
  } catch (error) {
    logger.error('Error creating feature from template:', error);
    throw error;
  }
}

/**
 * Create an example feature to demonstrate functionality
 * @returns {Promise<Object>} Created example feature
 */
async function createExampleFeature() {
  try {
    logger.info('Creating example feature');
    
    const id = 'example';
    const name = 'Example Feature';
    const description = 'This is an example feature to demonstrate bot capabilities';
    const emoji = '🔍';
    
    // Create feature object
    const feature = {
      id,
      name,
      description,
      emoji,
      enabled: true,
      submenus: [
        {
          id: 'demos',
          name: 'Demo Functions',
          description: 'See demo functionality',
          emoji: '🎮',
          actions: [
            {
              id: 'buttons_demo',
              name: 'Buttons Demo',
              description: 'Demonstrate different button layouts',
              emoji: '🔘'
            },
            {
              id: 'notification_demo',
              name: 'Notifications Demo',
              description: 'Demonstrate different notification styles',
              emoji: '🔔'
            }
          ]
        },
        {
          id: 'help',
          name: 'Help',
          description: 'Get help with using the bot',
          emoji: '❓',
          actions: [
            {
              id: 'faq',
              name: 'FAQ',
              description: 'Frequently asked questions',
              emoji: '📚'
            },
            {
              id: 'contact',
              name: 'Contact Admin',
              description: 'Contact the bot administrator',
              emoji: '📞'
            }
          ]
        }
      ],
      actions: [
        {
          id: 'welcome',
          name: 'Welcome',
          description: 'Show welcome message',
          emoji: '👋'
        },
        {
          id: 'features',
          name: 'Features List',
          description: 'See all available features',
          emoji: '📋'
        }
      ]
    };
    
    // Check if feature already exists
    const { getFeaturesDb } = require('../../database/db');
    const featuresDb = getFeaturesDb();
    
    const existingFeature = featuresDb.data.features.find(f => f.id === id);
    if (existingFeature) {
      return existingFeature;
    }
    
    // Add feature to database
    await addFeature(feature);
    
    // Create feature module
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, id);
    await fs.ensureDir(featureDir);
    
    const featureFile = path.join(featureDir, `${id}.js`);
    
    // Create example feature module
    const moduleTemplate = `
// Example Feature
// Created at ${new Date().toISOString()}

module.exports = {
  // Initialize the feature (optional)
  async init(bot, feature) {
    console.log('Example feature initialized');
  },
  
  // Handle action callbacks for this feature
  async handleAction(ctx, action, feature) {
    try {
      // Answer callback query to remove loading indicator
      ctx.answerCbQuery();
      
      switch (action.id) {
        case 'welcome':
          await ctx.reply('👋 *Welcome to the Example Feature!*\\n\\nThis feature demonstrates various capabilities of the bot. Use the buttons below to explore.', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Demo Functions', callback_data: 'submenu:example:demos' }],
                [{ text: '❓ Help & FAQ', callback_data: 'submenu:example:help' }],
                [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
          break;
        
        case 'features':
          await ctx.reply('📋 *Features List*\\n\\nHere are some of the bot\'s capabilities:\\n\\n• Customizable keyboards\\n• Interactive menus\\n• Notification styles\\n• Admin controls\\n• User settings\\n• Dynamic feature generation\\n\\nExplore the menus to see more!', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'feature:example' }]
              ]
            }
          });
          break;
          
        case 'buttons_demo':
          await this.showButtonsDemo(ctx);
          break;
          
        case 'notification_demo':
          await this.showNotificationsDemo(ctx);
          break;
          
        case 'faq':
          await ctx.reply('📚 *Frequently Asked Questions*\\n\\n*Q: How do I add new features?*\\nA: Admins can add new features through the Admin Panel.\\n\\n*Q: Can I customize the keyboard layout?*\\nA: Yes, in Settings > Keyboard Style.\\n\\n*Q: How do I report issues?*\\nA: Use the "Contact Admin" function in the Help menu.', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'submenu:example:help' }]
              ]
            }
          });
          break;
          
        case 'contact':
          // Store state in session
          ctx.session.contactingAdmin = true;
          
          await ctx.reply('📞 *Contact Admin*\\n\\nSend your message to the bot administrators. They will receive your message and can reply to you.\\n\\nType /cancel to cancel.', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Cancel', callback_data: 'example:cancel_contact' }]
              ]
            }
          });
          break;
          
        default:
          await ctx.reply(\`Action \${action.id} not implemented yet.\`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'feature:example' }]
              ]
            }
          });
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error in example handleAction:', error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  },
  
  // Handle custom callbacks for this feature
  async handleCallback(ctx, callbackData) {
    try {
      // Check if this callback is for this feature
      if (!callbackData.startsWith('example:')) {
        return false;
      }
      
      const parts = callbackData.split(':');
      const action = parts[1];
      
      // Answer callback query
      ctx.answerCbQuery();
      
      switch (action) {
        case 'cancel_contact':
          ctx.session.contactingAdmin = false;
          await ctx.editMessageText('❌ Contact admin cancelled.', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'submenu:example:help' }]
              ]
            }
          });
          return true;
          
        case 'button_style_1':
        case 'button_style_2':
        case 'button_style_3':
          const styleNumber = action.slice(-1);
          await ctx.editMessageText(\`🔘 *Button Style \${styleNumber} Selected*\\n\\nYou've selected button style \${styleNumber}. This demonstrates how callbacks can be used to create interactive interfaces.\\n\\nIn a real feature, this could update user preferences or trigger actions.\`, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Try Another Style', callback_data: 'action:example:buttons_demo' }],
                [{ text: '🔙 Back', callback_data: 'submenu:example:demos' }]
              ]
            }
          });
          return true;
          
        case 'notification_1':
        case 'notification_2':
        case 'notification_3':
          const notifNumber = action.slice(-1);
          
          // Different notification styles
          if (notifNumber === '1') {
            // Simple notification
            await ctx.answerCbQuery('Simple notification example', { show_alert: false });
          } else if (notifNumber === '2') {
            // Alert notification
            await ctx.answerCbQuery('This is an alert notification example!\\n\\nIt can contain multiple lines of text.', { show_alert: true });
          } else {
            // Update message notification
            await ctx.editMessageText('🔔 *Notification Style 3*\\n\\nThis style updates the message instead of showing a popup.', {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Try Again', callback_data: 'action:example:notification_demo' }],
                  [{ text: '🔙 Back', callback_data: 'submenu:example:demos' }]
                ]
              }
            });
          }
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error in example handleCallback:', error);
      await ctx.reply('An error occurred while processing your request.');
      return false;
    }
  },
  
  // Show buttons demo
  async showButtonsDemo(ctx) {
    try {
      await ctx.editMessageText('🔘 *Buttons Demo*\\n\\nThis demo shows different button layouts. Select a style to see how it looks:', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Style 1', callback_data: 'example:button_style_1' },
              { text: 'Style 2', callback_data: 'example:button_style_2' },
              { text: 'Style 3', callback_data: 'example:button_style_3' }
            ],
            [{ text: 'Full Width Button', callback_data: 'example:button_style_1' }],
            [
              { text: '1', callback_data: 'example:button_style_1' },
              { text: '2', callback_data: 'example:button_style_2' },
              { text: '3', callback_data: 'example:button_style_3' },
              { text: '4', callback_data: 'example:button_style_1' }
            ],
            [{ text: '🔙 Back', callback_data: 'submenu:example:demos' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error in showButtonsDemo:', error);
      throw error;
    }
  },
  
  // Show notifications demo
  async showNotificationsDemo(ctx) {
    try {
      await ctx.editMessageText('🔔 *Notifications Demo*\\n\\nThis demo shows different notification styles. Select a style to try it:', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '1️⃣ Small Popup', callback_data: 'example:notification_1' }],
            [{ text: '2️⃣ Alert Dialog', callback_data: 'example:notification_2' }],
            [{ text: '3️⃣ Message Update', callback_data: 'example:notification_3' }],
            [{ text: '🔙 Back', callback_data: 'submenu:example:demos' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error in showNotificationsDemo:', error);
      throw error;
    }
  }
};
`;
    
    await fs.writeFile(featureFile, moduleTemplate);
    
    logger.info('Example feature created');
    return feature;
  } catch (error) {
    logger.error('Error creating example feature:', error);
    throw error;
  }
}

module.exports = {
  createFeatureFromTemplate,
  createExampleFeature
};
