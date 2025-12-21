import { Theme } from '@/types/settings.types';

export const themes: Record<string, Theme> = {
  light: {
    name: 'Light',
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#1976D2',
      secondary: '#424242',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
      accent: '#2196F3',
      error: '#D32F2F',
      success: '#388E3C',
    },
    editor: {
      background: '#FAFAFA',
      text: '#000000',
      selection: '#B3D9FF',
      lineNumber: '#999999',
      cursor: '#000000',
    },
  },

  dark: {
    name: 'Dark',
    colors: {
      background: '#1E1E1E',
      surface: '#2D2D30',
      primary: '#007ACC',
      secondary: '#3E3E42',
      text: '#D4D4D4',
      textSecondary: '#858585',
      border: '#3E3E42',
      accent: '#0098FF',
      error: '#F44747',
      success: '#4EC9B0',
    },
    editor: {
      background: '#252526',
      text: '#D4D4D4',
      selection: '#264F78',
      lineNumber: '#858585',
      cursor: '#AEAFAD',
    },
  },

  solarizedLight: {
    name: 'Solarized Light',
    colors: {
      background: '#FDF6E3',
      surface: '#EEE8D5',
      primary: '#268BD2',
      secondary: '#93A1A1',
      text: '#657B83',
      textSecondary: '#93A1A1',
      border: '#EEE8D5',
      accent: '#2AA198',
      error: '#DC322F',
      success: '#859900',
    },
    editor: {
      background: '#FDF6E3',
      text: '#657B83',
      selection: '#EEE8D5',
      lineNumber: '#93A1A1',
      cursor: '#657B83',
    },
  },

  solarizedDark: {
    name: 'Solarized Dark',
    colors: {
      background: '#002B36',
      surface: '#073642',
      primary: '#268BD2',
      secondary: '#586E75',
      text: '#839496',
      textSecondary: '#586E75',
      border: '#073642',
      accent: '#2AA198',
      error: '#DC322F',
      success: '#859900',
    },
    editor: {
      background: '#002B36',
      text: '#839496',
      selection: '#073642',
      lineNumber: '#586E75',
      cursor: '#839496',
    },
  },

  dracula: {
    name: 'Dracula',
    colors: {
      background: '#282A36',
      surface: '#383A59',
      primary: '#BD93F9',
      secondary: '#44475A',
      text: '#F8F8F2',
      textSecondary: '#6272A4',
      border: '#44475A',
      accent: '#FF79C6',
      error: '#FF5555',
      success: '#50FA7B',
    },
    editor: {
      background: '#282A36',
      text: '#F8F8F2',
      selection: '#44475A',
      lineNumber: '#6272A4',
      cursor: '#F8F8F2',
    },
  },

  nord: {
    name: 'Nord',
    colors: {
      background: '#2E3440',
      surface: '#3B4252',
      primary: '#88C0D0',
      secondary: '#4C566A',
      text: '#ECEFF4',
      textSecondary: '#D8DEE9',
      border: '#4C566A',
      accent: '#81A1C1',
      error: '#BF616A',
      success: '#A3BE8C',
    },
    editor: {
      background: '#2E3440',
      text: '#ECEFF4',
      selection: '#434C5E',
      lineNumber: '#4C566A',
      cursor: '#ECEFF4',
    },
  },
};

export const getTheme = (themeName: string): Theme => {
  return themes[themeName] || themes.dark;
};

export const themeNames = Object.keys(themes);
