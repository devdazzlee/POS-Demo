"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, Edit, Trash2, Loader2, Users } from "lucide-react"
import apiClient from "@/lib/apiClient"
// sonner is the toast system that's already mounted in app/layout.tsx with
// richColors + bottom-right position. The shadcn useToast() variant in this
// project was not rendering reliably, so we standardize on sonner here.
import { toast } from "sonner"
import { PageLoader } from "@/components/ui/page-loader"
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Client-side schema. Mirrors the backend's createEmployeeSchema so the user
// gets instant feedback on obvious mistakes before we hit the network, but
// the backend stays authoritative — any server-side rejection bubbles up
// verbatim in the toast (we never invent a friendlier message).
const employeeFormSchema = z.object({
  // refine() runs on the value AS-IS (no trim transform in front) so an
  // empty string or whitespace-only input is caught reliably across all
  // Zod versions. min(2) alone has surprised us before when chained after
  // .trim() — refine sidesteps that entirely.
  name: z
    .string({ required_error: "Full name is required" })
    .refine((v) => v.trim().length >= 2, {
      message: "Full name must be at least 2 characters",
    }),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email is not valid",
    }),
  phone_number: z.string().trim().optional(),
  cnic: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  // Preprocess so `null` from the date picker maps to `undefined` — that
  // triggers the friendly required_error instead of Zod's "expected date,
  // received null".
  join_date: z.preprocess(
    (v) => (v instanceof Date ? v : undefined),
    z.date({ required_error: "Join date is required" }),
  ),
  employee_type_id: z
    .string({ required_error: "Please select an employee type" })
    .uuid("Please select an employee type"),
})

// Extract the first validation error string from a ZodError so we can hand
// it straight to a toast.
const firstZodError = (err: z.ZodError): string =>
  err.errors[0]?.message || "Please check the form fields"

// join_date is a pure calendar date (no clock time). Naive `toISOString()`
// on a Date created from a local-zone day-picker shifts the day in any
// non-UTC timezone (e.g. PKT/UTC+5 → "May 28 local" becomes "May 27 UTC").
// Build a UTC-midnight ISO from the local date PARTS so the day stays
// identical no matter where the user lives.
const toUtcMidnightIso = (d: Date): string =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()

// Format the stored ISO back to YYYY-MM-DD.
//
// New records saved by this file are exactly UTC-midnight (00:00:00 UTC) —
// we read those with UTC accessors so the day component is identical for
// every user. Legacy records saved by the previous buggy code carry a
// timezone offset (e.g. ...T19:00:00.000Z for a PKT user) — those need
// LOCAL accessors to reverse back to the day the user originally picked.
const formatJoinDate = (iso: string | Date | null | undefined): string => {
  if (!iso) return "-"
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  const isCleanUtcMidnight =
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0
  const y = isCleanUtcMidnight ? d.getUTCFullYear() : d.getFullYear()
  const m = String((isCleanUtcMidnight ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, "0")
  const day = String(isCleanUtcMidnight ? d.getUTCDate() : d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Pull the most descriptive message off an Axios error response. Backend may
// shape errors as `{ message }` or `{ errors: [{ message }] }`. We prefer
// the array's first item (Zod-on-server) and fall back to `message`.
const extractApiError = (err: any, fallback: string): string => {
  const data = err?.response?.data
  if (!data) return err?.message || fallback
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first === "string") return first
    if (first?.message) return String(first.message)
  }
  if (typeof data.message === "string") return data.message
  return fallback
}

interface Employee {
  id: string
  name: string
  email?: string
  phone_number?: string
  cnic?: string
  gender?: string
  join_date: string
  employee_type_id: string
}

interface NewEmployeeForm {
  name: string
  email: string
  phone_number: string
  cnic: string
  gender: string
  join_date: string
  employee_type_id: string
}

interface EmployeeType {
  id: string
  name: string
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([])
  const [typesLoading, setTypesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<(Employee & { join_date: Date | null }) | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm & { join_date: Date | null }>({
    name: "",
    email: "",
    phone_number: "",
    cnic: "",
    gender: "",
    join_date: null,
    employee_type_id: "",
  })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Field-level validation errors. Toast is still fired for the top-level
  // failure, but inline errors are what stays in front of the user.
  type EmployeeFormErrors = Partial<
    Record<
      "name" | "email" | "phone_number" | "cnic" | "gender" | "join_date" | "employee_type_id",
      string
    >
  >
  const [addErrors, setAddErrors] = useState<EmployeeFormErrors>({})
  const [editErrors, setEditErrors] = useState<EmployeeFormErrors>({})

  // Reduce a ZodError to a per-field map for inline rendering.
  const zodErrorsToMap = (err: z.ZodError): EmployeeFormErrors => {
    const map: EmployeeFormErrors = {}
    for (const issue of err.errors) {
      const key = issue.path[0]
      if (typeof key === "string" && !(key in map)) {
        ;(map as Record<string, string>)[key] = issue.message
      }
    }
    return map
  }

  // Fetch employees from API
  const getEmployees = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/employee")
      // Convert join_date to Date object for all employees
      setEmployees(res.data.data.map((emp: Employee) => ({ ...emp, join_date: emp.join_date ? new Date(emp.join_date) : null })))
    } catch (error) {
      console.log("Get employees error", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch employee types
  const getEmployeeTypes = async () => {
    setTypesLoading(true)
    try {
      const res = await apiClient.get("/employee/types")
      setEmployeeTypes(res.data.data)
    } catch (error) {
      setEmployeeTypes([])
    } finally {
      setTypesLoading(false)
    }
  }

  useEffect(() => {
    setIsInitialLoading(true)
    getEmployees().finally(() => setIsInitialLoading(false))
    getEmployeeTypes()
  }, [])

  // Add employee — validates with Zod first, then sends to backend. Any
  // backend rejection is surfaced verbatim in the toast (we do not paper
  // over it with a generic "Failed to add employee" string).
  const handleAddEmployee = async () => {
    // Explicit pre-check for the three required fields. This guarantees an
    // inline error renders even in the (rare) edge case where Zod's check
    // chain doesn't fire — e.g. an unexpected value type slipping through.
    const preErrors: EmployeeFormErrors = {}
    if (!newEmployee.name || newEmployee.name.trim().length < 2)
      preErrors.name = "Full name must be at least 2 characters"
    if (!newEmployee.join_date) preErrors.join_date = "Join date is required"
    if (!newEmployee.employee_type_id)
      preErrors.employee_type_id = "Please select an employee type"
    if (Object.keys(preErrors).length > 0) {
      setAddErrors(preErrors)
      toast.error("Please fix the form", { description: Object.values(preErrors)[0]! })
      return
    }

    const parsed = employeeFormSchema.safeParse(newEmployee)
    if (!parsed.success) {
      // Inline errors are the primary signal — populate every offending
      // field. The toast still fires as a secondary cue so the user
      // notices the submit failed even if the field is offscreen.
      setAddErrors(zodErrorsToMap(parsed.error))
      toast.error("Please fix the form", { description: firstZodError(parsed.error) })
      return
    }
    setAddErrors({})

    const data = parsed.data
    const payload: Record<string, string> = {
      name: data.name,
      join_date: toUtcMidnightIso(data.join_date),
      employee_type_id: data.employee_type_id,
    }
    if (data.email) payload.email = data.email
    if (data.phone_number) payload.phone_number = data.phone_number
    if (data.cnic) payload.cnic = data.cnic
    if (data.gender) payload.gender = data.gender

    setActionLoading(true)
    try {
      await apiClient.post("/employee", payload)
      toast.success("Employee added", { description: `${data.name} has been added.` })
      setIsAddDialogOpen(false)
      setNewEmployee({ name: "", email: "", phone_number: "", cnic: "", gender: "", join_date: null, employee_type_id: "" })
      getEmployees()
    } catch (error: any) {
      toast.error("Failed to add employee", {
        description: extractApiError(error, "Server rejected the request."),
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Edit employee
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee({ ...employee, join_date: employee.join_date ? new Date(employee.join_date) : null })
    setIsEditDialogOpen(true)
  }

  // Edit employee — same pipeline: Zod first, then PUT. Backend error
  // messages are shown verbatim.
  const handleEditEmployee = async () => {
    // Trace so we can confirm in the browser console exactly which path
    // ran. If this log doesn't appear when you click Update, your browser
    // is running stale code — hard-refresh (Ctrl+Shift+R).
    console.log("[handleEditEmployee] click", {
      hasEditing: !!editingEmployee,
      name: editingEmployee?.name,
      join_date: editingEmployee?.join_date,
      employee_type_id: editingEmployee?.employee_type_id,
    })

    if (!editingEmployee) return

    // Explicit pre-check. Edit is where the user most easily clears a
    // required field by hitting backspace on Name, so this guard matters
    // most here.
    const preErrors: EmployeeFormErrors = {}
    if (!editingEmployee.name || editingEmployee.name.trim().length < 2)
      preErrors.name = "Full name must be at least 2 characters"
    if (!editingEmployee.join_date) preErrors.join_date = "Join date is required"
    if (!editingEmployee.employee_type_id)
      preErrors.employee_type_id = "Please select an employee type"
    if (Object.keys(preErrors).length > 0) {
      console.warn("[handleEditEmployee] blocked by pre-check", preErrors)
      setEditErrors(preErrors)
      toast.error("Please fix the form", { description: Object.values(preErrors)[0]! })
      return
    }

    const parsed = employeeFormSchema.safeParse({
      name: editingEmployee.name,
      email: editingEmployee.email || undefined,
      phone_number: editingEmployee.phone_number || undefined,
      cnic: editingEmployee.cnic || undefined,
      gender: editingEmployee.gender || undefined,
      join_date: editingEmployee.join_date,
      employee_type_id: editingEmployee.employee_type_id,
    })
    if (!parsed.success) {
      setEditErrors(zodErrorsToMap(parsed.error))
      toast.error("Please fix the form", { description: firstZodError(parsed.error) })
      return
    }
    setEditErrors({})

    const data = parsed.data
    // Send `null` for cleared optional fields (instead of omitting them) so
    // the backend actually clears the value in the DB. The backend's
    // updateEmployeeSchema accepts `.nullable().optional()` for these.
    const payload: Record<string, string | null> = {
      name: data.name,
      join_date: toUtcMidnightIso(data.join_date),
      employee_type_id: data.employee_type_id,
      email: data.email ? data.email : null,
      phone_number: data.phone_number ? data.phone_number : null,
      cnic: data.cnic ? data.cnic : null,
      gender: data.gender ? data.gender : null,
    }

    setActionLoading(true)
    try {
      await apiClient.put(`/employee/${editingEmployee.id}`, payload)
      toast.success("Employee updated", { description: `${data.name} was saved.` })
      setIsEditDialogOpen(false)
      setEditingEmployee(null)
      getEmployees()
    } catch (error: any) {
      toast.error("Failed to update employee", {
        description: extractApiError(error, "Server rejected the request."),
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Delete employee
  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return
    setActionLoading(true)
    try {
      await apiClient.delete(`/employee/${deletingEmployee.id}`)
      toast.success("Employee deleted", {
        description: `${deletingEmployee.name} has been removed.`,
      })
      setIsDeleteDialogOpen(false)
      setDeletingEmployee(null)
      getEmployees()
    } catch (error: any) {
      // Surface the backend's exact message (e.g. the 409 from
      // deleteEmployee about lingering shift assignments / salaries). No
      // hardcoded fallback text — just whatever the server actually said.
      toast.error("Failed to delete employee", {
        description: extractApiError(error, "Server rejected the request."),
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered employees
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Stats
  const totalEmployees = employees.length

  if (isInitialLoading) {
    return <PageLoader message="Loading employees data..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {isInitialLoading ? (
          <StatCardSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-sm md:text-base text-gray-600">Manage your team</p>
        </div>
        {/* Add Employee Dialog */}
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            // Clear inline errors when the dialog closes so they don't
            // appear pre-marked the next time it opens.
            if (!open) setAddErrors({})
            setIsAddDialogOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button>Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name<span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                    if (addErrors.name) setAddErrors((p) => ({ ...p, name: undefined }))
                  }}
                  placeholder="Enter full name"
                  disabled={actionLoading}
                  aria-invalid={addErrors.name ? true : undefined}
                  className={addErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {addErrors.name && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{addErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="join_date">Join Date<span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEmployee.join_date && "text-muted-foreground",
                        addErrors.join_date && "border-red-500 focus-visible:ring-red-500",
                      )}
                    >
                      {newEmployee.join_date ? formatJoinDate(newEmployee.join_date) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newEmployee.join_date}
                      onSelect={(date) => {
                        setNewEmployee({ ...newEmployee, join_date: date })
                        if (addErrors.join_date) setAddErrors((p) => ({ ...p, join_date: undefined }))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {addErrors.join_date && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{addErrors.join_date}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employee_type_id">Employee Type<span className="text-red-500">*</span></Label>
                <Select
                  value={newEmployee.employee_type_id}
                  onValueChange={(val) => {
                    setNewEmployee({ ...newEmployee, employee_type_id: val })
                    if (addErrors.employee_type_id)
                      setAddErrors((p) => ({ ...p, employee_type_id: undefined }))
                  }}
                  disabled={actionLoading || typesLoading || employeeTypes.length === 0}
                >
                  <SelectTrigger
                    id="employee_type_id"
                    aria-invalid={addErrors.employee_type_id ? true : undefined}
                    className={
                      addErrors.employee_type_id ? "border-red-500 focus-visible:ring-red-500" : ""
                    }
                  >
                    <SelectValue placeholder={typesLoading ? "Loading..." : employeeTypes.length === 0 ? "No types found" : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.employee_type_id && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{addErrors.employee_type_id}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                    if (addErrors.email) setAddErrors((p) => ({ ...p, email: undefined }))
                  }}
                  placeholder="Enter email address (optional)"
                  disabled={actionLoading}
                  aria-invalid={addErrors.email ? true : undefined}
                  className={addErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {addErrors.email && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{addErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone_number">Phone</Label>
                <Input
                  id="phone_number"
                  value={newEmployee.phone_number}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })}
                  placeholder="Enter phone number (optional)"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                  id="cnic"
                  value={newEmployee.cnic}
                  onChange={(e) => setNewEmployee({ ...newEmployee, cnic: e.target.value })}
                  placeholder="Enter CNIC (optional)"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={newEmployee.gender}
                  onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                  placeholder="Enter gender (optional)"
                  disabled={actionLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoader message="Loading employees..." />
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[120px]">CNIC</TableHead>
                      <TableHead className="min-w-[80px]">Gender</TableHead>
                      <TableHead className="min-w-[120px]">Join Date</TableHead>
                      <TableHead className="min-w-[150px]">Employee Type ID</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email || "-"}</TableCell>
                    <TableCell>{employee.phone_number || "-"}</TableCell>
                    <TableCell>{employee.cnic || "-"}</TableCell>
                    <TableCell>{employee.gender || "-"}</TableCell>
                    <TableCell>{formatJoinDate(employee.join_date)}</TableCell>
                    <TableCell>{employee.employee_type_id}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(employee)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(employee)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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
      {/* Edit Employee Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditErrors({})
          setIsEditDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              {/* Top-of-form summary banner. Renders whenever any required
                  field is invalid — impossible to miss. */}
              {(() => {
                const missing: string[] = []
                if (!editingEmployee.name || editingEmployee.name.trim().length < 2)
                  missing.push("Full Name")
                if (!editingEmployee.join_date) missing.push("Join Date")
                if (!editingEmployee.employee_type_id) missing.push("Employee Type")
                if (missing.length === 0) return null
                return (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">
                      Missing required information
                    </p>
                    <p className="mt-1 text-sm text-red-600">
                      Please fill in: {missing.join(", ")}
                    </p>
                  </div>
                )
              })()}
              <div>
                <Label htmlFor="edit-name">Full Name<span className="text-red-500">*</span></Label>
                <Input
                  id="edit-name"
                  value={editingEmployee.name}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditingEmployee({ ...editingEmployee, name: v })
                    // Live re-validate so the user sees the red state the
                    // instant they clear a required field — no need to wait
                    // until they hit Update.
                    setEditErrors((p) => ({
                      ...p,
                      name:
                        !v || v.trim().length < 2
                          ? "Full name must be at least 2 characters"
                          : undefined,
                    }))
                  }}
                  disabled={actionLoading}
                  aria-invalid={editErrors.name ? true : undefined}
                  className={editErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.name && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{editErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => {
                    setEditingEmployee({ ...editingEmployee, email: e.target.value })
                    if (editErrors.email) setEditErrors((p) => ({ ...p, email: undefined }))
                  }}
                  disabled={actionLoading}
                  aria-invalid={editErrors.email ? true : undefined}
                  className={editErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {editErrors.email && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{editErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-phone_number">Phone</Label>
                <Input
                  id="edit-phone_number"
                  value={editingEmployee.phone_number}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone_number: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <Label htmlFor="edit-cnic">CNIC</Label>
                <Input
                  id="edit-cnic"
                  value={editingEmployee.cnic}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, cnic: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Gender</Label>
                <Input
                  id="edit-gender"
                  value={editingEmployee.gender}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, gender: e.target.value })}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <Label htmlFor="edit-join_date">Join Date<span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingEmployee?.join_date && "text-muted-foreground",
                        editErrors.join_date && "border-red-500 focus-visible:ring-red-500",
                      )}
                    >
                      {editingEmployee?.join_date ? formatJoinDate(editingEmployee.join_date) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editingEmployee?.join_date || null}
                      onSelect={(date) => {
                        setEditingEmployee(editingEmployee ? { ...editingEmployee, join_date: date } : null)
                        if (editErrors.join_date) setEditErrors((p) => ({ ...p, join_date: undefined }))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {editErrors.join_date && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{editErrors.join_date}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-employee_type_id">Employee Type<span className="text-red-500">*</span></Label>
                <Select
                  value={editingEmployee.employee_type_id}
                  onValueChange={(val) => {
                    setEditingEmployee({ ...editingEmployee, employee_type_id: val })
                    if (editErrors.employee_type_id)
                      setEditErrors((p) => ({ ...p, employee_type_id: undefined }))
                  }}
                  disabled={actionLoading || typesLoading || employeeTypes.length === 0}
                >
                  <SelectTrigger
                    id="edit-employee_type_id"
                    aria-invalid={editErrors.employee_type_id ? true : undefined}
                    className={
                      editErrors.employee_type_id ? "border-red-500 focus-visible:ring-red-500" : ""
                    }
                  >
                    <SelectValue placeholder={typesLoading ? "Loading..." : employeeTypes.length === 0 ? "No types found" : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.employee_type_id && (
                  <p className="text-sm text-red-600 mt-1" role="alert">{editErrors.employee_type_id}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete <strong>{deletingEmployee?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployee} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
