/**
 * Offline Provider Component
 * Initializes offline functionality and shows status indicator
 */

'use client';

import { useEffect, useState } from 'react';
import { initializeOfflineMode } from '@/lib/offline-init';
import { OfflineIndicator } from './offline-indicator';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize offline mode when component mounts
    initializeOfflineMode().then((success) => {
      setInitialized(success);
      if (success) {
        console.log('✅ Offline mode ready');
      }
    });
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
    </>
  );
}

export default OfflineProvider;


