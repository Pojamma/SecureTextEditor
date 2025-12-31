import { WebPlugin } from '@capacitor/core';
import type { FileWriterPlugin } from './definitions';

export class FileWriterElectron extends WebPlugin implements FileWriterPlugin {
  async writeToUri(options: { uri: string; content: string; isBinary?: boolean }): Promise<{ success: boolean }> {
    try {
      // @ts-ignore - electron IPC is available in Electron context
      const result = await window.electronAPI?.invoke('file:write-external', options.uri, options.content, options.isBinary);
      return result || { success: true };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async takePersistablePermission(_options: { uri: string }): Promise<{ success: boolean }> {
    // Not needed on Electron - files are directly accessible
    return { success: true };
  }

  async pickDocument(): Promise<{ uri: string; name: string; content: string; mimeType: string; isBinary: boolean }> {
    try {
      // @ts-ignore - electron IPC is available in Electron context
      const result = await window.electronAPI?.invoke('file:pick-external');
      const isEncFile = result.name?.toLowerCase().endsWith('.enc') || false;
      return {
        ...result,
        isBinary: isEncFile,
      };
    } catch (error) {
      throw new Error(`Failed to pick document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDocument(options: {
    filename: string;
    content: string;
    isBinary?: boolean;
    mimeType?: string;
  }): Promise<{ uri: string; name: string }> {
    try {
      // @ts-ignore - electron IPC is available in Electron context
      const result = await window.electronAPI?.invoke('file:create-external', options.filename, options.content, options.isBinary);
      return result;
    } catch (error) {
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
