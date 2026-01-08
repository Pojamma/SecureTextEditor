import { useEffect, useState } from 'react';
import { Keyboard, KeyboardInfo, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

/**
 * Hook to manage keyboard interactions on mobile devices (Android/iOS)
 * Provides keyboard visibility state, height, and methods to control keyboard
 */
export const useKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    // Only set up keyboard listeners on native platforms
    // Electron and web should not use keyboard plugin
    const platform = Capacitor.getPlatform();
    if (platform === 'web' || platform === 'electron' || !Capacitor.isNativePlatform()) {
      return;
    }

    let showListener: any;
    let hideListener: any;

    // Set up listeners
    const setupListeners = async () => {
      try {
        // Listen for keyboard show event
        showListener = await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
          setKeyboardState({
            isVisible: true,
            height: info.keyboardHeight,
          });
        });

        // Listen for keyboard hide event
        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardState({
            isVisible: false,
            height: 0,
          });
        });
      } catch (error) {
        // Keyboard plugin not available on this platform - silently ignore
        console.log('Keyboard plugin not available on platform:', platform);
      }
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      if (showListener) showListener.remove();
      if (hideListener) hideListener.remove();
    };
  }, []);

  // Method to show keyboard programmatically
  const show = async () => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.show();
    }
  };

  // Method to hide keyboard programmatically
  const hide = async () => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide();
    }
  };

  // Method to set keyboard accessory bar visibility (iOS only, but safe to call)
  const setAccessoryBarVisible = async (visible: boolean) => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.setAccessoryBarVisible({ isVisible: visible });
    }
  };

  // Method to set keyboard resize mode
  const setResizeMode = async (mode: KeyboardResize) => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.setResizeMode({ mode });
    }
  };

  // Method to set whether keyboard should scroll into view
  const setScroll = async (enabled: boolean) => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.setScroll({ isDisabled: !enabled });
    }
  };

  return {
    ...keyboardState,
    show,
    hide,
    setAccessoryBarVisible,
    setResizeMode,
    setScroll,
    isNativePlatform: Capacitor.isNativePlatform(),
  };
};
