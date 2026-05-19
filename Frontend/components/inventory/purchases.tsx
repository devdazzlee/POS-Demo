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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PackagePlus,
  FileSpreadsheet,
  Info,
  Receipt,
  FileText,
  Trash2,
  Box,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/page-loader";
import { ExcelUploadDialog, type ExcelField } from "@/components/inventory/excel-upload-dialog";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface Supplier {
  id: string;
  name: string;
  code?: string | null;
}

interface Branch {
  id: string;
  name: string;
  branch_type?: string | null;
}

interface DraftLine {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  costPrice: number;
}

interface PurchaseRow {
  id: string;
  purchase_date: string;
  invoice_ref?: string | null;
  quantity: string | number;
  cost_price: string | number;
  delivery_status?: string | null;
  notes?: string | null;
  product?: Product | null;
  supplier?: { id: string; name: string } | null;
  warehouse_branch?: { id: string; name: string } | null;
  user?: { email?: string | null } | null;
}

export function Purchases() {
  // ------- shared metadata -------
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [p, s, b] = await Promise.all([
        apiClient.get(`${API_BASE}/products`, { params: { fetch_all: true } }),
        apiClient.get(`${API_BASE}/suppliers`, { params: { fetch_all: true } }),
        apiClient.get(`${API_BASE}/branches`, { params: { fetch_all: true } }),
      ]);
      const productList = Array.isArray(p.data?.data)
        ? p.data.data
        : p.data?.data?.products || [];
      setProducts(productList.filter((x: any) => x?.id));
      setSuppliers(Array.isArray(s.data?.data) ? s.data.data : []);
      setBranches(Array.isArray(b.data?.data) ? b.data.data : []);
    } catch {
      // toast handled per-row
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // ------- tab -------
  const [tab, setTab] = useState<"history" | "new">("history");

  // ------- history -------
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [filterStart, setFilterStart] = useState<Date | undefined>(undefined);
  const [filterEnd, setFilterEnd] = useState<Date | undefined>(undefined);

  const fetchHistory = useCallback(
    async (pg = page) => {
      setHistoryLoading(true);
      try {
        const params: any = { page: pg, limit: PAGE_SIZE };
        if (filterSupplier !== "all") params.supplierId = filterSupplier;
        if (filterStart) params.startDate = filterStart.toISOString();
        if (filterEnd) {
          const e = new Date(filterEnd);
          e.setHours(23, 59, 59, 999);
          params.endDate = e.toISOString();
        }
        const res = await apiClient.get(`${API_BASE}/purchases`, { params });
        setRows(res.data?.data || []);
        setTotal(res.data?.meta?.total ?? 0);
        setTotalPages(res.data?.meta?.totalPages ?? 1);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load purchases");
      } finally {
        setHistoryLoading(false);
      }
    },
    [filterSupplier, filterStart, filterEnd, page],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ------- new entry: step 1 (Excel new products) -------
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);

  const handleProductsExcelFile = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post(`${API_BASE}/products/bulk-upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const results: { success?: boolean }[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      const ok = results.filter((r) => r.success).length;
      toast.success(
        results.length > 0
          ? `Imported ${ok} of ${results.length} product${results.length === 1 ? "" : "s"}`
          : "Products imported",
      );
      // Re-fetch product list so the new SKUs are pickable below.
      fetchMeta();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to import products");
      throw err; // keep dialog open if the upload failed
    }
  };

  const downloadStockInTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Product Name",
        "Unit",
        "Category",
        "Purchase Rate",
        "Sales Rate",
        "Min Stock",
        "Stock",
      ],
      ["Sample Product A", "PCS", "Grocery", 80, 100, 10, 50],
      ["Sample Product B", "Kg", "Grocery", 250, 320, 5, 20],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock In");
    XLSX.writeFile(wb, "stock-in-template.xlsx");
  };

  const STOCK_IN_FIELDS: ExcelField[] = [
    {
      name: "Product Name",
      required: true,
      description: 'Same as Add Product. Column can also be "Name".',
    },
    {
      name: "Unit",
      description: 'Same as Select unit — unit name (e.g. PCS). Auto-created if new.',
    },
    {
      name: "Category",
      description: "Same as Select category — category name. Auto-created if new.",
    },
    {
      name: "Purchase Rate",
      required: true,
      description: "Same as Add Product (required). Aliases: Buy Price (Rs), purchase_rate.",
    },
    {
      name: "Sales Rate",
      required: true,
      description:
        'Same as Add Product (required). Aliases: Sell Price (Rs), selling_price, sales_rate_inc_dis_and_tax, or column "Sales Rate".',
    },
    {
      name: "Min Stock",
      description:
        "Same as Add Product. Defaults to 10 on Stock In Excel import if omitted; 0 if empty in this bulk dialog.",
    },
    {
      name: "Stock",
      description:
        "Same as Add Product — opening quantity. Aliases: Initial Stock Qty, Opening Stock, Quantity, stock.",
    },
  ];

  // ------- new entry: step 2 (Supplier delivery / GRN) -------
  const [supplierId, setSupplierId] = useState<string>("");
  const [warehouseBranchId, setWarehouseBranchId] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [invoiceRef, setInvoiceRef] = useState<string>("");
  const [batchNo, setBatchNo] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Auto-pick first warehouse branch if none selected.
  useEffect(() => {
    if (!warehouseBranchId && branches.length > 0) {
      const warehouse =
        branches.find((b) => (b.branch_type || "").toUpperCase() === "WAREHOUSE") ||
        branches[0];
      if (warehouse) setWarehouseBranchId(warehouse.id);
    }
  }, [branches, warehouseBranchId]);

  // Add-a-line row
  const [searchTerm, setSearchTerm] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedProductId, setPickedProductId] = useState<string>("");
  const [pickedQty, setPickedQty] = useState<string>("");
  const [pickedCost, setPickedCost] = useState<string>("");

  const filteredProducts = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    if (!t) return products.slice(0, 50);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          (p.sku && p.sku.toLowerCase().includes(t)),
      )
      .slice(0, 50);
  }, [products, searchTerm]);

  const pickedProduct = useMemo(
    () => products.find((p) => p.id === pickedProductId),
    [products, pickedProductId],
  );

  const resetAddLine = () => {
    setPickedProductId("");
    setPickedQty("");
    setPickedCost("");
    setSearchTerm("");
  };

  const addLine = () => {
    if (!pickedProductId) {
      toast.error("Pick a product");
      return;
    }
    const q = Number(pickedQty);
    const c = Number(pickedCost);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!Number.isFinite(c) || c < 0) {
      toast.error("Cost must be 0 or more");
      return;
    }
    setLines((prev) => {
      const ex = prev.find((l) => l.productId === pickedProductId);
      if (ex) {
        return prev.map((l) =>
          l.productId === pickedProductId
            ? { ...l, quantity: l.quantity + q, costPrice: c || l.costPrice }
            : l,
        );
      }
      return [
        ...prev,
        {
          productId: pickedProductId,
          productName: pickedProduct?.name || "Product",
          sku: pickedProduct?.sku || undefined,
          quantity: q,
          costPrice: c,
        },
      ];
    });
    resetAddLine();
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const totals = useMemo(() => {
    const lineCount = lines.length;
    const units = lines.reduce((s, l) => s + l.quantity, 0);
    const value = lines.reduce((s, l) => s + l.quantity * l.costPrice, 0);
    return { lineCount, units, value };
  }, [lines]);

  const canSave =
    !!supplierId &&
    !!warehouseBranchId &&
    lines.length > 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiClient.post(`${API_BASE}/purchases/bulk`, {
        supplierId,
        warehouseBranchId,
        purchaseDate: purchaseDate.toISOString(),
        invoiceRef: invoiceRef || undefined,
        notes: notes || undefined,
        batchNo: batchNo || undefined,
        expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          costPrice: l.costPrice,
        })),
      });
      toast.success(
        `Saved ${lines.length} line${lines.length === 1 ? "" : "s"} to the bill`,
      );
      // Reset and bounce to history.
      setLines([]);
      setNotes("");
      setInvoiceRef("");
      setBatchNo("");
      setExpiryDate(undefined);
      resetAddLine();
      setTab("history");
      setPage(1);
      fetchHistory(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  if (metaLoading) {
    return <PageLoader message="Loading stock in..." />;
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-gray-900 text-white p-2 rounded-md">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Stock In</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              <span className="font-medium">Excel</span> adds many new products and
              opening stock. <span className="font-medium">Supplier form</span> records
              one delivery (invoice) and the lines you add below.
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
            New Entry
          </button>
        </div>
      </div>

      {tab === "history" ? (
        <HistoryView
          rows={rows}
          loading={historyLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          setPage={setPage}
          suppliers={suppliers}
          filterSupplier={filterSupplier}
          setFilterSupplier={(v) => {
            setFilterSupplier(v);
            setPage(1);
          }}
          filterStart={filterStart}
          setFilterStart={(d) => {
            setFilterStart(d);
            setPage(1);
          }}
          filterEnd={filterEnd}
          setFilterEnd={(d) => {
            setFilterEnd(d);
            setPage(1);
          }}
          onSearch={() => fetchHistory()}
        />
      ) : (
        <>
        <NewEntryView
          // step 1
          onOpenExcelDialog={() => setExcelDialogOpen(true)}
          // step 2
          suppliers={suppliers}
          branches={branches}
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          warehouseBranchId={warehouseBranchId}
          setWarehouseBranchId={setWarehouseBranchId}
          purchaseDate={purchaseDate}
          setPurchaseDate={setPurchaseDate}
          invoiceRef={invoiceRef}
          setInvoiceRef={setInvoiceRef}
          batchNo={batchNo}
          setBatchNo={setBatchNo}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          // add a line
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pickerOpen={pickerOpen}
          setPickerOpen={setPickerOpen}
          pickedProductId={pickedProductId}
          setPickedProductId={setPickedProductId}
          pickedProduct={pickedProduct}
          filteredProducts={filteredProducts}
          pickedQty={pickedQty}
          setPickedQty={setPickedQty}
          pickedCost={pickedCost}
          setPickedCost={setPickedCost}
          onAddLine={addLine}
          // lines
          lines={lines}
          removeLine={removeLine}
          // sidebar
          notes={notes}
          setNotes={setNotes}
          totals={totals}
          canSave={canSave}
          saving={saving}
          onSave={handleSave}
        />
        <ExcelUploadDialog
          open={excelDialogOpen}
          onOpenChange={setExcelDialogOpen}
          title="Import new products from Excel"
          description={
            <>
              Upload a spreadsheet to add new products with prices and opening stock. This
              updates the product catalog only — it does not create a supplier receipt (use
              Step 2 for that).
            </>
          }
          fields={STOCK_IN_FIELDS}
          footnote={
            <>
              Optional columns: Subcategory, Brand, Supplier, Tax, SKU, Description. Item
              codes are auto-generated when SKU is omitted. Header aliases such as{" "}
              <span className="font-medium">Name</span>,{" "}
              <span className="font-medium">purchase_rate</span>, and{" "}
              <span className="font-medium">sales_rate_inc_dis_and_tax</span> are also accepted.
            </>
          }
          onFile={handleProductsExcelFile}
          onDownloadTemplate={downloadStockInTemplate}
        />
        </>
      )}
    </div>
  );
}

// ---------- History sub-component ----------
interface HistoryViewProps {
  rows: PurchaseRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  setPage: (p: number) => void;
  suppliers: Supplier[];
  filterSupplier: string;
  setFilterSupplier: (v: string) => void;
  filterStart?: Date;
  setFilterStart: (d?: Date) => void;
  filterEnd?: Date;
  setFilterEnd: (d?: Date) => void;
  onSearch: () => void;
}

function HistoryView({
  rows,
  loading,
  page,
  totalPages,
  total,
  setPage,
  suppliers,
  filterSupplier,
  setFilterSupplier,
  filterStart,
  setFilterStart,
  filterEnd,
  setFilterEnd,
  onSearch,
}: HistoryViewProps) {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <Card className="p-4 border border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-medium text-black">What this list shows</p>
            <p>
              Only <span className="font-medium">supplier deliveries</span> you save
              from <span className="font-medium">New Entry → Save purchase</span> (server{" "}
              <code className="text-xs bg-white px-1 py-0.5 rounded border border-gray-200">
                POST /purchases
              </code>
              ). Each line becomes a purchase record with supplier, invoice, and cost.
            </p>
            <p>
              Stock added via <span className="font-medium">Stock Management → New products (Excel)</span>{" "}
              or <span className="font-medium">Stock In → Step 1 Excel</span> updates
              inventory through bulk product import — it writes{" "}
              <span className="font-medium">stock movements</span>, not purchase rows, so
              it will <span className="font-medium">not</span> appear here. To review
              that activity use{" "}
              <span className="font-medium">
                Inventory → Stock Management → Movement Log
              </span>{" "}
              tab.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-black">Supplier</Label>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="h-9 w-[200px] text-sm text-black">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">
                  All Sources
                </SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-sm">
                    {s.name}
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
                  className="h-9 w-[180px] justify-start text-left text-sm font-normal text-black"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {filterStart ? (
                    format(filterStart, "MM/dd/yyyy")
                  ) : (
                    <span className="text-gray-500">Start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filterStart}
                  onSelect={setFilterStart}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm text-black">To date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-[180px] justify-start text-left text-sm font-normal text-black"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {filterEnd ? (
                    format(filterEnd, "MM/dd/yyyy")
                  ) : (
                    <span className="text-gray-500">End date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filterEnd}
                  onSelect={setFilterEnd}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={onSearch} size="sm" className="text-sm">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          {(filterStart || filterEnd || filterSupplier !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-black"
              onClick={() => {
                setFilterSupplier("all");
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
                <TableHead className="px-6 py-4 text-sm font-medium text-black">
                  Timestamp
                </TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Doc Ref</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Supplier</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black">Branch</TableHead>
                <TableHead className="py-4 text-sm font-medium text-black text-right">
                  Valuation
                </TableHead>
                <TableHead className="px-6 py-4 text-sm font-medium text-black">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-xl mx-auto">
                      <FileText className="h-10 w-10 text-gray-300" />
                      <p className="text-base font-medium text-black">
                        No supplier purchases in this list
                      </p>
                      <p className="text-sm text-gray-600">
                        That is expected if all your stock came from{" "}
                        <span className="font-medium">catalog / Excel bulk import</span>{" "}
                        (opening stock) rather than from{" "}
                        <span className="font-medium">Save purchase</span> on this screen.
                        Those imports still increased on-hand qty — they are stored as
                        stock movements, not as rows in this purchase history.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const ts = new Date(r.purchase_date);
                  const value = Number(r.quantity) * Number(r.cost_price);
                  return (
                    <TableRow key={r.id} className="border-gray-100 hover:bg-gray-50">
                      <TableCell className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-black">
                            {ts.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ts.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-top text-sm text-black font-mono">
                        {r.invoice_ref || "—"}
                      </TableCell>
                      <TableCell className="py-4 align-top text-sm text-black">
                        {r.supplier?.name || "—"}
                      </TableCell>
                      <TableCell className="py-4 align-top text-sm text-black">
                        {r.warehouse_branch?.name || "—"}
                      </TableCell>
                      <TableCell className="py-4 align-top text-right text-sm text-black">
                        Rs{" "}
                        {value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-6 py-4 align-top">
                        <Badge variant="outline" className="text-xs text-black">
                          {r.delivery_status || "COMPLETE"}
                        </Badge>
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

// ---------- New Entry sub-component ----------
interface NewEntryViewProps {
  onOpenExcelDialog: () => void;

  suppliers: Supplier[];
  branches: Branch[];
  supplierId: string;
  setSupplierId: (v: string) => void;
  warehouseBranchId: string;
  setWarehouseBranchId: (v: string) => void;
  purchaseDate: Date;
  setPurchaseDate: (d: Date) => void;
  invoiceRef: string;
  setInvoiceRef: (v: string) => void;
  batchNo: string;
  setBatchNo: (v: string) => void;
  expiryDate?: Date;
  setExpiryDate: (d?: Date) => void;

  searchTerm: string;
  setSearchTerm: (v: string) => void;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  pickedProductId: string;
  setPickedProductId: (v: string) => void;
  pickedProduct?: Product;
  filteredProducts: Product[];
  pickedQty: string;
  setPickedQty: (v: string) => void;
  pickedCost: string;
  setPickedCost: (v: string) => void;
  onAddLine: () => void;

  lines: DraftLine[];
  removeLine: (productId: string) => void;

  notes: string;
  setNotes: (v: string) => void;
  totals: { lineCount: number; units: number; value: number };
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
}

function NewEntryView(props: NewEntryViewProps) {
  const {
    onOpenExcelDialog,
    suppliers,
    branches,
    supplierId,
    setSupplierId,
    warehouseBranchId,
    setWarehouseBranchId,
    purchaseDate,
    setPurchaseDate,
    invoiceRef,
    setInvoiceRef,
    batchNo,
    setBatchNo,
    expiryDate,
    setExpiryDate,
    searchTerm,
    setSearchTerm,
    pickerOpen,
    setPickerOpen,
    pickedProductId,
    setPickedProductId,
    pickedProduct,
    filteredProducts,
    pickedQty,
    setPickedQty,
    pickedCost,
    setPickedCost,
    onAddLine,
    lines,
    removeLine,
    notes,
    setNotes,
    totals,
    canSave,
    saving,
    onSave,
  } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Step 1 — Excel new products */}
        <Card className="p-5 border border-green-200 bg-green-50/50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-black">
                Step 1 — New products from Excel (optional)
              </h2>
              <p className="text-sm text-gray-700 mt-2">
                For a list of <span className="font-medium">new products</span> with
                prices and opening stock. When you pick a file, each row is saved to
                the <span className="font-medium">product catalog</span> — it does{" "}
                <span className="font-medium">not</span> fill the supplier receipt in
                Step 2.
              </p>
            </div>
            <div className="shrink-0">
              <Button
                onClick={onOpenExcelDialog}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Upload Excel file
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-right">
                See required columns in the upload dialog
              </p>
            </div>
          </div>
          <div className="mt-3 border-t border-green-100 pt-3 text-xs text-gray-700">
            Click <span className="font-medium">Upload Excel file</span> to see required
            columns and download a template. Skip this step if you only need a supplier
            bill — use Step 2.
          </div>
        </Card>

        {/* Step 2 — Supplier delivery (GRN) */}
        <Card className="p-5 border border-gray-200">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-black">
                Step 2 — Supplier delivery (GRN)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Use this for a real purchase: choose supplier and date, add each
                product and quantity, then{" "}
                <span className="font-medium">Save purchase</span> on the right. Only
                lines you add here appear on the invoice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-black">Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-9 text-sm text-black">
                    <SelectValue placeholder="Choose supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-sm">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-black">Delivery date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left text-sm font-normal text-black"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {format(purchaseDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={purchaseDate}
                      onSelect={(d) => d && setPurchaseDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-black">Invoice / GRN reference</Label>
                <Input
                  placeholder="e.g. INV-1024"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="h-9 text-sm text-black"
                />
              </div>
            </div>

            {/* Branch — auto-picked but the user can override */}
            <div className="space-y-1.5 max-w-sm">
              <Label className="text-sm text-black">Warehouse / Branch</Label>
              <Select value={warehouseBranchId} onValueChange={setWarehouseBranchId}>
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

            {/* Add a line */}
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50/40 space-y-3">
              <h3 className="text-sm font-medium text-black">Add one line at a time</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_auto] gap-3 items-end">
                <div className="space-y-1.5">
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
                            if (pickedProductId) setPickedProductId("");
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
                        filteredProducts.map((p) => (
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
                            <span className="block text-sm text-black truncate">
                              {p.name}
                            </span>
                            <span className="block text-xs text-gray-500">
                              SKU: {p.sku || "N/A"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No products found
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Qty</Label>
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
                  <Label className="text-sm text-black">Cost / unit (Rs)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={pickedCost}
                    onChange={(e) => setPickedCost(e.target.value)}
                    className="h-9 text-sm text-black"
                  />
                </div>
                <Button onClick={onAddLine} size="sm" className="h-9 text-sm">
                  Add to this bill
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Batch / lot (optional)</Label>
                  <Input
                    placeholder="Lot number"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="h-9 text-sm text-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-black">Expiry (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start text-left text-sm font-normal text-black"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {expiryDate ? format(expiryDate, "PPP") : (
                          <span className="text-gray-500">None</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Lines on this bill */}
            <div>
              <h3 className="text-sm font-medium text-black mb-1">Lines on this bill</h3>
              <p className="text-xs text-gray-500 mb-3">
                These lines are what will be saved with the supplier invoice — not the
                Excel import above.
              </p>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-gray-200">
                      <TableHead className="px-4 py-3 text-sm font-medium text-black">
                        Product
                      </TableHead>
                      <TableHead className="py-3 text-sm font-medium text-black text-right">
                        Qty
                      </TableHead>
                      <TableHead className="py-3 text-sm font-medium text-black text-right">
                        Unit cost
                      </TableHead>
                      <TableHead className="py-3 text-sm font-medium text-black text-right">
                        Line total
                      </TableHead>
                      <TableHead className="px-4 py-3 w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Box className="h-8 w-8 text-gray-300" />
                            <p className="text-sm text-black">No lines yet</p>
                            <p className="text-xs text-gray-500">
                              Pick a product, enter quantity and cost, then click "Add
                              to this bill".
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((l) => (
                        <TableRow
                          key={l.productId}
                          className="border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-black truncate max-w-[260px]">
                                {l.productName}
                              </span>
                              {l.sku && (
                                <span className="text-xs text-gray-500">
                                  SKU: {l.sku}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm text-black">
                            {l.quantity}
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm text-black">
                            Rs{" "}
                            {l.costPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm text-black">
                            Rs{" "}
                            {(l.quantity * l.costPrice).toLocaleString("en-US", {
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

      {/* Sidebar — Receipt summary */}
      <div className="space-y-4">
        <Card className="p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="text-base font-semibold text-black">Receipt summary</h3>
              <p className="text-xs text-gray-500">
                Step 2 only — Excel lines are not counted here.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-600">Line count</span>
              <span className="text-sm text-black">{totals.lineCount}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-600">Total quantity</span>
              <span className="text-sm text-black">{totals.units}</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bill total</p>
              <p className="text-2xl font-semibold text-black mt-1">
                Rs{" "}
                {totals.value.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            <Label className="text-sm text-black">Notes (optional)</Label>
            <Textarea
              placeholder="Delivery notes, vehicle, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm text-black min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={onSave}
            disabled={!canSave}
            size="sm"
            className="w-full mt-4 text-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save purchase
          </Button>

          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Saving records this supplier bill and updates stock for the lines above.
              Add all products before saving.
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
}
