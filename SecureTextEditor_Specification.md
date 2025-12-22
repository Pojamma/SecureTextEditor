# SecureTextEditor - Design & Specification Document

## 1. Project Overview

### 1.1 Purpose
A cross-platform encrypted text editor designed for personal use on Android and Windows devices, featuring strong encryption, Google Drive integration, and a mobile-optimized interface.

### 1.2 Target Platforms
- **Android**: APK deployment (tablet-first design, phone compatible)
- **Windows**: Desktop application
- **Technology Stack**: React + TypeScript + Capacitor (for cross-platform compatibility)

### 1.3 Core Philosophy
- Privacy-first: No master password, document-level encryption
- Mobile-optimized: Touch-friendly interface with efficient use of screen space
- Flexibility: Optional encryption, multiple file sources, customizable UI
- Simplicity: Clean, organized interface without excessive animations

---

## 2. Technical Architecture

### 2.1 Technology Stack
```
Frontend Framework: React 18+
Language: TypeScript
Build Tool: Vite
Cross-Platform: Capacitor 6+
Editor Component: CodeMirror 6 (professional text editor with built-in search)
UI Styling: Custom CSS (mobile-optimized)
State Management: Zustand
Encryption: Web Crypto API (AES-256-GCM)
Cloud Storage: Google Drive API v3
Local Storage: Capacitor Filesystem API
```

### 2.2 Project Structure
```
src/
├── components/
│   ├── CodeMirrorEditor.tsx      # CodeMirror 6 editor wrapper with theming
│   ├── EditorTabs.tsx            # Multi-tab document management
│   ├── Notification.tsx          # Toast notifications
│   ├── Menus/
│   │   └── HamburgerMenu.tsx     # Main application menu
│   └── Dialogs/
│       ├── PasswordDialog.tsx    # Encryption/decryption password input
│       └── FilePickerDialog.tsx  # File selection dialog
├── services/
│   ├── encryption.service.ts
│   ├── storage.service.ts
│   ├── googleDrive.service.ts
│   └── session.service.ts
├── stores/
│   ├── documentStore.ts
│   ├── settingsStore.ts
│   └── uiStore.ts
├── types/
│   ├── document.types.ts
│   ├── encryption.types.ts
│   └── settings.types.ts
└── utils/
    ├── crypto.utils.ts
    ├── file.utils.ts
    └── validation.utils.ts
```

### 2.3 Data Flow
```
User Action → Component → Service Layer → Storage/API
                ↓
         State Management
                ↓
         Component Re-render
```

---

## 3. Security Specifications

### 3.1 Encryption Algorithm
**Primary**: AES-256-GCM (Galois/Counter Mode)
- Authenticated encryption (prevents tampering)
- 256-bit key length (strongest practical AES)
- 96-bit IV (initialization vector) - randomly generated per encryption
- Built-in authentication tag

### 3.2 Key Derivation
**Algorithm**: PBKDF2 (Password-Based Key Derivation Function 2)
```
Parameters:
- Hash: SHA-256
- Iterations: 600,000 (OWASP 2023 recommendation)
- Salt: 128-bit random (unique per document)
- Output: 256-bit key
```

**Alternative** (if performance allows): Argon2id
- More resistant to GPU/ASIC attacks
- Memory-hard function
- Recommended for higher security needs

### 3.3 Encrypted Document Format
```typescript
interface EncryptedDocument {
  version: '1.0';                    // Format version
  encrypted: true;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  kdfParams: {
    iterations: 600000;
    salt: string;                    // Base64 encoded
  };
  iv: string;                        // Base64 encoded
  ciphertext: string;                // Base64 encoded
  authTag: string;                   // Base64 encoded (GCM auth tag)
  metadata: {
    created: string;                 // ISO timestamp
    modified: string;                // ISO timestamp
    filename: string;
  };
}
```

### 3.4 Plain Document Format
```typescript
interface PlainDocument {
  version: '1.0';
  encrypted: false;
  content: string;
  metadata: {
    created: string;
    modified: string;
    filename: string;
  };
}
```

### 3.5 Security Best Practices
1. **No password storage**: Passwords never saved, only used for key derivation
2. **Memory clearing**: Sensitive data cleared from memory after use
3. **Password strength**: No minimum enforced, but UI shows strength indicator
4. **Secure random generation**: Use crypto.getRandomValues() for IV and salt
5. **Timing attack resistance**: Use constant-time comparison for authentication
6. **No password recovery**: Lost passwords = lost data (clear user warning)

### 3.6 Password Dialog Workflow
```
1. User attempts to open encrypted document
2. System detects encryption flag
3. Password dialog appears
4. User enters password
5. System derives key using PBKDF2 + stored salt
6. Decryption attempted
7. Success: Document opens | Failure: Error message, retry
```

---

## 4. Feature Specifications

### 4.1 File Management

#### 4.1.1 File Sources
- **Local Files**: Device filesystem (Capacitor Filesystem API)
- **Google Drive**: OAuth 2.0 authentication, read/write access
- **Session Storage**: Temporary documents (not saved to disk)

#### 4.1.2 File Operations
| Operation | Description | Keyboard Shortcut |
|-----------|-------------|-------------------|
| New | Create blank document | Ctrl/Cmd+N |
| Open Local | Open from device storage | Ctrl/Cmd+O |
| Open from Drive | Browse Google Drive files | Ctrl/Cmd+Shift+O |
| Save | Save to current location | Ctrl/Cmd+S |
| Save As | Save to new location/name | Ctrl/Cmd+Shift+S |
| Save All | Save all modified documents | Ctrl/Cmd+Alt+S |
| Close Tab | Close current document | Ctrl/Cmd+W |
| Close All | Close all documents | Ctrl/Cmd+Shift+W |

#### 4.1.3 Auto-Save
- Optional auto-save (configurable interval: 1, 2, 5, 10 minutes, or off)
- Visual indicator when unsaved changes exist
- Background save doesn't interrupt editing

### 4.2 Encryption Features

#### 4.2.1 Encryption Workflow
```
1. User creates/opens document
2. User selects "Encrypt Document" from menu
3. Password dialog appears
4. User enters password (twice for confirmation)
5. Password strength indicator shows
6. User confirms
7. Document encrypted in memory
8. Encrypted flag set
9. Save to storage
```

#### 4.2.2 Decryption Workflow
```
1. User opens encrypted file
2. System detects encryption
3. Password dialog appears
4. User enters password
5. System attempts decryption
6. Success: Document editable | Failure: Retry or cancel
```

#### 4.2.3 Change/Remove Encryption
- **Change Password**: Decrypt → re-encrypt with new password
- **Remove Encryption**: Decrypt → save as plain text (with confirmation)

### 4.3 Multi-Tab Management

#### 4.3.1 Tab Behavior
- Maximum tabs: 10 (configurable in settings)
- Tab switching: Click, swipe (mobile), keyboard shortcuts
- Tab reordering: Drag and drop (desktop), long-press drag (mobile)
- Modified indicator: Dot or asterisk on tab label
- Active tab highlight

#### 4.3.2 Tab Navigation
| Action | Desktop | Mobile |
|--------|---------|--------|
| Next Tab | Ctrl+Tab | Swipe left |
| Previous Tab | Ctrl+Shift+Tab | Swipe right |
| Close Tab | Ctrl+W or middle-click | Swipe up |
| Go to Tab N | Ctrl+1-9 | N/A |

### 4.4 Session Persistence

#### 4.4.1 Saved Session Data
```typescript
interface Session {
  openDocuments: Array<{
    path: string;              // File path or Drive ID
    source: 'local' | 'drive' | 'temp';
    encrypted: boolean;
    cursorPosition: number;
    scrollPosition: number;
    modified: boolean;
  }>;
  activeTabIndex: number;
  uiState: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    specialCharsVisible: boolean;
  };
  lastSaved: string;           // ISO timestamp
}
```

#### 4.4.2 Session Restore
- On app launch, restore previous session
- Encrypted documents require password re-entry
- Option to "Start Fresh" from settings
- Crash recovery: Auto-save session state every 30 seconds

### 4.5 Search Functionality

#### 4.5.1 Search Scope
- **Current Document**: Standard find in active tab
- **All Open Tabs**: Search across all open documents
- **Case Sensitive**: Toggle option
- **Whole Word**: Toggle option
- **Regex**: Advanced option for power users

#### 4.5.2 Search UI
```
[Search Bar]
[v] Case Sensitive  [v] Whole Word  [ ] Regex
Scope: [Current Tab ▼] [All Tabs]

Results:
📄 Document1.txt (3 matches)
  Line 12: ... matching text ...
  Line 45: ... matching text ...
📄 Notes.txt (1 match)
  Line 8: ... matching text ...
```

#### 4.5.3 Search Features
- Find and Replace (current document)
- Replace All (current document)
- Jump to result (highlights and scrolls to match)
- Result count display

### 4.6 Document Shortcuts

#### 4.6.1 Shortcut Creation
- Right-click document tab → "Create Shortcut"
- Desktop: Creates .lnk file (Windows) or .desktop file (Linux)
- Android: Creates home screen shortcut
- Shortcut includes custom icon and document name

#### 4.6.2 Shortcut Deep Linking
```
Custom URL scheme: securetexteditor://open?path={encodedPath}

Examples:
- securetexteditor://open?path=local:/storage/documents/notes.txt
- securetexteditor://open?path=drive:1a2b3c4d5e6f
```

#### 4.6.3 Shortcut Behavior
- Launches app if not running
- Opens specified document
- Prompts for password if encrypted
- Falls back to main view if document not found

---

## 5. User Interface Design

### 5.1 Layout Structure

```
┌─────────────────────────────────────────┐
│  [☰] SecureTextEditor    [Settings] [?] │  ← Header Bar 1: Toolbar
├─────────────────────────────────────────┤
│ [Doc1.txt*] [Notes] [+]                 │  ← Header Bar 2: Tabs
├─────────────────────────────────────────┤
│ [! @ # $ % ^ & * ( ) { } [ ] < > / \ |] │  ← Special Chars Bar (optional)
├─────────────────────────────────────────┤
│                                          │
│                                          │
│         Editor Content Area              │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│ Line: 42 | Col: 8 | 1,234 chars | UTF-8 │  ← Footer: Status Bar
└─────────────────────────────────────────┘
```

### 5.2 Menu Structure

#### 5.2.1 Hamburger Menu (☰)
```
File
  ├─ New Document              Ctrl+N
  ├─ Open Local File           Ctrl+O
  ├─ Open from Google Drive    Ctrl+Shift+O
  ├─ ─────────────────
  ├─ Save                      Ctrl+S
  ├─ Save As                   Ctrl+Shift+S
  ├─ Save All                  Ctrl+Alt+S
  ├─ ─────────────────
  ├─ Close Tab                 Ctrl+W
  ├─ Close All Tabs
  └─ ─────────────────
     Export
       ├─ Export as PDF
       ├─ Export as HTML
       └─ Export to Email

Edit
  ├─ Undo                      Ctrl+Z
  ├─ Redo                      Ctrl+Y
  ├─ ─────────────────
  ├─ Cut                       Ctrl+X
  ├─ Copy                      Ctrl+C
  ├─ Paste                     Ctrl+V
  ├─ Select All                Ctrl+A
  ├─ ─────────────────
  ├─ Find                      Ctrl+F
  ├─ Find and Replace          Ctrl+H
  ├─ Find in All Tabs          Ctrl+Shift+F
  └─ ─────────────────
     Insert
       ├─ Date/Time
       ├─ Special Character
       └─ Template

View
  ├─ Theme                     →
  │   ├─ Light
  │   ├─ Dark
  │   ├─ Solarized Light
  │   ├─ Solarized Dark
  │   ├─ Dracula
  │   └─ Nord
  ├─ Font                      →
  │   ├─ Font Family           →
  │   └─ Font Size             → [8, 10, 12, 14, 16, 18, 20, 24]
  ├─ ─────────────────
  ├─ Show Special Chars Bar    [✓]
  ├─ Show Line Numbers         [✓]
  ├─ Show Status Bar           [✓]
  ├─ ─────────────────
  ├─ Zoom In                   Ctrl++
  ├─ Zoom Out                  Ctrl+-
  └─ Reset Zoom                Ctrl+0

Security
  ├─ Encrypt Document          →
  │   ├─ Set Password
  │   └─ Password Strength: [Indicator]
  ├─ Change Password
  ├─ Remove Encryption
  └─ ─────────────────
     Password Settings
       ├─ Lock After Inactivity [✓] (5 min)
       └─ Clear Clipboard After [✓] (30 sec)

Tools
  ├─ Word Count
  ├─ Character Count
  ├─ Statistics
  ├─ ─────────────────
  ├─ Sort Lines
  ├─ Remove Duplicates
  ├─ Convert Case              →
  │   ├─ UPPERCASE
  │   ├─ lowercase
  │   └─ Title Case
  └─ ─────────────────
     Cleanup
       ├─ Trim Whitespace
       ├─ Remove Empty Lines
       └─ Normalize Line Endings

Settings
  ├─ Auto-Save                 [✓]
  │   └─ Interval: [5 minutes ▼]
  ├─ Session Recovery          [✓]
  ├─ ─────────────────
  ├─ Default File Location     →
  ├─ Google Drive              →
  │   ├─ Connect Account
  │   ├─ Disconnect
  │   └─ Default Folder
  ├─ ─────────────────
  ├─ Editor Preferences        →
  │   ├─ Tab Size: [4 ▼]
  │   ├─ Word Wrap: [✓]
  │   ├─ Auto-Indent: [✓]
  │   └─ Show Invisibles: [ ]
  ├─ ─────────────────
  ├─ About
  └─ Help
```

### 5.3 Component Specifications

#### 5.3.1 Toolbar (Header Bar 1)
```
┌─────────────────────────────────────────┐
│ [☰] SecureTextEditor   [🔒][🔍][⚙️][❓] │
└─────────────────────────────────────────┘

Elements (left to right):
- Hamburger menu (all primary functions)
- App title
- Lock icon (shows encryption status of active doc)
- Search icon (quick access to find)
- Settings icon
- Help/About icon
```

#### 5.3.2 Tab Bar (Header Bar 2)
```
┌─────────────────────────────────────────┐
│ [Doc1.txt*] [Notes.txt] [Shopping] [+]  │
└─────────────────────────────────────────┘

Features:
- Active tab highlighted
- Modified indicator (*)
- Close button on hover/long-press
- [+] button to create new document
- Horizontal scroll if tabs overflow
- Drag to reorder (desktop)
```

#### 5.3.3 Special Characters Bar
```
┌─────────────────────────────────────────┐
│ ! @ # $ % ^ & * ( ) { } [ ] < > / \ | ▼ │
└─────────────────────────────────────────┘

Features:
- Tap/click to insert at cursor
- Customizable character set
- Dropdown (▼) for more characters
- Show/hide toggle in View menu
- Remembers visibility state
```

#### 5.3.4 Status Bar (Footer)
```
┌─────────────────────────────────────────┐
│ Ln 42, Col 8 | 1,234 chars | UTF-8 | ⚠️  │
└─────────────────────────────────────────┘

Information:
- Current line and column
- Character/word count
- File encoding
- Warnings/errors icon (if applicable)
- Encryption status indicator
```

### 5.4 Responsive Design

#### 5.4.1 Phone Layout (< 600px width)
- Hamburger menu for all functions
- Single tab visible (swipe to switch)
- Special chars bar collapses to dropdown
- Status bar shows minimal info

#### 5.4.2 Tablet Layout (600-1024px)
- Full tab bar (up to 5 visible)
- Special chars bar full width
- Complete status bar
- Side-by-side dialogs when space allows

#### 5.4.3 Desktop Layout (> 1024px)
- All features visible
- Keyboard shortcuts enabled
- Context menus (right-click)
- Resizable panels (optional future feature)

### 5.5 Theme Specifications

#### 5.5.1 Theme Structure
```typescript
interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    error: string;
    success: string;
  };
  editor: {
    background: string;
    text: string;
    selection: string;
    lineNumber: string;
    cursor: string;
  };
}
```

#### 5.5.2 Built-in Themes
1. **Light** (Default)
   - Background: #FFFFFF
   - Text: #000000
   - Editor: #FAFAFA

2. **Dark**
   - Background: #1E1E1E
   - Text: #D4D4D4
   - Editor: #252526

3. **Solarized Light**
   - Background: #FDF6E3
   - Text: #657B83
   - Editor: #EEE8D5

4. **Solarized Dark**
   - Background: #002B36
   - Text: #839496
   - Editor: #073642

5. **Dracula**
   - Background: #282A36
   - Text: #F8F8F2
   - Editor: #282A36

6. **Nord**
   - Background: #2E3440
   - Text: #ECEFF4
   - Editor: #3B4252

---

## 6. Google Drive Integration

### 6.1 Authentication
```
Flow:
1. User selects "Connect Google Drive"
2. OAuth 2.0 flow initiated
3. User authenticates in browser
4. App receives access token
5. Token stored securely (Capacitor SecureStorage)
6. Refresh token used for session persistence
```

### 6.2 Permissions Required
```
Scopes:
- https://www.googleapis.com/auth/drive.file
  (Access only to files created or opened by app)

Alternative (more permissive):
- https://www.googleapis.com/auth/drive
  (Full Drive access - if user prefers)
```

### 6.3 Drive Operations
| Operation | API Method | Notes |
|-----------|------------|-------|
| List Files | files.list | Show in file picker |
| Get File | files.get | Download content |
| Create File | files.create | Upload new document |
| Update File | files.update | Save changes |
| Delete File | files.delete | Optional, with confirmation |

### 6.4 Offline Support
- Cache recently accessed files locally
- Queue changes when offline
- Sync when connection restored
- Conflict resolution: Manual (show both versions)

### 6.5 Drive File Picker
```
┌─────────────────────────────┐
│ Select from Google Drive     │
├─────────────────────────────┤
│ Search: [____________] [🔍] │
├─────────────────────────────┤
│ 📄 Work Notes.txt           │
│    Modified: 2 hours ago     │
│ 📄 Shopping List.txt        │
│    Modified: Yesterday       │
│ 🔒 Passwords.txt (encrypted)│
│    Modified: 3 days ago      │
├─────────────────────────────┤
│ [Cancel]         [Open]     │
└─────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Core Functionality (MVP)
**Duration**: 2-3 weeks

Features:
- [x] Basic text editing (single document)
- [x] Local file open/save
- [x] Simple UI (toolbar + editor + status bar)
- [x] Plain text support only
- [x] Basic themes (Light/Dark)

**Deliverable**: Working editor with local file support

### Phase 2: Multi-Tab & Session Management
**Duration**: 1-2 weeks

Features:
- [x] Multiple document tabs
- [x] Tab switching and management
- [x] Session persistence
- [x] Auto-save functionality

**Deliverable**: Multi-document editor with session recovery

### Phase 3: Encryption
**Duration**: 2 weeks

Features:
- [x] AES-256-GCM encryption
- [x] PBKDF2 key derivation
- [x] Password dialogs
- [x] Encrypted file format
- [x] Security testing

**Deliverable**: Secure encryption/decryption working

### Phase 4: Google Drive Integration
**Duration**: 1-2 weeks

Features:
- [x] OAuth 2.0 authentication
- [x] Drive file picker
- [x] Upload/download from Drive
- [x] Offline caching

**Deliverable**: Cloud storage integration complete

### Phase 5: Advanced Features
**Duration**: 2 weeks

Features:
- [x] Search across all tabs
- [x] Special characters bar
- [x] Additional themes
- [x] Font customization
- [x] Document shortcuts

**Deliverable**: Full-featured application

### Phase 6: Platform Optimization
**Duration**: 1-2 weeks

Features:
- [x] Android APK build
- [x] Windows desktop build
- [x] Platform-specific optimizations
- [x] Performance tuning
- [x] Mobile UI refinements

**Deliverable**: Cross-platform deployment ready

### Phase 7: Polish & Testing
**Duration**: 1-2 weeks

Activities:
- [x] Comprehensive testing
- [x] Bug fixes
- [x] UI/UX improvements
- [x] Documentation
- [x] Help system

**Deliverable**: Production-ready application

---

## 8. Testing Requirements

### 8.1 Unit Tests
```
Coverage Areas:
- Encryption/decryption functions
- Key derivation
- File operations
- Data validation
- Utility functions

Target Coverage: 80%+
```

### 8.2 Integration Tests
```
Test Scenarios:
- File open/save workflows
- Encryption/decryption workflows
- Google Drive operations
- Tab management
- Session persistence
```

### 8.3 Security Tests
```
Tests:
1. Encryption strength verification
2. Password attack resistance
3. Memory clearing validation
4. Secure random generation
5. Authentication bypass attempts
6. Data integrity checks
```

### 8.4 UI/UX Tests
```
Test Cases:
- Touch interactions (mobile)
- Keyboard shortcuts (desktop)
- Theme switching
- Font changes
- Responsive layouts
- Accessibility (screen readers)
```

### 8.5 Performance Tests
```
Metrics:
- App launch time: < 2 seconds
- File open time: < 1 second (small files)
- Encryption time: < 2 seconds (100KB file)
- Search time: < 500ms (10 tabs)
- Memory usage: < 200MB (10 open tabs)
```

### 8.6 Platform-Specific Tests
```
Android:
- Different screen sizes (phone/tablet)
- Various Android versions (10+)
- Background/foreground transitions
- Permission handling

Windows:
- Different screen resolutions
- Windows 10/11 compatibility
- File system access
- Keyboard layouts
```

---

## 9. Security Warnings & User Education

### 9.1 Critical Warnings

#### 9.1.1 Password Loss Warning
```
╔═══════════════════════════════════════╗
║  ⚠️  IMPORTANT: PASSWORD SECURITY     ║
╠═══════════════════════════════════════╣
║ • Passwords are NOT stored            ║
║ • Lost passwords = Lost data          ║
║ • No password recovery possible       ║
║ • Keep passwords safe externally      ║
║                                       ║
║ [ ] I understand and accept           ║
║                                       ║
║        [Cancel]  [Continue]           ║
╚═══════════════════════════════════════╝
```

#### 9.1.2 First-Time Encryption Flow
```
Step 1: Warning
Step 2: Password entry (with confirmation)
Step 3: Password strength indicator
Step 4: Final confirmation
Step 5: Encryption process
```

### 9.2 Password Strength Indicator
```
Visual feedback:
━━━━━━━━━━ Weak      (< 8 chars, simple)
━━━━━━━━━━ Fair      (8-12 chars, mixed)
━━━━━━━━━━ Good      (12-16 chars, complex)
━━━━━━━━━━ Strong    (16+ chars, very complex)

Suggestions:
- Use at least 12 characters
- Mix uppercase, lowercase, numbers, symbols
- Avoid dictionary words
- Consider using a passphrase
```

### 9.3 Help Documentation
Topics to cover:
1. Getting Started
2. Creating and Opening Files
3. Encrypting Documents
4. Google Drive Setup
5. Using Multiple Tabs
6. Keyboard Shortcuts
7. Customizing Appearance
8. Troubleshooting
9. Security Best Practices
10. FAQ

---

## 10. Performance Optimization

### 10.1 File Handling
- Lazy loading for large files
- Virtual scrolling for long documents
- Chunked reading/writing
- Background processing for encryption

### 10.2 Memory Management
- Dispose of closed documents
- Limit undo/redo history (configurable)
- Clear clipboard after timeout
- Compress session storage

### 10.3 Rendering Optimization
- Debounced search
- Throttled scroll events
- Efficient re-renders (React.memo)
- CSS animations instead of JS

### 10.4 Caching Strategy
- Cache decrypted documents in memory
- Cache Drive file list (5-minute TTL)
- Cache theme settings
- Cache font selections

---

## 11. Accessibility

### 11.1 Requirements
- WCAG 2.1 Level AA compliance
- Screen reader support
- Keyboard navigation
- High contrast themes
- Adjustable font sizes
- Focus indicators

### 11.2 ARIA Labels
```typescript
Examples:
<button aria-label="Open file">
<input aria-label="Search in document">
<div role="tablist" aria-label="Open documents">
<div role="status" aria-live="polite">
```

### 11.3 Keyboard Shortcuts Summary
All major functions accessible via keyboard (see Section 5.2 for complete list)

---

## 12. Error Handling

### 12.1 Error Categories
1. **File Errors**: Not found, permission denied, corrupt file
2. **Network Errors**: Drive API failures, timeout, offline
3. **Encryption Errors**: Wrong password, corrupt data, algorithm failure
4. **Storage Errors**: Out of space, quota exceeded
5. **Validation Errors**: Invalid input, format errors

### 12.2 Error Display
```
Toast notifications for minor errors
Modal dialogs for critical errors
Inline validation for forms
Error boundaries for React crashes
```

### 12.3 Error Recovery
- Auto-retry for network errors (3 attempts)
- Graceful degradation (offline mode)
- Data recovery from auto-save
- User-friendly error messages (no technical jargon)

---

## 13. Configuration Files

### 13.1 capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.securetexteditor',
  appName: 'SecureTextEditor',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Filesystem: {
      androidDisplayName: 'SecureTextEditor Storage'
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#1E1E1E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
```

### 13.2 tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 13.3 vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 3000
  }
});
```

---

## 14. Deployment Checklist

### 14.1 Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version number incremented
- [ ] Changelog updated
- [ ] Security audit passed

### 14.2 Android APK
- [ ] Build signed APK
- [ ] Test on physical device
- [ ] Verify permissions
- [ ] Check app size (< 50MB)
- [ ] Test offline functionality
- [ ] Verify deep linking

### 14.3 Windows Desktop
- [ ] Build executable
- [ ] Test on Windows 10/11
- [ ] Verify file associations
- [ ] Check installer size
- [ ] Test auto-update (if applicable)

### 14.4 Post-Deployment
- [ ] Monitor crash reports
- [ ] Collect user feedback
- [ ] Performance monitoring
- [ ] Usage analytics (privacy-respecting)

---

## 15. Future Enhancements (Post-V1)

### 15.1 Potential Features
- [ ] Markdown preview/rendering
- [ ] Syntax highlighting for code
- [ ] Rich text formatting
- [ ] Table support
- [ ] Image embedding
- [ ] Version history
- [ ] Collaboration features
- [ ] Plugin system
- [ ] Custom themes creator
- [ ] Export to more formats (DOCX, RTF)
- [ ] OCR for image-to-text
- [ ] Voice dictation
- [ ] Biometric authentication
- [ ] Hardware key support (YubiKey)

### 15.2 Platform Expansion
- [ ] iOS version
- [ ] macOS version
- [ ] Linux version
- [ ] Web version (PWA)
- [ ] Browser extension

---

## 16. Development Guidelines

### 16.1 Code Style
- ESLint + Prettier for formatting
- TypeScript strict mode
- Functional components with hooks
- Descriptive variable/function names
- Comments for complex logic
- JSDoc for public APIs

### 16.2 Git Workflow
```
Branches:
- main: Production-ready code
- develop: Integration branch
- feature/*: New features
- bugfix/*: Bug fixes
- hotfix/*: Critical fixes

Commit Format:
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
```

### 16.3 Code Review Checklist
- [ ] Functionality works as expected
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Code is readable and maintainable
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No console.log() statements
- [ ] Error handling implemented

---

## 17. Support & Maintenance

### 17.1 Bug Reporting
Template:
```
**Description**: Clear description of the issue
**Steps to Reproduce**: Numbered steps
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Platform**: Android/Windows, version
**App Version**: X.Y.Z
**Screenshots**: If applicable
```

### 17.2 Versioning
Semantic Versioning (SemVer):
```
MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes
```

### 17.3 Update Strategy
- Critical security updates: Immediate
- Bug fixes: Bi-weekly
- New features: Monthly
- Major versions: Quarterly

---

## 18. License & Legal

### 18.1 Recommended License
- MIT License (permissive)
- OR Apache 2.0 (patent grant)
- Personal use: No license required

### 18.2 Third-Party Dependencies
All dependencies must be:
- Open source
- Compatible license
- Actively maintained
- Security vetted

### 18.3 Privacy Policy
Since this is for personal use only:
- No data collection
- No analytics
- No telemetry
- Local storage only
- Google Drive: User's own account

---

## 19. Conclusion

This specification provides a comprehensive blueprint for building a secure, cross-platform text editor with strong encryption. The modular design allows for incremental development, starting with core functionality and progressively adding advanced features.

**Key Success Factors:**
1. Security-first approach
2. Clean, intuitive UI
3. Reliable encryption
4. Cross-platform compatibility
5. Performance optimization
6. Thorough testing

**Next Steps for Claude Code:**
1. Set up project structure
2. Implement Phase 1 (MVP)
3. Iterate through phases
4. Test extensively
5. Deploy to target platforms

---

## 20. Quick Reference

### 20.1 Technology Stack Summary
```
Frontend:    React 18 + TypeScript
Build:       Vite
Platform:    Capacitor 6
Editor:      CodeMirror 6 (with built-in search)
UI:          Custom CSS (mobile-optimized)
State:       Zustand
Encryption:  Web Crypto API (AES-256-GCM)
Storage:     Local + Google Drive
```

### 20.2 File Structure Quick View
```
SecureTextEditor/
├── src/
│   ├── components/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── android/
├── windows/
├── public/
└── [config files]
```

### 20.3 Key Commands
```
npm install              # Install dependencies
npm run dev              # Development server
npm run build            # Production build
npx cap add android      # Add Android platform
npx cap add electron     # Add Windows platform
npx cap sync             # Sync web code to native
npx cap open android     # Open in Android Studio
```

---

**Document Version**: 1.0  
**Last Updated**: December 20, 2025  
**Author**: Design Specification for SecureTextEditor  
**Status**: Ready for Implementation
