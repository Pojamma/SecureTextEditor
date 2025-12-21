# Building SecureTextEditor for Android

This guide explains how to build an APK for testing on your Android phone.

## Prerequisites

### Required:
1. **Node.js and npm** (already installed ✓)
2. **Android Studio** OR **Android SDK Command Line Tools**

### Installing Android Studio (Recommended):
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Go to: Tools → SDK Manager
4. Install at least one Android SDK (API 33 or higher recommended)
5. Note the Android SDK location (usually `~/Android/Sdk`)

### Setting up ANDROID_HOME (Linux/Mac):
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

## Method 1: Automated Build Script (Easiest)

Simply run the build script:

```bash
./build-android.sh
```

This script will:
1. ✅ Build the web application
2. ✅ Add Android platform (if needed)
3. ✅ Sync assets to Android
4. ✅ Build the APK using Gradle
5. ✅ Optionally install on connected device

The APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 2: Manual Steps

If the script doesn't work, follow these steps manually:

### Step 1: Build the web app
```bash
npm run build
```

### Step 2: Add Android platform (first time only)
```bash
npx cap add android
```

### Step 3: Sync web assets
```bash
npx cap sync android
```

### Step 4: Build APK using Android Studio
```bash
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Go to: Build → Build Bundle(s) / APK(s) → Build APK(s)
3. Wait for build to complete
4. Click "locate" in the notification to find the APK

### Step 5: Alternative - Build with Gradle CLI
```bash
cd android
./gradlew assembleDebug
cd ..
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Installing APK on Your Phone

### Method A: Via USB (ADB)

1. **Enable Developer Options** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect phone via USB**

3. **Install using ADB**:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method B: Manual Installation

1. **Copy APK to your phone** (via USB, email, cloud storage, etc.)

2. **On your phone**:
   - Open the APK file with a file manager
   - Tap "Install"
   - If prompted, allow installation from unknown sources
   - Tap "Install" again

## Troubleshooting

### "ANDROID_HOME not set"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### "gradlew: Permission denied"
```bash
chmod +x android/gradlew
```

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/home/YOUR_USERNAME/Android/Sdk
```

### Build fails with "Could not find..."
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### "Device not found" when using adb
```bash
# Check if device is connected
adb devices

# If no devices, check USB debugging is enabled
# Try a different USB cable or port
```

## Building Signed APK for Release

For production release (not needed for testing):

1. Generate signing key:
   ```bash
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```

2. Update `android/app/build.gradle` with signing config

3. Build release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Quick Commands Reference

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK via script
./build-android.sh

# Install on connected device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Check connected devices
adb devices

# View app logs
adb logcat | grep SecureTextEditor
```

## Testing Checklist

After installing on your phone, test:

- [ ] App opens without crashing
- [ ] Can create new documents (Ctrl+N or + button)
- [ ] Can type and edit text
- [ ] Can switch between tabs
- [ ] Tabs persist when closing/reopening app
- [ ] Theme switching works
- [ ] Font size adjustment works
- [ ] Menu opens and closes
- [ ] Status bar shows correct information
- [ ] No console errors (use `adb logcat`)

## Additional Resources

- Capacitor Android Docs: https://capacitorjs.com/docs/android
- Android Developer Guide: https://developer.android.com/guide
- Capacitor CLI Docs: https://capacitorjs.com/docs/cli

---

**Happy Testing! 📱**
