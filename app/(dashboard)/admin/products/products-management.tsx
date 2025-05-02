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
  Form,
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
import * as z from "zod"
import { toast } from "sonner"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { DataTable } from "@/components/ui/data-table/data-table"
import { ProductsTableToolbar } from "./products-table-toolbar"

// Form schema for adding/editing products
const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, {
    message: "Price must be greater than 0.",
  }),
  sku: z.string().optional(),
  category: z.string().optional(),
  image_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  stock_quantity: z.coerce.number().min(0, {
    message: "Stock quantity cannot be negative.",
  }).default(0),
  low_stock_threshold: z.coerce.number().min(1, {
    message: "Low stock threshold must be at least 1.",
  }).optional(),
  is_active: z.boolean().default(true),
})

// Form schema for stock adjustment
const stockAdjustmentFormSchema = z.object({
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.coerce.number().min(0, {
    message: "Quantity must be a positive number.",
  }),
  reason: z.string().min(3, {
    message: "Please provide a reason for this adjustment.",
  }),
})

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form for adding a new product
  const addProductForm = useForm<z.infer<typeof productFormSchema>>({
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
  const editProductForm = useForm<z.infer<typeof productFormSchema>>({
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
  const stockAdjustmentForm = useForm<z.infer<typeof stockAdjustmentFormSchema>>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      adjustmentType: 'add',
      quantity: 0,
      reason: '',
    },
  })

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
  const handleAddProduct = async (values: z.infer<typeof productFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Use the server action to create the product
      const { data, error } = await createProduct({
        name: values.name,
        description: values.description,
        price: values.price,
        sku: values.sku,
        category: values.category,
        image_url: values.image_url,
        stock_quantity: values.stock_quantity || 0,
        low_stock_threshold: values.low_stock_threshold,
        is_active: values.is_active,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success('Product created successfully')

      // Close the dialog and reset the form
      setIsAddDialogOpen(false)
      addProductForm.reset()
    } catch (err) {
      console.error('Error adding product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle editing a product
  const handleEditProduct = async (values: z.infer<typeof productFormSchema>) => {
    if (!selectedProduct) return

    setIsSubmitting(true)

    try {
      // Use the server action to update the product
      const { data, error } = await updateProduct(selectedProduct.id, {
        name: values.name,
        description: values.description,
        price: values.price,
        sku: values.sku,
        category: values.category,
        image_url: values.image_url,
        stock_quantity: values.stock_quantity,
        low_stock_threshold: values.low_stock_threshold,
        is_active: values.is_active,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success('Product updated successfully')

      // Close the dialog and reset the form
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
    } catch (err) {
      console.error('Error updating product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    try {
      const { data, error } = await deleteProduct(productId)

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
  const handleAdjustStock = async (values: z.infer<typeof stockAdjustmentFormSchema>) => {
    if (!selectedProduct) return

    setIsSubmitting(true)

    try {
      // Calculate the quantity change based on the adjustment type
      let quantityChange = values.quantity

      if (values.adjustmentType === 'subtract') {
        quantityChange = -values.quantity
      } else if (values.adjustmentType === 'set') {
        quantityChange = values.quantity - (selectedProduct.stock_quantity || 0)
      }

      // Use the server action to adjust the stock
      const { data, error } = await adjustStock(
        selectedProduct.id,
        quantityChange,
        values.reason
      )

      if (error) {
        throw new Error(error.message)
      }

      // Refresh the product list
      const { data: updatedProducts } = await getProducts()
      setProducts(updatedProducts || [])

      // Show success toast
      toast.success('Stock adjusted successfully')

      // Close the dialog
      setIsAdjustStockDialogOpen(false)
      setSelectedProduct(null)
    } catch (err) {
      console.error('Error adjusting stock:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust stock'
      toast.error(errorMessage)
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
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product to add to your inventory.
                </DialogDescription>
              </DialogHeader>

              <Form {...addProductForm}>
                <form onSubmit={addProductForm.handleSubmit(handleAddProduct)} className="space-y-4">
                  <FormField
                    control={addProductForm.control}
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
                    control={addProductForm.control}
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
                      control={addProductForm.control}
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
                      control={addProductForm.control}
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addProductForm.control}
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
                      control={addProductForm.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addProductForm.control}
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
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details
                </DialogDescription>
              </DialogHeader>

              <Form {...editProductForm}>
                <form onSubmit={editProductForm.handleSubmit(handleEditProduct)} className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Stock Adjustment Dialog */}
          <Dialog open={isAdjustStockDialogOpen} onOpenChange={setIsAdjustStockDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
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

              <Form {...stockAdjustmentForm}>
                <form onSubmit={stockAdjustmentForm.handleSubmit(handleAdjustStock)} className="space-y-4">
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
                  <FormField
                    control={stockAdjustmentForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          {stockAdjustmentForm.watch('adjustmentType') === 'add' && 'Units to add to current stock'}
                          {stockAdjustmentForm.watch('adjustmentType') === 'subtract' && 'Units to remove from current stock'}
                          {stockAdjustmentForm.watch('adjustmentType') === 'set' && 'New total stock value'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={stockAdjustmentForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Reason for adjustment" {...field} />
                        </FormControl>
                        <FormDescription>
                          Provide a reason for this stock adjustment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
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
                </form>
              </Form>
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
              <div className="mb-4 p-4 border rounded bg-destructive/10 text-destructive">
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No products found</p>
                <p className="text-sm mt-2">Click "Add Product" to create your first product</p>
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
