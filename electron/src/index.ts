import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import type { MenuItemConstructorOptions } from 'electron';
import { app, MenuItem } from 'electron';
import electronIsDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import { autoUpdater } from 'electron-updater';

import { ElectronCapacitorApp, setupContentSecurityPolicy, setupReloadWatcher } from './setup';

// Graceful handling of unhandled errors.
unhandled();

// Define our menu templates (these are optional)
const trayMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [new MenuItem({ label: 'Quit App', role: 'quit' })];
const appMenuBarMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
  { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
  { role: 'viewMenu' },
];

// Get Config options from capacitor.config
const capacitorFileConfig: CapacitorElectronConfig = getCapacitorElectronConfig();

// Initialize our app. You can pass menu templates into the app here.
// const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig);
const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig, trayMenuTemplate, appMenuBarMenuTemplate);

// If deeplinking is enabled then we will set it up here.
if (capacitorFileConfig.electron?.deepLinkingEnabled) {
  setupElectronDeepLinking(myCapacitorApp, {
    customProtocol: capacitorFileConfig.electron.deepLinkingCustomProtocol ?? 'mycapacitorapp',
  });
}

// If we are in Dev mode, use the file watcher components.
if (electronIsDev) {
  setupReloadWatcher(myCapacitorApp);
}

// Run Application
(async () => {
  // Wait for electron app to be ready.
  await app.whenReady();
  // Security - Set Content-Security-Policy based on whether or not we are in dev mode.
  setupContentSecurityPolicy(myCapacitorApp.getCustomURLScheme());
  // Initialize our app, build windows, and load content.
  await myCapacitorApp.init();
  // Check for updates if we are in a packaged app.
  // Disabled for now - enable when you publish releases on GitHub
  // if (!electronIsDev) {
  //   autoUpdater.checkForUpdatesAndNotify().catch((error) => {
  //     console.log('Auto-updater error (ignored):', error.message);
  //   });
  // }
})();

// Handle when all of our windows are close (platforms have their own expectations).
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When the dock icon is clicked.
app.on('activate', async function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (myCapacitorApp.getMainWindow().isDestroyed()) {
    await myCapacitorApp.init();
  }
});

// Place all ipc or other electron api calls and custom functionality under this line

import { ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app as electronApp } from 'electron';

// Get app's local storage directory (for internal app storage)
function getLocalStoragePath(): string {
  return electronApp.getPath('userData');
}

// Get user's Documents directory (for external "Save As to Device")
function getDocumentsPath(): string {
  return electronApp.getPath('documents');
}

// File picker for opening external files with write access
ipcMain.handle('file:pick-external', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'enc'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('File selection cancelled');
  }

  const filePath = result.filePaths[0];

  try {
    // Read file as binary buffer first
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);

    // Try to detect if this is a binary file by checking for null bytes and control characters
    const sample = buffer.slice(0, Math.min(1000, buffer.length));
    const isBinary = sample.some(byte => byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13));

    let content: string;
    if (isBinary) {
      // Read as binary and encode to base64
      content = buffer.toString('base64');
      console.log('[Electron] File detected as binary, encoded to base64');
    } else {
      // Read as UTF-8 text
      content = buffer.toString('utf-8');
      console.log('[Electron] File detected as text');
    }

    return {
      uri: filePath,
      name: path.basename(filePath),
      content: content,
      mimeType: 'text/plain',
      size: stats.size,
      isBinary: isBinary,
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Write to external file
ipcMain.handle('file:write-external', async (_event, filePath: string, content: string, isBinary?: boolean) => {
  try {
    if (isBinary) {
      // Decode base64 and write as binary
      const buffer = Buffer.from(content, 'base64');
      await fs.writeFile(filePath, buffer);
    } else {
      // Write as text
      await fs.writeFile(filePath, content, 'utf-8');
    }
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Create new document
ipcMain.handle('file:create-external', async (_event, filename: string, content: string, isBinary?: boolean) => {
  const result = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'enc'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    throw new Error('Save cancelled');
  }

  const filePath = result.filePath;

  try {
    // Write file content
    if (isBinary) {
      // Decode base64 and write as binary
      const buffer = Buffer.from(content, 'base64');
      await fs.writeFile(filePath, buffer);
    } else {
      // Write as text
      await fs.writeFile(filePath, content, 'utf-8');
    }

    return {
      uri: filePath,
      name: path.basename(filePath),
    };
  } catch (error) {
    throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Local file operations (App's private storage - userData directory)
// Read file from local storage
ipcMain.handle('file:read-local', async (_event, filename: string) => {
  try {
    const filePath = path.join(getLocalStoragePath(), filename);
    const content = await fs.readFile(filePath, 'utf-8');
    console.log('[Electron] Read local file from userData:', filename);
    return { content };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Write file to local storage
ipcMain.handle('file:write-local', async (_event, filename: string, content: string) => {
  try {
    const filePath = path.join(getLocalStoragePath(), filename);
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');
    console.log('[Electron] Wrote local file to userData:', filename);
    console.log('[Electron] Full path:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// List files in local storage
ipcMain.handle('file:list-local', async () => {
  try {
    const localPath = getLocalStoragePath();
    // Ensure directory exists
    await fs.mkdir(localPath, { recursive: true });
    const files = await fs.readdir(localPath);
    console.log('[Electron] Listed local files from userData, count:', files.length);
    return { files };
  } catch (error) {
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Check if file exists in local storage
ipcMain.handle('file:exists-local', async (_event, filename: string) => {
  try {
    const filePath = path.join(getLocalStoragePath(), filename);
    await fs.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

// Delete file from local storage
ipcMain.handle('file:delete-local', async (_event, filename: string) => {
  try {
    const filePath = path.join(getLocalStoragePath(), filename);
    await fs.unlink(filePath);
    console.log('[Electron] Deleted local file from userData:', filename);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
