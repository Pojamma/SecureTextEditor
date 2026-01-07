/**
 * Google Drive Service
 *
 * Handles Google Drive OAuth authentication and file operations
 * Supports both web and mobile (Capacitor) platforms
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
 *    - http://127.0.0.1:5173
 *    - http://127.0.0.1:3000
 *    - http://172.19.209.62:3000 (WSL2 IP - replace with your actual IP)
 *    - Your production domain when deploying
 *
 *    Authorized redirect URIs (add all that apply):
 *    - http://localhost:5173/auth/callback
 *    - http://localhost:3000/auth/callback
 *    - http://172.19.209.62:3000/auth/callback (WSL2 IP - replace with your actual IP)
 *    - Your production callback URL
 *
 *    Note: WSL2 IP addresses may change after restart. Access via localhost when possible.
 *
 * 6. Replace the placeholder credentials below
 */

import { Capacitor } from '@capacitor/core';

// ============================================================================
// CONFIGURATION - REPLACE WITH YOUR ACTUAL CREDENTIALS
// ============================================================================
//
// IMPORTANT: In Google Cloud Console, you must add ALL origins/ports you'll use:
// - Development: localhost:5173, localhost:3000, WSL2 IP:port
// - Production: Your actual domain
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


// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  AUTH_TOKEN: 'google_drive_auth_token',
  REFRESH_TOKEN: 'google_drive_refresh_token',
  TOKEN_EXPIRES: 'google_drive_token_expires',
};

// ============================================================================
// GOOGLE API CLIENT
// ============================================================================

let gapiLoaded = false;
let gapiInitialized = false;

/**
 * Load Google API Client library
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
 * Initialize Google API Client
 */
async function initGapiClient(): Promise<void> {
  if (gapiInitialized) return;

  await loadGapiClient();

  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: GOOGLE_CONFIG.web.apiKey,
          clientId: GOOGLE_CONFIG.web.clientId,
          discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
          scope: GOOGLE_CONFIG.scopes.join(' '),
        });
        gapiInitialized = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      return refreshed;
    }

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

    if (platform === 'web') {
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
 * Sign in on web platform
 */
async function signInWeb(): Promise<boolean> {
  try {
    await initGapiClient();

    const auth2 = gapi.auth2.getAuthInstance();
    const user = await auth2.signIn();
    const authResponse = user.getAuthResponse(true);

    // Store tokens
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.access_token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, authResponse.expires_at.toString());

    if (authResponse.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refresh_token);
    }

    return true;
  } catch (error) {
    console.error('Web sign in error:', error);
    return false;
  }
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
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      await initGapiClient();
      const auth2 = gapi.auth2.getAuthInstance();
      await auth2.signOut();
    }

    // Clear stored tokens
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out from Google Drive');
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    // For web, gapi handles token refresh automatically
    await initGapiClient();
    const auth2 = gapi.auth2.getAuthInstance();
    const user = auth2.currentUser.get();
    const authResponse = await user.reloadAuthResponse();

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authResponse.access_token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, authResponse.expires_at.toString());

    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
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

    const metadata = {
      name: filename,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
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

    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
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

    await gapi.client.drive.files.remove({
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
