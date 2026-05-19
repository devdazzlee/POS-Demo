"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit, 
  Loader2, 
  Plus, 
  Search, 
  MapPin, 
  Package, 
  ClipboardCheck, 
  History, 
  ArrowRightLeft, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  X
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { usePosData } from "@/hooks/use-pos-data";
import { PageLoader } from "@/components/ui/page-loader";



export function StockAdjustment() {
  const { 
    products, 
    branches, 
    productsLoading, 
    fetchProducts,
    fetchBranches
  } = usePosData();

  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdjustments, setTotalAdjustments] = useState(0);
  const PAGE_SIZE = 20;
  
  // Custom Search Dropdown States
  const [searchTerm, setSearchTerm] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    productId: "",
    branchId: "",
    adjustmentType: "RECONCILIATION" as any,
    adjustmentCategory: "CORRECTION" as any,
    physicalCount: "",
    changeQuantity: "",
    referenceNo: "",
    reason: "",
  });

  const fetchAdjustments = useCallback(async (pg: number = page) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/stock-adjustments`, {
        params: { page: pg, limit: PAGE_SIZE },
      });
      setAdjustments(res.data?.data || []);
      const total = res.data?.meta?.total ?? res.data?.data?.length ?? 0;
      setTotalAdjustments(total);
      setTotalPages(
        res.data?.meta?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE)),
      );
    } catch (e: any) {
      toast({
        title: "Sync Error",
        description: e?.response?.data?.message || "Failed to load adjustment history",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [page]);

  const fetchStockLevels = useCallback(async () => {
    try {
      const sRes = await apiClient.get(`${API_BASE}/stock`, { params: { limit: 1000 } });
      const stockList = sRes.data?.data || [];
      const map: Record<string, number> = {};
      stockList.forEach((s: any) => {
        map[`${s.product_id}-${s.branch_id}`] = Number(s.current_quantity || 0);
      });
      setStocks(map);
    } catch (e) {
      console.error("Failed to fetch stock levels", e);
    }
  }, []);

  useEffect(() => {
    fetchStockLevels();
    fetchProducts();
    fetchBranches();
  }, [fetchStockLevels, fetchProducts, fetchBranches]);

  // Refetch adjustments whenever the page changes.
  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return products.slice(0, 50);
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.sku && p.sku.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === form.productId),
    [products, form.productId]
  );

  const systemQty = useMemo(() => {
    if (form.productId && form.branchId) {
      return stocks[`${form.productId}-${form.branchId}`] ?? 0;
    }
    return 0;
  }, [form.productId, form.branchId, stocks]);

  const difference = useMemo(() => {
    if (form.adjustmentType === 'RECONCILIATION') {
       if (form.physicalCount === "") return null;
       return Number(form.physicalCount) - systemQty;
    } else if (form.adjustmentType === 'ADDITION') {
       return Number(form.changeQuantity || 0);
    } else {
       return -Math.abs(Number(form.changeQuantity || 0));
    }
  }, [form.adjustmentType, form.physicalCount, form.changeQuantity, systemQty]);

  const handleSubmit = async () => {
    if (!form.productId || !form.branchId) {
      toast({ title: "Validation Error", description: "Product and Branch are required", variant: "destructive" });
      return;
    }

    const payload: any = {
      productId: form.productId,
      branchId: form.branchId,
      systemQuantity: systemQty,
      adjustmentType: form.adjustmentType,
      adjustmentCategory: form.adjustmentCategory,
      reason: form.reason || `${form.adjustmentType} via POS Portal`,
      referenceNo: form.referenceNo,
    };

    if (form.adjustmentType === 'RECONCILIATION') {
       if (form.physicalCount === "") {
          toast({ title: "Missing Count", description: "Physical count is required for reconciliation", variant: "destructive" });
          return;
       }
       payload.physicalCount = Number(form.physicalCount);
    } else {
       if (form.changeQuantity === "") {
          toast({ title: "Missing Quantity", description: "Change quantity is required", variant: "destructive" });
          return;
       }
       payload.changeQuantity = Number(form.changeQuantity);
    }

    try {
      setSubmitting(true);
      await apiClient.post(`${API_BASE}/stock-adjustments`, payload);
      toast.success("Inventory record successfully synchronized.");
      setDialogOpen(false);
      setForm({
         productId: "", branchId: "", adjustmentType: "RECONCILIATION", 
         adjustmentCategory: "CORRECTION", physicalCount: "", changeQuantity: "", 
         referenceNo: "", reason: "" 
      });
      setSearchTerm("");
      // Jump back to page 1 so the newly-created adjustment is visible.
      if (page !== 1) setPage(1);
      else fetchAdjustments(1);
      fetchStockLevels();
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message || e?.message || "Failed to execute stock adjustment";
      toast.error(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (adjustments.length === 0) return;
    const headers = ["Date", "Product", "Branch", "Type", "Category", "System Qty", "Change/Phys", "Difference", "Staff", "Reason"];
    const rows = adjustments.map(a => [
      new Date(a.adjustment_date).toLocaleString(),
      a.product?.name || "",
      a.branch?.name || "",
      a.adjustment_type,
      a.adjustment_category,
      a.system_quantity,
      a.adjustment_type === 'RECONCILIATION' ? a.physical_count : a.change_quantity,
      a.difference,
      a.user?.email || "N/A",
      a.reason || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-adjustments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = useMemo(() => {
    const totalCount = adjustments.length;
    let shrink = 0;
    let gain = 0;
    adjustments.forEach(a => {
       const diff = Number(a.difference);
       if (diff < 0) shrink += Math.abs(diff);
       else gain += diff;
    });
    return { totalCount, shrink: shrink.toFixed(2), gain: gain.toFixed(2) };
  }, [adjustments]);

  if (loading && adjustments.length === 0) return <PageLoader message="Loading stock adjustments..." />;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Stock Adjustments</h1>
          <p className="text-sm text-gray-600 mt-1">
            Physical inventory reconciliation & operational corrections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            size="sm"
            className="text-sm text-black"
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-sm">
                <Plus className="h-4 w-4 mr-2" /> New Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-black">
                  Inventory Correction Form
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Submit stock level adjustments and audit notes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  {/* Product search */}
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <Label className="text-sm text-black">Product</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search SKU or name..."
                        className="h-9 pl-9 text-sm text-black"
                        value={form.productId ? selectedProduct?.name : searchTerm}
                        onFocus={() => {
                          setProductDropdownOpen(true);
                          if (form.productId) {
                            setSearchTerm("");
                            setForm((f) => ({ ...f, productId: "" }));
                          }
                        }}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setProductDropdownOpen(true);
                        }}
                      />
                      {form.productId && (
                        <button
                          onClick={() => {
                            setForm((f) => ({ ...f, productId: "" }));
                            setSearchTerm("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>

                    {productDropdownOpen && (
                      <div className="mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-center text-sm text-gray-500">
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setForm((f) => ({ ...f, productId: p.id }));
                                setProductDropdownOpen(false);
                                setSearchTerm(p.name);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-none border-gray-100"
                            >
                              <span className="block text-sm text-black truncate">{p.name}</span>
                              <span className="block text-xs text-gray-500">SKU: {p.sku || "N/A"}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Branch</Label>
                    <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}>
                      <SelectTrigger className="h-9 text-sm text-black">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id} className="text-sm">
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Adjustment Type</Label>
                    <Select value={form.adjustmentType} onValueChange={(v) => setForm((f) => ({ ...f, adjustmentType: v }))}>
                      <SelectTrigger className="h-9 text-sm text-black">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECONCILIATION">Reconciliation (Reset)</SelectItem>
                        <SelectItem value="ADDITION">Addition (+)</SelectItem>
                        <SelectItem value="SUBTRACTION">Subtraction (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Category</Label>
                    <Select value={form.adjustmentCategory} onValueChange={(v) => setForm((f) => ({ ...f, adjustmentCategory: v }))}>
                      <SelectTrigger className="h-9 text-sm text-black">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRECTION">Standard correction</SelectItem>
                        <SelectItem value="DAMAGE">Damaged / broken</SelectItem>
                        <SelectItem value="EXPIRED">Expired stock</SelectItem>
                        <SelectItem value="THEFT">Missing / theft</SelectItem>
                        <SelectItem value="RETURN_TO_SUPPLIER">Return to supplier</SelectItem>
                        <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-md grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm text-black">Current System Qty</p>
                    <p className="text-lg text-black">
                      {form.productId && form.branchId ? systemQty : "—"}{" "}
                      <span className="text-sm text-gray-500">Units</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">
                      {form.adjustmentType === "RECONCILIATION" ? "New Physical Count" : "Quantity Change"}
                    </Label>
                    <Input
                      type="number"
                      className="h-9 text-sm text-black text-center"
                      placeholder="0"
                      value={form.adjustmentType === "RECONCILIATION" ? form.physicalCount : form.changeQuantity}
                      onChange={(e) => {
                        if (form.adjustmentType === "RECONCILIATION")
                          setForm((f) => ({ ...f, physicalCount: e.target.value }));
                        else setForm((f) => ({ ...f, changeQuantity: e.target.value }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Reference / Batch ID</Label>
                    <Input
                      className="h-9 text-sm text-black"
                      placeholder="REF-XXXXX"
                      value={form.referenceNo}
                      onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Stock Variance</Label>
                    <div className="h-9 rounded-md flex items-center px-3 text-sm text-black bg-gray-50 border border-gray-200">
                      {difference !== null ? (
                        <>
                          {difference > 0 ? "+" : ""}
                          {difference} Units
                        </>
                      ) : (
                        "Pending input"
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Remarks / Reason</Label>
                  <Textarea
                    className="text-sm text-black min-h-[60px] resize-none"
                    placeholder="Detailed explanation for audit log..."
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={submitting} size="sm" className="w-full text-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Adjustment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Audit Cycles</p>
              <h3 className="text-xl font-semibold text-black">{stats.totalCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-md text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inventory Shrinkage</p>
              <h3 className="text-xl font-semibold text-red-600">-{stats.shrink}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Procedural Gains</p>
              <h3 className="text-xl font-semibold text-green-600">+{stats.gain}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* History table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-sm font-medium text-black">Date</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Product</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Location</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Type / Category</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black text-right">Variance</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black text-right">Remarks</TableHead>
                <TableHead className="px-6 py-4 text-sm font-medium text-black text-right">Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((a) => (
                <TableRow key={a.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="px-6 py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-black">
                        {new Date(a.adjustment_date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(a.adjustment_date).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-black truncate max-w-[200px]">{a.product?.name}</span>
                      <span className="text-xs text-gray-500">{a.product?.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 align-top">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 text-sm text-black">
                      <MapPin className="h-3.5 w-3.5 text-gray-500" /> {a.branch?.name}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-black">{a.adjustment_type}</span>
                      <span className="text-xs text-gray-500">{a.adjustment_category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-right align-top">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-sm font-medium text-black">
                        {Number(a.difference) > 0 ? "+" : ""}
                        {a.difference}
                      </span>
                      <span className="text-xs text-gray-500">
                        Total: {a.physical_count ?? a.change_quantity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-right max-w-[200px] align-top">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-sm text-black truncate max-w-full">
                        {a.reason || "—"}
                      </span>
                      {a.reference_no && (
                        <span className="text-xs text-gray-500"># {a.reference_no}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right align-top">
                    <span className="text-sm text-black">
                      {a.user?.email?.split("@")[0] || "Operator"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {adjustments.length === 0 && !loading && (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <History className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-black">No adjustments found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalAdjustments > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-black">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalAdjustments)} of {totalAdjustments}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="text-sm text-black"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="text-sm text-black"
              >
                Previous
              </Button>
              <span className="text-sm text-black px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="text-sm text-black"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="text-sm text-black"
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
