# Windows Deployment Guide - SecureTextEditor

Complete guide for building and deploying SecureTextEditor on Windows.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Build Process](#build-process)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Distribution](#distribution)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Check version: `node --version`

2. **npm** (comes with Node.js)
   - Check version: `npm --version`

3. **Git** (for version control)
   - Download: https://git-scm.com/
   - Check version: `git --version`

### Optional (for code signing)

- **Windows SDK** (for signtool.exe)
- **Code Signing Certificate** (for production builds)

---

## 🚀 Quick Start

### One-Command Build

```bash
# Make sure you're in the project root directory
./build-windows.sh
```

This script will:
1. Build the web application
2. Sync with Capacitor Electron
3. Build the Electron TypeScript
4. Create Windows installers

### Build Output

After successful build, you'll find:
- **electron/dist/SecureTextEditor Setup [version].exe** - Full installer
- **electron/dist/SecureTextEditor-Portable-[version].exe** - Portable version

---

## 🔨 Build Process (Manual)

If you prefer to run steps manually:

### Step 1: Build Web Application

```bash
npm run build
```

This creates the production build in `dist/` directory.

### Step 2: Sync with Electron

```bash
npx cap sync @capacitor-community/electron
```

This copies the web build to the Electron platform.

### Step 3: Build Electron App

```bash
cd electron
npm run build
```

This compiles the TypeScript for Electron.

### Step 4: Create Windows Installer

```bash
# From electron directory
npm run electron:make
```

This creates the Windows installers using electron-builder.

---

## ⚙️ Configuration

### electron-builder.config.json

Key configuration options:

```json
{
  "appId": "com.pojamma.securetexteditor",
  "productName": "SecureTextEditor",
  "win": {
    "target": ["nsis", "portable"],
    "icon": "assets/appIcon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### Custom Icons

To use custom icons:

1. **Windows Icon (.ico)**
   - Place your icon at `electron/assets/appIcon.ico`
   - Recommended: Multi-resolution ICO (16x16, 32x32, 48x48, 256x256)
   - Tool: ImageMagick or online converter

2. **Convert PNG to ICO**:
   ```bash
   # Using ImageMagick
   convert icon.png -resize 256x256 appIcon.ico
   ```

---

## 🧪 Testing

### Test in Development Mode

```bash
cd electron
npm run electron:start
```

This opens the app in development mode with debugging enabled.

### Test the Installer

1. Locate the installer in `electron/dist/`
2. Run the installer on a Windows machine
3. Verify:
   - Application installs correctly
   - Desktop shortcut created
   - Start menu entry created
   - App launches successfully
   - All features work (encryption, file operations, etc.)

### Testing Checklist

- [ ] Application launches without errors
- [ ] File operations (New, Open, Save, Save As)
- [ ] Encryption/Decryption works
- [ ] Multi-tab functionality
- [ ] Keyboard shortcuts (Ctrl+N, Ctrl+S, etc.)
- [ ] Themes switch correctly
- [ ] Search functionality (Ctrl+F, Ctrl+Shift+F)
- [ ] Special characters and tools
- [ ] Export functions
- [ ] Session persistence (close and reopen)
- [ ] Window state preservation (size, position)
- [ ] Uninstaller works correctly

---

## 📦 Distribution

### Installer Types

1. **NSIS Installer** (`SecureTextEditor Setup [version].exe`)
   - Traditional Windows installer
   - Allows custom installation directory
   - Creates uninstaller
   - Adds to Programs & Features

2. **Portable Version** (`SecureTextEditor-Portable-[version].exe`)
   - No installation required
   - Can run from USB drive
   - All data stored in app directory

### Version Numbering

Update version in:
- `package.json` (root)
- `electron/package.json`

```json
{
  "version": "0.1.0"
}
```

### Distribution Channels

**Option 1: Direct Download**
- Host installers on your own server
- Users download and install manually

**Option 2: GitHub Releases**
- Upload installers to GitHub Releases
- Users download from GitHub

**Option 3: Auto-Update**
- Configure electron-updater
- Automatic updates for users
- Requires hosting update server

---

## 🔐 Code Signing (Production)

For production releases, code signing is **highly recommended**:

### Why Code Sign?

- Windows SmartScreen won't warn users
- Proves authenticity of the software
- Required for some enterprise deployments

### Getting a Certificate

1. Purchase code signing certificate
   - Providers: DigiCert, Sectigo, GlobalSign
   - Cost: ~$100-$400/year

2. Or use self-signed (testing only)
   ```powershell
   New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Pojamma"
   ```

### Configure Code Signing

Update `electron-builder.config.json`:

```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password",
    "sign": "./sign.js"
  }
}
```

**⚠️ Never commit certificates or passwords to Git!**

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

```bash
cd electron
npm run build
# Check error messages
```

Fix TypeScript errors in `electron/src/` directory.

### Missing Dependencies

```bash
# In root directory
npm install

# In electron directory
cd electron
npm install
```

### Electron App Won't Start

1. Check `electron/build/src/index.js` exists
2. Try rebuilding:
   ```bash
   cd electron
   npm run build
   npm run electron:start
   ```

### Icons Not Showing

1. Verify `electron/assets/appIcon.ico` exists
2. ICO should be multi-resolution
3. Rebuild after changing icons

### Installer Build Fails

Check:
- Disk space available
- Permissions on `electron/dist/` directory
- electron-builder version compatibility

### App Crashes on Startup

1. Check console logs in DevTools
2. Test in development mode first:
   ```bash
   cd electron
   npm run electron:start
   ```
3. Check for missing Capacitor plugins

---

## 📝 Build Scripts Reference

### Root Directory Scripts

```bash
npm run build          # Build web app
npm run dev            # Dev server
```

### Electron Directory Scripts

```bash
npm run build                 # Build TypeScript
npm run electron:start        # Run in dev mode
npm run electron:start-live   # Run with hot reload
npm run electron:pack         # Create unpacked build
npm run electron:make         # Create installers
```

---

## 🎯 Production Build Checklist

Before creating production builds:

- [ ] Update version number
- [ ] Test all features thoroughly
- [ ] Update changelog/release notes
- [ ] Remove debug code/console.logs
- [ ] Test on clean Windows installation
- [ ] Verify file paths are correct
- [ ] Test both installer and portable versions
- [ ] Scan executables with antivirus
- [ ] Code sign executables (if available)
- [ ] Create GitHub release
- [ ] Update documentation

---

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Capacitor Electron Documentation](https://github.com/capacitor-community/electron)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Create a new issue with:
   - Operating system version
   - Node.js version
   - Complete error message
   - Steps to reproduce

---

**Last Updated**: December 2024
**Version**: 0.1.0
**Status**: Development
