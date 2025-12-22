#!/bin/bash

# SecureTextEditor - Windows Build Script
# Builds the Electron app for Windows

set -e  # Exit on error

echo "🪟 Building SecureTextEditor for Windows..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the web app
echo -e "${BLUE}Step 1: Building web application...${NC}"
npm run build

# Step 2: Sync with Capacitor
echo -e "${BLUE}Step 2: Syncing with Capacitor Electron...${NC}"
npx cap sync @capacitor-community/electron

# Step 3: Navigate to electron directory
cd electron

# Step 4: Build TypeScript
echo -e "${BLUE}Step 3: Building Electron TypeScript...${NC}"
npm run build

# Step 5: Create Windows installer
echo -e "${BLUE}Step 4: Creating Windows installer (NSIS)...${NC}"
npm run electron:make

# Step 6: Back to root
cd ..

echo ""
echo -e "${GREEN}✅ Windows build complete!${NC}"
echo ""
echo "Build artifacts location:"
echo "  📦 electron/dist/"
echo ""
echo "Output files:"
echo "  - SecureTextEditor Setup [version].exe (Installer)"
echo "  - SecureTextEditor-Portable-[version].exe (Portable)"
echo ""
echo -e "${YELLOW}Note: For production builds, you may want to code-sign the executables.${NC}"
