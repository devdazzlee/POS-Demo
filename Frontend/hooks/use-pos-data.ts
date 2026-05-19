import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { useCallback, useMemo } from 'react'

export function usePosData() {
  // 1. Atomic selectors for Data
  const products = useStore(state => state.products)
  const categories = useStore(state => state.categories)
  const customers = useStore(state => state.customers)
  const branches = useStore(state => state.branches)
  const suppliers = useStore(state => state.suppliers)
  
  // 2. Atomic selectors for Loading States
  const productsLoading = useStore(state => state.productsLoading)
  const categoriesLoading = useStore(state => state.categoriesLoading)
  const customersLoading = useStore(state => state.customersLoading)
  const branchesLoading = useStore(state => state.branchesLoading)
  const suppliersLoading = useStore(state => state.suppliersLoading)

  // 3. Static Action References
  const fetchProductsAction = useStore(state => state.fetchProducts)
  const fetchCategoriesAction = useStore(state => state.fetchCategories)
  const fetchCustomersAction = useStore(state => state.fetchCustomers)
  const fetchBranchesAction = useStore(state => state.fetchBranches)
  const fetchSuppliersAction = useStore(state => state.fetchSuppliers)
  const clearStoreAction = useStore(state => state.clearStore)

  const isAnyLoading = productsLoading || categoriesLoading || customersLoading || branchesLoading || suppliersLoading

  // 4. Stable Wrapper for Refresh All
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        fetchProductsAction({ force: true }),
        fetchCategoriesAction(true),
        fetchCustomersAction(true),
        fetchBranchesAction(true),
        fetchSuppliersAction(true)
      ])
      toast.success("Data Refreshed", {
        description: "All enterprise telemetry has been updated.",
      })
    } catch (error) {
      toast.error("Refresh Failed", {
        description: "Communication error with neural nodes.",
      })
    }
  }, [fetchProductsAction, fetchCategoriesAction, fetchCustomersAction, fetchBranchesAction, fetchSuppliersAction])

  // 5. Stable Wrapper for fetchProducts with options support
  const fetchProducts = useCallback((options?: { force?: boolean; search?: string; categoryId?: string }) => 
    fetchProductsAction(options), [fetchProductsAction])

  // 6. Memoize final output
  return useMemo(() => ({
    // Data
    products,
    categories,
    customers,
    branches,
    suppliers,
    
    // Loading states
    productsLoading,
    categoriesLoading,
    customersLoading,
    branchesLoading,
    suppliersLoading,
    isAnyLoading,
    
    // Actions
    refreshAllData,
    fetchProducts,
    fetchCategories: fetchCategoriesAction,
    fetchCustomers: fetchCustomersAction,
    fetchBranches: fetchBranchesAction,
    fetchSuppliers: fetchSuppliersAction,
    clearStore: clearStoreAction,
  }), [
    products, categories, customers, branches, suppliers,
    productsLoading, categoriesLoading, customersLoading, branchesLoading, suppliersLoading,
    isAnyLoading, refreshAllData, fetchProducts, 
    fetchCategoriesAction, fetchCustomersAction, fetchBranchesAction, fetchSuppliersAction, clearStoreAction
  ])
}