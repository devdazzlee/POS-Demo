'use client';

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle2, XCircle, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const salarySchema = z.object({
    employee_id: z.string({ required_error: "Employee is required" }).min(1, "Employee is required"),
    month: z.number({ required_error: "Month is required" }).min(1, "Month is required").max(12, "Month is required"),
    year: z.number({ required_error: "Year is required" }).min(2020, "Year must be 2020 or later"),
    amount: z.number({ required_error: "Amount is required" }).min(1, "Amount must be greater than 0"),
    is_paid: z.boolean().optional(),
    paid_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

interface Employee {
    id: string;
    name: string;
}

interface Salary {
    id: string;
    employee_id: string;
    employee: Employee;
    month: number;
    year: number;
    amount: number;
    is_paid?: boolean;
    paid_date?: string;
    notes?: string;
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const parseToLocalDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
};

export function Salaries() {
    const { toast } = useToast();
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddYearOpen, setIsAddYearOpen] = useState(false);
    const [isEditYearOpen, setIsEditYearOpen] = useState(false);
    const [form, setForm] = useState<Partial<Salary>>({});
    const [editId, setEditId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Calculate years inside component to avoid hydration issues
    const [currentYear] = useState(() => new Date().getFullYear());
    const years = Array.from({ length: (currentYear + 10) - 2015 + 1 }, (_, i) => 2015 + i);

    // Fetch employees for dropdown
    useEffect(() => {
        apiClient.get("/employee")
            .then(res => setEmployees(res.data.data))
            .catch(() => setEmployees([]));
    }, []);

    // Fetch salaries
    const fetchSalaries = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/salaries");
            setSalaries(res.data.data || []);
        } catch (e) {
            setSalaries([]);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    };
    useEffect(() => { fetchSalaries(); }, []);

    const getBackendErrorMessage = (e: any): string => {
        if (e?.response?.data?.errors && Array.isArray(e.response.data.errors) && e.response.data.errors.length > 0) {
            return e.response.data.errors.map((err: any) => err.message || JSON.stringify(err)).join(", ");
        }
        if (e?.response?.data?.message) {
            return e.response.data.message;
        }
        return e?.message || "Failed to complete request";
    };

    // Add salary
    const handleAddSalary = async () => {
        setIsSubmitting(true);
        setError(null);

        // Zod Validation
        const validationResult = salarySchema.safeParse({
            employee_id: form.employee_id,
            month: form.month ? Number(form.month) : undefined,
            year: form.year ? Number(form.year) : undefined,
            amount: form.amount ? Number(form.amount) : undefined,
            is_paid: form.is_paid,
            paid_date: form.paid_date,
            notes: form.notes,
        });

        if (!validationResult.success) {
            const firstError = validationResult.error.errors.map(err => err.message).join(", ");
            setError(firstError);
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: firstError,
            });
            setIsSubmitting(false);
            return;
        }

        const validatedData = validationResult.data;

        try {
            await apiClient.post("/salaries", {
                employee_id: validatedData.employee_id,
                month: validatedData.month,
                year: validatedData.year,
                amount: validatedData.amount,
                is_paid: validatedData.is_paid || false,
                paid_date: validatedData.paid_date || undefined,
                notes: validatedData.notes || undefined,
            });
            setIsDialogOpen(false);
            setForm({});
            fetchSalaries();
            toast({
                title: "Success",
                description: "Salary added successfully",
            });
        } catch (e: any) {
            const backendError = getBackendErrorMessage(e);
            setError(backendError);
            toast({
                variant: "destructive",
                title: "Error adding salary",
                description: backendError,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit salary
    const handleEditSalary = async () => {
        if (!editId) return;
        setIsSubmitting(true);
        setError(null);

        // Zod Validation
        const validationResult = salarySchema.safeParse({
            employee_id: form.employee_id,
            month: form.month ? Number(form.month) : undefined,
            year: form.year ? Number(form.year) : undefined,
            amount: form.amount ? Number(form.amount) : undefined,
            is_paid: form.is_paid,
            paid_date: form.paid_date,
            notes: form.notes,
        });

        if (!validationResult.success) {
            const firstError = validationResult.error.errors.map(err => err.message).join(", ");
            setError(firstError);
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: firstError,
            });
            setIsSubmitting(false);
            return;
        }

        const validatedData = validationResult.data;

        try {
            await apiClient.put(`/salaries/${editId}`, {
                employee_id: validatedData.employee_id,
                month: validatedData.month,
                year: validatedData.year,
                amount: validatedData.amount,
                is_paid: validatedData.is_paid || false,
                paid_date: validatedData.paid_date || undefined,
                notes: validatedData.notes || undefined,
            });
            setIsEditDialogOpen(false);
            setForm({});
            setEditId(null);
            fetchSalaries();
            toast({
                title: "Success",
                description: "Salary updated successfully",
            });
        } catch (e: any) {
            const backendError = getBackendErrorMessage(e);
            setError(backendError);
            toast({
                variant: "destructive",
                title: "Error updating salary",
                description: backendError,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete salary
    const handleDeleteSalary = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        try {
            await apiClient.delete(`/salaries/${deleteId}`);
            fetchSalaries();
            toast({
                title: "Success",
                description: "Salary deleted successfully",
            });
        } catch (e: any) {
            const backendError = getBackendErrorMessage(e);
            toast({
                variant: "destructive",
                title: "Error deleting salary",
                description: backendError,
            });
        } finally {
            setIsLoading(false);
            setDeleteId(null);
        }
    };

    // Open edit dialog
    const openEditDialog = (salary: Salary) => {
        setEditId(salary.id);
        setForm({
            employee_id: salary.employee_id,
            month: salary.month,
            year: salary.year,
            amount: salary.amount,
            is_paid: salary.is_paid,
            paid_date: salary.paid_date,
            notes: salary.notes,
        });
        setIsEditDialogOpen(true);
    };

    // Stats calculations
    const totalSalaries = salaries.length;
    const totalPaid = salaries
        .filter(s => s.is_paid === true)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalUnpaid = salaries
        .filter(s => !s.is_paid)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    // Filtered salaries list
    const filteredSalaries = salaries.filter(sal => {
        const employeeName = sal.employee?.name?.toLowerCase() || "";
        const notes = sal.notes?.toLowerCase() || "";
        const monthName = months[(sal.month || 1) - 1]?.toLowerCase() || "";
        const yearStr = String(sal.year);
        const search = searchTerm.toLowerCase();
        
        return employeeName.includes(search) || 
               notes.includes(search) || 
               monthName.includes(search) || 
               yearStr.includes(search);
    });

    if (isInitialLoading) {
        return <PageLoader message="Loading salaries data..." />
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header & Add Dialog */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Salary Management</h1>
                    <p className="text-sm md:text-base text-gray-600">Manage employee salary records</p>
                </div>
                <Dialog 
                    open={isDialogOpen} 
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (open) {
                            setForm({}); // Clear the form when opening the Add dialog
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Add Salary
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Salary</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label>Employee</label>
                                <Select
                                    value={form.employee_id || ""}
                                    onValueChange={val => setForm(f => ({ ...f, employee_id: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Month</label>
                                <Select
                                    value={form.month ? String(form.month) : ""}
                                    onValueChange={val => setForm(f => ({ ...f, month: Number(val) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m, idx) => (
                                            <SelectItem key={m} value={String(idx + 1)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Year</label>
                                <Popover open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between text-left font-normal border-gray-300"
                                        >
                                            <span>{form.year ? String(form.year) : "Select year"}</span>
                                            <span className="text-gray-400 font-sans text-xs">▼</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div 
                                            className="max-h-48 overflow-y-auto pr-1"
                                            onWheel={(e) => e.stopPropagation()}
                                            onTouchMove={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                {years.map((y) => (
                                                    <Button
                                                        key={y}
                                                        variant={form.year === y ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            setForm(f => ({ ...f, year: y }));
                                                            setIsAddYearOpen(false);
                                                        }}
                                                    >
                                                        {y}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label>Amount</label>
                                <Input
                                    type="number"
                                    value={form.amount || ""}
                                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                                    placeholder="Amount"
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex items-center space-x-3 py-2.5 border rounded-lg px-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="add-paid-checkbox"
                                    checked={!!form.is_paid}
                                    onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="add-paid-checkbox" className="text-base font-semibold text-gray-900 cursor-pointer select-none">
                                    Paid
                                </label>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Paid Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={form.paid_date ? "default" : "outline"}
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            {form.paid_date ? form.paid_date.split("T")[0] : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={form.paid_date ? parseToLocalDate(form.paid_date) : undefined}
                                            onSelect={date => {
                                                if (!date) {
                                                    setForm(f => ({ ...f, paid_date: undefined }));
                                                    return;
                                                }
                                                const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                                                setForm(f => ({ ...f, paid_date: utcDate.toISOString() }));
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label>Notes</label>
                                <Input
                                    type="text"
                                    value={form.notes || ""}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Notes"
                                />
                            </div>
                            {error && <div className="text-red-600 text-sm">{error}</div>}
                            <Button onClick={handleAddSalary} disabled={isSubmitting || !form.employee_id || !form.month || !form.year || !form.amount}>
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                Add Salary
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalSalaries}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Rs {totalPaid.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">Rs {totalUnpaid.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Table with Loader */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                    <CardTitle>Salaries ({filteredSalaries.length})</CardTitle>
                    <div className="w-full sm:w-80">
                        <Input
                            placeholder="Search salaries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-gray-300"
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <PageLoader message="Loading salaries..." />
                    ) : salaries.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No salaries found</p>
                        </div>
                    ) : filteredSalaries.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No matching salaries found for "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="inline-block min-w-full align-middle">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[150px]">Employee</TableHead>
                                            <TableHead className="min-w-[100px]">Month</TableHead>
                                            <TableHead className="min-w-[80px]">Year</TableHead>
                                            <TableHead className="min-w-[100px]">Amount</TableHead>
                                            <TableHead className="min-w-[100px]">Status</TableHead>
                                            <TableHead className="min-w-[120px]">Paid Date</TableHead>
                                            <TableHead className="min-w-[150px]">Notes</TableHead>
                                            <TableHead className="min-w-[120px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                            <TableBody>
                                {filteredSalaries.map(sal => (
                                    <TableRow key={sal.id}>
                                        <TableCell>{sal.employee?.name || "-"}</TableCell>
                                        <TableCell>{months[(sal.month || 1) - 1]}</TableCell>
                                        <TableCell>{sal.year}</TableCell>
                                        <TableCell>Rs {sal.amount}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={sal.is_paid 
                                                    ? "bg-green-100 text-green-800 border-none hover:bg-green-200 hover:text-green-900 transition-colors cursor-default" 
                                                    : "bg-red-100 text-red-800 border-none hover:bg-red-200 hover:text-red-900 transition-colors cursor-default"}
                                            >
                                                {sal.is_paid ? "Paid" : "Unpaid"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{sal.paid_date ? sal.paid_date.split("T")[0] : "-"}</TableCell>
                                        <TableCell>{sal.notes || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => openEditDialog(sal)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(sal.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure you want to delete this salary record?</AlertDialogTitle>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteSalary} className="bg-red-600 hover:bg-red-700 text-white">Yes, Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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

            {/* Edit Salary Dialog */}
            <Dialog 
                open={isEditDialogOpen} 
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setForm({}); // Clear the form when closing the Edit dialog
                        setEditId(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Salary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label>Employee</label>
                            <Select
                                value={form.employee_id || ""}
                                onValueChange={val => setForm(f => ({ ...f, employee_id: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label>Month</label>
                            <Select
                                value={form.month ? String(form.month) : ""}
                                onValueChange={val => setForm(f => ({ ...f, month: Number(val) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m, idx) => (
                                        <SelectItem key={m} value={String(idx + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Year</label>
                            <Popover open={isEditYearOpen} onOpenChange={setIsEditYearOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between text-left font-normal border-gray-300"
                                    >
                                        <span>{form.year ? String(form.year) : "Select year"}</span>
                                        <span className="text-gray-400 font-sans text-xs">▼</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="start">
                                    <div 
                                        className="max-h-48 overflow-y-auto pr-1"
                                        onWheel={(e) => e.stopPropagation()}
                                        onTouchMove={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-3 gap-2">
                                            {years.map((y) => (
                                                <Button
                                                    key={y}
                                                    variant={form.year === y ? "default" : "outline"}
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setForm(f => ({ ...f, year: y }));
                                                        setIsEditYearOpen(false);
                                                    }}
                                                >
                                                    {y}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label>Amount</label>
                            <Input
                                type="number"
                                value={form.amount || ""}
                                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                                placeholder="Amount"
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <div className="flex items-center space-x-3 py-2.5 border rounded-lg px-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                id="edit-paid-checkbox"
                                checked={!!form.is_paid}
                                onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="edit-paid-checkbox" className="text-base font-semibold text-gray-900 cursor-pointer select-none">
                                Paid
                            </label>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Paid Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={form.paid_date ? "default" : "outline"}
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        {form.paid_date ? form.paid_date.split("T")[0] : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={form.paid_date ? parseToLocalDate(form.paid_date) : undefined}
                                        onSelect={date => {
                                            if (!date) {
                                                setForm(f => ({ ...f, paid_date: undefined }));
                                                return;
                                            }
                                            const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                                            setForm(f => ({ ...f, paid_date: utcDate.toISOString() }));
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label>Notes</label>
                            <Input
                                type="text"
                                value={form.notes || ""}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Notes"
                            />
                        </div>
                        {error && <div className="text-red-600 text-sm">{error}</div>}
                        <Button onClick={handleEditSalary} disabled={isSubmitting || !form.employee_id || !form.month || !form.year || !form.amount}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Update Salary
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}