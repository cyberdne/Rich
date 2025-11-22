const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { getFeaturesDb } = require('../database/db');
const config = require('../config/config');

/**
 * Load all dynamic features into the bot
 * @param {Telegraf} bot - Telegraf bot instance
 * @returns {Promise<number>} Number of features loaded
 */
async function loadFeatures(bot) {
  try {
    // Get features from database
    const featuresDb = getFeaturesDb();
    const features = featuresDb.data.features;
    
    // Count of successfully loaded features
    let loadedCount = 0;
    
    // Create features directory if it doesn't exist
    await fs.ensureDir(config.DYNAMIC_FEATURES_PATH);
    
    // Check each feature
    for (const feature of features) {
      try {
        // Check if feature is enabled
        if (!feature.enabled) {
          logger.debug(`Skipping disabled feature: ${feature.id}`);
          continue;
        }
        
        // Check if feature directory exists
        const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, feature.id);
        const featureExists = await fs.pathExists(featureDir);
        
        if (!featureExists) {
          logger.warn(`Feature directory not found for feature ${feature.id}. Creating...`);
          await fs.ensureDir(featureDir);
          
          // Create basic feature module file
          await createBasicFeatureModule(feature);
        }
        
        // Try to load the feature module
        const featureModulePath = path.join(featureDir, `${feature.id}.js`);
        const featureModuleExists = await fs.pathExists(featureModulePath);
        
        if (!featureModuleExists) {
          logger.warn(`Feature module file not found for feature ${feature.id}. Creating...`);
          
          // Create basic feature module file
          await createBasicFeatureModule(feature);
        }
        
        // Load the feature module
        try {
          // Clear require cache to ensure we get the latest version
          delete require.cache[require.resolve(featureModulePath)];
          
          const featureModule = require(featureModulePath);
          
          // Check if module has initialization function
          if (typeof featureModule.init === 'function') {
            await featureModule.init(bot, feature);
            logger.info(`Initialized feature: ${feature.id}`);
          }
          
          loadedCount++;
        } catch (loadError) {
          logger.error(`Failed to load feature module ${feature.id}:`, loadError);
        }
      } catch (featureError) {
        logger.error(`Error loading feature ${feature.id}:`, featureError);
      }
    }
    
    logger.info(`Loaded ${loadedCount} features out of ${features.length} total features`);
    return loadedCount;
  } catch (error) {
    logger.error('Error loading features:', error);
    throw error;
  }
}

/**
 * Create a basic feature module file
 * @param {Object} feature - Feature object
 * @returns {Promise<void>}
 */
async function createBasicFeatureModule(feature) {
  try {
    const { createFeatureWithModule } = require('../utils/featureModuleGenerator');
    
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, feature.id);
    await fs.ensureDir(featureDir);
    
    // Use the feature module generator
    await createFeatureWithModule(feature);
    
    logger.info(`Created basic module for feature ${feature.id}`);
  } catch (error) {
    logger.error(`Error creating basic feature module for ${feature.id}:`, error);
    throw error;
  }
}

/**
 * Reload all features
 * @param {Telegraf} bot - Telegraf bot instance
 * @returns {Promise<number>} Number of features loaded
 */
async function reloadFeatures(bot) {
  try {
    logger.info('Reloading all features...');
    return await loadFeatures(bot);
  } catch (error) {
    logger.error('Error reloading features:', error);
    throw error;
  }
}

/**
 * Add a new feature
 * @param {Object} feature - Feature object
 * @returns {Promise<Object>} The added feature
 */
async function addFeature(feature) {
  try {
    // Validate feature
    if (!feature.id || !feature.name || !feature.description) {
      throw new Error('Feature must have id, name, and description');
    }
    
    // Get features from database
    const featuresDb = getFeaturesDb();
    
    // Check if feature already exists
    const existingFeature = featuresDb.data.features.find(f => f.id === feature.id);
    if (existingFeature) {
      throw new Error(`Feature with ID ${feature.id} already exists`);
    }
    
    // Add timestamps
    feature.createdAt = new Date().toISOString();
    feature.updatedAt = new Date().toISOString();
    
    // Set defaults for optional fields
    feature.enabled = feature.enabled !== false; // Default to true
    feature.submenus = feature.submenus || [];
    feature.actions = feature.actions || [];
    
    // Add feature to database
    featuresDb.data.features.push(feature);
    await featuresDb.write();
    
    // Create feature directory and module
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, feature.id);
    await fs.ensureDir(featureDir);
    
    // Create basic feature module file
    await createBasicFeatureModule(feature);
    
    logger.info(`Added new feature: ${feature.id}`);
    return feature;
  } catch (error) {
    logger.error('Error adding feature:', error);
    throw error;
  }
}

/**
 * Update an existing feature
 * @param {string} featureId - ID of the feature to update
 * @param {Object} updates - Updates to apply to the feature
 * @returns {Promise<Object>} The updated feature
 */
async function updateFeature(featureId, updates) {
  try {
    // Get features from database
    const featuresDb = getFeaturesDb();
    
    // Find feature
    const featureIndex = featuresDb.data.features.findIndex(f => f.id === featureId);
    
    if (featureIndex === -1) {
      throw new Error(`Feature with ID ${featureId} not found`);
    }
    
    // Update timestamps
    updates.updatedAt = new Date().toISOString();
    
    // Apply updates
    featuresDb.data.features[featureIndex] = {
      ...featuresDb.data.features[featureIndex],
      ...updates
    };
    
    await featuresDb.write();
    
    logger.info(`Updated feature: ${featureId}`);
    return featuresDb.data.features[featureIndex];
  } catch (error) {
    logger.error('Error updating feature:', error);
    throw error;
  }
}

/**
 * Delete a feature
 * @param {string} featureId - ID of the feature to delete
 * @returns {Promise<boolean>} Whether the feature was deleted
 */
async function deleteFeature(featureId) {
  try {
    // Get features from database
    const featuresDb = getFeaturesDb();
    
    // Find feature
    const featureIndex = featuresDb.data.features.findIndex(f => f.id === featureId);
    
    if (featureIndex === -1) {
      throw new Error(`Feature with ID ${featureId} not found`);
    }
    
    // Remove feature from database
    featuresDb.data.features.splice(featureIndex, 1);
    await featuresDb.write();
    
    // Remove feature directory
    const featureDir = path.join(config.DYNAMIC_FEATURES_PATH, featureId);
    if (await fs.pathExists(featureDir)) {
      await fs.remove(featureDir);
    }
    
    logger.info(`Deleted feature: ${featureId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting feature:', error);
    throw error;
  }
}

module.exports = {
  loadFeatures,
  reloadFeatures,
  addFeature,
  updateFeature,
  deleteFeature
};
