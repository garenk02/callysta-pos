'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table/data-table"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { ProductsTableToolbar } from "./products-table-toolbar"
import { useDebounce } from "@/hooks/useDebounce"
import { virtualizedColumns } from "./virtualized-columns"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { NoAutofocusDialogContent } from "@/components/ui/no-autofocus-dialog"
import {
  Form, FormControl, FormDescription, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package, PlusCircle, Loader2, RefreshCw
} from "lucide-react"
import {
  getProducts, createProduct, updateProduct, deleteProduct, adjustStock
} from "@/app/api/products/actions"
import { Product } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import ProductImageUpload from "@/components/products/ProductImageUpload"

// Form schema for adding/editing products
const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  stock_quantity: z.coerce.number().int().min(0, {
    message: "Stock quantity must be a positive integer.",
  }),
  low_stock_threshold: z.coerce.number().int().min(1, {
    message: "Low stock threshold must be at least 1.",
  }).optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
});

// Form schema for stock adjustment
const stockAdjustmentSchema = z.object({
  quantityChange: z.coerce.number().refine(val => val !== 0, {
    message: "Quantity change cannot be zero",
  }),
  reason: z.string().min(1, {
    message: "Reason is required",
  }),
});

export default function ProductsManagement() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // We need setImageFile for the ProductImageUpload component
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const hasMounted = useRef(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebounce(searchInput, 300); // Debounce search input by 300ms
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Mark component as mounted
  useEffect(() => {
    hasMounted.current = true;
    return () => {
      hasMounted.current = false;
    };
  }, []);

  // Store all available categories
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Load products on component mount or when pagination/filters/sorting change
  useEffect(() => {
    // Only fetch data on the client side
    if (hasMounted.current) {
      loadProducts();
    }
  }, [page, pageSize, searchQuery, selectedCategory, selectedStatus, sortBy, sortDirection]);

  // Load products function
  async function loadProducts() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getProducts({
        page,
        pageSize,
        searchQuery,
        category: selectedCategory,
        isActive: selectedStatus,
        sortBy,
        sortDirection
      });

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setProducts(data.products || []);
        setTotalItems(data.totalCount);
        setTotalPages(data.totalPages);

        // Extract all unique categories for the filter
        if (data.products && data.products.length > 0) {
          const categories = Array.from(
            new Set(
              data.products
                .map(p => p.category)
                .filter(Boolean)
            )
          ) as string[];

          // If we're on the first page, fetch all categories for the filter
          if (page === 1) {
            try {
              // Get all categories from all products
              const { data: allData } = await getProducts({
                page: 1,
                pageSize: 1000, // Large number to get all products
                searchQuery: '',
              });

              if (allData && allData.products) {
                const allUniqueCategories = Array.from(
                  new Set(
                    allData.products
                      .map(p => p.category)
                      .filter(Boolean)
                  )
                ) as string[];

                setAllCategories(allUniqueCategories);
              }
            } catch (err) {
              console.error('Error fetching all categories:', err);
              // Fallback to categories from current page
              setAllCategories(categories);
            }
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle search and filter changes
  const handleSearch = (query: string) => {
    setSearchInput(query);
    setPage(1); // Reset to first page when search changes
  };

  const handleCategoryFilter = (category: string | undefined) => {
    setSelectedCategory(category);
    setColumnFilters(prev => ({
      ...prev,
      category: category
    }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilter = (status: string | undefined) => {
    if (status === undefined) {
      setSelectedStatus(undefined);
      setColumnFilters(prev => ({
        ...prev,
        is_active: undefined
      }));
    } else {
      setSelectedStatus(status === 'true');
      setColumnFilters(prev => ({
        ...prev,
        is_active: status
      }));
    }
    setPage(1); // Reset to first page when filter changes
  };

  // State to track column filters for UI display
  const [columnFilters, setColumnFilters] = useState<{
    is_active?: string;
    category?: string;
  }>({});

  // Handle sorting changes
  const handleSortingChange = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
    setPage(1); // Reset to first page when sorting changes
  };

  // We've removed column visibility toggle to match orders/users UI

  // We've removed bulk actions since we removed the checkbox column

  // Form for adding a new product
  const addProductForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      sku: "",
      category: "",
      is_active: true,
      image_url: "",
    },
  });

  // Form for editing a product
  const editProductForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      sku: "",
      category: "",
      is_active: true,
      image_url: "",
    },
  });

  // Form for stock adjustment
  const stockAdjustmentForm = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      quantityChange: 0,
      reason: "",
    },
  });

  // Handle adding a new product
  const handleAddProduct = async (values: z.infer<typeof productFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Log the form values to verify the image_url is included
      // console.log("Creating product with values:", values);

      const { data, error } = await createProduct({
        ...values,
      });

      if (error) {
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      // Add the new product to the list
      if (data) {
        setProducts((prev) => [data, ...prev]);
      }

      toast.success("Product created successfully");
      setIsAddDialogOpen(false);
      addProductForm.reset();
      setImagePreview(null); // Reset the image preview
    } catch (err) {
      console.error("Error creating product:", err);
      toast.error("An unexpected error occurred while creating the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog and populate form with product data
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);

    // Set the image preview if the product has an image URL
    if (product.image_url) {
      // console.log("Setting image preview to:", product.image_url);
      setImagePreview(product.image_url);
    } else {
      setImagePreview(null);
    }

    editProductForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold || 10,
      sku: product.sku || "",
      category: product.category || "",
      is_active: product.is_active !== false, // Default to true if undefined
      image_url: product.image_url || "",
    });

    setIsEditDialogOpen(true);
  };

  // Handle editing a product
  const handleEditProduct = async (values: z.infer<typeof productFormSchema>) => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      // Log the form values to verify the image_url is included
      // console.log("Updating product with values:", values);

      const { data, error } = await updateProduct(selectedProduct.id, {
        ...values,
      });

      if (error) {
        toast.error(`Failed to update product: ${error.message}`);
        return;
      }

      // Update the product in the list
      if (data) {
        setProducts((prev) =>
          prev.map((product) => (product.id === data.id ? data : product))
        );
      }

      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setImagePreview(null); // Reset the image preview
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error("An unexpected error occurred while updating the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await deleteProduct(productId);

      if (error) {
        toast.error(`Failed to delete product: ${error.message}`);
        return;
      }

      // Remove the product from the list
      setProducts((prev) => prev.filter((product) => product.id !== productId));

      toast.success("Product deleted successfully");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("An unexpected error occurred while deleting the product");
    }
  };

  // Open stock adjustment dialog
  const openAdjustStockDialog = (product: Product) => {
    setSelectedProduct(product);
    stockAdjustmentForm.reset({
      quantityChange: 0,
      reason: "",
    });
    setIsAdjustStockDialogOpen(true);
  };

  // Handle stock adjustment
  const handleAdjustStock = async (values: z.infer<typeof stockAdjustmentSchema>) => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await adjustStock(
        selectedProduct.id,
        values.quantityChange,
        values.reason
      );

      if (error) {
        toast.error(`Failed to adjust stock: ${error.message}`);
        return;
      }

      // Update the product in the list
      if (data) {
        setProducts((prev) =>
          prev.map((product) => (product.id === data.id ? data : product))
        );
      }

      toast.success("Stock adjusted successfully");
      setIsAdjustStockDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error("Error adjusting stock:", err);
      toast.error("An unexpected error occurred while adjusting stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>

          {/* Allow both admin and cashier to add products */}
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                // Reset form when dialog is closed
                addProductForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <NoAutofocusDialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product to sell in your store.
                </DialogDescription>
              </DialogHeader>

              <Form {...addProductForm}>
                <form
                  onSubmit={addProductForm.handleSubmit(handleAddProduct)}
                  className="space-y-4 overflow-y-auto pr-1"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addProductForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Product description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={addProductForm.control}
                        name="stock_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                {...field}
                              />
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
                            <FormDescription className="text-xs">
                              Alert when stock falls below this level
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                placeholder="10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    </div>



                    <FormField
                      control={addProductForm.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          <FormControl>
                            <ProductImageUpload
                              value={field.value || ""}
                              onChange={(url) => field.onChange(url)}
                              onImageChange={(file) => setImageFile(file)}
                              preview={imagePreview}
                              setPreview={setImagePreview}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              Product will be available for sale when active
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                  <DialogFooter className="mt-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Product
                    </Button>
                  </DialogFooter>
                  </form>
                </Form>
              </NoAutofocusDialogContent>
            </Dialog>

          {/* Allow both admin and cashier to edit products */}
          <Dialog
            open={isEditDialogOpen && selectedProduct !== null}
            onOpenChange={(open) => {
              if (!open) {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
              }
            }}
          >
            <NoAutofocusDialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product details and inventory.
                </DialogDescription>
              </DialogHeader>

              {selectedProduct && <Form {...editProductForm}>
                <form
                  onSubmit={editProductForm.handleSubmit(handleEditProduct)}
                  className="space-y-4 overflow-y-auto pr-1"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editProductForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Product description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={editProductForm.control}
                        name="stock_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                {...field}
                              />
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
                            <FormDescription className="text-xs">
                              Alert when stock falls below this level
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                placeholder="10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    </div>



                    <FormField
                      control={editProductForm.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Image</FormLabel>
                          <FormControl>
                            <ProductImageUpload
                              value={field.value || ""}
                              onChange={(url) => field.onChange(url)}
                              onImageChange={(file) => setImageFile(file)}
                              preview={imagePreview}
                              setPreview={setImagePreview}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              Product will be available for sale when active
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                  <DialogFooter className="mt-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Product
                    </Button>
                  </DialogFooter>
                  </form>
                </Form>}
              </NoAutofocusDialogContent>
            </Dialog>

          <Dialog
            open={isAdjustStockDialogOpen && selectedProduct !== null}
            onOpenChange={(open) => {
              if (!open) {
                setIsAdjustStockDialogOpen(false);
                // Don't reset selectedProduct here as it might be needed for other operations
              }
            }}
          >
            <NoAutofocusDialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>
                  Increase or decrease the stock quantity for this product.
                </DialogDescription>
              </DialogHeader>

              {selectedProduct && (
                <>
                  <div className="mb-4 p-4 bg-muted rounded-md">
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Current stock: <span className="font-medium">{selectedProduct.stock_quantity}</span>
                    </div>
                  </div>

                  <Form {...stockAdjustmentForm}>
                    <form
                      onSubmit={stockAdjustmentForm.handleSubmit(handleAdjustStock)}
                      className="space-y-4"
                    >
                      <FormField
                        control={stockAdjustmentForm.control}
                        name="quantityChange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity Change</FormLabel>
                            <FormDescription>
                              Enter a positive number to add stock or a negative number to remove stock.
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
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
                              <Input placeholder="Reason for adjustment" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="mt-4 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAdjustStockDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Adjust Stock
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}
            </NoAutofocusDialogContent>
          </Dialog>
        </div>

        {/* Storage Initializer component hidden as requested */}

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your product inventory and pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="relative">
              {/* Loading overlay - absolute positioned over the table */}
              {loading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-primary">Loading products...</p>
                </div>
              )}

              {/* Empty state message - shown only when not loading and no products */}
              {!loading && products.length === 0 && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
                  <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm mt-1 text-muted-foreground mb-4">
                    {totalItems === 0
                      ? "Click \"Add Product\" to create your first product"
                      : "Try adjusting your search or filters"}
                  </p>

                  {/* Always show reset button in empty state */}
                  <Button
                    variant="default"
                    onClick={() => {
                      // Reset all state values
                      setSearchInput('');
                      setSelectedCategory(undefined);
                      setSelectedStatus(undefined);
                      setColumnFilters({});
                      setPage(1);

                      // Force a reload with default parameters
                      getProducts({
                        page: 1,
                        pageSize: 10,
                        searchQuery: '',
                        category: undefined,
                        isActive: undefined,
                        sortBy: 'name',
                        sortDirection: 'asc'
                      }).then(({ data, error }) => {
                        if (error) {
                          setError(error.message);
                        } else if (data) {
                          setProducts(data.products || []);
                          setTotalItems(data.totalCount);
                          setTotalPages(data.totalPages);
                        }
                        setLoading(false);
                      }).catch(err => {
                        console.error('Error resetting products view:', err);
                        setLoading(false);
                      });
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default View
                  </Button>
                </div>
              )}

              {/* Always render the table */}
              <VirtualizedDataTable
                columns={virtualizedColumns({
                  onEdit: openEditDialog,
                  onDelete: handleDeleteProduct,
                  onAdjustStock: openAdjustStockDialog,
                  isAdmin,
                })}
                data={loading ? [] : products}
                searchKey="name"
                onSearch={handleSearch}
                searchPlaceholder="Search products..."
                currentSearchValue={searchInput}
                filterableColumns={[
                  {
                    id: "is_active",
                    title: "Status",
                    options: [
                      { label: "Active", value: "true" },
                      { label: "Inactive", value: "false" },
                    ],
                  },
                  {
                    id: "category",
                    title: "Category",
                    options: allCategories.map(category => ({
                      label: category,
                      value: category
                    }))
                  }
                ]}
                onFilterChange={(columnId: string, value: string | undefined) => {
                  if (columnId === 'is_active') {
                    handleStatusFilter(value);
                  } else if (columnId === 'category') {
                    handleCategoryFilter(value);
                  }
                }}
                height={560} // Reduced height to make room for pagination
                selectedFilters={columnFilters}
              />

              {/* Custom Pagination */}
              {!loading && products.length > 0 && (
                <DataTablePagination
                  table={{
                    getState: () => ({ pagination: { pageIndex: page - 1, pageSize } }),
                    getFilteredRowModel: () => ({ rows: { length: totalItems } }),
                    getPageCount: () => totalPages,
                    getFilteredSelectedRowModel: () => ({ rows: { length: 0 } }),
                    setPageIndex: () => {},
                    setPageSize: () => {},
                  } as any}
                  customPagination={{
                    page,
                    pageSize,
                    totalItems,
                    totalPages,
                    onPageChange: (newPage) => setPage(newPage),
                    onPageSizeChange: (newSize) => {
                      setPageSize(newSize);
                      setPage(1); // Reset to first page when changing page size
                    }
                  }}
                />
              )}
            </div>
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
