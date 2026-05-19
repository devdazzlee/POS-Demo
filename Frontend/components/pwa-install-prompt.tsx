'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWAInstallPromptProps {
  className?: string;
}

export function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, installApp, dismissInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show prompt if app is installable and not already installed
    if (isInstallable && !isInstalled) {
      // Delay showing the prompt to avoid overwhelming users
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
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
      "fixed inset-0 z-50 flex items-center justify-center p-4",
      "bg-black/50 backdrop-blur-sm",
      className
    )}>
      <div className="relative w-full max-w-md mx-auto">
        {/* Main Prompt Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
            
            {/* App Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-white mb-1">
                Install our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">App</span>
              </h2>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                for a Better Experience
              </h3>
            </div>

            {/* Features */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center space-x-3 text-slate-300">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">Faster access & instant loading</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Full screen app experience</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-sm">Works offline after first visit</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Secure & auto-updates</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0">
            <div className="flex space-x-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                {isInstalling ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Installing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Install</span>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-300 hover:text-pink-200 font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Dismiss
              </Button>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 text-center">
                  <Smartphone className="w-3 h-3 inline mr-1" />
                  On iOS: Tap Share → "Add to Home Screen"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20" />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                            radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
          }} />
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
