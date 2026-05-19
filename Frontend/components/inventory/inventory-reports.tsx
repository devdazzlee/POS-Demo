"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  FileText, 
  Search, 
  Filter, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowRightLeft, 
  Calendar,
  History,
  Clock,
  LayoutDashboard,
  Box,
  Truck,
  RefreshCw
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { PageLoader } from "@/components/ui/page-loader";

const REPORT_TYPES = [
  { value: "valuation", label: "Stock Valuation", icon: Box, desc: "Current inventory worth and quantities across locations." },
  { value: "purchase", label: "Procurement History", icon: Truck, desc: "Log of all incoming stock and purchase orders." },
  { value: "transfer", label: "Inter-Branch Logistics", icon: ArrowRightLeft, desc: "Stock movement between branches and warehouses." },
  { value: "stockout", label: "Outflow Analytics", icon: TrendingUp, desc: "Sales, damages, and losses tracking." },
  { value: "lowstock", label: "Critical Alerts", icon: AlertTriangle, desc: "Items below minimum threshold levels." },
  { value: "aging", label: "Stock Aging", icon: Clock, desc: "Identify slow-moving and dead stock items." },
  { value: "movement_summary", label: "Movement Summary", icon: History, desc: "Aggregated flow analysis of all stock activities." },
];

export function InventoryReports() {
  const { toast } = useToast();
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
  const [reportType, setReportType] = useState("valuation");
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    branchId: "",
    supplierId: "",
    startDate: "",
    endDate: "",
  });

  const hasActiveFilters = filters.branchId !== "" || filters.startDate !== "" || filters.endDate !== "";

  const clearFilters = () => {
    const cleared = {
      branchId: "",
      supplierId: "",
      startDate: "",
      endDate: "",
    };
    setFilters(cleared);
    fetchReport(cleared);
  };

  // Guard: auto-swap start/end dates if user picks end before start
  const handleStartDate = (d: Date | undefined) => {
    const newStart = formatDate(d);
    if (filters.endDate && newStart && newStart > filters.endDate) {
      setFilters(f => ({ ...f, startDate: newStart, endDate: "" }));
    } else {
      setFilters(f => ({ ...f, startDate: newStart }));
    }
  };

  const handleEndDate = (d: Date | undefined) => {
    const newEnd = formatDate(d);
    if (filters.startDate && newEnd && newEnd < filters.startDate) {
      setFilters(f => ({ ...f, startDate: "", endDate: newEnd }));
    } else {
      setFilters(f => ({ ...f, endDate: newEnd }));
    }
  };
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);

  const fetchReport = useCallback(async (overrideFilters?: typeof filters) => {
    setLoading(true);
    const activeFilters = overrideFilters || filters;
    try {
      const params: any = { type: reportType };
      if (activeFilters.branchId) params.branchId = activeFilters.branchId;
      if (activeFilters.supplierId) params.supplierId = activeFilters.supplierId;
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;
      const res = await apiClient.get("/inventory/reports", { params });
      setData(res.data?.data || res.data);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Failed to load report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [reportType, toast]);

  const fetchMeta = useCallback(async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        apiClient.get("/branches", { params: { fetch_all: true } }),
        apiClient.get("/suppliers"),
      ]);
      setBranches(bRes.data?.data || bRes.data || []);
      setSuppliers(sRes.data?.data || []);
    } catch (e: any) {
      console.error(e);
    }
  }, []);

  // Only auto-fetch when report TYPE changes — not on every filter change
  useEffect(() => {
    fetchReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    const b = localStorage.getItem("branch");
    if (b && b !== "Not Found") {
      let bId = "";
      try {
        const obj = JSON.parse(b);
        bId = obj.id || b;
      } catch {
        bId = b;
      }
      setUserBranchId(bId);
    }
    fetchMeta();
  }, [fetchMeta]);

  const exportCSV = () => {
    if (!data) return;
    let headers: string[] = [];
    let rows: any[] = [];
    const ts = new Date().toISOString().split('T')[0];

    if (reportType === "valuation" && data.byLocation) {
      headers = ["Product", "SKU", "Branch", "Qty", "Value"];
      Object.entries(data.byLocation).forEach(([bid, loc]: [string, any]) => {
        const branchName = branches.find(b => b.id === bid)?.name || bid;
        (loc.items || []).forEach((item: any) => {
          rows.push([item.product?.name, item.product?.sku, branchName, item.quantity, item.value]);
        });
      });
    } else if (data.data) {
      const list = data.data;
      if (reportType === "purchase") {
        headers = ["Date", "Product", "Supplier", "Qty", "Cost", "Warehouse"];
        rows = list.map((d: any) => [new Date(d.purchase_date).toLocaleDateString(), d.product?.name, d.supplier?.name, d.quantity, d.cost_price, d.warehouse_branch?.name]);
      } else if (reportType === "transfer") {
        headers = ["Date", "Product", "From", "To", "Qty", "Status"];
        rows = list.map((d: any) => [new Date(d.transfer_date).toLocaleDateString(), d.product?.name, d.from_branch?.name, d.to_branch?.name, d.quantity, d.status]);
      } else if (reportType === "stockout") {
        headers = ["Date", "Product", "Branch", "Qty", "Type"];
        rows = list.map((d: any) => [new Date(d.created_at).toLocaleDateString(), d.product?.name, d.branch?.name, d.quantity_change, d.movement_type]);
      } else if (reportType === "lowstock") {
        headers = ["Product", "SKU", "Branch", "Qty", "Min"];
        rows = list.map((d: any) => [d.product?.name, d.product?.sku, d.branch?.name, d.current_quantity, d.product?.min_qty ?? d.minimum_quantity]);
      } else if (reportType === "aging") {
        headers = ["Product", "Branch", "Qty", "Days Old", "Last Action"];
        rows = list.map((d: any) => [d.product?.name, d.branch?.name, d.currentQuantity, d.daysOld, new Date(d.lastAction).toLocaleDateString()]);
      } else if (reportType === "movement_summary") {
        headers = ["Activity Type", "Occurrences", "Net Qty Change"];
        rows = list.map((d: any) => [d.movement_type, d._count, d._sum?.quantity_change || 0]);
      }
    }

    if (headers.length && rows.length) {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${reportType}-${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Report exported to CSV" });
    }
  };

  const formatCurrency = (n: number) => `Rs ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  const summary = data?.summary || {};

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-100px)] bg-slate-50/50">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 space-y-8 shrink-0">
        <div>
          <h2 className="text-xs font-normal text-black/60 uppercase tracking-widest mb-4">Report Categories</h2>
          <nav className="space-y-1">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.value}
                onClick={() => setReportType(r.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all ${
                  reportType === r.value 
                  ? "bg-slate-100 text-black shadow-sm" 
                  : "text-black/80 hover:bg-slate-50 hover:text-black"
                }`}
              >
                <r.icon className={`h-4 w-4 ${reportType === r.value ? "text-black" : "text-black/60"}`} />
                {r.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-8 border-t border-slate-100">
           <h2 className="text-xs font-normal text-black/60 uppercase tracking-widest mb-4">Operations</h2>
           <Button 
             variant="outline" 
             className="w-full justify-start gap-2 border-slate-200 text-black font-normal text-xs h-10 shadow-sm"
             onClick={exportCSV}
             disabled={!data || loading}
           >
             <Download className="h-3.5 w-3.5 text-black" />
             EXPORT CURRENT VIEW
           </Button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* HEADER & FILTERS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-black tracking-tight">
                {REPORT_TYPES.find(r => r.value === reportType)?.label}
              </h1>
              <p className="text-xs font-normal text-black/80 mt-0.5">
                {REPORT_TYPES.find(r => r.value === reportType)?.desc}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-normal text-black uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border">
                <Calendar className="h-3 w-3 text-black" />
                Live Feed
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-slate-100">
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-normal text-black uppercase tracking-wider ml-1">Location</label>
              <Select
                value={filters.branchId || "all"}
                onValueChange={(v) => setFilters({ ...filters, branchId: v === "all" ? "" : v })}
              >
                <SelectTrigger className="h-9 border-slate-200 bg-slate-50/50 font-normal text-xs text-black">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-normal text-xs py-2 pl-8 pr-4 text-black">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id} className="font-normal text-xs py-2 pl-8 pr-4 text-black">{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <label className="text-[10px] font-normal text-black uppercase tracking-wider ml-1">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start text-left font-normal text-xs border-slate-200 bg-slate-50/50 text-black hover:bg-slate-100/50"
                  >
                    <Calendar className="mr-2 h-3.5 w-3.5 text-black" />
                    {filters.startDate ? format(parseDate(filters.startDate)!, "MM/dd/yyyy") : <span className="text-black/60">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent 
                    mode="single" 
                    selected={parseDate(filters.startDate)} 
                    onSelect={handleStartDate}
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <label className="text-[10px] font-normal text-black uppercase tracking-wider ml-1">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start text-left font-normal text-xs border-slate-200 bg-slate-50/50 text-black hover:bg-slate-100/50"
                  >
                    <Calendar className="mr-2 h-3.5 w-3.5 text-black" />
                    {filters.endDate ? format(parseDate(filters.endDate)!, "MM/dd/yyyy") : <span className="text-black/60">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent 
                    mode="single" 
                    selected={parseDate(filters.endDate)} 
                    onSelect={handleEndDate}
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
                onClick={fetchReport} 
                disabled={loading}
                className="h-9 bg-slate-900 hover:bg-black text-white font-normal px-6 text-xs shadow-md shadow-slate-200"
            >
              {loading ? "Generating..." : "Apply Filters"}
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
          </div>
        </div>

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            /* Skeleton cards while loading */
            <>
              <Card className="border-none shadow-sm bg-white border border-slate-100">
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-7 w-40 rounded" />
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white border border-slate-100">
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-7 w-32 rounded" />
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white border border-slate-100">
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-7 w-28 rounded" />
                </CardContent>
              </Card>
            </>
          ) : !data ? null : reportType === "valuation" ? (
             <>
               <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">Total Value</p>
                     <h3 className="text-xl font-bold text-black mt-1">{formatCurrency(summary.totalValue || 0)}</h3>
                  </CardContent>
               </Card>
               <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">SKUs Tracked</p>
                     <h3 className="text-xl font-bold text-black mt-1">{summary.totalItems || 0} Products</h3>
                  </CardContent>
               </Card>
               <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">Locations</p>
                     <h3 className="text-xl font-bold text-black mt-1">{summary.locationsCount || 0} Branches</h3>
                  </CardContent>
               </Card>
             </>
          ) : reportType === "purchase" ? (
             <>
                <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">Total Spend</p>
                     <h3 className="text-xl font-bold text-black mt-1">{formatCurrency(summary.totalCost || 0)}</h3>
                  </CardContent>
               </Card>
               <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">PO Count</p>
                     <h3 className="text-xl font-bold text-black mt-1">{summary.count || 0} Records</h3>
                  </CardContent>
               </Card>
               <Card className="border-none shadow-sm bg-white border border-slate-100">
                  <CardContent className="p-5">
                     <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">Avg PO Value</p>
                     <h3 className="text-xl font-bold text-black mt-1">{formatCurrency(summary.avgPrice || 0)}</h3>
                  </CardContent>
               </Card>
             </>
          ) : (
            <Card className="md:col-span-3 border-none shadow-sm bg-white border border-slate-100 h-20 flex items-center px-6">
               <div>
                 <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">Report Volume</p>
                 <h3 className="text-lg font-bold text-black">{summary.count || data?.data?.length || 0} Matching Entries Found</h3>
               </div>
            </Card>
          )}
        </div>

        {/* REPORT TABLE AREA */}
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden min-h-[400px]">
           <CardContent className="p-0">
             {loading ? (
               <div className="p-6 space-y-3">
                 {[...Array(7)].map((_, i) => (
                   <div key={i} className="flex items-center gap-4 py-2">
                     <Skeleton className="h-4 w-[30%] rounded" />
                     <Skeleton className="h-4 w-[20%] rounded" />
                     <Skeleton className="h-4 w-[15%] rounded ml-auto" />
                     <Skeleton className="h-4 w-[15%] rounded" />
                     <Skeleton className="h-4 w-[12%] rounded" />
                   </div>
                 ))}
               </div>
             ) : reportType === "valuation" && data?.byLocation ? (
                <div className="divide-y divide-slate-100">
                  {Object.entries(data.byLocation).map(([bid, loc]: [string, any]) => {
                    const branchName = branches.find(b => b.id === bid)?.name || "Main Site";
                    return (
                      <div key={bid} className="p-8">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                             <Box className="h-4 w-4 text-black" />
                             <h4 className="font-bold text-black">{branchName}</h4>
                           </div>
                           <Badge variant="outline" className="text-black bg-slate-50 border-slate-200 font-bold">
                             Value: {formatCurrency(loc.value || 0)}
                           </Badge>
                        </div>
                        <Table>
                          <TableHeader className="bg-slate-50/50 font-normal uppercase text-[9px] tracking-widest text-black border-none">
                            <TableRow>
                              <TableHead className="text-black font-normal">Product Name</TableHead>
                              <TableHead className="text-black font-normal">SKU</TableHead>
                              <TableHead className="text-right text-black font-normal">Quantity</TableHead>
                              <TableHead className="text-right text-black font-normal">Unit Value</TableHead>
                              <TableHead className="text-right text-black font-normal">Total Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(loc.items || []).map((item: any, i: number) => (
                              <TableRow key={i} className="hover:bg-slate-50/30">
                                <TableCell className="font-normal text-black text-xs">{item.product?.name}</TableCell>
                                <TableCell className="text-xs text-black/60 font-normal">{item.product?.sku}</TableCell>
                                <TableCell className="text-right font-normal text-black text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-right text-xs text-black/60">{formatCurrency(item.value / item.quantity)}</TableCell>
                                <TableCell className="text-right font-normal text-black text-xs">{formatCurrency(item.value)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  })}
                </div>
             ) : Array.isArray(data?.data) && data.data.length > 0 ? (
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-slate-50/50 font-normal uppercase text-[9px] tracking-widest text-black border-none">
                     <TableRow>
                       {reportType === "purchase" && (
                         <>
                           <TableHead>Date</TableHead>
                           <TableHead>Product</TableHead>
                           <TableHead>Supplier</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                           <TableHead className="text-right">Unit Cost</TableHead>
                           <TableHead className="text-right">Line Total</TableHead>
                         </>
                       )}
                       {reportType === "transfer" && (
                         <>
                           <TableHead>Date</TableHead>
                           <TableHead>Product</TableHead>
                           <TableHead>Route</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                           <TableHead className="text-right">Status</TableHead>
                         </>
                       )}
                       {reportType === "stockout" && (
                         <>
                           <TableHead>Date</TableHead>
                           <TableHead>Product</TableHead>
                           <TableHead>Branch</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                           <TableHead className="text-right">Reason</TableHead>
                         </>
                       )}
                       {reportType === "lowstock" && (
                         <>
                           <TableHead>Product</TableHead>
                           <TableHead>SKU</TableHead>
                           <TableHead className="text-right">In Stock</TableHead>
                           <TableHead className="text-right">Threshold</TableHead>
                           <TableHead className="text-right">Status</TableHead>
                         </>
                       )}
                       {reportType === "aging" && (
                         <>
                           <TableHead>Product</TableHead>
                           <TableHead>Branch</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                           <TableHead className="text-right">Days Old</TableHead>
                           <TableHead className="text-right">Last Movement</TableHead>
                         </>
                       )}
                       {reportType === "movement_summary" && (
                         <>
                           <TableHead>Activity Type</TableHead>
                           <TableHead className="text-right">Occurrences</TableHead>
                           <TableHead className="text-right">Net Qty Change</TableHead>
                         </>
                       )}
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {data.data.map((d: any, i: number) => (
                       <TableRow key={i} className="hover:bg-slate-50/30">
                         {reportType === "purchase" && (
                           <>
                             <TableCell className="text-xs font-normal text-black">{new Date(d.purchase_date).toLocaleDateString()}</TableCell>
                             <TableCell className="text-xs font-normal text-black">{d.product?.name}</TableCell>
                             <TableCell className="text-xs text-black/60 font-normal">{d.supplier?.name}</TableCell>
                             <TableCell className="text-right font-normal text-xs text-black">{d.quantity}</TableCell>
                             <TableCell className="text-right text-xs text-black/60">{formatCurrency(Number(d.cost_price))}</TableCell>
                             <TableCell className="text-right font-normal text-black text-xs">{formatCurrency(d.quantity * d.cost_price)}</TableCell>
                           </>
                         )}
                         {reportType === "transfer" && (
                           <>
                             <TableCell className="text-xs font-normal text-black">{new Date(d.transfer_date).toLocaleDateString()}</TableCell>
                             <TableCell className="text-xs font-normal text-black">{d.product?.name}</TableCell>
                             <TableCell className="text-xs font-medium text-black/60">
                                {d.from_branch?.name} → {d.to_branch?.name}
                             </TableCell>
                             <TableCell className="text-right font-normal text-xs text-black">{d.quantity}</TableCell>
                             <TableCell className="text-right">
                               <Badge variant="outline" className={`text-[9px] font-normal ${d.status === 'COMPLETED' ? 'text-black bg-slate-50' : 'text-black bg-slate-50'}`}>
                                 {d.status}
                               </Badge>
                             </TableCell>
                           </>
                         )}
                         {reportType === "stockout" && (
                           <>
                             <TableCell className="text-xs font-normal text-black">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                             <TableCell className="text-xs font-normal text-black">{d.product?.name}</TableCell>
                             <TableCell className="text-xs text-black/60">{d.branch?.name}</TableCell>
                             <TableCell className="text-right font-normal text-xs text-rose-600">{Math.abs(d.quantity_change)}</TableCell>
                             <TableCell className="text-right">
                                <Badge className="text-[9px] font-normal uppercase bg-slate-50 text-black border border-slate-200">{d.movement_type}</Badge>
                             </TableCell>
                           </>
                         )}
                         {reportType === "lowstock" && (
                           <>
                             <TableCell className="text-xs font-normal text-black">{d.product?.name}</TableCell>
                             <TableCell className="text-xs text-black/60">{d.product?.sku}</TableCell>
                             <TableCell className="text-right font-normal text-xs text-rose-700">{Number(d.current_quantity)}</TableCell>
                             <TableCell className="text-right text-xs text-black/60">{Number(d.product?.min_qty ?? d.minimum_quantity ?? 0)}</TableCell>
                             <TableCell className="text-right">
                                <Badge variant="outline" className="text-[9px] font-normal text-rose-600 bg-rose-50 border-rose-100">{Number(d.current_quantity) <= 0 ? 'OUT OF STOCK' : 'LOW'}</Badge>
                             </TableCell>
                           </>
                         )}
                         {reportType === "aging" && (
                            <>
                             <TableCell className="text-xs font-normal text-black">{d.product?.name}</TableCell>
                             <TableCell className="text-xs text-black/60">{d.branch?.name}</TableCell>
                             <TableCell className="text-right font-normal text-xs text-black">{d.currentQuantity}</TableCell>
                             <TableCell className="text-right">
                                <Badge className={`text-[10px] font-normal border-slate-200 ${d.daysOld > 90 ? 'bg-slate-50 text-black' : d.daysOld > 30 ? 'bg-slate-50 text-black' : 'bg-slate-50 text-black'}`}>
                                  {d.daysOld} Days
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right text-xs text-black/60">{new Date(d.lastAction).toLocaleDateString()}</TableCell>
                            </>
                         )}
                         {reportType === "movement_summary" && (
                            <>
                             <TableCell className="text-xs font-normal text-black">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${d.movement_type === 'SALE' ? 'bg-emerald-500' : d.movement_type === 'PURCHASE' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                  {d.movement_type}
                                </div>
                             </TableCell>
                             <TableCell className="text-right font-normal text-xs text-black">
                                {/* Prisma groupBy returns _count as a plain number */}
                                {(typeof d._count === 'number' ? d._count : d._count?._all ?? 0)} events
                              </TableCell>
                             <TableCell className="text-right font-normal text-xs text-black">
                               {Number(d._sum?.quantity_change || 0) > 0 ? '+' : ''}
                               {Number(d._sum?.quantity_change || 0).toFixed(2)}
                             </TableCell>
                            </>
                         )}
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             ) : (
               <div className="p-32 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <History className="h-8 w-8 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">No report data found</h3>
                    <p className="text-xs text-black/60 mt-1 max-w-[240px]">Adjust your filters or date range to discover broader inventory insights.</p>
                  </div>
               </div>
             )}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
