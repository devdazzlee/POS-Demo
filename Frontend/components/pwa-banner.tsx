'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWABannerProps {
  className?: string;
}

export function PWABanner({ className }: PWABannerProps) {
  const { isInstallable, isInstalled, isIOS, installApp, dismissInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Show banner if app is installable and not already installed
    // For iOS, always show the banner since it doesn't trigger beforeinstallprompt
    if ((isInstallable && !isInstalled) || (isIOS && !isInstalled)) {
      // Delay showing the banner
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      // For iOS, we can't programmatically install, so just show instructions
      if (isIOS) {
        setIsInstalling(false);
        return;
      }
      
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

  const handleDismiss = () => {
    setIsVisible(false);
    dismissInstall();
  };

  // Don't show if not visible or already installed
  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4",
      "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
      "border-t border-slate-700/50 shadow-2xl",
      "backdrop-blur-sm",
      className
    )}>
      <div className="max-w-4xl mx-auto">
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          {/* Left side - Content */}
          <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'} flex-1`}>
            {/* App Icon */}
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Download className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white`}>
                Install our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">App</span>
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-300`}>
                Get faster access, offline support, and a better experience
              </p>
            </div>

            {/* Features (Desktop only) */}
            <div className="hidden md:flex items-center space-x-4 text-slate-400">
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs">Fast</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs">Offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-xs">Full Screen</span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className={`flex items-center ${isMobile ? 'space-x-2 w-full' : 'space-x-3 ml-4'}`}>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold ${isMobile ? 'px-4 py-2 flex-1' : 'px-6 py-2'} rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25`}
            >
              {isInstalling ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Installing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>{isIOS ? 'Show Instructions' : 'Install'}</span>
                </div>
              )}
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* iOS Instructions */}
        {isIOS && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">iOS Installation</span>
              </div>
              <div className="text-xs text-blue-200 text-center space-y-1">
                <p>1. Tap the <strong>Share</strong> button (□↑) at the bottom</p>
                <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                <p>3. Tap <strong>"Add"</strong> to install</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PWABanner;
