# SecureTextEditor

A cross-platform encrypted text editor for Android and Windows devices, featuring strong AES-256-GCM encryption, Google Drive integration, and a mobile-optimized interface.

## Features

- 🔐 **Strong Encryption**: AES-256-GCM with PBKDF2 key derivation
- 📱 **Cross-Platform**: Android and Windows support via Capacitor
- 📂 **External File Access**: Open and edit files from anywhere on your device (NEW!)
  - Native file picker integration (Android SAF, Windows Explorer)
  - Save directly back to original location
  - Works with Documents, Downloads, SD card, and any accessible folder
  - Session persistence across app restarts
- ☁️ **Cloud Storage**: Google Drive integration
- 📑 **Multi-Tab**: Open and edit multiple documents simultaneously
- 💾 **Auto-Save**: Configurable auto-save intervals
- 🎨 **Themes**: Multiple built-in themes (Light, Dark, Solarized, Dracula, Nord)
- 🔍 **Advanced Search**: Built-in search with highlighting, regex support, and case-sensitive matching (Ctrl+F)
- 📲 **Offline Support**: Work without internet, sync when reconnected

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Cross-Platform**: Capacitor 6
- **Editor**: CodeMirror 6 (professional code/text editor with built-in search)
- **State Management**: Zustand
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Cloud Storage**: Google Drive API v3
- **File Picker**: @capawesome/capacitor-file-picker (native integration)
- **Custom Plugins**: FileWriter plugin for Android URI writes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- For Android: Android Studio
- For Windows: Electron build tools

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Platform Setup

#### Android

```bash
# Add Android platform
npm run cap:add:android

# Sync web code to native platform
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

#### Windows (Electron)

```bash
# Add Electron platform
npm run cap:add:electron

# Sync and build
npm run cap:sync
```

## Development

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── components/       # React components
│   ├── CodeMirrorEditor.tsx  # CodeMirror 6 editor wrapper
│   ├── EditorTabs.tsx        # Multi-tab management
│   ├── Menus/                # Menu components
│   └── Dialogs/              # Dialog components
├── services/        # Business logic
│   ├── encryption.service.ts
│   ├── filesystem.service.ts
│   ├── externalFilesystem.service.ts  # External file operations
│   ├── session.service.ts
│   └── googleDrive.service.ts
├── plugins/         # Custom Capacitor plugins
│   ├── fileWriter.ts         # Native file writer interface
│   └── fileWriter.web.ts     # Web implementation
├── stores/          # State management (Zustand)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

android/
└── app/src/main/java/...
    └── FileWriterPlugin.java  # Android native plugin
```

## Security

- **No password storage**: Passwords are never saved, only used for key derivation
- **Document-level encryption**: Each document has its own password
- **Strong encryption**: AES-256-GCM with 600,000 PBKDF2 iterations
- **Memory security**: Sensitive data cleared from memory after use

⚠️ **CRITICAL WARNINGS**:
- **Lost passwords CANNOT be recovered** - encrypted data will be permanently inaccessible
- **This is NOT professionally audited security software** - use at your own risk
- **Always maintain backups** - the developers are not responsible for data loss
- **Read the [DISCLAIMER](DISCLAIMER.md)** before using this software

## Important Legal Notices

### Disclaimer

**THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.** By using SecureTextEditor, you acknowledge and agree that:

- You use this software entirely at your own risk
- The developers are NOT liable for any data loss, damages, or security issues
- You are solely responsible for backing up your data
- Lost passwords result in permanent data loss
- This software has not been professionally security audited

**See [DISCLAIMER.md](DISCLAIMER.md) for complete terms.**

### No Support Guarantee

This is a personal project with no guaranteed support, updates, or maintenance. Use at your own risk.

## Documentation

- [Design Specification](SecureTextEditor_Specification.md)
- [Task Checklist](tasks.md)
- [Development Guide](CLAUDE.md)
- [**DISCLAIMER - READ BEFORE USE**](DISCLAIMER.md)

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Key Points:**
- Free to use, modify, and distribute
- Provided "AS IS" without warranty
- No liability for damages or data loss
- Must include license and copyright notice in distributions

## Recent Updates

### v0.2.0 (December 2025) - External File System Access
- ✨ Added native file picker integration for opening files from anywhere
- ✨ Implemented direct save-back to original file locations
- ✨ Session persistence for external files with URI validation
- 🔧 Created custom FileWriter plugin for Android content:// URI writes
- 📱 Full Android SAF (Storage Access Framework) support
- 💻 Windows file:// path support

### v0.1.0 (Initial Development)
- 🎉 Initial release with core features
- Multi-tab editing, encryption, Google Drive integration

## Version

Current Version: **0.2.0** (Development)

---

Built with ❤️ by Pojamma
