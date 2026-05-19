"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/ui/page-loader";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Truck,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  MapPin,
  ChevronRight,
  ShoppingCart,
  Boxes,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart as PieIcon,
  ShoppingBag,
  ArrowUpRight,
  Gauge,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";

interface DashboardStats {
  totalInventoryValue: number;
  totalSkus: number;
  outOfStockCount: number;
  branchSummary: { branchId: string; name: string; value: number; items: number }[];
  categorySummary: { name: string; value: number; items: number }[];
  velocity: { name: string; quantity: number }[];
  recentPurchases: any[];
  pendingTransfers: any[];
  lowStockAlerts: {
    product: any;
    branch: any;
    currentQuantity: number;
    minThreshold: number;
  }[];
  procurementHealth: { count: number; totalValue: number };
  movementTrend: { movement_type: string; _count: number }[];
  warehouse: any;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];


export function InventoryDashboard({ onNavigate }: { onNavigate?: (tab: string) => void | any }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingBranch, setSwitchingBranch] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  const handleNavigate = (tab: string, label: string) => {
    toast({
      title: "Action Initialized",
      description: `Switching to ${label} module...`,
      duration: 1500,
    });
    onNavigate?.(tab);
  };

  const fetchStats = async (bid?: string, isInternal = false) => {
    if (isInternal) setSwitchingBranch(true);
    else setLoading(true);
    
    try {
      const res = await apiClient.get(`${API_BASE}/inventory/dashboard`, {
        params: bid ? { branchId: bid } : {},
      });
      setStats(res.data?.data || null);
    } catch (e: any) {
      toast({
        title: "Sync Error",
        description: e?.response?.data?.message || "Failed to load neural inventory data",
        variant: "destructive",
      });
    } finally {
      // Small artificial delay for premium feel if fast
      await new Promise(r => setTimeout(r, 600));
      setLoading(false);
      setSwitchingBranch(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(`${API_BASE}/branches`, { params: { fetch_all: true } });
      setBranches(res.data?.data || res.data || []);
    } catch (e) {
      console.error("Failed to load branches", e);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    const b = localStorage.getItem("branch");
    let initialBranchId = "";

    if (b && b !== "Not Found") {
      try {
        const obj = JSON.parse(b);
        initialBranchId = obj.id || b;
      } catch {
        initialBranchId = b;
      }
    }

    if (role === "BRANCH_MANAGER" && initialBranchId) {
      setSelectedBranchId(initialBranchId);
      fetchStats(initialBranchId);
    } else {
      setSelectedBranchId("");
      fetchStats();
    }
    
    fetchBranches();
  }, []);

  const formatCurrency = (n: number) =>
    `Rs ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const totalValue = stats?.totalInventoryValue ?? 0;
  const healthScore = useMemo(() => {
    if (!stats) return 0;
    const items = stats.totalSkus;
    const out = stats.outOfStockCount;
    if (items === 0) return 0;
    return Math.round(((items - out) / items) * 100);
  }, [stats]);

  if (loading && !stats) return <PageLoader message="Loading inventory data..." />;

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto transition-all duration-500 ${switchingBranch ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
      
      {/* HEADER: NEURAL SYNC */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
               <Boxes className="h-5 w-5 text-white" />
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                 Inventory Operations
               </h1>
             </div>
          </div>
        </div>
        
        <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm self-start">
          {(userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "WAREHOUSE_MANAGER" || userRole === "PURCHASE_MANAGER") && (
            <div className="flex items-center gap-2 px-3">
              <MapPin className="h-4 w-4 text-slate-900" />
              <Select
                value={selectedBranchId || "all"}
                onValueChange={(v) => {
                  const bid = v === "all" ? "" : v;
                  setSelectedBranchId(bid);
                  fetchStats(bid, true);
                }}
              >
                <SelectTrigger className="w-[180px] border-none focus:ring-0 shadow-none h-10 font-semibold text-slate-900 text-sm">
                  <SelectValue placeholder="Global Domain" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="all" className="font-medium text-sm py-2 pl-8 pr-4">Global Domain (All)</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="font-medium text-sm py-2 pl-8 pr-4">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* TOP METRICS: THE POWER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm border border-slate-100 bg-white group hover:shadow-md transition-all duration-300">
           <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <TrendingUp className="h-3 w-3" />
                  +4.2%
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Inventory Value</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totalValue)}</h3>
                <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm border border-slate-100 bg-white group hover:shadow-md transition-all duration-300">
           <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <Zap className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="font-bold border-rose-200 text-rose-600 h-4 text-[10px] uppercase">Restock</Badge>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Out of Stock</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{stats?.outOfStockCount ?? 0}</h3>
                <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  Critical action required
                </p>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm border border-slate-100 bg-white group hover:shadow-md transition-all duration-300">
           <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Gauge className="h-5 w-5" />
                </div>
                <div className="text-amber-600 font-bold text-xs">{healthScore}% Health</div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Inventory Health</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{stats?.lowStockAlerts?.length ?? 0} <span className="text-xs text-gray-500 font-medium">Alerts</span></h3>
                <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500 rounded-full" style={{ width: `${100 - healthScore}%` }} />
                </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm border border-slate-100 bg-white group hover:shadow-md transition-all duration-300">
           <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Package className="h-5 w-5" />
                </div>
                <div className="p-1 px-2 border rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live</div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Catalog Size</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{stats?.totalSkus ?? 0} <span className="text-xs text-gray-500 font-medium">SKUs</span></h3>
                <p className="text-xs font-semibold text-blue-500 mt-1 tracking-tight">Active product domain</p>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CENTER STAGE: ANALYTICS */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Sales Velocity</CardTitle>
                  <CardDescription className="text-xs text-gray-500 italic">Top moving items (Last 7 Days)</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">Insights</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats?.velocity || []}>
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       fontSize={9} 
                       fontWeight={600}
                       tick={{fill: '#94a3b8'}}
                    />
                    <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                       labelStyle={{ fontWeight: 700, fontSize: '10px' }}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <Bar dataKey="quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
                <CardHeader className="p-5 border-b">
                   <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                     <PieIcon className="h-3.5 w-3.5 text-emerald-600" />
                     Valuation by Category
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categorySummary || []}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {stats?.categorySummary?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
             </Card>

             <Card className="shadow-sm border-slate-100 rounded-2xl bg-white">
                <CardHeader className="p-5 border-b">
                   <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                     <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                     Location Allocation
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y max-h-[260px] overflow-y-auto">
                     {stats?.branchSummary.map((b, i) => (
                       <div key={b.branchId} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-xs">
                               {i + 1}
                             </div>
                             <div>
                               <p className="text-xs font-bold text-slate-700">{b.name}</p>
                               <p className="text-xs text-gray-500">{(b.value / totalValue * 100).toFixed(1)}% Weight</p>
                             </div>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{formatCurrency(b.value)}</p>
                       </div>
                     ))}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* SIDEBAR: CRITICAL ALERTS & OPERATIONS */}
        <div className="space-y-6">
           
           {/* PROCUREMENT HEALTH */}
           <Card className="shadow-sm border-none rounded-2xl bg-slate-900 text-white">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-400">Procurement Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                 <div className="flex items-end justify-between">
                    <div>
                      <h4 className="text-xl font-bold">{formatCurrency(stats?.procurementHealth?.totalValue || 0)}</h4>
                      <p className="text-xs font-medium text-blue-400 mt-1 uppercase tracking-wider">{stats?.procurementHealth?.count || 0} Purchase Records</p>
                    </div>
                    <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                       <ShoppingBag className="h-6 w-6 text-blue-400" />
                    </div>
                 </div>
                 <div className="mt-5">
                    <Button 
                      onClick={() => handleNavigate('stock-management', 'Stock Management')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-10 shadow-lg shadow-blue-900/40 text-xs border-none group"
                    >
                      MANAGE STOCK
                      <ArrowRightLeft className="ml-2 h-3.5 w-3.5" />
                    </Button>
                 </div>
              </CardContent>
           </Card>

           {/* STOCK ALERTS: TABS */}
           <Card className="shadow-sm border-slate-100 rounded-2xl bg-white overflow-hidden">
              <Tabs defaultValue="low" className="w-full">
                <TabsList className="w-full justify-start rounded-none bg-slate-50/20 h-12 border-b px-5 gap-5">
                  <TabsTrigger value="low" className="rounded-none h-full border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent font-bold uppercase text-xs tracking-wider text-gray-500 data-[state=active]:text-gray-800">
                    Low Levels
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-none h-full border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold uppercase text-xs tracking-wider text-gray-500 data-[state=active]:text-gray-800">
                    Active Transfers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="low" className="p-0 m-0">
                   <div className="divide-y max-h-[420px] overflow-y-auto custom-scrollbar">
                     {stats?.lowStockAlerts?.length ? stats.lowStockAlerts.map((a, i) => (
                       <div key={i} className="p-4 hover:bg-slate-50/50 transition-all">
                         <div className="flex justify-between items-start mb-1.5">
                           <span className="font-bold text-slate-700 text-xs truncate max-w-[140px]">{a.product?.name}</span>
                           <span className="text-amber-600 font-bold text-xs">Level: {a.currentQuantity}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {a.branch?.name}
                            </div>
                            <div className="text-xs text-gray-400">Min: {a.minThreshold}</div>
                         </div>
                       </div>
                     )) : (
                       <div className="p-10 text-center">
                         <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-20" />
                         <p className="text-gray-500 font-bold text-xs uppercase tracking-wider italic">All Levels Stable</p>
                       </div>
                     )}
                   </div>
                   <div className="p-3 border-t bg-slate-50/20">
                       <Button 
                         onClick={() => handleNavigate('stock-view', 'Full System Audit')}
                         variant="ghost" 
                         className="w-full text-gray-500 font-bold text-xs h-8"
                       >
                         FULL AUDIT <ChevronRight className="h-3 w-3 ml-1" />
                       </Button>
                   </div>
                </TabsContent>
                <TabsContent value="pending" className="p-0 m-0">
                   <div className="divide-y max-h-[420px] overflow-y-auto">
                     {stats?.pendingTransfers?.length ? stats.pendingTransfers.map((t) => (
                       <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-all">
                          <div className="flex items-start gap-3">
                             <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                               <RefreshCw className="h-4 w-4 text-blue-500" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-700 text-xs truncate">{t.product?.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs text-gray-500">{t.from_branch?.name.split(' ')[0]}</span>
                                 <ChevronRight className="h-2 w-2 text-slate-300" />
                                 <span className="text-xs font-bold text-blue-500">{t.to_branch?.name.split(' ')[0]}</span>
                               </div>
                             </div>
                             <div className="text-right shrink-0">
                               <p className="text-xs font-bold text-blue-600">{t.quantity}</p>
                               <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-1.5 border-gray-200 text-gray-500">{t.status}</Badge>
                             </div>
                          </div>
                       </div>
                     )) : (
                       <div className="p-10 text-center">
                          <p className="text-slate-400 font-bold text-xs">No Transfers Active</p>
                       </div>
                     )}
                   </div>
                </TabsContent>
              </Tabs>
           </Card>

        </div>
      </div>
    </div>
  );
}
