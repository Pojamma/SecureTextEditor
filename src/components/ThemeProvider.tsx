import React, { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { getTheme } from '@/utils/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const currentTheme = getTheme(theme);
    const root = document.documentElement;

    // Apply theme colors as CSS variables
    root.style.setProperty('--color-background', currentTheme.colors.background);
    root.style.setProperty('--color-surface', currentTheme.colors.surface);
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-text-secondary', currentTheme.colors.textSecondary);
    root.style.setProperty('--color-border', currentTheme.colors.border);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    root.style.setProperty('--color-error', currentTheme.colors.error);
    root.style.setProperty('--color-success', currentTheme.colors.success);

    // Apply editor colors
    root.style.setProperty('--editor-background', currentTheme.editor.background);
    root.style.setProperty('--editor-text', currentTheme.editor.text);
    root.style.setProperty('--editor-selection', currentTheme.editor.selection);
    root.style.setProperty('--editor-line-number', currentTheme.editor.lineNumber);
    root.style.setProperty('--editor-cursor', currentTheme.editor.cursor);
  }, [theme]);

  return <>{children}</>;
};
