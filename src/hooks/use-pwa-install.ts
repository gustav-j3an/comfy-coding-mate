import { useState, useEffect } from 'react';

export type PWAPlatform = 'ios' | 'android' | 'chrome' | 'other';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PWAPlatform>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/chrome|crios/.test(userAgent)) {
      setPlatform('chrome');
    }

    // Check if already installed/standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };
    checkStandalone();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA: beforeinstallprompt event fired');
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('PWA: appinstalled event fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detect incognito (rough estimation)
    const detectIncognito = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const { quota } = await navigator.storage.estimate();
        if (quota && quota < 120000000) {
          setIsIncognito(true);
        }
      }
    };
    detectIncognito();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  return {
    deferredPrompt,
    isInstalled: isInstalled || isStandalone,
    platform,
    isStandalone,
    isIncognito,
    install,
    canInstallNative: !!deferredPrompt
  };
}
