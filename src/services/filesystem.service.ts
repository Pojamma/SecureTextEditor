/**
 * Filesystem Service
 *
 * Handles local file operations using Capacitor Filesystem API
 * Supports both plain text and encrypted files
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// Use app data directory on mobile (no permissions needed), Documents on web
const getDirectory = () => {
  const platform = Capacitor.getPlatform();
  // On mobile, use app's private data directory (no permissions needed)
  // On web/electron, use Documents (which maps to IndexedDB on web)
  return platform === 'web' || platform === 'electron' ? Directory.Documents : Directory.Data;
};
import { EncryptedDocument, PlainDocument, OpenDocument } from '@/types/document.types';
import { encryptDocument, decryptDocument, isEncrypted, encryptToBinary, decryptFromBinary, isBinaryEncrypted } from './encryption.service';
import { generateId, formatDate } from '@/utils/helpers';
import { pickExternalFile, checkExternalFileAccess as checkExternalUri, saveToExternalUri, saveAsToExternalDevice } from './externalFilesystem.service';
import { RecentFilesService } from './recentFiles.service';

// Re-export for convenience
export { checkExternalUri as checkExternalFileAccess };

/**
 * Check and request filesystem permissions (Android only)
 */
async function checkPermissions(): Promise<boolean> {
  // Only needed on Android
  if (Capacitor.getPlatform() !== 'android') {
    return true;
  }

  try {
    // Check permissions
    const permission = await Filesystem.checkPermissions();

    if (permission.publicStorage === 'granted') {
      return true;
    }

    // Request permissions if not granted
    const requested = await Filesystem.requestPermissions();
    return requested.publicStorage === 'granted';
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Read a file from the filesystem
 * Automatically detects if file is encrypted
 */
export async function readFile(
  path: string
): Promise<{ document: OpenDocument; requiresPassword: boolean; encryptedData?: EncryptedDocument }> {
  try {
    // Check permissions first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    // Read file content
    const result = await Filesystem.readFile({
      path: path,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
    });

    const content = result.data as string;

    // Try to parse as JSON (could be encrypted)
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      // Not JSON, treat as plain text
      parsedData = null;
    }

    // Check if file is encrypted
    if (parsedData && isEncrypted(parsedData)) {
      // Return encrypted document for password prompt
      return {
        document: {
          id: generateId(),
          path: path,
          source: 'local',
          encrypted: true,
          content: '',
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: {
            filename: getFilenameFromPath(path),
            created: parsedData.metadata.created,
            modified: parsedData.metadata.modified,
            encrypted: true,
          },
        },
        requiresPassword: true,
        encryptedData: parsedData,
      };
    } else if (parsedData && 'content' in parsedData && 'metadata' in parsedData) {
      // Plain document saved as JSON
      const plainDoc = parsedData as PlainDocument;
      const document = {
        id: generateId(),
        path: path,
        source: 'local' as const,
        encrypted: false,
        content: plainDoc.content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          ...plainDoc.metadata,
          // Always use the actual filename from the path, not the stored metadata
          // This ensures copied files show the correct name
          filename: getFilenameFromPath(path),
        },
      };

      // Add to recent files
      RecentFilesService.addRecentFile({
        filename: document.metadata.filename,
        path: path,
        source: 'local',
      });

      return {
        document,
        requiresPassword: false,
      };
    } else {
      // Plain text file
      const document = {
        id: generateId(),
        path: path,
        source: 'local' as const,
        encrypted: false,
        content: content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: getFilenameFromPath(path),
          created: formatDate(),
          modified: formatDate(),
        },
      };

      // Add to recent files
      RecentFilesService.addRecentFile({
        filename: document.metadata.filename,
        path: path,
        source: 'local',
      });

      return {
        document,
        requiresPassword: false,
      };
    }
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an encrypted document with password
 */
export async function decryptFile(
  encryptedData: EncryptedDocument,
  password: string,
  path: string
): Promise<OpenDocument> {
  try {
    const plainDoc = await decryptDocument(encryptedData, password);

    const document = {
      id: generateId(),
      path: path,
      source: 'local' as const,
      encrypted: true,
      content: plainDoc.content,
      modified: false,
      cursorPosition: 0,
      scrollPosition: 0,
      metadata: {
        ...plainDoc.metadata,
        // Always use the actual filename from the path, not the stored metadata
        // This ensures copied files show the correct name
        filename: getFilenameFromPath(path),
      },
    };

    // Add to recent files after successful decryption
    RecentFilesService.addRecentFile({
      filename: document.metadata.filename,
      path: path,
      source: 'local',
    });

    return document;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file. Wrong password or corrupted file.');
  }
}

/**
 * Save a file to the filesystem
 */
export async function saveFile(
  document: OpenDocument,
  password?: string
): Promise<void> {
  try {
    // Check permissions first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    let content: string;
    const path = document.path || `${document.metadata.filename}`;
    const platform = Capacitor.getPlatform();
    const directory = getDirectory();

    console.log('[FS] Saving file:', {
      path,
      platform,
      directory,
      encrypted: document.encrypted,
      hasPassword: !!password,
    });

    if (document.encrypted && password) {
      // Encrypt and save
      console.log('[FS] Encrypting document before save');
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          modified: formatDate(),
        },
      };

      const encryptedDoc = await encryptDocument(plainDoc, password);
      content = JSON.stringify(encryptedDoc, null, 2);
      console.log('[FS] Document encrypted, content length:', content.length);
    } else if (document.encrypted && !password) {
      throw new Error('Password required to save encrypted document');
    } else {
      // Save as plain JSON format (easier to parse later)
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          modified: formatDate(),
        },
      };
      content = JSON.stringify(plainDoc, null, 2);
      console.log('[FS] Saving plain document, content length:', content.length);
    }

    await Filesystem.writeFile({
      path: path,
      data: content,
      directory: directory,
      encoding: Encoding.UTF8,
      recursive: true, // Create parent directories if needed
    });

    console.log('[FS] File saved successfully to:', path);

    // Add to recent files after successful save
    RecentFilesService.addRecentFile({
      filename: document.metadata.filename,
      path: path,
      source: 'local',
    });
  } catch (error) {
    console.error('[FS] Error saving file:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save file with a new name (Save As)
 */
export async function saveFileAs(
  document: OpenDocument,
  newFilename: string,
  password?: string
): Promise<string> {
  try {
    // Check permissions first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    const newPath = newFilename;

    let content: string;

    if (document.encrypted && password) {
      // Encrypt and save
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          filename: newFilename,
          modified: formatDate(),
        },
      };

      const encryptedDoc = await encryptDocument(plainDoc, password);
      content = JSON.stringify(encryptedDoc, null, 2);
    } else if (document.encrypted && !password) {
      throw new Error('Password required to save encrypted document');
    } else {
      // Save as plain JSON format
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          filename: newFilename,
          modified: formatDate(),
        },
      };
      content = JSON.stringify(plainDoc, null, 2);
    }

    await Filesystem.writeFile({
      path: newPath,
      data: content,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
      recursive: true, // Create parent directories if needed
    });

    // Add to recent files after successful save
    RecentFilesService.addRecentFile({
      filename: newFilename,
      path: newPath,
      source: 'local',
    });

    return newPath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await Filesystem.stat({
      path: path,
      directory: getDirectory(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in Documents directory
 */
export async function listFiles(): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({
      path: '',
      directory: getDirectory(),
    });

    return result.files
      .filter((file) => !file.name.startsWith('.'))
      .map((file) => file.name);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Delete a file
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: path,
      directory: getDirectory(),
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Rename a file
 */
export async function renameFile(oldPath: string, newFilename: string): Promise<void> {
  try {
    // Check permissions
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    // Check if new filename already exists
    const newPath = newFilename;
    const exists = await fileExists(newPath);
    if (exists) {
      throw new Error(`File "${newFilename}" already exists`);
    }

    // Read the file content
    const result = await Filesystem.readFile({
      path: oldPath,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
    });

    // Write to new filename
    await Filesystem.writeFile({
      path: newPath,
      data: result.data,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
      recursive: true,
    });

    // Delete old file
    await deleteFile(oldPath);
  } catch (error) {
    console.error('Error renaming file:', error);
    throw new Error(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Copy a file
 */
export async function copyFile(sourcePath: string, newFilename: string): Promise<void> {
  try {
    // Check permissions
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    // Check if new filename already exists
    const newPath = newFilename;
    const exists = await fileExists(newPath);
    if (exists) {
      throw new Error(`File "${newFilename}" already exists`);
    }

    // Read the file content
    const result = await Filesystem.readFile({
      path: sourcePath,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
    });

    // Write to new filename
    await Filesystem.writeFile({
      path: newPath,
      data: result.data,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch (error) {
    console.error('Error copying file:', error);
    throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Toggle encryption on a file (encrypt or decrypt)
 * If the file is encrypted, decrypt it and save as plain text
 * If the file is plain, encrypt it
 */
export async function toggleFileEncryption(
  path: string,
  password: string,
  shouldEncrypt: boolean
): Promise<void> {
  try {
    // Check permissions
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw new Error('Storage permission denied. Please grant storage access in settings.');
    }

    // Read the current file
    const fileResult = await readFile(path);

    if (shouldEncrypt && !fileResult.requiresPassword) {
      // Encrypt a plain file
      const plainDoc: PlainDocument = {
        content: fileResult.document.content,
        metadata: {
          ...fileResult.document.metadata,
          encrypted: true,
          modified: formatDate(),
        },
      };

      const encryptedDoc = await encryptDocument(plainDoc, password);
      const content = JSON.stringify(encryptedDoc, null, 2);

      await Filesystem.writeFile({
        path: path,
        data: content,
        directory: getDirectory(),
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else if (!shouldEncrypt && fileResult.requiresPassword && fileResult.encryptedData) {
      // Decrypt an encrypted file
      const decryptedDoc = await decryptDocument(fileResult.encryptedData, password);
      const plainDoc: PlainDocument = {
        content: decryptedDoc.content,
        metadata: {
          ...decryptedDoc.metadata,
          encrypted: false,
          modified: formatDate(),
        },
      };

      const content = JSON.stringify(plainDoc, null, 2);

      await Filesystem.writeFile({
        path: path,
        data: content,
        directory: getDirectory(),
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else {
      throw new Error('File is already in the requested encryption state');
    }
  } catch (error) {
    console.error('Error toggling file encryption:', error);
    throw new Error(`Failed to toggle encryption: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read external file (from anywhere on device) via native file picker
 * Returns document ready to be added to the store
 */
export async function readExternalFile(): Promise<{
  document: OpenDocument;
  requiresPassword: boolean;
  encryptedData?: EncryptedDocument | string; // Can be JSON format or binary format (base64)
}> {
  try {
    const fileData = await pickExternalFile();

    console.log('[FS] External file picked:', {
      filename: fileData.filename,
      contentLength: fileData.content.length,
      isBinary: fileData.isBinary,
    });

    // Check if this is a binary encrypted file (with or without .enc extension)
    if (isBinaryEncrypted(fileData.content)) {
      console.log('[FS] Binary encrypted file detected');
      return {
        document: {
          id: generateId(),
          path: fileData.filename,
          source: 'external',
          encrypted: true,
          content: '',
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          externalUri: fileData.uri,
          metadata: {
            filename: fileData.filename,
            created: formatDate(),
            modified: formatDate(),
            encrypted: true,
          },
        },
        requiresPassword: true,
        encryptedData: fileData.content, // Base64 binary data
      };
    }

    // Try to parse as JSON (could be encrypted or PlainDocument format - legacy)
    let parsedData;
    try {
      parsedData = JSON.parse(fileData.content);
      console.log('[FS] Parsed JSON successfully');
    } catch (error) {
      console.log('[FS] Not JSON format, treating as plain text');
      parsedData = null;
    }

    // Check if file is encrypted (legacy JSON format)
    const isEncryptedFile = parsedData && isEncrypted(parsedData);
    console.log('[FS] Is encrypted file (JSON format):', isEncryptedFile);

    if (isEncryptedFile) {
      console.log('[FS] Returning encrypted file (legacy JSON format), will prompt for password');
      return {
        document: {
          id: generateId(),
          path: fileData.filename,
          source: 'external',
          encrypted: true,
          content: '',
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          externalUri: fileData.uri,
          metadata: {
            filename: fileData.filename,
            created: parsedData.metadata.created,
            modified: parsedData.metadata.modified,
            encrypted: true,
          },
        },
        requiresPassword: true,
        encryptedData: parsedData,
      };
    } else if (parsedData && 'content' in parsedData && 'metadata' in parsedData) {
      // Plain document in JSON format
      const plainDoc = parsedData as PlainDocument;
      const document = {
        id: generateId(),
        path: fileData.filename,
        source: 'external' as const,
        encrypted: false,
        content: plainDoc.content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        externalUri: fileData.uri,
        metadata: plainDoc.metadata,
      };

      // Add to recent files
      RecentFilesService.addRecentFile({
        filename: fileData.filename,
        path: fileData.filename,
        source: 'external',
        externalUri: fileData.uri,
      });

      return {
        document,
        requiresPassword: false,
      };
    } else {
      // Plain text file
      const document = {
        id: generateId(),
        path: fileData.filename,
        source: 'external' as const,
        encrypted: false,
        content: fileData.content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        externalUri: fileData.uri,
        metadata: {
          filename: fileData.filename,
          created: formatDate(),
          modified: formatDate(),
        },
      };

      // Add to recent files
      RecentFilesService.addRecentFile({
        filename: fileData.filename,
        path: fileData.filename,
        source: 'external',
        externalUri: fileData.uri,
      });

      return {
        document,
        requiresPassword: false,
      };
    }
  } catch (error) {
    console.error('Error reading external file:', error);
    throw new Error(
      `Failed to open file from device: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypt an external encrypted file
 * Handles both binary format (base64 string) and legacy JSON format
 */
export async function decryptExternalFile(
  encryptedData: EncryptedDocument | string,
  password: string,
  filename: string,
  uri: string
): Promise<OpenDocument> {
  try {
    let content: string;

    // Check if this is binary format (base64 string) or JSON format
    if (typeof encryptedData === 'string') {
      // Binary format - decrypt from base64
      console.log('[FS] Decrypting binary format');
      content = await decryptFromBinary(encryptedData, password);
    } else {
      // Legacy JSON format
      console.log('[FS] Decrypting JSON format (legacy)');
      const plainDoc = await decryptDocument(encryptedData, password);
      content = plainDoc.content;
    }

    const document = {
      id: generateId(),
      path: filename,
      source: 'external' as const,
      encrypted: true,
      content: content,
      modified: false,
      cursorPosition: 0,
      scrollPosition: 0,
      externalUri: uri,
      metadata: {
        filename: filename,
        created: formatDate(),
        modified: formatDate(),
        encrypted: true,
      },
    };

    // Add to recent files after successful decryption
    RecentFilesService.addRecentFile({
      filename: filename,
      path: filename,
      source: 'external',
      externalUri: uri,
    });

    return document;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file. Wrong password or corrupted file.');
  }
}

/**
 * Save external file back to its original location
 * Writes the file content back to the external URI
 * Handles automatic renaming when encryption state changes
 */
export async function saveExternalFile(document: OpenDocument, password?: string): Promise<{
  newUri?: string;
  newFilename?: string;
}> {
  if (!document.externalUri) {
    throw new Error('Document does not have an external URI');
  }

  try {
    let content: string;
    let isBinary = false;
    let needsRename = false;
    let newFilename = document.metadata.filename;

    if (document.encrypted && password) {
      // Encrypt and save as binary format
      console.log('[FS] Encrypting to binary format');
      content = await encryptToBinary(document.content, password);
      isBinary = true;

      // Check if filename needs .enc extension
      if (!document.metadata.filename.toLowerCase().endsWith('.enc')) {
        needsRename = true;
        // Append .enc to filename (keep original extension)
        newFilename = document.metadata.filename + '.enc';
        console.log(`[FS] Renaming ${document.metadata.filename} → ${newFilename}`);
      }
    } else if (document.encrypted && !password) {
      throw new Error('Password required to save encrypted document');
    } else {
      // Save as plain text (restore original format)
      console.log('[FS] Saving as plain text');
      content = document.content;
      isBinary = false;

      // Check if filename has .enc extension that should be removed
      if (document.metadata.filename.toLowerCase().endsWith('.enc')) {
        needsRename = true;
        // Remove .enc extension, restore original or use .txt
        newFilename = document.metadata.filename.substring(0, document.metadata.filename.length - 4);
        // If no extension left, add .txt
        if (!newFilename.includes('.')) {
          newFilename = newFilename + '.txt';
        }
        console.log(`[FS] Renaming ${document.metadata.filename} → ${newFilename}`);
      }
    }

    if (needsRename) {
      // Rename the file by creating new and deleting old
      const newUri = await renameExternalFile(document.externalUri, newFilename, content, isBinary);

      // Update recent files with new filename
      RecentFilesService.addRecentFile({
        filename: newFilename,
        path: newFilename,
        source: 'external',
        externalUri: newUri,
      });

      return { newUri, newFilename };
    } else {
      // Write back to the same URI
      await saveToExternalUri(document.externalUri, content, isBinary);

      // Add/update in recent files
      RecentFilesService.addRecentFile({
        filename: document.metadata.filename,
        path: document.metadata.filename,
        source: 'external',
        externalUri: document.externalUri,
      });

      return {};
    }
  } catch (error) {
    console.error('Error saving external file:', error);
    throw new Error(
      `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Rename an external file by creating a new file and deleting the old one
 * This is necessary because we can't directly rename content:// URIs on Android
 */
async function renameExternalFile(
  oldUri: string,
  _newFilename: string,
  content: string,
  isBinary: boolean
): Promise<string> {
  // Note: This is a simplified implementation
  // For now, we'll just save to the same URI and return it
  // The actual file renaming should be done via the native file system
  // which requires platform-specific implementation

  console.warn('[FS] File renaming not yet fully implemented for external files');
  console.warn('[FS] Saving to same location with new content, but filename not changed');
  await saveToExternalUri(oldUri, content, isBinary);

  // TODO: Implement actual file renaming:
  // - On Android: Use DocumentsContract to create new file and delete old
  // - On Electron: Use fs.rename()

  return oldUri; // Return same URI for now
}

/**
 * Extract filename from path
 */
function getFilenameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || 'Untitled.txt';
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Save document as a new file to device storage
 * Prompts user to choose location and filename
 */
export async function saveAsToDevice(
  document: OpenDocument,
  password?: string
): Promise<{
  uri: string;
  filename: string;
}> {
  try {
    let content: string;
    let isBinary = false;
    let filename = document.metadata.filename;

    // If password provided, encrypt the document
    if (password) {
      console.log('[FS] Encrypting document for save as to device');
      content = await encryptToBinary(document.content, password);
      isBinary = true;

      // Ensure .enc extension
      if (!filename.toLowerCase().endsWith('.enc')) {
        // Append .enc to filename (keep original extension)
        filename = filename + '.enc';
      }
    } else {
      // Save as plain text
      console.log('[FS] Saving plain document to device');
      content = document.content;

      // Remove .enc extension if present
      if (filename.toLowerCase().endsWith('.enc')) {
        filename = filename.substring(0, filename.length - 4);
      }
    }

    // Use external filesystem service to create the document
    const result = await saveAsToExternalDevice(filename, content, isBinary);

    console.log('[FS] Document saved to device:', result.uri);

    return result;
  } catch (error) {
    console.error('[FS] Failed to save as to device:', error);
    throw new Error(
      `Failed to save to device: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Exported service object
 */
export const FilesystemService = {
  readFile,
  decryptFile,
  saveFile,
  saveFileAs,
  fileExists,
  listFiles,
  deleteFile,
  renameFile,
  copyFile,
  toggleFileEncryption,
  getFileExtension,
  readExternalFile,
  decryptExternalFile,
  saveExternalFile,
  saveAsToDevice,
  checkExternalFileAccess: checkExternalUri,
};
