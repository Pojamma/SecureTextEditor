import { WebPlugin } from '@capacitor/core';

import type { FileWriterPlugin } from './definitions';

export class FileWriterWeb extends WebPlugin implements FileWriterPlugin {
  async writeToUri(_options: { uri: string; content: string }): Promise<{ success: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  async takePersistablePermission(_options: { uri: string }): Promise<{ success: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  async pickDocument(): Promise<{ uri: string; name: string; content: string; mimeType: string }> {
    throw this.unimplemented('Not implemented on web.');
  }
}
