#!/usr/bin/env bash
set -euo pipefail

# Auto check and (safe) fix script for Rich bot
# Usage: bash scripts/auto_fix_and_check.sh
# This script will:
#  - Ensure repo is synced with origin/main (hard reset)
#  - Install dependencies (with legacy-peer-deps fallback)
#  - Attempt to resolve known dependency issues
#  - Run quick syntax require checks on core handlers and all .js files
#  - Run project's verification script `./test_features.sh`
#  - Report results and guidance

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

echo -e "${YELLOW}Auto check & fix script for Rich${NC}"
WORKDIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKDIR"

# Ensure we are in a git repo and have origin
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "${RED}Not a git repository. Please run this inside the project folder.${NC}"
  exit 1
fi

# Fetch and reset to origin/main to ensure we have latest fixes
echo -e "${YELLOW}Syncing with origin/main (this will discard local changes)...${NC}"
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git fetch origin main
  git reset --hard origin/main
else
  echo -e "${YELLOW}No origin/main found; skipping hard reset (you may be offline).${NC}"
fi

# Install deps with fallback
echo -e "${YELLOW}Installing dependencies...${NC}"
if npm ci --no-audit --no-fund; then
  echo -e "${GREEN}Dependencies installed via npm ci${NC}"
else
  echo -e "${YELLOW}npm ci failed; trying npm install --legacy-peer-deps${NC}"
  npm install --legacy-peer-deps --no-audit --no-fund
fi

# Known dependency fixes: remove telegraf-i18n if present (we use local middleware)
if jq -e '.dependencies["telegraf-i18n"]' package.json >/dev/null 2>&1; then
  echo -e "${YELLOW}Removing telegraf-i18n from package.json to avoid peer conflicts...${NC}"
  tmpfile=$(mktemp)
  jq 'del(.dependencies["telegraf-i18n"])' package.json > "$tmpfile" && mv "$tmpfile" package.json
  npm install --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund
  git add package.json package-lock.json || true
  git commit -m "chore(auto-fix): remove telegraf-i18n to avoid peer dependency conflicts" || true
fi

# Run require checks for all .js files except node_modules
echo -e "${YELLOW}Running syntax require checks for all .js files (this may show errors)${NC}"
ERRORS=0
LOGFILE="$(pwd)/.auto_check_errors.log"
echo "Auto check run at $(date)" > "$LOGFILE"

# Function to require a file safely
require_file() {
  local file="$1"
  # Skip binary-like files
  if [[ "$file" == *node_modules/* ]]; then
    return 0
  fi
  # Use node to require file and capture stderr
  if ! node -e "try{ require('./${file}'); }catch(e){ console.error('ERR_REQUIRE:', e.stack||e); process.exit(2); }" 2>>"$LOGFILE"; then
    echo -e "${RED}Syntax/runtime error while requiring: ${file}${NC} (see $LOGFILE)"
    ((ERRORS++))
  fi
}

# Export IFS-safe find
mapfile -t FILES < <(find . -type f -name '*.js' -not -path './node_modules/*' -not -path './.git/*')
for f in "${FILES[@]}"; do
  # Trim leading ./
  f_clean="${f#./}"
  require_file "$f_clean"
done

# Run core handler quick checks separately too
for core in handlers/commandHandler.js handlers/callbackHandler.js handlers/adminHandler.js; do
  if [ -f "$core" ]; then
    echo -e "${YELLOW}Checking $core${NC}"
    require_file "$core"
  fi
done

# Run verification script if present
if [ -x "./test_features.sh" ]; then
  echo -e "${YELLOW}Running test_features.sh${NC}"
  if ./test_features.sh >> "$LOGFILE" 2>&1; then
    echo -e "${GREEN}Verification script passed${NC}"
  else
    echo -e "${RED}Verification script reported failures (see $LOGFILE)${NC}"
    ((ERRORS++))
  fi
else
  echo -e "${YELLOW}No test_features.sh found or not executable — skipping verification${NC}"
fi

# Final report
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}Auto-check completed: no syntax errors detected.${NC}"
  echo "SUCCESS: no errors" >> "$LOGFILE"
  exit 0
else
  echo -e "${RED}Auto-check completed: $ERRORS files failed to require or verification failed.${NC}"
  echo "ERRORS: $ERRORS" >> "$LOGFILE"
  echo -e "See $LOGFILE for details. You can open the log and fix the first error reported." 
  exit 2
fi
