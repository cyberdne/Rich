# 📚 Complete Feature Documentation

**Bot Version**: 1.0.3-production  
**Last Updated**: November 22, 2025  
**Status**: ✅ Production Ready (38/38 tests passing)

---

## 🎯 Table of Contents

1. [Bug Fixes](#-bug-fixes)
2. [User Management Features](#-user-management-features)
3. [Advanced Settings](#-advanced-settings)
4. [Rating System](#-rating-system)
5. [Admin Commands](#-admin-commands)
6. [API Reference](#-api-reference)
7. [Usage Examples](#-usage-examples)

---

## 🐛 Bug Fixes

### Critical Bugs Fixed (Latest Update)

#### 1. **Settings Persistence Bug** ✅ FIXED
**Problem**: Notification style button state not persisting. Profile displayed wrong notification style.

**Root Cause**: Settings stored in two separate database tables:
- Updates saved to `settings.json` (userSettings table)
- Profile reads from `user.settings` in `users.json` (stale data)

**Solution Implemented**:
- Modified `handleProfileSettings()` to read from `settings.json` via `getUserSettings()`
- Single source of truth now: `settings.json`
- Profile always shows current settings

**Files Changed**: `handlers/callbackHandler.js`

#### 2. **Menu Not Displaying** ✅ FIXED
**Problem**: `/menu` command crashes or shows empty keyboard when features array is null/undefined.

**Root Cause**: No null-safety check for features array, error when `getFeaturesDb().data.features` is undefined.

**Solution Implemented**:
- Null-safe feature fetching: `featuresDb.data?.features || []`
- Enhanced `getMainMenuKeyboard()` to handle empty features gracefully
- Added placeholder "📭 No features available" button when empty
- Better error handling and logging

**Files Changed**:
- `handlers/commandHandler.js` (/start and /menu commands)
- `config/keyboards.js` (getMainMenuKeyboard function)

#### 3. **Profile Display Inaccuracy** ✅ FIXED
**Problem**: Profile shows wrong/stale notification style and other settings.

**Root Cause**: Reading from wrong database table (`user.settings` instead of `userSettings`).

**Solution Implemented**:
- Profile handler now uses `getUserSettings()` which reads from settings database
- All profile fields now current: language, keyboard style, notification style
- Single source of truth maintained

**Files Changed**: `handlers/callbackHandler.js` (handleProfileSettings function)

---

## 👥 User Management Features

### 1. User Search System
**File**: `utils/userSearch.js`

#### Functions

```javascript
// Search for users
const results = await searchUsers(query, searchType);
// query: search term (ID, username, name)
// searchType: 'id', 'username', 'name', or 'all' (default)
// Returns: Array of matching users

// Get user details
const details = await getUserDetails(userId);
// Returns: Formatted user information

// Format user for display
const formatted = formatUserForDisplay(user);
// Returns: Nicely formatted user string
```

#### Admin Command: `/searchuser`

```
Usage: /searchuser <query>

Examples:
  /searchuser 123456789      # Search by user ID
  /searchuser john           # Search by name
  /searchuser @username      # Search by username
```

**Response**: Lists all matching users with:
- Name and username
- User ID
- Admin status (if applicable)
- Ban status (if applicable)
- Join date

### 2. User Ban/Unban System
**File**: `database/users.js`

#### Functions

```javascript
// Ban a user
const bannedUser = await banUser(userId, reason);
// reason: (optional) reason for ban

// Unban a user
const unbannedUser = await unbanUser(userId);

// Check if user is banned
const isBanned = await isUserBanned(userId);
// Returns: boolean

// Get all users (includes banned status)
const users = await getAllUsers();
```

#### Admin Commands

**Ban a user**:
```
/banuser <user_id> [reason]

Examples:
  /banuser 123456789
  /banuser 123456789 Spam and harassment
```

**Unban a user**:
```
/unbanuser <user_id>

Example:
  /unbanuser 123456789
```

#### Banned User Experience
- Bot replies: "🚫 Your account has been banned. You cannot use this bot."
- All commands blocked for banned users
- Ban reason and timestamp logged for admin records
- Ban can be revoked anytime with `/unbanuser`

---

## ⚙️ Advanced Settings

### 1. Feature Enable/Disable Toggles
**File**: `database/settings.js`

#### Functions

```javascript
// Enable a feature for user
await enableFeature(userId, featureId);

// Disable a feature for user
await disableFeature(userId, featureId);

// Check if feature is enabled
const enabled = await isFeatureEnabled(userId, featureId);
// Returns: boolean (true by default if not set)

// Get all enabled features
const features = await getEnabledFeatures(userId);
// Returns: Array of enabled feature IDs
```

#### Behavior
- **Default**: All features enabled for new users
- **Disabled features**: Won't appear in user's `/menu`
- **Per-user**: Each user has independent feature settings
- **Admin override**: Can force-enable/disable features for all users (future feature)

### 2. Notification Preferences
**File**: `utils/notificationPreferences.js`

#### Available Preferences

```javascript
{
  enableNotifications: true,           // Master on/off
  enableEmailNotifications: false,     // Email (if configured)
  quietHourStart: "22:00",             // No notifications after this
  quietHourEnd: "08:00",               // Resume notifications at this time
  notifyFeatureErrors: true,           // Get error notifications
  notifyFeatureUpdates: true,          // Get update notifications
  notifyAdminMessages: true,           // Get messages from admins
  dailyDigest: false,                  // Daily summary notification
  dailyDigestTime: "09:00",            // When to send daily digest
  perFeatureNotifications: {           // Per-feature settings
    "feature_id_1": true,
    "feature_id_2": false
  }
}
```

#### Functions

```javascript
// Set user preferences
await setNotificationPreferences(userId, {
  quietHourStart: "22:00",
  quietHourEnd: "08:00"
});

// Get all preferences
const prefs = await getNotificationPreferences(userId);

// Check if currently in quiet hours
const inQuiet = await isInQuietHours(userId);

// Enable notifications for specific feature
await enableFeatureNotifications(userId, featureId);

// Disable notifications for specific feature
await disableFeatureNotifications(userId, featureId);

// Check if feature notifications enabled
const enabled = await isFeatureNotificationEnabled(userId, featureId);

// Get formatted preferences for display
const display = await formatPreferencesForDisplay(userId);
```

#### Quiet Hours Example
- User sets: 22:00 - 08:00 (no notifications 10 PM - 8 AM)
- Bot won't send notifications during this time
- Messages queued and sent after quiet hours end
- Works across midnight (e.g., 23:00 - 02:00)

---

## ⭐ Rating System

### Feature Ratings
**File**: `utils/featureRatings.js`

#### What Users Can Rate
- Each feature individually
- 1-5 star rating scale
- Optional written feedback
- Rated features and feedback stored permanently

#### Functions

```javascript
// Rate a feature
const rating = await rateFeature(userId, featureId, ratingValue, feedback);
// ratingValue: 1-5
// feedback: (optional) text up to 500 chars

// Get average rating for a feature
const stats = await getFeatureRating(featureId);
// Returns: { averageRating, totalRatings, distribution }

// Get user's rating for a feature
const userRating = await getUserRating(userId, featureId);
// Returns: { rating, feedback, ratedAt } or null

// Get top rated features
const topFeatures = await getTopRatedFeatures(10);
// Returns: Array of top 10 features by rating

// Get all feedback for a feature
const feedback = await getFeatureFeedback(featureId);
// Returns: Array of feedback entries sorted by recency

// Format rating for display
const display = formatRatingForDisplay(rating);
// Returns: "⭐⭐⭐⭐☆ 4.0/5.0 (237 ratings)"
```

#### Admin Features
- View top-rated features: `/admin analytics`
- See feature ratings dashboard
- Read user feedback
- Use ratings to identify:
  - Popular features (high rating)
  - Problematic features (low rating)
  - User preferences

#### Rating Display Format
```
⭐⭐⭐⭐⭐ 4.8/5.0 (345 ratings)

Rating Distribution:
5⭐: ████████████ 245 (71%)
4⭐: ████ 80 (23%)
3⭐: █ 15 (4%)
2⭐: 3 (1%)
1⭐: 2 (1%)
```

---

## 🔧 Admin Commands

### User Management

#### Search Users
```
/searchuser <query>

Search by: ID, username, first name, last name, or combination
Returns: List of matching users with full details
```

#### Ban Users
```
/banuser <user_id> [reason]

Ban a user from using the bot
Banned users receive: "🚫 Your account has been banned"
Logs: User ID, reason, timestamp, admin ID
```

#### Unban Users
```
/unbanuser <user_id>

Remove ban from a user
User can use bot normally again
Logs: User ID, timestamp, admin ID
```

#### Feature Management (Existing)
```
/makeadmin <user_id>      # Make user an admin
/removeadmin <user_id>    # Remove admin privileges
```

---

## 📖 API Reference

### Database Exports

**users.js**:
```javascript
- addUser(user, isAdmin)
- getUser(userId)
- getAllUsers()
- updateUser(userId, updates)
- updateUserActivity(userId)
- setUserAdmin(userId, isAdmin)
- banUser(userId, reason)
- unbanUser(userId)
- isUserBanned(userId)
```

**settings.js**:
```javascript
- getUserSettings(userId)
- updateUserSettings(userId, settings)
- getKeyboardStyle(userId)
- setKeyboardStyle(userId, style)
- getNotificationStyle(userId)
- setNotificationStyle(userId, style)
- getUserLanguage(userId)
- setUserLanguage(userId, language)
- enableFeature(userId, featureId)
- disableFeature(userId, featureId)
- isFeatureEnabled(userId, featureId)
- getEnabledFeatures(userId)
```

### Utilities Exports

**userSearch.js**:
```javascript
- searchUsers(query, searchType)
- formatUserForDisplay(user)
- getUserDetails(userId)
```

**notificationPreferences.js**:
```javascript
- setNotificationPreferences(userId, prefs)
- getNotificationPreferences(userId)
- isInQuietHours(userId)
- enableFeatureNotifications(userId, featureId)
- disableFeatureNotifications(userId, featureId)
- isFeatureNotificationEnabled(userId, featureId)
- formatPreferencesForDisplay(userId)
```

**featureRatings.js**:
```javascript
- rateFeature(userId, featureId, rating, feedback)
- getFeatureRating(featureId)
- getUserRating(userId, featureId)
- getTopRatedFeatures(limit)
- getFeatureFeedback(featureId)
- formatRatingForDisplay(rating)
```

---

## 💡 Usage Examples

### Example 1: Search and Ban Spam User
```
Admin: /searchuser @spammer
Bot: Shows user details
Admin: /banuser 987654321 Spam and harassment
Bot: User banned successfully
Result: Spammer blocked from bot
```

### Example 2: User Sets Quiet Hours
```
User: Sets quiet hours 22:00-08:00
Bot: Saves preference
Result: No notifications during that time
Schedule: Messages queue and send at 08:00
```

### Example 3: Rating a Feature
```
User: Uses /feature1, satisfied
User: /rate_feature feature1 5 "Great feature, works perfectly!"
Bot: Saves rating and feedback
Admin: Sees 4.8/5 average rating
Admin: Reads user feedback for improvements
```

### Example 4: Admin Views Feature Stats
```
Admin: /admin → analytics
Bot: Shows dashboard with:
  - Top 10 features by rating
  - Total ratings per feature
  - User feedback summary
  - Feature usage statistics
```

### Example 5: User Manages Feature Preferences
```
User: Has 25 features enabled
User: Disables 5 features they don't use
Result: Only 20 features show in /menu
Admin: Can see enablement stats
Result: Feature menu is cleaner for user
```

---

## 📊 Statistics & Monitoring

### What Gets Tracked
- User searches (query, results count)
- Ban/unban actions (admin, user, reason, timestamp)
- Feature ratings (user, feature, rating, feedback)
- Notification preferences changes (what changed, when)
- Feature toggles (user, feature, enabled/disabled)

### Admin Dashboard Access
```
/admin → analytics → see all statistics
Shows:
- Active users
- Top rated features
- Most banned users
- Most searched queries
- Recent admin actions
```

---

## ⚠️ Important Notes

### Data Storage
- **Users**: `data/users.json` - User profiles and admin status
- **Settings**: `data/settings.json` - User preferences and feature toggles
- **Ratings**: `data/logs.json` - Feature ratings and feedback
- **Stats**: `data/stats.json` - Usage statistics

### Permissions
- **User commands**: Available to all users
- **Admin commands**: Only for ADMIN_IDS in `.env`
- **Ban function**: Admin only

### Defaults
- Features: Enabled by default (all users see all features)
- Notifications: Enabled by default
- Quiet hours: Disabled by default

### Performance
- User search: O(n) where n = total users
- Rating retrieval: O(n) where n = total ratings
- Feature toggle: O(1) update
- All operations async and non-blocking

---

## 🚀 Future Enhancements

### Planned Features (Not Yet Implemented)
1. **Feature Scheduling**: Schedule feature notifications
2. **User Favorites**: Quick access to favorite features
3. **Settings Import/Export**: Backup and restore settings
4. **Advanced Analytics**: Detailed usage heatmaps
5. **Audit Logging**: Complete action history
6. **Additional Languages**: Spanish, French, Chinese, Arabic
7. **API Key Rotation**: Security enhancement for OpenAI
8. **Multi-Instance Clustering**: Horizontal scaling

---

## 📞 Support

### Troubleshooting

**User not found in search**:
- Check spelling
- Try searching by different criteria (ID vs username)
- User might be new (need to use /start first)

**Ban not working**:
- Verify you're an admin (ADMIN_IDS)
- Check user ID is numeric
- User might already be banned

**Settings not saving**:
- Check database is writable
- Verify no permission errors
- Look at logs for database errors

**Ratings not appearing**:
- Rating takes 1-2 seconds to save
- Try refreshing feature display
- Check logs database exists

### Getting Help
1. Check bot logs: `tail -f logs/bot.log`
2. Review error messages in admin panel
3. Verify `.env` configuration
4. Run test suite: `bash test_features.sh`

---

## 📝 Changelog

### Version 1.0.3-production (Latest)
- ✅ Fixed settings persistence bug
- ✅ Fixed /menu display issue
- ✅ Added user search system
- ✅ Added ban/unban functionality
- ✅ Added feature toggles
- ✅ Added notification preferences
- ✅ Added feature rating system
- ✅ Improved profile accuracy
- ✅ Enhanced admin commands

### Version 1.0.2
- ✅ Real stats tracking middleware
- ✅ Complete broadcast service
- ✅ Feature generation improvements
- ✅ Auto-fixer module

### Version 1.0.1
- ✅ Initial production deployment
- ✅ Core features implemented
- ✅ Admin panel

---

**Last Updated**: November 22, 2025  
**Status**: ✅ Production Ready  
**Tests**: 38/38 Passing  
**Ready for**: Public Deployment
