"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Download, 
  Search, 
  MapPin, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Filter,
  RefreshCw,
  LayoutDashboard,
  X,
  Loader2
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { usePosData } from "@/hooks/use-pos-data";
import { PageLoader } from "@/components/ui/page-loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AuditSummary {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  profitMargin: number;
  transactionCount: number;
}

interface BranchMetric {
  name: string;
  revenue: number;
  cogs: number;
  profit: number;
  count: number;
}

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const formatCurrency = (n: number) =>
  `Rs ${Number(n).toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;

export function InventoryAudit() {
  const { 
    products, 
    categories, 
    branches, 
    productsLoading, 
    categoriesLoading,
    fetchProducts,
    fetchCategories,
    fetchBranches
  } = usePosData();

  const [data, setData] = useState<BranchMetric[] | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Custom Search States
  const [prodSearch, setProdSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const prodRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const parseDate = (dStr: string) => {
    if (!dStr) return undefined;
    const [year, month, day] = dStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState({
    branchId: "all",
    startDate: "",
    endDate: "",
    categoryId: "all",
    productId: "all"
  });

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { type: "financial_audit" };
      if (filters.branchId !== "all") params.branchId = filters.branchId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.categoryId !== "all") params.categoryId = filters.categoryId;
      if (filters.productId !== "all") params.productId = filters.productId;

      const response = await apiClient.get("/inventory/reports", { params });
      const report = response.data.data;
      setData(report.data || []);
      setSummary(report.summary || null);
    } catch (error: any) {
      const backendError = error?.response?.data?.message || error?.message || "Internal Telemetry Error";
      toast.error(backendError);
    } finally {
      await new Promise(r => setTimeout(r, 600));
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBranches();
  }, [fetchProducts, fetchCategories, fetchBranches]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (prodRef.current && !prodRef.current.contains(event.target as Node)) setProdDropdownOpen(false);
      if (catRef.current && !catRef.current.contains(event.target as Node)) setCatDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProd = useMemo(() => {
    const term = prodSearch.toLowerCase();
    if (!term) return products.slice(0, 50);
    return products.filter(p => p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term))).slice(0, 50);
  }, [products, prodSearch]);

  const filteredCat = useMemo(() => {
    const term = catSearch.toLowerCase();
    if (!term) return categories.slice(0, 50);
    return categories.filter(c => c.name.toLowerCase().includes(term)).slice(0, 50);
  }, [categories, catSearch]);

  const selectedProdName = products.find(p => p.id === filters.productId)?.name || "";
  const selectedCatName = categories.find(c => c.id === filters.categoryId)?.name || "";

  const resetFilters = () => {
    setFilters({
      branchId: "all",
      startDate: "",
      endDate: "",
      categoryId: "all",
      productId: "all"
    });
    setCatSearch("");
    setProdSearch("");
    setIsFilterOpen(false);
  };

  const exportAudit = () => {
    // ... same as before ...
    if (!data || !summary) return;
    const headers = ["Branch", "Transactions", "Revenue", "COGS", "Gross Profit", "Margin (%)"];
    const rows = data.map(b => [
      b.name,
      b.count,
      b.revenue.toFixed(2),
      b.cogs.toFixed(2),
      b.profit.toFixed(2),
      ((b.profit / b.revenue) * 100 || 0).toFixed(2)
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-audit-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit report exported successfully");
  };

  const hasActiveFilters = filters.branchId !== "all" || 
    filters.categoryId !== "all" || 
    filters.productId !== "all" || 
    filters.startDate !== "" || 
    filters.endDate !== "";

  if (loading && !data) {
    return <PageLoader message="Loading financial audit..." />;
  }

  return (
    <div className="px-4 py-2 md:px-8 md:py-4 space-y-6 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Financial Audit</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <Select value={filters.branchId} onValueChange={(v) => setFilters(f => ({...f, branchId: v}))}>
              <SelectTrigger className="w-[180px] h-10 border-none bg-transparent shadow-none focus:ring-0 font-medium text-slate-900 text-sm">
                <MapPin className="h-4 w-4 mr-2 text-slate-900" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="all" className="font-normal text-sm py-2 pl-8 pr-4">All Branches</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-normal text-sm py-2 pl-8 pr-4">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 px-3 border-l border-slate-200">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center text-sm font-normal text-slate-700 hover:text-slate-900 focus:outline-none py-1.5 px-2.5 rounded-lg hover:bg-slate-100/80 transition-colors">
                    {filters.startDate ? format(parseDate(filters.startDate)!, "MM/dd/yyyy") : <span className="text-slate-400">Start Date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent 
                    mode="single" 
                    selected={parseDate(filters.startDate)} 
                    onSelect={(d) => setFilters(f => ({...f, startDate: formatDate(d)}))} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-slate-300 text-sm font-medium">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center text-sm font-normal text-slate-700 hover:text-slate-900 focus:outline-none py-1.5 px-2.5 rounded-lg hover:bg-slate-100/80 transition-colors">
                    {filters.endDate ? format(parseDate(filters.endDate)!, "MM/dd/yyyy") : <span className="text-slate-400">End Date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent 
                    mode="single" 
                    selected={parseDate(filters.endDate)} 
                    onSelect={(d) => setFilters(f => ({...f, endDate: formatDate(d)}))} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={exportAudit}
            className="rounded-xl h-10 px-4 bg-slate-900 hover:bg-black text-white font-semibold text-xs gap-2 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
          <CardContent className="p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-100 opacity-80 mb-1">Gross Revenue</p>
              <h3 className="text-xl md:text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</h3>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-none text-xs font-normal">
                  <Activity className="h-3.5 w-3.5 mr-1" />
                  {summary?.transactionCount} Sales
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-slate-900 text-white overflow-hidden">
          <CardContent className="p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">COGS (Total Cost)</p>
              <h3 className="text-xl md:text-2xl font-bold">{formatCurrency(summary?.totalCOGS || 0)}</h3>
              <p className="mt-4 text-xs font-normal text-slate-500 uppercase">Inventory Consumption Value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Gross Profit</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{formatCurrency(summary?.grossProfit || 0)}</h3>
              <div className="mt-4 flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                <ArrowUpRight className="h-4 w-4" />
                Net Earnings
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Profit Margin</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{(summary?.profitMargin || 0).toFixed(1)}<span className="text-sm text-slate-400 ml-1">%</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, summary?.profitMargin || 0)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BRANCH DETAILS */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Branch Performance Audit</CardTitle>
              <CardDescription className="text-xs font-normal text-slate-400 mt-1">Comparative Analysis of Revenue vs Profitability</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  onClick={resetFilters}
                  className="rounded-xl h-10 px-4 font-semibold text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 transition-all"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-xl h-10 px-4 font-medium text-sm gap-2 border-slate-200 text-slate-800 hover:text-black hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="h-4 w-4 text-slate-800" />
                    Advanced Filters
                  </Button>
                </SheetTrigger>
              <SheetContent className="rounded-l-[32px] border-l border-slate-100 p-8 flex flex-col h-full bg-white sm:max-w-md">
                <SheetHeader className="space-y-1 mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-slate-100 p-2 rounded-xl">
                      <Filter className="h-4 w-4 text-black" />
                    </div>
                    <SheetTitle className="text-lg font-bold text-black tracking-tight">Audit Filters</SheetTitle>
                  </div>
                  <SheetDescription className="text-xs font-normal text-black/80">
                    Narrow down your financial performance analysis
                  </SheetDescription>
                </SheetHeader>
 
                <div className="space-y-6 flex-1 overflow-y-auto px-1 custom-scrollbar">
                  {/* CATEGORY SEARCH DROPDOWN */}
                  <div className="space-y-2 relative" ref={catRef}>
                    <Label className="text-xs font-semibold text-black ml-1">Category</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        placeholder="Search categories..."
                        className="h-10 pl-11 rounded-xl bg-slate-50 border-none font-normal text-black text-sm placeholder:text-slate-500"
                        value={filters.categoryId === "all" ? catSearch : selectedCatName}
                        onFocus={() => { setCatDropdownOpen(true); if(filters.categoryId !== "all") setFilters(f => ({...f, categoryId: "all"})); }}
                        onChange={(e) => { setCatSearch(e.target.value); setCatDropdownOpen(true); }}
                      />
                      {filters.categoryId !== "all" && <button onClick={() => { setFilters(f => ({...f, categoryId: "all"})); setCatSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"><X className="h-4 w-4 text-slate-500" /></button>}
                    </div>
                    {catDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => { setFilters(f => ({...f, categoryId: "all"})); setCatDropdownOpen(false); }} className="w-full p-3 text-left font-normal text-xs text-black/80 hover:bg-slate-50 border-b border-slate-50">All Categories</button>
                        {filteredCat.map(c => (
                          <button key={c.id} onClick={() => { setFilters(f => ({...f, categoryId: c.id})); setCatDropdownOpen(false); }} className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none focus:outline-none">
                             <span className="font-normal text-xs text-black">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PRODUCT SEARCH DROPDOWN */}
                  <div className="space-y-2 relative" ref={prodRef}>
                    <Label className="text-xs font-semibold text-black ml-1">Product / SKU</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        placeholder="Search SKU or Name..."
                        className="h-10 pl-11 rounded-xl bg-slate-50 border-none font-normal text-black text-sm placeholder:text-slate-500"
                        value={filters.productId === "all" ? prodSearch : selectedProdName}
                        onFocus={() => { setProdDropdownOpen(true); if(filters.productId !== "all") setFilters(f => ({...f, productId: "all"})); }}
                        onChange={(e) => { setProdSearch(e.target.value); setProdDropdownOpen(true); }}
                      />
                      {filters.productId !== "all" && <button onClick={() => { setFilters(f => ({...f, productId: "all"})); setProdSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"><X className="h-4 w-4 text-slate-500" /></button>}
                    </div>
                    {prodDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => { setFilters(f => ({...f, productId: "all"})); setProdDropdownOpen(false); }} className="w-full p-3 text-left font-normal text-xs text-black/80 hover:bg-slate-50 border-b border-slate-50">All Products</button>
                        {filteredProd.map(p => (
                          <button key={p.id} onClick={() => { setFilters(f => ({...f, productId: p.id})); setProdDropdownOpen(false); }} className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none focus:outline-none">
                             <div className="flex flex-col">
                                <span className="font-normal text-xs text-black">{p.name}</span>
                                <span className="text-[10px] text-black/60">SKU: {p.sku || "N/A"}</span>
                             </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold text-black ml-1">Operational Period</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-black/80 ml-1">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-10 justify-start text-left font-normal text-xs rounded-xl border-slate-200 text-black hover:bg-slate-50 transition-colors"
                            >
                              <Calendar className="mr-2 h-4 w-4 text-black" />
                              {filters.startDate ? format(parseDate(filters.startDate)!, "MM/dd/yyyy") : <span className="text-slate-500">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent 
                              mode="single" 
                              selected={parseDate(filters.startDate)} 
                              onSelect={(d) => setFilters(f => ({...f, startDate: formatDate(d)}))} 
                              initialFocus 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-black/80 ml-1">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-10 justify-start text-left font-normal text-xs rounded-xl border-slate-200 text-black hover:bg-slate-50 transition-colors"
                            >
                              <Calendar className="mr-2 h-4 w-4 text-black" />
                              {filters.endDate ? format(parseDate(filters.endDate)!, "MM/dd/yyyy") : <span className="text-slate-500">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent 
                              mode="single" 
                              selected={parseDate(filters.endDate)} 
                              onSelect={(d) => setFilters(f => ({...f, endDate: formatDate(d)}))} 
                              initialFocus 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                <SheetFooter className="mt-8 flex flex-col gap-3 sm:flex-col">
                  <Button 
                    className="w-full h-10 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-sm hover:bg-black transition-all"
                    onClick={() => { fetchAuditData(); setIsFilterOpen(false); }}
                  >
                    Apply Filters
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full h-9 rounded-xl font-normal text-slate-500 text-xs hover:bg-slate-50 transition-all"
                    onClick={resetFilters}
                  >
                    Reset and Clear
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-semibold text-xs text-slate-900 p-8 py-4">Branch Detail</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-900 py-4">Transactions</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-900 py-4">Revenue</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-900 py-4">Inventory Cost</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-900 py-4">Actual Profit</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-900 p-8 py-4">Profitability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((b, i) => {
                const margin = (b.profit / b.revenue) * 100 || 0;
                return (
                  <TableRow key={i} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                    <TableCell className="p-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-semibold text-slate-500 text-xs">
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                          <Badge variant="outline" className="text-[10px] font-normal py-0 px-2 mt-1 border-slate-200 text-slate-500">Operational</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-normal text-slate-600 text-sm">{b.count}</TableCell>
                    <TableCell className="text-right font-normal text-slate-900 text-sm">{formatCurrency(b.revenue)}</TableCell>
                    <TableCell className="text-right font-normal text-slate-500 text-sm">{formatCurrency(b.cogs)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold text-sm ${b.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatCurrency(b.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="p-8 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-semibold ${margin > 20 ? 'text-blue-600' : 'text-slate-500'}`}>
                          {margin.toFixed(1)}%
                        </span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${margin > 20 ? 'bg-blue-600' : margin > 10 ? 'bg-slate-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, margin)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {!data?.length && !loading && (
            <div className="p-20 text-center space-y-4">
              <div className="h-20 w-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center">
                <LayoutDashboard className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-300 text-sm">No Audit History Found</p>
                <p className="text-xs font-normal text-slate-400">Adjust your filters to see historical performance</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border border-slate-100 shadow-sm p-6 bg-white">
           <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-slate-800 text-sm">Audit Insights</h4>
              <Badge className="bg-blue-50 text-blue-600 border-none font-semibold text-[10px]">AI Assisted</Badge>
           </div>
           <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex gap-3">
                  <ArrowUpRight className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900 mb-0.5">Profitability Lead</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">Inventory turnover is currently healthy. Your average gross margin of {(summary?.profitMargin || 0).toFixed(1)}% outperforms last month's performance.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex gap-3">
                  <Activity className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-0.5">Supply Chain Health</p>
                    <p className="text-xs text-blue-700 leading-relaxed">Purchase records indicate consistent valuation across branches with no major anomalies detected in stock movement.</p>
                  </div>
                </div>
              </div>
           </div>
        </Card>
        
        <Card className="rounded-3xl border border-slate-100 shadow-sm p-6 bg-slate-900 text-white relative overflow-hidden">
           <div className="relative z-10">
              <h4 className="font-semibold text-white text-sm mb-2">Total System Valuation</h4>
              <p className="text-xs font-normal text-slate-400 mb-6">Aggregate Value of Current Assets</p>
              
              <div className="space-y-6">
                <div>
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-normal text-slate-400">Equity Breakdown</span>
                      <span className="text-xs font-semibold text-blue-400">82% Healthy</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[82%]" />
                   </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <DollarSign className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                         <p className="text-xs font-semibold">Projected Earnings</p>
                         <p className="text-xs text-slate-400">Based on current stock labels</p>
                      </div>
                   </div>
                   <h5 className="text-base font-semibold text-emerald-400">+12.4%</h5>
                </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
