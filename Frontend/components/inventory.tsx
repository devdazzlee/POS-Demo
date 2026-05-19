"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/ui/page-loader"
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Package, AlertTriangle, Upload, X, ImageIcon, RefreshCw, Loader2 } from "lucide-react"
import apiClient from "@/lib/apiClient"
import { usePosData } from "@/hooks/use-pos-data"
import { usePosBranch } from "@/hooks/use-pos-branch"

// Image compression utility
const compressImage = (file: File, quality = 0.7, maxWidth = 800, maxHeight = 600): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error("Canvas to Blob conversion failed"))
          }
        },
        file.type,
        quality,
      )
    }

    img.onerror = () => reject(new Error("Image load failed"))
    img.src = URL.createObjectURL(file)
  })
}

// Types and Interfaces
interface DropdownOption {
  id: string
  name: string
  percentage?: number // for taxes
  is_active?: boolean
}

interface Product {
  id: string
  name: string
  sku: string
  code: string
  pct_or_hs_code?: string
  description?: string
  purchase_rate: number
  sales_rate_exc_dis_and_tax: number
  sales_rate_inc_dis_and_tax: number
  discount_amount?: number
  min_qty?: number
  max_qty?: number
  is_active: boolean
  display_on_pos: boolean
  is_batch: boolean
  auto_fill_on_demand_sheet: boolean
  non_inventory_item: boolean
  is_deal: boolean
  is_featured: boolean
  unit?: DropdownOption
  tax?: DropdownOption
  category?: DropdownOption
  subcategory?: DropdownOption
  supplier?: DropdownOption
  brand?: DropdownOption
  color?: DropdownOption
  size?: DropdownOption
  created_at: string
  updated_at: string
  images?: { image: string }[]
  available_stock?: number
  current_stock?: number
  reserved_stock?: number
  minimum_stock?: number
  maximum_stock?: number
}

interface ProductFormData {
  name: string
  unit_id: string
  pct_or_hs_code?: string
  description?: string
  sku: string
  purchase_rate: number
  sales_rate_exc_dis_and_tax: number
  sales_rate_inc_dis_and_tax: number
  discount_amount?: number
  tax_id?: string
  category_id: string
  subcategory_id?: string
  min_qty?: number
  max_qty?: number
  supplier_id?: string
  brand_id?: string
  color_id?: string
  size_id?: string
  is_active?: boolean
  display_on_pos?: boolean
  is_batch?: boolean
  auto_fill_on_demand_sheet?: boolean
  non_inventory_item?: boolean
  is_deal?: boolean
  is_featured?: boolean
  images?: (string | File)[]
}

const ProductForm = ({
  onSubmit,
  loading,
  submitText,
  formData,
  formErrors,
  updateFormData,
  units,
  categories,
  subcategories,
  taxes,
  suppliers,
  brands,
  colors,
  sizes,
  imagePreviews,
  handleRemoveImage,
  fileInputRef,
  handleImageSelect,
  stockToAdd,
  setStockToAdd,
  stockBranchIds,
  setStockBranchIds,
  branchOptions,
  stockLabel,
  currentBranchStocks,
}: {
  onSubmit: () => void
  loading: boolean
  submitText: string
  formData: ProductFormData
  formErrors: { sku?: string; pct_or_hs_code?: string }
  updateFormData: (field: keyof ProductFormData, value: any) => void
  units: DropdownOption[]
  categories: DropdownOption[]
  subcategories: DropdownOption[]
  taxes: DropdownOption[]
  suppliers: DropdownOption[]
  brands: DropdownOption[]
  colors: DropdownOption[]
  sizes: DropdownOption[]
  imagePreviews: string[]
  handleRemoveImage: (index: number) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  stockToAdd: number
  setStockToAdd: (n: number) => void
  stockBranchIds: string[]
  setStockBranchIds: (ids: string[]) => void
  branchOptions: Array<{ id: string; name: string; code?: string }>
  stockLabel: string
  currentBranchStocks?: Record<string, number>
}) => {
  const hasErrors = Object.values(formErrors).some((error) => !!error)

  // Raw text state for numeric inputs. We keep it independent of formData
  // so users can naturally type "0.", "1.5", clear to empty, etc., without the
  // displayed string fighting the numeric model. On blur we drop the raw
  // entry so the input falls back to displaying the canonical formData value
  // ("" when zero, the number itself otherwise).
  const [rawNumberInputs, setRawNumberInputs] = useState<Record<string, string>>({})

  const numberDisplayValue = (field: string, value: number | undefined): string => {
    if (rawNumberInputs[field] !== undefined) return rawNumberInputs[field]
    return value && value !== 0 ? String(value) : ""
  }

  const buildNumberHandlers = (
    field: keyof ProductFormData,
    opts: { integer?: boolean } = {},
  ) => {
    const pattern = opts.integer ? /^\d*$/ : /^\d*\.?\d*$/
    return {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        if (v !== "" && !pattern.test(v)) return
        setRawNumberInputs((prev) => ({ ...prev, [field]: v }))
        if (v === "" || v === ".") {
          updateFormData(field, 0)
          return
        }
        const n = opts.integer ? parseInt(v, 10) : parseFloat(v)
        updateFormData(field, Number.isFinite(n) ? n : 0)
      },
      onBlur: () => {
        setRawNumberInputs((prev) => {
          const next = { ...prev }
          delete next[field as string]
          return next
        })
      },
    }
  }

  // Hides native browser number spinners on text-type inputs and keeps focus
  // styling consistent with the rest of the form.
  const numberInputClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <Label htmlFor="unit_id">Unit *</Label>
            <Select value={formData.unit_id} onValueChange={(value) => updateFormData("unit_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category_id">Category *</Label>
            <Select value={formData.category_id} onValueChange={(value) => updateFormData("category_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subcategory_id">Subcategory</Label>
            <Select
              value={formData.subcategory_id || ""}
              onValueChange={(value) => updateFormData("subcategory_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => updateFormData("description", e.target.value)}
            placeholder="Enter product description"
            rows={3}
          />
        </div>
      </div>

      {/* Pricing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase_rate">Purchase Rate *</Label>
            <Input
              id="purchase_rate"
              type="text"
              inputMode="decimal"
              value={numberDisplayValue("purchase_rate", formData.purchase_rate)}
              {...buildNumberHandlers("purchase_rate")}
              placeholder="0.00"
              className={numberInputClass}
            />
          </div>
          <div>
            <Label htmlFor="sales_rate">Sales Rate *</Label>
            <Input
              id="sales_rate"
              type="text"
              inputMode="decimal"
              value={numberDisplayValue(
                "sales_rate_inc_dis_and_tax",
                formData.sales_rate_inc_dis_and_tax,
              )}
              onChange={(e) => {
                const v = e.target.value
                if (v !== "" && !/^\d*\.?\d*$/.test(v)) return
                setRawNumberInputs((prev) => ({
                  ...prev,
                  sales_rate_inc_dis_and_tax: v,
                  sales_rate_exc_dis_and_tax: v,
                }))
                const n = v === "" || v === "." ? 0 : parseFloat(v)
                const safe = Number.isFinite(n) ? n : 0
                // Mirror the single user-facing price into both DB columns
                // so existing queries (POS, reports) that read either field
                // continue to work without change.
                updateFormData("sales_rate_inc_dis_and_tax", safe)
                updateFormData("sales_rate_exc_dis_and_tax", safe)
              }}
              onBlur={() => {
                setRawNumberInputs((prev) => {
                  const next = { ...prev }
                  delete next.sales_rate_inc_dis_and_tax
                  delete next.sales_rate_exc_dis_and_tax
                  return next
                })
              }}
              placeholder="0.00"
              className={numberInputClass}
            />
          </div>
        </div>
      </div>

      {/* Inventory Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Inventory Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_qty">Minimum Quantity</Label>
            <Input
              id="min_qty"
              type="text"
              inputMode="numeric"
              value={numberDisplayValue("min_qty", formData.min_qty)}
              {...buildNumberHandlers("min_qty", { integer: true })}
              placeholder="0"
              className={numberInputClass}
            />
          </div>
          <div>
            <Label htmlFor="max_qty">Maximum Quantity</Label>
            <Input
              id="max_qty"
              type="text"
              inputMode="numeric"
              value={numberDisplayValue("max_qty", formData.max_qty)}
              {...buildNumberHandlers("max_qty", { integer: true })}
              placeholder="0"
              className={numberInputClass}
            />
          </div>
        </div>

        {/* Stock — optional. When set, fires a POST /stock after the product
            save succeeds (adds to existing branch stock + logs a movement). */}
        {(() => {
          // Total current stock across the branches the user has selected, so
          // the "Add Stock" field sits next to a clear "you currently have X"
          // signal. Without this users couldn't tell why their stock column
          // showed an unexpected number.
          const totalCurrent = stockBranchIds.reduce(
            (sum, id) => sum + (currentBranchStocks?.[id] ?? 0),
            0,
          )
          const hasAnyCurrent =
            currentBranchStocks && Object.keys(currentBranchStocks).length > 0

          return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock_to_add">{stockLabel}</Label>
            <Input
              id="stock_to_add"
              type="text"
              inputMode="decimal"
              value={
                rawNumberInputs["stock_to_add"] !== undefined
                  ? rawNumberInputs["stock_to_add"]
                  : stockToAdd && stockToAdd !== 0
                    ? String(stockToAdd)
                    : ""
              }
              onChange={(e) => {
                const v = e.target.value
                if (v !== "" && !/^\d*\.?\d*$/.test(v)) return
                setRawNumberInputs((prev) => ({ ...prev, stock_to_add: v }))
                const n = v === "" || v === "." ? 0 : parseFloat(v)
                setStockToAdd(Number.isFinite(n) ? n : 0)
              }}
              onBlur={() => {
                setRawNumberInputs((prev) => {
                  const next = { ...prev }
                  delete next["stock_to_add"]
                  return next
                })
              }}
              placeholder="0"
              className={numberInputClass}
            />
            {hasAnyCurrent ? (
              <p className="text-xs text-gray-500 mt-1">
                Current{stockBranchIds.length > 1 ? " (selected branches)" : ""}:{" "}
                <span className="font-semibold text-gray-700">
                  {totalCurrent}
                </span>
                . Entering a number adds to it.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Optional. Leave empty to skip.
              </p>
            )}
          </div>
          <div>
            <Label>Branches</Label>
            {(() => {
              const allChecked =
                branchOptions.length > 0 && stockBranchIds.length === branchOptions.length
              const someChecked = stockBranchIds.length > 0 && !allChecked
              const triggerLabel =
                branchOptions.length === 0
                  ? "No branches available"
                  : stockBranchIds.length === 0
                    ? "Select branches"
                    : allChecked
                      ? `All branches (${branchOptions.length})`
                      : stockBranchIds.length === 1
                        ? branchOptions.find((b) => b.id === stockBranchIds[0])?.name ||
                          "1 branch"
                        : `${stockBranchIds.length} branches selected`

              const toggleBranch = (id: string, checked: boolean) => {
                if (checked) {
                  if (!stockBranchIds.includes(id)) {
                    setStockBranchIds([...stockBranchIds, id])
                  }
                } else {
                  setStockBranchIds(stockBranchIds.filter((x) => x !== id))
                }
              }

              const toggleAll = (checked: boolean) => {
                setStockBranchIds(checked ? branchOptions.map((b) => b.id) : [])
              }

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      disabled={branchOptions.length === 0}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-left">{triggerLabel}</span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                    <div className="flex items-center gap-2 px-2 py-1.5 border-b mb-1">
                      <Checkbox
                        id="stock-branch-all"
                        checked={allChecked || (someChecked && "indeterminate")}
                        onCheckedChange={(checked) => toggleAll(checked === true)}
                      />
                      <Label
                        htmlFor="stock-branch-all"
                        className="text-sm font-semibold cursor-pointer flex-1"
                      >
                        All branches
                      </Label>
                      <span className="text-xs text-gray-500">
                        {stockBranchIds.length}/{branchOptions.length}
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {branchOptions.map((b) => {
                        const checked = stockBranchIds.includes(b.id)
                        const current = currentBranchStocks?.[b.id]
                        return (
                          <div
                            key={b.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleBranch(b.id, !checked)}
                          >
                            <Checkbox
                              id={`stock-branch-${b.id}`}
                              checked={checked}
                              onCheckedChange={(c) => toggleBranch(b.id, c === true)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                              htmlFor={`stock-branch-${b.id}`}
                              className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>
                                {b.name}
                                {b.code ? (
                                  <span className="text-gray-400"> ({b.code})</span>
                                ) : null}
                              </span>
                              {current !== undefined && (
                                <span
                                  className={`text-xs ml-2 ${
                                    current > 0 ? "text-emerald-600" : "text-gray-400"
                                  }`}
                                >
                                  {current}
                                </span>
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })()}
            <p className="text-xs text-gray-500 mt-1">
              Stock is added to each selected branch.
            </p>
          </div>
        </div>
          )
        })()}
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id || ""}
              onValueChange={(value) => updateFormData("supplier_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="brand_id">Brand</Label>
            <Select
              value={formData.brand_id || ""}
              onValueChange={(value) => updateFormData("brand_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color_id">Color</Label>
            <Select
              value={formData.color_id || ""}
              onValueChange={(value) => updateFormData("color_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {colors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    {color.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="size_id">Size</Label>
            <Select
              value={formData.size_id || ""}
              onValueChange={(value) => updateFormData("size_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Images</h3>
        <div className="space-y-2">
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click or drag to upload images</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB (max 10 images)</p>
          </div>
          <input
            ref={fileInputRef}
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={loading || imagePreviews.length >= 10}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateFormData("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => updateFormData("is_featured", checked)}
            />
            <Label htmlFor="is_featured">Is Featured</Label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={
            // SKU is no longer a UI field — the backend auto-generates it on
            // create. We only require the fields the user actually fills in.
            loading || !formData.name || !formData.unit_id || !formData.category_id || hasErrors
          }
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {submitText}...
            </>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { toast } = useToast()

  // Global store data
  const {
    products: globalProducts,
    categories: globalCategories,
    isAnyLoading: globalLoading,
    refreshAllData
  } = usePosData()

  // Branch context — used for the optional "Add Stock" field in the product
  // form. Stock is per-branch, so we need to know which branch to write to.
  const { branches: posBranches, selectedBranchId } = usePosBranch()

  // State for products and pagination
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [gotoPage, setGotoPage] = useState<string>("")

  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  // Sentinel value for the "no filter" option in the category / subcategory
  // dropdowns. Must not collide with any real ID — using "all" alone broke
  // when a record happened to have id="all" and Radix Select treated two items
  // as selected at once ("All CategoriesAll" in the trigger).
  const [selectedCategory, setSelectedCategory] = useState("__all__")
  const [selectedSubcategory, setSelectedSubcategory] = useState("__all__")

  // State for dropdown options (these will be loaded from global store)
  const [units, setUnits] = useState<DropdownOption[]>([])
  const [taxes, setTaxes] = useState<DropdownOption[]>([])
  const [categories, setCategories] = useState<DropdownOption[]>([])
  const [subcategories, setSubcategories] = useState<DropdownOption[]>([])
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([])
  const [brands, setBrands] = useState<DropdownOption[]>([])
  const [colors, setColors] = useState<DropdownOption[]>([])
  const [sizes, setSizes] = useState<DropdownOption[]>([])

  // State for form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Delete-confirmation modal state. We track the product directly (so we can
  // show its name in the dialog) and a separate `isDeleting` flag so the
  // confirm button can show a spinner while the API call is in flight.
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)

  // "Add Stock" companion fields — sit alongside the product form. Stock is
  // a separate table row keyed by (product, branch), so we keep it outside
  // ProductFormData and call POST /stock after the product save succeeds.
  // Multi-branch: the user can stock the same quantity to one, several, or
  // every branch in a single submit.
  const [stockToAdd, setStockToAdd] = useState<number>(0)
  const [stockBranchIds, setStockBranchIds] = useState<string[]>([])
  // Per-branch current stock for the product being edited, keyed by branch_id.
  // Populated from GET /products/:id so the user can see what's already there
  // (and decide whether to top it up). Resets to {} for Add Product.
  const [currentBranchStocks, setCurrentBranchStocks] = useState<
    Record<string, number>
  >({})

  // Tracks the GET /products/:id call fired from openEditDialog. While true,
  // the Edit dialog renders a skeleton instead of the half-populated form so
  // the user never sees fields blink from empty → filled.
  const [isLoadingEditProduct, setIsLoadingEditProduct] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    unit_id: "",
    sku: "",
    purchase_rate: 0,
    sales_rate_exc_dis_and_tax: 0,
    sales_rate_inc_dis_and_tax: 0,
    category_id: "",
    is_active: true,
    display_on_pos: true,
    is_batch: false,
    auto_fill_on_demand_sheet: false,
    non_inventory_item: false,
    is_deal: false,
    is_featured: false,
    images: [],
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ sku?: string; pct_or_hs_code?: string }>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])     // URLs for display (all are Cloudinary URLs)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]) // URLs to send in PATCH/POST
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API Service Functions
  const apiService = {
    // Dropdown data fetchers.
    // We request a high `limit` so the full reference list is returned in
    // one shot. Without this, the backend defaults to limit=10 — meaning the
    // 11th supplier/brand/color/size never reaches the Edit form, the
    // <Select> value can't find a matching <SelectItem>, and the trigger
    // falls back to the "Select X" placeholder even though the product has
    // a value set.
    async getUnits() {
      const response = await apiClient.get("/units", { params: { limit: 1000 } })
      return response.data
    },

    async getTaxes() {
      const response = await apiClient.get("/taxes", { params: { limit: 1000 } })
      return response.data
    },

    async getCategories() {
      const response = await apiClient.get("/categories", { params: { limit: 1000 } })
      return response.data
    },

    async getSubcategories() {
      const response = await apiClient.get("/subcategories", { params: { limit: 1000 } })
      return response.data
    },

    async getSuppliers() {
      const response = await apiClient.get("/suppliers", { params: { limit: 1000 } })
      return response.data
    },

    async getBrands() {
      const response = await apiClient.get("/brands", { params: { limit: 1000 } })
      return response.data
    },

    async getColors() {
      const response = await apiClient.get("/colors", { params: { limit: 1000 } })
      return response.data
    },

    async getSizes() {
      const response = await apiClient.get("/sizes", { params: { limit: 1000 } })
      return response.data
    },

    // Product operations
    async getProducts(params?: {
      page?: number
      limit?: number
      search?: string
      category_id?: string
      subcategory_id?: string
      is_active?: boolean
      display_on_pos?: boolean
    }) {
      const response = await apiClient.get("/products", { params })
      return response.data
    },

    /**
     * Upload a single image file to Cloudinary via backend. Returns the URL.
     */
    async uploadImage(file: File): Promise<string> {
      const fd = new FormData()
      fd.append("image", file)
      const response = await apiClient.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // 60s per image
      })
      return response.data.data.url
    },

    async createProduct(productData: ProductFormData, imageUrls: string[]) {
      const { images, ...dataWithoutImages } = productData
      const response = await apiClient.post("/products", {
        ...dataWithoutImages,
        image_urls: imageUrls,
      })
      return response.data
    },

    async updateProduct(id: string, productData: any, imageUrls: string[]) {
      const { images, ...dataWithoutImages } = productData
      const response = await apiClient.patch(`/products/${id}`, {
        ...dataWithoutImages,
        existing_images: imageUrls,
      })
      return response.data
    },

    async toggleProductStatus(id: string) {
      const response = await apiClient.patch(`/products/${id}/toggle-status`)
      return response.data
    },

    async deleteProduct(id: string) {
      const response = await apiClient.delete(`/products/${id}`)
      return response.data
    },

    async addStock(productId: string, branchId: string, quantity: number) {
      // POST /stock upserts: existing stock row for (product, branch) gets
      // `quantity` ADDED; if no row exists yet, one is created with that
      // quantity. Always logs a stock-movement of type PURCHASE.
      const response = await apiClient.post("/stock", {
        productId,
        branchId,
        quantity,
      })
      return response.data
    },

    async getProductById(id: string) {
      // Used by the Edit dialog to always work off fresh data instead of the
      // possibly-stale list cache.
      const response = await apiClient.get(`/products/${id}`)
      return response.data
    },
  }

  // Load dropdown data on component mount
  useEffect(() => {
    loadDropdownData()
  }, [])

  // Seed the stock branch selection from the user's current POS branch the
  // first time we know it. Don't clobber an explicit user pick afterwards.
  useEffect(() => {
    if (stockBranchIds.length === 0 && selectedBranchId) {
      setStockBranchIds([selectedBranchId])
    }
  }, [selectedBranchId, stockBranchIds.length])

  // Load products when filters change or global products change
  useEffect(() => {
    if (globalProducts.length > 0) {
      loadProducts()
    } else if (globalLoading) {
      // Still loading from global store
      setLoading(true)
    } else {
      // Global store finished loading but no products
      setIsInitialLoading(false)
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedCategory, selectedSubcategory, pageSize, globalProducts, globalLoading])

  const loadDropdownData = async () => {
    try {
      // Use global categories data
      setCategories(globalCategories)

      // Load other dropdown data that's not in global store
      const [
        unitsData,
        taxesData,
        subcategoriesData,
        suppliersData,
        brandsData,
        colorsData,
        sizesData,
      ] = await Promise.all([
        apiService.getUnits(),
        apiService.getTaxes(),
        apiService.getSubcategories(),
        apiService.getSuppliers(),
        apiService.getBrands(),
        apiService.getColors(),
        apiService.getSizes(),
      ])

      setUnits(unitsData.data || unitsData)
      setTaxes(taxesData.data || taxesData)
      setSubcategories(subcategoriesData.data || subcategoriesData)
      setSuppliers(suppliersData.data || suppliersData)
      setBrands(brandsData.data || brandsData)
      setColors(colorsData.data || colorsData)
      setSizes(sizesData.data || sizesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dropdown data",
        variant: "destructive",
      })
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      // Use global products data instead of making API calls
      let filteredProducts = [...globalProducts]
      
      // Mark initial loading as complete once we have data
      if (isInitialLoading && filteredProducts.length > 0) {
        setIsInitialLoading(false)
      }

      // Apply search filter
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }

      // Apply category filter
      if (selectedCategory !== "__all__") {
        filteredProducts = filteredProducts.filter(product =>
          product.categoryId === selectedCategory
        )
      }

      // Apply subcategory filter
      if (selectedSubcategory !== "__all__") {
        filteredProducts = filteredProducts.filter(product =>
          product.subcategoryId && product.subcategoryId === selectedSubcategory
        )
      }

      // Apply pagination
      const total = filteredProducts.length
      let paginatedProducts = filteredProducts
      
      if (pageSize !== 0) {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        paginatedProducts = filteredProducts.slice(startIndex, endIndex)
      }

      // Transform to match the Product interface
      const productsData = paginatedProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        code: product.code || "",
        pct_or_hs_code: product.pct_or_hs_code,
        description: product.description,
        purchase_rate: product.purchase_rate || 0,
        sales_rate_exc_dis_and_tax: product.sales_rate_exc_dis_and_tax || 0,
        sales_rate_inc_dis_and_tax: product.sales_rate_inc_dis_and_tax || 0,
        discount_amount: product.discount_amount,
        min_qty: product.min_qty,
        max_qty: product.max_qty,
        is_active: product.is_active ?? true,
        display_on_pos: product.display_on_pos ?? true,
        is_batch: product.is_batch ?? false,
        auto_fill_on_demand_sheet: product.auto_fill_on_demand_sheet ?? false,
        non_inventory_item: product.non_inventory_item ?? false,
        is_deal: product.is_deal ?? false,
        is_featured: product.is_featured ?? false,
        unit: { id: product.unitId, name: product.unitName },
        tax: { id: product.taxId, name: product.taxName },
        category: { id: product.categoryId, name: product.category },
        subcategory: { id: product.subcategoryId, name: product.subcategory },
        supplier: { id: product.supplierId, name: product.supplierName },
        brand: { id: product.brandId, name: product.brandName },
        color: { id: product.colorId, name: product.colorName },
        size: { id: product.sizeId, name: product.sizeName },
        // Stock totals come pre-aggregated from the global store. Without
        // these the Stock column always rendered 0 because the table reads
        // `product.available_stock ?? product.current_stock ?? 0`.
        available_stock: product.available_stock ?? product.stock ?? 0,
        current_stock: product.current_stock ?? product.stock ?? 0,
        reserved_stock: product.reserved_stock ?? 0,
        minimum_stock: product.minimum_stock ?? 0,
        maximum_stock: product.maximum_stock ?? 0,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        images: product.images || [],
      }))

      setProducts(productsData)
      setTotalProducts(total)
    } catch (error) {
      console.log("Failed to load products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    setFormLoading(true)
    try {
      const dataToSubmit = {
        ...formData,
        sku: String(formData.sku),
        pct_or_hs_code: formData.pct_or_hs_code ? String(formData.pct_or_hs_code) : undefined,
      }

      // Images are already uploaded — existingImageUrls has all Cloudinary URLs
      const created = await apiService.createProduct(dataToSubmit, existingImageUrls)
      const createdId = created?.data?.id as string | undefined

      // If the user entered an initial stock value, write it to every chosen
      // branch. Run them in parallel so saving to N branches is no slower
      // than saving to one. Failures here are surfaced separately so a
      // stock-write hiccup doesn't make the user think the product itself
      // failed to save.
      if (createdId && stockToAdd > 0 && stockBranchIds.length > 0) {
        const results = await Promise.allSettled(
          stockBranchIds.map((bid) =>
            apiService.addStock(createdId, bid, stockToAdd),
          ),
        )
        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
          toast({
            title: "Product saved, but some stock writes failed",
            description: `${failed} of ${stockBranchIds.length} branch stock writes failed. Try again from the Stock page.`,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      setIsAddDialogOpen(false)
      resetForm()
      // Await so the table re-renders with the new product (and its stock)
      // before the user can interact with the list.
      await refreshAllData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    setFormLoading(true)
    try {
      const dataToSubmit = {
        ...formData,
        sku: String(formData.sku),
        pct_or_hs_code: formData.pct_or_hs_code ? String(formData.pct_or_hs_code) : undefined,
      }
      // All images are already Cloudinary URLs — no base64, no large payload
      await apiService.updateProduct(editingProduct.id, dataToSubmit, existingImageUrls)

      // Edit-time stock entry is additive (matches POST /stock semantics —
      // a positive number is added to existing branch stock and a
      // stock-movement of type PURCHASE is logged). Fan out across the
      // selected branches in parallel.
      if (stockToAdd > 0 && stockBranchIds.length > 0) {
        const results = await Promise.allSettled(
          stockBranchIds.map((bid) =>
            apiService.addStock(editingProduct.id, bid, stockToAdd),
          ),
        )
        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
          toast({
            title: "Product updated, but some stock writes failed",
            description: `${failed} of ${stockBranchIds.length} branch stock writes failed. Try again from the Stock page.`,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingProduct(null)
      resetForm()
      await refreshAllData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.toggleProductStatus(id)
      toast({
        title: "Success",
        description: "Product status updated successfully",
      })
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      })
    }
  }

  // Called by the AlertDialog's confirm button. The dialog stays open and
  // shows a spinner on the confirm button while the request runs so the user
  // never wonders whether the click registered.
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    const product = productToDelete
    setIsDeletingProduct(true)
    try {
      await apiService.deleteProduct(product.id)
      toast({
        title: "Deleted",
        description: `"${product.name}" has been removed.`,
      })
      // Optimistic local update so the user sees the row disappear immediately.
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setProductToDelete(null)
      // Refresh the GLOBAL product cache. `loadProducts()` reads from
      // `globalProducts`, so without this the deleted row would reappear on
      // the next re-render via the cached copy. `refreshAllData()` re-fetches
      // from the API, then the effect watching `globalProducts` re-runs
      // `loadProducts()` automatically with the fresh list.
      await refreshAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsDeletingProduct(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      unit_id: "",
      sku: "",
      purchase_rate: 0,
      sales_rate_exc_dis_and_tax: 0,
      sales_rate_inc_dis_and_tax: 0,
      category_id: "",
      is_active: true,
      display_on_pos: true,
      is_batch: false,
      auto_fill_on_demand_sheet: false,
      non_inventory_item: false,
      is_deal: false,
      is_featured: false,
      images: [],
    })
    setImagePreviews([])
    setExistingImageUrls([])
    setStockToAdd(0)
    // Re-seed the stock branches from the user's current branch so a fresh
    // Add dialog opens with at least one sensible default checked.
    setStockBranchIds(selectedBranchId ? [selectedBranchId] : [])
    setCurrentBranchStocks({})
  }

  const openEditDialog = async (product: Product) => {
    // Open the modal in a "loading" state — we DON'T show the form until the
    // canonical record arrives, so the user never sees fields flash from
    // empty/"Unknown" to their real values.
    setEditingProduct(product)
    setIsEditDialogOpen(true)
    setIsLoadingEditProduct(true)
    setStockToAdd(0)

    const toNum = (v: any): number => {
      if (v === null || v === undefined || v === "") return 0
      const n = typeof v === "string" ? parseFloat(v) : Number(v)
      return Number.isFinite(n) ? n : 0
    }

    try {
      const detail = await apiService.getProductById(product.id)
      const fresh = detail?.data ?? detail
      if (!fresh) throw new Error("Empty product detail response")

      const existingUrls: string[] =
        fresh.ProductImage?.map((img: any) => img.image) ||
        (Array.isArray(fresh.images)
          ? fresh.images.map((img: any) => (typeof img === "string" ? img : img.image))
          : []) ||
        []

      setFormData({
        name: fresh.name ?? "",
        unit_id: fresh.unit?.id ?? "",
        pct_or_hs_code: fresh.pct_or_hs_code ?? "",
        description: fresh.description ?? "",
        sku: fresh.sku ?? product.sku,
        purchase_rate: toNum(fresh.purchase_rate),
        sales_rate_exc_dis_and_tax: toNum(fresh.sales_rate_exc_dis_and_tax),
        sales_rate_inc_dis_and_tax: toNum(fresh.sales_rate_inc_dis_and_tax),
        discount_amount: toNum(fresh.discount_amount),
        tax_id: fresh.tax?.id ?? "",
        category_id: fresh.category?.id ?? "",
        subcategory_id: fresh.subcategory?.id ?? "",
        min_qty: toNum(fresh.min_qty),
        max_qty: toNum(fresh.max_qty),
        supplier_id: fresh.supplier?.id ?? "",
        brand_id: fresh.brand?.id ?? "",
        color_id: fresh.color?.id ?? "",
        size_id: fresh.size?.id ?? "",
        is_active: fresh.is_active ?? true,
        display_on_pos: fresh.display_on_pos ?? true,
        is_batch: fresh.is_batch ?? false,
        auto_fill_on_demand_sheet: fresh.auto_fill_on_demand_sheet ?? false,
        non_inventory_item: fresh.non_inventory_item ?? false,
        is_deal: fresh.is_deal ?? false,
        is_featured: fresh.is_featured ?? false,
        images: existingUrls,
      })
      setImagePreviews(existingUrls)
      setExistingImageUrls(existingUrls)

      // Build a per-branch current-stock map so the Branches popover can
      // display "Current: N" beside each option. Backend may return
      // current_quantity as a Decimal-string; coerce to number.
      const branchStockMap: Record<string, number> = {}
      if (Array.isArray(fresh.stock)) {
        for (const s of fresh.stock) {
          if (!s?.branch_id) continue
          const cur = toNum(s.current_quantity)
          const res = toNum(s.reserved_quantity)
          branchStockMap[s.branch_id] = cur - res // available
        }
      }
      setCurrentBranchStocks(branchStockMap)

      // Pre-select branches this product already has stock in (any quantity,
      // including 0). Falls back to the user's current POS branch when this
      // product has no stock rows yet.
      const stockBranches: string[] = Object.keys(branchStockMap)
      if (stockBranches.length > 0) {
        setStockBranchIds(Array.from(new Set(stockBranches)))
      } else if (selectedBranchId) {
        setStockBranchIds([selectedBranchId])
      } else {
        setStockBranchIds([])
      }
    } catch {
      // Hard-fail: close the modal and tell the user. Showing a half-filled
      // form would be worse — they'd save partial data and overwrite the real
      // record.
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      toast({
        title: "Couldn't load product",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingEditProduct(false)
    }
  }

  const updateFormData = (field: keyof ProductFormData, value: any) => {
    // Functional setState so two consecutive updates in the same tick (e.g.
    // mirroring a single Sales Rate into both DB columns) compose correctly
    // instead of the second call clobbering the first via stale closure.
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setFormLoading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Error", description: `${file.name} is not an image.`, variant: "destructive" })
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Error", description: `Image ${file.name} is larger than 5MB.`, variant: "destructive" })
          continue
        }

        // Compress the image
        const compressed = await compressImage(file)

        // Upload immediately to Cloudinary via backend — returns a URL
        const url = await apiService.uploadImage(compressed)

        // Store the Cloudinary URL (not base64)
        setImagePreviews((prev) => [...prev, url])
        setExistingImageUrls((prev) => [...prev, url])
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" })
    } finally {
      setFormLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const removedUrl = imagePreviews[index]
    setExistingImageUrls((prev) => prev.filter((url) => url !== removedUrl))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const totalPages = Math.ceil(totalProducts / pageSize)

  if (isInitialLoading && globalLoading) {
    return <PageLoader message="Loading inventory..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-sm md:text-base text-gray-600">Manage your products and inventory</p>
            {globalLoading && (
              <p className="text-xs md:text-sm text-blue-600 mt-1">Loading data from cache...</p>
            )}
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                // Always start the Add form from a clean slate so values left
                // behind from a previous Edit can't leak across dialogs.
                resetForm()
                setEditingProduct(null)
              }
              setIsAddDialogOpen(open)
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setEditingProduct(null)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm
                onSubmit={handleCreateProduct}
                loading={formLoading}
                submitText="Create Product"
                formData={formData}
                formErrors={formErrors}
                updateFormData={updateFormData}
                units={units}
                categories={categories}
                subcategories={subcategories}
                taxes={taxes}
                suppliers={suppliers}
                brands={brands}
                colors={colors}
                sizes={sizes}
                imagePreviews={imagePreviews}
                handleRemoveImage={handleRemoveImage}
                fileInputRef={fileInputRef}
                handleImageSelect={handleImageSelect}
                stockToAdd={stockToAdd}
                setStockToAdd={setStockToAdd}
                stockBranchIds={stockBranchIds}
                setStockBranchIds={setStockBranchIds}
                branchOptions={posBranches}
                stockLabel="Initial Stock"
                currentBranchStocks={currentBranchStocks}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{products.filter((p) => p.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{products.filter((p) => p.is_featured).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">
              Items per page:
            </Label>
            <Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setCurrentPage(1); }}>
              <SelectTrigger className="w-32" id="page-size">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="0">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({totalProducts})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoader message="Loading products..." />
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Name</TableHead>
                          <TableHead className="min-w-[120px]">SKU</TableHead>
                          <TableHead className="min-w-[120px]">Category</TableHead>
                          <TableHead className="min-w-[100px]">Unit</TableHead>
                          <TableHead className="min-w-[100px]">Stock</TableHead>
                          <TableHead className="min-w-[120px]">Purchase Rate</TableHead>
                          <TableHead className="min-w-[120px]">Sales Rate</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.name}</div>
                            {product.is_featured && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category?.name || "-"}</TableCell>
                        <TableCell>{product.unit?.name || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {product.available_stock ?? product.current_stock ?? 0}
                            </div>
                            {/* Guard with a strict `> 0` check — `{0 && <JSX>}`
                                renders the literal `0`, which was leaking an
                                extra "0" under every stock value. */}
                            {(product.reserved_stock ?? 0) > 0 && (
                              <div className="text-xs text-gray-500">
                                Reserved: {product.reserved_stock}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.purchase_rate.toFixed(2)}</TableCell>
                        <TableCell>{product.sales_rate_exc_dis_and_tax.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            className={product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setProductToDelete(product)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                </div>
                {/* Pagination */}
                {(totalPages > 1 || pageSize === 0) && (
                  <div className="flex flex-col gap-4 mt-6 pt-4 border-t">
                    {/* Pagination Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        {pageSize === 0 ? (
                          <>Showing all <span className="font-semibold">{totalProducts}</span> products</>
                        ) : (
                          <>
                            Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                            <span className="font-semibold">{Math.min(currentPage * pageSize, totalProducts)}</span> of{" "}
                            <span className="font-semibold">{totalProducts}</span> products
                            {" "}(Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>)
                          </>
                        )}
                      </div>
                      
                      {/* Page Size Selector */}
                      {pageSize !== 0 && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor="pagination-page-size" className="text-sm font-medium whitespace-nowrap">
                            Items per page:
                          </Label>
                          <Select 
                            value={String(pageSize)} 
                            onValueChange={value => { 
                              setPageSize(Number(value)); 
                              setCurrentPage(1); 
                            }}
                          >
                            <SelectTrigger className="w-32" id="pagination-page-size">
                              <SelectValue placeholder="Page Size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="0">All</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {pageSize !== 0 && totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="min-w-[80px]"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="min-w-[80px]"
                          >
                            Previous
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Go to page:</span>
                          <Input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={gotoPage}
                            onChange={e => setGotoPage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const page = Math.max(1, Math.min(Number(gotoPage), totalPages))
                                if (!isNaN(page)) setCurrentPage(page)
                                setGotoPage("")
                              }
                            }}
                            placeholder="Page #"
                            className="w-20 h-9 px-2 text-sm text-center"
                          />
                          <span className="text-sm text-gray-500">/ {totalPages}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="min-w-[80px]"
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="min-w-[80px]"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            // Wipe form + editingProduct when the Edit dialog closes (Cancel,
            // ESC, X, click-outside) so the next Add dialog opens empty.
            if (!open) {
              resetForm()
              setEditingProduct(null)
            }
            setIsEditDialogOpen(open)
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {isLoadingEditProduct ? (
              // Skeleton roughly mirrors the form layout so the modal doesn't
              // jump when the data arrives. Anything more elaborate is a CLS
              // hazard; users care that they know it's loading, not what
              // shape it'll be.
              <div className="space-y-6 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading product details...
                </div>
                {[1, 2, 3].map((section) => (
                  <div key={section} className="space-y-3">
                    <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="space-y-1.5">
                          <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                          <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ProductForm
                onSubmit={handleUpdateProduct}
                loading={formLoading}
                submitText="Update Product"
                formData={formData}
                formErrors={formErrors}
                updateFormData={updateFormData}
                units={units}
                categories={categories}
                subcategories={subcategories}
                taxes={taxes}
                suppliers={suppliers}
                brands={brands}
                colors={colors}
                sizes={sizes}
                imagePreviews={imagePreviews}
                handleRemoveImage={handleRemoveImage}
                fileInputRef={fileInputRef}
                handleImageSelect={handleImageSelect}
                stockToAdd={stockToAdd}
                setStockToAdd={setStockToAdd}
                stockBranchIds={stockBranchIds}
                setStockBranchIds={setStockBranchIds}
                branchOptions={posBranches}
                stockLabel="Add Stock"
                currentBranchStocks={currentBranchStocks}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete-confirmation modal. We don't allow closing while the API
            call is in flight, otherwise the user could fire it twice. */}
        <AlertDialog
          open={productToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeletingProduct) setProductToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  &quot;{productToDelete?.name}&quot;
                </span>
                ? This action cannot be undone and will remove the product
                along with its stock and history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingProduct}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  // Prevent the default close-on-click; we manage closing
                  // ourselves so the spinner stays visible until the API
                  // resolves.
                  e.preventDefault()
                  confirmDeleteProduct()
                }}
                disabled={isDeletingProduct}
                className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              >
                {isDeletingProduct ? (
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
    </div>
  )
}
