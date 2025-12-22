#!/bin/bash

# SecureTextEditor - Icon Generation Script
# This script creates app icons in all required Android sizes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$SCRIPT_DIR/icons"
ANDROID_RES="$SCRIPT_DIR/../android/app/src/main/res"

echo "🎨 SecureTextEditor - Icon Generation"
echo "======================================"
echo ""

# Create a base icon (1024x1024) using ImageMagick
echo "📐 Creating base icon (1024x1024)..."

# Create a document with lock icon
# Background: Blue-gray gradient representing security
# Icon: Document with lock symbol

convert -size 1024x1024 \
  -define gradient:angle=135 \
  gradient:'#1e3a8a-#3b82f6' \
  -fill white \
  -draw "roundrectangle 256,200 768,824 40,40" \
  -fill '#1e3a8a' \
  -draw "rectangle 256,200 768,300" \
  -fill white \
  -pointsize 80 \
  -gravity north \
  -annotate +0+220 "SECURE" \
  -fill '#e5e7eb' \
  -draw "line 320,380 704,380" \
  -draw "line 320,460 704,460" \
  -draw "line 320,540 704,540" \
  -draw "line 320,620 704,620" \
  -draw "line 320,700 704,700" \
  -fill '#fbbf24' \
  -draw "roundrectangle 400,650 624,850 20,20" \
  -fill '#92400e' \
  -draw "arc 456,650 568,725 0,180" \
  -stroke '#92400e' \
  -strokewidth 16 \
  -draw "line 480,675 544,675" \
  -fill '#92400e' \
  -draw "circle 512,775 512,740" \
  "$ICONS_DIR/icon-1024.png"

echo "✅ Base icon created"

# Generate all required Android icon sizes
echo ""
echo "📱 Generating Android icon sizes..."

# Function to create resized icon
create_icon() {
  local size=$1
  local dir=$2
  convert "$ICONS_DIR/icon-1024.png" -resize ${size}x${size} "$ANDROID_RES/$dir/ic_launcher.png"
  convert "$ICONS_DIR/icon-1024.png" -resize ${size}x${size} "$ANDROID_RES/$dir/ic_launcher_round.png"
  convert "$ICONS_DIR/icon-1024.png" -resize ${size}x${size} "$ANDROID_RES/$dir/ic_launcher_foreground.png"
  echo "  ✓ $dir ($size x $size)"
}

# Create icons for all density buckets
create_icon 48 mipmap-mdpi
create_icon 72 mipmap-hdpi
create_icon 96 mipmap-xhdpi
create_icon 144 mipmap-xxhdpi
create_icon 192 mipmap-xxxhdpi

echo ""
echo "✅ All Android icons generated successfully!"
echo ""
echo "📂 Icons saved to:"
echo "   $ANDROID_RES/mipmap-*/"
echo ""
