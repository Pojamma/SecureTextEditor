/**
 * External Filesystem Service
 *
 * Handles file operations for external files accessed via native file pickers
 * Supports both Android (SAF content:// URIs) and Windows (file:// paths)
 */

import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileWriter } from 'capacitor-file-writer';

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
  const platform = Capacitor.getPlatform();

  // Web platform doesn't support external file access
  if (platform === 'web') {
    throw new Error(
      'External file access is not available in web browser. ' +
        'Please use the native Android app or Windows desktop app.'
    );
  }

  // On Electron (Windows/Mac/Linux), use Electron's file picker
  if (platform === 'electron') {
    try {
      const result = await FileWriter.pickDocument();

      // Check file size
      const size = result.content.length;
      if (size > MAX_FILE_SIZE) {
        const sizeInMB = (size / 1024 / 1024).toFixed(2);
        console.warn(`Large file selected: ${sizeInMB}MB. This may impact performance.`);
      }

      // Validate that it's text content
      const isBinary = /[\x00-\x08\x0E-\x1F]/.test(result.content.substring(0, 1000));
      if (isBinary) {
        throw new Error('This file appears to be a binary file. Please select a text file.');
      }

      console.log('[ExternalFS] Document picked on Electron:', result.uri);

      return {
        uri: result.uri,
        filename: result.name || 'Untitled.txt',
        content: result.content,
        mimeType: result.mimeType || 'text/plain',
        size: size,
      };
    } catch (error) {
      throw new Error(
        `Failed to pick document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // On Android, use our custom document picker that requests write permissions
  if (platform === 'android') {
    try {
      const result = await FileWriter.pickDocument();

      // Check file size
      const size = result.content.length;
      if (size > MAX_FILE_SIZE) {
        const sizeInMB = (size / 1024 / 1024).toFixed(2);
        console.warn(`Large file selected: ${sizeInMB}MB. This may impact performance.`);
      }

      // Validate that it's text content (basic check for binary files)
      const isBinary = /[\x00-\x08\x0E-\x1F]/.test(result.content.substring(0, 1000));
      if (isBinary) {
        throw new Error('This file appears to be a binary file. Please select a text file.');
      }

      console.log('[ExternalFS] Document picked with write permissions:', result.uri);

      return {
        uri: result.uri,
        filename: result.name || 'Untitled.txt',
        content: result.content,
        mimeType: result.mimeType || 'text/plain',
        size: size,
      };
    } catch (error) {
      throw new Error(
        `Failed to pick document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // On other platforms, use the file picker plugin
  const result = await FilePicker.pickFiles({
    types: ['text/*', 'application/json', 'application/octet-stream'],
    readData: true,
  });

  if (!result.files || result.files.length === 0) {
    throw new Error('No file selected');
  }

  const file = result.files[0];

  // Check file size
  const size = file.size || 0;
  if (size > MAX_FILE_SIZE) {
    const sizeInMB = (size / 1024 / 1024).toFixed(2);
    console.warn(`Large file selected: ${sizeInMB}MB. This may impact performance.`);
  }

  // Decode base64 content to string
  let content: string;
  try {
    content = file.data ? atob(file.data) : '';
  } catch (error) {
    throw new Error('Failed to read file content. This may be a binary file.');
  }

  // Validate that it's text content
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
  console.log('[ExternalFS] Platform detected:', platform);
  console.log('[ExternalFS] URI:', uri);
  console.log('[ExternalFS] FileWriter plugin:', FileWriter);

  if (platform === 'android' && uri.startsWith('content://')) {
    // Use native plugin for Android content:// URIs
    console.log('[ExternalFS] Calling FileWriter.writeToUri for Android');
    try {
      const result = await FileWriter.writeToUri({ uri, content });
      console.log('[ExternalFS] Write successful:', result);
    } catch (error) {
      console.error('[ExternalFS] Write failed:', error);
      throw new Error(
        `Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } else if (platform === 'electron') {
    // Use FileWriter plugin for Electron (writes via IPC to main process)
    console.log('[ExternalFS] Calling FileWriter.writeToUri for Electron');
    try {
      const result = await FileWriter.writeToUri({ uri, content });
      console.log('[ExternalFS] Write successful:', result);
    } catch (error) {
      console.error('[ExternalFS] Write failed:', error);
      throw new Error(
        `Failed to write to file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } else if (platform === 'web') {
    // Web platform doesn't support writing to arbitrary URIs
    throw new Error('Writing to external files is not supported on web platform');
  } else {
    // Fallback for other platforms
    throw new Error(`External file writing is not supported on platform: ${platform}`);
  }
}

