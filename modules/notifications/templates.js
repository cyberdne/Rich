/**
 * Notification templates for different styles
 */
const notificationTemplates = {
  // Standard style templates
  standard: {
    welcome: {
      text: '👋 Welcome to {botName}!\n\nI am a powerful and versatile Telegram bot with many features. Use the buttons below to explore what I can do!',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }]
      ]
    },
    
    newFeature: {
      text: '✨ *New Feature Available!*\n\n{featureName} has been added to the bot.\n\n{featureDescription}',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '🔍 Check it out', callback_data: 'feature:{featureId}' }]
      ]
    },
    
    reminderAlert: {
      text: '⏰ *Reminder*\n\n{reminderText}',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '✅ Mark as Done', callback_data: 'reminder:done:{reminderId}' }]
      ]
    },
    
    errorNotification: {
      text: '❌ *Error*\n\n{errorText}\n\nIf this issue persists, please contact the bot administrator.',
      parseMode: 'Markdown',
      disablePreview: true,
    },
    
    adminMessage: {
      text: '📢 *Message from Admin*\n\n{message}',
      parseMode: 'Markdown',
      disablePreview: false,
      keyboard: [
        [{ text: '📝 Reply', callback_data: 'admin:reply' }]
      ]
    }
  },
  
  // Minimal style templates
  minimal: {
    welcome: {
      text: 'Welcome to {botName}!',
      parseMode: 'HTML',
      disablePreview: true,
      keyboard: [
        [{ text: 'Menu', callback_data: 'main_menu' }]
      ]
    },
    
    newFeature: {
      text: 'New: {featureName} - {featureDescription}',
      parseMode: 'HTML',
      disablePreview: true,
      keyboard: [
        [{ text: 'View', callback_data: 'feature:{featureId}' }]
      ]
    },
    
    reminderAlert: {
      text: 'Reminder: {reminderText}',
      parseMode: 'HTML',
      disablePreview: true,
      keyboard: [
        [{ text: 'Done', callback_data: 'reminder:done:{reminderId}' }]
      ]
    },
    
    errorNotification: {
      text: 'Error: {errorText}',
      parseMode: 'HTML',
      disablePreview: true,
    },
    
    adminMessage: {
      text: 'Admin: {message}',
      parseMode: 'HTML',
      disablePreview: true,
      keyboard: [
        [{ text: 'Reply', callback_data: 'admin:reply' }]
      ]
    }
  },
  
  // Detailed style templates
  detailed: {
    welcome: {
      text: '🌟 *Welcome to {botName}!* 🌟\n\n' +
            'I am delighted to have you here. This bot offers a variety of powerful features to enhance your Telegram experience.\n\n' +
            '📋 *Key Features:*\n' +
            '• Customizable interfaces\n' +
            '• Interactive commands\n' +
            '• User-friendly menus\n' +
            '• And much more!\n\n' +
            'Use the buttons below to begin exploring. If you need assistance at any time, just use the /help command.',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }],
        [{ text: '❓ Help', callback_data: 'help' }]
      ]
    },
    
    newFeature: {
      text: '✨ *Exciting New Feature Available!* ✨\n\n' +
            '*{featureName}* has been added to the bot.\n\n' +
            '*Description:*\n{featureDescription}\n\n' +
            '*Added on:* {date}\n' +
            '*Version:* {version}\n\n' +
            'Click the button below to explore this new feature!',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '🔍 Explore New Feature', callback_data: 'feature:{featureId}' }],
        [{ text: '📋 Main Menu', callback_data: 'main_menu' }]
      ]
    },
    
    reminderAlert: {
      text: '⏰ *Reminder Alert* ⏰\n\n' +
            '*Reminder:* {reminderText}\n\n' +
            '*Set on:* {dateSet}\n' +
            '*Due:* {dateDue}\n\n' +
            'Click below to mark this reminder as complete or snooze it for later.',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '✅ Mark as Done', callback_data: 'reminder:done:{reminderId}' }],
        [{ text: '⏰ Snooze', callback_data: 'reminder:snooze:{reminderId}' }]
      ]
    },
    
    errorNotification: {
      text: '❌ *Error Encountered* ❌\n\n' +
            '*Error:* {errorText}\n\n' +
            '*Time:* {timestamp}\n' +
            '*Error Code:* {errorCode}\n\n' +
            '*Troubleshooting Steps:*\n' +
            '1. Restart the bot with /start\n' +
            '2. Check your settings\n' +
            '3. If the issue persists, contact the bot administrator\n\n' +
            'We apologize for the inconvenience.',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '🔄 Restart Bot', callback_data: 'start' }],
        [{ text: '📞 Contact Support', callback_data: 'contact_support' }]
      ]
    },
    
    adminMessage: {
      text: '📢 *Important Message from Administrator* 📢\n\n' +
            '{message}\n\n' +
            '*Sent by:* {adminName}\n' +
            '*Time:* {timestamp}\n\n' +
            'You can reply to this message using the button below.',
      parseMode: 'Markdown',
      disablePreview: false,
      keyboard: [
        [{ text: '📝 Reply to Admin', callback_data: 'admin:reply' }],
        [{ text: '👍 Acknowledge', callback_data: 'admin:acknowledge' }]
      ]
    }
  },
  
  // Emoji-rich style templates
  'emoji-rich': {
    welcome: {
      text: '🌟✨ *Welcome to {botName}!* ✨🌟\n\n' +
            '🤖 I\'m your helpful bot assistant!\n' +
            '🔍 Explore my many features\n' +
            '⚙️ Customize your experience\n' +
            '🚀 Let\'s get started!',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '📋 Main Menu', callback_data: 'main_menu' }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }]
      ]
    },
    
    newFeature: {
      text: '✨🎉 *New Feature Alert!* 🎉✨\n\n' +
            '🆕 *{featureName}*\n\n' +
            '📝 {featureDescription}\n\n' +
            '🔍 Check it out now! 👇',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '🔎 Explore Now! 🔍', callback_data: 'feature:{featureId}' }]
      ]
    },
    
    reminderAlert: {
      text: '⏰🔔 *Reminder Time!* 🔔⏰\n\n' +
            '📝 {reminderText}\n\n' +
            '✅ Mark complete?\n' +
            '⏰ Or snooze for later?',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '✅ Done!', callback_data: 'reminder:done:{reminderId}' }],
        [{ text: '⏰ Snooze', callback_data: 'reminder:snooze:{reminderId}' }]
      ]
    },
    
    errorNotification: {
      text: '❌🛑 *Oops! Error!* 🛑❌\n\n' +
            '❓ {errorText}\n\n' +
            '🛠️ Need help?\n' +
            '🔄 Try restarting\n' +
            '📞 Or contact support',
      parseMode: 'Markdown',
      disablePreview: true,
      keyboard: [
        [{ text: '🔄 Restart', callback_data: 'start' }],
        [{ text: '📞 Get Help', callback_data: 'contact_support' }]
      ]
    },
    
    adminMessage: {
      text: '📢🔊 *Admin Message!* 🔊📢\n\n' +
            '💬 {message}\n\n' +
            '👤 From: {adminName}\n\n' +
            '📝 Want to reply?\n' +
            '👍 Or just acknowledge?',
      parseMode: 'Markdown',
      disablePreview: false,
      keyboard: [
        [{ text: '📝 Reply', callback_data: 'admin:reply' }],
        [{ text: '👍 Got it!', callback_data: 'admin:acknowledge' }]
      ]
    }
  }
};

/**
 * Get a notification template by name and style
 * @param {string} name - Template name
 * @param {string} style - Template style
 * @returns {Object|null} Template object or null if not found
 */
function getTemplateByName(name, style = 'standard') {
  // If the requested style doesn't exist, fall back to standard
  const styleTemplates = notificationTemplates[style] || notificationTemplates.standard;
  
  // If the template doesn't exist in the style, try to find it in standard
  return styleTemplates[name] || notificationTemplates.standard[name] || null;
}

/**
 * Get all templates for a specific style
 * @param {string} style - Template style
 * @returns {Object} All templates for the style
 */
function getAllTemplatesForStyle(style = 'standard') {
  return notificationTemplates[style] || notificationTemplates.standard;
}

/**
 * Get all available notification styles
 * @returns {Array<string>} Array of style names
 */
function getAvailableStyles() {
  return Object.keys(notificationTemplates);
}

/**
 * Create a custom template
 * @param {string} style - Template style
 * @param {string} name - Template name
 * @param {Object} template - Template object
 * @returns {boolean} Success status
 */
function createCustomTemplate(style, name, template) {
  if (!notificationTemplates[style]) {
    notificationTemplates[style] = {};
  }
  
  notificationTemplates[style][name] = template;
  return true;
}

module.exports = {
  getTemplateByName,
  getAllTemplatesForStyle,
  getAvailableStyles,
  createCustomTemplate,
};
