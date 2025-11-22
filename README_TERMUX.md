# Telegram Bot - Termux Android Setup Guide

Panduan lengkap untuk menjalankan bot Telegram ini di Termux Android 2025.

## ✅ Prasyarat

### 1. Install Termux
- Download dari F-Droid atau termux.dev
- Jangan download dari Play Store (versi lama dan kurang stabil)

### 2. Update Termux
```bash
pkg update
pkg upgrade -y
```

### 3. Install Node.js (disarankan v18+)
```bash
pkg install nodejs-lts -y
```

Verifikasi instalasi:
```bash
node --version
npm --version
```

## 🚀 Setup Bot

### 1. Clone atau Download Repository
```bash
cd ~
mkdir projects
cd projects
# Jika menggunakan git:
git clone <repository-url> Rich
# Atau extract file jika sudah download
```

### 2. Masuk ke Directory Bot
```bash
cd Rich
```

### 3. Install Dependencies
```bash
npm install
```

**Catatan untuk Termux**: Jika terjadi error saat install, jalankan:
```bash
npm install --legacy-peer-deps
```

### 4. Setup Environment Variables
Buat file `.env` dengan isi:
```bash
cp .env.example .env  # Jika ada file contoh
# atau buat manual
nano .env
```

Isi `.env`:
```
BOT_TOKEN=<token-bot-telegram-anda>
ADMIN_IDS=<user-id-admin-telegram>
LOG_CHANNEL_ID=<channel-id-opsional>
OPENAI_API_KEY=<api-key-openai-opsional>
DEBUG_MODE=true
NODE_ENV=production
```

**Cara mendapatkan token bot**:
1. Buka Telegram dan cari @BotFather
2. Kirim `/newbot`
3. Ikuti instruksi
4. Copy token yang diberikan

**Cara mendapatkan User ID**:
1. Buka Telegram dan cari @userinfobot
2. Kirim pesan apapun
3. Bot akan menampilkan user ID Anda

### 5. Jalankan Bot

#### Mode Development (dengan auto-reload):
```bash
npm run dev
```

#### Mode Production:
```bash
npm start
```

## 🔧 Troubleshooting Termux

### Error: Permission Denied
```bash
chmod +x node_modules/.bin/*
```

### Memori Terbatas
Jika bot sering crash karena kehabisan memori:

```bash
# Batasi penggunaan memori
node --max-old-space-size=256 index.js
```

### Database Error
Pastikan folder `data/` ada dan writeable:
```bash
mkdir -p data
chmod 755 data
```

### Fix untuk lowdb di Termux
Jika lowdb tidak bekerja, gunakan:
```bash
npm install --save lowdb@latest
```

## 📱 Menjalankan Bot di Background

### Menggunakan screen (disarankan):
```bash
# Install screen
pkg install screen -y

# Jalankan bot di background
screen -S bot npm start

# Untuk reconnect ke session:
screen -r bot

# Untuk disconnect tanpa kill:
Ctrl+A kemudian Ctrl+D

# Untuk kill session:
screen -X -S bot quit
```

### Menggunakan tmux (alternatif):
```bash
# Install tmux
pkg install tmux -y

# Jalankan bot
tmux new-session -d -s bot 'npm start'

# Connect kembali
tmux attach -t bot

# Disconnect: Ctrl+B kemudian D
```

### Menggunakan nohup (sederhana):
```bash
nohup npm start > bot.log 2>&1 &
```

## 📊 Monitoring Bot

### Cek Status
```bash
ps aux | grep node
```

### Lihat Log
```bash
tail -f bot.log
# atau jika menggunakan npm run dev, log akan langsung terlihat
```

### Check Memory Usage
```bash
free -h
ps aux | grep node
```

## 🛠️ Maintenance

### Update Dependencies
```bash
npm update
```

### Backup Database
```bash
cp -r data/ data.backup/
```

### Restore Database
```bash
rm -r data/
cp -r data.backup/ data/
```

## ⚙️ Optimasi untuk Termux

### 1. Batasi File Logging
Edit `utils/logger.js` untuk mengurangi I/O:
- File log akan dihapus otomatis saat mencapai 5MB
- Maksimal 5 file log tersimpan

### 2. Disable Database Logging (untuk performa)
Edit `utils/logger.js`, uncomment bagian database logging yang sudah dikomen jika ingin enable.

### 3. Gunakan Compression
```bash
npm install compression
```

Setelah install, edit `index.js` untuk menggunakan compression middleware.

## 🔐 Security Tips

1. **Jangan share .env file** - Berisi token sensitif
2. **Update Node.js secara berkala**
3. **Backup database secara rutin**
4. **Gunakan admin ID yang tepat**

## 📚 File Penting

- `index.js` - Main bot file
- `config/config.js` - Konfigurasi bot
- `.env` - Environment variables (JANGAN COMMIT)
- `database/` - Data storage
- `handlers/` - Command handlers
- `features/` - Feature modules
- `modules/ai/` - AI integration

## 🆘 Support

Jika terjadi error:
1. Cek file `.env` sudah benar
2. Cek koneksi internet
3. Lihat log untuk error message
4. Coba restart bot

## 📝 Catatan Termux Specific

- **Termux tidak memiliki true filesystem persistence** seperti Linux desktop
- Data akan hilang jika Termux di-uninstall
- Backup penting secara berkala ke cloud atau external storage
- Gunakan app seperti Termux:Boot untuk auto-start bot saat startup Android

## 🚀 Tips Performa

1. Gunakan `NODE_ENV=production` untuk performa lebih baik
2. Batasi history logs dengan mengatur `maxFiles: 5` di logger
3. Gunakan rate limiter untuk mencegah flood
4. Jangan buat fitur yang terlalu kompleks

---

**Bot versi:** 1.0.0  
**Updated:** 2025  
**Tested:** Termux Android 2025
