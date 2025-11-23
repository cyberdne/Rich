const config = require('./config');

// Keyboard style definitions
const KEYBOARD_STYLES = {
  classic: {
    mainMenuRows: 2,
    subMenuRows: 3,
    buttonStyle: 'default',
    useEmojis: true,
    compactMode: false,
    showDescriptions: true,
  },
  compact: {
    mainMenuRows: 3,
    subMenuRows: 4,
    buttonStyle: 'default',
    useEmojis: true,
    compactMode: true,
    showDescriptions: false,
  },
  modern: {
    mainMenuRows: 2,
    subMenuRows: 2,
    buttonStyle: 'rounded',
    useEmojis: true,
    compactMode: false,
    showDescriptions: true,
  },
  elegant: {
    mainMenuRows: 1,
    subMenuRows: 2,
    buttonStyle: 'bordered',
    useEmojis: false,
    compactMode: false,
    showDescriptions: true,
  },
  minimalist: {
    mainMenuRows: 4,
    subMenuRows: 4,
    buttonStyle: 'flat',
    useEmojis: false,
    compactMode: true,
    showDescriptions: false,
  },
};

// Main menu keyboard generator
const getMainMenuKeyboard = (style, features, ctx) => {
  // Ensure features is an array and filter enabled features
  const enabledFeatures = Array.isArray(features) ? features.filter(f => f && f.enabled) : [];
  
  const keyboardStyle = KEYBOARD_STYLES[style] || KEYBOARD_STYLES[config.DEFAULT_KEYBOARD_STYLE];
  const buttons = enabledFeatures.map(feature => ({
    text: keyboardStyle.useEmojis ? `${feature.emoji || '🎯'} ${feature.name}` : feature.name,
    callback_data: `feature:${feature.id}`,
  }));
  
  // Organize buttons into rows based on keyboard style
  const keyboard = [];
  const rowSize = keyboardStyle.mainMenuRows || 2;
  for (let i = 0; i < buttons.length; i += rowSize) {
    keyboard.push(buttons.slice(i, i + rowSize));
  }
  
  // If no features, show placeholder button
  if (buttons.length === 0) {
    keyboard.push([{
      text: '📭 No features available',
      callback_data: 'no_features'
    }]);
  }
  
  // Add settings button at the bottom
  keyboard.push([{
    text: '⚙️ Settings',
    callback_data: 'settings',
  }]);
  
  return { inline_keyboard: keyboard };
};

// Settings menu keyboard
const getSettingsKeyboard = (ctx) => {
  return {
    inline_keyboard: [
      [
        { text: '🎨 Change Keyboard Style', callback_data: 'settings:keyboard_style' },
        { text: '🔔 Notification Style', callback_data: 'settings:notification_style' }
      ],
      [
        { text: '🌐 Language', callback_data: 'settings:language' },
        { text: '👤 My Profile', callback_data: 'settings:profile' }
      ],
      [
        { text: '📊 Statistics', callback_data: 'settings:stats' }
      ],
      [
        { text: '🔙 Back to Main Menu', callback_data: 'main_menu' }
      ]
    ]
  };
};

// Admin menu keyboard
const getAdminKeyboard = (ctx) => {
  return {
    inline_keyboard: [
      [
        { text: '👥 User Management', callback_data: 'admin:users' },
        { text: '📊 Analytics', callback_data: 'admin:analytics' }
      ],
      [
        { text: '⚙️ Bot Settings', callback_data: 'admin:bot_settings' },
        { text: '🔄 System Status', callback_data: 'admin:system_status' }
      ],
      [
        { text: '✨ Add New Feature', callback_data: 'admin:add_feature' },
        { text: '🔧 Edit Features', callback_data: 'admin:edit_features' }
      ],
      [
        { text: '📝 Logs', callback_data: 'admin:logs' },
        { text: '🚀 Broadcast', callback_data: 'admin:broadcast' }
      ],
      [
        { text: '🔙 Back to Main Menu', callback_data: 'main_menu' }
      ]
    ]
  };
};

// Generate "back" button that can be added to any keyboard
const backButton = (destination = 'main_menu', label = '🔙 Back') => {
  return [{ text: label, callback_data: destination }];
};

// Keyboard style selector
const getKeyboardStyleSelector = (currentStyle) => {
  const buttons = Object.keys(KEYBOARD_STYLES).map(style => ({
    text: style === currentStyle ? `✅ ${style}` : style,
    callback_data: `set_keyboard_style:${style}`,
  }));
  
  // Organize buttons into rows of 2
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }
  
  // Add back button
  keyboard.push(backButton('settings'));
  
  return { inline_keyboard: keyboard };
};

// Notification style selector
const getNotificationStyleSelector = (currentStyle) => {
  const styles = config.NOTIFICATION_STYLES;
  const buttons = styles.map(style => ({
    text: style === currentStyle ? `✅ ${style}` : style,
    callback_data: `set_notification_style:${style}`,
  }));
  
  // Organize buttons into rows of 2
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }
  
  // Add back button
  keyboard.push(backButton('settings'));
  
  return { inline_keyboard: keyboard };
};

// Language selector
const getLanguageSelector = (currentLang) => {
  const languages = [
    { code: 'en', name: 'English 🇬🇧' },
    { code: 'id', name: 'Indonesia 🇮🇩' },
    // Add more languages as needed
  ];
  
  const buttons = languages.map(lang => ({
    text: lang.code === currentLang ? `✅ ${lang.name}` : lang.name,
    callback_data: `set_language:${lang.code}`,
  }));
  
  // Organize buttons into rows of 2
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }
  
  // Add back button
  keyboard.push(backButton('settings'));
  
  return { inline_keyboard: keyboard };
};

// Feature submenu generator
const getFeatureSubmenu = (feature, style) => {
  const keyboardStyle = KEYBOARD_STYLES[style] || KEYBOARD_STYLES[config.DEFAULT_KEYBOARD_STYLE];
  
  const keyboard = [];
  
  // Add feature submenus if they exist
  if (feature.submenus && feature.submenus.length > 0) {
    const submenuButtons = feature.submenus.map(submenu => ({
      text: keyboardStyle.useEmojis ? `${submenu.emoji} ${submenu.name}` : submenu.name,
      callback_data: `submenu:${feature.id}:${submenu.id}`,
    }));
    
    // Organize buttons into rows based on keyboard style
    for (let i = 0; i < submenuButtons.length; i += keyboardStyle.subMenuRows) {
      keyboard.push(submenuButtons.slice(i, i + keyboardStyle.subMenuRows));
    }
  }
  
  // Add feature actions if they exist
  if (feature.actions && feature.actions.length > 0) {
    const actionButtons = feature.actions.map(action => ({
      text: keyboardStyle.useEmojis ? `${action.emoji} ${action.name}` : action.name,
      callback_data: `action:${feature.id}:${action.id}`,
    }));
    
    // Organize buttons into rows based on keyboard style
    for (let i = 0; i < actionButtons.length; i += keyboardStyle.subMenuRows) {
      keyboard.push(actionButtons.slice(i, i + keyboardStyle.subMenuRows));
    }
  }
  
  // Add back button
  keyboard.push(backButton('main_menu'));
  
  return { inline_keyboard: keyboard };
};

// Feature generator menu for admins
const getFeatureGeneratorKeyboard = () => {
  return {
    inline_keyboard: [
      [
        { text: '✨ Create from Template', callback_data: 'feature_gen:template' },
        { text: '🤖 AI-Assisted Creation', callback_data: 'feature_gen:ai' }
      ],
      [
        { text: '📋 Import from JSON', callback_data: 'feature_gen:import' },
        { text: '📝 Custom Code', callback_data: 'feature_gen:custom' }
      ],
      [
        { text: '🔙 Back to Admin Menu', callback_data: 'admin' }
      ]
    ]
  };
};

module.exports = {
  getMainMenuKeyboard,
  getSettingsKeyboard,
  getAdminKeyboard,
  getKeyboardStyleSelector,
  getNotificationStyleSelector,
  getLanguageSelector,
  getFeatureSubmenu,
  getFeatureGeneratorKeyboard,
  backButton,
  // Verification keyboard for new users
  getVerificationKeyboard: () => ({
    inline_keyboard: [
      [ { text: '✅ Verify', callback_data: 'verify' } ],
      [ { text: '🔒 Cancel', callback_data: 'main_menu' } ]
    ]
  }),
  KEYBOARD_STYLES
};
