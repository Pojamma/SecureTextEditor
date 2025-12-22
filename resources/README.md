# SecureTextEditor - App Resources

This directory contains scripts and assets for generating app icons and splash screens.

## Contents

- **create-icons.sh** - Generates app icons for all Android densities
- **create-splash.sh** - Generates splash screens for all Android sizes/orientations
- **icons/** - Contains generated base icons
- **splash/** - Contains generated base splash screens

## Icon Design

The app icon features:
- **Background**: Blue gradient (#1e3a8a to #3b82f6) representing security and trust
- **Document**: White rounded rectangle representing text editing
- **Lock**: Gold lock symbol (#fbbf24) representing encryption and security
- **Header**: "SECURE" text in blue emphasizing security focus
- **Text Lines**: Light gray lines representing document content

### Icon Sizes

Icons are generated in all required Android densities:
- **mdpi**: 48x48 px
- **hdpi**: 72x72 px
- **xhdpi**: 96x96 px
- **xxhdpi**: 144x144 px
- **xxxhdpi**: 192x192 px

Each density includes:
- `ic_launcher.png` - Standard square icon
- `ic_launcher_round.png` - Rounded icon
- `ic_launcher_foreground.png` - Foreground layer for adaptive icons

## Splash Screen Design

The splash screen features:
- **Background**: Blue gradient matching app theme (#1e3a8a to #3b82f6)
- **App Name**: "SecureTextEditor" in large white text
- **Tagline**: "Encrypted. Private. Secure." in smaller text
- **Lock Icon**: Gold lock symbol matching app icon
- **Full Screen**: Immersive design covering entire screen

### Splash Screen Sizes

Generated for all Android orientations and densities:

**Portrait:**
- mdpi: 320x480
- hdpi: 480x800
- xhdpi: 720x1280
- xxhdpi: 960x1600
- xxxhdpi: 1280x1920

**Landscape:**
- mdpi: 480x320
- hdpi: 800x480
- xhdpi: 1280x720
- xxhdpi: 1600x960
- xxxhdpi: 1920x1280

**Default:**
- 1280x1280 (fallback)

## Regenerating Assets

If you need to update the icons or splash screens:

### Update Icons
```bash
./create-icons.sh
```

### Update Splash Screens
```bash
./create-splash.sh
```

### Rebuild App
After regenerating assets:
```bash
# From project root
./build-android.sh
```

## Configuration

Splash screen behavior is configured in `capacitor.config.ts`:
- **Duration**: 2000ms (2 seconds)
- **Background Color**: #1e3a8a (dark blue)
- **Scale Type**: CENTER_CROP
- **Full Screen**: Yes (immersive)
- **Spinner**: Hidden

## Customization

To customize the icons or splash screen:

1. Edit the ImageMagick commands in the respective script files
2. Run the generation script
3. Rebuild the app with `./build-android.sh`
4. Install on device to test

### Color Scheme

The current color scheme matches the app's blue security theme:
- **Primary Dark**: #1e3a8a
- **Primary**: #3b82f6
- **Accent**: #fbbf24 (gold)
- **Text**: #ffffff (white)

## Requirements

- **ImageMagick**: Required for image generation
  - Install: `sudo apt-get install imagemagick` (Ubuntu/Debian)
  - Or: `brew install imagemagick` (macOS)

## File Locations

Generated assets are placed in:
```
android/app/src/main/res/
├── mipmap-mdpi/
├── mipmap-hdpi/
├── mipmap-xhdpi/
├── mipmap-xxhdpi/
├── mipmap-xxxhdpi/
├── drawable/
├── drawable-land-*/
└── drawable-port-*/
```

## Notes

- Icons are automatically used by Android based on device density
- Splash screens are automatically selected based on orientation and density
- The build process (`build-android.sh`) includes these assets in the APK
- No manual copying needed - scripts update files directly in Android project

---

**Last Updated**: December 22, 2025
**Author**: Claude Code (Sonnet 4.5)
