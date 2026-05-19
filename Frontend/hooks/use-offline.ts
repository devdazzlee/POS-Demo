/**
 * React hooks for offline functionality
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { syncManager, SyncStatus } from '@/lib/offline-sync';
import { offlineDB } from '@/lib/offline-db';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [status, setStatus] = useState<SyncStatus>(() => syncManager.getStatus());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook to manually trigger sync
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await syncManager.triggerSync();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { sync, isSyncing, error };
}

/**
 * Hook to get database statistics
 */
export function useOfflineStats() {
  const [stats, setStats] = useState({
    products: 0,
    sales: 0,
    customers: 0,
    pendingRequests: 0,
    cachedData: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const newStats = await offlineDB.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to get offline stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}

/**
 * Hook to save data to offline storage
 */
export function useOfflineStorage() {
  const saveProducts = useCallback(async (products: any[]) => {
    return await offlineDB.saveProducts(products);
  }, []);

  const saveCustomers = useCallback(async (customers: any[]) => {
    return await offlineDB.saveCustomers(customers);
  }, []);

  const saveSale = useCallback(async (sale: any) => {
    return await offlineDB.saveSale(sale);
  }, []);

  const getProducts = useCallback(async () => {
    return await offlineDB.getProducts();
  }, []);

  const getCustomers = useCallback(async () => {
    return await offlineDB.getCustomers();
  }, []);

  const getSales = useCallback(async () => {
    return await offlineDB.getAllSales();
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    return await offlineDB.searchProducts(query);
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    return await offlineDB.searchCustomers(query);
  }, []);

  return {
    saveProducts,
    saveCustomers,
    saveSale,
    getProducts,
    getCustomers,
    getSales,
    searchProducts,
    searchCustomers
  };
}

/**
 * Hook to check if app is ready for offline use
 */
export function useOfflineReady() {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function checkReady() {
      const stats = await offlineDB.getStats();
      const hasData = stats.products > 0 || stats.customers > 0;
      setIsReady(hasData);
      
      // Calculate progress based on data availability
      let progressValue = 0;
      if (stats.products > 0) progressValue += 50;
      if (stats.customers > 0) progressValue += 30;
      if (stats.cachedData > 0) progressValue += 20;
      setProgress(Math.min(progressValue, 100));
    }

    checkReady();
    const interval = setInterval(checkReady, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { isReady, progress };
}


