"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Loader2, Edit, Eye, Trash2, AlertTriangle, Layers, CheckCircle2, XCircle, Package } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageLoader } from "@/components/ui/page-loader";

interface Color {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

// Senior developer utility to retrieve backend validation and database errors directly
const extractApiError = (err: any, fallback: string = "Something went wrong"): string => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return String(first.message);
  }
  if (typeof data.message === "string") return data.message;
  return fallback;
};

const Colors: React.FC = () => {
  const { toast } = useToast();
  const [colors, setColors] = useState<Color[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az" | "za">("newest");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<Color | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const isFormValid = formName.trim() !== "";

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async (q: string = search) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/colors`, { params: { search: q } });
      setColors(res.data.data);
    } catch (err) {
      console.log(err);
    } finally { 
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    fetchColors(v);
  };

  const openAdd = () => {
    setFormName("");
    setFormIsActive(true);
    setCurrent(null);
    setError("");
    setAddOpen(true);
  };

  const openEdit = (c: Color) => {
    setCurrent(c);
    setFormName(c.name);
    setFormIsActive(c.is_active !== undefined ? c.is_active : true);
    setError("");
    setEditOpen(true);
  };

  const openDetail = (c: Color) => {
    setCurrent(c);
    setDetailOpen(true);
  };

  const submit = async () => {
    if (!formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = { 
        name: formName,
        is_active: formIsActive
      };
      if (current) {
        await apiClient.patch(`${API_BASE}/colors/${current.id}`, payload);
        setEditOpen(false);
        toast({
          title: "Success",
          description: "Color updated successfully",
        });
      } else {
        await apiClient.post(`${API_BASE}/colors`, payload);
        setAddOpen(false);
        toast({
          title: "Success",
          description: "Color created successfully",
        });
      }
      fetchColors();
    } catch (err: any) {
      const errMsg = extractApiError(err, "Submission failed");
      setError(errMsg);
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.delete(`${API_BASE}/colors/${deleteTarget.id}`);
      toast({
        title: "Success",
        description: res.data?.message || "Color deleted successfully",
      });
      setDeleteTarget(null);
      fetchColors();
    } catch (err: any) {
      const errMsg = extractApiError(err, "Failed to delete color");
      toast({
        title: "Deletion Blocked",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalCount = colors.length;
  const activeCount = colors.filter(c => c.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const totalLinkedProducts = colors.reduce((sum, c) => sum + (c.product_count || 0), 0);

  const filtered = colors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search);
    const matchesStatus = statusFilter === "all"
      ? true
      : statusFilter === "active"
      ? c.is_active === true
      : c.is_active === false;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortOrder === "oldest") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    if (sortOrder === "az") {
      return a.name.localeCompare(b.name);
    }
    if (sortOrder === "za") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  if (isInitialLoading) {
    return <PageLoader message="Loading colors..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Colors</h1>
          <p className="text-sm md:text-base text-gray-600">Create & manage colors</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Color
        </Button>
      </div>

      {/* Dynamic Analytical Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50/40 to-white border-indigo-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Colors</p>
              <p className="text-3xl font-extrabold text-gray-900">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Colors registered in master</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/40 to-white border-emerald-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Colors</p>
              <p className="text-3xl font-extrabold text-gray-900">{activeCount}</p>
              <p className="text-[10px] text-gray-500">Available in system operations</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50/40 to-white border-rose-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Inactive Colors</p>
              <p className="text-3xl font-extrabold text-gray-900">{inactiveCount}</p>
              <p className="text-[10px] text-gray-500">Disabled or hidden colors</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/40 to-white border-amber-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Linked Products</p>
              <p className="text-3xl font-extrabold text-gray-900">{totalLinkedProducts}</p>
              <p className="text-[10px] text-gray-500">Linked to operational products</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or code"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="w-[160px] text-gray-700 font-medium bg-background shadow-sm hover:border-gray-300 transition-colors">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="az">Name (A-Z)</SelectItem>
              <SelectItem value="za">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[160px] text-gray-700 font-medium bg-background shadow-sm hover:border-gray-300 transition-colors">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      <Card>
        <CardHeader><CardTitle>Color List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <PageLoader message="Loading colors..." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No colors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Code</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">Products</TableHead>
                      <TableHead className="min-w-[150px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Created</TableHead>
                      <TableHead className="min-w-[150px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono font-medium text-gray-900">{c.code}</TableCell>
                        <TableCell className="font-semibold text-gray-900">{c.name}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                            {c.product_count} product{c.product_count === 1 ? "" : "s"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {c.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">{c.created_at.split('T')[0]}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDetail(c)} title="View Details">
                              <Eye className="h-4 w-4 text-gray-500"/>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(c)} title="Edit Color">
                              <Edit className="h-4 w-4 text-indigo-600"/>
                            </Button>
                            <Button size="sm" variant="outline" className="border-rose-100 hover:bg-rose-50" onClick={() => setDeleteTarget(c)} title="Delete Color">
                              <Trash2 className="h-4 w-4 text-rose-600"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || editOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditOpen(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{current ? 'Edit Color' : 'Create Color'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label htmlFor="color-name">Name<span className="text-red-500 ml-1">*</span></Label>
              <Input 
                id="color-name" 
                value={formName} 
                onChange={e => { setFormName(e.target.value); setError(""); }}
                placeholder="Enter color name (e.g. Red, Black, White)"
                className={formName.trim() === "" ? "border-red-500 mt-1" : "mt-1"}
                disabled={submitting}
              />
              {formName.trim() === "" && (
                <p className="text-xs text-red-600 mt-1">Name is required</p>
              )}
            </div>

            {/* Active Switch Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                <p className="text-xs text-gray-500">Enable or disable this color in system workflows</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} disabled={submitting} />
            </div>

            {/* Error message inside the modal directly below input/status */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-semibold animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <LoadingButton 
              onClick={submit} 
              loading={submitting} 
              className="w-full mt-2"
              disabled={submitting || !isFormValid}
            >
              {current ? 'Update Color' : 'Create Color'}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={() => setDetailOpen(false)}>
        <DialogContent className="max-w-lg md:max-w-xl w-full">
          <DialogHeader>
            <DialogTitle>Color Details</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">Color Code</span>
                  <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border break-words block">{current.code}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">Color Name</span>
                  <span className="text-sm font-bold text-gray-900 break-words block whitespace-normal">{current.name}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">Linked Products</span>
                  <span className="text-sm font-medium text-gray-900">{current.product_count} product{current.product_count === 1 ? '' : 's'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">Created Date</span>
                  <span className="text-sm font-medium text-gray-900">{current.created_at.split('T')[0]}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">Active Status</span>
                {current.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mt-1">Active</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 mt-1">Inactive</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 animate-bounce">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold text-gray-900">Are you absolutely sure?</DialogTitle>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  You are about to permanently delete the color <strong className="text-rose-600 font-bold">"{deleteTarget?.name}"</strong> (Code: {deleteTarget?.code}).
                </p>
                <p className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded text-xs text-left">
                  ⚠️ <strong>Important Note / Warning:</strong> If this color is linked to any active products in the system, deletion will be blocked and you must disable it instead to preserve sales history.
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <LoadingButton 
                variant="destructive" 
                className="flex-1" 
                onClick={handleDelete} 
                loading={deleteLoading}
                disabled={deleteLoading}
              >
                Delete color
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Colors;
