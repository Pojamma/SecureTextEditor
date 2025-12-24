# SecureTextEditor - File Storage & Encryption Guide

## Table of Contents
1. [Overview](#overview)
2. [File Storage Architecture](#file-storage-architecture)
3. [Encryption System](#encryption-system)
4. [User Workflows](#user-workflows)
5. [Platform-Specific Details](#platform-specific-details)
6. [Testing vs Production](#testing-vs-production)

---

## Overview

SecureTextEditor is a cross-platform encrypted text editor that runs on **Android** (mobile/tablet) and **Windows** (desktop). The application handles file storage differently depending on the platform but maintains consistent encryption and security across all platforms.

### Key Design Principles

1. **No Master Password**: Each document has its own password (if encrypted)
2. **Optional Encryption**: Users choose which documents to encrypt
3. **No Password Storage**: Passwords are never saved anywhere
4. **Multiple Storage Sources**: Local filesystem, Google Drive, and temporary session storage
5. **Session Persistence**: Application state is saved to restore open tabs on next launch

---

## File Storage Architecture

### Storage Layers

SecureTextEditor uses a three-layer storage architecture:

```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                    │
│  (React + TypeScript - CodeMirror Editor)           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Service Layer (TypeScript)              │
│  • filesystem.service.ts (Local Files)              │
│  • googleDrive.service.ts (Cloud Files)             │
│  • encryption.service.ts (Encrypt/Decrypt)          │
│  • session.service.ts (Session Persistence)         │
└─────────────────────────────────────────────────────┘
                          ↓
┌──────────────┬──────────────────┬───────────────────┐
│   Android    │    Windows       │   Browser (Web)   │
│              │                  │                   │
│ Capacitor    │   Capacitor      │   Browser APIs    │
│ Filesystem   │   Filesystem     │                   │
│   API        │     API          │                   │
│              │                  │                   │
│ Directory.   │  Directory.      │  Directory.       │
│   Data       │    Data          │  Documents        │
└──────────────┴──────────────────┴───────────────────┘
```

### File Storage Locations

#### Android (Mobile/Tablet)
- **Location**: App's private data directory
- **Path**: `/data/data/com.pojamma.securetexteditor/files/`
- **Capacitor Directory**: `Directory.Data`
- **Permissions**: None required (private app storage)
- **Accessible by**: Only this app
- **Survives**: App updates ✓, App uninstall ✗

#### Windows (Desktop)
- **Location**: User's app data directory
- **Path (Example)**: `C:\Users\[Username]\AppData\Roaming\com.pojamma.securetexteditor\`
- **Capacitor Directory**: `Directory.Data`
- **Permissions**: User-level access only
- **Accessible by**: User and this app
- **Survives**: App updates ✓, App uninstall (depends on installer)

#### Web Browser (Testing/Development)
- **Location**: Browser's virtual filesystem
- **Capacitor Directory**: `Directory.Documents`
- **Permissions**: None required
- **Accessible by**: Only this browser tab/origin
- **Survives**: Browser cache clearing ✗

### File Format and Naming

All files are stored in **JSON format** with UTF-8 encoding:

**Plain Text Documents**:
```json
{
  "content": "This is the actual text content...",
  "metadata": {
    "filename": "mydocument.txt",
    "created": "2025-12-24T10:30:00.000Z",
    "modified": "2025-12-24T14:45:00.000Z"
  }
}
```

**Encrypted Documents**:
```json
{
  "version": 1,
  "encrypted": true,
  "ciphertext": "base64EncodedEncryptedDataWithAuthTag...",
  "salt": "base64EncodedRandomSalt16Bytes...",
  "iv": "base64EncodedRandomIV12Bytes...",
  "metadata": {
    "filename": "secrets.txt",
    "created": "2025-12-24T10:30:00.000Z",
    "modified": "2025-12-24T14:45:00.000Z",
    "encrypted": true,
    "encryptedAt": "2025-12-24T14:45:00.000Z"
  }
}
```

---

## Encryption System

### Cryptographic Algorithm Details

**Primary Encryption**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (strongest AES variant)
- **Mode**: GCM (provides both encryption and authentication)
- **IV (Initialization Vector)**: 96 bits (12 bytes), randomly generated per encryption
- **Authentication Tag**: Built into GCM, prevents tampering
- **Output**: Ciphertext includes embedded authentication tag

**Key Derivation**: PBKDF2-SHA256
- **Algorithm**: Password-Based Key Derivation Function 2
- **Hash Function**: SHA-256
- **Iterations**: 600,000 (OWASP 2023 recommendation)
- **Salt**: 128 bits (16 bytes), unique per document, randomly generated
- **Purpose**: Converts user password into cryptographic key

### Why These Algorithms?

1. **AES-256-GCM**:
   - Industry standard for authenticated encryption
   - Used by US government for classified information
   - Extremely fast on modern hardware (CPU-accelerated)
   - Built into Web Crypto API (no external dependencies)

2. **PBKDF2 with 600,000 iterations**:
   - Makes password cracking extremely expensive
   - 600,000 iterations = recommended minimum by OWASP in 2023
   - Each guess takes ~0.5 seconds, slowing down brute force attacks

3. **Random Salt per Document**:
   - Prevents rainbow table attacks
   - Same password on two documents = different encryption keys
   - Even if one document is compromised, others remain secure

4. **Random IV per Encryption**:
   - Same content encrypted twice = different ciphertext
   - Prevents pattern analysis
   - Critical for GCM mode security

### Encryption Workflow (Technical)

```
┌─────────────────────────────────────────────────────┐
│  1. User enters password in dialog                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. Generate random salt (16 bytes)                 │
│     crypto.getRandomValues(new Uint8Array(16))      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. Derive encryption key from password             │
│     PBKDF2(password, salt, 600000, SHA-256)         │
│     → 256-bit AES key                               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  4. Generate random IV (12 bytes)                   │
│     crypto.getRandomValues(new Uint8Array(12))      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  5. Encrypt document content                        │
│     AES-256-GCM(content, key, iv)                   │
│     → ciphertext + authentication tag               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  6. Encode to Base64 for storage                    │
│     - ciphertext → Base64                           │
│     - salt → Base64                                 │
│     - iv → Base64                                   │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  7. Create JSON document and save to disk           │
│     {encrypted: true, ciphertext, salt, iv, ...}    │
└─────────────────────────────────────────────────────┘
```

### Decryption Workflow (Technical)

```
┌─────────────────────────────────────────────────────┐
│  1. Read encrypted file from disk                   │
│     Parse JSON: {ciphertext, salt, iv, ...}         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. Show password dialog to user                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. User enters password                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  4. Derive same key from password + stored salt     │
│     PBKDF2(password, salt, 600000, SHA-256)         │
│     → 256-bit AES key                               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  5. Decode Base64 values                            │
│     ciphertext, salt, iv → binary data              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  6. Attempt decryption                              │
│     AES-256-GCM-DECRYPT(ciphertext, key, iv)        │
└─────────────────────────────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │  Success?       │
            └─────────────────┘
              ↓             ↓
         YES  │             │  NO
              ↓             ↓
┌─────────────────┐   ┌──────────────────────┐
│ Return plaintext│   │ Show error:          │
│ Display in      │   │ "Wrong password or   │
│ editor          │   │  corrupted file"     │
└─────────────────┘   └──────────────────────┘
```

### Security Features

1. **No Password Storage**:
   - Passwords never saved to disk or localStorage
   - Passwords only exist in memory during encryption/decryption
   - User must re-enter password each time document is opened

2. **Session Security**:
   - When session is saved (for restore on app restart)
   - Encrypted documents have their decrypted content cleared
   - Only document metadata and file path are saved
   - User must re-enter password after app restart

3. **Memory Clearing**:
   - Sensitive data cleared after use (password, keys)
   - JavaScript strings are immutable, but references are removed
   - Garbage collector handles cleanup

4. **Authentication Tag**:
   - GCM mode includes authentication tag
   - Any tampering with ciphertext = decryption fails
   - Prevents bit-flipping attacks

5. **Version Control**:
   - File format includes version number
   - Future-proof for algorithm upgrades
   - App refuses to open files with newer version

---

## User Workflows

### Workflow 1: Creating and Encrypting a New Document

**User Perspective**:

1. User clicks "New Document" button or menu item
2. Empty document opens in new tab labeled "Untitled.txt"
3. User types content: "My secret notes..."
4. User opens hamburger menu → File → "Encrypt Document"
5. Password dialog appears
6. User enters password: "MySecurePassword123!"
7. Password strength indicator shows "Strong"
8. User clicks "Encrypt"
9. Lock icon appears on tab (🔒)
10. User saves document (Ctrl+S or menu)
11. "Save As" dialog appears (first save)
12. User enters filename: "secrets.txt"
13. Document saved to disk as encrypted JSON file

**What Happens Behind the Scenes**:

```javascript
// 1. New document created (documentStore.ts)
{
  id: "doc_abc123",           // Unique ID for this tab
  path: "",                   // No path yet (not saved)
  source: "temp",             // Temporary (in-memory only)
  encrypted: false,           // Not encrypted yet
  content: "My secret notes...",
  modified: true,             // Has unsaved changes
  metadata: {
    filename: "Untitled.txt",
    created: "2025-12-24T10:00:00Z",
    modified: "2025-12-24T10:05:00Z"
  }
}

// 2. User clicks "Encrypt Document"
// - Password dialog component renders
// - User enters password
// - App validates password (minimum 3 characters)

// 3. Encryption flag set (encryption.service.ts NOT called yet!)
{
  ...document,
  encrypted: true  // Document is MARKED as encrypted
}

// 4. User saves (filesystem.service.ts)
async function saveFile(document, password) {
  if (document.encrypted && password) {
    // Call encryption service
    const plainDoc = {
      content: document.content,
      metadata: document.metadata
    };

    const encryptedDoc = await encryptDocument(plainDoc, password);
    // encryptedDoc = {version: 1, encrypted: true, ciphertext: "...", salt: "...", iv: "..."}

    const json = JSON.stringify(encryptedDoc, null, 2);

    // Write to disk via Capacitor
    await Filesystem.writeFile({
      path: "secrets.txt",
      data: json,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  }
}
```

**File on Disk** (Android: `/data/data/.../files/secrets.txt`):
```json
{
  "version": 1,
  "encrypted": true,
  "ciphertext": "A8kj3h2K...base64...",
  "salt": "xK9m2L...base64...",
  "iv": "3jK8n...base64...",
  "metadata": {
    "filename": "secrets.txt",
    "created": "2025-12-24T10:00:00.000Z",
    "modified": "2025-12-24T10:05:00.000Z",
    "encrypted": true,
    "encryptedAt": "2025-12-24T10:05:00.000Z"
  }
}
```

### Workflow 2: Opening an Encrypted Document

**User Perspective**:

1. User opens app
2. User clicks hamburger menu → File → "Open Local File"
3. File picker shows list of available files
4. User selects "secrets.txt"
5. Password dialog appears: "This document is encrypted. Enter password:"
6. User enters password
7. User clicks "Decrypt"
   - **If password correct**: Document content appears in editor
   - **If password wrong**: Error message "Wrong password or corrupted file"
   - User can retry or cancel

**What Happens Behind the Scenes**:

```javascript
// 1. User selects file (filesystem.service.ts)
async function readFile(path: "secrets.txt") {
  // Read file from disk
  const result = await Filesystem.readFile({
    path: "secrets.txt",
    directory: Directory.Data,
    encoding: Encoding.UTF8
  });

  const content = result.data; // JSON string
  const parsedData = JSON.parse(content);

  // Check if encrypted
  if (isEncrypted(parsedData)) {
    // Return special response indicating password needed
    return {
      document: {
        id: "doc_xyz789",
        path: "secrets.txt",
        source: "local",
        encrypted: true,
        content: "",  // Content is EMPTY (not decrypted yet)
        modified: false,
        metadata: parsedData.metadata
      },
      requiresPassword: true,
      encryptedData: parsedData  // Store encrypted data for later
    };
  }
}

// 2. App detects requiresPassword = true
// - Shows password dialog
// - User enters password
// - App calls decryptFile()

async function decryptFile(encryptedData, password, path) {
  // Call encryption service
  const plainDoc = await decryptDocument(encryptedData, password);
  // Inside decryptDocument():
  //   1. Derive key from password + stored salt
  //   2. Decrypt ciphertext using key + stored IV
  //   3. If wrong password → decryption fails (GCM auth tag mismatch)
  //   4. If correct → returns plaintext

  return {
    id: "doc_xyz789",
    path: "secrets.txt",
    source: "local",
    encrypted: true,
    content: plainDoc.content,  // NOW has decrypted content!
    modified: false,
    metadata: plainDoc.metadata
  };
}

// 3. Document added to documentStore
// - Content displayed in CodeMirror editor
// - Lock icon (🔒) shown on tab
```

### Workflow 3: Session Persistence and Restoration

**User Perspective**:

1. User has 3 documents open in tabs:
   - "notes.txt" (plain text, modified)
   - "shopping.txt" (plain text, saved)
   - "secrets.txt" (encrypted, saved)
2. User closes app
3. User reopens app later
4. App restores session:
   - "notes.txt" reopens with unsaved changes intact
   - "shopping.txt" reopens
   - "secrets.txt" tab appears but is EMPTY with message "Enter password to view"
5. User clicks on "secrets.txt" tab
6. Password dialog appears
7. User enters password
8. Content appears

**What Happens Behind the Scenes**:

```javascript
// 1. Before app closes (App.tsx)
window.addEventListener('beforeunload', () => {
  const documents = documentStore.documents;
  const activeDocumentId = documentStore.activeDocumentId;
  const uiState = {
    theme: settingsStore.theme,
    fontSize: settingsStore.fontSize,
    statusBar: settingsStore.statusBarVisible
  };

  SessionService.saveSession({ documents, activeDocumentId, uiState });
});

// 2. Inside SessionService.saveSession() (session.service.ts)
static saveSession(sessionData) {
  // Security: Clear decrypted content from encrypted documents
  const secureDocs = sessionData.documents.map(doc => {
    if (doc.encrypted) {
      return {
        ...doc,
        content: ""  // CLEAR CONTENT! Will require password to restore
      };
    }
    return doc;  // Plain docs keep their content
  });

  const dataToSave = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documents: secureDocs,
    activeDocumentId: sessionData.activeDocumentId,
    uiState: sessionData.uiState
  };

  // Save to browser's localStorage (NOT Capacitor filesystem!)
  localStorage.setItem('securetexteditor_session', JSON.stringify(dataToSave));
}

// 3. On app startup (App.tsx)
useEffect(() => {
  const session = SessionService.loadSession();
  if (session) {
    documentStore.restoreSession(session.documents, session.activeDocumentId);
    settingsStore.setTheme(session.uiState.theme);
    // etc.
  }
}, []);

// 4. Restored documents in memory:
[
  {
    id: "doc_1",
    path: "notes.txt",
    encrypted: false,
    content: "Buy milk\nPay bills",  // Plain content restored!
    modified: true
  },
  {
    id: "doc_2",
    path: "shopping.txt",
    encrypted: false,
    content: "Apples\nBread\nMilk",
    modified: false
  },
  {
    id: "doc_3",
    path: "secrets.txt",
    encrypted: true,
    content: "",  // EMPTY! User must enter password
    modified: false
  }
]
```

### Workflow 4: Removing Encryption from a Document

**User Perspective**:

1. User has encrypted document "secrets.txt" open (already decrypted)
2. User decides to remove encryption
3. User opens menu → File → "Remove Encryption"
4. Confirmation dialog: "Are you sure? This will save the document as plain text."
5. User clicks "Confirm"
6. Lock icon (🔒) disappears from tab
7. User saves document
8. Document is now saved as plain JSON (no longer encrypted)

**What Happens Behind the Scenes**:

```javascript
// 1. User clicks "Remove Encryption"
function removeEncryption(documentId) {
  documentStore.updateDocument(documentId, { encrypted: false });
}

// 2. Document state updated
{
  ...document,
  encrypted: false  // Flag changed
}

// 3. Next save operation (filesystem.service.ts)
async function saveFile(document, password) {
  if (document.encrypted && password) {
    // Encrypt and save
    // ... (not executed)
  } else {
    // Save as plain JSON (THIS path is taken)
    const plainDoc = {
      content: document.content,
      metadata: {
        ...document.metadata,
        modified: formatDate(),
        encrypted: false  // Remove encrypted metadata
      }
    };

    const json = JSON.stringify(plainDoc, null, 2);

    await Filesystem.writeFile({
      path: document.path,
      data: json,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  }
}
```

**File on Disk After**:
```json
{
  "content": "My secret notes...",
  "metadata": {
    "filename": "secrets.txt",
    "created": "2025-12-24T10:00:00.000Z",
    "modified": "2025-12-24T15:30:00.000Z"
  }
}
```

---

## Platform-Specific Details

### Android Implementation

**Framework**: Capacitor (bridges JavaScript to native Android APIs)

**Storage API**: `@capacitor/filesystem`
```typescript
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Writing a file
await Filesystem.writeFile({
  path: 'secrets.txt',
  data: jsonContent,
  directory: Directory.Data,  // App's private directory
  encoding: Encoding.UTF8,
  recursive: true  // Create subdirectories if needed
});

// Reading a file
const result = await Filesystem.readFile({
  path: 'secrets.txt',
  directory: Directory.Data,
  encoding: Encoding.UTF8
});
const content = result.data;
```

**Actual Storage Location**:
- Path: `/data/data/com.pojamma.securetexteditor/files/`
- Example: `/data/data/com.pojamma.securetexteditor/files/secrets.txt`

**Permissions**:
- `Directory.Data` requires NO permissions (private app storage)
- If using `Directory.Documents` or `Directory.ExternalStorage`, need `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions

**Security**:
- Android sandboxing: Other apps cannot access this directory
- Only accessible via root or ADB with user consent
- Survives app updates
- Deleted on app uninstall

**Build Process**:
```bash
# 1. Build React app
npm run build

# 2. Sync to Capacitor Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Build APK
./gradlew assembleDebug  # Debug build
./gradlew assembleRelease  # Release build

# 5. Install APK on device
adb install app-debug.apk
```

### Windows Implementation

**Framework**: Capacitor + Electron (bridges JavaScript to Node.js/Electron APIs)

**Storage API**: Same `@capacitor/filesystem` API, but implemented via Electron

**Actual Storage Location** (Windows 10/11):
- Development: `C:\Users\[Username]\AppData\Roaming\com.pojamma.securetexteditor\`
- Production: Same location
- Example: `C:\Users\JohnDoe\AppData\Roaming\com.pojamma.securetexteditor\secrets.txt`

**Permissions**:
- User-level access (no admin required)
- Accessible by user and application
- Protected by Windows user account permissions

**Security**:
- Windows file system ACLs apply
- Other users on same PC cannot access (if separate accounts)
- Survives app updates
- May survive app uninstall (depends on uninstaller configuration)

**Build Process**:
```bash
# 1. Build React app
npm run build

# 2. Sync to Electron
npx cap sync @capacitor-community/electron

# 3. Build Windows installer
cd electron
npm run build:windows

# Output: dist/SecureTextEditor-Setup-1.0.0.exe
```

**Electron Configuration** (`electron/src/index.ts`):
- Uses standard Electron IPC for file operations
- Capacitor plugin wraps Electron's `fs` module
- Full Node.js filesystem access available

### Web Browser (Testing Only)

**Framework**: Capacitor Web implementation

**Storage API**: `@capacitor/filesystem` (browser-based implementation)

**Actual Storage Location**:
- Uses browser's virtual filesystem (IndexedDB or FileSystem API)
- Not accessible as regular files
- Limited to browser's origin (localhost:5173)

**Limitations**:
- Not suitable for production use
- Files may be cleared on browser cache clear
- Cannot access real filesystem
- Good for development and testing only

**Running**:
```bash
npm run dev
# Opens http://localhost:5173
```

---

## Testing vs Production

### Development/Testing Environment

**Web Browser (npm run dev)**:
- Hot reload enabled
- Files stored in browser's IndexedDB
- Console logging enabled
- Source maps available
- Google Drive: Uses test credentials
- No build step required

**Android Emulator/Physical Device (Debug Build)**:
- APK installed via ADB or Android Studio
- Files stored in `/data/data/.../files/`
- Console accessible via `adb logcat`
- Chrome DevTools remote debugging available
- Debuggable flag enabled in manifest

**Windows (Electron Dev Mode)**:
- Development window with DevTools
- Files stored in AppData/Roaming
- Hot reload available
- Full console access

### Production Environment

**Android (Release APK)**:

**Build Command**:
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

**Differences from Development**:
- Code minified and optimized
- No console logging (production mode)
- No DevTools access
- Signed with release keystore
- ProGuard/R8 code obfuscation (optional)
- Smaller APK size

**Distribution**:
- Install via APK file (side-loading)
- Or publish to Google Play Store

**Windows (Release Installer)**:

**Build Command**:
```bash
npm run build
npx cap sync @capacitor-community/electron
cd electron
npm run build:windows
# Output: electron/dist/SecureTextEditor-Setup-1.0.0.exe
```

**Differences from Development**:
- Code minified and optimized
- No DevTools (unless explicitly enabled)
- Auto-update capability (electron-updater)
- Signed installer (if code signing certificate configured)
- Creates uninstaller
- Desktop shortcuts and Start Menu entries

**Distribution**:
- Distribute .exe installer
- Users run installer → app installed to Program Files
- Or portable .exe (no installer needed)

### Storage Differences: Testing vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Android Files** | `/data/data/.../files/` | `/data/data/.../files/` (same) |
| **Windows Files** | `AppData/Roaming/...` | `AppData/Roaming/...` (same) |
| **Session Data** | localStorage | localStorage (same) |
| **Encryption** | Same algorithm | Same algorithm (no difference) |
| **Performance** | Slower (debug code) | Faster (optimized) |
| **File Access** | Debuggable | Standard user access |

**Important**: File storage location is the SAME in both modes on Android and Windows. The difference is in code optimization, debugging capabilities, and distribution method.

---

## Appendix: Code Reference

### Key Files

1. **src/services/encryption.service.ts**
   - `encryptDocument()`: Encrypts a plain document
   - `decryptDocument()`: Decrypts an encrypted document
   - `validatePassword()`: Checks password strength
   - `isEncrypted()`: Detects if data is encrypted

2. **src/services/filesystem.service.ts**
   - `readFile()`: Reads file, detects encryption
   - `saveFile()`: Saves file, encrypts if needed
   - `decryptFile()`: Decrypts after password entry
   - `listFiles()`: Lists available files

3. **src/services/session.service.ts**
   - `saveSession()`: Saves app state to localStorage
   - `loadSession()`: Restores app state on startup
   - Security: Clears encrypted content before saving

4. **src/stores/documentStore.ts**
   - Zustand state management
   - Manages open documents array
   - Tracks active document ID
   - Updates content and modified flags

5. **src/types/document.types.ts**
   - TypeScript interfaces for documents
   - `PlainDocument`, `EncryptedDocument`, `OpenDocument`

### Encryption Constants

From `src/services/encryption.service.ts`:
```typescript
const PBKDF2_ITERATIONS = 600000;  // OWASP 2023 recommendation
const SALT_LENGTH = 16;  // 128 bits
const IV_LENGTH = 12;    // 96 bits (GCM standard)
const KEY_LENGTH = 256;  // bits
```

### Session Storage Key

From `src/services/session.service.ts`:
```typescript
const SESSION_STORAGE_KEY = 'securetexteditor_session';
```

This is stored in browser's localStorage (not Capacitor filesystem!) and persists across app launches.

---

## Summary

SecureTextEditor uses a robust, industry-standard encryption system (AES-256-GCM) with strong key derivation (PBKDF2-600k). Files are stored in platform-specific private directories, with consistent behavior across Android and Windows. The application never stores passwords and clears decrypted content from encrypted documents before saving session data. Users have full control over which documents are encrypted, and can add or remove encryption at any time.

**Key Takeaways**:
- 📂 Files stored in app's private directory (Android/Windows)
- 🔐 AES-256-GCM encryption with PBKDF2 key derivation
- 🔑 No passwords saved anywhere (must re-enter on app restart)
- 💾 Session data saved to localStorage (encrypted docs have content cleared)
- ✅ Same file locations in testing and production
- 🔄 Each document independently encrypted (no master password)
