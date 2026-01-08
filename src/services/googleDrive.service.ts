/**
 * Google Drive Service
 *
 * Handles Google Drive OAuth authentication and file operations
 * Supports both web and mobile (Capacitor) platforms
 *
 * Uses Google Identity Services (GIS) - the modern OAuth library
 *
 * IMPORTANT: You need to set up Google Cloud Console credentials:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project or select existing
 * 3. Enable Google Drive API
 * 4. Create OAuth 2.0 credentials:
 *    - Web client ID for browser
 *    - Android client ID for mobile app
 * 5. Add authorized JavaScript origins and redirect URIs:
 *
 *    Authorized JavaScript origins (add all that apply):
 *    - http://localhost:5173 (Vite dev server default)
 *    - http://localhost:3000 (if running on port 3000)
 *    - http://localhost:4173 (Vite preview)
 *    - Your production domain when deploying (e.g., https://yourdomain.com)
 *
 *    Authorized redirect URIs (add all that apply):
 *    - http://localhost:5173/auth/callback
 *    - http://localhost:3000/auth/callback
 *    - http://localhost:4173/auth/callback
 *    - Your production callback URL (e.g., https://yourdomain.com/auth/callback)
 *
 *    IMPORTANT: Google OAuth does NOT allow raw IP addresses (like 172.19.209.62).
 *    You MUST access the dev server via 'localhost' or a proper domain name.
 *    In WSL2, always access as http://localhost:PORT from your Windows browser.
 *
 * 6. Replace the placeholder credentials below
 */

import { Capacitor } from '@capacitor/core';

// ============================================================================
// CONFIGURATION - REPLACE WITH YOUR ACTUAL CREDENTIALS
// ============================================================================
//
// IMPORTANT: In Google Cloud Console, you must add ALL origins/ports you'll use:
// - Development: http://localhost:5173, http://localhost:3000, etc.
// - Production: https://yourdomain.com
//
// Google OAuth does NOT allow raw IP addresses - use localhost or proper domains only!
//
// The redirectUri below should match your current dev server, but Google Cloud
// Console needs ALL possible redirect URIs pre-registered.
// ============================================================================

const GOOGLE_CONFIG = {
  web: {
    clientId: '471557058540-fk6kl3p112vmq39h24fnaeonk2j9kitt.apps.googleusercontent.com',
    apiKey: 'AIzaSyDMXX_Mfv2b4ff3klfp6zGlJAWBcteE72k',
    redirectUri: 'http://localhost:5173/auth/callback', // Change to match your dev server port
  },
  android: {
    clientId: '471557058540-u3c9fap63lraskt2nal067lnf1bmb8j5.apps.googleusercontent.com',
    redirectUri: 'com.pojamma.securetexteditor:/oauth2callback',
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // Per-file access
    'https://www.googleapis.com/auth/drive.appdata', // App-specific folder
  ],
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
};

// ============================================================================
// TYPES
// ============================================================================

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  encrypted?: boolean;
}

// Extend window to include Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  AUTH_TOKEN: 'google_drive_auth_token',
  TOKEN_EXPIRES: 'google_drive_token_expires',
};

// ============================================================================
// GOOGLE API CLIENT
// ============================================================================

let gapiLoaded = false;
let gapiInitialized = false;
let gisLoaded = false;
let tokenClient: any = null;

/**
 * Load Google API Client library (for Drive API calls)
 */
async function loadGapiClient(): Promise<void> {
  if (gapiLoaded) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapiLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google API client'));
    document.head.appendChild(script);
  });
}

/**
 * Load Google Identity Services library (for OAuth)
 */
async function loadGisClient(): Promise<void> {
  if (gisLoaded) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google API Client (for Drive API)
 */
async function initGapiClient(): Promise<void> {
  if (gapiInitialized) return;

  await loadGapiClient();

  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        // Wait for gapi.client to be available (especially important in Electron)
        let retries = 0;
        const maxRetries = 10;

        while (!gapi.client && retries < maxRetries) {
          console.log(`[Google Drive] Waiting for gapi.client... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(r => setTimeout(r, 200)); // Wait 200ms
          retries++;
        }

        if (!gapi.client) {
          console.error('[Google Drive] gapi.client is undefined after retries');
          reject(new Error('Google API client not available in this environment'));
          return;
        }

        console.log('[Google Drive] gapi.client is now available');

        // Modern initialization: set API key and load Drive API
        // This is compatible with Google Identity Services (GIS)
        (gapi.client as any).setApiKey(GOOGLE_CONFIG.web.apiKey);
        await (gapi.client as any).load('drive', 'v3');

        gapiInitialized = true;
        console.log('[Google Drive] API client initialized successfully');
        resolve();
      } catch (error) {
        console.error('[Google Drive] Init error:', error);
        reject(error);
      }
    });
  });
}

/**
 * Initialize Google Identity Services token client
 */
async function initTokenClient(): Promise<void> {
  if (tokenClient) return;

  await loadGisClient();

  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CONFIG.web.clientId,
    scope: GOOGLE_CONFIG.scopes.join(' '),
    callback: '', // Will be set during sign-in
  });
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);

    if (!token || !expiresAt) return false;

    // Check if token is expired
    const now = Date.now();
    const expires = parseInt(expiresAt, 10);

    if (now >= expires) {
      // Token expired, need to re-authenticate
      return false;
    }

    // Set the token for gapi client
    await initGapiClient();
    (gapi.client as any).setToken({ access_token: token });

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Sign in to Google Drive
 */
export async function signIn(): Promise<boolean> {
  try {
    const platform = Capacitor.getPlatform();

    // Electron is a web environment (uses Chromium), so treat it like web
    if (platform === 'web' || platform === 'electron') {
      return await signInWeb();
    } else if (platform === 'android') {
      return await signInAndroid();
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error('Failed to sign in to Google Drive');
  }
}

/**
 * Sign in on web platform using Google Identity Services
 */
async function signInWeb(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      await initGapiClient();
      await initTokenClient();

      // Set callback for token response
      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Token error:', response);
          reject(new Error(response.error));
          return;
        }

        // Store access token and expiration
        const expiresAt = Date.now() + (response.expires_in * 1000);
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString());

        // Set token for gapi client
        (gapi.client as any).setToken({ access_token: response.access_token });

        resolve(true);
      };

      // Check if already have a valid token
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        // Request new token (user may need to consent)
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // First time - request token
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      }
    } catch (error) {
      console.error('Web sign in error:', error);
      reject(error);
    }
  });
}

/**
 * Sign in on Android platform
 */
async function signInAndroid(): Promise<boolean> {
  // Note: For Android, you would use Google Sign-In plugin
  // This is a placeholder implementation
  throw new Error('Android OAuth not yet implemented. Use web version for now.');
}

/**
 * Sign out from Google Drive
 */
export async function signOut(): Promise<void> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // Revoke token if it exists
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked');
      });
    }

    // Clear stored tokens
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);

    // Clear gapi client token
    if (gapi?.client) {
      (gapi.client as any).setToken(null);
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out from Google Drive');
  }
}

// ============================================================================
// DRIVE FILE OPERATIONS
// ============================================================================

/**
 * List files from Google Drive
 */
export async function listFiles(query?: string): Promise<DriveFile[]> {
  try {
    await initGapiClient();

    // Ensure we have a valid token
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const response = await gapi.client.drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, modifiedTime, size)',
      q: query || "mimeType='application/json' or mimeType='text/plain'",
      orderBy: 'modifiedTime desc',
    });

    const files = response.result.files || [];

    return files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      size: file.size,
      encrypted: file.name.includes('.encrypted') || file.name.endsWith('.enc'),
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list Google Drive files');
  }
}

/**
 * Download file from Google Drive
 */
export async function downloadFile(fileId: string): Promise<string> {
  try {
    await initGapiClient();

    // Ensure we have a valid token
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return response.body;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file from Google Drive');
  }
}

/**
 * Upload file to Google Drive
 */
export async function uploadFile(
  filename: string,
  content: string,
  mimeType: string = 'application/json'
): Promise<string> {
  try {
    await initGapiClient();

    // Ensure we have a valid token
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const metadata = {
      name: filename,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}

/**
 * Update existing file in Google Drive
 */
export async function updateFile(fileId: string, content: string): Promise<void> {
  try {
    await initGapiClient();

    // Ensure we have a valid token
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });
  } catch (error) {
    console.error('Error updating file:', error);
    throw new Error('Failed to update file in Google Drive');
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    await initGapiClient();

    // Ensure we have a valid token
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    // Note: gapi types use 'delete' but implementation might use 'remove'
    await (gapi.client.drive.files as any).delete({
      fileId: fileId,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file from Google Drive');
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const GoogleDriveService = {
  isAuthenticated,
  signIn,
  signOut,
  listFiles,
  downloadFile,
  uploadFile,
  updateFile,
  deleteFile,
};
