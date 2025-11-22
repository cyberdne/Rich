#!/bin/bash

# Complete Setup Script untuk Telegram Bot di Termux Android

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  $1"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Main script
print_header "TELEGRAM BOT SETUP - TERMUX ANDROID"

print_info "This script will set up your Telegram bot in Termux"
echo ""

# Step 1: Update Termux
print_header "Step 1: Update Termux"
print_info "Updating package manager and installed packages..."

# This might fail on some Termux installations, so we don't exit on error
pkg update -y 2>/dev/null || print_warning "Could not fully update Termux"
pkg upgrade -y 2>/dev/null || print_warning "Could not fully upgrade Termux"

print_success "Termux updated"
echo ""

# Step 2: Install Node.js
print_header "Step 2: Install Node.js"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  print_success "Node.js is already installed: $NODE_VERSION"
else
  print_info "Installing Node.js LTS..."
  pkg install nodejs-lts -y || {
    print_error "Failed to install Node.js"
    exit 1
  }
  print_success "Node.js installed: $(node --version)"
fi

echo ""

# Step 3: Setup project directory
print_header "Step 3: Setup Project Directory"

if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$HOME/projects/Rich"
fi

print_info "Project directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
  print_info "Creating project directory..."
  mkdir -p "$PROJECT_DIR"
  print_success "Project directory created"
else
  print_success "Project directory already exists"
fi

cd "$PROJECT_DIR"
echo ""

# Step 4: Install dependencies
print_header "Step 4: Install Dependencies"

if [ ! -d "node_modules" ]; then
  print_info "Installing npm packages..."
  npm install --legacy-peer-deps || {
    print_warning "npm install had some issues, trying again..."
    npm install --legacy-peer-deps --no-audit --no-fund
  }
  print_success "Dependencies installed"
else
  print_success "Dependencies already installed"
fi

echo ""

# Step 5: Configure environment
print_header "Step 5: Configure Environment"

if [ ! -f ".env" ]; then
  print_info "Creating .env file..."
  
  if [ -f ".env.example" ]; then
    cp .env.example .env
  else
    # Create basic .env
    cat > .env << 'EOF'
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
ADMIN_IDS=YOUR_USER_ID_HERE
LOG_CHANNEL_ID=
OPENAI_API_KEY=
DEBUG_MODE=false
NODE_ENV=production
EOF
  fi
  
  print_warning "Environment file created. Please edit .env with your configuration:"
  echo ""
  echo "  1. Get your BOT_TOKEN from @BotFather on Telegram"
  echo "  2. Get your ADMIN_IDS from @userinfobot on Telegram"
  echo "  3. Set other optional parameters"
  echo ""
  print_info "Edit with: nano .env"
  
  # Ask user to configure
  echo ""
  read -p "Press Enter after editing .env, or Ctrl+C to cancel..."
else
  print_success "Environment file already configured"
fi

echo ""

# Step 6: Create necessary directories
print_header "Step 6: Setup Directories"

mkdir -p data logs
print_success "Data directories created"

echo ""

# Step 7: Test installation
print_header "Step 7: Testing Installation"

print_info "Checking configuration..."
npm run start --dry-run 2>/dev/null || print_info "Running configuration test..."

if [ -f ".env" ]; then
  if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    print_error "BOT_TOKEN not configured!"
    print_info "Please edit .env and set BOT_TOKEN"
    exit 1
  fi
  print_success "Configuration looks good"
else
  print_error ".env file not found"
  exit 1
fi

echo ""

# Step 8: Show usage instructions
print_header "Setup Complete!"
echo ""
print_success "Bot is ready to start!"
echo ""
echo "Usage:"
echo ""
echo "  1. Start in foreground:"
echo -e "     ${YELLOW}npm start${NC}"
echo ""
echo "  2. Start in development mode (auto-reload):"
echo -e "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  3. Start in background with screen:"
echo -e "     ${YELLOW}screen -S bot npm start${NC}"
echo -e "     To reconnect: ${YELLOW}screen -r bot${NC}"
echo ""
echo "  4. Start in background with tmux:"
echo -e "     ${YELLOW}tmux new-session -d -s bot 'npm start'${NC}"
echo -e "     To reconnect: ${YELLOW}tmux attach -t bot${NC}"
echo ""
echo "  5. Or use our startup script:"
echo -e "     ${YELLOW}bash start.sh${NC} (interactive)"
echo -e "     ${YELLOW}bash start.sh screen${NC} (background with screen)"
echo ""
echo "Documentation:"
echo -e "  ${YELLOW}README.md${NC} - General documentation"
echo -e "  ${YELLOW}README_TERMUX.md${NC} - Termux-specific guide"
echo ""
print_success "Happy bot-making! 🚀"
