# Advanced Telegram Bot - Production Ready 2025

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D12.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Bot Telegram yang canggih dan fleksibel dengan dukungan penuh untuk Termux Android 2025. Bot ini dilengkapi dengan fitur-fitur modern, manajemen user yang komprehensif, dan kemampuan untuk membuat feature secara dinamis.

## ✨ Fitur Utama

### 🤖 Core Features
- **Multi-Language Support** - Support untuk multiple bahasa
- **User Management** - Manajemen user dengan admin controls
- **Dynamic Features** - Buat dan manage fitur secara dinamis
- **Customizable Keyboard** - 5 style keyboard yang berbeda
- **Admin Panel** - Panel admin yang lengkap untuk manage bot
- **Broadcasting** - Kirim pesan ke semua user sekaligus
- **Statistics & Analytics** - Tracking penggunaan dan performa
- **Logging System** - Comprehensive logging untuk debugging

### 🔐 Security
- **Rate Limiting** - Proteksi dari spam dan abuse
- **Admin Authentication** - Hanya admin yang bisa akses panel
- **Error Handling** - Error handling yang robust
- **Session Management** - Secure session management

### 🎯 Developer Features
- **Feature Generator** - Buat feature dengan AI atau template
- **Command Handler** - Easy command setup
- **Callback Handler** - Handle inline button callbacks
- **Database Backup** - Automatic database backup
- **Debug Tools** - Built-in debug commands

## 📋 Requirements

### Minimum Requirements
- **Node.js**: v12+
- **RAM**: 256MB (untuk Termux)
- **Storage**: 500MB
- **Koneksi Internet**: Stabil

### Recommended untuk Production
- **Node.js**: v18+
- **RAM**: 512MB+
- **Storage**: 1GB+

## 🚀 Quick Start

### Untuk Termux Android

```bash
# 1. Setup otomatis (recommended)
bash setup.sh

# 2. Atau manual setup:
pkg update && pkg upgrade -y
pkg install nodejs-lts -y
npm install
cp .env.example .env
nano .env  # Setup BOT_TOKEN, ADMIN_IDS, dll

# 3. Jalankan bot
npm start
```

### Untuk Linux/macOS

```bash
# Install dependencies
npm install

# Copy dan setup environment
cp .env.example .env
nano .env

# Jalankan bot
npm start

# Atau untuk development dengan auto-reload
npm run dev
```

## 📁 Project Structure

```
Rich/
├── index.js                    # Main entry point
├── package.json               # Dependencies
├── .env.example              # Environment template
├── README.md                 # Dokumentasi utama
├── README_TERMUX.md          # Panduan Termux
├── start.sh                  # Startup script
├── setup.sh                  # Automated setup
│
├── config/
│   ├── config.js            # Bot configuration
│   ├── keyboards.js         # Keyboard layouts
│   └── sample-config.js     # Configuration example
│
├── database/
│   ├── db.js                # Database initialization
│   ├── users.js             # User management
│   └── settings.js          # Settings management
│
├── handlers/
│   ├── commandHandler.js    # Command processing
│   ├── callbackHandler.js   # Button callback handling
│   ├── inlineQueryHandler.js # Inline query handling
│   ├── adminHandler.js      # Admin-specific handlers
│   └── errorHandler.js      # Error handling
│
├── middleware/
│   ├── auth.js              # Authentication
│   ├── logger.js            # Request logging
│   └── rateLimiter.js       # Rate limiting
│
├── modules/
│   ├── ai/
│   │   ├── aiService.js      # OpenAI integration
│   │   └── featureGenerator.js # Feature generation
│   └── analytics/
│       ├── performanceMonitor.js # Performance tracking
│       └── usageStats.js      # Usage statistics
│
├── features/
│   ├── featureLoader.js      # Feature loading system
│   └── [feature-id]/         # Dynamic features
│
├── utils/
│   └── logger.js            # Winston logger setup
│
├── locales/
│   ├── en.json              # English translations
│   └── id.json              # Indonesian translations
│
├── data/
│   ├── users.json           # User database
│   ├── settings.json        # Settings database
│   ├── features.json        # Features database
│   └── stats.json           # Statistics database
│
├── logs/
│   ├── combined.log         # All logs
│   ├── error.log            # Error logs
│   └── debug.log            # Debug logs
│
└── sessions.json            # Session storage
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Required
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
ADMIN_IDS=USER_ID_1,USER_ID_2

# Optional
LOG_CHANNEL_ID=YOUR_LOG_CHANNEL_ID
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# Settings
DEBUG_MODE=false
NODE_ENV=production
```

### Dapatkan Token Bot
1. Buka Telegram → @BotFather
2. Kirim `/newbot`
3. Ikuti instruksi
4. Copy token ke .env

### Dapatkan User ID
1. Buka Telegram → @userinfobot
2. Kirim pesan apapun
3. Bot akan tampilkan User ID Anda

## 📝 Commands

### User Commands
```
/start     - Start bot dan show main menu
/help      - Tampilkan bantuan
/settings  - Buka settings
/menu      - Show main menu
/admin     - Admin panel (admin only)
```

### Admin Commands
```
/admin              - Show admin panel
/stats              - Tampilkan statistics
/debug              - Debug tools
/broadcast          - Kirim pesan ke semua user
/makeadmin [ID]     - Jadikan user sebagai admin
/removeadmin [ID]   - Remove admin privileges
```

## 🎨 Keyboard Styles

Bot mendukung 5 style keyboard yang berbeda:
- **classic** - Classic style with descriptions
- **compact** - Compact layout dengan more buttons
- **modern** - Modern design (default)
- **elegant** - Professional look tanpa emoji
- **minimalist** - Simple dan clean

User bisa pilih style favorit di Settings.

## 📊 Admin Panel Features

### User Management
- Lihat total users dan active users
- View user information
- Make/remove admins
- Export user data

### Analytics
- Track feature usage
- Monitor command usage
- View performance statistics
- Track response times

### Bot Settings
- Configure default keyboard style
- Set notification style
- Manage languages
- Configure logging

### System Status
- Check system resources
- Monitor memory usage
- View uptime
- Track load average

### Feature Management
- Create features dari template
- Generate features dengan AI
- Import features dari JSON
- Edit existing features

### Logs
- View recent logs
- Filter by level (error, info, debug)
- Export logs
- Clean old logs

## 🤖 Feature Generation

### Dari Template
```
/admin → Add New Feature → Create from Template
Isi: Feature ID, Name, Description, Emoji
```

### Dengan AI (Membutuhkan OPENAI_API_KEY)
```
/admin → Add New Feature → AI-Assisted Creation
Jelaskan feature yang ingin dibuat
Bot akan generate otomatis
```

### Import dari JSON
```
/admin → Add New Feature → Import from JSON
Paste JSON atau upload file
```

### Custom Code
```
/admin → Add New Feature → Custom Code
Buat feature dengan JavaScript code custom
```

## 🔍 Database

### Storage
Bot menggunakan **lowdb** untuk JSON-based database:
- **users.json** - User data dan preferences
- **settings.json** - Bot dan user settings
- **features.json** - Feature definitions
- **stats.json** - Usage dan performance stats
- **logs.json** - Application logs

### Backup
Backup otomatis tersimpan di `data/backups/`
```bash
# Manual backup
/debug backup

# Restore
/debug restore [backup-timestamp]
```

## 📊 Statistics

### User Statistics
- Total users
- Active users (30 hari)
- User engagement
- Feature popularity

### Bot Statistics
- Command usage
- Feature usage
- Error tracking
- Response times

## ⚙️ Development

### Development Mode
```bash
npm run dev
```
Auto-reload saat ada perubahan file.

### Debug Mode
```env
DEBUG_MODE=true
```
Enable detailed logging dan debug tools.

### Testing
```bash
# Check configuration
npm run start --dry-run

# Run diagnostics
/debug status
```

## 🛠️ Troubleshooting

### Bot tidak respond
1. Check .env configuration
2. Verify BOT_TOKEN correct
3. Check internet connection
4. Restart bot

### Memory issues (khususnya di Termux)
```bash
# Batasi memory
node --max-old-space-size=256 index.js
```

### Database errors
```bash
# Backup current database
cp -r data data.backup

# Bot akan recreate database saat startup
npm start
```

### Permission denied (di Termux)
```bash
chmod +x node_modules/.bin/*
chmod +x start.sh setup.sh
```

### Port atau process stuck
```bash
# Kill process
pkill -f "node index.js"

# atau di Termux
killall node
```

## 📈 Performance Tips

1. **Use production mode**: `NODE_ENV=production`
2. **Enable compression**: Kurangi payload size
3. **Monitor memory**: Jangan create fitur yang terlalu kompleks
4. **Rate limiting**: Proteksi dari abuse
5. **Database optimization**: Regular backup dan cleanup

## 🔐 Security Best Practices

1. **.env tidak boleh di-commit** - Add ke .gitignore
2. **Use strong admin IDs** - Jangan share dengan sembarang orang
3. **Update dependencies**: Regularly update packages
4. **Monitor logs**: Check error logs regularly
5. **Backup data**: Backup database regularly

## 📚 API Documentation

### Command Handler
```javascript
bot.command('command_name', async (ctx) => {
  // Handle command
});
```

### Callback Handler
```javascript
ctx.callbackQuery.data  // Get callback data
ctx.answerCbQuery()     // Answer callback
```

### Send Messages
```javascript
await ctx.reply('Text message', {
  parse_mode: 'Markdown',
  reply_markup: keyboard
});

await ctx.editMessageText('New text', {
  reply_markup: keyboard
});
```

## 🆘 Support & Issues

### Debugging
Enable debug mode di .env:
```env
DEBUG_MODE=true
```

Check logs:
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Getting Help
1. Check README.md dan README_TERMUX.md
2. Review /debug status output
3. Check application logs
4. Test di development mode

## 📦 Dependencies

Semua dependencies sudah listed di package.json dengan versions yang compatible untuk Termux:
- **telegraf** (^4.14.0) - Telegram Bot API framework
- **lowdb** (^6.1.1) - JSON database
- **winston** (^3.14.1) - Logging library
- **openai** (^4.52.0) - OpenAI API client
- **dotenv** (^16.3.1) - Environment variables
- Plus 10+ dependencies lainnya

## 🎯 Roadmap

- [ ] Database migration tools
- [ ] Multi-language admin panel
- [ ] Advanced analytics dashboard
- [ ] Plugin system
- [ ] Cloud sync support
- [ ] Built-in analytics dashboard

## 📄 License

MIT License - Bebas digunakan untuk keperluan komersial maupun personal.

## 🤝 Contributing

Contributions welcome! Feel free untuk:
- Report bugs
- Suggest improvements
- Submit pull requests
- Share feature ideas

## 📞 Contact

- Bot Repository: https://github.com/cyberdne/Rich
- Developer: @cyberdne on Telegram

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Tested on**: Termux Android 2025, Node.js v18+, Ubuntu 24.04+
