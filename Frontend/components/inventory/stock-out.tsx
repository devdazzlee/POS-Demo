"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Search,
  CalendarIcon,
  Loader2,
  Plus,
  Trash2,
  PackageMinus,
  History,
  ListChecks,
  Info,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { usePosData } from "@/hooks/use-pos-data";
import { PageLoader } from "@/components/ui/page-loader";
import { ExcelUploadDialog, type ExcelField } from "@/components/inventory/excel-upload-dialog";

type Reason = "SALE" | "DAMAGE" | "LOSS" | "EXPIRED";

const REASON_OPTIONS: { value: Reason; label: string }[] = [
  { value: "SALE", label: "Sale" },
  { value: "DAMAGE", label: "Damage" },
  { value: "LOSS", label: "Loss" },
  { value: "EXPIRED", label: "Expired" },
];

interface DraftLine {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  rate: number;
  available: number;
}

interface MovementRow {
  id: string;
  created_at: string;
  movement_type: string;
  quantity_change: string | number;
  notes?: string | null;
  product?: { id: string; name: string; sku?: string | null } | null;
  branch?: { id: string; name: string } | null;
  user?: { email?: string | null } | null;
}

export function StockOut() {
  const { products, branches, fetchProducts, fetchBranches } = usePosData();

  const [tab, setTab] = useState<"history" | "new">("history");

  // ---------- History tab ----------
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const PAGE_SIZE = 20;

  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterStart, setFilterStart] = useState<Date | undefined>(undefined);
  const [filterEnd, setFilterEnd] = useState<Date | undefined>(undefined);

  const fetchHistory = useCallback(
    async (pg = historyPage) => {
      setHistoryLoading(true);
      try {
        const params: any = { page: pg, limit: PAGE_SIZE };
        if (filterReason !== "all") params.reason = filterReason;
        if (filterStart) params.startDate = filterStart.toISOString();
        if (filterEnd) {
          // Treat the end date as inclusive — push to end-of-day.
          const e = new Date(filterEnd);
          e.setHours(23, 59, 59, 999);
          params.endDate = e.toISOString();
        }
        const res = await apiClient.get(`${API_BASE}/stock-out`, { params });
        setRows(res.data?.data || []);
        setHistoryTotal(res.data?.meta?.total ?? 0);
        setHistoryTotalPages(res.data?.meta?.totalPages ?? 1);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load stock-out history");
      } finally {
        setHistoryLoading(false);
      }
    },
    [filterReason, filterStart, filterEnd, historyPage],
  );

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, [fetchProducts, fetchBranches]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ---------- New dispatch tab ----------
  const [reason, setReason] = useState<Reason>("SALE");
  const [branchId, setBranchId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [documentRef, setDocumentRef] = useState<string>("");
  const [dispatchDate, setDispatchDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Add-a-line input row
  const [searchTerm, setSearchTerm] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedProductId, setPickedProductId] = useState<string>("");
  const [pickedQty, setPickedQty] = useState<string>("");
  const [pickedRate, setPickedRate] = useState<string>("");
  const [pickedAvailable, setPickedAvailable] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products.slice(0, 50);
    return products
      .filter(
        (p: any) =>
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)),
      )
      .slice(0, 50);
  }, [products, searchTerm]);

  const pickedProduct = useMemo(
    () => products.find((p: any) => p.id === pickedProductId),
    [products, pickedProductId],
  );

  // Look up available stock for picked product + selected branch.
  useEffect(() => {
    if (!pickedProductId || !branchId) {
      setPickedAvailable(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(
          `${API_BASE}/stock/product/${pickedProductId}/branch/${branchId}`,
        );
        if (!cancelled) {
          setPickedAvailable(Number(res.data?.data?.current_quantity ?? 0));
        }
      } catch {
        if (!cancelled) setPickedAvailable(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickedProductId, branchId]);

  const resetAddLine = () => {
    setPickedProductId("");
    setPickedQty("");
    setPickedRate("");
    setPickedAvailable(null);
    setSearchTerm("");
  };

  const addLine = () => {
    if (!branchId) {
      toast.error("Pick a branch first");
      return;
    }
    if (!pickedProductId) {
      toast.error("Select a product");
      return;
    }
    const q = Number(pickedQty);
    const r = Number(pickedRate || 0);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (reason === "SALE" && pickedAvailable != null && q > pickedAvailable) {
      toast.error(
        `Only ${pickedAvailable} available for ${pickedProduct?.name || "product"}`,
      );
      return;
    }
    // Merge with an existing line for the same product instead of duplicating.
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === pickedProductId);
      if (existing) {
        return prev.map((l) =>
          l.productId === pickedProductId
            ? { ...l, quantity: l.quantity + q, rate: r || l.rate }
            : l,
        );
      }
      return [
        ...prev,
        {
          productId: pickedProductId,
          productName: pickedProduct?.name || "Product",
          sku: (pickedProduct as any)?.sku,
          quantity: q,
          rate: r,
          available: pickedAvailable ?? 0,
        },
      ];
    });
    resetAddLine();
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  // --- Excel upload (Step 1) ---
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const STOCK_OUT_FIELDS: ExcelField[] = [
    {
      name: "Name",
      required: true,
      description: 'Product name in your catalog. Aliases: Product, Product Name.',
    },
    {
      name: "Quantity",
      required: true,
      description: 'Units to dispatch (must be > 0). Aliases: Qty, quantity.',
    },
    {
      name: "Rate",
      description: 'Optional unit price for the line. Aliases: Price, Unit Price.',
    },
  ];

  // Build a name → product index once per products refresh for O(1) matching
  // by normalized name.
  const productNameIndex = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of products) {
      const key = String(p.name || "").trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, p);
    }
    return map;
  }, [products]);

  const processExcelFile = async (file: File) => {
    if (!branchId) {
      toast.error("Pick a branch in step 2 first so we can look up stock per line");
      throw new Error("Branch required");
    }
    setUnmatched([]);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("Workbook has no sheets");
      const rowsRaw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });
      if (rowsRaw.length === 0) throw new Error("Sheet is empty");

      // Normalize header keys: trim + lowercase. Pick the first present key
      // from a list of synonyms (so we don't fight users over capitalization).
      const pick = (row: Record<string, any>, keys: string[]) => {
        const normalized: Record<string, any> = {};
        for (const k of Object.keys(row)) normalized[k.trim().toLowerCase()] = row[k];
        for (const k of keys) {
          const key = k.toLowerCase();
          if (normalized[key] !== undefined && normalized[key] !== "")
            return normalized[key];
        }
        return undefined;
      };

      const newLines: DraftLine[] = [];
      const missed: string[] = [];

      // Available-stock lookups are batched per unique product so a 100-row
      // file doesn't fire 100 HTTP requests.
      const availabilityCache = new Map<string, number>();

      for (const row of rowsRaw) {
        const name = String(pick(row, ["name", "product", "product name"]) || "").trim();
        const qtyRaw = pick(row, ["quantity", "qty"]);
        const rateRaw = pick(row, ["rate", "price", "unit price"]);
        if (!name) continue;

        const qty = Number(qtyRaw);
        if (!Number.isFinite(qty) || qty <= 0) continue;

        const match = productNameIndex.get(name.toLowerCase());
        if (!match) {
          missed.push(name);
          continue;
        }

        let available = availabilityCache.get(match.id);
        if (available === undefined) {
          try {
            const res = await apiClient.get(
              `${API_BASE}/stock/product/${match.id}/branch/${branchId}`,
            );
            available = Number(res.data?.data?.current_quantity ?? 0);
          } catch {
            available = 0;
          }
          availabilityCache.set(match.id, available);
        }

        newLines.push({
          productId: match.id,
          productName: match.name,
          sku: match.sku,
          quantity: qty,
          rate: Number(rateRaw || 0) || 0,
          available: available || 0,
        });
      }

      if (newLines.length === 0 && missed.length === 0) {
        toast.error("No valid rows found in the file");
        throw new Error("No valid rows");
      }

      // Merge into existing draft (same logic as manual add — bump qty for
      // duplicates).
      setLines((prev) => {
        const byId = new Map(prev.map((l) => [l.productId, { ...l }]));
        for (const nl of newLines) {
          const ex = byId.get(nl.productId);
          if (ex) {
            ex.quantity += nl.quantity;
            if (nl.rate) ex.rate = nl.rate;
          } else {
            byId.set(nl.productId, nl);
          }
        }
        return Array.from(byId.values());
      });
      setUnmatched(missed);

      if (missed.length > 0) {
        toast.warning(
          `Loaded ${newLines.length} line${newLines.length === 1 ? "" : "s"} — ${missed.length} name${missed.length === 1 ? "" : "s"} didn't match`,
        );
      } else {
        toast.success(
          `Loaded ${newLines.length} line${newLines.length === 1 ? "" : "s"} from Excel`,
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to read the Excel file");
      throw err;
    }
  };

  const downloadTemplate = () => {
    // Tiny built-in template so users always have a known-good starting file.
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Quantity", "Rate"],
      ["Sample Product A", 10, 100],
      ["Sample Product B", 5, 250],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Out");
    XLSX.writeFile(wb, "stock-out-template.xlsx");
  };

  const totals = useMemo(() => {
    const lineCount = lines.length;
    const units = lines.reduce((s, l) => s + l.quantity, 0);
    const value = lines.reduce((s, l) => s + l.quantity * (l.rate || 0), 0);
    return { lineCount, units, value };
  }, [lines]);

  const canSave =
    !!branchId &&
    !!reason &&
    lines.length > 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiClient.post(`${API_BASE}/stock-out/bulk`, {
        branchId,
        reason,
        customerId: customerId || undefined,
        documentRef: documentRef || undefined,
        dispatchDate: dispatchDate.toISOString(),
        notes: notes || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          rate: l.rate || undefined,
        })),
      });
      toast.success(`Dispatched ${lines.length} line${lines.length === 1 ? "" : "s"}`);
      // Reset the dispatch form and bounce to history.
      setLines([]);
      setNotes("");
      setDocumentRef("");
      setCustomerId("");
      resetAddLine();
      setTab("history");
      setHistoryPage(1);
      fetchHistory(1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save dispatch");
    } finally {
      setSaving(false);
    }
  };

  if (historyLoading && rows.length === 0 && tab === "history") {
    return <PageLoader message="Loading stock-out..." />;
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-gray-900 text-white p-2 rounded-md">
            <PackageMinus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Stock Out</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Pre-fill from Excel or add lines manually. Saving the dispatch removes
              stock and updates on-hand counts (same idea as Stock In, but outbound).
            </p>
          </div>
        </div>
        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`px-4 py-2 ${
              tab === "history" ? "bg-black text-white" : "bg-white text-gray-600"
            }`}
          >
            History Logs
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`px-4 py-2 border-l border-gray-200 ${
              tab === "new" ? "bg-black text-white" : "bg-white text-gray-600"
            }`}
          >
            New Dispatch
          </button>
        </div>
      </div>

      {tab === "history" ? (
        <HistoryView
          rows={rows}
          loading={historyLoading}
          page={historyPage}
          totalPages={historyTotalPages}
          total={historyTotal}
          setPage={(p) => {
            setHistoryPage(p);
          }}
          filterReason={filterReason}
          setFilterReason={(v) => {
            setFilterReason(v);
            setHistoryPage(1);
          }}
          filterStart={filterStart}
          setFilterStart={(d) => {
            setFilterStart(d);
            setHistoryPage(1);
          }}
          filterEnd={filterEnd}
          setFilterEnd={(d) => {
            setFilterEnd(d);
            setHistoryPage(1);
          }}
          onRefresh={() => fetchHistory()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Info banner */}
            <Card className="p-4 border border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-black mb-1">What this list shows</p>
                  <p>
                    Rows are stock movements with a negative quantity (stock removed).
                    Saving a dispatch from <span className="font-medium">New Dispatch</span> creates one movement per line via{" "}
                    <code className="text-xs bg-white px-1 py-0.5 rounded border border-gray-200">
                      POST /stock-out/bulk
                    </code>
                    . Sales rung through the POS appear separately in the Movement Log.
                  </p>
                </div>
              </div>
            </Card>

            {/* Step 1 — Excel upload */}
            <Card className="p-5 border border-gray-200">
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-black">
                    Step 1 — Load from Excel (optional)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Adds lines to the draft below. Stock is{" "}
                    <span className="font-medium">not</span> reduced until you save in step 2.
                    Use the upload button to see required columns and download a template.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExcelDialogOpen(true)}
                  className="text-sm text-black"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Upload Excel file
                </Button>

                {!branchId && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Pick a branch in step 2 first so
                    we can look up stock per line.
                  </p>
                )}

                {unmatched.length > 0 && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> {unmatched.length} row
                      {unmatched.length === 1 ? "" : "s"} skipped — name didn't match a product
                    </p>
                    <ul className="mt-2 text-xs text-amber-800 list-disc pl-5 max-h-24 overflow-y-auto">
                      {unmatched.slice(0, 30).map((n, i) => (
                        <li key={`${n}-${i}`}>{n}</li>
                      ))}
                      {unmatched.length > 30 && (
                        <li>…and {unmatched.length - 30} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Step 2 — Record dispatch */}
            <Card className="p-5 border border-gray-200">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-black">
                    Step 2 — Record dispatch
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Set who/why, add lines, then save. For Sale, quantities cannot exceed
                    available stock.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Reason</Label>
                    <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                      <SelectTrigger className="h-9 text-sm text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REASON_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-sm">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Branch</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger className="h-9 text-sm text-black">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id} className="text-sm">
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Document ref</Label>
                    <Input
                      placeholder="Invoice or gate pass"
                      value={documentRef}
                      onChange={(e) => setDocumentRef(e.target.value)}
                      className="h-9 text-sm text-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-black">Dispatch date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-start text-left text-sm font-normal text-black"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {format(dispatchDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dispatchDate}
                          onSelect={(d) => d && setDispatchDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Add a line */}
                <div className="border border-gray-200 rounded-md p-4 space-y-3">
                  <h3 className="text-sm font-medium text-black">Add a line</h3>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto] gap-3 items-end">
                    <div className="space-y-1.5" ref={pickerRef}>
                      <Label className="text-sm text-black">Product</Label>
                      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverAnchor asChild>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search product..."
                              value={
                                pickedProductId && !pickerOpen
                                  ? pickedProduct?.name || ""
                                  : searchTerm
                              }
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPickerOpen(true);
                                if (pickedProductId) {
                                  setPickedProductId("");
                                  setPickedAvailable(null);
                                }
                              }}
                              onFocus={() => setPickerOpen(true)}
                              className="h-9 pl-9 text-sm text-black"
                            />
                          </div>
                        </PopoverAnchor>
                        <PopoverContent
                          align="start"
                          sideOffset={4}
                          className="p-0 z-[100] w-[var(--radix-popover-trigger-width)] max-h-72 overflow-y-auto"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-none border-gray-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setPickedProductId(p.id);
                                  setSearchTerm(p.name);
                                  setPickerOpen(false);
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
                        </PopoverContent>
                      </Popover>
                      {pickedProductId && pickedAvailable !== null && (
                        <p className="text-xs text-gray-500">
                          Available: {pickedAvailable}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-black">Quantity</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={pickedQty}
                        onChange={(e) => setPickedQty(e.target.value)}
                        className="h-9 text-sm text-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-black">Rate (Rs)</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={pickedRate}
                        onChange={(e) => setPickedRate(e.target.value)}
                        className="h-9 text-sm text-black"
                      />
                    </div>
                    <Button onClick={addLine} size="sm" className="h-9 text-sm">
                      <Plus className="h-4 w-4 mr-1" /> Add to draft
                    </Button>
                  </div>
                </div>

                {/* Draft lines table */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-2">
                    Draft lines ({lines.length})
                  </h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-gray-200">
                          <TableHead className="px-4 py-3 text-sm font-medium text-black">Item</TableHead>
                          <TableHead className="py-3 text-sm font-medium text-black text-right">Available</TableHead>
                          <TableHead className="py-3 text-sm font-medium text-black text-right">Qty</TableHead>
                          <TableHead className="py-3 text-sm font-medium text-black text-right">Value</TableHead>
                          <TableHead className="px-4 py-3 text-sm font-medium text-black text-right w-[60px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-500">
                              Add lines manually or load an Excel file in step 1.
                            </TableCell>
                          </TableRow>
                        ) : (
                          lines.map((l) => (
                            <TableRow key={l.productId} className="border-gray-100 hover:bg-gray-50">
                              <TableCell className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-black truncate max-w-[260px]">{l.productName}</span>
                                  {l.sku && (
                                    <span className="text-xs text-gray-500">SKU: {l.sku}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-right text-sm text-gray-700">
                                {l.available}
                              </TableCell>
                              <TableCell className="py-3 text-right text-sm text-black">
                                {l.quantity}
                              </TableCell>
                              <TableCell className="py-3 text-right text-sm text-black">
                                Rs {(l.quantity * (l.rate || 0)).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600"
                                  onClick={() => removeLine(l.productId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-4">
            <Card className="p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="text-base font-semibold text-black">Summary</h3>
                  <p className="text-xs text-gray-500">Review totals, then save.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">Lines</span>
                  <span className="text-sm text-black">{totals.lineCount}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-600">Total units</span>
                  <span className="text-sm text-black">{totals.units}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total value (at rates above)</span>
                  <span className="text-sm font-semibold text-black">
                    Rs {totals.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                <Label className="text-sm text-black">Notes for this dispatch</Label>
                <Textarea
                  placeholder="Driver, vehicle, approval, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm text-black min-h-[80px] resize-none"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!canSave}
                size="sm"
                className="w-full mt-4 text-sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save dispatch
              </Button>

              <p className="mt-3 text-xs text-gray-500">
                Saving deducts stock immediately (per line). Reference and dispatch date
                are copied into the movement notes for auditing.
              </p>
            </Card>
          </div>
        </div>
      )}

      <ExcelUploadDialog
        open={excelDialogOpen}
        onOpenChange={setExcelDialogOpen}
        title="Load dispatch lines from Excel"
        description={
          <>
            Each row adds a line to the dispatch draft. Products must already exist in
            the catalog — names are matched case-insensitively. Pick a branch in step 2
            before uploading so available stock can be checked.
          </>
        }
        fields={STOCK_OUT_FIELDS}
        footnote={
          <>
            Rows with unknown product names are skipped and listed after upload. Empty
            name rows are ignored.
          </>
        }
        onFile={processExcelFile}
        onDownloadTemplate={downloadTemplate}
      />
    </div>
  );
}

// ---------- History sub-component ----------
interface HistoryViewProps {
  rows: MovementRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  setPage: (p: number) => void;
  filterReason: string;
  setFilterReason: (v: string) => void;
  filterStart?: Date;
  setFilterStart: (d?: Date) => void;
  filterEnd?: Date;
  setFilterEnd: (d?: Date) => void;
  onRefresh: () => void;
}

function HistoryView({
  rows,
  loading,
  page,
  totalPages,
  total,
  setPage,
  filterReason,
  setFilterReason,
  filterStart,
  setFilterStart,
  filterEnd,
  setFilterEnd,
  onRefresh,
}: HistoryViewProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-black">Reason</Label>
            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="h-9 w-[160px] text-sm text-black">
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Reasons</SelectItem>
                {REASON_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-sm">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-sm text-black">From date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-[160px] justify-start text-left text-sm font-normal text-black"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {filterStart ? format(filterStart, "MM/dd/yyyy") : (
                    <span className="text-gray-500">Start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={filterStart} onSelect={setFilterStart} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-sm text-black">To date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-[160px] justify-start text-left text-sm font-normal text-black"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {filterEnd ? format(filterEnd, "MM/dd/yyyy") : (
                    <span className="text-gray-500">End date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={filterEnd} onSelect={setFilterEnd} />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={onRefresh} size="sm" className="text-sm">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          {(filterStart || filterEnd || filterReason !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-black"
              onClick={() => {
                setFilterReason("all");
                setFilterStart(undefined);
                setFilterEnd(undefined);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-200">
                <TableHead className="px-6 py-4 text-sm font-medium text-black">Date</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Product</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Branch</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black text-right">Qty</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Type</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Notes</TableHead>
                <TableHead className="px-6 py-4 text-sm font-medium text-black">Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <History className="h-10 w-10 text-gray-300" />
                      <p className="text-sm text-black">No stock-out records yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const ts = new Date(r.created_at);
                  const qty = Number(r.quantity_change);
                  return (
                    <TableRow key={r.id} className="border-gray-100 hover:bg-gray-50">
                      <TableCell className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-black">
                            {ts.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-black truncate max-w-[260px]">
                            {r.product?.name || "—"}
                          </span>
                          {r.product?.sku && (
                            <span className="text-xs text-gray-500">SKU: {r.product.sku}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-top text-sm text-black">
                        {r.branch?.name || "—"}
                      </TableCell>
                      <TableCell className="py-4 align-top text-right text-sm text-red-600">
                        {qty}
                      </TableCell>
                      <TableCell className="py-4 align-top">
                        <Badge variant="outline" className="text-xs text-black">
                          {r.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 align-top text-sm text-gray-600 max-w-[260px] truncate">
                        {r.notes || "—"}
                      </TableCell>
                      <TableCell className="px-6 py-4 align-top text-sm text-black">
                        {r.user?.email || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-black">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-black"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-black"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-black px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-black"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-black"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
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
