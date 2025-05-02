"use client"

import { useState, useEffect } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Tag, MoreHorizontal, Pencil, Trash2, ImageIcon, PackagePlus } from "lucide-react"
import { getFileUrl } from "@/lib/supabase/storage"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

// Component to handle image display with hooks
function ProductImage({ imageUrl, productName }: { imageUrl: string, productName: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Process the image URL when the component mounts
  useEffect(() => {
    let isMounted = true;

    if (imageUrl) {
      // Try to get a valid URL for the image
      const fetchImageUrl = async () => {
        try {
          const url = await getFileUrl(imageUrl);
          if (isMounted) {
            setProcessedUrl(url || imageUrl); // Use original URL as fallback
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error getting image URL:', error);
            setProcessedUrl(imageUrl); // Fallback to the original URL
          }
        }
      };

      fetchImageUrl();
    } else {
      setProcessedUrl(null);
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  // Reset error state when image URL changes
  useEffect(() => {
    setImgError(false);
    setImageLoaded(false);
  }, [imageUrl, processedUrl]);

  // If we have an image URL but loading failed, show placeholder with error state
  if (imageUrl && imgError) {
    return (
      <div className="h-10 w-10 rounded-md bg-muted/50 border border-destructive/20 flex items-center justify-center">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  // If we have an image URL, try to display it
  return imageUrl ? (
    <div className="relative h-10 w-10 rounded-md overflow-hidden">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground animate-pulse" />
        </div>
      )}
      <img
        src={processedUrl || imageUrl}
        alt={productName || "Product image"}
        className="object-cover h-full w-full"
        onLoad={() => {
          setImageLoaded(true);
          setImgError(false);
        }}
        onError={() => {
          setImageLoaded(false);
          setImgError(true);
        }}
      />
    </div>
  ) : (
    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
      <ImageIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

interface ProductActionsProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onAdjustStock?: (product: Product) => void
}

export function ProductActions({
  product,
  onEdit,
  onDelete,
  onAdjustStock
}: ProductActionsProps) {
  // Get user role to check if they're an admin
  const { isAdmin } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {onAdjustStock && (
          <DropdownMenuItem onClick={() => onAdjustStock(product)}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Adjust Stock
          </DropdownMenuItem>
        )}

        {/* Only show delete option for admin users */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the product &quot;{product.name}&quot;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(product.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns = ({
  onEdit,
  onDelete,
  onAdjustStock,
}: {
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onAdjustStock?: (product: Product) => void
}): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image_url",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Image" />
    ),
    cell: ({ row }) => {
      const imageUrl = row.getValue("image_url") as string
      return <ProductImage imageUrl={imageUrl} productName={row.getValue("name") as string} />;
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price).replace('Rp', 'Rp.')
      return <div>{formatted}</div>
    },
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => {
      const sku = row.getValue("sku") as string
      return sku ? (
        <div className="flex items-center">
          <Tag className="mr-1 h-3 w-3 text-muted-foreground" />
          <span>{sku}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return category ? (
        <Badge variant="outline">{category}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "stock_quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stockQuantity = row.getValue("stock_quantity") as number
      const lowStockThreshold = row.original.low_stock_threshold as number | undefined

      // Determine if stock is low
      const isLowStock = lowStockThreshold !== undefined && stockQuantity <= lowStockThreshold

      return (
        <div className={`font-medium ${isLowStock ? 'text-destructive' : ''}`}>
          {stockQuantity}
          {isLowStock && (
            <span className="ml-2 text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm">
              Low
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return isActive !== false ? (
        <span className="flex items-center text-green-600">
          <Checkbox checked={true} disabled className="mr-2 h-4 w-4" />
          Active
        </span>
      ) : (
        <span className="flex items-center text-muted-foreground">
          <Checkbox checked={false} disabled className="mr-2 h-4 w-4" />
          Inactive
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
      return (
        <ProductActions
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdjustStock={onAdjustStock}
        />
      )
    },
  },
]
