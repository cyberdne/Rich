const { getLogsDb } = require('../database/db');
const logger = require('../utils/logger');

/**
 * Rate a feature
 * @param {number} userId - User ID
 * @param {string} featureId - Feature ID
 * @param {number} rating - Rating 1-5
 * @param {string} feedback - Optional feedback text
 * @returns {Promise<Object>} Rating record
 */
async function rateFeature(userId, featureId, rating, feedback = '') {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Initialize ratings database if needed
    const logsDb = getLogsDb();
    if (!logsDb.data.featureRatings) {
      logsDb.data.featureRatings = [];
    }
    
    const ratingRecord = {
      userId,
      featureId,
      rating,
      feedback,
      ratedAt: new Date().toISOString()
    };
    
    logsDb.data.featureRatings.push(ratingRecord);
    await logsDb.write();
    
    logger.info(`Feature ${featureId} rated ${rating}/5 by user ${userId}`);
    return ratingRecord;
  } catch (error) {
    logger.error(`Error rating feature ${featureId}:`, error);
    throw error;
  }
}

/**
 * Get average rating for a feature
 * @param {string} featureId - Feature ID
 * @returns {Promise<Object>} Average rating and count
 */
async function getFeatureRating(featureId) {
  try {
    const logsDb = getLogsDb();
    const ratings = (logsDb.data.featureRatings || []).filter(r => r.featureId === featureId);
    
    if (ratings.length === 0) {
      return {
        featureId,
        averageRating: 0,
        totalRatings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = (sum / ratings.length).toFixed(2);
    
    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      distribution[r.rating]++;
    });
    
    return {
      featureId,
      averageRating: parseFloat(average),
      totalRatings: ratings.length,
      distribution
    };
  } catch (error) {
    logger.error(`Error getting rating for feature ${featureId}:`, error);
    return {
      featureId,
      averageRating: 0,
      totalRatings: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
}

/**
 * Get user's rating for a feature
 * @param {number} userId - User ID
 * @param {string} featureId - Feature ID
 * @returns {Promise<Object|null>} User's rating record or null
 */
async function getUserRating(userId, featureId) {
  try {
    const logsDb = getLogsDb();
    const ratings = logsDb.data.featureRatings || [];
    
    // Get the most recent rating from this user for this feature
    return ratings
      .filter(r => r.userId === userId && r.featureId === featureId)
      .sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt))[0] || null;
  } catch (error) {
    logger.error(`Error getting user rating:`, error);
    return null;
  }
}

/**
 * Get top rated features
 * @param {number} limit - Number of features to return
 * @returns {Promise<Array>} Array of top rated features with ratings
 */
async function getTopRatedFeatures(limit = 10) {
  try {
    const logsDb = getLogsDb();
    const ratings = logsDb.data.featureRatings || [];
    
    if (ratings.length === 0) {
      return [];
    }
    
    // Group by feature and calculate averages
    const featureMap = {};
    
    ratings.forEach(r => {
      if (!featureMap[r.featureId]) {
        featureMap[r.featureId] = {
          featureId: r.featureId,
          ratings: []
        };
      }
      featureMap[r.featureId].ratings.push(r.rating);
    });
    
    // Calculate averages and sort
    const sorted = Object.values(featureMap)
      .map(f => ({
        featureId: f.featureId,
        averageRating: (f.ratings.reduce((a, b) => a + b, 0) / f.ratings.length).toFixed(2),
        totalRatings: f.ratings.length
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
    
    return sorted;
  } catch (error) {
    logger.error('Error getting top rated features:', error);
    return [];
  }
}

/**
 * Get all ratings for a feature with feedback
 * @param {string} featureId - Feature ID
 * @returns {Promise<Array>} All ratings with feedback
 */
async function getFeatureFeedback(featureId) {
  try {
    const logsDb = getLogsDb();
    const ratings = (logsDb.data.featureRatings || [])
      .filter(r => r.featureId === featureId && r.feedback)
      .sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt));
    
    return ratings;
  } catch (error) {
    logger.error(`Error getting feedback for feature ${featureId}:`, error);
    return [];
  }
}

/**
 * Format rating for display
 * @param {Object} rating - Rating object
 * @returns {string} Formatted rating
 */
function formatRatingForDisplay(rating) {
  const stars = '⭐'.repeat(rating.averageRating) + 
                '☆'.repeat(5 - Math.ceil(rating.averageRating));
  
  return `${stars} ${rating.averageRating}/5.0 (${rating.totalRatings} ratings)`;
}

module.exports = {
  rateFeature,
  getFeatureRating,
  getUserRating,
  getTopRatedFeatures,
  getFeatureFeedback,
  formatRatingForDisplay,
};
