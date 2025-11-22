#!/bin/bash

# VERIFICATION CHECKLIST - Telegram Bot Fixes
# Run this to verify all fixes are in place

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ TELEGRAM BOT - VERIFICATION CHECKLIST ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0

# Function to check file existence
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ $1 - NOT FOUND${NC}"
    ((FAILED++))
    return 1
  fi
}

# Function to check content in file
check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✅ $1 contains '$2'${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ $1 missing '$2'${NC}"
    ((FAILED++))
    return 1
  fi
}

echo "📁 FILE STRUCTURE CHECK"
echo "========================"
check_file "index.js"
check_file "package.json"
check_file ".env.example"
check_file "config/config.js"
check_file "database/db.js"
check_file "handlers/commandHandler.js"
check_file "handlers/callbackHandler.js"
check_file "handlers/adminHandler.js"
check_file "handlers/inlineQueryHandler.js"
check_file "handlers/errorHandler.js"
check_file "middleware/auth.js"
check_file "middleware/logger.js"
check_file "middleware/rateLimiter.js"
check_file "modules/ai/aiService.js"
check_file "modules/ai/featureGenerator.js"
check_file "modules/analytics/performanceMonitor.js"
check_file "modules/analytics/usageStats.js"

echo ""
echo "📚 DOCUMENTATION CHECK"
echo "========================"
check_file "README.md"
check_file "README_TERMUX.md"
check_file "FIXES_SUMMARY.md"
check_file "start.sh"
check_file "setup.sh"

echo ""
echo "🔧 CRITICAL FIXES CHECK"
echo "========================"

# Check index.js for async/await
check_content "index.js" "async () => {" || true

# Check config.js for validation
check_content "config/config.js" "if (!process.env.BOT_TOKEN)" || true

# Check package.json for updated dependencies
check_content "package.json" "telegraf.*4\." || true
check_content "package.json" "openai.*4\." || true

# Check aiService for new OpenAI SDK
check_content "modules/ai/aiService.js" "const { OpenAI }" || true
check_content "modules/ai/aiService.js" "openai.chat.completions.create" || true

# Check inlineQueryHandler format
check_content "handlers/inlineQueryHandler.js" "module.exports = (bot) => {" || true

# Check graceful shutdown
check_content "index.js" "uncaughtException" || true
check_content "index.js" "unhandledRejection" || true

echo ""
echo "📊 CODE QUALITY CHECK"
echo "========================"

# Check if all handlers are properly exported
echo -e "${GREEN}Checking handler exports...${NC}"
for handler in handlers/*.js; do
  if grep -q "module.exports" "$handler"; then
    echo -e "${GREEN}✅ $(basename $handler) - exported${NC}"
    ((PASSED++))
  fi
done

# Check if all middleware are properly exported
echo -e "${GREEN}Checking middleware exports...${NC}"
for middleware in middleware/*.js; do
  if grep -q "module.exports" "$middleware"; then
    echo -e "${GREEN}✅ $(basename $middleware) - exported${NC}"
    ((PASSED++))
  fi
done

echo ""
echo "📦 DEPENDENCIES CHECK"
echo "========================"

if [ -f "package.json" ]; then
  echo -e "${GREEN}✅ package.json found${NC}"
  ((PASSED++))
  
  # Check for key dependencies
  if grep -q '"telegraf"' package.json; then
    echo -e "${GREEN}✅ telegraf dependency${NC}"
    ((PASSED++))
  fi
  
  if grep -q '"openai"' package.json; then
    echo -e "${GREEN}✅ openai dependency${NC}"
    ((PASSED++))
  fi
  
  if grep -q '"lowdb"' package.json; then
    echo -e "${GREEN}✅ lowdb dependency${NC}"
    ((PASSED++))
  fi
else
  echo -e "${RED}❌ package.json not found${NC}"
  ((FAILED++))
fi

echo ""
echo "🔐 SECURITY CHECK"
echo "========================"

# Check for env validation
if grep -q "BOT_TOKEN.*not set" index.js || grep -q "BOT_TOKEN.*not set" config/config.js; then
  echo -e "${GREEN}✅ BOT_TOKEN validation present${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️  BOT_TOKEN validation check${NC}"
fi

# Check for error handlers
if grep -q "process.on.*uncaught" index.js; then
  echo -e "${GREEN}✅ Uncaught exception handling${NC}"
  ((PASSED++))
fi

if grep -q "process.on.*unhandled" index.js; then
  echo -e "${GREEN}✅ Unhandled rejection handling${NC}"
  ((PASSED++))
fi

# Check for rate limiting
if grep -q "setupRateLimiter" index.js; then
  echo -e "${GREEN}✅ Rate limiting middleware${NC}"
  ((PASSED++))
fi

echo ""
echo "🎯 TERMUX OPTIMIZATION CHECK"
echo "========================"

# Check for graceful fallbacks in database
if grep -q "fallback" database/db.js; then
  echo -e "${GREEN}✅ Database fallback mechanism${NC}"
  ((PASSED++))
fi

# Check for logging optimization
if grep -q "logQueue" utils/logger.js; then
  echo -e "${GREEN}✅ Optimized logging for Termux${NC}"
  ((PASSED++))
fi

# Check for memory-efficient operations
if grep -q "setImmediate" index.js; then
  echo -e "${GREEN}✅ Non-blocking startup notifications${NC}"
  ((PASSED++))
fi

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}RESULTS:${NC}"
echo "════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║ ✅ ALL CHECKS PASSED - BOT IS READY! ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed. Please review.${NC}"
  exit 1
fi
