# Google Drive Integration Setup Guide

This guide will help you configure Google Drive integration for SecureTextEditor.

## Prerequisites

- Google Account
- Google Cloud Console access
- Node.js and npm installed

## Step 1: Create a Google Cloud Project (Done)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: "SecureTextEditor"
4. Click "Create"

## Step 2: Enable Google Drive API (Done)

1. In the Google Cloud Console, select your project
2. Navigate to "APIs & Services" → "Library"
3. Search for "Google Drive API"
4. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" → "OAuth consent screen", 
Audience,
2. Select "External" user type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: SecureTextEditor
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. Scopes: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/drive.file`
   - Add: `https://www.googleapis.com/auth/drive.appdata`
7. Click "Save and Continue"
8. Test users: Add your email for testing
9. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

### For Web (Development) (Done)

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name: "SecureTextEditor Web"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `http://localhost:4173` (for preview)
   - Add your production domain when ready
6. Add Authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - Add production callback URL when ready
7. Click "Create"
8. **Copy the Client ID and API Key** - you'll need these!

### For Android (Optional)

1. Click "Create Credentials" → "OAuth client ID"
2. Select "Android"
3. Name: "SecureTextEditor Android"
4. Package name: `com.pojamma.securetexteditor`
5. Get SHA-1 certificate fingerprint:
   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
6. Enter the SHA-1 fingerprint
7. Click "Create"
8. **Copy the Client ID**

## Step 5: Get API Key

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. **Copy the API Key**
4. Click "Restrict Key" (recommended)
5. Under "API restrictions", select "Restrict key"
6. Select "Google Drive API"
7. Click "Save"

## Step 6: Update SecureTextEditor Configuration

1. Open `src/services/googleDrive.service.ts`
2. Find the `GOOGLE_CONFIG` section (around line 23)
3. Replace the placeholder values:

```typescript
const GOOGLE_CONFIG = {
  web: {
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Step 4
    apiKey: 'YOUR_API_KEY', // From Step 5
    redirectUri: 'http://localhost:5173/auth/callback',
  },
  android: {
    clientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // From Step 4 (Android)
    redirectUri: 'com.pojamma.securetexteditor:/oauth2callback',
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
  ],
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
};
```

## Step 7: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. Click the hamburger menu (☰) → File → "Connect to Google Drive"

4. You should see the Google Sign-In popup

5. Sign in with your Google account

6. Grant the requested permissions

7. You should see "✓ Connected to Google Drive" in the menu

8. Try "Open from Google Drive" to browse your files

## Troubleshooting

### "Popup blocked" error
- Allow popups for `localhost:5173` in your browser settings

### "redirect_uri_mismatch" error
- Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:5173/auth/callback`
- Check for trailing slashes - they must match exactly

### "Access blocked: This app's request is invalid" error
- Make sure you configured the OAuth consent screen completely
- Add yourself as a test user if the app is in "Testing" mode

### "API key not valid" error
- Make sure the API key is not restricted to the wrong API
- Check that Google Drive API is enabled for your project

### Files not showing up
- Check that you've uploaded files to Google Drive
- Make sure the files are in a supported format (JSON or plain text)
- Check the browser console for errors

## Production Deployment

When deploying to production:

1. Update the `redirectUri` in `googleDrive.service.ts` to your production domain
2. Add your production domain to "Authorized JavaScript origins" and "Authorized redirect URIs" in Google Cloud Console
3. If using a custom domain, make sure it's verified in Google Cloud Console
4. Update OAuth consent screen to "In production" status (requires verification by Google)

## Security Notes

- **Never commit your API keys or Client IDs to public repositories**
- Use environment variables for production deployments
- Implement proper error handling for authentication failures
- Regularly rotate API keys if compromised
- Monitor API usage in Google Cloud Console

## Support

For issues with Google Drive integration:
- Check the browser console for errors
- Review Google Cloud Console logs
- Verify all credentials are correctly configured
- Ensure Google Drive API is enabled

## References

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Client Library](https://github.com/google/google-api-javascript-client)
