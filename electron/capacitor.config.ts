import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pojamma.securetexteditor',
  appName: 'SecureTextEditor',
  webDir: 'dist',
  plugins: {
    Filesystem: {
      androidDisplayName: 'SecureTextEditor Storage'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e3a8a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#3b82f6',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
