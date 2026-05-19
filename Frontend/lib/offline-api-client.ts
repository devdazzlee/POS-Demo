/**
 * Offline-Aware API Client
 * Automatically queues requests when offline and retries when online
 */

import apiClient from './apiClient';
import { offlineDB } from './offline-db';
import { syncManager } from './offline-sync';

export interface OfflineAPIOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  priority?: number;
  cacheStrategy?: 'network-first' | 'cache-first' | 'network-only' | 'cache-only';
  cacheTTL?: number; // Cache time-to-live in milliseconds
}

class OfflineAPIClient {
  /**
   * Make an API request with offline support
   */
  async request<T = any>(options: OfflineAPIOptions): Promise<T | null> {
    const { method, url, data, headers, priority, cacheStrategy = 'network-first', cacheTTL } = options;

    // Check if online
    const isOnline = syncManager.canMakeRequest();

    // Handle different cache strategies
    if (cacheStrategy === 'cache-only') {
      return await this.getFromCache(url);
    }

    if (cacheStrategy === 'cache-first') {
      const cached = await this.getFromCache(url);
      if (cached) return cached;
      if (!isOnline) return null;
    }

    // If offline and not a GET request, queue it
    if (!isOnline && method !== 'GET') {
      console.log(`📥 Queuing ${method} request for later: ${url}`);
      await offlineDB.queueRequest({
        url,
        method,
        body: data,
        headers,
        priority
      });
      
      // Return optimistic response
      return this.createOptimisticResponse(method, data);
    }

    // If offline and GET request, try cache
    if (!isOnline && method === 'GET') {
      console.log(`📦 Returning cached data for: ${url}`);
      return await this.getFromCache(url);
    }

    // Online - make the request
    try {
      let response;
      
      switch (method) {
        case 'GET':
          response = await apiClient.get(url);
          break;
        case 'POST':
          response = await apiClient.post(url, data);
          break;
        case 'PUT':
          response = await apiClient.put(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        case 'PATCH':
          response = await apiClient.patch(url, data);
          break;
      }

      // Cache GET requests
      if (method === 'GET' && response) {
        await this.setCache(url, response, cacheTTL);
      }

      return response;
    } catch (error: any) {
      console.error(`❌ API request failed: ${url}`, error);
      
      // If request failed and it's a mutation, queue it
      if (method !== 'GET' && error?.message?.includes('Network')) {
        console.log(`📥 Network error - queuing request: ${url}`);
        await offlineDB.queueRequest({
          url,
          method,
          body: data,
          headers,
          priority
        });
        return this.createOptimisticResponse(method, data);
      }
      
      // For GET requests, try cache as fallback
      if (method === 'GET') {
        const cached = await this.getFromCache(url);
        if (cached) {
          console.log(`📦 Using cached fallback for: ${url}`);
          return cached;
        }
      }
      
      throw error;
    }
  }

  /**
   * GET request with offline support
   */
  async get<T = any>(url: string, options?: Partial<OfflineAPIOptions>): Promise<T | null> {
    return this.request<T>({
      method: 'GET',
      url,
      ...options
    });
  }

  /**
   * POST request with offline queuing
   */
  async post<T = any>(url: string, data?: any, options?: Partial<OfflineAPIOptions>): Promise<T | null> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...options
    });
  }

  /**
   * PUT request with offline queuing
   */
  async put<T = any>(url: string, data?: any, options?: Partial<OfflineAPIOptions>): Promise<T | null> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...options
    });
  }

  /**
   * DELETE request with offline queuing
   */
  async delete<T = any>(url: string, options?: Partial<OfflineAPIOptions>): Promise<T | null> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...options
    });
  }

  /**
   * PATCH request with offline queuing
   */
  async patch<T = any>(url: string, data?: any, options?: Partial<OfflineAPIOptions>): Promise<T | null> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...options
    });
  }

  // Cache management
  private async getFromCache(url: string): Promise<any> {
    return await offlineDB.getCachedData(url);
  }

  private async setCache(url: string, data: any, ttl?: number): Promise<void> {
    await offlineDB.setCachedData(url, data, ttl);
  }

  // Create optimistic response for queued requests
  private createOptimisticResponse(method: string, data: any): any {
    if (method === 'POST' && data) {
      return {
        success: true,
        data: {
          ...data,
          id: `temp_${Date.now()}`,
          _pending: true
        },
        message: 'Request queued for sync'
      };
    }
    
    return {
      success: true,
      _pending: true,
      message: 'Request queued for sync'
    };
  }
}

// Create singleton instance
export const offlineAPIClient = new OfflineAPIClient();

export default offlineAPIClient;

