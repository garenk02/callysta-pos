"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types"
import { MoreHorizontal, Edit, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ProductsColumnProps {
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onAdjustStock: (product: Product) => void
  isAdmin: boolean
}

export const virtualizedColumns = ({ onEdit, onDelete, onAdjustStock, isAdmin }: ProductsColumnProps): ColumnDef<Product>[] => [
  // 1. Image column
  {
    accessorKey: "image_url",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Product"
                width={40}
                height={40}
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="text-xs text-muted-foreground">No image</div>
            )}
          </div>
        </div>
      )
    },
    meta: {
      className: "w-[80px] flex-shrink-0"
    }
  },

  // 2. Name column
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>
    },
    meta: {
      className: "flex-1 min-w-[200px]"
    }
  },

  // 3. SKU column
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => {
      return <div className="text-sm text-center">{row.original.sku || "-"}</div>
    },
    meta: {
      className: "text-center w-[120px]"
    }
  },

  // 4. Category column
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return <div className="text-sm text-center">{row.original.category || "-"}</div>
    },
    meta: {
      className: "text-center w-[120px]"
    }
  },

  // 5. Price column
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.original.price.toString())
      const formatted = `Rp.${price.toLocaleString('id-ID')}`
      return <div className="text-right">{formatted}</div>
    },
    meta: {
      className: "text-right w-[100px]"
    }
  },

  // 6. Stock column
  {
    accessorKey: "stock_quantity",
    header: "Stock",
    cell: ({ row }) => {
      const stock = parseInt(row.original.stock_quantity.toString())
      return <div className="text-center">{stock}</div>
    },
    meta: {
      className: "text-center w-[80px]"
    }
  },

  // 7. Status column
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return (
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    meta: {
      className: "text-center w-[100px]"
    }
  },

  // 8. Actions column
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdjustStock(product)}>
              <Package className="mr-2 h-4 w-4" />
              Adjust Stock
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(product.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    meta: {
      className: "text-right w-[100px]"
    }
  },
]
