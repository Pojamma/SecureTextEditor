/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly BUILD_TIME: string;
  readonly APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
