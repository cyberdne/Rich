#!/bin/bash

# Telegram Bot Startup Script untuk Termux
# Jalankan dengan: bash start.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Telegram Bot Startup Script${NC}"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed${NC}"
  echo "Please install Node.js with: pkg install nodejs-lts -y"
  exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  echo "Creating .env from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your configuration:${NC}"
    echo "  - BOT_TOKEN"
    echo "  - ADMIN_IDS"
    echo ""
    echo "Edit with: nano .env"
    exit 1
  else
    echo -e "${RED}❌ .env.example not found either${NC}"
    exit 1
  fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  npm install --legacy-peer-deps
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Create data directory if it doesn't exist
mkdir -p data logs

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎯 Bot Configuration:${NC}"
echo -e "${GREEN}================================${NC}"

# Source .env file to display config
export $(cat .env | grep -v '#' | xargs)

echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo -e "Bot Token: ${BOT_TOKEN:0:20}...${BOT_TOKEN:(-10)}"
echo "Admin IDs: $ADMIN_IDS"
echo "Environment: $NODE_ENV"
echo "Debug Mode: $DEBUG_MODE"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${YELLOW}Starting bot...${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if running with screen or tmux
if [ "$1" == "screen" ]; then
  echo -e "${YELLOW}📌 Starting in screen session 'bot'${NC}"
  screen -S bot npm start
elif [ "$1" == "tmux" ]; then
  echo -e "${YELLOW}📌 Starting in tmux session 'bot'${NC}"
  tmux new-session -d -s bot 'npm start'
  echo -e "${GREEN}✅ Bot started in tmux${NC}"
  echo "Attach with: tmux attach -t bot"
elif [ "$1" == "dev" ]; then
  echo -e "${YELLOW}📌 Starting in development mode${NC}"
  npm run dev
else
  echo -e "${YELLOW}📌 Starting in production mode${NC}"
  npm start
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Bot is running!${NC}"
echo -e "${GREEN}================================${NC}"
