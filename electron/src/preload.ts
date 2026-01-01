require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
console.log('User Preload!');

import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => {
    // Whitelist allowed channels for security
    const allowedChannels = [
      'file:pick-external',
      'file:write-external',
      'file:create-external',
      'file:read-local',
      'file:write-local',
      'file:list-local',
      'file:exists-local',
      'file:delete-local',
    ];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`IPC channel "${channel}" is not allowed`);
  },
});
