'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload } from "@/components/ui/file-upload"
import {
  Package,
  Plus,
  Loader2
} from "lucide-react"
import { columns } from "./columns"
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  bulkUpdateProducts
} from "@/app/api/products/actions"
import { Product } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { DataTable } from "@/components/ui/data-table/data-table"
import { ProductsTableToolbar } from "./products-table-toolbar"
import { uploadFile } from "@/lib/supabase/storage"
import { EnhancedForm } from "@/components/ui/enhanced-form"
import { EnhancedFormField } from "@/components/ui/enhanced-form-field"
import { productSchema, stockAdjustmentSchema } from "@/lib/validations/schemas"
import { handleServerActionError, showErrorToast, showSuccessToast } from "@/lib/error-handling"

// Use the original schemas
const productFormSchema = productSchema;
const stockAdjustmentFormSchema = stockAdjustmentSchema;

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // These state variables are used in handleFileUpload function
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [stockFormError, setStockFormError] = useState<string | null>(null)

  // Form for adding a new product
  const addProductForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      sku: "",
      category: "",
      image_url: "",
      stock_quantity: 0,
      low_stock_threshold: undefined,
      is_active: true,
    },
  })

  // Form for editing a product
  const editProductForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      sku: "",
      category: "",
      image_url: "",
      stock_quantity: 0,
      low_stock_threshold: undefined,
      is_active: true,
    },
  })

  // Form for stock adjustment
  const stockAdjustmentForm = useForm({
    resolver: zodResolver(stockAdjustmentFormSchema) as any, // Type assertion needed due to type mismatch
    defaultValues: {
      adjustmentType: 'add',
      quantity: 0,
      reason: '',
    },
  })

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const imageUrl = await uploadFile(file);
      if (imageUrl) {
        setUploadedImageUrl(imageUrl);
        return imageUrl;
      } else {
        // Show a detailed toast notification if the upload failed
        toast.error(
          "Failed to upload image",
          {
            description: (
              <div className="space-y-2">
                <p>Please ensure the &apos;product-images&apos; bucket exists in your Supabase project.</p>
                <ol className="list-decimal pl-5 text-xs">
                  <li>Go to the Supabase dashboard</li>
                  <li>Navigate to Storage</li>
                  <li>Create a bucket named &apos;product-images&apos;</li>
                  <li>Enable &apos;Public bucket&apos; in the settings</li>
                </ol>
              </div>
            ),
            duration: 8000,
            action: {
              label: "Open Dashboard",
              onClick: () => window.open('https://supabase.com/dashboard/project/_/storage/buckets', '_blank')
            }
          }
        );
      }
      return null;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("An error occurred while uploading the image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      setError(null)

      try {
        const { data: fetchedProducts, error: fetchError } = await getProducts()

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setProducts(fetchedProducts || [])
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching products.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Open edit dialog and populate form with product data
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    editProductForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      sku: product.sku || "",
      category: product.category || "",
      image_url: product.image_url || "",
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold,
      is_active: product.is_active !== undefined ? product.is_active : true,
    })
    setIsEditDialogOpen(true)
  }

  // Handle adding a new product
  const handleAddProduct = async (values: Record<string, unknown>) => {
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Use the server action to create the product
      const { error } = await createProduct({
        name: String(values.name || ''),
        description: values.description ? String(values.description) : undefined,
        price: Number(values.price || 0),
        sku: values.sku ? String(values.sku) : undefined,
        category: values.category ? String(values.category) : undefined,
        image_url: values.image_url ? String(values.image_url) : undefined,
        stock_quantity: Number(values.stock_quantity || 0),
        low_stock_threshold: values.low_stock_threshold ? Number(values.low_stock_threshold) : undefined,
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
      })

      if (error) {
        setFormError(error.message)
        showErrorToast(`Failed to create product: ${error.message}`)
        return
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      showSuccessToast('Product created successfully')

      // Close the dialog and reset the form
      setIsAddDialogOpen(false)
      addProductForm.reset()
    } catch (err) {
      console.error('Error adding product:', err)
      const errorResponse = handleServerActionError(err)
      setFormError(errorResponse.error)
      showErrorToast(errorResponse.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle editing a product
  const handleEditProduct = async (values: Record<string, unknown>) => {
    if (!selectedProduct) return

    setIsSubmitting(true)
    setEditFormError(null)

    try {
      // Use the server action to update the product
      const { error } = await updateProduct(selectedProduct.id, {
        name: String(values.name || ''),
        description: values.description ? String(values.description) : undefined,
        price: Number(values.price || 0),
        sku: values.sku ? String(values.sku) : undefined,
        category: values.category ? String(values.category) : undefined,
        image_url: values.image_url ? String(values.image_url) : undefined,
        stock_quantity: Number(values.stock_quantity || 0),
        low_stock_threshold: values.low_stock_threshold ? Number(values.low_stock_threshold) : undefined,
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
      })

      if (error) {
        setEditFormError(error.message)
        showErrorToast(`Failed to update product: ${error.message}`)
        return
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      showSuccessToast('Product updated successfully')

      // Close the dialog and reset the form
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
    } catch (err) {
      console.error('Error updating product:', err)
      const errorResponse = handleServerActionError(err)
      setEditFormError(errorResponse.error)
      showErrorToast(errorResponse.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await deleteProduct(productId)

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success('Product deleted successfully')
    } catch (err) {
      console.error('Error deleting product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Open stock adjustment dialog
  const openAdjustStockDialog = (product: Product) => {
    setSelectedProduct(product)
    stockAdjustmentForm.reset({
      adjustmentType: 'add',
      quantity: 0,
      reason: '',
    })
    setIsAdjustStockDialogOpen(true)
  }

  // Handle stock adjustment
  const handleAdjustStock = async (values: Record<string, unknown>) => {
    if (!selectedProduct) return

    setIsSubmitting(true)
    setStockFormError(null)

    try {
      // Calculate the quantity change based on the adjustment type
      const quantity = Number(values.quantity) || 0;
      let quantityChange = quantity;

      if (values.adjustmentType === 'subtract') {
        quantityChange = -quantity;
      } else if (values.adjustmentType === 'set') {
        quantityChange = quantity - (selectedProduct.stock_quantity || 0);
      }

      // Use the server action to adjust the stock
      const { error } = await adjustStock(
        selectedProduct.id,
        quantityChange,
        String(values.reason || '')
      )

      if (error) {
        setStockFormError(error.message)
        showErrorToast(`Failed to adjust stock: ${error.message}`)
        return
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      showSuccessToast('Stock adjusted successfully')

      // Close the dialog
      setIsAdjustStockDialogOpen(false)
      setSelectedProduct(null)
    } catch (err) {
      console.error('Error adjusting stock:', err)
      const errorResponse = handleServerActionError(err)
      setStockFormError(errorResponse.error)
      showErrorToast(errorResponse.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle bulk activation of products
  const handleBulkActivate = async (productIds: string[]) => {
    if (!productIds.length) return

    try {
      // Use the server action to bulk update products
      const { data, error } = await bulkUpdateProducts(productIds, {
        is_active: true
      })

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success(`${data?.count} products activated successfully`)
    } catch (err) {
      console.error('Error activating products:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate products'
      toast.error(errorMessage)
    }
  }

  // Handle bulk deactivation of products
  const handleBulkDeactivate = async (productIds: string[]) => {
    if (!productIds.length) return

    try {
      // Use the server action to bulk update products
      const { data, error } = await bulkUpdateProducts(productIds, {
        is_active: false
      })

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success(`${data?.count} products deactivated successfully`)
    } catch (err) {
      console.error('Error deactivating products:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate products'
      toast.error(errorMessage)
    }
  }

  // Get unique categories for filtering
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))]

  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Product Management</h1>

          {/* Add Product Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product to add to your inventory.
                </DialogDescription>
              </DialogHeader>

              <EnhancedForm
                form={addProductForm}
                onSubmit={handleAddProduct}
                error={formError}
                submitText={isSubmitting ? "Creating..." : "Create Product"}
                cancelText="Cancel"
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={isSubmitting}
              >
                <div className="space-y-4">
                  <EnhancedFormField
                    name="name"
                    label="Name"
                    placeholder="Product name"
                    required
                  />
                  <EnhancedFormField
                    name="description"
                    label="Description"
                    type="textarea"
                    placeholder="Product description"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <EnhancedFormField
                      name="price"
                      label="Price"
                      type="number"
                      placeholder="0.00"
                      required
                    />
                    <EnhancedFormField
                      name="sku"
                      label="SKU"
                      placeholder="SKU"
                    />
                  </div>
                  <EnhancedFormField
                    name="category"
                    label="Category"
                    placeholder="Category"
                  />
                  <FormField
                    control={addProductForm.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                          <FileUpload
                            onFileUpload={async (file) => {
                              const url = await handleFileUpload(file);
                              if (url) {
                                field.onChange(url);
                              }
                              return url;
                            }}
                            onFileRemove={() => field.onChange('')}
                            value={field.value}
                            accept="image/*"
                            maxSizeMB={2}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a product image (max 2MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <EnhancedFormField
                      name="stock_quantity"
                      label="Stock Quantity"
                      type="number"
                      placeholder="0"
                      required
                    />
                    <FormField
                      control={addProductForm.control}
                      name="low_stock_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Optional"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when stock falls below this level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addProductForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Product will be available for purchase when active
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Product
                    </Button>
                  </div>
                </div>
              </EnhancedForm>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details
                </DialogDescription>
              </DialogHeader>

              <EnhancedForm
                form={editProductForm}
                onSubmit={handleEditProduct}
                error={editFormError}
                submitText={isSubmitting ? "Updating..." : "Update Product"}
                cancelText="Cancel"
                onCancel={() => setIsEditDialogOpen(false)}
                isSubmitting={isSubmitting}
              >
                <div className="space-y-4">
                  <FormField
                    control={editProductForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editProductForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Product description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editProductForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editProductForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editProductForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Category" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editProductForm.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                          <FileUpload
                            onFileUpload={async (file) => {
                              const url = await handleFileUpload(file);
                              if (url) {
                                field.onChange(url);
                              }
                              return url;
                            }}
                            onFileRemove={() => field.onChange('')}
                            value={field.value}
                            accept="image/*"
                            maxSizeMB={2}
                          />
                        </FormControl>
                        <FormDescription>
                          Upload a product image (max 2MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editProductForm.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editProductForm.control}
                      name="low_stock_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Optional"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Alert when stock falls below this level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editProductForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Product will be available for purchase when active
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Product
                    </Button>
                  </div>
                </div>
              </EnhancedForm>
            </DialogContent>
          </Dialog>

          {/* Stock Adjustment Dialog */}
          <Dialog open={isAdjustStockDialogOpen} onOpenChange={setIsAdjustStockDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>
                  {selectedProduct && (
                    <div className="mt-2">
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Current Stock: {selectedProduct.stock_quantity || 0} units
                      </p>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <EnhancedForm
                form={stockAdjustmentForm}
                onSubmit={handleAdjustStock}
                error={stockFormError}
                submitText={isSubmitting ? "Processing..." : "Adjust Stock"}
                cancelText="Cancel"
                onCancel={() => setIsAdjustStockDialogOpen(false)}
                isSubmitting={isSubmitting}
              >
                <div className="space-y-4">
                  <FormField
                    control={stockAdjustmentForm.control}
                    name="adjustmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adjustment Type</FormLabel>
                        <FormControl>
                          <div className="flex space-x-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="add"
                                value="add"
                                checked={field.value === 'add'}
                                onChange={() => field.onChange('add')}
                                className="mr-2"
                              />
                              <label htmlFor="add">Add</label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="subtract"
                                value="subtract"
                                checked={field.value === 'subtract'}
                                onChange={() => field.onChange('subtract')}
                                className="mr-2"
                              />
                              <label htmlFor="subtract">Subtract</label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="set"
                                value="set"
                                checked={field.value === 'set'}
                                onChange={() => field.onChange('set')}
                                className="mr-2"
                              />
                              <label htmlFor="set">Set to value</label>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <EnhancedFormField
                    name="quantity"
                    label="Quantity"
                    type="number"
                    placeholder="0"
                    required
                    description={
                      stockAdjustmentForm.watch('adjustmentType') === 'add'
                        ? 'Units to add to current stock'
                        : stockAdjustmentForm.watch('adjustmentType') === 'subtract'
                          ? 'Units to remove from current stock'
                          : 'New total stock value'
                    }
                  />
                  <EnhancedFormField
                    name="reason"
                    label="Reason"
                    type="textarea"
                    placeholder="Reason for adjustment"
                    required
                    description="Provide a reason for this stock adjustment"
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAdjustStockDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Adjust Stock
                    </Button>
                  </div>
                </div>
              </EnhancedForm>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your products and inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 border rounded-md bg-destructive/10 text-destructive flex items-start gap-3">
                <div className="mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Error Loading Products</h4>
                  <p className="text-sm">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw mr-1">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M3 21v-5h5"></path>
                    </svg>
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No products found</p>
                <p className="text-sm mb-6">Your inventory is empty. Start by adding your first product.</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns({
                  onEdit: openEditDialog,
                  onDelete: handleDeleteProduct,
                  onAdjustStock: openAdjustStockDialog
                })}
                data={products}
                searchKey="name"
                filterableColumns={[
                  {
                    id: "category",
                    title: "Category",
                    options: categories.map(category => ({
                      label: category as string,
                      value: category as string,
                    })),
                  },
                  {
                    id: "is_active",
                    title: "Status",
                    options: [
                      { label: "Active", value: "true" },
                      { label: "Inactive", value: "false" },
                    ],
                  },
                ]}
                tableToolbar={(table) => (
                  <ProductsTableToolbar
                    table={table}
                    searchKey="name"
                    filterableColumns={[
                      {
                        id: "category",
                        title: "Category",
                        options: categories.map(category => ({
                          label: category as string,
                          value: category as string,
                        })),
                      },
                      {
                        id: "is_active",
                        title: "Status",
                        options: [
                          { label: "Active", value: "true" },
                          { label: "Inactive", value: "false" },
                        ],
                      },
                    ]}
                    onBulkActivate={handleBulkActivate}
                    onBulkDeactivate={handleBulkDeactivate}
                  />
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
