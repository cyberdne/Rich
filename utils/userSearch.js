const { getUser, getAllUsers } = require('../database/users');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Search for users by various criteria
 * @param {string} query - Search term (ID, username, name)
 * @param {string} searchType - Type of search (id, username, name, all)
 * @returns {Promise<Array>} Array of matching users
 */
async function searchUsers(query, searchType = 'all') {
  try {
    const allUsers = await getAllUsers();
    
    if (!Array.isArray(allUsers)) {
      logger.warn('getAllUsers returned non-array');
      return [];
    }
    
    const q = query.toLowerCase();
    let results = [];
    
    switch (searchType) {
      case 'id':
        results = allUsers.filter(u => u.id.toString() === q || u.id.toString().includes(q));
        break;
        
      case 'username':
        results = allUsers.filter(u => 
          u.username && u.username.toLowerCase().includes(q)
        );
        break;
        
      case 'name':
        results = allUsers.filter(u => 
          (u.first_name && u.first_name.toLowerCase().includes(q)) ||
          (u.last_name && u.last_name.toLowerCase().includes(q))
        );
        break;
        
      case 'all':
      default:
        results = allUsers.filter(u => 
          u.id.toString().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.first_name && u.first_name.toLowerCase().includes(q)) ||
          (u.last_name && u.last_name.toLowerCase().includes(q))
        );
        break;
    }
    
    logger.info(`User search: query="${query}", type="${searchType}", results=${results.length}`);
    return results;
  } catch (error) {
    logger.error('Error in searchUsers:', error);
    throw error;
  }
}

/**
 * Format user for display
 * @param {Object} user - User object
 * @returns {string} Formatted user info
 */
function formatUserForDisplay(user) {
  const name = `${user.first_name || 'Unknown'} ${user.last_name || ''}`.trim();
  const username = user.username ? `@${user.username}` : 'No username';
  const admin = user.isAdmin ? ' 👑 ADMIN' : '';
  const banned = user.banned ? ' 🚫 BANNED' : '';
  
  return `${name} (${username}) [ID: ${user.id}]${admin}${banned}\nJoined: ${new Date(user.createdAt).toLocaleDateString()}`;
}

/**
 * Get user details for admin view
 * @param {number} userId - User ID
 * @returns {Promise<string>} Formatted user details
 */
async function getUserDetails(userId) {
  try {
    const user = await getUser(userId);
    
    if (!user) {
      return 'User not found';
    }
    
    const details = `
👤 *User Details*

Name: ${user.first_name || 'Unknown'} ${user.last_name || ''}
Username: ${user.username ? '@' + user.username : 'None'}
User ID: \`${user.id}\`
Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}
Banned: ${user.banned ? '🚫 Yes' : '✅ No'}
Joined: ${new Date(user.createdAt).toLocaleDateString()}
Last Activity: ${new Date(user.lastActivity).toLocaleDateString()}
Messages Sent: ${user.messageCount || 0}
Commands Used: ${user.commandCount || 0}
    `.trim();
    
    return details;
  } catch (error) {
    logger.error(`Error getting user details for ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  searchUsers,
  formatUserForDisplay,
  getUserDetails,
};
