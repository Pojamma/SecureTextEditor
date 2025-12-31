import { WebPlugin } from '@capacitor/core';

import type { FileWriterPlugin } from './definitions';

export class FileWriterWeb extends WebPlugin implements FileWriterPlugin {
  async writeToUri(_options: { uri: string; content: string; isBinary?: boolean }): Promise<{ success: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  async takePersistablePermission(_options: { uri: string }): Promise<{ success: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  async pickDocument(): Promise<{ uri: string; name: string; content: string; mimeType: string; isBinary: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  async createDocument(_options: {
    filename: string;
    content: string;
    isBinary?: boolean;
    mimeType?: string;
  }): Promise<{ uri: string; name: string }> {
    throw this.unimplemented('Not implemented on web.');
  }
}
