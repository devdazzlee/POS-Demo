"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Eye, Edit, Send, FileText, Trash2, Package, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/apiClient"
import { API_BASE } from "@/config/constants"
import { usePosData } from "@/hooks/use-pos-data"
import { PageLoader } from "@/components/ui/page-loader"
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton"

interface Product {
  id: string
  name: string
  sku?: string
  purchase_rate?: number
}

interface PurchaseOrderItem {
  id: string
  product: string
  quantity: number
  unitPrice: number
  total: number
}

interface PurchaseOrder {
  id: string
  supplier: string
  supplierContact: string
  date: string
  expectedDelivery: string
  status: "draft" | "pending" | "sent" | "confirmed" | "received" | "cancelled"
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  total: number
  notes: string
  createdBy: string
}

interface NewPurchaseOrder {
  supplier: string
  expectedDelivery: string
  notes: string
}

interface NewItem {
  product: string
  quantity: string
  unitPrice: string
}

export function PurchaseOrders() {
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  // Global store data
  const { 
    products: globalProducts, 
    isAnyLoading: globalLoading,
  } = usePosData()

  // Product state for searchable dropdown
  const [productPage, setProductPage] = useState(1)
  const [productSearch, setProductSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      id: "PO-001",
      supplier: "ABC Electronics",
      supplierContact: "contact@abcelectronics.com",
      date: "2024-01-15",
      expectedDelivery: "2024-01-25",
      status: "pending",
      items: [
        {
          id: "ITEM-001",
          product: "iPhone 15 Pro",
          quantity: 10,
          unitPrice: 120000,
          total: 1200000,
        },
        {
          id: "ITEM-002",
          product: "AirPods Pro",
          quantity: 20,
          unitPrice: 25000,
          total: 500000,
        },
      ],
      subtotal: 1700000,
      tax: 306000,
      total: 2006000,
      notes: "Urgent delivery required",
      createdBy: "Admin",
    },
    {
      id: "PO-002",
      supplier: "XYZ Supplies",
      supplierContact: "orders@xyzsupplies.com",
      date: "2024-01-14",
      expectedDelivery: "2024-01-20",
      status: "sent",
      items: [
        {
          id: "ITEM-003",
          product: "Samsung Galaxy S24",
          quantity: 15,
          unitPrice: 80000,
          total: 1200000,
        },
      ],
      subtotal: 1200000,
      tax: 216000,
      total: 1416000,
      notes: "Standard delivery terms",
      createdBy: "Manager",
    },
    {
      id: "PO-003",
      supplier: "Tech Distributors",
      supplierContact: "sales@techdist.com",
      date: "2024-01-13",
      expectedDelivery: "2024-01-18",
      status: "received",
      items: [
        {
          id: "ITEM-004",
          product: "MacBook Pro",
          quantity: 5,
          unitPrice: 200000,
          total: 1000000,
        },
        {
          id: "ITEM-005",
          product: "iPad Pro",
          quantity: 8,
          unitPrice: 85000,
          total: 680000,
        },
      ],
      subtotal: 1680000,
      tax: 302400,
      total: 1982400,
      notes: "All items received in good condition",
      createdBy: "Admin",
    },
    {
      id: "PO-004",
      supplier: "Mobile World",
      supplierContact: "procurement@mobileworld.com",
      date: "2024-01-12",
      expectedDelivery: "2024-01-22",
      status: "draft",
      items: [
        {
          id: "ITEM-006",
          product: "OnePlus 12",
          quantity: 12,
          unitPrice: 65000,
          total: 780000,
        },
      ],
      subtotal: 780000,
      tax: 140400,
      total: 920400,
      notes: "Draft order - pending approval",
      createdBy: "Staff",
    },
  ])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newOrder, setNewOrder] = useState<NewPurchaseOrder>({
    supplier: "",
    expectedDelivery: "",
    notes: "",
  })

  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([])
  const [newItem, setNewItem] = useState<NewItem>({
    product: "",
    quantity: "",
    unitPrice: "",
  })

  const suppliers = [
    { value: "ABC Electronics", label: "ABC Electronics", contact: "contact@abcelectronics.com" },
    { value: "XYZ Supplies", label: "XYZ Supplies", contact: "orders@xyzsupplies.com" },
    { value: "Tech Distributors", label: "Tech Distributors", contact: "sales@techdist.com" },
    { value: "Mobile World", label: "Mobile World", contact: "procurement@mobileworld.com" },
    { value: "Gadget Hub", label: "Gadget Hub", contact: "orders@gadgethub.com" },
  ]

  // Fetch products with search and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const params: any = {
          fetch_all: true,
          is_active: true,
        }
        
        if (productSearch) {
          params.search = productSearch
        }

        const response = await apiClient.get(`${API_BASE}/products`, { params })
        const data = response.data.data || response.data
        
        setProducts(data.products || data)
        setTotalProducts(data.meta?.total || (data.products || data).length)
        setIsInitialLoading(false)
      } catch (e: any) {
        console.log(e)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [productSearch])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "received":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) => item.product.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [orders, searchTerm])

  const getFilteredOrdersByStatus = (status: string) => {
    if (status === "all") return filteredOrders
    return filteredOrders.filter((order) => order.status === status)
  }

  // Calculate stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0)
  const receivedOrders = orders.filter((o) => o.status === "received").length

  if (isInitialLoading) {
    return <PageLoader message="Loading purchase orders..." />
  }

  const generateOrderId = () => {
    const nextId = orders.length + 1
    return `PO-${nextId.toString().padStart(3, "0")}`
  }

  const generateItemId = () => {
    const allItems = orders.flatMap((o) => o.items)
    const nextId = allItems.length + orderItems.length + 1
    return `ITEM-${nextId.toString().padStart(3, "0")}`
  }

  const calculateTotals = (items: PurchaseOrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.18 // 18% GST
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const loadMoreProducts = () => {
    setProductPage(prev => prev + 1)
  }

  const handleProductSearch = (search: string) => {
    setProductSearch(search)
    setProductPage(1)
    setProducts([])
  }

  const handleAddItem = () => {
    if (!newItem.product || !newItem.quantity || !newItem.unitPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all item fields.",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(newItem.quantity)
    const unitPrice = Number.parseFloat(newItem.unitPrice)

    if (quantity <= 0 || unitPrice <= 0) {
      toast({
        title: "Invalid Values",
        description: "Quantity and unit price must be greater than 0.",
        variant: "destructive",
      })
      return
    }

    const item: PurchaseOrderItem = {
      id: generateItemId(),
      product: newItem.product,
      quantity: quantity,
      unitPrice: unitPrice,
      total: quantity * unitPrice,
    }

    setOrderItems((prev) => [...prev, item])
    setNewItem({
      product: "",
      quantity: "",
      unitPrice: "",
    })

    toast({
      title: "Item Added",
      description: `${item.product} has been added to the order.`,
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
    toast({
      title: "Item Removed",
      description: "Item has been removed from the order.",
    })
  }

  const handleCreateOrder = () => {
    if (!newOrder.supplier || !newOrder.expectedDelivery) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      })
      return
    }

    const selectedSupplier = suppliers.find((s) => s.value === newOrder.supplier)
    const { subtotal, tax, total } = calculateTotals(orderItems)

    const order: PurchaseOrder = {
      id: generateOrderId(),
      supplier: newOrder.supplier,
      supplierContact: selectedSupplier?.contact || "",
      date: today,
      expectedDelivery: newOrder.expectedDelivery,
      status: "draft",
      items: orderItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      notes: newOrder.notes,
      createdBy: "Current User",
    }

    setOrders((prev) => [order, ...prev])
    setNewOrder({
      supplier: "",
      expectedDelivery: "",
      notes: "",
    })
    setOrderItems([])
    setIsCreateOpen(false)

    toast({
      title: "Purchase Order Created",
      description: `Purchase order ${order.id} has been created successfully.`,
    })
  }

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsViewOpen(true)
  }

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setNewOrder({
      supplier: order.supplier,
      expectedDelivery: order.expectedDelivery,
      notes: order.notes,
    })
    setOrderItems([...order.items])
    setIsEditOpen(true)
  }

  const handleUpdateOrder = () => {
    if (!selectedOrder) return

    if (!newOrder.supplier || !newOrder.expectedDelivery) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      })
      return
    }

    const selectedSupplier = suppliers.find((s) => s.value === newOrder.supplier)
    const { subtotal, tax, total } = calculateTotals(orderItems)

    const updatedOrder: PurchaseOrder = {
      ...selectedOrder,
      supplier: newOrder.supplier,
      supplierContact: selectedSupplier?.contact || "",
      expectedDelivery: newOrder.expectedDelivery,
      items: orderItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      notes: newOrder.notes,
    }

    setOrders((prev) => prev.map((order) => (order.id === selectedOrder.id ? updatedOrder : order)))
    setNewOrder({
      supplier: "",
      expectedDelivery: "",
      notes: "",
    })
    setOrderItems([])
    setIsEditOpen(false)

    toast({
      title: "Purchase Order Updated",
      description: `Purchase order ${selectedOrder.id} has been updated successfully.`,
    })
  }

  const handleSendOrder = (orderId: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "sent" as const } : order)))

    toast({
      title: "Order Sent",
      description: `Purchase order ${orderId} has been sent to the supplier.`,
    })
  }

  const handleConfirmOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: "confirmed" as const } : order)),
    )

    toast({
      title: "Order Confirmed",
      description: `Purchase order ${orderId} has been confirmed by the supplier.`,
    })
  }

  const handleReceiveOrder = (orderId: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "received" as const } : order)))

    toast({
      title: "Order Received",
      description: `Purchase order ${orderId} has been marked as received.`,
    })
  }

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: "cancelled" as const } : order)),
    )

    toast({
      title: "Order Cancelled",
      description: `Purchase order ${orderId} has been cancelled.`,
    })
  }

  const handleGenerateDocument = (order: PurchaseOrder) => {
    // Generate purchase order document
    const documentContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Purchase Order - ${order.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .supplier-info { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PURCHASE ORDER</h1>
        <h2>${order.id}</h2>
    </div>
    
    <div class="company-info">
        <h3>From:</h3>
        <p><strong>Your Company Name</strong></p>
        <p>123 Business Street</p>
        <p>City, State 12345</p>
        <p>Phone: (555) 123-4567</p>
        <p>Email: orders@yourcompany.com</p>
    </div>
    
    <div class="supplier-info">
        <h3>To:</h3>
        <p><strong>${order.supplier}</strong></p>
        <p>Email: ${order.supplierContact}</p>
    </div>
    
    <div>
        <p><strong>Order Date:</strong> ${order.date}</p>
        <p><strong>Expected Delivery:</strong> ${order.expectedDelivery}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.items
        .map(
          (item) => `
                <tr>
                    <td>${item.product}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.unitPrice.toLocaleString()}</td>
                    <td>₹${item.total.toLocaleString()}</td>
                </tr>
            `,
        )
        .join("")}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td><strong>₹${order.subtotal.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Tax (18%)</strong></td>
                <td><strong>₹${order.tax.toLocaleString()}</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td><strong>₹${order.total.toLocaleString()}</strong></td>
            </tr>
        </tfoot>
    </table>
    
    ${order.notes
        ? `
    <div style="margin-top: 20px;">
        <h3>Notes:</h3>
        <p>${order.notes}</p>
    </div>
    `
        : ""
      }
    
    <div class="footer">
        <p>This is a computer-generated purchase order.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`

    // Create blob and download
    const blob = new Blob([documentContent], { type: "text/html" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `purchase-order-${order.id}.html`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Also open in new window for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(documentContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

    toast({
      title: "Document Generated",
      description: `Purchase order document for ${order.id} has been generated and downloaded.`,
    })
  }

  const renderOrdersTable = (ordersData: PurchaseOrder[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Expected Delivery</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordersData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              No purchase orders found
            </TableCell>
          </TableRow>
        ) : (
          ordersData.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.supplier}</TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.expectedDelivery}</TableCell>
              <TableCell>{order.items.length} items</TableCell>
              <TableCell>₹{order.total.toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {(order.status === "draft" || order.status === "pending") && (
                    <Button variant="outline" size="sm" onClick={() => handleEditOrder(order)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {order.status === "draft" && (
                    <Button variant="outline" size="sm" onClick={() => handleSendOrder(order.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleGenerateDocument(order)}>
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-gray-600">Manage supplier orders and procurement</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Create a new purchase order for suppliers</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={newOrder.supplier}
                    onValueChange={(value) => setNewOrder((prev) => ({ ...prev, supplier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.value} value={supplier.value}>
                          {supplier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-date">Expected Delivery *</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    min={today}
                    value={newOrder.expectedDelivery}
                    onChange={(e) => setNewOrder((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Items</Label>
                <div className="border rounded-lg p-4">
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label htmlFor="item-product-search">Search Product</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="item-product-search"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Select
                        value={newItem.product}
                        onValueChange={(value) => {
                          setNewItem((prev) => ({ ...prev, product: value }))
                          // Auto-fill unit price if product has purchase rate
                          const selectedProduct = products.find(p => p.name === value)
                          if (selectedProduct?.purchase_rate) {
                            setNewItem((prev) => ({ ...prev, unitPrice: selectedProduct.purchase_rate?.toString() || "" }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                          {products.length < totalProducts && (
                            <div className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadMoreProducts}
                                disabled={loadingProducts}
                                className="w-full"
                              >
                                {loadingProducts ? (
                                  <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                  `Load More (${totalProducts - products.length} remaining)`
                                )}
                              </Button>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))}
                      />
                      <Input
                        placeholder="Unit Price"
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, unitPrice: e.target.value }))}
                      />
                      <Button variant="outline" onClick={handleAddItem}>
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Order Items:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell>₹{item.total.toLocaleString()}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleRemoveItem(item.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{calculateTotals(orderItems).subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (18%):</span>
                          <span>₹{calculateTotals(orderItems).tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>₹{calculateTotals(orderItems).total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or requirements"
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isInitialLoading ? (
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
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">All purchase orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All orders combined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Received Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receivedOrders}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({getFilteredOrdersByStatus("draft").length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getFilteredOrdersByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({getFilteredOrdersByStatus("sent").length})</TabsTrigger>
          <TabsTrigger value="received">Received ({getFilteredOrdersByStatus("received").length})</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>Manage all purchase orders</CardDescription>
            </CardHeader>
            <CardContent>{renderOrdersTable(getFilteredOrdersByStatus("all"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>Draft Orders</CardTitle>
              <CardDescription>Orders that are still being prepared</CardDescription>
            </CardHeader>
            <CardContent>{renderOrdersTable(getFilteredOrdersByStatus("draft"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>Orders awaiting supplier confirmation</CardDescription>
            </CardHeader>
            <CardContent>{renderOrdersTable(getFilteredOrdersByStatus("pending"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Orders</CardTitle>
              <CardDescription>Orders sent to suppliers</CardDescription>
            </CardHeader>
            <CardContent>{renderOrdersTable(getFilteredOrdersByStatus("sent"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Received Orders</CardTitle>
              <CardDescription>Orders that have been delivered</CardDescription>
            </CardHeader>
            <CardContent>{renderOrdersTable(getFilteredOrdersByStatus("received"))}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Purchase Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </div>
                    <div>
                      <strong>Date:</strong> {selectedOrder.date}
                    </div>
                    <div>
                      <strong>Expected Delivery:</strong> {selectedOrder.expectedDelivery}
                    </div>
                    <div>
                      <strong>Created By:</strong> {selectedOrder.createdBy}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Supplier Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Supplier:</strong> {selectedOrder.supplier}
                    </div>
                    <div>
                      <strong>Contact:</strong> {selectedOrder.supplierContact}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>₹{item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>₹{selectedOrder.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">{selectedOrder.notes}</div>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t">
                {selectedOrder.status === "draft" && (
                  <Button className="flex-1" onClick={() => handleSendOrder(selectedOrder.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Supplier
                  </Button>
                )}
                {selectedOrder.status === "sent" && (
                  <Button className="flex-1" onClick={() => handleConfirmOrder(selectedOrder.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Confirmed
                  </Button>
                )}
                {selectedOrder.status === "confirmed" && (
                  <Button className="flex-1" onClick={() => handleReceiveOrder(selectedOrder.id)}>
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Received
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => handleGenerateDocument(selectedOrder)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
                {selectedOrder.status !== "received" && selectedOrder.status !== "cancelled" && (
                  <Button variant="outline" onClick={() => handleCancelOrder(selectedOrder.id)}>
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Purchase Order - {selectedOrder?.id}</DialogTitle>
            <DialogDescription>Update purchase order details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier *</Label>
                <Select
                  value={newOrder.supplier}
                  onValueChange={(value) => setNewOrder((prev) => ({ ...prev, supplier: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.value} value={supplier.value}>
                        {supplier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-delivery-date">Expected Delivery *</Label>
                <Input
                  id="edit-delivery-date"
                  type="date"
                  min={today}
                  value={newOrder.expectedDelivery}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              <div className="border rounded-lg p-4">
                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="edit-item-product-search">Search Product</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="edit-item-product-search"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Select
                      value={newItem.product}
                      onValueChange={(value) => {
                        setNewItem((prev) => ({ ...prev, product: value }))
                        // Auto-fill unit price if product has purchase rate
                        const selectedProduct = products.find(p => p.name === value)
                        if (selectedProduct?.purchase_rate) {
                          setNewItem((prev) => ({ ...prev, unitPrice: selectedProduct.purchase_rate?.toString() || "" }))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        {products.length < totalProducts && (
                          <div className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={loadMoreProducts}
                              disabled={loadingProducts}
                              className="w-full"
                            >
                              {loadingProducts ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                              ) : (
                                `Load More (${totalProducts - products.length} remaining)`
                              )}
                            </Button>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                    <Input
                      placeholder="Unit Price"
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    />
                    <Button variant="outline" onClick={handleAddItem}>
                      Add Item
                    </Button>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Order Items:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>₹{item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{calculateTotals(orderItems).subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (18%):</span>
                        <span>₹{calculateTotals(orderItems).tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₹{calculateTotals(orderItems).total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes or requirements"
                value={newOrder.notes}
                onChange={(e) => setNewOrder((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder}>Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
