/**
 * External Filesystem Service
 *
 * Handles file operations for external files accessed via native file pickers
 * Supports both Android (SAF content:// URIs) and Windows (file:// paths)
 */

import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import FileWriter from '@/plugins/fileWriter';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Pick a file from device storage using native picker
 * Returns file info including URI and content
 */
export async function pickExternalFile(): Promise<{
  uri: string;
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}> {
  // Request permissions first (Android only, auto-handled by plugin on other platforms)
  // Note: The plugin handles permissions automatically in newer versions

  // Pick file using native picker
  const result = await FilePicker.pickFiles({
    types: ['text/*', 'application/json', 'application/octet-stream'], // Include various text file types
    readData: true, // Get base64 content
  });

  if (!result.files || result.files.length === 0) {
    throw new Error('No file selected');
  }

  const file = result.files[0];

  // Check file size
  const size = file.size || 0;
  if (size > MAX_FILE_SIZE) {
    const sizeInMB = (size / 1024 / 1024).toFixed(2);
    // For now, just warn - could add user confirmation dialog in the future
    console.warn(`Large file selected: ${sizeInMB}MB. This may impact performance.`);
  }

  // Decode base64 content to string
  let content: string;
  try {
    content = file.data ? atob(file.data) : '';
  } catch (error) {
    throw new Error('Failed to read file content. This may be a binary file.');
  }

  // Validate that it's text content (basic check for binary files)
  const isBinary = /[\x00-\x08\x0E-\x1F]/.test(content.substring(0, 1000));
  if (isBinary) {
    throw new Error('This file appears to be a binary file. Please select a text file.');
  }

  return {
    uri: file.path || '',
    filename: file.name || 'Untitled.txt',
    content: content,
    mimeType: file.mimeType || 'text/plain',
    size: size,
  };
}

/**
 * Check if file at URI is accessible
 * Used for session restoration to validate external files are still available
 */
export async function checkExternalFileAccess(uri: string): Promise<boolean> {
  if (!uri) return false;

  try {
    // Try to stat the file
    await Filesystem.stat({ path: uri });
    return true;
  } catch {
    // File not accessible
    return false;
  }
}

/**
 * Save content to external URI
 * Writes content back to the original file location
 */
export async function saveToExternalUri(uri: string, content: string): Promise<void> {
  const platform = Capacitor.getPlatform();

  if (platform === 'android' && uri.startsWith('content://')) {
    // Use native plugin for Android content:// URIs
    try {
      await FileWriter.writeToUri({ uri, content });
    } catch (error) {
      throw new Error(
        `Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } else if (platform === 'web') {
    // Web platform doesn't support writing to arbitrary URIs
    throw new Error('Writing to external files is not supported on web platform');
  } else {
    // For other platforms (Windows/Electron), use standard file system API
    // The uri should be a file:// path
    try {
      const filePath = uri.replace('file://', '');
      await Filesystem.writeFile({
        path: filePath,
        data: content,
        encoding: 'utf8' as any,
      });
    } catch (error) {
      throw new Error(
        `Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

