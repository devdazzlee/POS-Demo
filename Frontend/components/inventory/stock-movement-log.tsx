"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/ui/page-loader";
import { format } from "date-fns";
import { 
  Download, 
  Search, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  MapPin, 
  Calendar, 
  Filter, 
  RefreshCw,
  Archive,
  History,
  TrendingUp,
  AlertTriangle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { usePosData } from "@/hooks/use-pos-data";
import { Label } from "@/components/ui/label";

const parseDate = (s: string) => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatDate = (d?: Date) => {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};


const MOVEMENT_TYPES = [
  { value: "PURCHASE", label: "Inventory Purchase", icon: Archive },
  { value: "SALE", label: "Point of Sale", icon: TrendingUp },
  { value: "ADJUSTMENT", label: "Stock Adjustment", icon: Filter },
  { value: "TRANSFER_IN", label: "Inbound Transfer", icon: ArrowUpRight },
  { value: "TRANSFER_OUT", label: "Outbound Transfer", icon: ArrowDownRight },
  { value: "RETURN", label: "Customer Return", icon: History },
  { value: "DAMAGE", label: "Damage / Loss", icon: AlertTriangle },
];

export function StockMovementLog() {
  const { 
    products, 
    branches, 
    productsLoading, 
    fetchProducts,
    fetchBranches
  } = usePosData();

  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  // Custom Search States
  const [prodSearch, setProdSearch] = useState("");
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    branchId: "all",
    productId: "all",
    movementType: "all",
    startDate: "",
    endDate: "",
  });

  const hasActiveFilters = filters.branchId !== "all" || filters.productId !== "all" || filters.movementType !== "all" || !!filters.startDate || !!filters.endDate;

  const clearFilters = () => {
    setFilters({ branchId: "all", productId: "all", movementType: "all", startDate: "", endDate: "" });
    setProdSearch("");
    setPage(1);
  };

  const fetchMovements = useCallback(async (pg = page) => {
    try {
      setLoading(true);
      const params: any = { page: pg, limit: PAGE_SIZE };
      if (filters.branchId !== "all") params.branchId = filters.branchId;
      if (filters.productId !== "all") params.productId = filters.productId;
      if (filters.movementType !== "all") params.movementType = filters.movementType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await apiClient.get(`${API_BASE}/inventory/movements`, { params });
      setMovements(res.data?.data || []);
      setSummary(res.data?.summary || null);
      const total = res.data?.meta?.total || (res.data?.data?.length ?? 0);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, [fetchProducts, fetchBranches]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProdDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProd = useMemo(() => {
    const term = prodSearch.toLowerCase();
    if (!term) return products.slice(0, 50);
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.sku && p.sku.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [products, prodSearch]);

  const selectedProdName = products.find(p => p.id === filters.productId)?.name || "";

  const exportCSV = () => {
    if (movements.length === 0) return;
    const headers = ["Timestamp", "Activity", "Product", "Identifier", "Delta", "Prev", "Final", "Location", "Ref", "Operator"];
    const rows = movements.map((m) => [
      new Date(m.created_at).toLocaleString(),
      m.movement_type,
      m.product?.name || "",
      m.product?.sku || "",
      m.quantity_change,
      m.previous_qty,
      m.new_qty,
      m.branch?.name || "",
      m.reference_id || "",
      m.user?.email || "System",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enterprise-stock-audit-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit Exported", { description: "CSV record has been saved safely." });
  };

  const getMovementStyle = (type: string, qty: number) => {
    if (qty > 0) return { color: "text-emerald-600", bg: "bg-emerald-50", icon: <ArrowUpRight className="h-3 w-3" /> };
    if (qty < 0) return { color: "text-rose-600", bg: "bg-rose-50", icon: <ArrowDownRight className="h-3 w-3" /> };
    return { color: "text-slate-500", bg: "bg-slate-50", icon: <Activity className="h-3 w-3" /> };
  };

  if (loading && movements.length === 0) return <PageLoader message="Loading movement log..." />;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-black tracking-tight">Stock Movement Log</h1>
            {/* <p className="text-xs text-black/60">View and trace stock activities across locations</p> */}
          </div>
        </div>

        {/* Filter row — every field uses the same label/control structure and
            the row is `items-end` so labels float above, controls align on a
            single baseline. The button group uses an invisible label spacer
            so its baseline matches the inputs (no inline marginTop hack). */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Branch */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Location
            </label>
            <Select value={filters.branchId} onValueChange={(v) => setFilters(f => ({ ...f, branchId: v }))}>
              <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-slate-50/50 font-normal text-xs text-black">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-normal text-xs pl-8 pr-4 py-2 text-black">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id} className="font-normal text-xs pl-8 pr-4 py-2 text-black">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              From Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 w-[140px] justify-start text-left font-normal text-xs border-slate-200 bg-slate-50/50 text-black hover:bg-slate-100/50">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  {filters.startDate ? format(parseDate(filters.startDate)!, "MM/dd/yyyy") : <span className="text-black/60">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={parseDate(filters.startDate)} onSelect={(d) => setFilters(f => ({ ...f, startDate: formatDate(d) }))} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              To Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 w-[140px] justify-start text-left font-normal text-xs border-slate-200 bg-slate-50/50 text-black hover:bg-slate-100/50">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  {filters.endDate ? format(parseDate(filters.endDate)!, "MM/dd/yyyy") : <span className="text-black/60">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={parseDate(filters.endDate)} onSelect={(d) => setFilters(f => ({ ...f, endDate: formatDate(d) }))} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Buttons — invisible label keeps the row baseline aligned. */}
          <div className="flex flex-col gap-1">
            <span
              aria-hidden="true"
              className="text-[10px] font-medium uppercase tracking-wider invisible select-none"
            >
              Actions
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fetchMovements(1)}
                disabled={loading}
                className="h-9 bg-slate-900 hover:bg-black text-white font-normal px-4 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Apply
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-9 text-xs font-normal text-black hover:bg-slate-100/50"
                >
                  Clear Filters
                </Button>
              )}
              <Button
                onClick={exportCSV}
                variant="outline"
                className="h-9 px-4 font-normal text-xs gap-1.5 text-black border-slate-200"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards — same pattern as Stock Adjustments: white card, small
          colored icon, label + number. No giant rounded blocks, no full
          colored backgrounds. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md text-green-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Inbound</p>
              <h3 className="text-xl font-semibold text-green-600">
                +{summary?.totalIncrease || 0}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-md text-red-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Outbound</p>
              <h3 className="text-xl font-semibold text-red-600">
                -{summary?.totalDecrease || 0}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Flux</p>
              <h3 className="text-xl font-semibold text-black">
                {(summary?.totalIncrease || 0) - (summary?.totalDecrease || 0)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-md text-gray-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activity Logged</p>
              <h3 className="text-xl font-semibold text-black">
                {summary?.count || movements.length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 items-end bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
         <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label className="text-[10px] font-normal text-black uppercase tracking-wider ml-1">Activity Type</Label>
            <Select value={filters.movementType} onValueChange={(v) => setFilters(f => ({...f, movementType: v}))}>
              <SelectTrigger className="h-9 bg-white border-slate-200 font-normal text-xs text-black">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-normal text-xs pl-8 pr-4 py-2 text-black">All Activity Types</SelectItem>
                {MOVEMENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="font-normal text-xs pl-8 pr-4 py-2 text-black">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>

         <div className="flex-1 min-w-[300px] space-y-1.5 relative" ref={dropdownRef}>
            <Label className="text-[10px] font-normal text-black uppercase tracking-wider ml-1">Product (SKU/Name)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search SKU or Name..."
                className="h-9 pl-9 bg-white border-slate-200 font-normal text-xs text-black"
                value={filters.productId === "all" ? prodSearch : selectedProdName}
                onFocus={() => {
                  setProdDropdownOpen(true);
                  if (filters.productId !== "all") {
                    setFilters(f => ({ ...f, productId: "all" }));
                    setProdSearch("");
                  }
                }}
                onChange={(e) => { setProdSearch(e.target.value); setProdDropdownOpen(true); }}
              />
              {filters.productId !== "all" && (
                <button onClick={() => { setFilters(f => ({ ...f, productId: "all" })); setProdSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full">
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
            {prodDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl">
                <button onClick={() => { setFilters(f => ({ ...f, productId: "all" })); setProdDropdownOpen(false); setProdSearch(""); }} className="w-full p-3 text-left font-normal text-xs text-black/60 hover:bg-slate-50 border-b border-slate-50">
                  All Products
                </button>
                {productsLoading ? (
                  <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-400" /></div>
                ) : filteredProd.length === 0 ? (
                  <div className="p-4 text-center text-xs font-normal text-black/60">No matches found</div>
                ) : (
                  filteredProd.map(p => (
                    <button key={p.id} onClick={() => { setFilters(f => ({ ...f, productId: p.id })); setProdDropdownOpen(false); setProdSearch(p.name); }} className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors">
                      <div className="flex flex-col">
                        <span className="font-normal text-black text-xs">{p.name}</span>
                        <span className="text-[10px] font-normal text-black/60">SKU: {p.sku || "N/A"}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
         </div>
      </div>

      {/* AUDIT TABLE */}
      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-4 w-[15%] rounded" />
                  <Skeleton className="h-4 w-[12%] rounded" />
                  <Skeleton className="h-4 w-[25%] rounded" />
                  <Skeleton className="h-4 w-[10%] rounded ml-auto" />
                  <Skeleton className="h-4 w-[8%] rounded" />
                  <Skeleton className="h-4 w-[10%] rounded" />
                  <Skeleton className="h-4 w-[12%] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-normal text-[10px] uppercase tracking-wider text-black">Timestamp</TableHead>
                  <TableHead className="py-4 font-normal text-[10px] uppercase tracking-wider text-black">Activity</TableHead>
                  <TableHead className="py-4 font-normal text-[10px] uppercase tracking-wider text-black">Product</TableHead>
                  <TableHead className="py-4 font-normal text-[10px] uppercase tracking-wider text-black text-right">SKU</TableHead>
                  <TableHead className="py-4 font-normal text-[10px] uppercase tracking-wider text-black text-right">Delta</TableHead>
                  <TableHead className="py-4 font-normal text-[10px] uppercase tracking-wider text-black text-right">Prev / New</TableHead>
                  <TableHead className="py-4 px-6 font-normal text-[10px] uppercase tracking-wider text-black text-right">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const style = getMovementStyle(m.movement_type, Number(m.quantity_change));
                  return (
                    <TableRow key={m.id} className="border-slate-50 hover:bg-slate-50/40 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-normal text-black text-xs">{new Date(m.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] font-normal text-black/60">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${style.bg} ${style.color} border-none font-normal text-[10px] py-0.5 px-2.5 rounded-md flex items-center w-fit gap-1`}>
                          {style.icon} {m.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-black/40 text-xs font-normal">
                            {m.product?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-normal text-black text-xs">{m.product?.name}</p>
                            <span className="text-[10px] font-normal text-black/60">Ref: {m.reference_id?.slice(0, 8) || "—"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-normal text-black text-xs">{m.product?.sku || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-normal text-xs ${style.color}`}>{Number(m.quantity_change) > 0 ? "+" : ""}{m.quantity_change}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-normal text-black">{m.new_qty} Units</span>
                          <span className="text-[10px] font-normal text-black/60">Was {m.previous_qty}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="text-xs font-normal text-black">{m.branch?.name || "Main Warehouse"}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {movements.length === 0 && !loading && (
            <div className="p-24 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Archive className="h-8 w-8 text-slate-200" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">No movements found</h4>
                <p className="text-xs text-black/60 mt-1 max-w-[240px]">Adjust your filters or date range to find stock activity records.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-normal text-black/60">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-black" disabled={page <= 1} onClick={() => { const np = page - 1; setPage(np); fetchMovements(np); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <Button key={pg} variant={pg === page ? "default" : "outline"} size="sm" className={`h-8 w-8 p-0 text-xs font-normal ${pg === page ? "bg-slate-900 text-white" : "border-slate-200 text-black"}`} onClick={() => { setPage(pg); fetchMovements(pg); }}>
                  {pg}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-black" disabled={page >= totalPages} onClick={() => { const np = page + 1; setPage(np); fetchMovements(np); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs font-normal text-black/60">{summary?.count || 0} total records</p>
        </div>
      )}
    </div>
  );
}

