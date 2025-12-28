import { WebPlugin } from '@capacitor/core';
import type { FileWriterPlugin } from './definitions';

export class FileWriterElectron extends WebPlugin implements FileWriterPlugin {
  async writeToUri(options: { uri: string; content: string }): Promise<{ success: boolean }> {
    try {
      // @ts-ignore - electron IPC is available in Electron context
      const result = await window.electronAPI?.invoke('file:write-external', options.uri, options.content);
      return result || { success: true };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async takePersistablePermission(_options: { uri: string }): Promise<{ success: boolean }> {
    // Not needed on Electron - files are directly accessible
    return { success: true };
  }

  async pickDocument(): Promise<{ uri: string; name: string; content: string; mimeType: string }> {
    try {
      // @ts-ignore - electron IPC is available in Electron context
      const result = await window.electronAPI?.invoke('file:pick-external');
      return result;
    } catch (error) {
      throw new Error(`Failed to pick document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
