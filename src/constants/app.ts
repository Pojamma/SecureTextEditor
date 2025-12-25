/**
 * Application Constants
 *
 * Central location for app-wide constants and configuration
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SecureTextEditor';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
export const BUILD_TIME = import.meta.env.BUILD_TIME || new Date().toISOString();

// Feature flags
export const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === 'true';
export const ENABLE_CONSOLE_LOGS = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true';
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

// Encryption constants
export const ENCRYPTION_ALGORITHM = 'AES-256-GCM';
export const KEY_DERIVATION_ALGORITHM = 'PBKDF2-SHA256';
export const PBKDF2_ITERATIONS = 600000;
export const SALT_LENGTH = 16; // 128 bits
export const IV_LENGTH = 12; // 96 bits for GCM

// File constants
export const ENCRYPTED_FILE_VERSION = '1.0';
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const AUTO_SAVE_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '1 minute', value: 60000 },
  { label: '2 minutes', value: 120000 },
  { label: '5 minutes', value: 300000 },
  { label: '10 minutes', value: 600000 }
];

// UI constants
export const DEFAULT_FONT_SIZE = 14;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 24;
export const DEFAULT_THEME = 'light';

// Performance constants
export const DEBOUNCE_DELAY = 300; // ms
export const THROTTLE_DELAY = 100; // ms

// Session constants
export const SESSION_STORAGE_KEY = 'securetexteditor-session';
export const SETTINGS_STORAGE_KEY = 'securetexteditor-settings';

// Google Drive constants
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Logger utility that respects environment settings
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (ENABLE_CONSOLE_LOGS) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (ENABLE_CONSOLE_LOGS) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (ENABLE_DEBUG && ENABLE_CONSOLE_LOGS) {
      console.debug(...args);
    }
  }
};

/**
 * Get app info for display
 */
export const getAppInfo = () => ({
  name: APP_NAME,
  version: APP_VERSION,
  environment: APP_ENV,
  buildTime: BUILD_TIME,
  encryptionAlgorithm: ENCRYPTION_ALGORITHM,
  keyDerivation: KEY_DERIVATION_ALGORITHM
});
