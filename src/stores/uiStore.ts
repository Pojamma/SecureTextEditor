import { create } from 'zustand';

interface DialogState {
  passwordDialog: boolean;
  filePickerDialog: boolean;
  settingsDialog: boolean;
  aboutDialog: boolean;
  statisticsDialog: boolean;
  specialCharDialog: boolean;
}

interface MenuState {
  hamburgerMenu: boolean;
  fileMenu: boolean;
  editMenu: boolean;
  viewMenu: boolean;
  securityMenu: boolean;
  toolsMenu: boolean;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  lineNumber: number;
  lineText: string;
  matchIndex: number;
  matchLength: number;
}

interface UIState {
  // Dialog visibility
  dialogs: DialogState;

  // Menu visibility
  menus: MenuState;

  // Search state
  searchVisible: boolean;
  searchQuery: string;

  // Search All Tabs state
  searchAllTabsVisible: boolean;
  searchAllTabsQuery: string;
  searchAllTabsResults: SearchResult[];
  searchAllTabsCaseSensitive: boolean;
  searchAllTabsWholeWord: boolean;

  // Loading states
  loading: boolean;
  loadingMessage: string;

  // Notifications
  notification: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    visible: boolean;
  };

  // Actions
  openDialog: (dialog: keyof DialogState) => void;
  closeDialog: (dialog: keyof DialogState) => void;
  closeAllDialogs: () => void;

  toggleMenu: (menu: keyof MenuState) => void;
  closeAllMenus: () => void;

  showSearch: () => void;
  hideSearch: () => void;
  setSearchQuery: (query: string) => void;

  showSearchAllTabs: () => void;
  hideSearchAllTabs: () => void;
  setSearchAllTabsQuery: (query: string) => void;
  setSearchAllTabsResults: (results: SearchResult[]) => void;
  setSearchAllTabsOptions: (caseSensitive: boolean, wholeWord: boolean) => void;

  setLoading: (loading: boolean, message?: string) => void;

  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideNotification: () => void;
}

const initialDialogs: DialogState = {
  passwordDialog: false,
  filePickerDialog: false,
  settingsDialog: false,
  aboutDialog: false,
  statisticsDialog: false,
  specialCharDialog: false,
};

const initialMenus: MenuState = {
  hamburgerMenu: false,
  fileMenu: false,
  editMenu: false,
  viewMenu: false,
  securityMenu: false,
  toolsMenu: false,
};

export const useUIStore = create<UIState>((set) => ({
  dialogs: initialDialogs,
  menus: initialMenus,
  searchVisible: false,
  searchQuery: '',
  searchAllTabsVisible: false,
  searchAllTabsQuery: '',
  searchAllTabsResults: [],
  searchAllTabsCaseSensitive: false,
  searchAllTabsWholeWord: false,
  loading: false,
  loadingMessage: '',
  notification: {
    message: '',
    type: 'info',
    visible: false,
  },

  openDialog: (dialog) => set((state) => ({
    dialogs: { ...state.dialogs, [dialog]: true },
  })),

  closeDialog: (dialog) => set((state) => ({
    dialogs: { ...state.dialogs, [dialog]: false },
  })),

  closeAllDialogs: () => set({
    dialogs: initialDialogs,
  }),

  toggleMenu: (menu) => set((state) => ({
    menus: { ...state.menus, [menu]: !state.menus[menu] },
  })),

  closeAllMenus: () => set({
    menus: initialMenus,
  }),

  showSearch: () => set({ searchVisible: true }),

  hideSearch: () => set({ searchVisible: false, searchQuery: '' }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  showSearchAllTabs: () => set({ searchAllTabsVisible: true }),

  hideSearchAllTabs: () => set({
    searchAllTabsVisible: false,
    searchAllTabsQuery: '',
    searchAllTabsResults: [],
  }),

  setSearchAllTabsQuery: (query) => set({ searchAllTabsQuery: query }),

  setSearchAllTabsResults: (results) => set({ searchAllTabsResults: results }),

  setSearchAllTabsOptions: (caseSensitive, wholeWord) => set({
    searchAllTabsCaseSensitive: caseSensitive,
    searchAllTabsWholeWord: wholeWord,
  }),

  setLoading: (loading, message = '') => set({
    loading,
    loadingMessage: message,
  }),

  showNotification: (message, type = 'info') => set({
    notification: { message, type, visible: true },
  }),

  hideNotification: () => set((state) => ({
    notification: { ...state.notification, visible: false },
  })),
}));
