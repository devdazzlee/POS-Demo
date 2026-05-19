"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Loader2 } from "lucide-react"
import apiClient from "@/lib/apiClient"
import { API_ENDPOINTS } from "@/config/constants"
import { useToast } from "@/hooks/use-toast"

interface DropdownOption {
  id: string
  name: string
}

const EXPORT_COLUMNS = [
  { key: "product_id", label: "Product ID" },
  { key: "product_code", label: "Product Code" },
  { key: "product_name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "barcode", label: "Barcode (9-digit SKU)" },
  { key: "description", label: "Description" },
  { key: "hs_code", label: "PCT / HS Code" },
  { key: "purchase_rate", label: "Purchase Rate" },
  { key: "sales_rate_exc", label: "Sales Rate (Exc Tax/Discount)" },
  { key: "sales_rate_inc", label: "Sales Rate (Inc Tax/Discount)" },
  { key: "discount_amount", label: "Discount Amount" },
  { key: "category_id", label: "Category ID" },
  { key: "category_name", label: "Category" },
  { key: "category_code", label: "Category Code" },
  { key: "subcategory_id", label: "Subcategory ID" },
  { key: "subcategory_name", label: "Subcategory" },
  { key: "subcategory_code", label: "Subcategory Code" },
  { key: "unit_id", label: "Unit ID" },
  { key: "unit_name", label: "Unit" },
  { key: "unit_code", label: "Unit Code" },
  { key: "tax_id", label: "Tax ID" },
  { key: "tax_name", label: "Tax" },
  { key: "tax_code", label: "Tax Code" },
  { key: "tax_percentage", label: "Tax Percentage" },
  { key: "supplier_id", label: "Supplier ID" },
  { key: "supplier_name", label: "Supplier" },
  { key: "supplier_code", label: "Supplier Code" },
  { key: "brand_id", label: "Brand ID" },
  { key: "brand_name", label: "Brand" },
  { key: "brand_code", label: "Brand Code" },
  { key: "color_id", label: "Color ID" },
  { key: "color_name", label: "Color" },
  { key: "color_code", label: "Color Code" },
  { key: "size_id", label: "Size ID" },
  { key: "size_name", label: "Size" },
  { key: "size_code", label: "Size Code" },
  { key: "min_qty", label: "Min Quantity" },
  { key: "max_qty", label: "Max Quantity" },
  { key: "current_stock", label: "Current Stock" },
  { key: "reserved_stock", label: "Reserved Stock" },
  { key: "available_stock", label: "Available Stock" },
  { key: "minimum_stock", label: "Minimum Stock" },
  { key: "maximum_stock", label: "Maximum Stock" },
  { key: "is_active", label: "Active?" },
  { key: "display_on_pos", label: "Display On POS?" },
  { key: "is_batch", label: "Batch Item?" },
  { key: "auto_fill_on_demand_sheet", label: "Auto Fill On Demand Sheet?" },
  { key: "non_inventory_item", label: "Non Inventory Item?" },
  { key: "is_deal", label: "Deal Item?" },
  { key: "is_featured", label: "Featured?" },
  { key: "has_images", label: "Has Images?" },
  { key: "first_image_url", label: "First Image URL" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
] as const

export function ProductExport() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [categories, setCategories] = useState<DropdownOption[]>([])
  const [subcategories, setSubcategories] = useState<DropdownOption[]>([])
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([])
  const [brands, setBrands] = useState<DropdownOption[]>([])

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [subcategoryId, setSubcategoryId] = useState("all")
  const [supplierId, setSupplierId] = useState("all")
  const [brandId, setBrandId] = useState("all")
  const [isActive, setIsActive] = useState("all")
  const [displayOnPos, setDisplayOnPos] = useState("all")
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.map((column) => column.key)
  )

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [categoriesRes, subcategoriesRes, suppliersRes, brandsRes] = await Promise.all([
          apiClient.get("/categories"),
          apiClient.get("/subcategories"),
          apiClient.get("/suppliers"),
          apiClient.get("/brands"),
        ])

        setCategories(categoriesRes.data?.data || [])
        setSubcategories(subcategoriesRes.data?.data || [])
        setSuppliers(suppliersRes.data?.data || [])
        setBrands(brandsRes.data?.data || [])
      } catch {
        toast({
          title: "Error",
          description: "Failed to load export filters",
          variant: "destructive",
        })
      }
    }

    loadFiltersData()
  }, [toast])

  const clearFilters = () => {
    setSearch("")
    setCategoryId("all")
    setSubcategoryId("all")
    setSupplierId("all")
    setBrandId("all")
    setIsActive("all")
    setDisplayOnPos("all")
    setSelectedColumns(EXPORT_COLUMNS.map((column) => column.key))
  }

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((item) => item !== columnKey) : [...prev, columnKey]
    )
  }

  const selectAllColumns = () => {
    setSelectedColumns(EXPORT_COLUMNS.map((column) => column.key))
  }

  const clearAllColumns = () => {
    setSelectedColumns([])
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field for export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const params: Record<string, string> = {}

      if (search.trim()) params.search = search.trim()
      if (categoryId !== "all") params.category_id = categoryId
      if (subcategoryId !== "all") params.subcategory_id = subcategoryId
      if (supplierId !== "all") params.supplier_id = supplierId
      if (brandId !== "all") params.brand_id = brandId
      if (isActive !== "all") params.is_active = isActive
      if (displayOnPos !== "all") params.display_on_pos = displayOnPos
      params.columns = selectedColumns.join(",")

      const response = await apiClient.get(API_ENDPOINTS.PRODUCT_EXPORT_EXCEL, {
        params,
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `products-export-${new Date().toISOString().split("T")[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export started",
        description: "Your Excel file has been downloaded.",
      })
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export products right now.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Export</h1>
        <p className="text-sm md:text-base text-gray-600">
          Export products to Excel with category details and real barcode values.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Name, SKU or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="All subcategories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subcategories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="All suppliers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {suppliers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="All brands" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {brands.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display on POS</Label>
              <Select value={displayOnPos} onValueChange={setDisplayOnPos}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={clearFilters} disabled={isExporting}>
              Clear Filters
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Fields For Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={selectAllColumns} disabled={isExporting}>
              Select All
            </Button>
            <Button type="button" variant="outline" onClick={clearAllColumns} disabled={isExporting}>
              Clear All
            </Button>
            <p className="text-sm text-gray-600 self-center">
              Selected: {selectedColumns.length} / {EXPORT_COLUMNS.length}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-auto pr-1">
            {EXPORT_COLUMNS.map((column) => (
              <label key={column.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedColumns.includes(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
