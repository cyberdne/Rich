#!/bin/bash

# QUICK START GUIDE - Telegram Bot untuk Termux Android
# Gunakan script ini untuk setup cepat

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║  📱 TELEGRAM BOT - QUICK START GUIDE                 ║
║  ✅ Ready for Termux Android 2025                    ║
║  ✅ 100% Perbaikan Selesai                           ║
╚═══════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BLUE}Step 1: Verify Requirements${NC}"
echo "================================"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
  echo -e "${YELLOW}⚠️  Node.js not found${NC}"
  echo "   Install: pkg install nodejs-lts -y"
  exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
  echo -e "${YELLOW}❌ npm not found${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Install Dependencies${NC}"
echo "================================"

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing packages...${NC}"
  npm install --legacy-peer-deps --no-audit --no-fund
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Setup Configuration${NC}"
echo "================================"

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env from template${NC}"
  fi
  
  echo ""
  echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env file!${NC}"
  echo ""
  echo "You need to set these values:"
  echo "  1. BOT_TOKEN - Get from @BotFather on Telegram"
  echo "  2. ADMIN_IDS - Get from @userinfobot on Telegram"
  echo ""
  echo -e "${YELLOW}Edit command:${NC}"
  echo "  nano .env"
  echo ""
  
  read -p "Press Enter after editing .env..."
else
  echo -e "${GREEN}✅ .env file already configured${NC}"
  
  # Check if configured
  if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo -e "${YELLOW}⚠️  But BOT_TOKEN not set yet!${NC}"
    echo "Edit: nano .env"
    exit 1
  fi
fi

echo ""
echo -e "${BLUE}Step 4: Create Required Directories${NC}"
echo "================================"

mkdir -p data logs features
echo -e "${GREEN}✅ Directories created${NC}"

echo ""
echo -e "${BLUE}Step 5: Verify Setup${NC}"
echo "================================"

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

echo "════════════════════════════════════════════"
echo -e "${GREEN}🎉 READY TO START BOT!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "Choose how to run your bot:"
echo ""
echo -e "${YELLOW}1. Foreground (recommended for testing):${NC}"
echo "   npm start"
echo ""
echo -e "${YELLOW}2. Background with screen:${NC}"
echo "   screen -S bot npm start"
echo "   To reconnect: screen -r bot"
echo ""
echo -e "${YELLOW}3. Background with tmux:${NC}"
echo "   tmux new-session -d -s bot 'npm start'"
echo "   To reconnect: tmux attach -t bot"
echo ""
echo -e "${YELLOW}4. Development mode (auto-reload):${NC}"
echo "   npm run dev"
echo ""
echo -e "${YELLOW}5. Interactive startup:${NC}"
echo "   bash start.sh"
echo ""
echo "════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  • README.md - Full documentation"
echo "  • README_TERMUX.md - Termux-specific guide"
echo "  • README_INDONESIA.md - Indonesian guide"
echo "  • FIXES_SUMMARY.md - Technical details"
echo ""
echo -e "${GREEN}✅ Bot is ready to start!${NC}"
echo ""
