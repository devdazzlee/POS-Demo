/**
 * Offline Database - IndexedDB wrapper for storing POS data locally
 * This allows full functionality when offline
 */

import Dexie, { Table } from 'dexie';

// Define database schema types
export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock?: number;
  category?: string;
  data: any; // Full product data
  lastSync: number;
}

export interface Sale {
  id: string;
  products: any[];
  total: number;
  customer?: any;
  payment: any;
  timestamp: number;
  synced: boolean;
  employeeId?: string;
  branchId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  data: any;
  lastSync: number;
}

export interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: any;
  timestamp: number;
  retries: number;
  priority: number; // Higher = more important
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

// Create Dexie database
class OfflineDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  pendingRequests!: Table<PendingRequest>;
  cachedData!: Table<CachedData>;

  constructor() {
    super('ManpasandPOSDB');
    
    this.version(1).stores({
      products: 'id, name, sku, category, lastSync',
      sales: 'id, timestamp, synced, employeeId, branchId',
      customers: 'id, name, email, phone, lastSync',
      pendingRequests: 'id, timestamp, priority, retries',
      cachedData: 'key, timestamp, expiresAt'
    });
  }
}

// Create single instance
export const db = new OfflineDatabase();

// Database helper functions
export const offlineDB = {
  // Products
  async saveProducts(products: any[]) {
    if (!Array.isArray(products)) {
      console.warn('saveProducts: products is not an array', products);
      return 0;
    }
    const timestamp = Date.now();
    const productsToStore = products.map(p => ({
      id: p.id || p._id || String(p.product_id),
      name: p.name || p.product_name,
      sku: p.sku,
      price: p.price || p.sale_price || 0,
      stock: p.stock || p.quantity,
      category: p.category?.name || p.category_name,
      data: p,
      lastSync: timestamp
    }));
    await db.products.bulkPut(productsToStore);
    return productsToStore.length;
  },

  async getProducts() {
    return await db.products.toArray();
  },

  async getProduct(id: string) {
    return await db.products.get(id);
  },

  async searchProducts(query: string) {
    const lowerQuery = query.toLowerCase();
    return await db.products
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  // Sales
  async saveSale(sale: any) {
    const saleData: Sale = {
      id: sale.id || `sale_${Date.now()}_${Math.random()}`,
      products: sale.products || sale.items,
      total: sale.total || sale.amount,
      customer: sale.customer,
      payment: sale.payment,
      timestamp: Date.now(),
      synced: false,
      employeeId: sale.employeeId || sale.employee_id,
      branchId: sale.branchId || sale.branch_id
    };
    await db.sales.put(saleData);
    return saleData;
  },

  async getUnsyncedSales() {
    return await db.sales.where('synced').equals(0).toArray();
  },

  async markSaleSynced(id: string) {
    await db.sales.update(id, { synced: true });
  },

  async getAllSales() {
    return await db.sales.orderBy('timestamp').reverse().toArray();
  },

  // Customers
  async saveCustomers(customers: any[]) {
    const timestamp = Date.now();
    const customersToStore = customers.map(c => ({
      id: c.id || c._id || String(c.customer_id),
      name: c.name || c.customer_name,
      email: c.email,
      phone: c.phone || c.mobile,
      data: c,
      lastSync: timestamp
    }));
    await db.customers.bulkPut(customersToStore);
    return customersToStore.length;
  },

  async getCustomers() {
    return await db.customers.toArray();
  },

  async searchCustomers(query: string) {
    const lowerQuery = query.toLowerCase();
    return await db.customers
      .filter(c => 
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email?.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query)
      )
      .toArray();
  },

  // Pending Requests Queue
  async queueRequest(request: {
    url: string;
    method: string;
    body?: any;
    headers?: any;
    priority?: number;
  }) {
    const pendingRequest: PendingRequest = {
      id: `req_${Date.now()}_${Math.random()}`,
      url: request.url,
      method: request.method,
      body: request.body,
      headers: request.headers,
      timestamp: Date.now(),
      retries: 0,
      priority: request.priority || 5
    };
    await db.pendingRequests.put(pendingRequest);
    return pendingRequest;
  },

  async getPendingRequests() {
    return await db.pendingRequests
      .orderBy('priority')
      .reverse()
      .toArray();
  },

  async removePendingRequest(id: string) {
    await db.pendingRequests.delete(id);
  },

  async incrementRetries(id: string) {
    const request = await db.pendingRequests.get(id);
    if (request) {
      await db.pendingRequests.update(id, { retries: request.retries + 1 });
    }
  },

  // Cached Data
  async setCachedData(key: string, data: any, ttl?: number) {
    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined
    };
    await db.cachedData.put(cachedData);
  },

  async getCachedData(key: string) {
    const cached = await db.cachedData.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      await db.cachedData.delete(key);
      return null;
    }
    
    return cached.data;
  },

  async clearExpiredCache() {
    const now = Date.now();
    await db.cachedData
      .filter(item => item.expiresAt !== undefined && item.expiresAt < now)
      .delete();
  },

  // Database management
  async clearAll() {
    await Promise.all([
      db.products.clear(),
      db.sales.clear(),
      db.customers.clear(),
      db.pendingRequests.clear(),
      db.cachedData.clear()
    ]);
  },

  async getStats() {
    const [products, sales, customers, pending, cached] = await Promise.all([
      db.products.count(),
      db.sales.count(),
      db.customers.count(),
      db.pendingRequests.count(),
      db.cachedData.count()
    ]);
    
    return {
      products,
      sales,
      customers,
      pendingRequests: pending,
      cachedData: cached
    };
  }
};

export default offlineDB;


