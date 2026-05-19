"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Plus,
  Loader2,
  Edit,
  Eye,
  Trash2,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  Hash,
  Package,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { z } from "zod";
import { LoadingButton } from "@/components/ui/loading-button";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";

interface Supplier {
  id: string;
  code: string;
  name: string;
  phone_number?: string;
  fax_number?: string;
  mobile_number?: string;
  country?: string;
  city?: string;
  email?: string;
  ntn?: string;
  strn?: string;
  gov_id?: string;
  address?: string;
  display_on_pos: boolean;
  status: string;
  product_count: number;
  created_at: string;
}

// Phone-ish fields share the same shape; only validated when filled.
const phoneRegex = /^[0-9+\-\s()]+$/;

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || (v.length >= 7 && v.length <= 20), {
    message: "Must be 7-20 characters",
  })
  .refine((v) => !v || phoneRegex.test(v), {
    message: "Only digits, +, -, spaces, and ( ) allowed",
  });

const supplierFormSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  phone_number: optionalPhone,
  fax_number: optionalPhone,
  mobile_number: optionalPhone,
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Invalid email address",
    }),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  ntn: z.string().trim().optional(),
  strn: z.string().trim().optional(),
  gov_id: z.string().trim().optional(),
  address: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

type SupplierFormErrors = Partial<
  Record<keyof z.infer<typeof supplierFormSchema>, string>
>;

const zodErrorsToMap = (err: z.ZodError): SupplierFormErrors => {
  const map: SupplierFormErrors = {};
  for (const issue of err.errors) {
    const key = issue.path[0] as keyof SupplierFormErrors | undefined;
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
};

const firstZodError = (err: z.ZodError) =>
  err.errors[0]?.message || "Please fix the highlighted fields";

const extractApiError = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return first.message;
  }
  if (data?.message) return data.message;
  if (err?.message) return err.message;
  return fallback;
};

type SupplierForm = z.infer<typeof supplierFormSchema>;

const emptyForm: SupplierForm = {
  name: "",
  phone_number: "",
  fax_number: "",
  mobile_number: "",
  country: "",
  city: "",
  email: "",
  ntn: "",
  strn: "",
  gov_id: "",
  address: "",
  is_active: true,
};

const FIELDS: { label: string; key: keyof SupplierForm; required?: boolean; placeholder?: string }[] = [
  { label: "Name", key: "name", required: true, placeholder: "Enter supplier name" },
  { label: "Email", key: "email", placeholder: "supplier@example.com" },
  { label: "Mobile", key: "mobile_number", placeholder: "Enter mobile number" },
  { label: "Phone", key: "phone_number", placeholder: "Enter phone number" },
  { label: "Fax", key: "fax_number", placeholder: "Enter fax number" },
  { label: "Country", key: "country", placeholder: "Enter country" },
  { label: "City", key: "city", placeholder: "Enter city" },
  { label: "NTN", key: "ntn", placeholder: "Enter NTN" },
  { label: "STRN", key: "strn", placeholder: "Enter STRN" },
  { label: "Gov ID", key: "gov_id", placeholder: "Enter government ID" },
];

const Suppliers: React.FC = () => {
  const [list, setList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<Supplier | null>(null);

  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [errors, setErrors] = useState<SupplierFormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = async (q: string = search) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/suppliers`, { params: { search: q } });
      setList(res.data.data);
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to load suppliers"));
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    fetchList(v);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setCurrent(null);
    setAddOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setCurrent(s);
    setForm({
      name: s.name,
      phone_number: s.phone_number || "",
      fax_number: s.fax_number || "",
      mobile_number: s.mobile_number || "",
      country: s.country || "",
      city: s.city || "",
      email: s.email || "",
      ntn: s.ntn || "",
      strn: s.strn || "",
      gov_id: s.gov_id || "",
      address: s.address || "",
      is_active: s.status === "active",
    });
    setErrors({});
    setEditOpen(true);
  };

  const openDetail = (s: Supplier) => {
    setCurrent(s);
    setDetailOpen(true);
  };

  const setField = <K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async () => {
    console.log("[supplier] submit", { editing: !!current, form });
    const parsed = supplierFormSchema.safeParse(form);
    if (!parsed.success) {
      const map = zodErrorsToMap(parsed.error);
      setErrors(map);
      toast.error(firstZodError(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Strip "" for cleared optional fields so the backend doesn't store empty strings.
      const data = parsed.data;
      const payload: Record<string, any> = {
        name: data.name,
        // Always visible on POS — there's no UI toggle for this anymore.
        display_on_pos: true,
        status: (data.is_active ?? true) ? "active" : "inactive",
      };
      (["phone_number", "fax_number", "mobile_number", "email", "country", "city", "ntn", "strn", "gov_id", "address"] as const).forEach((k) => {
        const v = data[k];
        if (v && v.length > 0) payload[k] = v;
        else if (current) payload[k] = null; // editing → clear field
      });

      if (current) {
        await apiClient.put(`${API_BASE}/suppliers/${current.id}`, payload);
        setEditOpen(false);
        toast.success("Supplier updated successfully");
      } else {
        await apiClient.post(`${API_BASE}/suppliers`, payload);
        setAddOpen(false);
        toast.success("Supplier created successfully");
      }
      fetchList();
    } catch (e: any) {
      console.log(e);
      toast.error(extractApiError(e, "Failed to save supplier"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient.patch(`${API_BASE}/suppliers/${id}/toggle-status`);
      toast.success("Supplier status updated");
      fetchList();
    } catch (e: any) {
      console.log(e);
      toast.error(extractApiError(e, "Failed to update status"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`${API_BASE}/suppliers/${deleteTarget.id}`);
      toast.success("Supplier deleted successfully");
      setDeleteTarget(null);
      fetchList();
    } catch (e: any) {
      console.log(e);
      toast.error(extractApiError(e, "Failed to delete supplier"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = list.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(search.toLowerCase()),
  );

  // Stats
  const activeCount = list.filter((s) => s.status === "active").length;
  const inactiveCount = list.length - activeCount;
  const posCount = list.filter((s) => s.display_on_pos).length;

  if (isInitialLoading) {
    return <PageLoader message="Loading suppliers..." />;
  }

  const renderField = (key: keyof SupplierForm, label: string, required: boolean | undefined, placeholder?: string) => (
    <div key={key}>
      <Label htmlFor={key}>
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      <Input
        id={key}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setField(key, e.target.value as any)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={errors[key] ? "border-red-500" : ""}
        aria-invalid={!!errors[key]}
        disabled={submitting}
      />
      {errors[key] && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm md:text-base text-gray-600">Create & manage suppliers</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{list.length}</div>
                <p className="text-xs text-muted-foreground mt-1">All suppliers in the system</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Available for purchases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Disabled from new purchases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shown on POS</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{posCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Visible in POS selection</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier List ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoader message="Loading suppliers..." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No suppliers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Code</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Contact</TableHead>
                      <TableHead className="min-w-[150px]">Email</TableHead>
                      <TableHead className="min-w-[80px]">POS</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[240px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
                      const isActive = s.status === "active";
                      return (
                        <TableRow key={s.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs">{s.code}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.mobile_number || s.phone_number || "—"}</TableCell>
                          <TableCell>{s.email || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                s.display_on_pos
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                            >
                              {s.display_on_pos ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                isActive
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => openDetail(s)} title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEdit(s)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteTarget(s)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={addOpen || editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            setEditOpen(false);
            setErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current ? "Edit Supplier" : "Create Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.values(errors).filter(Boolean).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                Please fix the highlighted fields below.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map(({ label, key, required, placeholder }) =>
                renderField(key, label, required, placeholder),
              )}
              <div className="col-span-full">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address || ""}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Enter address"
                  disabled={submitting}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {errors.address}
                  </p>
                )}
              </div>
              <div className="col-span-full flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <p className="text-xs text-gray-500">
                    {form.is_active
                      ? "Active — available for new purchases"
                      : "Inactive — disabled from new purchases"}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={!!form.is_active}
                  onCheckedChange={(checked) => setField("is_active", checked)}
                  disabled={submitting}
                />
              </div>
            </div>
            <LoadingButton
              onClick={submit}
              loading={submitting}
              className="w-full"
              disabled={submitting}
            >
              {current ? "Update Supplier" : "Create Supplier"}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={() => setDetailOpen(false)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border border-gray-100 shadow-2xl bg-white">
          {current && (
            <div className="flex flex-col">
              {/* Grand Banner Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-end">
                {/* Truck Avatar Overlap */}
                <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center rounded-xl bg-white p-1.5 shadow-md border border-gray-100">
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Truck className="h-10 w-10" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="pt-12 px-6 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{current.name}</h2>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 border shadow-sm ${
                      current.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {current.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    {current.code}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {current.created_at ? current.created_at.split("T")[0] : "—"}
                  </span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-6 pb-6 pt-2">
                {/* Left Column: Contact & Address */}
                <div className="space-y-4">
                  {/* Contact Info Card */}
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-500" />
                      Contact Details
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mobile</span>
                        <span className="font-medium text-gray-900">{current.mobile_number || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium text-gray-900">{current.phone_number || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium text-gray-900 break-all">{current.email || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      Location Address
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium text-gray-800 leading-relaxed">
                        {current.address || "No address provided."}
                      </p>
                      {(current.city || current.country) && (
                        <p className="text-xs text-gray-500 mt-1 font-semibold">
                          {[current.city, current.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Tax & Stats */}
                <div className="space-y-4">
                  {/* Tax/Gov Info Card */}
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-indigo-500" />
                      Tax & Business IDs
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">NTN Number</span>
                        <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {current.ntn || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">STRN Number</span>
                        <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {current.strn || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Government ID</span>
                        <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {current.gov_id || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Stats Card */}
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-indigo-500" />
                      Operations
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Show on POS</span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 font-semibold ${
                            current.display_on_pos
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {current.display_on_pos ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Supplied Products</span>
                        <span className="font-bold text-indigo-600">{current.product_count || 0} items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">{deleteTarget?.name || "this supplier"}</span>. If
              the supplier has products, purchases, or purchase orders, deletion will be blocked
              and you'll need to disable it instead. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Suppliers;
