#!/bin/bash

# SecureTextEditor - Android APK Build Script
# This script builds the web app and generates an APK for Android

set -e  # Exit on error

echo "========================================="
echo "SecureTextEditor - Android Build Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
print_info "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed ($(node --version))"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm is installed ($(npm --version))"

echo ""
print_info "Step 1: Building web application..."
echo "Running: npm run build"
npm run build

if [ $? -eq 0 ]; then
    print_success "Web application built successfully"
else
    print_error "Web build failed"
    exit 1
fi

echo ""
print_info "Step 2: Checking Android platform..."

# Check if android directory exists
if [ ! -d "android" ]; then
    print_warning "Android platform not found. Adding Android platform..."
    echo "Running: npx cap add android"
    npx cap add android

    if [ $? -eq 0 ]; then
        print_success "Android platform added successfully"
    else
        print_error "Failed to add Android platform"
        exit 1
    fi
else
    print_success "Android platform already exists"
fi

echo ""
print_info "Step 3: Syncing web assets to Android..."
echo "Running: npx cap sync android"
npx cap sync android

if [ $? -eq 0 ]; then
    print_success "Assets synced successfully"
else
    print_error "Sync failed"
    exit 1
fi

echo ""
print_info "Step 4: Building Android APK..."

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME is not set. Attempting to find Android SDK..."

    # Common Android SDK locations
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        print_success "Found Android SDK at: $ANDROID_HOME"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        print_success "Found Android SDK at: $ANDROID_HOME"
    else
        print_error "Android SDK not found. Please install Android Studio or set ANDROID_HOME"
        print_info "You can still build manually using Android Studio:"
        print_info "  npx cap open android"
        exit 1
    fi
fi

# Set PATH to include Android SDK tools
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

# Navigate to Android directory
cd android

print_info "Building debug APK with Gradle..."
echo "Running: ./gradlew assembleDebug"

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    print_error "gradlew not found in android directory"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Build the APK
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    cd ..
    print_success "APK built successfully!"

    echo ""
    echo "========================================="
    echo -e "${GREEN}Build Complete!${NC}"
    echo "========================================="
    echo ""

    # Find the APK file
    APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" | head -n 1)

    if [ -n "$APK_PATH" ]; then
        # Copy APK to current directory with timestamp
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        OUTPUT_APK="SecureTextEditor_${TIMESTAMP}.apk"

        print_info "Copying APK to current directory..."
        cp "$APK_PATH" "$OUTPUT_APK"

        if [ $? -eq 0 ]; then
            APK_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)
            print_success "APK copied to: $OUTPUT_APK"
            echo ""
            echo -e "${GREEN}APK Location:${NC} $(pwd)/$OUTPUT_APK"
            echo -e "${GREEN}APK Size:${NC} $APK_SIZE"
            echo ""
            echo "📱 Transfer this APK to your phone via Google Drive and install."
        else
            print_warning "Failed to copy APK to current directory"
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            echo -e "${GREEN}APK Location:${NC} $APK_PATH"
            echo -e "${GREEN}APK Size:${NC} $APK_SIZE"
        fi
    else
        print_warning "APK file not found in expected location"
        print_info "Check: android/app/build/outputs/apk/debug/"
    fi
else
    cd ..
    print_error "APK build failed"
    exit 1
fi

echo ""
print_success "Build script completed successfully!"
