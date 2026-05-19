"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
  DollarSign,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { toast } from "sonner";
import { z } from "zod";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

// Mirrors backend customerCreateByAdminSchema. Optional fields use refine so
// "" doesn't trip min checks — only a present non-empty value is validated.
const phoneRegex = /^[0-9+\-\s]+$/;

const customerFormSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  name: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 1, { message: "Name is required" }),
  phone_number: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (v.length >= 7 && v.length <= 20), {
      message: "Phone number must be 7-20 digits",
    })
    .refine((v) => !v || phoneRegex.test(v), {
      message: "Phone number must contain only digits, +, -, or spaces",
    }),
  address: z.string().trim().optional(),
  billing_address: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

type CustomerFormErrors = Partial<
  Record<"email" | "name" | "phone_number" | "address" | "billing_address", string>
>;

const zodErrorsToMap = (err: z.ZodError): CustomerFormErrors => {
  const map: CustomerFormErrors = {};
  for (const issue of err.errors) {
    const key = issue.path[0] as keyof CustomerFormErrors | undefined;
    if (key && !map[key]) map[key] = issue.message;
  }
  return map;
};

const firstZodError = (err: z.ZodError) =>
  err.errors[0]?.message || "Please fix the highlighted fields";

// Surface the exact backend message verbatim — never hardcode generic copy.
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

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer & { billing_address?: string }>>({});
  const [editingCustomer, setEditingCustomer] = useState<(Customer & { billing_address?: string }) | null>(null);
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [addErrors, setAddErrors] = useState<CustomerFormErrors>({});
  const [editErrors, setEditErrors] = useState<CustomerFormErrors>({});

  // 1) Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`${API_BASE}/customer`);
      setCustomers(res.data.data);
    } catch (err: any) {
      console.log(err);
      toast.error(extractApiError(err, "Failed to load customers"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      try {
        await fetchCustomers();
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, []);

  // 2) Create customer (all fields)
  const handleAddCustomer = async () => {
    console.log("[customer] add submit", newCustomer);
    const parsed = customerFormSchema.safeParse({
      email: newCustomer.email ?? "",
      name: newCustomer.name ?? "",
      phone_number: newCustomer.phone_number ?? "",
      address: newCustomer.address ?? "",
      billing_address: newCustomer.billing_address ?? "",
      is_active: newCustomer.is_active ?? true,
    });
    if (!parsed.success) {
      const map = zodErrorsToMap(parsed.error);
      setAddErrors(map);
      toast.error(firstZodError(parsed.error));
      return;
    }
    setAddErrors({});
    setIsAdding(true);
    try {
      const data = parsed.data;
      await apiClient.post(`${API_BASE}/customer`, {
        email: data.email,
        name: data.name || undefined,
        phone_number: data.phone_number || undefined,
        address: data.address || undefined,
        billing_address: data.billing_address || undefined,
        is_active: data.is_active ?? true,
      });
      setNewCustomer({});
      setIsAddDialogOpen(false);
      toast.success("Customer created successfully");
      fetchCustomers();
    } catch (err: any) {
      console.log(err);
      toast.error(extractApiError(err, "Failed to create customer"));
    } finally {
      setIsAdding(false);
    }
  };

  // Edit customer (all fields, use PUT)
  const handleEditCustomer = async () => {
    if (!editingCustomer) return;
    console.log("[customer] edit submit", editingCustomer);
    const parsed = customerFormSchema.safeParse({
      email: editingCustomer.email ?? "",
      name: editingCustomer.name ?? "",
      phone_number: editingCustomer.phone_number ?? "",
      address: editingCustomer.address ?? "",
      billing_address: editingCustomer.billing_address ?? "",
      is_active: editingCustomer.is_active,
    });
    if (!parsed.success) {
      const map = zodErrorsToMap(parsed.error);
      setEditErrors(map);
      toast.error(firstZodError(parsed.error));
      return;
    }
    setEditErrors({});
    setIsEditing(true);
    try {
      const data = parsed.data;
      // Send null for cleared optional fields so the backend (nullable+optional)
      // can clear them; otherwise pass the trimmed value.
      await apiClient.put(`${API_BASE}/customer/${editingCustomer.id}`, {
        email: data.email,
        name: data.name ? data.name : null,
        phone_number: data.phone_number ? data.phone_number : null,
        address: data.address ? data.address : null,
        billing_address: data.billing_address ? data.billing_address : null,
        is_active: data.is_active ?? true,
      });
      setEditingCustomer(null);
      toast.success("Customer updated successfully");
      fetchCustomers();
    } catch (err: any) {
      console.log(err);
      toast.error(extractApiError(err, "Failed to update customer"));
    } finally {
      setIsEditing(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!deleteTargetCustomer) return;
    setIsDeletingCustomer(true);
    try {
      await apiClient.delete(`${API_BASE}/customer/${deleteTargetCustomer.id}`);
      toast.success("Customer deleted successfully");
      setDeleteTargetCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      console.log(err);
      toast.error(extractApiError(err, "Failed to delete customer"));
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Stats derived from the customer list. Revenue isn't returned by /customer
  // so we drop it and surface signals that are actually useful from this screen.
  const activeCount = customers.filter((c) => c.is_active).length;
  const inactiveCount = customers.length - activeCount;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newThisMonth = customers.filter(
    (c) => new Date(c.created_at) >= monthStart,
  ).length;

  // Filter by name/email/phone
  const filteredCustomers = customers.filter((customer) =>
    (customer.name || customer.email || customer.phone_number || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (isInitialLoading) {
    return <PageLoader message="Loading customers data..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header & Add Dialog */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-sm md:text-base text-gray-600">Manage your customer database</p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setAddErrors({});
              setNewCustomer({});
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Object.keys(addErrors).length > 0 && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  Please fix the highlighted fields below.
                </div>
              )}
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email || ""}
                  onChange={(e) => {
                    setNewCustomer({ ...newCustomer, email: e.target.value });
                    if (addErrors.email)
                      setAddErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="Enter customer email"
                  className={addErrors.email ? "border-red-500" : ""}
                  aria-invalid={!!addErrors.email}
                />
                {addErrors.email && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {addErrors.email}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={newCustomer.name || ""}
                  onChange={(e) => {
                    setNewCustomer({ ...newCustomer, name: e.target.value });
                    if (addErrors.name)
                      setAddErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Enter customer name"
                  className={addErrors.name ? "border-red-500" : ""}
                  aria-invalid={!!addErrors.name}
                />
                {addErrors.name && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {addErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={newCustomer.phone_number || ""}
                  onChange={(e) => {
                    setNewCustomer({
                      ...newCustomer,
                      phone_number: e.target.value,
                    });
                    if (addErrors.phone_number)
                      setAddErrors((p) => ({ ...p, phone_number: undefined }));
                  }}
                  placeholder="Enter phone number"
                  className={addErrors.phone_number ? "border-red-500" : ""}
                  aria-invalid={!!addErrors.phone_number}
                />
                {addErrors.phone_number && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {addErrors.phone_number}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={newCustomer.address || ""}
                  onChange={(e) => {
                    setNewCustomer({ ...newCustomer, address: e.target.value });
                    if (addErrors.address)
                      setAddErrors((p) => ({ ...p, address: undefined }));
                  }}
                  placeholder="Enter address"
                  className={addErrors.address ? "border-red-500" : ""}
                  aria-invalid={!!addErrors.address}
                />
                {addErrors.address && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {addErrors.address}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="billing_address">Billing Address</Label>
                <Input
                  id="billing_address"
                  type="text"
                  value={newCustomer.billing_address || ""}
                  onChange={(e) => {
                    setNewCustomer({
                      ...newCustomer,
                      billing_address: e.target.value,
                    });
                    if (addErrors.billing_address)
                      setAddErrors((p) => ({
                        ...p,
                        billing_address: undefined,
                      }));
                  }}
                  placeholder="Enter billing address"
                  className={addErrors.billing_address ? "border-red-500" : ""}
                  aria-invalid={!!addErrors.billing_address}
                />
                {addErrors.billing_address && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {addErrors.billing_address}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="add-is-active" className="text-sm font-medium">
                    Status
                  </Label>
                  <p className="text-xs text-gray-500">
                    {(newCustomer.is_active ?? true)
                      ? "Customer is active and can be used in sales"
                      : "Customer is inactive and hidden from sales selection"}
                  </p>
                </div>
                <Switch
                  id="add-is-active"
                  checked={newCustomer.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setNewCustomer({ ...newCustomer, is_active: checked })
                  }
                />
              </div>
              <Button
                onClick={handleAddCustomer}
                className="w-full"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating Customer...
                  </>
                ) : (
                  "Create Customer"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
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
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All customers in the system
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {activeCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for new sales
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Customers
                </CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {inactiveCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hidden from sales selection
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New This Month
                </CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {newThisMonth}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Added since{" "}
                  {monthStart.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table with Loader */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader message="Loading customers..." />
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Contact</TableHead>
                      <TableHead className="min-w-[120px]">Last Visit</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                        {customer.name && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            {customer.name}
                          </div>
                        )}
                        {customer.phone_number && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.created_at.split("T")[0]}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.is_active ? "default" : "secondary"
                        }
                        className={
                          customer.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditingCustomer(customer)
                          }
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteTargetCustomer(customer)}
                          disabled={isDeletingCustomer}
                          className="text-red-600 hover:text-red-700"
                        >
                          {isDeletingCustomer && deleteTargetCustomer?.id === customer.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCustomer(null);
            setEditErrors({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              {Object.keys(editErrors).length > 0 && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  Please fix the highlighted fields below.
                </div>
              )}
              <div>
                <Label htmlFor="edit-email">
                  Email <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingCustomer.email || ""}
                  onChange={(e) => {
                    setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value,
                    });
                    if (editErrors.email)
                      setEditErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={editErrors.email ? "border-red-500" : ""}
                  aria-invalid={!!editErrors.email}
                />
                {editErrors.email && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {editErrors.email}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editingCustomer.name || ""}
                  onChange={(e) => {
                    setEditingCustomer({
                      ...editingCustomer,
                      name: e.target.value,
                    });
                    if (editErrors.name)
                      setEditErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Enter customer name"
                  className={editErrors.name ? "border-red-500" : ""}
                  aria-invalid={!!editErrors.name}
                />
                {editErrors.name && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {editErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingCustomer.phone_number || ""}
                  onChange={(e) => {
                    setEditingCustomer({
                      ...editingCustomer,
                      phone_number: e.target.value,
                    });
                    if (editErrors.phone_number)
                      setEditErrors((p) => ({ ...p, phone_number: undefined }));
                  }}
                  placeholder="Enter phone number"
                  className={editErrors.phone_number ? "border-red-500" : ""}
                  aria-invalid={!!editErrors.phone_number}
                />
                {editErrors.phone_number && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {editErrors.phone_number}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  type="text"
                  value={editingCustomer.address || ""}
                  onChange={(e) => {
                    setEditingCustomer({
                      ...editingCustomer,
                      address: e.target.value,
                    });
                    if (editErrors.address)
                      setEditErrors((p) => ({ ...p, address: undefined }));
                  }}
                  placeholder="Enter address"
                  className={editErrors.address ? "border-red-500" : ""}
                  aria-invalid={!!editErrors.address}
                />
                {editErrors.address && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {editErrors.address}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-billing-address">Billing Address</Label>
                <Input
                  id="edit-billing-address"
                  type="text"
                  value={editingCustomer.billing_address || ""}
                  onChange={(e) => {
                    setEditingCustomer({
                      ...editingCustomer,
                      billing_address: e.target.value,
                    });
                    if (editErrors.billing_address)
                      setEditErrors((p) => ({
                        ...p,
                        billing_address: undefined,
                      }));
                  }}
                  placeholder="Enter billing address"
                  className={editErrors.billing_address ? "border-red-500" : ""}
                  aria-invalid={!!editErrors.billing_address}
                />
                {editErrors.billing_address && (
                  <p className="text-sm text-red-600 mt-1" role="alert">
                    {editErrors.billing_address}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-is-active" className="text-sm font-medium">
                    Status
                  </Label>
                  <p className="text-xs text-gray-500">
                    {editingCustomer.is_active
                      ? "Customer is active and can be used in sales"
                      : "Customer is inactive and hidden from sales selection"}
                  </p>
                </div>
                <Switch
                  id="edit-is-active"
                  checked={editingCustomer.is_active}
                  onCheckedChange={(checked) =>
                    setEditingCustomer({ ...editingCustomer, is_active: checked })
                  }
                />
              </div>
              <Button
                onClick={handleEditCustomer}
                className="w-full"
                disabled={isEditing}
              >
                {isEditing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Updating Customer...
                  </>
                ) : (
                  "Update Customer"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTargetCustomer}
        onOpenChange={(open) => {
          if (!open && !isDeletingCustomer) {
            setDeleteTargetCustomer(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {deleteTargetCustomer?.name || deleteTargetCustomer?.email || "this customer"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCustomer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCustomer();
              }}
              disabled={isDeletingCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingCustomer ? (
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
}
