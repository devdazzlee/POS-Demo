"use client"

import type React from "react"
import { z } from "zod"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Grid3X3,
  Package,
  Loader2,
  Upload,
  X,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageLoader } from "@/components/ui/page-loader"
import apiClient from "@/lib/apiClient"

// Zod validation schemas
const addCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name must be at most 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be at most 100 characters"),
})

const editCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name must be at most 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be at most 100 characters"),
})

// Direct backend error extractor
const extractApiError = (err: any, fallback = "Something went wrong"): string => {
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

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  display_on_branches?: string[]
  image?: string
  get_tax_from_item?: boolean
  editable_sale_rate?: boolean
  display_on_pos?: boolean
  branch_id?: string
  productCount?: number
  color?: string
  status?: "active" | "inactive"
  is_active?: boolean
  createdDate?: string
}

function getCategoryIsActive(category: Pick<Category, "status" | "is_active">): boolean {
  if (typeof category.is_active === "boolean") return category.is_active
  if (category.status === "active") return true
  if (category.status === "inactive") return false
  return true
}

function normalizeCategory(raw: Record<string, unknown>): Category {
  const isActive = getCategoryIsActive(raw as Category)
  return {
    ...(raw as Category),
    is_active: isActive,
    status: isActive ? "active" : "inactive",
  }
}

interface CreateCategoryData {
  name: string
  slug: string
  display_on_branches?: string[]
  image?: string
  get_tax_from_item?: boolean
  editable_sale_rate?: boolean
  display_on_pos?: boolean
  branch_id?: string
}

interface Branch {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "az" | "za">("newest")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<Category | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Active status for add/edit forms
  const [addIsActive, setAddIsActive] = useState(true)
  const [editIsActive, setEditIsActive] = useState(true)

  // Form validation errors (shown inside dialog)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [addApiError, setAddApiError] = useState("")
  const [editApiError, setEditApiError] = useState("")

  const [newCategory, setNewCategory] = useState<CreateCategoryData>({
    name: "",
    slug: "",
    display_on_branches: [],
    image: "",
    get_tax_from_item: false,
    editable_sale_rate: false,
    display_on_pos: true,
    branch_id: "",
  })

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  // Handle image file selection for new category with compression
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      // Compress the image
      const compressedFile = await compressImage(file, 0.7, 800, 600)

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setImagePreview(base64String)
        setNewCategory({ ...newCategory, image: base64String })
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      })
    }
  }

  // Handle image file selection for edit category with compression
  const handleEditImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editingCategory) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      // Compress the image
      const compressedFile = await compressImage(file, 0.7, 800, 600)

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setEditImagePreview(base64String)
        setEditingCategory({ ...editingCategory, image: base64String })
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      })
    }
  }

  // Remove image for new category
  const handleRemoveImage = () => {
    setImagePreview(null)
    setNewCategory({ ...newCategory, image: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove image for edit category
  const handleRemoveEditImage = () => {
    if (!editingCategory) return
    setEditImagePreview(null)
    setEditingCategory({ ...editingCategory, image: "" })
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ""
    }
  }

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true)
      const response = await apiClient.get("/branches?is_active=true&fetch_all=true")
      setBranches(response.data.data || [])
    } catch (error: any) {
      console.log("Error fetching branches:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch branches",
        variant: "destructive",
      })
    } finally {
      setBranchesLoading(false)
    }
  }

  // Fetch categories from API with product counts
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      // Check if user is ADMIN - admins should see all categories
      const userRole = localStorage.getItem("role");
      const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
      
      const params: any = {
        fetch_all: true,
      };
      
      const response = await apiClient.get("/categories", { params })
      const categoriesData = response.data.data || []
      
      // Fetch product counts for each category
      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category: Category) => {
          try {
            // Check if user is ADMIN - admins should see all products
            const userRole = localStorage.getItem("role");
            const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
            
            const params: any = {
              category_id: category.id,
              fetch_all: true,
            };
            
            // Don't filter by branch_id for admin users
            if (!isAdmin) {
              const branchStr = localStorage.getItem("branch");
              if (branchStr && branchStr !== "Not Found") {
                try {
                  const branchObj = JSON.parse(branchStr);
                  params.branch_id = branchObj.id || branchStr;
                } catch (e) {
                  params.branch_id = branchStr;
                }
              }
            }
            
            const productsResponse = await apiClient.get("/products", { params });
            const products = productsResponse.data?.data || [];
            return normalizeCategory({
              ...category,
              productCount: Array.isArray(products) ? products.length : 0,
            } as Record<string, unknown>);
          } catch (error) {
            console.error(`Error fetching products for category ${category.id}:`, error);
            return normalizeCategory({
              ...category,
              productCount: 0,
            } as Record<string, unknown>);
          }
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error: any) {
      console.log("Error fetching categories:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch categories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch products for a specific category
  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      setLoadingProducts(true);
      // Check if user is ADMIN - admins should see all products
      const userRole = localStorage.getItem("role");
      const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
      
      const params: any = {
        category_id: categoryId,
        fetch_all: true,
      };
      
      // Don't filter by branch_id for admin users
      if (!isAdmin) {
        const branchStr = localStorage.getItem("branch");
        if (branchStr && branchStr !== "Not Found") {
          try {
            const branchObj = JSON.parse(branchStr);
            params.branch_id = branchObj.id || branchStr;
          } catch (e) {
            params.branch_id = branchStr;
          }
        }
      }
      
      const response = await apiClient.get("/products", { params });
      const products = response.data?.data || [];
      setCategoryProducts(Array.isArray(products) ? products : []);
    } catch (error: any) {
      console.error("Error fetching category products:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch products",
        variant: "destructive",
      });
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  // Handle category card click to show products
  const handleCategoryClick = (category: Category) => {
    setSelectedCategoryForProducts(category);
    fetchCategoryProducts(category.id);
  }

  // Create category
  const handleAddCategory = async () => {
    setAddErrors({})
    setAddApiError("")
    
    // Zod validation
    const payloadToValidate = {
      name: newCategory.name,
      slug: newCategory.slug || generateSlug(newCategory.name),
    }

    const validationResult = addCategorySchema.safeParse(payloadToValidate)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setAddErrors(fieldErrors)
      return
    }

    try {
      setLoading(true)
      const allBranchIds = branches.map((b) => b.id)
      const { branch_id: _unusedBranchId, ...rest } = newCategory
      const categoryData = {
        ...rest,
        ...validationResult.data, // Uses validated name & slug
        display_on_branches: allBranchIds,
        display_on_pos: true,
        get_tax_from_item: false,
        editable_sale_rate: false,
        is_active: addIsActive, // Support for is_active
      }

      const response = await apiClient.post("/categories", categoryData)

      toast({
        title: "Success",
        description: "Category created successfully",
      })

      setCategories([...categories, normalizeCategory(response.data.data)])
      setNewCategory({
        name: "",
        slug: "",
        display_on_branches: [],
        image: "",
        get_tax_from_item: false,
        editable_sale_rate: false,
        display_on_pos: true,
        branch_id: "",
      })
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.log("Error creating category:", error)
      const errMsg = extractApiError(error, "Failed to create category")
      setAddApiError(errMsg)
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update category
  const handleEditCategory = async () => {
    if (!editingCategory) return
    setEditErrors({})
    setEditApiError("")

    // Zod validation
    const payloadToValidate = {
      name: editingCategory.name,
      slug: editingCategory.slug,
    }

    const validationResult = editCategorySchema.safeParse(payloadToValidate)
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {}
      validationResult.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setEditErrors(fieldErrors)
      return
    }

    try {
      setLoading(true)
      const allBranchIds = branches.map((b) => b.id)
      const response = await apiClient.patch(`/categories/${editingCategory.id}`, {
        ...validationResult.data,
        display_on_branches: allBranchIds,
        image: editingCategory.image,
        display_on_pos: true,
        is_active: editIsActive,
      })

      toast({
        title: "Success",
        description: "Category updated successfully",
      })

      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id ? normalizeCategory(response.data.data) : c,
        ),
      )
      setEditingCategory(null)
      setEditImagePreview(null)
    } catch (error: any) {
      console.log("Error updating category:", error)
      const errMsg = extractApiError(error, "Failed to update category")
      setEditApiError(errMsg)
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Toggle category status
  const handleToggleStatus = async (id: string) => {
    try {
      setLoading(true)
      const response = await apiClient.patch(`/categories/${id}/toggle-status`)

      toast({
        title: "Success",
        description: "Category status updated successfully",
      })

      const updated = response.data?.data
        ? normalizeCategory(response.data.data)
        : null

      setCategories(
        categories.map((c) => {
          if (c.id !== id) return c
          if (updated) return { ...c, ...updated }
          const nextActive = !getCategoryIsActive(c)
          return normalizeCategory({
            ...c,
            is_active: nextActive,
          } as Record<string, unknown>)
        }),
      )
    } catch (error: any) {
      console.log("Error toggling category status:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update category status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Trigger delete dialog
  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCategoryToDelete(id)
  }

  // Execute actual deletion
  const executeDelete = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      await apiClient.delete(`/categories/${categoryToDelete}`)

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      setCategories(categories.filter((c) => c.id !== categoryToDelete))
      setCategoryToDelete(null)
    } catch (error: any) {
      console.log("Error deleting category:", error)
      const errMsg = extractApiError(error, "Failed to delete category")
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }



  // Handle edit dialog open
  const handleEditDialogOpen = (category: Category) => {
    setEditingCategory(category)
    setEditIsActive(getCategoryIsActive(category))
    setEditImagePreview(category.image || null)
    setEditErrors({})
    setEditApiError("")
  }

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditingCategory(null)
    setEditImagePreview(null)
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchBranches()
  }, [])

  useEffect(() => {
    if (newCategory.name) {
      setNewCategory((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }))
    }
  }, [newCategory.name])

  useEffect(() => {
    if (editingCategory && editingCategory.name) {
      setEditingCategory((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slug: generateSlug(prev.name),
        }
      })
    }
  }, [editingCategory?.name])

  const filteredCategories = categories.filter(
    (category) => {
      const searchMatch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const isActive = getCategoryIsActive(category);
      
      const statusMatch = statusFilter === "all" ? true :
                          statusFilter === "active" ? isActive :
                          !isActive;
                          
      return searchMatch && statusMatch;
    }
  ).sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
    }
    if (sortOrder === "oldest") {
      return new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime();
    }
    if (sortOrder === "az") {
      return a.name.localeCompare(b.name);
    }
    if (sortOrder === "za") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // Count active categories - check both status field and is_active field
  const activeCategories = categories.filter((c) => getCategoryIsActive(c)).length
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0)

  if (isLoading) {
    return <PageLoader message="Loading categories..." />
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm md:text-base text-gray-600">Organize your products into categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, name: e.target.value })
                      if (addErrors.name) setAddErrors({ ...addErrors, name: "" })
                      setAddApiError("")
                    }}
                    placeholder="Enter category name"
                    className={addErrors.name ? "border-red-500 mt-1" : "mt-1"}
                    disabled={loading}
                  />
                  {addErrors.name && <p className="text-xs text-red-600 mt-1">{addErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={newCategory.slug}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, slug: e.target.value })
                      if (addErrors.slug) setAddErrors({ ...addErrors, slug: "" })
                      setAddApiError("")
                    }}
                    placeholder="category-slug"
                    className={addErrors.slug ? "border-red-500 mt-1" : "mt-1"}
                    disabled={loading}
                  />
                  {addErrors.slug && <p className="text-xs text-red-600 mt-1">{addErrors.slug}</p>}
                </div>
              </div>

              {/* Active Switch Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                  <p className="text-xs text-gray-500">Enable or disable this category in system workflows</p>
                </div>
                <Switch checked={addIsActive} onCheckedChange={setAddIsActive} disabled={loading} />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB (will be compressed)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>

              {addApiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-semibold animate-pulse">
                  ⚠️ {addApiError}
                </div>
              )}

              <Button onClick={handleAddCategory} className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Category"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dynamic Analytical Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50/40 to-white border-indigo-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Categories</p>
              <p className="text-3xl font-extrabold text-gray-900">{categories.length}</p>
              <p className="text-[10px] text-gray-500">Categories registered in master</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/40 to-white border-emerald-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Categories</p>
              <p className="text-3xl font-extrabold text-gray-900">{activeCategories}</p>
              <p className="text-[10px] text-gray-500">Available in system operations</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50/40 to-white border-rose-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Inactive Categories</p>
              <p className="text-3xl font-extrabold text-gray-900">{categories.length - activeCategories}</p>
              <p className="text-[10px] text-gray-500">Disabled or hidden categories</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/40 to-white border-amber-100/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Total Products</p>
              <p className="text-3xl font-extrabold text-gray-900">{totalProducts}</p>
              <p className="text-[10px] text-gray-500">Products linked to categories</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="w-[160px] text-gray-700 font-medium bg-background shadow-sm hover:border-gray-300 transition-colors">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="az">Name (A-Z)</SelectItem>
              <SelectItem value="za">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[160px] text-gray-700 font-medium bg-background shadow-sm hover:border-gray-300 transition-colors">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredCategories.map((category) => (
          <Card 
            key={category.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCategoryClick(category)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {category.image ? (
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                  )}
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <div>
                  {getCategoryIsActive(category) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Inactive
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Slug:</strong> {category.slug}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{category.productCount || 0} products</span>
                </div>
                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => handleEditDialogOpen(category)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => confirmDelete(e, category.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Category Name</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => {
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                      if (editErrors.name) setEditErrors({ ...editErrors, name: "" })
                      setEditApiError("")
                    }}
                    className={editErrors.name ? "border-red-500 mt-1" : "mt-1"}
                    disabled={loading}
                  />
                  {editErrors.name && <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input
                    id="edit-slug"
                    value={editingCategory.slug}
                    onChange={(e) => {
                      setEditingCategory({ ...editingCategory, slug: e.target.value })
                      if (editErrors.slug) setEditErrors({ ...editErrors, slug: "" })
                      setEditApiError("")
                    }}
                    className={editErrors.slug ? "border-red-500 mt-1" : "mt-1"}
                    disabled={loading}
                  />
                  {editErrors.slug && <p className="text-xs text-red-600 mt-1">{editErrors.slug}</p>}
                </div>
              </div>

              {/* Active Switch Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                  <p className="text-xs text-gray-500">Enable or disable this category in system workflows</p>
                </div>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} disabled={loading} />
              </div>

              {/* Edit Image Upload Section */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                {editImagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={editImagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveEditImage}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB (will be compressed)</p>
                  </div>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageSelect}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {editImagePreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>

              {editApiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-semibold animate-pulse">
                  ⚠️ {editApiError}
                </div>
              )}

              <Button onClick={handleEditCategory} className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Category"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Products Dialog - Show products in selected category */}
      <Dialog open={!!selectedCategoryForProducts} onOpenChange={(open) => !open && setSelectedCategoryForProducts(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Products in "{selectedCategoryForProducts?.name}" Category
            </DialogTitle>
          </DialogHeader>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading products...</span>
            </div>
          ) : categoryProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No products found in this category.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-4">
                Total: <span className="font-semibold">{categoryProducts.length}</span> products
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                        <TableCell>
                          Rs {product.sales_rate_inc_dis_and_tax || product.sales_rate_exc_dis_and_tax || product.purchase_rate || 0}
                        </TableCell>
                        <TableCell>
                          {product.available_stock ?? product.current_stock ?? 0}
                        </TableCell>
                        <TableCell>
                          {product.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Inactive
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && !isDeleting && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                executeDelete()
              }} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
