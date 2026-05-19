'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function PWAInstallButton({ className, variant = 'floating' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      setIsVisible(true);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        className={cn(
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25",
          className
        )}
      >
        {isInstalling ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Installing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </div>
        )}
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-6 z-30",
      className
    )}>
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        size="lg"
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-200 hover:scale-105"
      >
        {isInstalling ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Download className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}

export default PWAInstallButton;
