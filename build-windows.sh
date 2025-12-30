#!/bin/bash

# SecureTextEditor - Windows Build Script
# Builds the Electron app for Windows and deploys to C:\SecureTextEditor

set -e  # Exit on error

echo "🪟 Building SecureTextEditor for Windows..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WINDOWS_DEPLOY_PATH="/mnt/c/SecureTextEditor"

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

# Step 5: Update app.asar in existing win-unpacked
echo -e "${BLUE}Step 4: Updating Windows app package...${NC}"

# Check if win-unpacked exists
if [ ! -d "dist/win-unpacked" ]; then
    echo -e "${RED}❌ Error: dist/win-unpacked not found!${NC}"
    echo "Please run a full build first to create the initial Windows package."
    echo "Or extract SecureTextEditor-Windows.tar.gz to electron/dist/"
    exit 1
fi

# Navigate to resources directory
cd dist/win-unpacked/resources

# Backup existing app.asar
if [ -f "app.asar" ]; then
    echo "  → Backing up existing app.asar..."
    mv app.asar app.asar.backup
fi

# Extract, update, and repackage
echo "  → Extracting app.asar..."
npx asar extract app.asar.backup app-extracted 2>/dev/null || echo "  → Creating fresh app package..."

echo "  → Copying updated web app..."
cp -r ../../../app/* app-extracted/app/

echo "  → Copying updated Electron build..."
cp -r ../../../build/* app-extracted/build/

echo "  → Repacking app.asar..."
npx asar pack app-extracted app.asar

echo "  → Cleaning up temporary files..."
rm -rf app-extracted app.asar.backup

# Step 6: Deploy to Windows
echo -e "${BLUE}Step 5: Deploying to Windows (C:\\SecureTextEditor)...${NC}"

# Check if the app is running
if tasklist.exe 2>/dev/null | grep -q "SecureTextEditor.exe"; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: SecureTextEditor.exe is currently running!${NC}"
    echo -e "${YELLOW}   Please close the app before continuing.${NC}"
    echo ""
    read -p "Press Enter after closing the app, or Ctrl+C to cancel..."
fi

# Create deployment directory if it doesn't exist
if [ ! -d "$WINDOWS_DEPLOY_PATH" ]; then
    echo "  → Creating deployment directory..."
    mkdir -p "$WINDOWS_DEPLOY_PATH"
fi

# Copy entire win-unpacked directory
echo "  → Copying files to C:\\SecureTextEditor..."
cp -r ../../../dist/win-unpacked/* "$WINDOWS_DEPLOY_PATH/"

# Back to root
cd ../../..

echo ""
echo -e "${GREEN}✅ Windows build complete and deployed!${NC}"
echo ""
echo "Deployment location:"
echo -e "  📁 ${GREEN}C:\\SecureTextEditor\\${NC}"
echo ""
echo "To run the app on Windows:"
echo -e "  ${YELLOW}C:\\SecureTextEditor\\SecureTextEditor.exe${NC}"
echo ""
echo "Or double-click SecureTextEditor.exe from File Explorer"
echo ""
