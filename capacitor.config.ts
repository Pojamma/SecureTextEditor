import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pojamma.securetexteditor',
  appName: 'SecureTextEditor',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Filesystem: {
      androidDisplayName: 'SecureTextEditor Storage'
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#1E1E1E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
