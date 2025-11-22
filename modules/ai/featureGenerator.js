const config = require('../../config/config');
const logger = require('../../utils/logger');
const { createFeatureWithModule } = require('../../utils/featureModuleGenerator');
const { addFeature } = require('../../features/featureLoader');

let openai;

try {
  if (config.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      timeout: config.AI_TIMEOUT,
    });
    logger.info('OpenAI API initialized successfully for feature generation');
  } else {
    logger.warn('OpenAI API Key not configured. AI feature generation will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize OpenAI API:', error.message);
}

/**
 * Create a feature from template
 * @param {string} featureId - ID of the feature
 * @param {string} featureName - Name of the feature
 * @param {string} featureDescription - Description of the feature
 * @param {string} featureEmoji - Emoji for the feature
 * @returns {Promise<Object>} Created feature
 */
async function createFeatureFromTemplate(featureId, featureName, featureDescription, featureEmoji) {
  try {
    logger.info(`Creating feature from template: ${featureId}`);
    
    // Validate input
    if (!featureId || !featureName || !featureDescription) {
      throw new Error('Feature must have id, name, and description');
    }
    
    // Create feature with default structure
    const featureData = {
      id: featureId,
      name: featureName,
      description: featureDescription,
      emoji: featureEmoji || '🎯',
      enabled: true,
      submenus: [],
      actions: [
        {
          id: 'get_started',
          name: 'Get Started',
          description: 'Start using this feature',
          emoji: '▶️'
        }
      ]
    };
    
    // Create the feature module with proper code generation
    const createdFeature = await createFeatureWithModule(featureData);
    
    // Add feature to database
    const feature = await addFeature(createdFeature);
    
    logger.info(`Feature created successfully: ${featureId}`);
    return feature;
  } catch (error) {
    logger.error('Error creating feature from template:', error);
    throw error;
  }
}

/**
 * Generate a feature using AI
 * @param {string} description - Description of the feature to generate
 * @returns {Promise<Object>} Generated feature
 */
async function generateFeatureWithAI(description) {
  try {
    if (!openai) {
      throw new Error('OpenAI API not initialized. Please configure your OpenAI API key in the .env file.');
    }
    
    logger.info(`Generating feature with AI from description: ${description.substring(0, 100)}...`);
    
    // Generate feature data with OpenAI
    const prompt = `Generate a Telegram bot feature based on this description: "${description}"

Return a JSON object with the following structure (MUST be valid JSON):
{
  "id": "unique_feature_id_lowercase_with_underscores",
  "name": "Feature Name",
  "description": "Detailed description of the feature",
  "emoji": "🔍",
  "submenus": [
    {
      "id": "submenu_id",
      "name": "Submenu Name",
      "description": "Submenu description",
      "emoji": "📋",
      "actions": [
        {
          "id": "action_id",
          "name": "Action Name",
          "description": "Action description",
          "emoji": "⚙️"
        }
      ]
    }
  ],
  "actions": [
    {
      "id": "action_id",
      "name": "Action Name",
      "description": "Action description",
      "emoji": "⚙️"
    }
  ]
}

Rules:
1. "id" must be lowercase, alphanumeric with underscores only, and unique
2. Choose appropriate emojis for each element
3. Design a logical structure with appropriate submenus and actions
4. Make feature description detailed and helpful
5. Return ONLY the JSON object with NO additional text or markdown`;

    const response = await openai.chat.completions.create({
      model: config.AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that designs Telegram bot features. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    // Parse the feature data
    let featureData;
    try {
      const content = response.choices[0].message.content.trim();
      
      // Try to extract JSON from response (with or without markdown code blocks)
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      // Try to find JSON object in the response
      const jsonStartIndex = jsonContent.indexOf('{');
      const jsonEndIndex = jsonContent.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      featureData = JSON.parse(jsonContent);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse the AI-generated feature. Please try again with a clearer description.');
    }
    
    // Validate the feature data
    if (!featureData.id || !featureData.name || !featureData.description || !featureData.emoji) {
      throw new Error('AI generated incomplete feature data. Please try again.');
    }
    
    // Sanitize ID
    featureData.id = featureData.id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Create the feature module with proper code generation
    const createdFeature = await createFeatureWithModule(featureData);
    
    // Add the feature to the database
    const feature = await addFeature(createdFeature);
    
    logger.info(`Feature generated successfully: ${feature.id}`);
    return feature;
  } catch (error) {
    logger.error('Error generating feature with AI:', error);
    throw error;
  }
}

module.exports = {
  createFeatureFromTemplate,
  generateFeatureWithAI
};
