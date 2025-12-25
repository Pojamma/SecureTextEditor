/**
 * Web implementation of FileWriter plugin
 * For web platform, we'll use the Filesystem API with file:// paths
 */

import { WebPlugin } from '@capacitor/core';
import { FileWriterPlugin } from './fileWriter';

export class FileWriterWeb extends WebPlugin implements FileWriterPlugin {
  async writeToUri(_options: { uri: string; content: string }): Promise<{ success: boolean }> {
    // On web, writing to arbitrary URIs is not supported due to browser security
    // This would need to use the File System Access API or similar
    throw new Error('Writing to external URIs is not supported on web platform');
  }
}
