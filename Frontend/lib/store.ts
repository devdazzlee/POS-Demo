import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from './apiClient'
import { offlineDB } from './offline-db'
import { syncManager } from './offline-sync'

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  categoryId: string
  barcode?: string //TODO
  code?: string // Product code for barcode matching
  current_stock?: number
  available_stock?: number
  reserved_stock?: number
  minimum_stock?: number
  maximum_stock?: number
  sku?: string
  subcategoryId?: string
  subcategory?: string
  unitId?: string
  unitName?: string
  taxId?: string
  taxName?: string
  supplierId?: string
  supplierName?: string
  brandId?: string
  brandName?: string
  colorId?: string
  colorName?: string
  sizeId?: string
  sizeName?: string
  purchase_rate?: number
  sales_rate_exc_dis_and_tax?: number
  sales_rate_inc_dis_and_tax?: number
  discount_amount?: number
  min_qty?: number
  max_qty?: number
  is_active?: boolean
  display_on_pos?: boolean
  is_batch?: boolean
  auto_fill_on_demand_sheet?: boolean
  non_inventory_item?: boolean
  is_deal?: boolean
  is_featured?: boolean
  is_finished_good?: boolean
  is_loose_item?: boolean
  pct_or_hs_code?: string
  description?: string
  created_at?: string
  updated_at?: string
  images?: any[]
}

interface Branch {
  id: string
  name: string
  location?: string
  is_active?: boolean
}

interface Category {
  id: string
  name: string
  is_active?: boolean
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  is_active?: boolean
}

interface StoreState {
  // Data
  products: Product[]
  categories: Category[]
  customers: Customer[]
  branches: Branch[]
  suppliers: any[]
  
  // Loading states
  productsLoading: boolean
  categoriesLoading: boolean
  customersLoading: boolean
  branchesLoading: boolean
  suppliersLoading: boolean
  
  // Last fetch timestamps
  lastProductsFetch: number | null
  lastCategoriesFetch: number | null
  lastCustomersFetch: number | null
  lastBranchesFetch: number | null
  lastSuppliersFetch: number | null
  
  // Actions
  fetchProducts: (options?: { force?: boolean; search?: string; categoryId?: string }) => Promise<void>
  fetchCategories: (force?: boolean) => Promise<void>
  fetchCustomers: (force?: boolean) => Promise<void>
  fetchBranches: (force?: boolean) => Promise<void>
  fetchSuppliers: (force?: boolean) => Promise<void>
  clearStore: () => void
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      categories: [],
      customers: [],
      branches: [],
      suppliers: [],
      productsLoading: false,
      categoriesLoading: false,
      customersLoading: false,
      branchesLoading: false,
      suppliersLoading: false,
      lastProductsFetch: null,
      lastCategoriesFetch: null,
      lastCustomersFetch: null,
      lastBranchesFetch: null,
      lastSuppliersFetch: null,

      // Fetch products with caching and full-database search support
      fetchProducts: async (options?: { force?: boolean; search?: string; categoryId?: string }) => {
        const { force = false, search, categoryId } = options ?? {}
        const state = get()
        const now = Date.now()
        const hasFilters = Boolean(search) || Boolean(categoryId)

        // Use cached data when no filters applied AND we're not forcing a refresh
        // Skip cache when force is true to ensure fresh data
        if (!hasFilters && !force) {
          if (
            state.products.length > 0 &&
            state.lastProductsFetch &&
            now - state.lastProductsFetch < CACHE_DURATION
          ) {
            // Audit: Cache hit within duration
            return
          }
        }

        set({ productsLoading: true })

        const mapProduct = (item: any): Product => ({
          id: item.id,
          name: item.name,
          price: Number(item.sales_rate_inc_dis_and_tax ?? item.sales_rate_exc_dis_and_tax ?? item.purchase_rate ?? 0),
          category: item.category?.name,
          categoryId: item.category?.id,
          barcode: item.barcode || item.sku || item.code, // Include code as fallback for barcode
          code: item.code, // Explicitly include code field for barcode matching
          stock: item.available_stock ?? item.current_stock ?? 0,
          current_stock: item.current_stock ?? 0,
          available_stock: item.available_stock ?? 0,
          reserved_stock: item.reserved_stock ?? 0,
          minimum_stock: item.minimum_stock ?? 0,
          maximum_stock: item.maximum_stock ?? 0,
          sku: item.sku,
          subcategoryId: item.subcategory?.id,
          subcategory: item.subcategory?.name,
          unitId: item.unit?.id,
          unitName: item.unit?.name,
          taxId: item.tax?.id,
          taxName: item.tax?.name,
          supplierId: item.supplier?.id,
          supplierName: item.supplier?.name,
          brandId: item.brand?.id,
          brandName: item.brand?.name,
          colorId: item.color?.id,
          colorName: item.color?.name,
          sizeId: item.size?.id,
          sizeName: item.size?.name,
          purchase_rate: Number(item.purchase_rate) || 0,
          sales_rate_exc_dis_and_tax: Number(item.sales_rate_exc_dis_and_tax) || 0,
          sales_rate_inc_dis_and_tax: Number(item.sales_rate_inc_dis_and_tax) || 0,
          discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
          min_qty: item.min_qty ? Number(item.min_qty) : undefined,
          max_qty: item.max_qty ? Number(item.max_qty) : undefined,
          is_active: item.is_active ?? true,
          display_on_pos: item.display_on_pos ?? true,
          is_batch: item.is_batch ?? false,
          auto_fill_on_demand_sheet: item.auto_fill_on_demand_sheet ?? false,
          non_inventory_item: item.non_inventory_item ?? false,
          is_deal: item.is_deal ?? false,
          is_featured: item.is_featured ?? false,
          pct_or_hs_code: item.pct_or_hs_code,
          description: item.description,
          created_at: item.created_at,
          updated_at: item.updated_at,
          images: item.ProductImage?.map((img: { image: string }) => ({ id: img.image, image: img.image })) || item.images || [],
        })

        try {
          // Check if online
          const isOnline = syncManager.canMakeRequest()
          
          // If offline, try to load from IndexedDB first
          if (!isOnline) {
            console.log('📡 Offline mode - loading products from IndexedDB')
            const offlineProducts = await offlineDB.getProducts()
            if (offlineProducts.length > 0) {
              const mappedProducts = offlineProducts.map(p => mapProduct(p.data || p))
              set({
                products: mappedProducts,
                productsLoading: false,
                lastProductsFetch: now,
              })
              console.log(`Loaded ${mappedProducts.length} products from offline cache`)
              return
            }
          }
          
          // Check if user is ADMIN - admins should see all products
          const userRole = localStorage.getItem("role")
          const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
          
          // Get branch_id from localStorage if available (only for non-admin users)
          let branchId = null
          if (!isAdmin) {
            try {
              const branchStr = localStorage.getItem("branch")
              if (branchStr && branchStr !== "Not Found") {
                const branchObj = JSON.parse(branchStr)
                branchId = branchObj.id || branchStr
              }
            } catch (e) {
              branchId = localStorage.getItem("branch")
              if (branchId === "Not Found") {
                branchId = null
              }
            }
          }

          const params: Record<string, any> = {
            fetch_all: true,
            // For admin users, don't filter by branch_id to get all products
            // For branch users, filter by their branch_id
            ...(branchId && !isAdmin ? { branch_id: branchId } : {}),
          }

          if (search) {
            params.search = search
          }

          if (categoryId) {
            params.category_id = categoryId
          }

          const res = await apiClient.get("/products", { params })
          const rawProducts = Array.isArray(res.data?.data) ? res.data.data : []
          const apiProducts = rawProducts.map(mapProduct)

          // Save products to IndexedDB for offline use
          if (apiProducts.length > 0) {
            await offlineDB.saveProducts(rawProducts)
          }

          set({
            products: apiProducts,
            productsLoading: false,
            lastProductsFetch: now,
          })

          console.log(`Loaded ${apiProducts.length} products${hasFilters ? ' (full search)' : ''}`)
        } catch (error) {
          console.log('Failed to fetch products:', error)
          
          // If online request failed, try offline cache
          if (syncManager.canMakeRequest()) {
            try {
              const offlineProducts = await offlineDB.getProducts()
              if (offlineProducts.length > 0) {
                const mappedProducts = offlineProducts.map(p => mapProduct(p.data || p))
                set({
                  products: mappedProducts,
                  productsLoading: false,
                  lastProductsFetch: now,
                })
                console.log(`Using offline cache: ${mappedProducts.length} products`)
                return
              }
            } catch (offlineError) {
              console.error('Failed to load from offline cache:', offlineError)
            }
          }
          
          set({ productsLoading: false })
          throw error
        }
      },

      // Fetch categories with caching
      fetchCategories: async (force = false) => {
        const state = get()
        const now = Date.now()
        
        if (!force && 
            state.categories.length > 0 && 
            state.lastCategoriesFetch && 
            (now - state.lastCategoriesFetch) < CACHE_DURATION) {
          // Audit: Cache hit within duration
          return
        }

        set({ categoriesLoading: true })
        
        try {
          const res = await apiClient.get("/categories")
          const categories = [{ id: "all", name: "All" }, ...res.data.data]
          
          set({ 
            categories, 
            categoriesLoading: false,
            lastCategoriesFetch: now
          })
          
          console.log(`Loaded ${categories.length} categories`)
        } catch (error) {
          console.log('Failed to fetch categories:', error)
          set({ categoriesLoading: false })
          throw error
        }
      },

      // Fetch customers with caching
      fetchCustomers: async (force = false) => {
        const state = get()
        const now = Date.now()
        
        if (!force && 
            state.customers.length > 0 && 
            state.lastCustomersFetch && 
            (now - state.lastCustomersFetch) < CACHE_DURATION) {
          // Audit: Cache hit within duration
          return
        }

        set({ customersLoading: true })
        
        try {
          const res = await apiClient.get("/customer")
          
          set({ 
            customers: res.data.data, 
            customersLoading: false,
            lastCustomersFetch: now
          })
          
          console.log(`Loaded ${res.data.data.length} customers`)
        } catch (error) {
          console.log('Failed to fetch customers:', error)
          set({ customersLoading: false })
          throw error
        }
      },

      // Fetch branches with caching
      fetchBranches: async (force = false) => {
        const state = get()
        const now = Date.now()
        
        if (!force && 
            state.branches.length > 0 && 
            state.lastBranchesFetch && 
            (now - state.lastBranchesFetch) < CACHE_DURATION) {
          // Audit: Cache hit within duration
          return
        }

        set({ branchesLoading: true })
        
        try {
          const res = await apiClient.get("/branches", { params: { fetch_all: true } })
          const branchesRaw = res.data?.data || res.data || []
          const branches = branchesRaw.map((b: any) => ({
             id: b.id,
             name: b.name,
             location: b.location,
             is_active: b.is_active ?? true
          }))
          
          set({ 
            branches, 
            branchesLoading: false,
            lastBranchesFetch: now
          })
          
          console.log(`Loaded ${branches.length} branches`)
        } catch (error) {
          console.log('Failed to fetch branches:', error)
          set({ branchesLoading: false })
          throw error
        }
      },

      // Fetch suppliers with caching
      fetchSuppliers: async (force = false) => {
        const state = get()
        const now = Date.now()
        
        if (!force && 
            state.suppliers.length > 0 && 
            state.lastSuppliersFetch && 
            (now - state.lastSuppliersFetch) < CACHE_DURATION) {
          return
        }

        set({ suppliersLoading: true })
        
        try {
          const res = await apiClient.get("/suppliers")
          const suppliers = res.data.data || []
          
          set({ 
            suppliers, 
            suppliersLoading: false,
            lastSuppliersFetch: now
          })
          
          console.log(`Loaded ${suppliers.length} suppliers`)
        } catch (error) {
          console.log('Failed to fetch suppliers:', error)
          set({ suppliersLoading: false })
          throw error
        }
      },

      // Clear all cached data
      clearStore: () => {
        set({
          products: [],
          categories: [],
          customers: [],
          branches: [],
          suppliers: [],
          lastProductsFetch: null,
          lastCategoriesFetch: null,
          lastCustomersFetch: null,
          lastBranchesFetch: null,
          lastSuppliersFetch: null,
        })
      },
    }),
    {
      name: 'pos-store', // localStorage key
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        customers: state.customers,
        branches: state.branches,
        suppliers: state.suppliers,
        lastProductsFetch: state.lastProductsFetch,
        lastCategoriesFetch: state.lastCategoriesFetch,
        lastCustomersFetch: state.lastCustomersFetch,
        lastBranchesFetch: state.lastBranchesFetch,
        lastSuppliersFetch: state.lastSuppliersFetch,
      }),
    }
  )
)