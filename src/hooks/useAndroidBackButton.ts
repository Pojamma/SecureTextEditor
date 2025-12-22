import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to handle Android back button behavior
 *
 * Priority order when back button is pressed:
 * 1. Close open dialogs if any
 * 2. Close hamburger menu if open
 * 3. Close search panel if open
 * 4. Exit app
 */
export const useAndroidBackButton = (options: {
  onBackPress?: () => boolean; // Return true if handled, false to allow default
}) => {
  useEffect(() => {
    // Only set up back button listener on Android
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const setupBackButtonListener = async () => {
      const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // If a custom handler is provided and it handles the event, don't proceed
        if (options.onBackPress && options.onBackPress()) {
          return;
        }

        // If we can't go back in the webview, exit the app
        if (!canGoBack) {
          CapacitorApp.exitApp();
        }
      });

      return listener;
    };

    let listenerPromise = setupBackButtonListener();

    return () => {
      // Clean up the listener when component unmounts
      listenerPromise.then(listener => {
        if (listener) {
          listener.remove();
        }
      });
    };
  }, [options.onBackPress]);
};
