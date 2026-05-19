"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoader } from "@/components/ui/page-loader"
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton"
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, Package, Download, Calendar, Loader2 } from "lucide-react"
import apiClient from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

interface DailySale {
  date: string
  sales: number
  orders: number
  customers: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
  percentage: number
}

interface CategorySale {
  category: string
  sales: number
  percentage: number
}

interface EmployeePerformance {
  name: string
  sales: number
  orders: number
  avgOrder: number
}

export function Reports() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [uniqueCustomers, setUniqueCustomers] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)
  const [ordersChange, setOrdersChange] = useState(0)
  const [avgOrderChange, setAvgOrderChange] = useState(0)
  const [customersChange, setCustomersChange] = useState(0)
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categoryWiseSales, setCategoryWiseSales] = useState<CategorySale[]>([])
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([])

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    setLoading(true)
    try {
      // Check if user is ADMIN - admins should see all data
      const userRole = localStorage.getItem("role")
      const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
      
      const params: any = {
        fetch_all: true,
      }
      
      // Don't filter by branch_id for admin users
      if (!isAdmin) {
        const branchStr = localStorage.getItem("branch")
        if (branchStr && branchStr !== "Not Found") {
          try {
            const branchObj = JSON.parse(branchStr)
            params.branch_id = branchObj.id || branchStr
          } catch (e) {
            params.branch_id = branchStr
          }
        }
      }

      // Use the new reports API endpoint
      const reportsRes = await apiClient.get("/reports", { params })

      console.log("📊 Reports API Response:", reportsRes.data)

      const reportsData = reportsRes.data?.data || {}
      const sales = reportsData.sales || []
      const bestSellingProducts = reportsData.bestSellingProducts || []
      const stats = reportsData.stats || {}
      
      console.log("📈 Processed Data:", {
        sales: sales.length,
        products: bestSellingProducts.length,
        stats
      })
      
      // Use stats from API or calculate from sales
      const revenue = stats.totalRevenue || sales.reduce((sum: number, sale: any) => {
        const amount = Number(sale.total_amount || sale.total || sale.amount || 0)
        return sum + Math.abs(amount)
      }, 0)
      
      console.log("💰 Total Revenue:", revenue, "from", sales.length, "sales")
      setTotalRevenue(revenue)

      // Calculate total orders
      const orders = stats.totalSales || sales.length
      setTotalOrders(orders)

      // Calculate average order value
      const avgOrder = orders > 0 ? revenue / orders : 0
      setAvgOrderValue(avgOrder)

      // Calculate unique customers
      const uniqueCusts = stats.uniqueCustomers || new Set(
        sales
          .map((sale: any) => sale.customer_id || sale.customer?.id)
          .filter(Boolean)
      ).size
      setUniqueCustomers(uniqueCusts)

      // Calculate daily sales (last 7 days)
      const today = new Date()
      const dailySalesData: DailySale[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const daySales = sales.filter((sale: any) => {
          if (!sale) return false
          // Try multiple date fields
          const saleDateField = sale.sale_date || sale.created_at || sale.createdAt || sale.date
          if (!saleDateField) return false
          
          try {
            const saleDate = new Date(saleDateField).toISOString().split('T')[0]
            return saleDate === dateStr
          } catch (e) {
            console.warn("Invalid date format:", saleDateField)
            return false
          }
        })
        
        const dayRevenue = daySales.reduce((sum: number, sale: any) => {
          const amount = Number(sale.total_amount || sale.total || 0)
          return sum + Math.abs(amount)
        }, 0)
        const dayOrders = daySales.length
        const dayCustomers = new Set(
          daySales.map((s: any) => s.customer_id || s.customer?.id).filter(Boolean)
        ).size
        
        dailySalesData.push({
          date: dateStr,
          sales: dayRevenue,
          orders: dayOrders,
          customers: dayCustomers
        })
      }
      setDailySales(dailySalesData)

      // Process top products from reports API
      const totalProductRevenue = bestSellingProducts.reduce((sum: number, p: any) => {
        const quantity = p.quantity_sold || 0
        const price = p.price || 0
        const revenue = price * quantity
        return sum + revenue
      }, 0)
      
      const formattedTopProducts = bestSellingProducts.slice(0, 5).map((product: any) => {
        const quantity = product.quantity_sold || 0
        const price = product.price || 0
        const revenue = price * quantity
        const percentage = totalProductRevenue > 0 ? (revenue / totalProductRevenue) * 100 : 0
        return {
          name: product.name || "Unknown",
          quantity: quantity,
          revenue: revenue,
          percentage: percentage
        }
      })
      setTopProducts(formattedTopProducts)

      // Calculate category-wise sales from sale_items
      const categoryMap = new Map<string, number>()
      sales.forEach((sale: any) => {
        const saleItems = sale.sale_items || sale.items || []
        saleItems.forEach((item: any) => {
          const categoryName = item.product?.category?.name || 
                              item.product?.category_name ||
                              item.category?.name || 
                              item.category_name || 
                              "Uncategorized"
          const itemTotal = Math.abs(Number(
            item.line_total || 
            item.total || 
            (Number(item.unit_price || item.price || 0)) * Number(item.quantity || 0) || 
            0
          ))
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + itemTotal)
        })
      })
      
      console.log("📊 Category Sales Map:", Array.from(categoryMap.entries()))
      
      const totalCategorySales = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)
      const categorySalesData = Array.from(categoryMap.entries())
        .map(([category, sales]) => ({
          category,
          sales,
          percentage: totalCategorySales > 0 ? (sales / totalCategorySales) * 100 : 0
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
      setCategoryWiseSales(categorySalesData)

      // Calculate employee performance (if employee data is available)
      // For now, we'll use a placeholder or fetch from employees API if available
      setEmployeePerformance([])

      // Calculate percentage changes (simplified - compare with previous period)
      // This would ideally compare with last week/month
      setRevenueChange(0)
      setOrdersChange(0)
      setAvgOrderChange(0)
      setCustomersChange(0)

    } catch (error: any) {
      console.error("Error fetching reports data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports data. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader message="Loading reports..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
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
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center space-x-1 text-sm">
              {revenueChange >= 0 ? (
                <>
              <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{revenueChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-sm">
              {ordersChange >= 0 ? (
                <>
              <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{ordersChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  <span className="text-red-600">{ordersChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center space-x-1 text-sm">
              {avgOrderChange >= 0 ? (
                <>
              <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{avgOrderChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  <span className="text-red-600">{avgOrderChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-sm">
              {customersChange >= 0 ? (
                <>
              <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{customersChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  <span className="text-red-600">{customersChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Daily Sales Report */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Sales</TableHead>
                      <TableHead className="min-w-[100px]">Orders</TableHead>
                      <TableHead className="min-w-[120px]">Customers</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {dailySales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No sales data available
                    </TableCell>
                  </TableRow>
                ) : (
                  dailySales.map((day) => (
                  <TableRow key={day.date}>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell>Rs {day.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{day.orders}</TableCell>
                    <TableCell>{day.customers}</TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No product data available</div>
              ) : (
                topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="font-medium text-gray-900">Rs {product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <Badge variant="secondary">{product.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Category-wise Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryWiseSales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No category data available</div>
              ) : (
                categoryWiseSales.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.category}</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="font-medium text-gray-900">Rs {category.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Employee</TableHead>
                      <TableHead className="min-w-[100px]">Sales</TableHead>
                      <TableHead className="min-w-[100px]">Orders</TableHead>
                      <TableHead className="min-w-[100px]">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {employeePerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No employee performance data available
                    </TableCell>
                  </TableRow>
                ) : (
                  employeePerformance.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>Rs {employee.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{employee.orders}</TableCell>
                      <TableCell>Rs {employee.avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
