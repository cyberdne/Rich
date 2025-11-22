require('dotenv').config();

// Validate critical environment variables
if (!process.env.BOT_TOKEN) {
  console.error('❌ ERROR: BOT_TOKEN is not set in .env file!');
  process.exit(1);
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => {
    const num = Number(id.trim());
    return isNaN(num) ? null : num;
  }).filter(id => id !== null) : [],
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID ? Number(process.env.LOG_CHANNEL_ID) : null,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Database configuration
  DB_PATH: './data',
  
  // Bot configuration
  BOT_NAME: 'AdvancedTermuxBot',
  BOT_VERSION: '1.0.0',
  
  // Rate limiting
  RATE_LIMIT: {
    window: 1000, // ms
    limit: 5, // messages per window
    userBlockTimeout: 60000, // ms to block user after exceeding rate limit
  },
  
  // Keyboard configurations
  KEYBOARD_STYLES: ['classic', 'compact', 'modern', 'elegant', 'minimalist'],
  DEFAULT_KEYBOARD_STYLE: 'modern',
  
  // Notification styles
  NOTIFICATION_STYLES: ['standard', 'detailed', 'minimal', 'emoji-rich'],
  DEFAULT_NOTIFICATION_STYLE: 'standard',
  
  // AI configuration
  AI_MODEL: 'gpt-3.5-turbo',
  AI_TIMEOUT: 30000, // ms
  AI_ENABLED: !!process.env.OPENAI_API_KEY, // Only enable if API key is set
  
  // Feature generation
  FEATURE_TEMPLATE_PATH: './templates/feature.js',
  DYNAMIC_FEATURES_PATH: './features',
  
  // Performance monitoring
  PERFORMANCE_LOG_INTERVAL: 3600000, // log performance stats every hour
  
  // Session expiry
  SESSION_TTL: 86400000, // 24 hours
};
