"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  CreditCard,
  Clock,
  User,
  Calculator,
  Receipt,
  AlertCircle,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageLoader } from "./ui/page-loader";

interface Transaction {
  id: string;
  time: string;
  amount: number;
  type: "Cash" | "Card";
  customer: string;
  action?: "add" | "remove" | "sale";
  reason?: string;
}

interface CashDrawerState {
  id: string;
  openingAmount: number;
  currentAmount: number;
  totalSales: number;
  transactions: number;
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
}

export function CashRegister() {
  const { toast } = useToast();

  const [cashDrawer, setCashDrawer] = useState<CashDrawerState | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [todayDrawerExists, setTodayDrawerExists] = useState(false);

  // Loading states for buttons
  const [openDrawerLoading, setOpenDrawerLoading] = useState(false);
  const [closeDrawerLoading, setCloseDrawerLoading] = useState(false);
  const [addCashLoading, setAddCashLoading] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);

  // Date filter state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const [isOpenDrawerDialogOpen, setIsOpenDrawerDialogOpen] = useState(false);
  const [isCloseDrawerDialogOpen, setIsCloseDrawerDialogOpen] = useState(false);
  const [isAddCashDialogOpen, setIsAddCashDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [openingAmount, setOpeningAmount] = useState("");

  // API Endpoints
  async function openDrawer(opening: number, sales: number = 0) {
    try {
      const response = await apiClient.post("/cashflows/opening", {
        opening,
        sales,
      });
      return response;
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already been opened today")
      ) {
        throw new Error(
          "A drawer has already been opened today. Only one drawer per day is allowed. Please wait until tomorrow."
        );
      }
      throw error;
    }
  }

  async function addExpense(particular: string, amount: number) {
    try {
      const response = await apiClient.post("/cashflows/expense", {
        particular,
        amount,
      });
      return response;
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("No open drawer")
      ) {
        throw new Error("No open drawer found. Please open a drawer first.");
      }
      throw error;
    }
  }

  async function closeDrawer(cashflow_id: string, closing: number) {
    try {
      const response = await apiClient.post("/cashflows/closing", {
        cashflow_id,
        closing,
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async function getDrawerByDate(date: Date) {
    try {
      // Use local timezone formatting instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      console.log("getDrawerByDate - sending date:", dateString); // Debug log
      console.log("getDrawerByDate - original date object:", date); // Debug log
      console.log("getDrawerByDate - local date string:", dateString); // Debug log
      const response = await apiClient.get(
        `/cashflows/by-date?date=${dateString}`
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async function getExpensesByDate(date: Date) {
    try {
      // Use local timezone formatting instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await apiClient.get(
        `/cashflows/expenses?date=${dateString}`
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // Helper function to check if there's already a drawer for today
  const checkTodayDrawer = async () => {
    const today = new Date();
    try {
      const todayDrawerRes = await getDrawerByDate(today);
      if (todayDrawerRes.data.success && todayDrawerRes.data.data?.exists) {
        setTodayDrawerExists(true);
        return todayDrawerRes.data.data.data;
      }
      setTodayDrawerExists(false);
      return null;
    } catch (error) {
      console.log("Error checking today drawer:", error);
      setTodayDrawerExists(false);
      return null;
    }
  };

  // Debug function to test API integration
  const debugAPI = async () => {
    if (debugLoading) return; // Prevent multiple calls

    setDebugLoading(true);
    try {
      console.log("Testing API integration...");

      // Test debug endpoint
      console.log("Testing debug endpoint...");
      const debugRes = await apiClient.get("/cashflows/debug");
      console.log("Debug response:", debugRes.data);

      // Test getDrawerByDate
      console.log("Testing getDrawerByDate...");
      const drawerRes = await getDrawerByDate(selectedDate);
      console.log("Drawer response:", drawerRes.data);

      // Test getExpensesByDate
      console.log("Testing getExpensesByDate...");
      const expensesRes = await getExpensesByDate(selectedDate);
      console.log("Expenses response:", expensesRes.data);

      // Debug current state
      console.log("Current cashDrawer state:", cashDrawer);
      console.log("Is drawer open?", cashDrawer?.isOpen);

      toast({
        title: "API Test Complete",
        description: "Check console for API response details",
      });
    } catch (error: any) {
      console.log("API Test Error:", error);
      toast({
        title: "API Test Failed",
        description: error.message || "Check console for details",
        variant: "destructive",
      });
    } finally {
      setDebugLoading(false);
    }
  };

  // Test function to create a test cashflow
  const testCreateCashflow = async () => {
    if (debugLoading) return;

    setDebugLoading(true);
    try {
      console.log("Creating test cashflow...");
      const response = await apiClient.get("/cashflows/test-create");
      console.log("Test create response:", response.data);

      toast({
        title: "Test Cashflow Created",
        description:
          "A test cashflow has been created. Check console for details.",
      });

      // Refresh the data
      await fetchDrawerAndExpenses();
    } catch (error: any) {
      console.log("Test Create Error:", error);
      toast({
        title: "Test Create Failed",
        description: error.message || "Check console for details",
        variant: "destructive",
      });
    } finally {
      setDebugLoading(false);
    }
  };

  // Fetch drawer and expenses
  const fetchDrawerAndExpenses = async (date?: Date) => {
    const targetDate = date || selectedDate;
    setLoading(true);
    try {
      const drawerRes = await getDrawerByDate(targetDate);
      console.log("Drawer response:", drawerRes.data); // Debug log

      // Handle the response structure correctly
      if (drawerRes.data.success && drawerRes.data.data) {
        const result = drawerRes.data.data;
        console.log("Result from API:", result); // Debug log

        if (result.exists && result.data) {
          const cashFlowData = result.data;
          console.log("CashFlow data:", cashFlowData); // Debug log
          console.log("Status from API:", cashFlowData.status); // Debug log
          console.log("Status comparison:", cashFlowData.status === "OPEN"); // Debug log

          const drawerState = {
            id: cashFlowData.id,
            openingAmount: Number(cashFlowData.opening),
            currentAmount: cashFlowData.closing
              ? Number(cashFlowData.closing)
              : Number(cashFlowData.opening),
            totalSales: Number(cashFlowData.sales),
            transactions: cashFlowData.expenses?.length || 0,
            isOpen: cashFlowData.status === "OPEN",
            openedAt: cashFlowData.opened_at,
            closedAt: cashFlowData.closed_at,
          };
          console.log("Setting cash drawer state:", drawerState); // Debug log
          console.log("isOpen will be set to:", drawerState.isOpen); // Debug log
          setCashDrawer(drawerState);

          // Use expenses from the drawer response - these are already filtered by date
          if (cashFlowData.expenses) {
            console.log(
              "Using expenses from drawer response:",
              cashFlowData.expenses.length
            ); // Debug log
            setRecentTransactions(
              cashFlowData.expenses.map((exp: any) => ({
                id: exp.id,
                time: new Date(exp.created_at).toLocaleTimeString(),
                amount: Number(exp.amount),
                type: "Cash" as const,
                customer: "System",
                action: "add" as const,
                reason: exp.particular,
              }))
            );
          } else {
            setRecentTransactions([]);
          }
        } else {
          console.log("No drawer exists, setting to null"); // Debug log
          setCashDrawer(null);
          setRecentTransactions([]);
        }
      } else {
        console.log("No success or no data in response"); // Debug log
        setCashDrawer(null);
        setRecentTransactions([]);
      }

      // Check if the selected date is today and update todayDrawerExists accordingly
      const today = new Date();
      const isToday = targetDate.toDateString() === today.toDateString();
      if (isToday) {
        await checkTodayDrawer();
      } else {
        setTodayDrawerExists(false);
      }
    } catch (err: any) {
      console.log("Error fetching drawer data:", err);
      setCashDrawer(null);
      setRecentTransactions([]);

      // Show error toast for specific errors
      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("Branch not found")
      ) {
        toast({
          title: "Authentication Error",
          description: "Please log in again. Branch information is missing.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawerAndExpenses();
    // eslint-disable-next-line
  }, []);

  // Check for today's drawer status on component mount
  useEffect(() => {
    const checkTodayStatus = async () => {
      console.log("Current date:", new Date().toDateString());
      console.log("Selected date:", selectedDate.toDateString());
      console.log(
        "Is today?",
        new Date().toDateString() === selectedDate.toDateString()
      );

      const todayDrawer = await checkTodayDrawer();
      if (todayDrawer && todayDrawer.status === "CLOSED") {
        toast({
          title: "Today's Drawer Closed",
          description:
            "Today's drawer has been closed. You can view historical data or wait until tomorrow to open a new drawer.",
          variant: "default",
        });
      }
    };

    checkTodayStatus();
  }, []);

  // Debug effect to log cashDrawer changes
  useEffect(() => {
    console.log("CashDrawer state changed:", cashDrawer);
    console.log("Is drawer open?", cashDrawer?.isOpen);
  }, [cashDrawer]);

  // UI logic
  const totalCashInDrawer = cashDrawer?.currentAmount || 0;

  // Handlers
  const handleOpenDrawer = async () => {
    if (openDrawerLoading) return; // Prevent multiple calls

    if (!openingAmount || Number.parseFloat(openingAmount) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid opening amount.",
        variant: "destructive",
      });
      return;
    }

    // Check if drawer is already open for today
    const todayDrawer = await checkTodayDrawer();

    if (todayDrawer) {
      if (todayDrawer.status === "OPEN") {
        toast({
          title: "Drawer Already Open",
          description:
            "A drawer is already open for today. Please close it before opening a new one.",
          variant: "destructive",
        });
        setIsOpenDrawerDialogOpen(false);
        setOpeningAmount("");
        return;
      } else if (todayDrawer.status === "CLOSED") {
        toast({
          title: "Drawer Already Exists",
          description:
            "A drawer has already been opened and closed today. Only one drawer per day is allowed. Please wait until tomorrow.",
          variant: "destructive",
        });
        setIsOpenDrawerDialogOpen(false);
        setOpeningAmount("");
        return;
      }
    }

    setOpenDrawerLoading(true);
    try {
      const openingValue = Number.parseFloat(openingAmount);
      console.log("Opening drawer with amount:", openingValue); // Debug log
      const response = await openDrawer(openingValue, 0);
      console.log("Open drawer response:", response); // Debug log

      toast({
        title: "Cash Drawer Opened",
        description: `Drawer opened with Rs ${openingValue.toFixed(
          2
        )} opening amount.`,
      });
      setIsOpenDrawerDialogOpen(false);
      setOpeningAmount("");
      await fetchDrawerAndExpenses();
    } catch (err: any) {
      console.log("Error opening drawer:", err); // Debug log
      toast({
        title: "Error",
        description:
          err.message || err.response?.data?.message || "Failed to open drawer",
        variant: "destructive",
      });
    } finally {
      setOpenDrawerLoading(false);
    }
  };

  const handleCloseDrawer = async () => {
    if (closeDrawerLoading) return; // Prevent multiple calls
    if (!cashDrawer) return;

    setCloseDrawerLoading(true);
    try {
      await closeDrawer(cashDrawer.id, totalCashInDrawer);
      toast({
        title: "Cash Drawer Closed",
        description: `Drawer closed successfully.`,
      });
      setIsCloseDrawerDialogOpen(false);
      await fetchDrawerAndExpenses();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message ||
          err.response?.data?.message ||
          "Failed to close drawer",
        variant: "destructive",
      });
    } finally {
      setCloseDrawerLoading(false);
    }
  };

  const handleAddCash = async () => {
    if (addCashLoading) return; // Prevent multiple calls

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for adding cash.",
        variant: "destructive",
      });
      return;
    }

    setAddCashLoading(true);
    try {
      await addExpense(reason, Number.parseFloat(amount));
      toast({
        title: "Cash Added",
        description: `Rs ${Number.parseFloat(amount).toFixed(
          2
        )} added to drawer. Reason: ${reason}`,
      });
      setIsAddCashDialogOpen(false);
      setAmount("");
      setReason("");
      await fetchDrawerAndExpenses();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message || err.response?.data?.message || "Failed to add cash",
        variant: "destructive",
      });
    } finally {
      setAddCashLoading(false);
    }
  };

  // Handle date filter change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      fetchDrawerAndExpenses(date);
    }
  };

  // Reset to today's date
  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    fetchDrawerAndExpenses(today);
  };

  // UI rendering
  if (loading) {
    return <PageLoader message="Loading Cash Register..." />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Cash Drawer Management</h2>
          <p className="text-gray-600">
            Open, manage and close cash drawer for daily operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="date-filter" className="text-sm font-medium">
              Date:
            </Label>
            <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="text-xs"
            >
              Today
            </Button>
          </div>
          <Badge
            variant="outline"
            className={`${
              cashDrawer?.isOpen
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {cashDrawer?.isOpen ? "Drawer Open" : "Drawer Closed"}
          </Badge>
        </div>
      </div>

      {/* Cash Drawer Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Opening Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {cashDrawer?.openingAmount.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs {cashDrawer?.currentAmount.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {cashDrawer?.totalSales.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashDrawer?.transactions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Drawer Management */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Drawer Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setIsOpenDrawerDialogOpen(true)}
                disabled={
                  !!cashDrawer?.isOpen || openDrawerLoading || todayDrawerExists
                }
              >
                {openDrawerLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                {openDrawerLoading ? "Opening..." : "Open Drawer"}
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setIsAddCashDialogOpen(true)}
                disabled={!cashDrawer?.isOpen || addCashLoading}
              >
                {addCashLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                {addCashLoading ? "Adding..." : "Add Cash"}
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setIsCloseDrawerDialogOpen(true)}
                disabled={!cashDrawer?.isOpen || closeDrawerLoading}
              >
                {closeDrawerLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4 mr-2" />
                )}
                {closeDrawerLoading ? "Closing..." : "Close Drawer"}
              </Button>
            </div>
            {todayDrawerExists && !cashDrawer?.isOpen && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Today's drawer has already been opened and closed. Only one
                    drawer per day is allowed.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No transactions yet
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.action === "add"
                          ? "bg-green-100"
                          : transaction.action === "remove"
                          ? "bg-red-100"
                          : transaction.type === "Cash"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {transaction.type === "Cash" ? (
                        <DollarSign
                          className={`h-4 w-4 ${
                            transaction.action === "add"
                              ? "text-green-600"
                              : transaction.action === "remove"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        />
                      ) : (
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.id}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.customer} • {transaction.time}
                        {transaction.reason && ` • ${transaction.reason}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-medium ${
                        transaction.action === "remove"
                          ? "text-red-600"
                          : transaction.action === "add"
                          ? "text-green-600"
                          : ""
                      }`}
                    >
                      {transaction.action === "remove" ? "-" : ""}
                      Rs {transaction.amount.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {transaction.action
                        ? transaction.action === "add"
                          ? "Add"
                          : transaction.action === "remove"
                          ? "Remove"
                          : transaction.type
                        : transaction.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog
        open={isOpenDrawerDialogOpen}
        onOpenChange={setIsOpenDrawerDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Cash Drawer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter the opening amount for the cash drawer to start a new shift.
            </p>
            <div>
              <Label htmlFor="opening-amount">Opening Amount</Label>
              <Input
                id="opening-amount"
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="200.00"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleOpenDrawer}
                disabled={openDrawerLoading}
                className="flex-1"
              >
                {openDrawerLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {openDrawerLoading ? "Opening..." : "Open Drawer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpenDrawerDialogOpen(false)}
                disabled={openDrawerLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCashDialogOpen} onOpenChange={setIsAddCashDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cash to Drawer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-amount">Amount</Label>
              <Input
                id="add-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="add-reason">Reason (Required)</Label>
              <Input
                id="add-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Change fund, Till adjustment"
              />
            </div>
            <Button
              onClick={handleAddCash}
              disabled={addCashLoading}
              className="w-full"
            >
              {addCashLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {addCashLoading ? "Adding..." : "Add Cash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCloseDrawerDialogOpen}
        onOpenChange={setIsCloseDrawerDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Cash Drawer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This will close the cash drawer and generate an end-of-day report.
              Make sure all transactions are complete.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Opening Amount:</span>
                <span>Rs {cashDrawer?.openingAmount.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sales:</span>
                <span>Rs {cashDrawer?.totalSales.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Amount:</span>
                <span>Rs {cashDrawer?.currentAmount.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span>Actual Count:</span>
                <span>Rs {totalCashInDrawer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Transactions:</span>
                <span>{cashDrawer?.transactions || 0}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleCloseDrawer}
                disabled={closeDrawerLoading}
                className="flex-1"
              >
                {closeDrawerLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {closeDrawerLoading ? "Closing..." : "Close Drawer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCloseDrawerDialogOpen(false)}
                disabled={closeDrawerLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
