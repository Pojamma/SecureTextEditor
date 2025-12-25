/**
 * External Filesystem Service
 *
 * Handles file operations for external files accessed via native file pickers
 * Supports both Android (SAF content:// URIs) and Windows (file:// paths)
 */

import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';

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
 * Note: On Android with content:// URIs, this will show a "Save As" picker
 * due to SAF limitations without native plugin extension
 */
export async function saveToExternalUri(): Promise<string> {
  // For now, just throw an error to trigger the "Save As" flow in the caller
  // because writing to content:// URIs requires additional native code
  throw new Error('SAVE_AS_REQUIRED');
}

/**
 * Pick a save location and write content
 * This is used for the "Save As" flow on all platforms
 */
export async function pickSaveLocationAndWrite(): Promise<{
  uri: string;
  filename: string;
}> {
  // Note: The @capawesome/capacitor-file-picker plugin doesn't have a built-in
  // "save file" picker. For now, we'll return an error indicating this needs
  // to be handled differently (e.g., via the existing "Save As" flow that copies
  // to app storage, or wait for a future enhancement with a save-specific plugin)

  throw new Error(
    'External file saving requires selecting save location. ' +
    'Use "Save As" to save to app storage, or this feature will be enhanced in a future update.'
  );
}
