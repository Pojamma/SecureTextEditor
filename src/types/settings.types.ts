export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    error: string;
    success: string;
  };
  editor: {
    background: string;
    text: string;
    selection: string;
    lineNumber: string;
    cursor: string;
  };
}

export interface AppSettings {
  theme: string;
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: 1 | 2 | 5 | 10;
  sessionRecovery: boolean;
  specialCharsVisible: boolean;
  lineNumbers: boolean;
  statusBar: boolean;
  wordWrap: boolean;
  tabSize: number;
  maxTabs: number;
}

export interface Session {
  openDocuments: Array<{
    path: string;
    source: 'local' | 'drive' | 'temp';
    encrypted: boolean;
    cursorPosition: number;
    scrollPosition: number;
    modified: boolean;
  }>;
  activeTabIndex: number;
  uiState: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    specialCharsVisible: boolean;
  };
  lastSaved: string;
}
