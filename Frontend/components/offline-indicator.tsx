/**
 * Offline Status Indicator Component
 * Shows connection status and sync information
 */

'use client';

import { useOnlineStatus, useSync, useOfflineStats } from '@/hooks/use-offline';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';

export function OfflineIndicator() {
  const status = useOnlineStatus();
  const { sync, isSyncing } = useSync();
  const { stats, refresh } = useOfflineStats();
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useIsMobile();

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`fixed ${isMobile ? 'bottom-20 left-4' : 'bottom-6 left-4'} z-40`}>
      {/* Main Status Badge */}
      <Button
        variant={status.isOnline ? 'default' : 'destructive'}
        size="sm"
        className={`${isMobile ? 'mb-1' : 'mb-2'} shadow-lg`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {status.isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline
          </>
        )}
        
        {status.isSyncing && (
          <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
        )}
        
        {stats.pendingRequests > 0 && (
          <Badge variant="secondary" className="ml-2">
            {stats.pendingRequests}
          </Badge>
        )}
      </Button>

      {/* Detailed Status Card */}
      {showDetails && (
        <Card className={`${isMobile ? 'w-72 mb-2' : 'w-80 mb-2'} shadow-2xl`}>
          <CardContent className="p-4 space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {status.isOnline ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  sync();
                  refresh();
                }}
                disabled={isSyncing || !status.isOnline}
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Sync Status */}
            {status.isSyncing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing data...</span>
              </div>
            )}

            {/* Last Sync */}
            {status.lastSync > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last sync: {formatTime(status.lastSync)}</span>
              </div>
            )}

            {/* Pending Requests */}
            {stats.pendingRequests > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">
                    {stats.pendingRequests} pending request{stats.pendingRequests !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Will sync when connection is restored
                </p>
              </div>
            )}

            {/* Offline Data Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="w-4 h-4" />
                <span>Offline Data</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600">Products</div>
                  <div className="font-semibold">{stats.products}</div>
                </div>
                
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600">Customers</div>
                  <div className="font-semibold">{stats.customers}</div>
                </div>
                
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600">Sales</div>
                  <div className="font-semibold">{stats.sales}</div>
                </div>
                
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600">Cached</div>
                  <div className="font-semibold">{stats.cachedData}</div>
                </div>
              </div>
            </div>

            {/* Info Message */}
            {!status.isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Offline Mode:</strong> All changes are saved locally and will sync automatically when you're back online.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OfflineIndicator;


