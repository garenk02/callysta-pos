"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types"
import { DataTableColumnHeader } from "./data-table-column-header"
import { formatCurrency } from "@/lib/utils"
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

export const columns = ({ onEdit, onDelete, onAdjustStock, isAdmin }: ProductsColumnProps): ColumnDef<Product>[] => [
  // 1. Name column
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" className="w-[300px]" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium line-clamp-2 text-ellipsis overflow-hidden w-full">
          {row.getValue("name")}
        </div>
      )
    },
    enableSorting: true,
  },

  // 2. SKU column
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => {
      return <div className="text-sm text-center">{row.getValue("sku") || "-"}</div>
    },
    enableSorting: true,
  },

  // 3. Category column
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      return <div className="text-sm text-center">{row.getValue("category") || "-"}</div>
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
  },

  // 4. Price column
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" className="text-right" />
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return <div className="text-right">{formatCurrency(price)}</div>
    },
    enableSorting: true,
  },

  // 5. Stock column
  {
    accessorKey: "stock_quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stock = parseInt(row.getValue("stock_quantity"))
      return <div className="text-center">{stock}</div>
    },
    enableSorting: true,
  },

  // 6. Status column
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean
      return value.includes(String(isActive))
    },
    enableSorting: true,
  },

  // 7. Actions column
  {
    id: "actions",
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
    enableSorting: false,
  },
]
