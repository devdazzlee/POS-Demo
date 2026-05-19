"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Loader2,
  Truck,
  Printer,
  ArrowRight,
  Package,
  CalendarIcon,
  History,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { usePosData } from "@/hooks/use-pos-data";
import { PageLoader } from "@/components/ui/page-loader";

export function Transfers() {
  const { 
    products, 
    branches, 
    productsLoading, 
    branchesLoading,
    fetchProducts,
    fetchBranches
  } = usePosData();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    productId: "",
    fromBranchId: "",
    toBranchId: "",
    quantity: "",
    notes: "",
    // Advanced fields
    reason: "Stock Replenishment",
    carrierName: "",
    vehicleNo: "",
    estimatedArrival: "",
  });

  const [sourceStock, setSourceStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  // Fetch Transfers
  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/transfers`, {
        params: { page: 1, limit: 100 },
      });
      setTransfers(res.data?.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to synchronize transfer records");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Sync
  useEffect(() => {
    fetchTransfers();
    fetchProducts();
    fetchBranches();
  }, [fetchTransfers, fetchProducts, fetchBranches]);

  // Fetch Stock in Source Branch
  useEffect(() => {
    if (form.productId && form.fromBranchId) {
      const fetchCurrentStock = async () => {
        setStockLoading(true);
        try {
          const res = await apiClient.get(`${API_BASE}/stock/product/${form.productId}/branch/${form.fromBranchId}`);
          setSourceStock(res.data?.data?.current_quantity || 0);
        } catch (e) {
          setSourceStock(0);
        } finally {
          setStockLoading(false);
        }
      };
      fetchCurrentStock();
    } else {
      setSourceStock(null);
    }
  }, [form.productId, form.fromBranchId]);

  useEffect(() => {
    if (!dialogOpen) {
      setProdDropdownOpen(false);
    }
  }, [dialogOpen]);

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

  const handleSubmit = async () => {
    const qty = Number(form.quantity);
    if (!form.productId || !form.fromBranchId || !form.toBranchId || !qty || qty <= 0) {
      toast.warning("Incomplete Data Transmission", {
        description: "Please verify all required ledger fields are populated."
      });
      return;
    }

    if (form.fromBranchId === form.toBranchId) {
      toast.error("Invalid Destination", {
        description: "Source and destination nodes cannot be identical."
      });
      return;
    }

    if (sourceStock !== null && qty > sourceStock) {
      toast.error("Insufficient Telemetry", {
        description: `Cannot transfer ${qty} units. Only ${sourceStock} available at source.`
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`${API_BASE}/transfers`, {
        productId: form.productId,
        fromBranchId: form.fromBranchId,
        toBranchId: form.toBranchId,
        quantity: qty,
        notes: form.notes || undefined,
        reason: form.reason || undefined,
        carrierName: form.carrierName || undefined,
        vehicleNo: form.vehicleNo || undefined,
        estimatedArrival: form.estimatedArrival || undefined,
      });
      
      toast.success("Transfer Chain Initialized", {
        description: "Inventory movement has been successfully recorded."
      });
      
      setDialogOpen(false);
      setForm({ 
        productId: "", fromBranchId: "", toBranchId: "", quantity: "", notes: "", 
        reason: "Stock Replenishment", carrierName: "", vehicleNo: "", estimatedArrival: "" 
      });
      setSearchTerm("");
      fetchTransfers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Execution Error: Synchronizer Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`${API_BASE}/transfers/${id}/status`, { status });
      toast.success(`Transfer status updated to ${status}`);
      fetchTransfers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update status");
    }
  };

  const printSlip = (t: any) => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`
        <html><head><title>Transfer Slip - ${t.reference_no || t.id}</title></head>
        <body style="font-family: sans-serif; padding: 40px; color: #334155;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #4f46e5;">ACE STUDIOS</h1>
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #64748b;">STOCK TRANSFER CHALLAN</h2>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px;">
            <div>
              <p style="margin: 5px 0;"><strong>REFERENCE:</strong> ${t.reference_no || t.id}</p>
              <p style="margin: 5px 0;"><strong>REASON:</strong> ${t.reason || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>TIMESTAMP:</strong> ${new Date(t.transfer_date).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>LOGISTICS NODE:</strong> ${t.from_branch?.name}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0;"><strong>TARGET NODE:</strong> ${t.to_branch?.name}</p>
              <p style="margin: 5px 0;"><strong>CARRIER:</strong> ${t.carrier_name || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>VEHICLE:</strong> ${t.vehicle_no || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>CURRENT STATUS:</strong> ${t.status}</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 800;">MANAGED ASSET</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 800;">SKU/ID</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 800;">TRANSFER VOLUME</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${t.product?.name}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${t.product?.sku}</td>
                <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #4f46e5;">${t.quantity} UNITS</td>
              </tr>
            </tbody>
          </table>
          ${t.notes ? `
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 8px;">LOGISTICS REMARKS</p>
              <p style="margin: 0; font-size: 14px;">${t.notes}</p>
            </div>
          ` : ""}
          <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center;">
            <div>
              <div style="border-top: 1px solid #cbd5e1; margin-top: 30px; padding-top: 10px; font-size: 12px; font-weight: bold; color: #64748b;">DISPATCH AUTHORIZATION</div>
            </div>
            <div>
              <div style="border-top: 1px solid #cbd5e1; margin-top: 30px; padding-top: 10px; font-size: 12px; font-weight: bold; color: #64748b;">RECIPIENT ACKNOWLEDGMENT</div>
            </div>
          </div>
          <p style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center;">This is a system-generated document. Dynamic ID: ${t.id}</p>
        </body></html>
      `);
      w.document.close();
      w.print();
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "PENDING":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "DISPATCHED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "RECEIVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = transfers.length;
    const pending = transfers.filter(t => t.status === 'PENDING').length;
    const dispatched = transfers.filter(t => t.status === 'DISPATCHED').length;
    const received = transfers.filter(t => t.status === 'RECEIVED').length;
    return { total, pending, dispatched, received };
  }, [transfers]);

  if (loading && transfers.length === 0) return <PageLoader message="Loading logistics cycles..." />;

  // estimatedArrival is stored as ISO string; convert to/from Date for the
  // shadcn date picker. Local time is preserved so the user sees what they pick.
  const arrivalDate = form.estimatedArrival ? new Date(form.estimatedArrival) : undefined;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Stock Transfers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Move inventory between branches and warehouses
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-sm">
              <Plus className="h-4 w-4 mr-2" /> New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-visible">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-black">New Transfer</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Move stock between locations.
              </DialogDescription>
            </DialogHeader>

            <div
              className="space-y-1.5 pb-1"
              ref={productRef}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setProdDropdownOpen(false);
                }
              }}
            >
              <Label className="text-sm text-black">Product</Label>
              <div className="relative z-[60]">
                <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search product by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setProdDropdownOpen(true);
                  }}
                  onFocus={() => setProdDropdownOpen(true)}
                  className={cn(
                    "h-9 pl-9 text-sm text-black bg-background",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                    prodDropdownOpen && "rounded-b-none border-b-0",
                  )}
                />
                {prodDropdownOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-10 max-h-60 overflow-y-auto overscroll-contain rounded-b-md border border-t-0 border-input bg-white shadow-lg"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="option"
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-none border-gray-100"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setForm({ ...form, productId: p.id });
                            setSearchTerm(p.name);
                            setProdDropdownOpen(false);
                          }}
                        >
                          <span className="block text-sm text-black truncate">{p.name}</span>
                          <span className="block text-xs text-gray-500">SKU: {p.sku || "N/A"}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 max-h-[min(52vh,420px)] overflow-y-auto overflow-x-hidden pr-1 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">From Branch</Label>
                  <Select value={form.fromBranchId} onValueChange={(v) => setForm({ ...form, fromBranchId: v })}>
                    <SelectTrigger className="h-9 text-sm text-black">
                      <SelectValue placeholder="Source" />
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
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">To Branch</Label>
                  <Select value={form.toBranchId} onValueChange={(v) => setForm({ ...form, toBranchId: v })}>
                    <SelectTrigger className="h-9 text-sm text-black">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                          disabled={b.id === form.fromBranchId}
                          className="text-sm"
                        >
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="h-9 text-sm text-black"
                  />
                  {sourceStock !== null && (
                    <p className="text-xs text-gray-500">Available: {sourceStock}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Reason</Label>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger className="h-9 text-sm text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stock Replenishment" className="text-sm">Stock Replenishment</SelectItem>
                      <SelectItem value="Branch Support" className="text-sm">Branch Support</SelectItem>
                      <SelectItem value="Damage Return" className="text-sm">Damage Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Carrier</Label>
                  <Input
                    placeholder="Courier name"
                    value={form.carrierName}
                    onChange={(e) => setForm({ ...form, carrierName: e.target.value })}
                    className="h-9 text-sm text-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Vehicle</Label>
                  <Input
                    placeholder="Plate #"
                    value={form.vehicleNo}
                    onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                    className="h-9 text-sm text-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-black">Estimated Arrival</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left text-sm font-normal text-black"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {arrivalDate ? (
                        format(arrivalDate, "PPP")
                      ) : (
                        <span className="text-gray-500">Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={arrivalDate}
                      onSelect={(d) =>
                        setForm({
                          ...form,
                          estimatedArrival: d ? d.toISOString() : "",
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-black">Notes</Label>
                <Textarea
                  placeholder="Optional remarks..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="text-sm text-black min-h-[60px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-sm text-black">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} size="sm" className="text-sm">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                Create Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transfers</p>
              <h3 className="text-xl font-semibold text-black">{stats.total}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-md text-yellow-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <h3 className="text-xl font-semibold text-black">{stats.pending}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-md text-blue-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <h3 className="text-xl font-semibold text-black">{stats.dispatched}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Received</p>
              <h3 className="text-xl font-semibold text-green-600">{stats.received}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Transfers table */}
      <Card className="border border-gray-200 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-base font-semibold text-black">Transfer History</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="px-6 py-4 text-sm font-medium text-black">Date</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Reference</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Product</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">From → To</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Details</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black text-center">Status</TableHead>
                <TableHead className="px-6 py-4 text-sm font-medium text-black text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <History className="h-10 w-10 text-gray-300" />
                      <p className="text-sm text-black">No transfers yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-black">
                          {new Date(t.transfer_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(t.transfer_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <span className="text-sm text-black font-mono">
                        {t.reference_no || t.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-black truncate max-w-[200px]">
                          {t.product?.name}
                        </span>
                        <span className="text-xs text-gray-500">Qty: {t.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="flex items-center gap-2 text-sm text-black">
                        <span>{t.from_branch?.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                        <span>{t.to_branch?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="flex flex-col gap-1 text-sm">
                        {t.carrier_name && (
                          <span className="text-black">{t.carrier_name}</span>
                        )}
                        {t.vehicle_no && (
                          <span className="text-gray-500 text-xs">{t.vehicle_no}</span>
                        )}
                        {t.reason && (
                          <span className="text-gray-500 text-xs">{t.reason}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center align-top">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusStyle(t.status)}`}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-black"
                          onClick={() => printSlip(t)}
                          title="Print slip"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        {t.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-black"
                            onClick={() => updateStatus(t.id, "DISPATCHED")}
                          >
                            Dispatch
                          </Button>
                        )}
                        {t.status === "DISPATCHED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-black"
                            onClick={() => updateStatus(t.id, "RECEIVED")}
                          >
                            Receive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
