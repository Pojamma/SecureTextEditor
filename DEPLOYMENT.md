# SecureTextEditor - Deployment Guide

This guide explains how to build and deploy SecureTextEditor for Android and Windows platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Android Deployment](#android-deployment)
3. [Build Scripts](#build-scripts)
4. [Version Management](#version-management)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Java JDK** (v17 or higher) - for Android builds
- **Android SDK** - for Android builds
- **Git** - for version control

### Development Tools

- **Android Studio** (optional, for advanced Android debugging)
- **ADB (Android Debug Bridge)** - for device installation

### Environment Setup

Ensure these environment variables are set:
```bash
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## Android Deployment

### Quick Build (Using Build Script)

The fastest way to build an APK:

```bash
./build-android.sh
```

This script will:
1. Build the web application (`npm run build`)
2. Sync with Capacitor (`npx cap sync android`)
3. Build the Android APK (`./gradlew assembleDebug`)
4. Copy APK with timestamp to project root

**Output**: `SecureTextEditor_v0.1.0_YYYYMMDD_HHMMSS.apk`

### Manual Build Process

If you prefer to build manually:

#### Step 1: Build Web App
```bash
npm install  # First time only
npm run build
```

#### Step 2: Sync Capacitor
```bash
npx cap sync android
```

#### Step 3: Build APK
```bash
cd android
./gradlew assembleDebug
```

**Output Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Step 4: Copy APK (Optional)
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk SecureTextEditor_$(date +%Y%m%d).apk
```

### Installing on Android Device

#### Via USB (ADB)
```bash
# Enable USB debugging on your Android device first
adb install SecureTextEditor_v0.1.0_YYYYMMDD_HHMMSS.apk
```

#### Via File Transfer
1. Copy APK to device (USB, cloud, email, etc.)
2. Open file on device
3. Allow installation from unknown sources if prompted
4. Tap "Install"

### Release Build (Production)

For production releases:

```bash
cd android
./gradlew assembleRelease
```

**Note**: Release builds require signing configuration in `android/app/build.gradle`

---

## Build Scripts

### `build-android.sh`

**Purpose**: Automated Android APK build with versioning

**Features**:
- Full build pipeline automation
- Timestamped APK filenames
- Version number from package.json
- Colored output and progress indicators
- Error handling and validation

**Usage**:
```bash
./build-android.sh
```

**Example Output**:
```
🚀 SecureTextEditor - Android Build Script
==========================================

📦 Step 1/4: Building web application...
✅ Web build complete

📱 Step 2/4: Syncing with Capacitor...
✅ Capacitor sync complete

🔨 Step 3/4: Building Android APK...
✅ Android APK built

📋 Step 4/4: Copying APK...
✅ APK copied successfully!

📦 Build Summary:
  File: SecureTextEditor_v0.1.0_20251222_112803.apk
  Size: 3.9M
  Location: /home/bob/SecureTextEditor/SecureTextEditor_v0.1.0_20251222_112803.apk

🎉 Build complete!
```

---

## Version Management

### Updating Version Number

Version is managed in `package.json`:

```json
{
  "name": "securetexteditor",
  "version": "0.1.0",
  ...
}
```

To update version:
```bash
npm version patch   # 0.1.0 -> 0.1.1
npm version minor   # 0.1.0 -> 0.2.0
npm version major   # 0.1.0 -> 1.0.0
```

### Version in Android

Android version is auto-synced from package.json by Capacitor.

To manually set Android version, edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "0.1.0"
    }
}
```

### Git Tags

Tag releases in Git:
```bash
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

---

## Testing

### Testing Build Quality

Before deploying, verify:

1. **Build succeeds without errors**
   ```bash
   npm run build
   # Should show: "✓ built in X.XXs"
   ```

2. **TypeScript compiles**
   ```bash
   npm run build
   # Should show no TS errors
   ```

3. **APK installs successfully**
   ```bash
   adb install SecureTextEditor_vX.X.X_*.apk
   # Should show: "Success"
   ```

4. **App launches on device**
   - Open app from launcher
   - Verify splash screen appears
   - Check all features work

### Device Testing Matrix

Test on various devices and screen sizes:

| Device Type | Screen Size | Resolution | Status |
|------------|-------------|------------|--------|
| Phone (Small) | <5.5" | 720x1280 | ⏳ |
| Phone (Medium) | 5.5-6.5" | 1080x1920 | ⏳ |
| Phone (Large) | >6.5" | 1440x2960 | ⏳ |
| Tablet (7") | 7" | 800x1280 | ⏳ |
| Tablet (10") | 10" | 1200x1920 | ⏳ |

### Feature Testing Checklist

Before release, test all features:

- [ ] Create/Edit/Save documents
- [ ] Multi-tab functionality
- [ ] Encryption/Decryption
- [ ] Google Drive integration
- [ ] Search functionality (Ctrl+F or search icon)
- [ ] All 6 themes
- [ ] Tools menu (statistics, sort, case conversion, etc.)
- [ ] Insert menu (date/time, special characters)
- [ ] Export menu (text, HTML, share, clipboard)
- [ ] Special characters bar
- [ ] Status bar display
- [ ] Session persistence
- [ ] Keyboard shortcuts (where applicable)

---

## Troubleshooting

### Build Fails

**Error**: `npm run build` fails
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Error**: `gradlew assembleDebug` fails
```bash
# Clean Android build
cd android
./gradlew clean
./gradlew assembleDebug
```

### Capacitor Sync Issues

**Error**: Capacitor sync fails
```bash
# Reinstall Capacitor
npm install @capacitor/cli @capacitor/core @capacitor/android
npx cap sync android
```

### APK Won't Install

**Error**: "App not installed"
- Uninstall old version first
- Check if APK is corrupted (rebuild)
- Enable "Install from Unknown Sources"

**Error**: "Package conflicts with existing package"
```bash
# Uninstall existing app
adb uninstall com.securetexteditor.app
# Then reinstall
adb install SecureTextEditor_*.apk
```

### Runtime Errors

**Error**: App crashes on launch
- Check Android logs: `adb logcat`
- Rebuild with clean build
- Check Capacitor plugins are synced

**Error**: Features not working
- Verify Capacitor sync: `npx cap sync android`
- Check for JavaScript errors in Chrome DevTools
  - Connect device via USB
  - Chrome → `chrome://inspect`
  - Find your app → "Inspect"

---

## Build Configuration

### Current Configuration

**Bundle Size**: ~611 KB (195 KB gzipped)
**APK Size**: ~3.9 MB
**Target SDK**: Android 13+ (API 33)
**Minimum SDK**: Android 7.0 (API 24)

### App Identifiers

- **Package ID**: `com.securetexteditor.app`
- **App Name**: SecureTextEditor
- **Version**: 0.1.0

### Build Variants

- **Debug**: `app-debug.apk` - For testing
- **Release**: `app-release.apk` - For production (requires signing)

---

## Next Steps

1. **Configure App Icons** - Replace default Capacitor icons
2. **Configure Splash Screen** - Custom splash screen
3. **Set up Release Signing** - For Play Store deployment
4. **Optimize Performance** - Code splitting, lazy loading
5. **Create Windows Build** - Electron platform

---

## Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [Gradle Build Documentation](https://developer.android.com/studio/build)

---

**Last Updated**: December 22, 2025
**Author**: Claude Code (Sonnet 4.5)
