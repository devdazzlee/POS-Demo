"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Clock, Users, DollarSign, Eye, StopCircle, Edit, Trash2, Loader2, Calendar as CalendarIcon, Sun, Moon, Sunset, CheckCircle, AlertTriangle } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import apiClient from "@/lib/apiClient"
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string
  name: string
  hourlyRate?: number
}

interface Shift {
  id: string
  employee: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  breakTime: string
  totalHours: number
  status: "scheduled" | "active" | "completed" | "cancelled"
  sales: number
  hourlyRate: number
}

interface NewShiftForm {
  employee: string
  employeeId: string
  date: string
  shiftType: string
  startTime: string
  endTime: string
  breakTime: string
}

const parseToLocalDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeToDecimal = (timeStr: string) => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/\s+/g, "").toUpperCase();
  const isPM = cleanStr.includes("PM");
  const isAM = cleanStr.includes("AM");
  const numericPart = cleanStr.replace(/[AP]M/, "");
  const [hStr, mStr] = numericPart.split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  
  if (isPM && h < 12) {
    h += 12;
  } else if (isAM && h === 12) {
    h = 0;
  }
  return h + m / 60;
};

const calculateHours = (startTime: string, endTime: string, breakHours: number) => {
  const startDecimal = parseTimeToDecimal(startTime);
  const endDecimal = parseTimeToDecimal(endTime);
  let diff = endDecimal - startDecimal;
  if (diff < 0) {
    diff += 24;
  }
  return Math.max(0, diff - breakHours);
};

const formatTimeTo12Hour = (timeStr: string) => {
  if (!timeStr) return "-";
  if (timeStr.toUpperCase().includes("AM") || timeStr.toUpperCase().includes("PM")) {
    return timeStr;
  }
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const formattedHour = String(h).padStart(2, "0");
  return `${formattedHour}:${mStr || "00"} ${ampm}`;
};

function TimePicker({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: "09", minute: "00", ampm: "AM" };
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const minute = mStr || "00";
    if (isNaN(h)) return { hour: "09", minute: "00", ampm: "AM" };
    
    let ampm = "AM";
    let hourNum = h;
    if (h >= 12) {
      ampm = "PM";
      if (h > 12) hourNum = h - 12;
    } else if (h === 0) {
      hourNum = 12;
    }
    
    const hour = String(hourNum).padStart(2, "0");
    return { hour, minute, ampm };
  };

  const { hour, minute, ampm } = parseTime(value);

  const handleTimeChange = (newHour: string, newMinute: string, newAmpm: string) => {
    let hNum = parseInt(newHour, 10);
    if (newAmpm === "PM" && hNum < 12) {
      hNum += 12;
    } else if (newAmpm === "AM" && hNum === 12) {
      hNum = 0;
    }
    const formattedHour = String(hNum).padStart(2, "0");
    onChange(`${formattedHour}:${newMinute}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full max-w-[240px]">
      <Select
        disabled={disabled}
        value={hour}
        onValueChange={(val) => handleTimeChange(val, minute, ampm)}
      >
        <SelectTrigger className="w-[62px] h-8 border-none bg-transparent hover:bg-gray-100/50 transition-colors focus:ring-0 px-2 py-0 text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[220px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-gray-400 font-medium select-none">:</span>
      <Select
        disabled={disabled}
        value={minute}
        onValueChange={(val) => handleTimeChange(hour, val, ampm)}
      >
        <SelectTrigger className="w-[62px] h-8 border-none bg-transparent hover:bg-gray-100/50 transition-colors focus:ring-0 px-2 py-0 text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[220px] overflow-y-auto">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={disabled}
        value={ampm}
        onValueChange={(val) => handleTimeChange(hour, minute, val)}
      >
        <SelectTrigger className="w-[72px] h-8 border-none bg-transparent hover:bg-gray-100/50 transition-colors focus:ring-0 px-2 py-0 text-sm">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

const shiftFormSchema = z.object({
  employeeId: z.string().min(1, "Employee selection is required"),
  date: z.string().min(1, "Date selection is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  breakTime: z.coerce.number().min(0, "Break time cannot be negative"),
});

export function Shifts() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])

  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false)
  const [isViewShiftOpen, setIsViewShiftOpen] = useState(false)
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false)
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [endShiftSales, setEndShiftSales] = useState("")

  // Add loading state
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const [newShift, setNewShift] = useState<NewShiftForm>({
    employee: "",
    employeeId: "",
    date: "",
    shiftType: "",
    startTime: "",
    endTime: "",
    breakTime: "1",
  })

  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);

  // Sync createDate to newShift.date
  useEffect(() => {
    if (createDate) {
      setNewShift(prev => ({ ...prev, date: format(createDate, "yyyy-MM-dd") }));
    } else {
      setNewShift(prev => ({ ...prev, date: "" }));
    }
  }, [createDate]);

  // Sync editDate to editingShift.date
  useEffect(() => {
    if (editDate && editingShift) {
      setEditingShift(prev => prev ? ({ ...prev, date: format(editDate, "yyyy-MM-dd") }) : null);
    }
  }, [editDate]);

  // Fetch employees from API
  const getEmployees = async () => {
    try {
      const res = await apiClient.get("/employee")
      const apiEmployees = res.data.data.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        hourlyRate: emp.hourlyRate || 15, // fallback if not present
      }))
      setEmployees(apiEmployees)
    } catch (error) {
      console.log("Error fetching employees:", error)
    }
  }

  // Fetch all shifts from API
  const getAllShifts = async () => {
    try {
      const res = await apiClient.get("/shift-assignment");
      const apiShifts = res.data.data.map((shift: any) => {
        const startTime = shift.shift_time?.split("-")[0]?.trim() || "";
        const endTime = shift.shift_time?.split("-")[1]?.trim() || "";
        const breakTimeStr = shift.break_time || "1 hour";
        const breakHours = parseFloat(breakTimeStr) || 0;
        
        // Compute totalHours dynamically
        const totalHours = calculateHours(startTime, endTime, breakHours);

        // Derive status dynamically from database properties
        let derivedStatus = "scheduled";
        if (shift.end_date) {
          derivedStatus = "completed";
        } else {
          const shiftDateStr = shift.start_date?.split("T")[0] || "";
          const todayDateStr = getLocalDateString();
          if (shiftDateStr <= todayDateStr) {
            derivedStatus = "active";
          } else {
            derivedStatus = "scheduled";
          }
        }

        return {
          id: shift.id,
          employee: shift.employee?.name || "",
          employeeId: shift.employee_id,
          date: shift.start_date?.split("T")[0] || "",
          startTime,
          endTime,
          breakTime: breakTimeStr,
          totalHours,
          status: derivedStatus,
          sales: shift.sales || 0,
          hourlyRate: shift.hourly_rate || 15,
        };
      });
      setShifts(apiShifts);
    } catch (error) {
      console.log("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true)
      try {
        await Promise.all([getEmployees(), getAllShifts()])
      } finally {
        setIsInitialLoading(false)
      }
    }
    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-50";
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50 hover:text-blue-700 font-semibold uppercase tracking-wider text-[10px] py-0.5 px-2";
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold uppercase tracking-wider text-[10px] py-0.5 px-2";
      case "completed":
        return "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 font-semibold uppercase tracking-wider text-[10px] py-0.5 px-2";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-50 hover:text-rose-700 font-semibold uppercase tracking-wider text-[10px] py-0.5 px-2";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-50 hover:text-gray-700 font-semibold uppercase tracking-wider text-[10px] py-0.5 px-2";
    }
  };

  const handleShiftTypeChange = (type: string) => {
    switch (type) {
      case "morning":
        setNewShift((prev) => ({ ...prev, shiftType: type, startTime: "09:00", endTime: "17:00" }))
        break
      case "evening":
        setNewShift((prev) => ({ ...prev, shiftType: type, startTime: "13:00", endTime: "21:00" }))
        break
      case "night":
        setNewShift((prev) => ({ ...prev, shiftType: type, startTime: "21:00", endTime: "05:00" }))
        break
      case "custom":
        setNewShift((prev) => ({ ...prev, shiftType: type, startTime: "09:00", endTime: "17:00" }))
        break
      default:
        break
    }
  }

  // Add (Assign) Shift
  const handleCreateShift = async () => {
    const result = shiftFormSchema.safeParse({
      employeeId: newShift.employeeId,
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      breakTime: parseFloat(newShift.breakTime) || 0,
    });
    
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setLoading(true)
    try {
      const shift_time = `${newShift.startTime} - ${newShift.endTime}`
      const startDateTime = new Date(`${newShift.date}T${newShift.startTime}:00`).toISOString()
      await apiClient.post("/shift-assignment", {
        employee_id: newShift.employeeId,
        shift_time,
        start_date: startDateTime,
        break_time: `${newShift.breakTime} hour${newShift.breakTime !== "1" ? "s" : ""}`,
      })
      setIsCreateShiftOpen(false)
      setNewShift({
        employee: "",
        employeeId: "",
        date: "",
        shiftType: "morning",
        startTime: "09:00",
        endTime: "17:00",
        breakTime: "1",
      })
      setCreateDate(undefined)
      toast({
        title: "Success",
        description: "Shift scheduled successfully",
      })
      await getAllShifts()
    } catch (error: any) {
      console.log("Error assigning shift:", error)
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to schedule shift. Please try again.";
      toast({
        title: "Error Scheduling Shift",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    if (employee) {
      setNewShift({
        ...newShift,
        employee: employee.name,
        employeeId: employee.id,
      })
    }
  }

  const handleViewShift = (shift: Shift) => {
    setSelectedShift(shift)
    setIsViewShiftOpen(true)
  }

  const handleEditShift = (shift: Shift) => {
    setEditingShift({ ...shift })
    setEditDate(shift.date ? parseToLocalDate(shift.date) : undefined);
    setIsEditShiftOpen(true)
  }

  // Edit Shift
  const handleUpdateShift = async () => {
    if (!editingShift) return;

    const result = shiftFormSchema.safeParse({
      employeeId: editingShift.employeeId,
      date: editingShift.date,
      startTime: editingShift.startTime,
      endTime: editingShift.endTime,
      breakTime: parseFloat(editingShift.breakTime) || 0,
    });
    
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const shift_time = `${editingShift.startTime} - ${editingShift.endTime}`;
      
      let end_date = undefined;
      if (editingShift.status === "completed") {
        end_date = new Date().toISOString();
      } else if (editingShift.status === "scheduled" || editingShift.status === "active") {
        end_date = null;
      }

      await apiClient.patch(`/shift-assignment/${editingShift.id}`, {
        shift_time,
        start_date: editingShift.date,
        end_date,
        sales: editingShift.sales,
        break_time: editingShift.breakTime,
      });
      setIsEditShiftOpen(false);
      setEditingShift(null);
      setEditDate(undefined);
      toast({
        title: "Success",
        description: "Shift updated successfully",
      })
      await getAllShifts();
    } catch (error: any) {
      console.log("Error updating shift:", error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update shift. Please try again.";
      toast({
        title: "Error Updating Shift",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  // End Shift
  const handleEndShift = (shift: Shift) => {
    setSelectedShift(shift)
    setEndShiftSales(shift.sales === 0 ? "" : shift.sales.toString())
    setIsEndShiftOpen(true)
  }

  // End Shift
  const handleConfirmEndShift = async () => {
    if (selectedShift) {
      setLoading(true)
      try {
        await apiClient.patch(`/shift-assignment/end/${selectedShift.employeeId}`, {
          sales: parseFloat(endShiftSales) || 0,
        })
        setIsEndShiftOpen(false);
        setSelectedShift(null);
        setEndShiftSales("")
        toast({
          title: "Success",
          description: "Shift ended successfully",
        })
        await getAllShifts()
      } catch (error: any) {
        console.log("Error ending shift:", error)
        const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to end shift. Please try again.";
        toast({
          title: "Error Ending Shift",
          description: errMsg,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  // Delete Shift Dialog Trigger
  const handleDeleteShift = (shift: Shift) => {
    setShiftToDelete(shift);
    setIsDeleteOpen(true);
  };

  // Confirm Delete Action with Loading
  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;
    setLoading(true);
    try {
      await apiClient.delete(`/shift-assignment/${shiftToDelete.id}`);
      setIsDeleteOpen(false);
      setShiftToDelete(null);
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      })
      await getAllShifts();
    } catch (error: any) {
      console.log("Error deleting shift:", error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || "Failed to delete shift.";
      toast({
        title: "Error (Ghalti)",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  const filterShifts = (status?: string) => {
    let filtered = shifts

    // Filter by status/tab
    if (status) {
      switch (status) {
        case "today":
          const todayStr = getLocalDateString()
          filtered = filtered.filter((shift) => shift.date === todayStr)
          break
        case "week":
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          filtered = filtered.filter((shift) => new Date(shift.date) >= weekAgo)
          break
        case "scheduled":
          filtered = filtered.filter((shift) => shift.status === "scheduled")
          break
        case "completed":
          filtered = filtered.filter((shift) => shift.status === "completed")
          break
      }
    }

    // Filter by employee
    if (employeeFilter !== "all") {
      filtered = filtered.filter((shift) => shift.employeeId === employeeFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (shift) =>
          shift.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shift.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shift.status.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }

  // Calculate statistics
  const today = getLocalDateString()
  const todayShifts = shifts.filter((shift) => shift.date === today)
  const todayHours = todayShifts.reduce((sum, shift) => {
    // Parse start and end times
    const [startHour, startMinute] = shift.startTime.split(":").map(Number);
    const [endHour, endMinute] = shift.endTime.split(":").map(Number);
    let hours = (endHour + endMinute / 60) - (startHour + startMinute / 60);

    // Handle overnight shifts
    if (hours < 0) hours += 24;

    // Subtract break time (parse as float, fallback to 0)
    const breakHours = parseFloat(shift.breakTime) || 0;
    hours = Math.max(0, hours - breakHours);

    return sum + hours;
  }, 0);
  const activeStaffCount = shifts.filter((shift) => shift.status === "active").length;
  const todayLaborCost = todayShifts.reduce((sum, shift) => sum + shift.totalHours * shift.hourlyRate, 0)
  const todaySales = todayShifts.reduce((sum, shift) => sum + shift.sales, 0);

  if (isInitialLoading) {
    return <PageLoader message="Loading shifts..." />
  }

  const ShiftTable = ({ shiftData }: { shiftData: Shift[] }) => (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Shift ID</TableHead>
              <TableHead className="min-w-[150px]">Employee</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[100px]">Start Time</TableHead>
              <TableHead className="min-w-[100px]">End Time</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
      <TableBody>
        {shiftData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-28 text-center text-gray-500 font-medium">
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <Search className="h-8 w-8 text-gray-400 animate-pulse" />
                <p className="text-gray-600 font-semibold">No shifts found matching your search</p>
                <p className="text-sm text-gray-400">No matching shifts — try a different search or filter.</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          shiftData.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell className="font-medium text-gray-800">{shift.id}</TableCell>
              <TableCell className="font-semibold text-gray-900">{shift.employee}</TableCell>
              <TableCell className="text-gray-600">{shift.date}</TableCell>
              <TableCell className="font-medium text-gray-800">{formatTimeTo12Hour(shift.startTime)}</TableCell>
              <TableCell className="font-medium text-gray-800">{formatTimeTo12Hour(shift.endTime)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(shift.status)}>{shift.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleViewShift(shift)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditShift(shift)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {shift.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => handleEndShift(shift)}>
                      <StopCircle className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteShift(shift)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 hover:border-red-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Shift Management</h1>
          <p className="text-sm md:text-base text-gray-600">Manage employee shifts and time tracking</p>
        </div>

        {/* Create Shift Dialog */}
        <Dialog 
          open={isCreateShiftOpen} 
          onOpenChange={(open) => {
            setIsCreateShiftOpen(open);
            if (open) {
              setNewShift({
                employee: "",
                employeeId: "",
                date: "",
                shiftType: "morning",
                startTime: "09:00",
                endTime: "17:00",
                breakTime: "1",
              });
              setCreateDate(new Date()); // default to current date when opened
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Schedule New Shift</DialogTitle>
              <DialogDescription>Create a new shift for an employee</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={newShift.employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger className="w-full bg-white border-gray-300">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} (Rs {emp.hourlyRate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal bg-white border-gray-300", !createDate && "text-muted-foreground")}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createDate ? format(createDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={createDate}
                      onSelect={(d) => setCreateDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Shift Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "morning", name: "Morning", time: "9AM - 5PM", icon: Sun, color: "text-amber-500 bg-amber-50 border-amber-200" },
                    { id: "evening", name: "Evening", time: "1PM - 9PM", icon: Sunset, color: "text-orange-500 bg-orange-50 border-orange-200" },
                    { id: "night", name: "Night", time: "9PM - 5AM", icon: Moon, color: "text-indigo-500 bg-indigo-50 border-indigo-200" },
                    { id: "custom", name: "Custom", time: "Flexible", icon: Clock, color: "text-gray-500 bg-gray-50 border-gray-200" }
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = newShift.shiftType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleShiftTypeChange(type.id)}
                        className={cn(
                          "flex flex-col items-start p-3 border rounded-xl text-left transition-all duration-200 hover:shadow-sm focus:outline-none w-full",
                          isSelected 
                            ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-500" 
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <div className={cn("p-1 rounded-lg mb-1 border", type.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-xs text-gray-900">{type.name}</span>
                        <span className="text-[10px] text-gray-500">{type.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <TimePicker
                    value={newShift.startTime}
                    onChange={(val) => setNewShift({ ...newShift, startTime: val })}
                    disabled={loading || newShift.shiftType !== "custom"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <TimePicker
                    value={newShift.endTime}
                    onChange={(val) => setNewShift({ ...newShift, endTime: val })}
                    disabled={loading || newShift.shiftType !== "custom"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label htmlFor="break-time">Break (hours)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newShift.breakTime}
                    onChange={(e) => setNewShift({ ...newShift, breakTime: e.target.value })}
                    placeholder="1"
                    disabled={loading}
                    className="bg-white border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {newShift.startTime && newShift.endTime && (
                  <div className="pt-6 text-sm font-semibold text-gray-700">
                    Total Hours:{" "}
                    <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md ml-1 border border-blue-100">
                      {calculateHours(
                        newShift.startTime,
                        newShift.endTime,
                        Number.parseFloat(newShift.breakTime) || 0,
                      ).toFixed(1)}h
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateShift} disabled={loading}>
                {loading ? (
                  <>
                    Scheduling...
                    <Loader2 className="animate-spin w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Schedule Shift"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeStaffCount}</div>
            <p className="text-xs text-gray-500">Currently working now</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{todayHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Total shift hours today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Today's Expense</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Rs {todayLaborCost.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Estimated salary cost</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Rs {todaySales.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Sales from active/done shifts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex flex-wrap md:inline-flex gap-1 border border-gray-200">
          <TabsTrigger value="today" className="rounded-lg py-2.5 px-4 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Today</span>
          </TabsTrigger>
          <TabsTrigger value="week" className="rounded-lg py-2.5 px-4 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <span>This Week</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="rounded-lg py-2.5 px-4 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg py-2.5 px-4 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Employee name, Shift ID or Status..."
              className="pl-10 h-10 rounded-lg border-gray-200 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-48 h-10 rounded-lg border-gray-200">
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm !== "" || employeeFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setEmployeeFilter("all");
                }}
                className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-3 rounded-lg border border-red-100 transition-colors"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Today's Shifts</CardTitle>
              <CardDescription>Current and scheduled shifts for today</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading shifts...</p>
                </div>
              ) : (
                <ShiftTable shiftData={filterShifts("today")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>This Week's Shifts</CardTitle>
              <CardDescription>All shifts from the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading shifts...</p>
                </div>
              ) : (
                <ShiftTable shiftData={filterShifts("week")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Shifts</CardTitle>
              <CardDescription>Upcoming scheduled shifts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading shifts...</p>
                </div>
              ) : (
                <ShiftTable shiftData={filterShifts("scheduled")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Shifts</CardTitle>
              <CardDescription>All completed shifts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading shifts...</p>
                </div>
              ) : (
                <ShiftTable shiftData={filterShifts("completed")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Shift Dialog */}
      <Dialog open={isViewShiftOpen} onOpenChange={setIsViewShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>
          {selectedShift && (() => {
            const viewBreakHours = parseFloat(selectedShift.breakTime) || 0;
            const viewTotalHours = calculateHours(selectedShift.startTime, selectedShift.endTime, viewBreakHours);
            const viewLaborCost = viewTotalHours * (selectedShift.hourlyRate || 15);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shift ID</Label>
                    <p className="text-base font-semibold truncate select-all text-gray-800" title={selectedShift.id}>
                      {selectedShift.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employee</Label>
                    <p className="text-lg font-semibold">{selectedShift.employee}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date</Label>
                    <p className="text-base">{selectedShift.date}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div>
                      <Badge className={getStatusColor(selectedShift.status)}>{selectedShift.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Start Time</Label>
                    <p className="text-lg font-semibold">{formatTimeTo12Hour(selectedShift.startTime)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">End Time</Label>
                    <p className="text-lg font-semibold">{formatTimeTo12Hour(selectedShift.endTime)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Break Time</Label>
                    <p className="text-base">{selectedShift.breakTime}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Hours</Label>
                    <p className="text-lg font-semibold text-blue-600">{viewTotalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Sales</Label>
                    <p className="text-lg font-semibold">Rs {selectedShift.sales.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Labor Cost</Label>
                    <p className="text-lg font-semibold text-green-600">
                      Rs {viewLaborCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setIsViewShiftOpen(false)} disabled={loading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog 
        open={isEditShiftOpen} 
        onOpenChange={(open) => {
          setIsEditShiftOpen(open);
          if (!open) {
            setEditingShift(null);
            setEditDate(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          {editingShift && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal bg-white border-gray-300", !editDate && "text-muted-foreground")}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={(d) => setEditDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <TimePicker
                    value={editingShift.startTime}
                    onChange={(val) => setEditingShift({ ...editingShift, startTime: val })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <TimePicker
                    value={editingShift.endTime}
                    onChange={(val) => setEditingShift({ ...editingShift, endTime: val })}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Break Time (hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={editingShift.breakTime ? editingShift.breakTime.split(" ")[0] : "1"}
                  onChange={(e) =>
                    setEditingShift({
                      ...editingShift,
                      breakTime: `${e.target.value} hour${e.target.value !== "1" ? "s" : ""}`,
                    })
                  }
                  disabled={loading}
                  className="bg-white border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingShift.status}
                  onValueChange={(value: Shift["status"]) => setEditingShift({ ...editingShift, status: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingShift.status === "completed" && (
                <div className="space-y-2">
                  <Label>Sales Amount (Rs)</Label>
                  <Input
                    type="number"
                    value={editingShift.sales === 0 ? "" : editingShift.sales}
                    onChange={(e) =>
                      setEditingShift({
                        ...editingShift,
                        sales: e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0),
                      })
                    }
                    disabled={loading}
                    className="bg-white border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Enter sales amount"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsEditShiftOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShift} disabled={loading}>
              {loading ? (
                <>
                  Updating...
                  <Loader2 className="animate-spin w-4 h-4 ml-2" />
                </>
              ) : (
                "Update Shift"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Shift Dialog */}
      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Shift</DialogTitle>
            <DialogDescription>Complete the shift and record final sales</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Employee</Label>
              <p className="text-lg font-semibold">{selectedShift?.employee}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Shift Duration</Label>
              <p>
                {selectedShift?.startTime} - {selectedShift?.endTime} ({selectedShift?.totalHours}h)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-sales">Final Sales Amount (Rs)</Label>
              <Input
                id="final-sales"
                type="number"
                value={endShiftSales}
                onChange={(e) => setEndShiftSales(e.target.value)}
                placeholder="Enter total sales"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEndShiftOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEndShift} disabled={loading}>
              {loading ? (
                <>
                  Ending...
                  <Loader2 className="animate-spin w-4 h-4 ml-2" />
                </>
              ) : (
                "End Shift"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border border-red-100 shadow-lg">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100 animate-bounce">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Delete Shift Assignment?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Are you sure you want to delete this employee's shift? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {shiftToDelete && (
            <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-4 my-2 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Employee (Staff):</span>
                <span className="text-gray-900 font-bold">{shiftToDelete.employee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Shift Date (Tareekh):</span>
                <span className="text-gray-900 font-semibold">{shiftToDelete.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Shift Time (Waqt):</span>
                <span className="text-gray-900 font-semibold">
                  {formatTimeTo12Hour(shiftToDelete.startTime)} - {formatTimeTo12Hour(shiftToDelete.endTime)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Shift ID:</span>
                <span className="text-gray-400 font-mono text-xs">{shiftToDelete.id}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={loading}
              className="flex-1 h-11 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel (Wapas)
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  Deleting...
                  <Loader2 className="animate-spin h-4 w-4" />
                </>
              ) : (
                "Delete Shift"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}