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
  // On web, use Documents
  return platform === 'web' ? Directory.Documents : Directory.Data;
};
import { EncryptedDocument, PlainDocument, OpenDocument } from '@/types/document.types';
import { encryptDocument, decryptDocument, isEncrypted } from './encryption.service';
import { generateId, formatDate } from '@/utils/helpers';
import { pickExternalFile, checkExternalFileAccess as checkExternalUri, saveToExternalUri } from './externalFilesystem.service';

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
      return {
        document: {
          id: generateId(),
          path: path,
          source: 'local',
          encrypted: false,
          content: plainDoc.content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: plainDoc.metadata,
        },
        requiresPassword: false,
      };
    } else {
      // Plain text file
      return {
        document: {
          id: generateId(),
          path: path,
          source: 'local',
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
        },
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

    return {
      id: generateId(),
      path: path,
      source: 'local',
      encrypted: true,
      content: plainDoc.content,
      modified: false,
      cursorPosition: 0,
      scrollPosition: 0,
      metadata: plainDoc.metadata,
    };
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

    if (document.encrypted && password) {
      // Encrypt and save
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          modified: formatDate(),
        },
      };

      const encryptedDoc = await encryptDocument(plainDoc, password);
      content = JSON.stringify(encryptedDoc, null, 2);
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
    }

    await Filesystem.writeFile({
      path: path,
      data: content,
      directory: getDirectory(),
      encoding: Encoding.UTF8,
      recursive: true, // Create parent directories if needed
    });
  } catch (error) {
    console.error('Error saving file:', error);
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
  encryptedData?: EncryptedDocument;
}> {
  try {
    const fileData = await pickExternalFile();

    console.log('[FS] External file picked:', {
      filename: fileData.filename,
      contentLength: fileData.content.length,
      contentPreview: fileData.content.substring(0, 200),
    });

    // Try to parse as JSON (could be encrypted or PlainDocument format)
    let parsedData;
    try {
      parsedData = JSON.parse(fileData.content);
      console.log('[FS] Parsed JSON successfully:', {
        hasEncrypted: 'encrypted' in parsedData,
        encryptedValue: parsedData.encrypted,
        hasCiphertext: 'ciphertext' in parsedData,
        hasSalt: 'salt' in parsedData,
        hasIv: 'iv' in parsedData,
        keys: Object.keys(parsedData),
      });
    } catch (error) {
      console.log('[FS] Failed to parse as JSON:', error);
      parsedData = null;
    }

    // Check if file is encrypted
    const isEncryptedFile = parsedData && isEncrypted(parsedData);
    console.log('[FS] Is encrypted file:', isEncryptedFile);

    if (isEncryptedFile) {
      console.log('[FS] Returning encrypted file, will prompt for password');
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
      return {
        document: {
          id: generateId(),
          path: fileData.filename,
          source: 'external',
          encrypted: false,
          content: plainDoc.content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          externalUri: fileData.uri,
          metadata: plainDoc.metadata,
        },
        requiresPassword: false,
      };
    } else {
      // Plain text file
      return {
        document: {
          id: generateId(),
          path: fileData.filename,
          source: 'external',
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
        },
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
 */
export async function decryptExternalFile(
  encryptedData: EncryptedDocument,
  password: string,
  filename: string,
  uri: string
): Promise<OpenDocument> {
  try {
    const plainDoc = await decryptDocument(encryptedData, password);

    return {
      id: generateId(),
      path: filename,
      source: 'external',
      encrypted: true,
      content: plainDoc.content,
      modified: false,
      cursorPosition: 0,
      scrollPosition: 0,
      externalUri: uri,
      metadata: plainDoc.metadata,
    };
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file. Wrong password or corrupted file.');
  }
}

/**
 * Save external file back to its original location
 * Writes the file content back to the external URI
 */
export async function saveExternalFile(document: OpenDocument, password?: string): Promise<void> {
  if (!document.externalUri) {
    throw new Error('Document does not have an external URI');
  }

  try {
    let content: string;

    if (document.encrypted && password) {
      // Encrypt and save
      const plainDoc: PlainDocument = {
        content: document.content,
        metadata: {
          ...document.metadata,
          modified: formatDate(),
        },
      };

      const encryptedDoc = await encryptDocument(plainDoc, password);
      content = JSON.stringify(encryptedDoc, null, 2);
    } else if (document.encrypted && !password) {
      throw new Error('Password required to save encrypted document');
    } else {
      // For plain text files that were originally plain text (not in JSON format),
      // save as plain text. Otherwise save as JSON.
      // We can detect this by checking if the file had metadata when opened
      const hasStructuredMetadata = document.metadata.created !== document.metadata.modified;

      if (hasStructuredMetadata) {
        // Save as JSON format
        const plainDoc: PlainDocument = {
          content: document.content,
          metadata: {
            ...document.metadata,
            modified: formatDate(),
          },
        };
        content = JSON.stringify(plainDoc, null, 2);
      } else {
        // Save as plain text (original format)
        content = document.content;
      }
    }

    // Write back to the external URI
    await saveToExternalUri(document.externalUri, content);
  } catch (error) {
    console.error('Error saving external file:', error);
    throw new Error(
      `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
  checkExternalFileAccess: checkExternalUri,
};
