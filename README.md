# SecureTextEditor

A cross-platform encrypted text editor for Android and Windows devices, featuring strong AES-256-GCM encryption, Google Drive integration, and a mobile-optimized interface.

## Features

- 🔐 **Strong Encryption**: AES-256-GCM with PBKDF2 key derivation
- 📱 **Cross-Platform**: Android and Windows support via Capacitor
- ☁️ **Cloud Storage**: Google Drive integration
- 📑 **Multi-Tab**: Open and edit multiple documents simultaneously
- 💾 **Auto-Save**: Configurable auto-save intervals
- 🎨 **Themes**: Multiple built-in themes (Light, Dark, Solarized, Dracula, Nord)
- 🔍 **Advanced Search**: Search within documents and across all open tabs
- 📲 **Offline Support**: Work without internet, sync when reconnected

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Cross-Platform**: Capacitor 6
- **UI Framework**: Material-UI
- **State Management**: Zustand
- **Encryption**: Web Crypto API
- **Cloud Storage**: Google Drive API v3

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
│   ├── Editor/      # Editor components
│   ├── Menus/       # Menu components
│   └── Dialogs/     # Dialog components
├── services/        # Business logic
│   ├── encryption.service.ts
│   ├── storage.service.ts
│   └── googleDrive.service.ts
├── stores/          # State management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Security

- **No password storage**: Passwords are never saved, only used for key derivation
- **Document-level encryption**: Each document has its own password
- **Strong encryption**: AES-256-GCM with 600,000 PBKDF2 iterations
- **Memory security**: Sensitive data cleared from memory after use

⚠️ **Important**: Lost passwords cannot be recovered. Keep passwords safe externally.

## Documentation

- [Design Specification](SecureTextEditor_Specification.md)
- [Task Checklist](tasks.md)
- [Development Guide](CLAUDE.md)

## License

This is a personal project. For private use only.

## Version

Current Version: **0.1.0** (Development)

---

Built with ❤️ by Pojamma
