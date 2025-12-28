import { registerPlugin } from '@capacitor/core';

import type { FileWriterPlugin } from './definitions';

const FileWriter = registerPlugin<FileWriterPlugin>('FileWriter', {
  web: () => import('./web').then(m => new m.FileWriterWeb()),
  electron: () => import('./electron').then(m => new m.FileWriterElectron()),
});

export * from './definitions';
export { FileWriter };
