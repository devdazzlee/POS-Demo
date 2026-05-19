'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInstalled = isStandalone || (window.navigator as any).standalone;

    setState(prev => ({
      ...prev,
      isInstalled,
      isIOS,
      isStandalone,
    }));

    // Listen for the beforeinstallprompt event (Android/Desktop only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const deferredPrompt = e as BeforeInstallPromptEvent;
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt,
      }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
    };

    // Only add beforeinstallprompt listener for non-iOS devices
    if (!isIOS) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (!isIOS) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!state.deferredPrompt) {
      return false;
    }

    try {
      await state.deferredPrompt.prompt();
      const choiceResult = await state.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          deferredPrompt: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const dismissInstall = () => {
    setState(prev => ({
      ...prev,
      isInstallable: false,
    }));
  };

  return {
    ...state,
    installApp,
    dismissInstall,
  };
}
