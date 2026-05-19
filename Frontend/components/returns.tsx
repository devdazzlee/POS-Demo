"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Plus, Search, Eye, RotateCcw, CreditCard, DollarSign, CheckCircle, XCircle, Loader2, Minus, X, ChevronLeft, ChevronRight, Printer, Download, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageLoader } from "@/components/ui/page-loader"
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/lib/apiClient"
import { useLogoDataUri } from "@/hooks/use-logo-data-uri"
import {
  prepareReceiptDataFromSale,
  downloadReceiptPdf,
  shareReceiptOnWhatsApp,
  type ReceiptData,
} from "@/lib/receipt"
import { printReceiptViaServer } from "@/lib/print-server"
import { usePrinterSettings } from "@/hooks/use-printer-settings"

interface Sale {
  id: string
  sale_number: string
  customer?: {
    name: string
    email: string
  }
  sale_date: string
  total_amount: number
  sale_items: Array<{
    id: string
    product: {
      id: string
      name: string
      sku: string
    }
    quantity: number
    unit_price: number
    line_total: number
  }>
}

interface ReturnItem {
  id: string
  sale_number: string
  customer?: {
    name: string
    email: string
  }
  sale_date: string
  total_amount: number
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "EXCHANGED"
  payment_method: string
  notes?: string
  sale_items: Array<{
    id: string
    product: {
      id: string
      name: string
      sku: string
    }
    quantity: number
    unit_price: number
    line_total: number
    item_type: "ORIGINAL" | "RETURN" | "EXCHANGE"
  }>
}

interface NewReturn {
  saleId: string
  customerId?: string
  returnType: "REFUND" | "EXCHANGE"
  refundMethod?: string
  returnedItems: Array<{
    productId: string
    quantity: number
  }>
  exchangedItems: Array<{
    productId: string
    quantity: number
    price: number
  }>
  notes: string
}

interface Product {
  id: string
  name: string
  sku: string
  sales_rate_exc_dis_and_tax: number
  sales_rate_inc_dis_and_tax: number
  purchase_rate: number
  available_stock?: number
  current_stock?: number
  // Backend can expose unit either as a relation { name } or as a flat
  // unit_name string depending on the endpoint. Accept both shapes.
  unit?: { name?: string | null } | null
  unit_name?: string | null
}

interface ExchangeItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  price: number
  unit?: string
}

interface SelectedReturnItem {
  productId: string
  productName: string
  sku: string
  originalQuantity: number
  returnQuantity: number
  unitPrice: number
}

const normalizeSaleSearchTerm = (value?: string) =>
  (value || "").replace(/\s+/g, " ").trim()

const normalizeSaleRecord = (sale: any): Sale => ({
  id: String(sale?.id || ""),
  sale_number: String(sale?.sale_number || ""),
  customer: sale?.customer
    ? {
        name: String(sale.customer.name || ""),
        email: String(sale.customer.email || ""),
      }
    : undefined,
  sale_date:
    typeof sale?.sale_date === "string"
      ? sale.sale_date
      : new Date(sale?.sale_date || Date.now()).toISOString(),
  total_amount: Number(sale?.total_amount || 0),
  sale_items: Array.isArray(sale?.sale_items)
    ? sale.sale_items.map((item: any) => ({
        id: String(item?.id || ""),
        product: {
          id: String(item?.product?.id || item?.product_id || ""),
          name: String(item?.product?.name || "Unnamed Product"),
          sku: String(item?.product?.sku || ""),
        },
        quantity: Number(item?.quantity || 0),
        unit_price: Number(item?.unit_price || 0),
        line_total: Number(item?.line_total || 0),
      }))
    : [],
})

const matchesSaleSearch = (sale: any, term: string) => {
  if (!term) return true

  const saleNumber = String(sale?.sale_number || "").toLowerCase()
  const customerName = String(sale?.customer?.name || "").toLowerCase()
  const customerEmail = String(sale?.customer?.email || "").toLowerCase()

  return (
    saleNumber.includes(term) ||
    customerName.includes(term) ||
    customerEmail.includes(term)
  )
}

const getIneligibleSaleReason = (status?: string) => {
  switch (status) {
    case "REFUNDED":
      return "This sale is already refunded and cannot be processed again."
    case "EXCHANGED":
      return "This sale is already exchanged and cannot be processed again."
    case "CANCELLED":
      return "Cancelled sales cannot be returned."
    case "PENDING":
      return "This sale is not completed yet, so it cannot be returned."
    default:
      return "This sale is not eligible for return."
  }
}

const findIneligibleSaleMatch = (sales: any[], searchTerm: string) => {
  const term = normalizeSaleSearchTerm(searchTerm).toLowerCase()
  if (!term) {
    return null
  }

  const exactMatch =
    sales.find(
      (sale: any) =>
        String(sale?.sale_number || "").toLowerCase() === term ||
        String(sale?.customer?.email || "").toLowerCase() === term ||
        String(sale?.customer?.name || "").toLowerCase() === term
    ) ||
    sales.find((sale: any) => matchesSaleSearch(sale, term))

  if (!exactMatch || exactMatch.status === "COMPLETED") {
    return null
  }

  return {
    saleNumber: String(exactMatch.sale_number || ""),
    status: String(exactMatch.status || ""),
    reason: getIneligibleSaleReason(exactMatch.status),
  }
}

export function Returns() {
  const { toast } = useToast()

  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [allSalesForMetrics, setAllSalesForMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true) // Start with true to show loader on initial load
  const [salesLoading, setSalesLoading] = useState(false)
  const [processingReturn, setProcessingReturn] = useState(false) // Separate loading state for process return button
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedReturnItems, setSelectedReturnItems] = useState<SelectedReturnItem[]>([])
  // Track return quantity input values as strings to allow decimal point typing
  const [returnQuantityInputs, setReturnQuantityInputs] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([])
  // Per-row draft text for the quantity input so the user can clear the field
  // without it snapping back to "0" and concatenating their next keystroke
  // (e.g. clearing then typing "22" was producing "022").
  const [exchangeQtyDrafts, setExchangeQtyDrafts] = useState<Record<string, string>>({})
  const [exchangeProductSearch, setExchangeProductSearch] = useState("")
  const [exchangeProductDropdownOpen, setExchangeProductDropdownOpen] = useState(false)
  const exchangeProductSearchRef = useRef<HTMLInputElement | null>(null)
  const exchangeProductDropdownRef = useRef<HTMLDivElement | null>(null)

  const [isProcessOpen, setIsProcessOpen] = useState(false)
  const [saleDropdownOpen, setSaleDropdownOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const logoDataUri = useLogoDataUri()
  const { receiptPrinter, getReceiptPrinterObj, printers } = usePrinterSettings()
  const [searchTerm, setSearchTerm] = useState("")
  const [saleSearch, setSaleSearch] = useState("")
  const [saleSearchPending, setSaleSearchPending] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const saleSearchInputRef = useRef<HTMLInputElement | null>(null)
  const saleDropdownRef = useRef<HTMLDivElement | null>(null)
  const latestSalesRequestRef = useRef(0)
  const saleSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [newReturn, setNewReturn] = useState<NewReturn>({
    saleId: "",
    customerId: "",
    returnType: "REFUND",
    refundMethod: "",
    returnedItems: [],
    exchangedItems: [],
    notes: "",
  })
  // Inline validation errors, keyed by field name. Toasts disappear; an
  // inline message right under the input tells the user exactly what's
  // wrong, the moment they click "Process Return".
  const [formErrors, setFormErrors] = useState<{
    sale?: string
    refundMethod?: string
    items?: string
    exchangeItems?: string
  }>({})

  // Fetch products for exchange
  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const userRole = localStorage.getItem("role")
      const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
      
      const params: any = {
        fetch_all: true,
        is_active: true,
      }
      
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
      
      const response = await apiClient.get("/products", { params })
      setProducts(response.data?.data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error)
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch sales and returns data
  const fetchSales = async (search = "", options?: { keepPending?: boolean }) => {
    const normalizedSearch = normalizeSaleSearchTerm(search)
    const requestId = ++latestSalesRequestRef.current

    setSalesLoading(true)
    try {
      const response = await apiClient.get("/sale/for-returns", {
        params: { search: normalizedSearch }
      })

      if (requestId !== latestSalesRequestRef.current) {
        return
      }

      setSales(response.data.data || [])
    } catch (error) {
      if (requestId === latestSalesRequestRef.current) {
        toast({
          variant: "destructive",
          title: "Failed to fetch sales",
          description: "Could not load sales data",
        })
      }
    } finally {
      if (requestId === latestSalesRequestRef.current) {
        setSalesLoading(false)
        if (!options?.keepPending) {
          setSaleSearchPending(false)
        }
      }
    }
  }

  const triggerSaleSearch = (value: string, options?: { immediate?: boolean }) => {
    const normalizedValue = normalizeSaleSearchTerm(value)

    setSaleSearch(normalizedValue)
    setSaleDropdownOpen(true)
    setSaleSearchPending(true)

    if (saleSearchDebounceRef.current) {
      clearTimeout(saleSearchDebounceRef.current)
      saleSearchDebounceRef.current = null
    }

    if (!isProcessOpen) {
      setSaleSearchPending(false)
      return
    }

    if (options?.immediate) {
      fetchSales(normalizedValue)
      return
    }

    saleSearchDebounceRef.current = setTimeout(() => {
      fetchSales(normalizedValue)
      saleSearchDebounceRef.current = null
    }, normalizedValue ? 250 : 0)
  }

  const fetchReturns = async () => {
    setLoading(true)
    try {
      // Fetch sales that have returns/exchanges (status REFUNDED or EXCHANGED)
      const response = await apiClient.get("/sale")
      const allSales = response.data.data || []
      setAllSalesForMetrics(allSales)
      const returnSales = allSales.filter((sale: any) => 
        sale.status === "REFUNDED" || sale.status === "EXCHANGED"
      )
      setReturns(returnSales)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch returns",
        description: "Could not load returns data",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isProcessOpen) {
      if (saleSearchDebounceRef.current) {
        clearTimeout(saleSearchDebounceRef.current)
        saleSearchDebounceRef.current = null
      }
      return
    }

    fetchSales(saleSearch)

    return () => {
      if (saleSearchDebounceRef.current) {
        clearTimeout(saleSearchDebounceRef.current)
        saleSearchDebounceRef.current = null
      }
    }
  }, [isProcessOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        saleDropdownRef.current &&
        !saleDropdownRef.current.contains(event.target as Node)
      ) {
        setSaleDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close exchange product dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exchangeProductDropdownRef.current &&
        !exchangeProductDropdownRef.current.contains(event.target as Node) &&
        exchangeProductSearchRef.current &&
        !exchangeProductSearchRef.current.contains(event.target as Node)
      ) {
        setExchangeProductDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchReturns()
    fetchSales()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!isProcessOpen) {
      setSaleSearch("")
      setSaleSearchPending(false)
      setSaleDropdownOpen(false)
      setExchangeProductSearch("")
      setExchangeProductDropdownOpen(false)
      setExchangeItems([])
      setSelectedReturnItems([])
      setReturnQuantityInputs({})
      setNewReturn({
        saleId: "",
        customerId: "",
        returnType: "REFUND",
        refundMethod: "",
        returnedItems: [],
        exchangedItems: [],
        notes: "",
      })
      setSelectedSale(null)
      setFormErrors({})
    }
  }, [isProcessOpen])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-blue-100 text-blue-800"
      case "EXCHANGED":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredReturns = useMemo(() => {
    const normalizedTerm = normalizeSaleSearchTerm(searchTerm).toLowerCase()

    return returns.filter((returnItem) => {
      const matchesSearch =
        returnItem.id.toLowerCase().includes(normalizedTerm) ||
        returnItem.sale_number.toLowerCase().includes(normalizedTerm) ||
        (returnItem.customer?.name && returnItem.customer.name.toLowerCase().includes(normalizedTerm)) ||
        (returnItem.customer?.email && returnItem.customer.email.toLowerCase().includes(normalizedTerm))

      return matchesSearch
    })
  }, [returns, searchTerm])

  const searchableSales = useMemo(() => {
    const eligibleSalesFromCache = allSalesForMetrics
      .filter((sale: any) => sale?.status === "COMPLETED")
      .map(normalizeSaleRecord)

    const eligibleSalesFromSearch = sales.map(normalizeSaleRecord)
    const dedupedSales = new Map<string, Sale>()

    ;[...eligibleSalesFromSearch, ...eligibleSalesFromCache].forEach((sale) => {
      if (!sale.id) return
      dedupedSales.set(sale.id, sale)
    })

    return Array.from(dedupedSales.values())
  }, [allSalesForMetrics, sales])

  const pageSearchMatchingSales = useMemo(() => {
    const term = normalizeSaleSearchTerm(searchTerm).toLowerCase()
    if (!term || filteredReturns.length > 0) {
      return []
    }

    return searchableSales.filter((sale) => matchesSaleSearch(sale, term)).slice(0, 5)
  }, [filteredReturns.length, searchableSales, searchTerm])

  const filteredSales = useMemo(() => {
    const term = normalizeSaleSearchTerm(saleSearch).toLowerCase()
    if (!term) return searchableSales

    return searchableSales.filter((sale) => matchesSaleSearch(sale, term))
  }, [saleSearch, searchableSales])

  const ineligibleSaleMatch = useMemo(() => {
    if (!normalizeSaleSearchTerm(saleSearch) || filteredSales.length > 0) {
      return null
    }

    return findIneligibleSaleMatch(allSalesForMetrics, saleSearch)
  }, [allSalesForMetrics, filteredSales.length, saleSearch])

  const pageSearchIneligibleSaleMatch = useMemo(() => {
    if (!normalizeSaleSearchTerm(searchTerm) || filteredReturns.length > 0 || pageSearchMatchingSales.length > 0) {
      return null
    }

    return findIneligibleSaleMatch(allSalesForMetrics, searchTerm)
  }, [allSalesForMetrics, filteredReturns.length, pageSearchMatchingSales.length, searchTerm])

  const getFilteredReturnsByStatus = (status: string) => {
    if (status === "all") return filteredReturns
    return filteredReturns.filter((returnItem) => returnItem.status === status)
  }

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Prepare ReceiptData (same shape as sales-history) whenever a return is
  // opened. The data feeds the Print / Download / Share actions — there's no
  // on-screen receipt preview here; the original card view stays as-is.
  useEffect(() => {
    if (selectedReturn && isViewOpen) {
      const data = prepareReceiptDataFromSale(
        selectedReturn as any,
        { name: "ACE STUDIOS", address: "Karachi" },
        { transactionLabel: selectedReturn.sale_number },
      )
      setReceiptData(data)
    } else {
      setReceiptData(null)
    }
  }, [selectedReturn, isViewOpen])

  const handleServerPrint = async () => {
    if (!receiptData) return
    const printerInfo = getReceiptPrinterObj()
    if (!printerInfo) {
      toast({ title: "Please select a receipt printer in Printer Settings", variant: "destructive" })
      return
    }
    try {
      await printReceiptViaServer(
        {
          ...printerInfo,
          columns: printerInfo.receiptProfile?.columns || { fontA: 48, fontB: 64 },
        },
        receiptData,
        { copies: 1, cut: true, openDrawer: false },
      )
      toast({ title: "Receipt sent to printer" })
    } catch (err: any) {
      toast({ title: err?.message || "Failed to print receipt", variant: "destructive" })
    }
  }

  const handleDownloadReceipt = async () => {
    if (!receiptData) return
    try {
      await downloadReceiptPdf(receiptData, logoDataUri)
    } catch (err: any) {
      toast({ title: err?.message || "Failed to download receipt", variant: "destructive" })
    }
  }

  const handleShareReceiptOnWhatsApp = async () => {
    if (!receiptData) return
    try {
      const { fellBack } = await shareReceiptOnWhatsApp(
        receiptData,
        logoDataUri,
        (selectedReturn as any)?.customer?.phone_number ||
          (selectedReturn as any)?.customer?.mobile_number ||
          "",
      )
      if (fellBack) {
        toast({
          title: "Receipt downloaded",
          description:
            "Your browser doesn't support direct file share. Attach the PDF in the WhatsApp chat.",
        })
      }
    } catch (err: any) {
      toast({ title: err?.message || "Failed to share receipt", variant: "destructive" })
    }
  }

  // Calculate stats
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const sameDay = (dateValue: string, compareDate: Date) => {
    const d = new Date(dateValue)
    return d.toDateString() === compareDate.toDateString()
  }
  const todayReturns = returns.filter((r) => sameDay(r.sale_date, today)).length
  const yesterdayReturns = returns.filter((r) => sameDay(r.sale_date, yesterday)).length
  // Use Math.abs to ensure return value is always positive (returns are stored as negative in some systems)
  const todayValue = returns
    .filter((r) => sameDay(r.sale_date, today))
    .reduce((sum, r) => sum + Math.abs(Number(r.total_amount)), 0)
  const pendingReturns = returns.filter((r) => r.status === "PENDING").length
  const returnRate = allSalesForMetrics.length > 0 
    ? ((returns.length / allSalesForMetrics.length) * 100).toFixed(1) 
    : "0.0"
  const returnsDelta = todayReturns - yesterdayReturns
  const returnsDeltaText =
    returnsDelta === 0
      ? "Same as yesterday"
      : `${returnsDelta > 0 ? "+" : ""}${returnsDelta} from yesterday`

  // Handle exchange product selection
  const handleExchangeProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const price = product.sales_rate_inc_dis_and_tax || product.sales_rate_exc_dis_and_tax || product.purchase_rate || 0
    
    // Check if product already in exchange items
    const existingItem = exchangeItems.find((item) => item.productId === productId)
    if (existingItem) {
      // Increment quantity
      setExchangeItems((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      // Add new exchange item — capture the unit (kg / pcs / etc.) so we can
      // show it next to the quantity input.
      const unitLabel =
        product.unit?.name || product.unit_name || undefined
      setExchangeItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          price: price,
          unit: unitLabel || undefined,
        },
      ])
    }

    // Update newReturn.exchangedItems
    const updatedExchangeItems = existingItem
      ? exchangeItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
          ...exchangeItems,
          {
            productId: product.id,
            quantity: 1,
            price: price,
          },
        ]

    setNewReturn((prev) => ({
      ...prev,
      exchangedItems: updatedExchangeItems,
    }))

    setExchangeProductSearch("")
    setExchangeProductDropdownOpen(false)
  }

  // Handle exchange item quantity change
  const handleExchangeQuantityChange = (productId: string, quantity: number) => {
    // Keep the row even when quantity is 0 so the user can finish typing a
    // value like "0.5" without the row disappearing on the first "0".
    // Use removeExchangeItem to explicitly drop a row.
    const safeQty = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
    setExchangeItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: safeQty } : item,
      ),
    );
    setNewReturn((prev) => ({
      ...prev,
      exchangedItems: prev.exchangedItems.map((item) =>
        item.productId === productId ? { ...item, quantity: safeQty } : item,
      ),
    }));
  };

  const removeExchangeItem = (productId: string) => {
    setExchangeItems((prev) => prev.filter((item) => item.productId !== productId));
    setNewReturn((prev) => ({
      ...prev,
      exchangedItems: prev.exchangedItems.filter((item) => item.productId !== productId),
    }));
  };

  // Filter products for exchange
  const filteredExchangeProducts = useMemo(() => {
    if (!exchangeProductSearch) return products
    const searchLower = exchangeProductSearch.toLowerCase()
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
      )
  }, [products, exchangeProductSearch])

  const handleProcessReturn = async () => {
    // Filter out items with quantity 0 before validation
    const validReturnedItems = newReturn.returnedItems.filter(item => item.quantity > 0)

    // Collect ALL validation problems in one pass and render them inline,
    // next to the offending field. Toasts vanish; inline errors stay until
    // the user fixes them.
    const nextErrors: typeof formErrors = {}

    if (!newReturn.saleId) {
      nextErrors.sale = "Please select a sale."
    }

    if (newReturn.returnType === "REFUND" && !newReturn.refundMethod) {
      nextErrors.refundMethod = "Please select a refund method."
    }

    if (newReturn.returnType === "EXCHANGE") {
      if (newReturn.exchangedItems.length === 0) {
        nextErrors.exchangeItems = "Please add at least one item for exchange."
      } else if (newReturn.exchangedItems.some((it) => !it.quantity || it.quantity <= 0)) {
        nextErrors.exchangeItems = "Exchange item quantity must be greater than 0."
      }
    }

    if (validReturnedItems.length === 0 && newReturn.exchangedItems.length === 0) {
      nextErrors.items = "Please select at least one item to return or exchange."
    }

    const hasInvalidQuantity = selectedReturnItems.some(item =>
      item.returnQuantity > item.originalQuantity,
    )
    if (hasInvalidQuantity) {
      nextErrors.items = "Return quantity cannot exceed original sale quantity."
    }

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      // One concise toast as a secondary signal for users who don't look at
      // the field directly — the inline errors are the primary feedback.
      toast({
        title: "Please fix the highlighted fields",
        description: Object.values(nextErrors)[0],
        variant: "destructive",
      })
      return
    }

    setProcessingReturn(true) // Set processing state for button
    try {
      // Prepare the request payload - ensure all quantities are numbers
      const payload: any = {
        returnedItems: validReturnedItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity) // Ensure quantity is a number, not a string
        })),
        notes: newReturn.notes || "",
      }

      // Add exchange items if return type is EXCHANGE - ensure quantities and prices are numbers
      if (newReturn.returnType === "EXCHANGE" && newReturn.exchangedItems.length > 0) {
        payload.exchangedItems = newReturn.exchangedItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity), // Ensure quantity is a number
          price: Number(item.price) // Ensure price is a number
        }))
      }

      // Add refund method if return type is REFUND
      if (newReturn.returnType === "REFUND" && newReturn.refundMethod) {
        payload.refundMethod = newReturn.refundMethod
      }

      // Add customer ID if available
      if (newReturn.customerId) {
        payload.customerId = newReturn.customerId
      }

      console.log("📤 Processing return with payload:", payload)
      
      const response = await apiClient.patch(`/sale/${newReturn.saleId}/refund`, payload)

      // Show success toast — wording follows the chosen mode.
      const isExchange = newReturn.returnType === "EXCHANGE"
      toast({
        title: isExchange ? "Exchange Processed" : "Refund Processed",
        description: isExchange
          ? "Exchange has been processed successfully."
          : "Refund has been processed successfully.",
        variant: "default",
      })

      // Close modal immediately after success (before any other state changes)
      setIsProcessOpen(false)
      
      // Reset form after closing modal
      setNewReturn({
        saleId: "",
        customerId: "",
        returnType: "REFUND",
        refundMethod: "",
        returnedItems: [],
        exchangedItems: [],
        notes: "",
      })
      setSelectedReturnItems([])
      setExchangeItems([])
      setExchangeProductSearch("")
      setSelectedSale(null)
      setFormErrors({})
      // Clear the page-level search so the user lands back on the full
      // returns list. Leaving the previous term in the input made it look
      // like the refunded sale ID was auto-filled.
      setSearchTerm("")

      // Refresh data after closing modal (don't await to avoid blocking)
      fetchReturns()
      fetchSales()
    } catch (error: any) {
      console.error("❌ Error processing return:", error)
      console.error("Error response:", error.response?.data)
      
      // Extract detailed error message
      let errorMessage = "An error occurred while processing the return."
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        const errors = error.response.data.errors
        if (Array.isArray(errors)) {
          errorMessage = errors.map((e: any) => e.message || e).join(", ")
        } else if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(", ") : messages
              return `${field}: ${msg}`
            })
            .join("; ")
        }
      }
      
      toast({
        variant: "destructive",
        title:
          newReturn.returnType === "EXCHANGE"
            ? "Failed to process exchange"
            : "Failed to process refund",
        description: errorMessage,
      })
      // Don't close modal on error - let user see the error and try again
    } finally {
      setProcessingReturn(false) // Reset processing state
    }
  }

  const handleSaleSelect = (saleId: string) => {
    if (saleSearchDebounceRef.current) {
      clearTimeout(saleSearchDebounceRef.current)
      saleSearchDebounceRef.current = null
    }

    setSaleSearchPending(false)
    const sale = searchableSales.find(s => s.id === saleId)
    setSelectedSale(sale || null)
    setNewReturn(prev => ({ ...prev, saleId }))
    setSaleDropdownOpen(false)
    setSaleSearch(sale?.sale_number || "")
    requestAnimationFrame(() => {
      saleSearchInputRef.current?.blur()
    })
    
    // Initialize selected return items
    if (sale) {
      const items: SelectedReturnItem[] = sale.sale_items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        originalQuantity: item.quantity,
        returnQuantity: item.quantity, // Initialize with original quantity instead of 0
        unitPrice: item.unit_price
      }))
      setSelectedReturnItems(items)
      
      // Update newReturn.returnedItems with initial quantities
      const returnedItems = items.map(i => ({
        productId: i.productId,
        quantity: i.returnQuantity
      }))
      setNewReturn(prev => ({
        ...prev,
        returnedItems
      }))
    } else {
      setSelectedReturnItems([])
    }
  }

  const handleSaleSearchPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = event.clipboardData.getData("text")
    if (!pastedValue) {
      return
    }

    event.preventDefault()
    triggerSaleSearch(pastedValue, { immediate: true })
  }

  const handleStartReturnForSale = (saleId: string) => {
    handleSaleSelect(saleId)
    setIsProcessOpen(true)
  }

  const handleReturnQuantityChange = (productId: string, quantity: number) => {
    const item = selectedReturnItems.find((item) => item.productId === productId)
    if (!item) return
    
    // Ensure quantity is valid: >= 0 and <= originalQuantity
    const validQuantity = Math.max(0, Math.min(quantity, item.originalQuantity))
    
    setSelectedReturnItems((prev) => {
      const updatedItems = prev.map((i) =>
        i.productId === productId
          ? { ...i, returnQuantity: validQuantity }
          : i
    )

    // Update newReturn.returnedItems
    const returnedItems = updatedItems
        .filter((i) => i.returnQuantity > 0)
        .map((i) => ({
          productId: i.productId,
          quantity: i.returnQuantity
        }))

      setNewReturn((prev) => ({
      ...prev,
      returnedItems
    }))
      
      return updatedItems
    })
    
    // Clear local input state when value is set programmatically (via +/- buttons)
    setReturnQuantityInputs((prev) => {
      const newState = { ...prev }
      delete newState[productId]
      return newState
    })
  }

  const handleViewReturn = (returnItem: ReturnItem) => {
    setSelectedReturn(returnItem)
    setIsViewOpen(true)
  }

  const renderReturnsTable = (returnsData: ReturnItem[]) => {
    // Paginate the data
    const totalPages = pageSize === 0 ? 1 : Math.ceil(returnsData.length / pageSize)
    const startIndex = pageSize === 0 ? 0 : (currentPage - 1) * pageSize
    const endIndex = pageSize === 0 ? returnsData.length : startIndex + pageSize
    const paginatedData = returnsData.slice(startIndex, endIndex)
    const hasSearchTerm = Boolean(normalizeSaleSearchTerm(searchTerm))
    const emptyStateMessage =
      hasSearchTerm && pageSearchMatchingSales.length > 0
        ? "No return history found for this search. Matching sales are shown above."
        : hasSearchTerm && pageSearchIneligibleSaleMatch
          ? "No return history found for this search. Sale status details are shown above."
          : "No returns found"
    
    return (
      <>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Sale ID</TableHead>
                  <TableHead className="min-w-[150px]">Customer</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[130px]">Payment Method</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
          <TableBody>
            {returnsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((returnItem) => (
            <TableRow key={returnItem.id}>
              <TableCell className="font-medium">{returnItem.sale_number}</TableCell>
              <TableCell>{returnItem.customer?.name || returnItem.customer?.email || "N/A"}</TableCell>
              <TableCell>{new Date(returnItem.sale_date).toLocaleDateString()}</TableCell>
              <TableCell>Rs {Math.abs(Number(returnItem.total_amount)).toLocaleString()}</TableCell>
              <TableCell className="capitalize">{returnItem.payment_method}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(returnItem.status)}>{returnItem.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewReturn(returnItem)}>
                    <Eye className="w-4 h-4" />
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
      
      {/* Pagination */}
      {returnsData.length > 0 && (
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="returns-page-size" className="text-sm font-medium whitespace-nowrap">
            Items per page:
          </Label>
          <Select 
            value={String(pageSize)} 
            onValueChange={value => { 
              setPageSize(Number(value)); 
              setCurrentPage(1); 
            }}
          >
            <SelectTrigger className="w-32" id="returns-page-size">
              <SelectValue placeholder="Page Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="0">All</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, returnsData.length)} of {returnsData.length} returns
          </span>
        </div>

        {pageSize !== 0 && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        )}
      </div>
    )}
      </>
    )
  }

  if (loading) {
    return <PageLoader message="Loading returns..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Returns & Exchange</h1>
          <p className="text-sm md:text-base text-gray-600">Process customer returns and refunds</p>
        </div>
        <Dialog
          open={isProcessOpen}
          onOpenChange={(open) => {
            // Prevent closing modal while processing
            if (!open && processingReturn) {
              return
            }
            // Closing the dialog should drop any inline error state so it
            // doesn't blink on the next open.
            if (!open) setFormErrors({})
            setIsProcessOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Process Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {newReturn.returnType === "EXCHANGE" ? "Process Exchange" : "Process Refund"}
              </DialogTitle>
              <DialogDescription>
                {newReturn.returnType === "EXCHANGE"
                  ? "Swap returned items for new ones."
                  : "Refund a customer for returned items."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2" ref={saleDropdownRef}>
                <Label htmlFor="sale-search">Select Sale *</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    ref={saleSearchInputRef}
                    id="sale-search"
                    placeholder="Search by sale #, customer name, or email"
                    value={saleSearch}
                    onFocus={() => setSaleDropdownOpen(true)}
                    autoComplete="off"
                    onPaste={handleSaleSearchPaste}
                    onChange={(e) => {
                      triggerSaleSearch(e.target.value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        triggerSaleSearch(saleSearch, { immediate: true })
                      }
                    }}
                    className="pl-9"
                  />
                  {saleDropdownOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {salesLoading || saleSearchPending ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          <span className="ml-2 text-sm text-gray-500">Searching sales...</span>
                        </div>
                      ) : filteredSales.length === 0 && ineligibleSaleMatch ? (
                        <div className="px-3 py-6 text-center">
                          <XCircle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                          <p className="text-sm font-medium text-gray-700">
                            {ineligibleSaleMatch.saleNumber} is {ineligibleSaleMatch.status}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {ineligibleSaleMatch.reason}
                          </p>
                        </div>
                      ) : filteredSales.length === 0 ? (
                        <div className="px-3 py-10 text-center">
                          <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No matching sales found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different sale # or customer info</p>
                        </div>
                      ) : (
                        filteredSales.map((sale) => (
                          <button
                            key={sale.id}
                            type="button"
                            className={`w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 ${
                              newReturn.saleId === sale.id
                                ? "bg-blue-50 font-semibold text-blue-900"
                                : "text-gray-800"
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSaleSelect(sale.id)}
                          >
                            <div className="flex flex-col">
                              <span>{sale.sale_number}</span>
                              <span className="text-xs text-gray-500">
                                {sale.customer?.name || sale.customer?.email || "No customer"} • Rs{" "}
                                {Math.abs(Number(sale.total_amount)).toLocaleString()}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedSale && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium mb-2">Selected Sale Details</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Sale Number:</strong> {selectedSale.sale_number}</div>
                    <div><strong>Customer:</strong> {selectedSale.customer?.name || selectedSale.customer?.email || "N/A"}</div>
                    <div><strong>Total Amount:</strong> Rs {Math.abs(Number(selectedSale.total_amount)).toLocaleString()}</div>
                    <div><strong>Items:</strong> {selectedSale.sale_items.length}</div>
                  </div>
                </div>
              )}

              {/* Return Type Selection */}
              <div className="space-y-2">
                <Label>Return Type *</Label>
                <RadioGroup
                  value={newReturn.returnType}
                  onValueChange={(value: "REFUND" | "EXCHANGE") => {
                    setNewReturn((prev) => ({
                      ...prev,
                      returnType: value,
                      refundMethod: value === "EXCHANGE" ? "" : prev.refundMethod,
                    }))
                    if (value === "EXCHANGE") {
                      setExchangeItems([])
                      setNewReturn((prev) => ({ ...prev, exchangedItems: [] }))
                    }
                    // Switching mode invalidates the previous mode's errors.
                    setFormErrors({})
                  }}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REFUND" id="refund" />
                    <Label htmlFor="refund" className="font-normal cursor-pointer">
                      Refund
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EXCHANGE" id="exchange" />
                    <Label htmlFor="exchange" className="font-normal cursor-pointer">
                      Exchange
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Refund Method Selection (only for Refund) */}
              {newReturn.returnType === "REFUND" && (
                <div className="space-y-2">
                  <Label htmlFor="refund-method">Refund Method *</Label>
                  <Select
                    value={newReturn.refundMethod || ""}
                    onValueChange={(value) => {
                      setNewReturn((prev) => ({ ...prev, refundMethod: value }))
                      // Clear the inline error as soon as the user picks a method.
                      if (formErrors.refundMethod) {
                        setFormErrors((prev) => ({ ...prev, refundMethod: undefined }))
                      }
                    }}
                  >
                    <SelectTrigger
                      id="refund-method"
                      aria-invalid={formErrors.refundMethod ? true : undefined}
                      className={
                        formErrors.refundMethod
                          ? "border-red-500 focus:ring-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select refund method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                      <SelectItem value="original_payment">Original Payment Method</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.refundMethod && (
                    <p className="text-sm text-red-600 mt-1" role="alert">
                      {formErrors.refundMethod}
                    </p>
                  )}
                </div>
              )}

              {formErrors.items && (
                <p className="text-sm text-red-600" role="alert">
                  {formErrors.items}
                </p>
              )}
              {formErrors.exchangeItems && (
                <p className="text-sm text-red-600" role="alert">
                  {formErrors.exchangeItems}
                </p>
              )}

              {selectedReturnItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Items to Return</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    {selectedReturnItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku} • Original Qty: {item.originalQuantity} • Price: Rs {Number(item.unitPrice).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnQuantityChange(item.productId, item.returnQuantity - 1)}
                            // Minimum return qty is 1 — going to 0 means
                            // "refund nothing of this item", which doesn't
                            // make sense for an item that's in the return
                            // list.
                            disabled={item.returnQuantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="text"
                            inputMode="decimal"
                            // Lock the input when there's only one valid
                            // value (originalQuantity === 1). Same logic as
                            // the - and + buttons being disabled.
                            disabled={item.originalQuantity <= 1}
                            value={returnQuantityInputs[item.productId] !== undefined ? returnQuantityInputs[item.productId] : (item.returnQuantity === 0 ? "" : String(item.returnQuantity))}
                            onChange={(e) => {
                              const value = e.target.value
                              
                              // Update local input state
                              setReturnQuantityInputs(prev => ({ ...prev, [item.productId]: value }))
                              
                              // Allow empty string - clear the value
                              if (value === "") {
                                setSelectedReturnItems((prev) =>
                                  prev.map((i) =>
                                    i.productId === item.productId
                                      ? { ...i, returnQuantity: 0 }
                                      : i
                                  )
                                )
                                return
                              }
                              
                              // Allow decimal point and numbers - validate format
                              if (/^(\d*\.?\d*)$/.test(value)) {
                                // If it's just a decimal point, don't update yet
                                if (value === ".") {
                                  return
                                }
                                
                                const numValue = parseFloat(value)
                                if (!isNaN(numValue) && numValue >= 0) {
                                  // Validate: cannot exceed originalQuantity
                                  if (numValue > item.originalQuantity) {
                                    // Show error toast when exceeding original quantity
                                    toast({
                                      title: "Invalid Return Quantity",
                                      description: `Return quantity (${numValue}) cannot exceed original sale quantity (${item.originalQuantity}) for ${item.productName}.`,
                                      variant: "destructive",
                                    })
                                    // Set to max allowed (originalQuantity)
                                    const validQuantity = item.originalQuantity
                                    setSelectedReturnItems((prev) =>
                                      prev.map((i) =>
                                        i.productId === item.productId
                                          ? { ...i, returnQuantity: validQuantity }
                                          : i
                                      )
                                    )
                                    // Update local input to show the corrected value
                                    setReturnQuantityInputs(prev => ({ ...prev, [item.productId]: String(validQuantity) }))
                                  } else {
                                    const validQuantity = numValue
                                    setSelectedReturnItems((prev) =>
                                      prev.map((i) =>
                                        i.productId === item.productId
                                          ? { ...i, returnQuantity: validQuantity }
                                          : i
                                      )
                                    )
                                  }
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim()
                              // Clear local input state
                              setReturnQuantityInputs(prev => {
                                const newState = { ...prev }
                                delete newState[item.productId]
                                return newState
                              })
                              
                              // If empty or just a decimal point, set to 0
                              if (value === "" || value === "." || value === "0") {
                                setSelectedReturnItems((prev) =>
                                  prev.map((i) =>
                                    i.productId === item.productId
                                      ? { ...i, returnQuantity: 0 }
                                      : i
                                  )
                                )
                              } else {
                                // Ensure valid number on blur
                                const numValue = parseFloat(value)
                                if (!isNaN(numValue) && numValue >= 0) {
                                  // Validate: cannot exceed originalQuantity
                                  if (numValue > item.originalQuantity) {
                                    // Show error toast when exceeding original quantity
                                    toast({
                                      title: "Invalid Return Quantity",
                                      description: `Return quantity (${numValue}) cannot exceed original sale quantity (${item.originalQuantity}) for ${item.productName}.`,
                                      variant: "destructive",
                                    })
                                    // Set to max allowed (originalQuantity)
                                    const validQuantity = item.originalQuantity
                                    setSelectedReturnItems((prev) =>
                                      prev.map((i) =>
                                        i.productId === item.productId
                                          ? { ...i, returnQuantity: validQuantity }
                                          : i
                                      )
                                    )
                                  } else {
                                    const validQuantity = numValue
                                    setSelectedReturnItems((prev) =>
                                      prev.map((i) =>
                                        i.productId === item.productId
                                          ? { ...i, returnQuantity: validQuantity }
                                          : i
                                      )
                                    )
                                  }
                                } else {
                                  // Invalid, reset to 0
                                  setSelectedReturnItems((prev) =>
                                    prev.map((i) =>
                                      i.productId === item.productId
                                        ? { ...i, returnQuantity: 0 }
                                        : i
                                    )
                                  )
                                }
                              }
                            }}
                            className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnQuantityChange(item.productId, item.returnQuantity + 1)}
                            disabled={item.returnQuantity >= item.originalQuantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Return Summary */}
                  {selectedReturnItems.some(item => item.returnQuantity > 0) && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Return Summary</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>
                          <strong>Items to Return:</strong> {selectedReturnItems.filter(item => item.returnQuantity > 0).length}
                        </div>
                        <div>
                          <strong>Total Return Value:</strong> Rs {selectedReturnItems
                            .reduce((total, item) => total + (item.returnQuantity * item.unitPrice), 0)
                            .toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Exchange Items Section (only for Exchange) */}
              {newReturn.returnType === "EXCHANGE" && (
                <div className="space-y-2" ref={exchangeProductDropdownRef}>
                  <Label htmlFor="exchange-product-search">
                    Add Exchange Items ({filteredExchangeProducts.length} available)
                  </Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      ref={exchangeProductSearchRef}
                      id="exchange-product-search"
                      placeholder="Search products by name or SKU..."
                      value={exchangeProductSearch}
                      onFocus={() => setExchangeProductDropdownOpen(true)}
                      autoComplete="off"
                      onChange={(e) => {
                        setExchangeProductSearch(e.target.value)
                        setExchangeProductDropdownOpen(true)
                      }}
                      className="pl-9"
                    />
                    {exchangeProductDropdownOpen && (
                      <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {productsLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Loading products...
                          </div>
                        ) : filteredExchangeProducts.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            {exchangeProductSearch ? "No matching products found" : "No products available"}
                          </div>
                        ) : (
                          filteredExchangeProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 text-gray-800"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleExchangeProductSelect(product.id)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-xs text-gray-500">
                                  SKU: {product.sku || "N/A"} | Rs{" "}
                                  {product.sales_rate_inc_dis_and_tax || product.sales_rate_exc_dis_and_tax || product.purchase_rate || 0}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exchange Items List */}
                  {exchangeItems.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3 mt-4">
                      <Label>Exchange Items</Label>
                      {exchangeItems.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.sku} • Price: Rs {Number(item.price).toLocaleString()}
                            </div>
                            <div className="text-sm font-semibold text-green-700 mt-0.5">
                              Subtotal: Rs{" "}
                              {(item.quantity * item.price).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleExchangeQuantityChange(
                                  item.productId,
                                  Math.max(0, Number((item.quantity - 1).toFixed(3))),
                                )
                              }
                              disabled={item.quantity <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.001"
                              min="0"
                              // Show the draft while editing; fall back to the
                              // canonical quantity once the user blurs. This
                              // prevents the "022" concat where typing into a
                              // cleared field appended to a leading "0".
                              value={
                                exchangeQtyDrafts[item.productId] ??
                                String(item.quantity)
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setExchangeQtyDrafts((d) => ({
                                  ...d,
                                  [item.productId]: v,
                                }));
                                if (v === "") {
                                  handleExchangeQuantityChange(item.productId, 0);
                                  return;
                                }
                                const n = Number(v);
                                if (Number.isFinite(n) && n >= 0) {
                                  handleExchangeQuantityChange(item.productId, n);
                                }
                              }}
                              onBlur={() => {
                                // Commit: drop the draft so the controlled
                                // input reflects the canonical, clean number.
                                setExchangeQtyDrafts((d) => {
                                  const { [item.productId]: _drop, ...rest } = d;
                                  return rest;
                                });
                              }}
                              className="w-20 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {item.unit && (
                              <span className="text-sm text-gray-500 min-w-[2rem]">
                                {item.unit}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleExchangeQuantityChange(
                                  item.productId,
                                  Number((item.quantity + 1).toFixed(3)),
                                )
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeExchangeItem(item.productId)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Exchange Summary */}
                      <div className="bg-green-50 border border-green-100 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold text-green-900 mb-3">Exchange Summary</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex flex-col">
                            <span className="text-green-700">Items</span>
                            <span className="font-semibold text-green-900 text-base">
                              {exchangeItems.length}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-green-700">Total Quantity</span>
                            <span className="font-semibold text-green-900 text-base">
                              {exchangeItems
                                .reduce((total, item) => total + item.quantity, 0)
                                .toLocaleString("en-US", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 3,
                                })}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-green-700">Total Exchange Value</span>
                            <span className="font-bold text-green-900 text-base">
                              Rs{" "}
                              {exchangeItems
                                .reduce(
                                  (total, item) => total + item.quantity * item.price,
                                  0,
                                )
                                .toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the return"
                  value={newReturn.notes}
                  onChange={(e) => setNewReturn((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsProcessOpen(false)}
                disabled={processingReturn}
              >
                Cancel
              </Button>
              <Button onClick={handleProcessReturn} disabled={processingReturn}>
                {processingReturn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {processingReturn
                  ? newReturn.returnType === "EXCHANGE"
                    ? "Processing exchange..."
                    : "Processing refund..."
                  : newReturn.returnType === "EXCHANGE"
                    ? "Process Exchange"
                    : "Process Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                <CardTitle className="text-sm font-medium">Today's Returns</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayReturns}</div>
                <p className="text-xs text-muted-foreground">{returnsDeltaText}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Return Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {todayValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Today's total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Return Rate</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{returnRate}%</div>
                <p className="text-xs text-muted-foreground">Of total sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReturns}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Returns ({filteredReturns.length})</TabsTrigger>
          <TabsTrigger value="REFUNDED">Refunded ({getFilteredReturnsByStatus("REFUNDED").length})</TabsTrigger>
          <TabsTrigger value="EXCHANGED">Exchanged ({getFilteredReturnsByStatus("EXCHANGED").length})</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search returns or paste a sale #"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {normalizeSaleSearchTerm(searchTerm) && filteredReturns.length === 0 && pageSearchMatchingSales.length > 0 && (
          <Alert className="border-green-200 bg-green-50 text-green-950">
            <CheckCircle className="h-4 w-4 text-green-700" />
            <AlertTitle>Matching sales ready for return</AlertTitle>
            <AlertDescription>
              These sales have not been returned yet. You can start the return flow directly from here.
            </AlertDescription>
            <div className="mt-4 space-y-3">
              {pageSearchMatchingSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col gap-3 rounded-lg border border-green-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{sale.sale_number}</span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">READY FOR RETURN</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {sale.customer?.name || sale.customer?.email || "Walk-in customer"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sale.sale_date).toLocaleDateString()} | Rs {Math.abs(Number(sale.total_amount)).toLocaleString()}
                    </div>
                  </div>
                  <Button onClick={() => handleStartReturnForSale(sale.id)}>
                    Process Return
                  </Button>
                </div>
              ))}
            </div>
          </Alert>
        )}

        {normalizeSaleSearchTerm(searchTerm) &&
          filteredReturns.length === 0 &&
          pageSearchMatchingSales.length === 0 &&
          pageSearchIneligibleSaleMatch && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-950">
              <XCircle className="h-4 w-4 text-amber-700" />
              <AlertTitle>
                {pageSearchIneligibleSaleMatch.saleNumber} is {pageSearchIneligibleSaleMatch.status}
              </AlertTitle>
              <AlertDescription>{pageSearchIneligibleSaleMatch.reason}</AlertDescription>
            </Alert>
          )}

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Returns & Exchange</CardTitle>
              <CardDescription>Manage all customer returns and refunds</CardDescription>
            </CardHeader>
            <CardContent>{renderReturnsTable(getFilteredReturnsByStatus("all"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="REFUNDED">
          <Card>
            <CardHeader>
              <CardTitle>Refunded Sales</CardTitle>
              <CardDescription>Sales that have been refunded to customers</CardDescription>
            </CardHeader>
            <CardContent>{renderReturnsTable(getFilteredReturnsByStatus("REFUNDED"))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="EXCHANGED">
          <Card>
            <CardHeader>
              <CardTitle>Exchanged Sales</CardTitle>
              <CardDescription>Sales that have been exchanged for other products</CardDescription>
            </CardHeader>
            <CardContent>{renderReturnsTable(getFilteredReturnsByStatus("EXCHANGED"))}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Return Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Return Details - {selectedReturn?.sale_number || selectedReturn?.id}
            </DialogTitle>
            <DialogDescription>
              Review return/refund transaction details and item-level impact.
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sale Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Sale ID:</strong> {selectedReturn.id}
                    </div>
                    <div>
                      <strong>Sale Number:</strong> {selectedReturn.sale_number}
                    </div>
                    <div>
                      <strong>Date:</strong> {new Date(selectedReturn.sale_date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusColor(selectedReturn.status)}>{selectedReturn.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Customer & Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Customer:</strong> {selectedReturn.customer?.name || selectedReturn.customer?.email || "N/A"}
                    </div>
                    <div>
                      <strong>Payment Method:</strong> {selectedReturn.payment_method}
                    </div>
                    <div>
                      <strong>Total Amount:</strong> Rs {Math.abs(Number(selectedReturn.total_amount)).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedReturn.sale_items && selectedReturn.sale_items.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sale Items ({selectedReturn.sale_items.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="border rounded-lg p-4">
                    {selectedReturn.sale_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            Qty: {item.quantity} • SKU: {item.product.sku} • Type: {item.item_type}
                          </div>
                        </div>
                        <div className="font-semibold text-red-700">Rs {Number(item.line_total).toLocaleString()}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {selectedReturn.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">{selectedReturn.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-2">
            <div className="flex flex-wrap items-center gap-2 w-full justify-end">
              {printers.length > 0 && (
                <Button
                  onClick={handleServerPrint}
                  disabled={!receiptPrinter || !receiptData}
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                disabled={!receiptData}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={handleShareReceiptOnWhatsApp}
                disabled={!receiptData}
                className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Share on WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
