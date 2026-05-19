"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Eye, RefreshCcw, Search, ShoppingBag, DollarSign, Clock } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";

interface Customer { id: string; email: string; name: string | null; }
interface Product { id: string; name: string; }
interface OrderItem { productId: string; quantity: number; product: { name: string }; }
interface Order { id: string; order_number: string; total_amount: string; status: string; created_at: string; items: OrderItem[]; }

const Orders: React.FC = () => {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [orderForm, setOrderForm] = useState<{
    customerId: string;
    paymentMethod: string;
    items: OrderItem[];
  }>({ customerId: "", paymentMethod: "CASH", items: [{ productId: "", quantity: 1, product: { name: "" } }] });

  useEffect(() => {
    fetchMetadata();
    fetchOrders();
  }, []);

  const fetchMetadata = async () => {
    setIsInitialLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        apiClient.get(`${API_BASE}/customer`),
        apiClient.get(`${API_BASE}/products?fetch_all=true`),
      ]);
      setCustomers(cRes.data.data);
      setProducts(pRes.data.data);
      toast({
        title: "Success",
        description: "Orders data loaded successfully",
      });
    } catch (err: any) {
      console.log("Metadata load failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to load orders data";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await apiClient.get(`${API_BASE}/order`, { params });
      setOrders(res.data.data.data);
      toast({
        title: "Success",
        description: "Orders loaded successfully",
      });
    } catch (err: any) {
      console.log("Orders load failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to load orders";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`${API_BASE}/order`, orderForm);
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      setIsAddOpen(false);
      resetForm();
      fetchOrders();
    } catch (err: any) {
      console.log("Order creation failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to create order";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderForm({ customerId: "", paymentMethod: "CASH", items: [{ productId: "", quantity: 1, product: { name: "" } }] });
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiClient.delete(`${API_BASE}/order/${orderId}`);
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
      fetchOrders();
    } catch (err: any) {
      console.log("Cancel failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to cancel order";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`${API_BASE}/order/${orderId}/status`, { status: newStatus });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders();
    } catch (err: any) {
      console.log("Status update failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to update order status";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const viewOrderDetail = async (orderId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setSelectedOrder(null);

    try {
      const res = await apiClient.get(`${API_BASE}/order/${orderId}`);
      setSelectedOrder(res.data.data);
    } catch (err: any) {
      console.log("Fetch detail failed", err);
      
      // Extract error message from API response
      let errorMessage = "Failed to load order details";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const addItemRow = () => setOrderForm(f => ({ ...f, items: [...f.items, { productId: "", quantity: 1, product: { name: "" } }] }));
  const removeItemRow = (idx: number) => setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const filtered = orders
    .filter(o => o.order_number.toLowerCase().includes(searchTerm.toLowerCase()));

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const pendingOrders = orders.filter(order => order.status === 'PENDING').length;

  if (isInitialLoading) {
    return <PageLoader message="Loading orders data..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm md:text-base text-gray-600">Create & manage customer orders</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Select
                  value={orderForm.customerId || "none"}
                  onValueChange={(value) => setOrderForm({ ...orderForm, customerId: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={orderForm.paymentMethod}
                  onValueChange={(value) => setOrderForm({ ...orderForm, paymentMethod: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["CASH", "CARD", "MOBILE_MONEY"].map((pm) => (
                      <SelectItem key={pm} value={pm}>
                        {pm.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {orderForm.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <Label>Product</Label>
                    <Select
                      value={item.productId || "none"}
                      onValueChange={(value) => {
                        const pid = value === "none" ? "" : value;
                        setOrderForm((f) => {
                          const items = [...f.items];
                          items[idx].productId = pid;
                          return { ...f, items };
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select product</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      value={item.quantity} 
                      onChange={e => {
                        const q=Number(e.target.value);
                        setOrderForm(f=>{
                          const items=[...f.items];
                          items[idx].quantity=q;
                          return{...f,items};
                        });
                      }}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={()=>removeItemRow(idx)}
                    disabled={orderForm.items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="link" onClick={addItemRow}>+ Add item</Button>
              <Button 
                onClick={handleCreateOrder} 
                disabled={isSubmitting || !orderForm.customerId || orderForm.items.some(item => !item.productId || item.quantity <= 0)}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating Order...
                  </>
                ) : (
                  "Submit Order"
                )}
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
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Rs {(Number(totalRevenue) || 0).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search Order #"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) => {
              const next = value === "ALL" ? "" : value;
              setStatusFilter(next);
              fetchOrders();
            }}
          >
            <SelectTrigger id="status-filter" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader message="Loading orders..." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Order #</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filtered.map(o=> (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.order_number}</TableCell>
                    <TableCell className="font-medium">Rs {(Number(o.total_amount) || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(value) => handleStatusUpdate(o.id, value)}>
                        <SelectTrigger className="h-8 w-[145px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{o.created_at.split('T')[0]}</TableCell>
                    <TableCell className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={()=>viewOrderDetail(o.id)}
                      >
                        <Eye className="w-4 h-4"/>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={()=>handleCancelOrder(o.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </Button>
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open)=> {
        setIsDetailOpen(open);
        if (!open) {
          setSelectedOrder(null);
          setIsDetailLoading(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="py-8">
              <PageLoader message="Loading order details..." />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order #</Label>
                  <p className="text-sm">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm">{selectedOrder.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{selectedOrder.created_at.split('T')[0]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total</Label>
                  <p className="text-sm font-medium">Rs {(Number(selectedOrder.total_amount) || 0).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map(item=>(
                      <TableRow key={item.productId}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6">Order details not available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
