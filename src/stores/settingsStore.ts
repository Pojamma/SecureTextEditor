import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '@/types/settings.types';

interface SettingsState extends AppSettings {
  // Actions
  setTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: 1 | 2 | 5 | 10) => void;
  toggleSpecialChars: () => void;
  toggleLineNumbers: () => void;
  toggleStatusBar: () => void;
  toggleWordWrap: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Consolas, Courier New, monospace',
  autoSave: true,
  autoSaveInterval: 5,
  sessionRecovery: true,
  specialCharsVisible: false,
  lineNumbers: false,
  statusBar: true,
  wordWrap: true,
  tabSize: 4,
  maxTabs: 10,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),

      setFontSize: (fontSize) => set({ fontSize }),

      setFontFamily: (fontFamily) => set({ fontFamily }),

      setAutoSave: (autoSave) => set({ autoSave }),

      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),

      toggleSpecialChars: () => set((state) => ({
        specialCharsVisible: !state.specialCharsVisible
      })),

      toggleLineNumbers: () => set((state) => ({
        lineNumbers: !state.lineNumbers
      })),

      toggleStatusBar: () => set((state) => ({
        statusBar: !state.statusBar
      })),

      toggleWordWrap: () => set((state) => ({
        wordWrap: !state.wordWrap
      })),

      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings,
      })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'securetexteditor-settings',
    }
  )
);
