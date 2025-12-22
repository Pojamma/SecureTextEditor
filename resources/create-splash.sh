#!/bin/bash

# SecureTextEditor - Splash Screen Generation Script
# This script creates splash screens for all Android orientations and densities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPLASH_DIR="$SCRIPT_DIR/splash"
ANDROID_RES="$SCRIPT_DIR/../android/app/src/main/res"

echo "🎨 SecureTextEditor - Splash Screen Generation"
echo "=============================================="
echo ""

# Create base splash screen (2732x2732 - largest needed size)
echo "📐 Creating base splash screen..."

convert -size 2732x2732 \
  -define gradient:angle=135 \
  gradient:'#1e3a8a-#3b82f6' \
  -fill white \
  -font "DejaVu-Sans-Bold" \
  -pointsize 200 \
  -gravity center \
  -annotate +0-300 "SecureTextEditor" \
  -pointsize 80 \
  -annotate +0-50 "Encrypted. Private. Secure." \
  -fill '#fbbf24' \
  -draw "roundrectangle 1066,1216 1666,1616 40,40" \
  -fill '#92400e' \
  -draw "arc 1266,1216 1466,1366 0,180" \
  -stroke '#92400e' \
  -strokewidth 32 \
  -draw "line 1300,1266 1432,1266" \
  -fill '#92400e' \
  -draw "circle 1366,1466 1366,1400" \
  "$SPLASH_DIR/splash-base.png"

echo "✅ Base splash screen created"

# Function to create splash screen for specific size
create_splash() {
  local width=$1
  local height=$2
  local dir=$3
  convert "$SPLASH_DIR/splash-base.png" \
    -resize ${width}x${height}^ \
    -gravity center \
    -extent ${width}x${height} \
    "$ANDROID_RES/$dir/splash.png"
  echo "  ✓ $dir (${width}x${height})"
}

echo ""
echo "📱 Generating portrait splash screens..."

# Portrait splash screens
create_splash 320 480 drawable-port-mdpi
create_splash 480 800 drawable-port-hdpi
create_splash 720 1280 drawable-port-xhdpi
create_splash 960 1600 drawable-port-xxhdpi
create_splash 1280 1920 drawable-port-xxxhdpi

echo ""
echo "📱 Generating landscape splash screens..."

# Landscape splash screens
create_splash 480 320 drawable-land-mdpi
create_splash 800 480 drawable-land-hdpi
create_splash 1280 720 drawable-land-xhdpi
create_splash 1600 960 drawable-land-xxhdpi
create_splash 1920 1280 drawable-land-xxxhdpi

echo ""
echo "📱 Generating default splash screen..."

# Default splash (used as fallback)
create_splash 1280 1280 drawable

echo ""
echo "✅ All splash screens generated successfully!"
echo ""
echo "📂 Splash screens saved to:"
echo "   $ANDROID_RES/drawable*/"
echo ""
