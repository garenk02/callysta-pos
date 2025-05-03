'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormDescription, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package, PlusCircle, Loader2
} from "lucide-react"
import { columns } from "./columns"
import {
  getProducts, createProduct, updateProduct, deleteProduct
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
  sku: z.string().optional(),
  category: z.string().optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
});

export default function ProductsManagement() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const hasMounted = useRef(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);

  // Mark component as mounted
  useEffect(() => {
    hasMounted.current = true;
    return () => {
      hasMounted.current = false;
    };
  }, []);

  // Load products on component mount or when pagination/filters change
  useEffect(() => {
    // Only fetch data on the client side
    if (hasMounted.current) {
      loadProducts();
    }
  }, [page, pageSize, searchQuery, selectedCategory, selectedStatus]);

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
        isActive: selectedStatus
      });

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setProducts(data.products || []);
        setTotalItems(data.totalCount);
        setTotalPages(data.totalPages);
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
    setSearchQuery(query);
    setPage(1); // Reset to first page when search changes
  };

  const handleCategoryFilter = (category: string | undefined) => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilter = (status: string | undefined) => {
    if (status === undefined) {
      setSelectedStatus(undefined);
    } else {
      setSelectedStatus(status === 'true');
    }
    setPage(1); // Reset to first page when filter changes
  };

  // Form for adding a new product
  const addProductForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
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
      sku: "",
      category: "",
      is_active: true,
      image_url: "",
    },
  });

  // Handle adding a new product
  const handleAddProduct = async (values: z.infer<typeof productFormSchema>) => {
    setIsSubmitting(true);
    try {
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
    editProductForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
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
      const { data, error } = await deleteProduct(productId);

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

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>

          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
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
                          <FormLabel>Product Image</FormLabel>
                          <FormControl>
                            <ProductImageUpload
                              value={field.value}
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
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>
                    Update product details and inventory.
                  </DialogDescription>
                </DialogHeader>

                <Form {...editProductForm}>
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
                            <ProductImageUpload
                              value={field.value}
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
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

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

            {loading ? (
              <div className="flex flex-col justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-primary">Loading products...</p>
              </div>
            ) : products.length === 0 && totalItems === 0 ? (
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
                  isAdmin,
                })}
                data={products}
                searchKey="name"
                filterableColumns={[
                  {
                    id: "is_active",
                    title: "Status",
                    options: [
                      { label: "Active", value: "true" },
                      { label: "Inactive", value: "false" },
                    ],
                  },
                ]}
                pagination={{
                  page,
                  pageSize,
                  totalItems,
                  totalPages,
                  onPageChange: setPage,
                  onPageSizeChange: (newPageSize) => {
                    setPageSize(newPageSize);
                    setPage(1); // Reset to first page when page size changes
                  }
                }}
                onSearch={handleSearch}
                onFilterChange={(columnId, value) => {
                  if (columnId === 'is_active') {
                    handleStatusFilter(value);
                  } else if (columnId === 'category') {
                    handleCategoryFilter(value);
                  }
                }}
              />
            )}
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
