/**
 * FileWriter Plugin
 * Native plugin for writing to external file URIs (Android content:// URIs)
 */

import { registerPlugin } from '@capacitor/core';

export interface FileWriterPlugin {
  writeToUri(options: { uri: string; content: string }): Promise<{ success: boolean }>;
}

const FileWriter = registerPlugin<FileWriterPlugin>('FileWriter', {
  web: () => import('./fileWriter.web').then(m => new m.FileWriterWeb()),
});

export default FileWriter;
