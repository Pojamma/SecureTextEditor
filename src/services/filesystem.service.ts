/**
 * Filesystem Service
 *
 * Handles local file operations using Capacitor Filesystem API
 * Supports both plain text and encrypted files
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { EncryptedDocument, PlainDocument, OpenDocument } from '@/types/document.types';
import { encryptDocument, decryptDocument, isEncrypted } from './encryption.service';
import { generateId, formatDate } from '@/utils/helpers';

/**
 * Read a file from the filesystem
 * Automatically detects if file is encrypted
 */
export async function readFile(
  path: string
): Promise<{ document: OpenDocument; requiresPassword: boolean; encryptedData?: EncryptedDocument }> {
  try {
    // Read file content
    const result = await Filesystem.readFile({
      path: path,
      directory: Directory.Documents,
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
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
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
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
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
      directory: Directory.Documents,
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
      directory: Directory.Documents,
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
      directory: Directory.Documents,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  getFileExtension,
};
