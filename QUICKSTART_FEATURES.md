# 🎯 Quick Start Guide - New Features

**For Admins & Users** | Last Updated: November 22, 2025

---

## 🚀 Getting Started

### For Users

#### 1. Adjusting Your Settings

**View Your Profile**:
- Click button: "⚙️ Settings" → "👤 My Profile"
- See your current settings and statistics

**Change Notification Style**:
- Settings → "🔔 Notification Style"
- Choose: Standard, Emoji Rich, Minimal, or Detailed

**Set Quiet Hours** (No Notifications):
- Settings → "🔔 Notification Style" → Options
- Set from 22:00 to 08:00 (example)
- Notifications resume after quiet hours

#### 2. Managing Your Features

**Enable/Disable Features** (Coming Soon):
- Settings → "📋 My Features"
- Toggle features you want/don't want
- Menu updates immediately

**Rate Features** (Feedback):
- After using a feature
- React with: 1⭐ to 5⭐
- Add optional feedback

---

## 🔧 For Administrators

### Admin Commands Overview

```
/searchuser <query>        # Find users
/banuser <id> [reason]     # Ban a user
/unbanuser <id>            # Unban a user
/makeadmin <id>            # Make user admin
/removeadmin <id>          # Remove admin privileges
```

### Common Admin Tasks

#### Task 1: Find a User
```
Command: /searchuser john
Result:  Shows all users named John
         Includes ID, username, join date, status
```

#### Task 2: Handle Problem Users
```
Command: /searchuser spammeruser
Result:  Find the user
Command: /banuser 123456789 Spam behavior
Result:  User blocked immediately
         Bot message: "🚫 Your account has been banned"
```

#### Task 3: Lift a Ban
```
Command: /searchuser spammeruser
Result:  Find the user (shows banned status)
Command: /unbanuser 123456789
Result:  Ban removed, user can use bot again
```

#### Task 4: Check Feature Ratings
```
Action:  /admin → "📊 Analytics"
View:    Top rated features
         User feedback
         Rating distribution
         Most/least used features
```

### Admin Dashboard
```
Access: /admin

Options:
  👥 User Management      # Search, ban, manage users
  📊 Analytics           # View stats, ratings, usage
  ⚙️ Bot Settings        # Configure bot behavior
  🔄 System Status       # Health check
  ✨ Add New Feature     # Create features
  🔧 Edit Features       # Modify features
  📝 Logs                # View action history
  🚀 Broadcast           # Send messages to users
```

---

## 💡 Use Case Scenarios

### Scenario 1: User Reports Feature Bug

**Steps**:
1. User gives you feature ID/name
2. Check feature rating: High = feature popular, Low = needs fixing
3. Read feedback for common issues
4. Review error logs in admin panel
5. Use auto-fixer module (if available)

**Command**:
```
/admin → analytics
View feature "translate" statistics
See average 3.2/5 rating with feedback:
  - "Returns wrong language sometimes"
  - "Slow response"
```

### Scenario 2: Spammer Joins Bot

**Steps**:
1. Someone reports spam
2. Search for the user
3. Review their activity
4. Ban if confirmed
5. Log the reason

**Commands**:
```
/searchuser spammer123
/banuser 987654321 Sending spam links
```

### Scenario 3: User Wants to Hide Features They Don't Use

**User does**:
- Settings → "📋 My Features" → Disable unused features
- Menu now cleaner, only shows what they use

**Admin sees**:
- Can view feature enablement statistics
- Identify unpopular features
- Improve feature discoverability

### Scenario 4: Weekend Notification Blackout

**User does**:
- Settings → "🔔 Notifications" → Quiet Hours
- Sets: Friday 18:00 - Monday 08:00
- No notifications during weekend

**Bot does**:
- Queues all notifications
- Sends them Monday morning
- Prevents notification fatigue

---

## 📊 Key Metrics to Monitor

### As an Admin

**Top Metrics**:
1. **Feature Ratings**: Which features need improvement
2. **Active Users**: Growth and engagement
3. **Ban Activity**: Identify troublemakers
4. **Error Rates**: System health
5. **Search Queries**: What users look for

**View Dashboard**:
```
/admin → 📊 Analytics

Shows:
  • Top 10 features (by rating)
  • Bottom 10 features (need fixing)
  • Active user count
  • Recent bans
  • System errors
  • API response times
```

---

## ⚡ Pro Tips

### For Users
1. **Set quiet hours** to avoid late-night notifications
2. **Rate features** to help admins improve them
3. **Disable unused features** to keep menu clean
4. **Check profile** to see all your settings

### For Admins
1. **Search regularly** to monitor user base
2. **Review low-rated features** to identify issues
3. **Check logs** for suspicious activity
4. **Use broadcasts** to inform users of changes
5. **Monitor trends** in feature usage

---

## 🆘 Troubleshooting

### Issue: User Not Found in Search
**Solution**:
- User must use /start first to register
- Try searching by different criteria
- Check spelling

### Issue: Can't Ban User
**Solution**:
- Verify you're an admin (check ADMIN_IDS)
- User ID must be numeric
- Use /searchuser first to get correct ID

### Issue: Feature Disabled but Still Appears
**Solution**:
- Refresh the menu (/menu command)
- Cache might need clearing
- Restart bot if problem persists

### Issue: Ratings Not Showing
**Solution**:
- Ratings take 2 seconds to save
- Refresh feature display
- Check logs database exists

---

## 📚 Related Documentation

For complete technical details, see:
- `FEATURE_DOCUMENTATION.md` - Complete API reference
- `BUGFIXES_AND_ROADMAP.md` - All fixes and planned features
- `README.md` - General bot documentation

---

## 🎉 You're All Set!

Your bot now has:
- ✅ User search and management
- ✅ Ban/unban system
- ✅ Feature toggles
- ✅ Advanced notifications
- ✅ Rating system
- ✅ All critical bugs fixed

**Start using it!**
1. Use `/menu` to see all features
2. Admins: Use `/searchuser` to find users
3. Users: Set quiet hours in Settings
4. Everyone: Rate features and leave feedback

---

**Questions?** Check the full documentation or review logs for errors.

**Happy using!** 🚀
