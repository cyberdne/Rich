const logger = require('../utils/logger');
const { getFeaturesDb } = require('../database/db');

module.exports = (bot) => {
  bot.on('inline_query', async (ctx) => {
    try {
      const query = (ctx.inlineQuery.query || '').toLowerCase().trim();
      
      logger.debug(`Inline query from user ${ctx.from.id}: "${query}"`);
      
      // Get all enabled features
      const featuresDb = getFeaturesDb();
      const allFeatures = featuresDb.data.features.filter(f => f.enabled);
      
      let results = [];
      
      if (query.length === 0) {
        // Show all features if no query
        results = allFeatures.slice(0, 50).map((feature, index) => ({
          type: 'article',
          id: `feature_${index}`,
          title: `${feature.emoji} ${feature.name}`,
          description: feature.description,
          input_message_content: {
            message_text: `*${feature.emoji} ${feature.name}*\n\n${feature.description}`,
            parse_mode: 'Markdown'
          }
        }));
      } else {
        // Search features by name or description
        const filtered = allFeatures.filter(feature => 
          feature.name.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query) ||
          feature.id.toLowerCase().includes(query)
        );
        
        results = filtered.slice(0, 50).map((feature, index) => ({
          type: 'article',
          id: `feature_${index}`,
          title: `${feature.emoji} ${feature.name}`,
          description: feature.description,
          input_message_content: {
            message_text: `*${feature.emoji} ${feature.name}*\n\n${feature.description}\n\nUse /start to access this feature from the main menu.`,
            parse_mode: 'Markdown'
          }
        }));
        
        // If no features match, show help message
        if (results.length === 0) {
          results = [{
            type: 'article',
            id: 'no_results',
            title: '🔍 No features found',
            description: `Search for "${query}" didn't return any results. Try searching for something else.`,
            input_message_content: {
              message_text: `*🔍 No features found*\n\nYour search for "${query}" didn't return any results. Please try:\n- Searching with different keywords\n- Using /start to browse all features\n- Checking the feature names and descriptions`
            }
          }];
        }
      }
      
      // Return results (Telegram limits to 50 results)
      await ctx.answerInlineQuery(results, {
        cache_time: 300, // Cache for 5 minutes
        is_personal: false
      });
      
      logger.debug(`Inline query answered with ${results.length} results`);
    } catch (err) {
      logger.error('Inline query error:', err);
      
      // Send empty results on error
      try {
        await ctx.answerInlineQuery([], {
          cache_time: 10,
          is_personal: false
        });
      } catch (answerError) {
        logger.error('Failed to answer inline query:', answerError.message);
      }
    }
  });
};
