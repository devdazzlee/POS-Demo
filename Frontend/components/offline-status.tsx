'use client';

import { useOnlineStatus, useSync, useOfflineStats } from '@/hooks/use-offline';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineStatusProps {
  className?: string;
}

export function OfflineStatus({ className }: OfflineStatusProps) {
  const status = useOnlineStatus();
  const { sync, isSyncing } = useSync();
  const { stats } = useOfflineStats();

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg",
      status.isOnline ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200",
      className
    )}>
      <div className="flex items-center space-x-2">
        {status.isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <span className={cn(
          "text-sm font-medium",
          status.isOnline ? "text-green-700" : "text-red-700"
        )}>
          {status.isOnline ? "Online" : "Offline"}
        </span>
        
        {status.isSyncing && (
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
        )}
      </div>
      
      {stats.pendingRequests > 0 && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-xs text-yellow-700 font-medium">
            {stats.pendingRequests}
          </span>
        </div>
      )}
    </div>
  );
}

export default OfflineStatus;
