"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Boxes,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/page-loader";
import { usePosData } from "@/hooks/use-pos-data";
import { cn } from "@/lib/utils";

/** Sentinel values — must not match a real branch/category id from the API. */
const ALL_BRANCHES = "__all_branches__";
const ALL_CATEGORIES = "__all_categories__";

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

export function StockView() {
  const {
    branches,
    categories,
    fetchBranches,
    fetchCategories,
  } = usePosData();

  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRow, setDetailRow] = useState<any | null>(null);

  const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("current_quantity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(25);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
        branchId: branchFilter === ALL_BRANCHES ? "" : branchFilter,
        categoryId: categoryFilter === ALL_CATEGORIES ? "" : categoryFilter,
        search: search.trim(),
      };

      const res = await apiClient.get(`${API_BASE}/stock`, { params });
      setStocks(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, [branchFilter, categoryFilter, search, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchStocks();
    fetchBranches();
    fetchCategories();
  }, [fetchStocks, fetchBranches, fetchCategories]);

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case "product":
          valA = a.product?.name || "";
          valB = b.product?.name || "";
          break;
        case "branch":
          valA = a.branch?.name || "";
          valB = b.branch?.name || "";
          break;
        case "quantity":
          valA = Number(a.current_quantity);
          valB = Number(b.current_quantity);
          break;
        default:
          valA = Number(a.current_quantity);
          valB = Number(b.current_quantity);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [stocks, sortField, sortOrder]);

  const stats = useMemo(() => {
    const totalItems = stocks.reduce(
      (acc, s) => acc + Number(s.current_quantity || 0),
      0,
    );
    const lowStock = stocks.filter((s) => {
      const qty = Number(s.current_quantity || 0);
      const min = Number(s.product?.min_qty || 0);
      return qty > 0 && qty <= min;
    }).length;
    const outOfStock = stocks.filter(
      (s) => Number(s.current_quantity || 0) <= 0,
    ).length;

    return { totalItems, lowStock, outOfStock };
  }, [stocks]);

  const getStatusDisplay = (s: any) => {
    const qty = Number(s.current_quantity || 0);
    const min = Number(s.product?.min_qty || 0);

    if (qty <= 0) {
      return {
        label: "Out of stock",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: XCircle,
      };
    }
    if (qty <= min) {
      return {
        label: "Low stock",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        icon: AlertTriangle,
      };
    }
    return {
      label: "In stock",
      className: "bg-green-50 text-green-800 border-green-200",
      icon: CheckCircle2,
    };
  };

  const exportCSV = () => {
    const headers = ["Product", "SKU", "Branch", "Category", "Quantity", "Status"];
    const rows = stocks.map((s) => {
      const status = getStatusDisplay(s).label;
      return [
        s.product?.name || "",
        s.product?.sku || "",
        s.branch?.name || "",
        s.product?.category?.name || "",
        s.current_quantity,
        status,
      ];
    });
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-by-location-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const detailStatus = detailRow ? getStatusDisplay(detailRow) : null;
  const DetailStatusIcon = detailStatus?.icon;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-gray-900 text-white p-2 rounded-md">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Stock by Location</h1>
            <p className="text-sm text-gray-600 mt-1">
              See how much stock each product has at each branch.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={loading || stocks.length === 0}
          className="text-sm text-black"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary (current page) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total units on this page"
          value={stats.totalItems.toLocaleString()}
          loading={loading}
        />
        <StatCard
          label="Low stock on this page"
          value={stats.lowStock}
          loading={loading}
        />
        <StatCard
          label="Out of stock on this page"
          value={stats.outOfStock}
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-sm text-black"
            />
          </div>
          <Select
            value={branchFilter}
            onValueChange={(v) => {
              setBranchFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full lg:w-[200px] text-sm text-black">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES} className="text-sm">
                All branches
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-sm">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full lg:w-[200px] text-sm text-black">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES} className="text-sm">
                All categories
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-sm">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-black">Stock list</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Products and quantities for the filters above.
          </p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-sm text-gray-600">
                    <button
                      type="button"
                      className="inline-flex items-center text-sm text-gray-600 hover:text-black"
                      onClick={() => toggleSort("product")}
                    >
                      Product
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-sm text-gray-600">SKU</TableHead>
                  <TableHead className="text-sm text-gray-600">
                    <button
                      type="button"
                      className="inline-flex items-center text-sm text-gray-600 hover:text-black"
                      onClick={() => toggleSort("branch")}
                    >
                      Branch
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-sm text-gray-600 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center ml-auto text-sm text-gray-600 hover:text-black"
                      onClick={() => toggleSort("quantity")}
                    >
                      Quantity
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-sm text-gray-600 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-sm text-gray-600 text-right w-[72px]">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48">
                      <PageLoader message="Loading stock..." />
                    </TableCell>
                  </TableRow>
                ) : stocks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-sm text-gray-500"
                    >
                      No stock found for these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStocks.map((s) => {
                    const status = getStatusDisplay(s);
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={s.id} className="border-gray-100">
                        <TableCell className="py-3">
                          <span className="text-sm text-black block">
                            {s.product?.name || "—"}
                          </span>
                          <span className="text-xs text-gray-500 block mt-0.5">
                            {s.product?.category?.name || "Uncategorized"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {s.product?.sku || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-black">
                          {s.branch?.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-black text-right">
                          {Number(s.current_quantity || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs gap-1",
                              status.className,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:text-black"
                            aria-label={`View details for ${s.product?.name || "product"}`}
                            onClick={() => setDetailRow(s)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="text-sm text-black"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || loading}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="text-sm text-black"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row details */}
      <Dialog
        open={!!detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black">
              Stock details
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {detailRow?.product?.name} at {detailRow?.branch?.name}
            </DialogDescription>
          </DialogHeader>
          {detailRow && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Product</dt>
                <dd className="text-black text-right">
                  {detailRow.product?.name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">SKU</dt>
                <dd className="text-black text-right">
                  {detailRow.product?.sku || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Category</dt>
                <dd className="text-black text-right">
                  {detailRow.product?.category?.name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Branch</dt>
                <dd className="text-black text-right">
                  {detailRow.branch?.name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Quantity on hand</dt>
                <dd className="text-black text-right">
                  {Number(detailRow.current_quantity || 0).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Minimum stock</dt>
                <dd className="text-black text-right">
                  {Number(detailRow.product?.min_qty ?? 0).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4 items-center">
                <dt className="text-gray-600">Status</dt>
                <dd>
                  {detailStatus && DetailStatusIcon && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs gap-1", detailStatus.className)}
                    >
                      <DetailStatusIcon className="h-3 w-3" />
                      {detailStatus.label}
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
