"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown, Package, Loader2, Calendar, Edit, MapPin, Filter, Trash2, X, FileDown } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { usePosData } from "@/hooks/use-pos-data";
import { PageLoader } from "@/components/ui/page-loader";
import { Textarea } from "@/components/ui/textarea";

const ALL_BRANCHES = "__all_branches__";
const ALL_CATEGORIES = "__all_categories__";

const DLG = {
  content: "max-w-lg border border-gray-200 p-0 gap-0",
  header: "px-5 py-4 border-b border-gray-200",
  title: "text-base text-black font-normal",
  desc: "text-sm text-gray-600 font-normal",
  body: "px-5 py-4 space-y-4",
  label: "text-sm text-black font-normal",
  field: "h-9 text-sm text-black border-gray-200",
  footer: "flex justify-end gap-2 px-5 py-4 border-t border-gray-200",
  dropdown:
    "absolute left-0 right-0 z-[100] mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md",
  pickRow: "flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50 text-sm text-black",
  pickSku: "text-xs text-gray-500",
};

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <Card className="p-4 border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {loading ? (
        <div className="h-7 w-20 bg-gray-100 animate-pulse rounded mt-2" />
      ) : (
        <p className="text-xl text-black mt-1">{value}</p>
      )}
    </Card>
  );
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Stock {
  id: string;
  product: Product;
  branch: Branch;
  current_quantity: number;
  last_updated: string;
}

interface Movement {
  id: string;
  product: Product;
  branch: Branch;
  movement_type: string;
  quantity_change: number;
  previous_qty: number;
  new_qty: number;
  created_at: string;
  notes?: string;
  user?: { email: string };
}

export function StockManagement() {
  // Global store data
  const { 
    products: globalProducts, 
    categories,
    isAnyLoading: globalLoading,
    refreshAllData: triggerGlobalRefresh 
  } = usePosData();
  
  // Data lists
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [history, setHistory] = useState<Movement[]>([]);
  const [todayMovements, setTodayMovements] = useState<Movement[]>([]);
  
  // Pagination and meta
  const [totalStocks, setTotalStocks] = useState(0);
  const [stockMeta, setStockMeta] = useState({ page: 1, limit: 20, totalPages: 1, totalQuantity: 0, lowStockCount: 0 });

  // UI state
  const [branchFilter, setBranchFilter] = useState<string>(ALL_BRANCHES);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Product search state
  const [productSearch, setProductSearch] = useState("");

  // Pagination for stock table
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(20);

  // Dialog state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  // Dropdown state for product selection
  const [addProductDropdownOpen, setAddProductDropdownOpen] = useState(false);
  const [adjustProductDropdownOpen, setAdjustProductDropdownOpen] = useState(false);
  const [transferProductDropdownOpen, setTransferProductDropdownOpen] = useState(false);
  const [removeProductDropdownOpen, setRemoveProductDropdownOpen] = useState(false);
  
  // Refs for dropdown containers
  const addProductDropdownRef = React.useRef<HTMLDivElement>(null);
  const adjustProductDropdownRef = React.useRef<HTMLDivElement>(null);
  const transferProductDropdownRef = React.useRef<HTMLDivElement>(null);
  const removeProductDropdownRef = React.useRef<HTMLDivElement>(null);

  // Form state
  const [transferForm, setTransferForm] = useState({
    productId: "",
    fromBranchId: "",
    toBranchId: "",
    quantity: "" as string | number,
    notes: "",
  });

  const [addForm, setAddForm] = useState({
    productId: "",
    branchId: "",
    quantity: "" as string | number,
    supplierId: "",
    unitCost: "" as string | number,
  });

  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    branchId: "",
    quantityChange: "" as string | number,
    reason: "",
  });

  const [removeForm, setRemoveForm] = useState({
    productId: "",
    branchId: "",
    quantity: "" as string | number,
    reason: "WASTE",
    notes: "",
  });

  // Instant filtered products from global store
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return globalProducts.slice(0, 50);
    const search = productSearch.toLowerCase().trim();
    return globalProducts.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.sku?.toLowerCase().includes(search) || 
      p.barcode?.includes(search)
    ).slice(0, 50);
  }, [globalProducts, productSearch]);

  // 1) Fetch branches on mount
  useEffect(() => {
    const loadMeta = async () => {
      setIsInitialLoading(true);
      try {
        const bRes = await apiClient.get(`${API_BASE}/branches?fetch_all=true`);
        setBranches(bRes.data.data);
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to load branches");
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadMeta();
  }, []);

  const showErrorToast = (e: any) => {
    console.error("Inventory Operation Error:", e);
    const message = e.response?.data?.message || e.message || "An unexpected operation failure occurred";
    toast.error(message);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setStockPage(1);
  }, [searchTerm]);

  const refreshAllData = useCallback(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: stockPage.toString(),
          limit: stockPageSize.toString(),
        });
        
        if (branchFilter && branchFilter !== ALL_BRANCHES) params.append('branchId', branchFilter);
        if (categoryFilter && categoryFilter !== ALL_CATEGORIES) params.append('categoryId', categoryFilter);
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        
        const [sRes, hRes, tRes] = await Promise.all([
          apiClient.get(`${API_BASE}/stock?${params}`),
          apiClient.get(`${API_BASE}/stock/history?${params}`),
          apiClient.get(`${API_BASE}/stock/today?${params}`),
        ]);
        
        setAllStocks(sRes.data.data || []);
        setTotalStocks(sRes.data.meta?.total || 0);
        if (sRes.data.meta) setStockMeta(sRes.data.meta);
        setHistory(hRes.data.data || []);
        setTodayMovements(tRes.data.data || []);
      } catch (e: any) {
        toast.error("Failed to load stock data");
      } finally {
        setIsLoading(false);
      }
    }, [branchFilter, categoryFilter, stockPage, stockPageSize, searchTerm]);

    useEffect(() => {
      refreshAllData();
    }, [refreshAllData]);

  // Fetch initial data
  const { suppliers, fetchSuppliers } = usePosData();
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addProductDropdownRef.current && !addProductDropdownRef.current.contains(event.target as Node)) setAddProductDropdownOpen(false);
      if (adjustProductDropdownRef.current && !adjustProductDropdownRef.current.contains(event.target as Node)) setAdjustProductDropdownOpen(false);
      if (transferProductDropdownRef.current && !transferProductDropdownRef.current.contains(event.target as Node)) setTransferProductDropdownOpen(false);
      if (removeProductDropdownRef.current && !removeProductDropdownRef.current.contains(event.target as Node)) setRemoveProductDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derived analytics
  const paginationOptions = [20, 50, 100, 500];
  const totalUnits = stockMeta.totalQuantity || 0;
  const alerts = stockMeta.lowStockCount || 0;
  const totalStockPages = stockMeta.totalPages || 1;

  // Handlers
  const handleTransfer = async () => {
    const quantity = typeof transferForm.quantity === "string" 
      ? (transferForm.quantity === "" ? 0 : Number(transferForm.quantity) || 0)
      : transferForm.quantity;
    
    if (!transferForm.productId || !transferForm.fromBranchId || !transferForm.toBranchId || quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsTransferring(true);
    try {
      await apiClient.post(`${API_BASE}/stock/transfer`, {
        productId: transferForm.productId,
        fromBranchId: transferForm.fromBranchId,
        toBranchId: transferForm.toBranchId,
        quantity: quantity,
        notes: transferForm.notes,
      });

      setIsTransferOpen(false);
      setTransferForm({ productId: "", fromBranchId: "", toBranchId: "", quantity: "", notes: "" });
      setProductSearch("");
      setTransferProductDropdownOpen(false);
      refreshAllData();

      toast.success("Stock transferred successfully");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAddStock = async () => {
    const quantity = typeof addForm.quantity === "string" 
      ? (addForm.quantity === "" ? 0 : Number(addForm.quantity) || 0)
      : addForm.quantity;
    
    if (!addForm.productId || !addForm.branchId || !quantity || quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsTransferring(true);
    try {
      await apiClient.post(`${API_BASE}/stock`, {
        productId: addForm.productId,
        branchId: addForm.branchId,
        quantity: quantity,
        supplierId: addForm.supplierId,
        unitCost: addForm.unitCost ? Number(addForm.unitCost) : undefined
      });

      setIsAddOpen(false);
      clearProductUI();
      refreshAllData();

      toast.success("Stock added successfully");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAdjustStock = async () => {
    const quantityChange = typeof adjustForm.quantityChange === "string" 
      ? (adjustForm.quantityChange === "" || adjustForm.quantityChange === "-" ? 0 : Number(adjustForm.quantityChange) || 0)
      : adjustForm.quantityChange;
    
    if (!adjustForm.productId || !adjustForm.branchId || quantityChange === 0) {
      toast.error("Please enter a valid change amount");
      return;
    }

    setIsTransferring(true);
    try {
      await apiClient.patch(`${API_BASE}/stock/adjust`, {
        productId: adjustForm.productId,
        branchId: adjustForm.branchId,
        quantityChange: quantityChange,
        reason: adjustForm.reason,
      });

      setIsAdjustOpen(false);
      setAdjustForm({ productId: "", branchId: "", quantityChange: "", reason: "" });
      setProductSearch("");
      setAdjustProductDropdownOpen(false);
      refreshAllData();

      toast.success("Stock adjusted successfully");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRemoveStock = async () => {
    const quantity = typeof removeForm.quantity === "string" 
      ? (removeForm.quantity === "" ? 0 : Number(removeForm.quantity) || 0)
      : removeForm.quantity;
    
    if (!removeForm.productId || !removeForm.branchId || !quantity || quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsTransferring(true);
    try {
      await apiClient.delete(`${API_BASE}/stock/remove`, {
        data: {
          productId: removeForm.productId,
          branchId: removeForm.branchId,
          quantity: quantity,
          reason: removeForm.reason,
        },
      });

      setIsRemoveOpen(false);
      setRemoveForm({ productId: "", branchId: "", quantity: "", reason: "WASTE", notes: "" });
      setProductSearch("");
      setRemoveProductDropdownOpen(false);
      refreshAllData();

      toast.success("Stock removed successfully");
    } catch (e: any) {
      showErrorToast(e);
    } finally {
      setIsTransferring(false);
    }
  };

  const getMovementBadge = (type: string) => {
    const incoming = ["PURCHASE", "TRANSFER_IN", "RETURN"];
    const outgoing = ["SALE", "TRANSFER_OUT", "DAMAGE", "EXPIRED"];
    if (incoming.includes(type)) return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{type}</Badge>;
    if (outgoing.includes(type)) return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{type}</Badge>;
    if (type === "ADJUSTMENT") return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{type}</Badge>;
    return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{type}</Badge>;
  };

  const formatQty = (value: number) => {
    const num = Number(value || 0);
    if (Number.isInteger(num)) return num.toLocaleString();
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getStockStatusMeta = (qty: number) => {
    if (qty <= 0) return { label: "Out of stock", className: "bg-gray-100 text-gray-700 border-gray-200" };
    if (qty <= 10) return { label: "Low stock", className: "bg-amber-50 text-amber-800 border-amber-200" };
    return { label: "In stock", className: "bg-green-50 text-green-800 border-green-200" };
  };

  const handleProductSearch = (search: string) => {
    setProductSearch(search);
  };

  const clearProductUI = () => {
    setProductSearch("");
    setAddProductDropdownOpen(false);
    setAdjustProductDropdownOpen(false);
    setTransferProductDropdownOpen(false);
    setRemoveProductDropdownOpen(false);
    // Reset forms to default
    setAddForm({ productId: "", branchId: "", quantity: "", supplierId: "", unitCost: "" });
    setAdjustForm({ productId: "", branchId: "", quantityChange: "", reason: "CORRECTION" });
    setRemoveForm({ productId: "", branch_id: "", quantity: "", reason: "WASTE", notes: "" });
    setTransferForm({ productId: "", fromBranchId: "", toBranchId: "", quantity: "", notes: "" });
  };

  const handleExport = () => {
    if (allStocks.length === 0) return;
    
    const headers = ["Product", "Branch", "SKU", "Category", "Quantity", "Last Updated"];
    const csvContent = [
      headers.join(","),
      ...allStocks.map(s => [
        `"${s.product.name}"`,
        `"${s.branch?.name || 'N/A'}"`,
        `"${s.product.sku || 'N/A'}"`,
        `"${categories.find(c => c.id === s.product.category_id)?.name || 'N/A'}"`,
        s.current_quantity,
        new Date(s.last_updated).toLocaleString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV downloaded");
  };

  if (isInitialLoading) {
    return (
      <PageLoader message="Loading stock..." />
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-gray-900 text-white p-2 rounded-md">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Stock Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              View stock, record additions, adjustments, removals, and transfers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <Button 
             variant="outline" 
             size="sm"
             onClick={handleExport}
             disabled={allStocks.length === 0}
             className="text-sm text-black"
           >
             <FileDown className="h-4 w-4 mr-2" /> Export CSV
           </Button>
           <div className="flex flex-wrap items-center gap-2">
              <Dialog 
                open={isAddOpen} 
                onOpenChange={(open) => {
                  setIsAddOpen(open);
                  if (!open) clearProductUI();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="text-sm">
                    <Plus className="h-4 w-4 mr-2" /> Add stock
                  </Button>
                </DialogTrigger>
                <DialogContent className={DLG.content}>
                  <DialogHeader className={DLG.header}>
                    <DialogTitle className={DLG.title}>Add stock</DialogTitle>
                    <p className={DLG.desc}>Add quantity to a product at a branch.</p>
                  </DialogHeader>
                  <div className={DLG.body}>
                    {/* PRODUCT SELECTOR */}
                    <div className="space-y-1.5 relative" ref={addProductDropdownRef}>
                      <Label className={DLG.label}>Product</Label>
                      <div className="relative group">
                        <Input
                          placeholder="Search product..."
                          value={productSearch}
                          onFocus={() => setAddProductDropdownOpen(true)}
                          autoComplete="off"
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setAddProductDropdownOpen(true);
                          }}
                          className="px-4 h-9 border border-gray-200 text-sm text-black focus:ring-1 focus:ring-slate-300 transition-all"
                        />
                        {addProductDropdownOpen && (
                          <Card className={DLG.dropdown}>
                            {filteredProducts.length === 0 ? (
                               <div className="p-6 text-center">
                                 <Package className="h-6 w-6 text-slate-200 mx-auto mb-1" />
                                 <p className="text-sm text-gray-500">No products found</p>
                               </div>
                            ) : (
                              <div className="p-1">
                                {filteredProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    className={DLG.pickRow}
                                    onClick={() => {
                                      setAddForm({ ...addForm, productId: p.id });
                                      setProductSearch(p.name);
                                      setAddProductDropdownOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm text-black">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.sku || p.id.slice(0, 8)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={DLG.label}>Branch</Label>
                        <Select value={addForm.branchId} onValueChange={(v) => setAddForm({ ...addForm, branchId: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                            {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-normal text-sm py-2">{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className={DLG.label}>Quantity</Label>
                        <div className="relative">
                           <Input
                            type="number"
                            placeholder="0"
                            value={addForm.quantity}
                            onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                            className="h-9 border border-gray-200 text-sm text-black text-sm pr-12 focus:ring-1 focus:ring-slate-300"
                           />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <Label className={DLG.label}>Supplier</Label>
                        <Select value={addForm.supplierId} onValueChange={(v) => setAddForm({ ...addForm, supplierId: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                            <SelectValue placeholder="Select Supplier" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                            {suppliers?.map((s: any) => <SelectItem key={s.id} value={s.id} className="font-normal text-sm py-2">{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className={DLG.label}>Unit cost</Label>
                        <Input
                          placeholder="0.00"
                          type="number"
                          value={addForm.unitCost}
                          onChange={(e) => setAddForm({ ...addForm, unitCost: e.target.value })}
                          className="h-9 border border-gray-200 text-sm text-black text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setIsAddOpen(false)}
                        className="text-sm text-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStock}
                        disabled={isTransferring}
                        size="sm" className="text-sm"
                      >
                        {isTransferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog 
                open={isAdjustOpen} 
                onOpenChange={(open) => {
                  setIsAdjustOpen(open);
                  if (!open) clearProductUI();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm text-black">
                    <Edit className="h-4 w-4 mr-2" /> Adjust
                  </Button>
                </DialogTrigger>
                <DialogContent className={DLG.content}>
                  <DialogHeader className={DLG.header}>
                    <DialogTitle className={DLG.title}>Adjust stock</DialogTitle>
                    <p className={DLG.desc}>Set the correct quantity for a product.</p>
                  </DialogHeader>
                  <div className={DLG.body}>
                    <div className="space-y-2 relative" ref={adjustProductDropdownRef}>
                      <Label className={DLG.label}>Product</Label>
                      <div className="relative group">
                        <Input
                          placeholder="Search product..."
                          value={productSearch}
                          onFocus={() => setAdjustProductDropdownOpen(true)}
                          autoComplete="off"
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setAdjustProductDropdownOpen(true);
                          }}
                          className="px-4 h-9 border border-gray-200 text-sm text-black focus:ring-1 focus:ring-slate-300"
                        />
                        {adjustProductDropdownOpen && (
                          <Card className={DLG.dropdown}>
                            {filteredProducts.length === 0 ? (
                               <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                            ) : (
                              <div className="p-1">
                                {filteredProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    className={DLG.pickRow}
                                    onClick={() => {
                                      setAdjustForm({ ...adjustForm, productId: p.id });
                                      setProductSearch(p.name);
                                      setAdjustProductDropdownOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm text-black">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.sku || p.id.slice(0, 8)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={DLG.label}>Branch</Label>
                        <Select value={adjustForm.branchId} onValueChange={(v) => setAdjustForm({ ...adjustForm, branchId: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                             <SelectValue placeholder="Branch" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                             {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-normal text-sm py-2">{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className={DLG.label}>Reason</Label>
                        <Select value={adjustForm.reason} onValueChange={(v) => setAdjustForm({ ...adjustForm, reason: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                            <SelectValue placeholder="Select Reason" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                            <SelectItem value="CORRECTION" className="font-normal text-sm py-2">Correction</SelectItem>
                            <SelectItem value="LOST" className="font-normal text-sm py-2">Lost / Unaccounted</SelectItem>
                            <SelectItem value="FOUND" className="font-normal text-sm py-2">Found / Surprise Entry</SelectItem>
                            <SelectItem value="PROMOTIONAL" className="font-normal text-sm py-2">Promotional Redistribution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-600">Current quantity</Label>
                        <span className="text-sm text-black">—</span>
                      </div>
                      <div className="space-y-2">
                        <Label className={DLG.label}>New quantity</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={adjustForm.quantityChange}
                          onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })}
                          className="h-9 border border-gray-200 text-sm text-black text-sm text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={DLG.label}>Notes (optional)</Label>
                      <Input
                        placeholder="Add any additional details..."
                        className="h-9 border border-gray-200 text-sm text-black text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setIsAdjustOpen(false)}
                        className="text-sm text-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAdjustStock}
                        disabled={isTransferring}
                        size="sm" className="text-sm"
                      >
                        {isTransferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog 
                open={isRemoveOpen} 
                onOpenChange={(open) => {
                  setIsRemoveOpen(open);
                  if (!open) clearProductUI();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm text-black">
                    <TrendingDown className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </DialogTrigger>
                <DialogContent className={DLG.content}>
                  <DialogHeader className={DLG.header}>
                    <DialogTitle className={DLG.title}>Remove stock</DialogTitle>
                    <p className={DLG.desc}>Reduce quantity (damage, waste, loss, or expiry).</p>
                  </DialogHeader>
                  <div className={DLG.body}>
                    <div className="space-y-2 relative" ref={removeProductDropdownRef}>
                      <Label className={DLG.label}>Product</Label>
                      <div className="relative group">
                        <Input
                          placeholder="Search product..."
                          value={productSearch}
                          onFocus={() => setRemoveProductDropdownOpen(true)}
                          autoComplete="off"
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setRemoveProductDropdownOpen(true);
                          }}
                          className="px-4 h-9 border border-gray-200 text-sm text-black focus:ring-1 focus:ring-slate-300"
                        />
                        {removeProductDropdownOpen && (
                          <Card className={DLG.dropdown}>
                             {filteredProducts.length === 0 ? (
                               <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                            ) : (
                              <div className="p-1">
                                {filteredProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    className={DLG.pickRow}
                                    onClick={() => {
                                      setRemoveForm({ ...removeForm, productId: p.id });
                                      setProductSearch(p.name);
                                      setRemoveProductDropdownOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm text-black">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.sku || p.id.slice(0, 8)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={DLG.label}>Quantity</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={removeForm.quantity}
                          onChange={(e) => setRemoveForm({ ...removeForm, quantity: e.target.value })}
                          className="h-9 border border-gray-200 text-sm text-black text-sm text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={DLG.label}>Reason</Label>
                        <Select value={removeForm.reason} onValueChange={(v) => setRemoveForm({ ...removeForm, reason: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-100 shadow-xl">
                            <SelectItem value="DAMAGE" className="font-normal text-sm py-2">Damaged / Defected</SelectItem>
                            <SelectItem value="WASTE" className="font-normal text-sm py-2">Wastage / Garbage</SelectItem>
                            <SelectItem value="THEFT" className="font-normal text-sm py-2">Theft / Loss</SelectItem>
                            <SelectItem value="EXPIRED" className="font-normal text-sm py-2">Expired Goods</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={DLG.label}>Notes</Label>
                      <Input
                        placeholder="Optional notes"
                        value={removeForm.notes}
                        onChange={(e) => setRemoveForm({ ...removeForm, notes: e.target.value })}
                        className="h-9 border border-gray-200 text-sm text-black text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setIsRemoveOpen(false)}
                        className="text-sm text-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRemoveStock}
                        disabled={isTransferring}
                        size="sm" className="text-sm"
                      >
                        {isTransferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog 
                open={isTransferOpen} 
                onOpenChange={(open) => {
                  setIsTransferOpen(open);
                  if (!open) clearProductUI();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm text-black">
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent className={DLG.content}>
                  <DialogHeader className={DLG.header}>
                    <DialogTitle className={DLG.title}>Transfer stock</DialogTitle>
                    <p className={DLG.desc}>Move quantity from one branch to another.</p>
                  </DialogHeader>
                  <div className={DLG.body}>
                     <div className="space-y-2 relative" ref={transferProductDropdownRef}>
                      <Label className={DLG.label}>Select Product</Label>
                      <div className="relative group">
                        <Input
                          placeholder="Search product..."
                          value={productSearch}
                          onFocus={() => setTransferProductDropdownOpen(true)}
                          autoComplete="off"
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setTransferProductDropdownOpen(true);
                          }}
                          className="px-4 h-9 border border-gray-200 text-sm text-black focus:ring-1 focus:ring-slate-300"
                        />
                        {transferProductDropdownOpen && (
                          <Card className={DLG.dropdown}>
                            {filteredProducts.length === 0 ? (
                               <div className="p-8 text-center">
                                 <p className="text-xs text-gray-500">No products found</p>
                               </div>
                            ) : (
                              <div className="p-2">
                                {filteredProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    className={DLG.pickRow}
                                    onClick={() => {
                                      setTransferForm({ ...transferForm, productId: p.id });
                                      setProductSearch(p.name);
                                      setTransferProductDropdownOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm text-black">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.sku || p.id.slice(0, 8)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex-1 w-full space-y-2">
                        <Label className={DLG.label}>From branch</Label>
                        <Select value={transferForm.fromBranchId} onValueChange={(v) => setTransferForm({ ...transferForm, fromBranchId: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                             <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border border-slate-100 shadow-xl">
                             {branches.map(b => (
                               <SelectItem 
                                 key={b.id} 
                                 value={b.id} 
                                 disabled={b.id === transferForm.toBranchId}
                                 className="font-normal text-sm py-3"
                                >
                                 {b.name}
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      

                      <div className="flex-1 w-full space-y-2">
                         <Label className={DLG.label}>To branch</Label>
                        <Select value={transferForm.toBranchId} onValueChange={(v) => setTransferForm({ ...transferForm, toBranchId: v })}>
                          <SelectTrigger className="h-9 border border-gray-200 text-sm text-black">
                             <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border border-slate-100 shadow-xl">
                             {branches.map(b => (
                               <SelectItem 
                                 key={b.id} 
                                 value={b.id} 
                                 disabled={b.id === transferForm.fromBranchId}
                                 className="font-normal text-sm py-3"
                               >
                                 {b.name}
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <Label className={DLG.label}>Quantity</Label>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={transferForm.quantity}
                          onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                          className="h-9 border border-gray-200 text-sm text-black text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={DLG.label}>Notes</Label>
                        <Input
                          placeholder="Carrier name or ref..."
                          value={transferForm.notes}
                          onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                          className="h-9 border border-gray-200 text-sm text-black text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setIsTransferOpen(false)}
                        className="text-sm text-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTransfer}
                        disabled={isTransferring}
                        size="sm" className="text-sm"
                      >
                        {isTransferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products on this page" value={totalStocks} loading={isLoading} />
        <StatCard label="Total units on this page" value={formatQty(totalUnits)} loading={isLoading} />
        <StatCard label="Low stock on this page" value={alerts} loading={isLoading} />
        <StatCard label="Today's movements" value={todayMovements.length} loading={isLoading} />
      </div>

      <Card className="p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm text-black"
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-9 w-full lg:w-[200px] text-sm text-black">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES} className="text-sm">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-sm">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-full lg:w-[200px] text-sm text-black">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES} className="text-sm">All categories</SelectItem>
              {categories.map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 px-2">
        <span className="text-sm text-gray-600 mr-2">Status:</span>
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-normal text-xs px-3 py-1 rounded-lg">In Stock</Badge>
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-normal text-xs px-3 py-1 rounded-lg">Low</Badge>
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-normal text-xs px-3 py-1 rounded-lg">Out</Badge>
      </div>

      {/* Tabs for Stock and History */}
      <Tabs defaultValue="stock" className="space-y-6">
        <div className="flex px-1">
          <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm h-11 shrink-0 w-full max-w-md grid grid-cols-3">
            <TabsTrigger value="stock" className="rounded-lg h-9 text-sm data-[state=active]:bg-black data-[state=active]:text-white transition-all">Stock List</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg h-9 text-sm data-[state=active]:bg-black data-[state=active]:text-white transition-all">Movement Log</TabsTrigger>
            <TabsTrigger value="today" className="rounded-lg h-9 text-sm data-[state=active]:bg-black data-[state=active]:text-white transition-all">Today</TabsTrigger>
          </TabsList>
        </div>

        {/* Current Stock Tab Content */}
        <TabsContent value="stock" className="mt-0 outline-none animate-in fade-in duration-500">
          <Card className="border border-gray-200 overflow-hidden bg-white">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-base font-bold text-black">Stock list</CardTitle>
                   <p className="text-sm text-gray-600 mt-0.5">{totalStocks} products on this page</p>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              {isLoading && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px]">
                  <PageLoader message="Loading..." />
                </div>
              )}
              
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-sm text-gray-600 py-3">Product</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3">SKU</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3 text-center">Quantity</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3">Status</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3 text-right">Last updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allStocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-24">
                        <div className="flex flex-col items-center opacity-20">
                          <Package className="h-12 w-12 mb-3 text-slate-300" />
                          <p className="text-sm text-gray-500">No stock found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allStocks.map((s) => {
                      const qty = Number(s.current_quantity || 0);
                      const status = getStockStatusMeta(qty);
                      return (
                        <TableRow key={s.id} className="hover:bg-slate-50/50 group transition-all duration-200 border-slate-50">
                          <TableCell className="p-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm text-black">{s.product.name}</span>
                              <span className="text-xs text-gray-500 mt-1">{s.branch?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block uppercase">
                               {s.product.sku || (s.product.id ? s.product.id.slice(0, 8) : 'N/A')}
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-black">{formatQty(qty)}</span>
                          </TableCell>
                          <TableCell>
                            <div className={`px-2 py-0.5 rounded text-xs inline-block border ${status.className}`}>
                              {status.label}
                            </div>
                          </TableCell>
                          <TableCell className="p-8 py-5 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-xs text-slate-500 uppercase">{new Date(s.last_updated).toLocaleDateString()}</span>
                                <span className="text-xs text-slate-400 uppercase">Checked: {new Date(s.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Section */}
              {totalStocks > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-slate-50/30 border-t border-slate-100 gap-4">
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-500">Rows per page:</span>
                     <Select value={String(stockPageSize)} onValueChange={(v) => { setStockPageSize(Number(v)); setStockPage(1); }}>
                       <SelectTrigger className="w-16 h-8 border-slate-200 bg-white rounded-lg text-xs font-normal">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-slate-100">
                         {paginationOptions.map((size) => <SelectItem key={size} value={String(size)} className="font-normal text-xs">{size}</SelectItem>)}
                       </SelectContent>
                     </Select>
                     <span className="text-xs text-slate-400 ml-2">
                       Page {stockPage} of {totalStockPages}
                     </span>
                  </div>
                  
                  {totalStockPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStockPage(p => Math.max(1, p - 1))}
                        disabled={stockPage === 1}
                        className="rounded-xl font-normal text-xs border-slate-200 h-9 px-4 hover:bg-white"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-2">{stockPage}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStockPage(p => Math.min(totalStockPages, p + 1))}
                        disabled={stockPage === totalStockPages}
                        className="rounded-xl font-normal text-xs border-slate-200 h-9 px-4 hover:bg-white"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement History Tab Content */}
        <TabsContent value="history" className="mt-0 outline-none animate-in fade-in duration-500">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-sm text-gray-600 py-3">Date</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3">Product</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3">Type</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3 text-center">Change</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3">Before → after</TableHead>
                    <TableHead className="text-sm text-gray-600 py-3 text-right">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-20 text-slate-400 text-xs uppercase font-semibold">No movement history discovered</TableCell>
                    </TableRow>
                  ) : (
                    history.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="p-8 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>                         <TableCell>
                           <div className="flex flex-col min-w-[200px]">
                              <span className="font-normal text-slate-700 text-xs">{m.product.name}</span>
                              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">{m.branch?.name}</span>
                           </div>
                        </TableCell>
                        <TableCell>{getMovementBadge(m.movement_type)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-normal ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.quantity_change > 0 ? "+" : ""}{formatQty(Number(m.quantity_change))}
                          </span>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                             <span className="bg-slate-50 px-2 py-0.5 rounded">{formatQty(Number(m.previous_qty))}</span>
                             <ArrowRightLeft className="h-2.5 w-2.5 opacity-30" />
                             <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-normal">{formatQty(Number(m.new_qty))}</span>
                           </div>
                        </TableCell>
                        <TableCell className="p-8 py-4 text-right text-xs font-semibold text-slate-400 uppercase max-w-[120px] truncate">
                          {m.user?.email.split('@')[0] || "SYSTEM"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
           </Card>
        </TabsContent>

        {/* Today's Movement Tab */}
        <TabsContent value="today" className="mt-0 outline-none animate-in fade-in duration-500">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/30">
                   <TableRow className="border-slate-100">
                    <TableHead className="font-semibold text-xs uppercase p-8 py-4 text-slate-400 ">Timestamp</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-400 ">Target Entity</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-400 ">Protocol</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-center text-slate-400 ">Variance</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-400 ">Final State</TableHead>
                    <TableHead className="font-semibold text-xs uppercase p-8 py-4 text-right text-slate-400 ">Audit Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {todayMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center p-20 text-slate-400 text-xs uppercase font-semibold">No events recorded today</TableCell>
                      </TableRow>
                   ) : (
                     todayMovements.map((m) => (
                        <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="p-8 py-4 text-xs font-semibold text-indigo-600 uppercase">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-normal text-slate-700 text-xs">{m.product.name}</TableCell>
                          <TableCell>{getMovementBadge(m.movement_type)}</TableCell>
                          <TableCell className="text-center font-normal text-sm text-slate-700">{m.quantity_change > 0 ? "+" : ""}{formatQty(Number(m.quantity_change))}</TableCell>
                          <TableCell>
                             <div className="bg-slate-900 text-white px-2 py-0.5 rounded font-normal text-xs inline-block">{formatQty(Number(m.new_qty))}</div>
                          </TableCell>
                          <TableCell className="p-8 py-4 text-right text-xs text-slate-400 max-w-[150px] truncate uppercase">
                            {m.notes || "-"}
                          </TableCell>
                        </TableRow>
                     ))
                   )}
                </TableBody>
              </Table>
           </Card>
        </TabsContent>
      </Tabs>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
