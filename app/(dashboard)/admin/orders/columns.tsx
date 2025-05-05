"use client"

import { ColumnDef } from "@tanstack/react-table"
import { OrderWithUser } from "@/app/api/orders/actions"
import { DataTableColumnHeader } from "./data-table-column-header"
import { MoreHorizontal, Eye, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

interface OrdersColumnProps {
  onView: (orderId: string) => void
  onViewReceipt: (order: OrderWithUser) => void
}

export const columns = ({ onView, onViewReceipt }: OrdersColumnProps): ColumnDef<OrderWithUser>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return <div className="font-medium">#{id.substring(0, 8)}</div>
    },
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cashier" />
    ),
    cell: ({ row }) => {
      const user = row.getValue("user") as { email: string; name?: string } | undefined
      return (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{user?.name || 'Guest'}</div>
            <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
          </div>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total"))
      return <div className="font-medium">{formatCurrency(total)}</div>
    },
  },
  {
    accessorKey: "payment_method",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Method" />
    ),
    cell: ({ row }) => {
      const paymentMethod = row.getValue("payment_method") as string
      return (
        <Badge variant="outline" className="capitalize">
          {paymentMethod.replace('_', ' ')}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || value.length === 0) return true;
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string)
      return <div>{format(date, "MMM d, yyyy h:mm a")}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

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
            <DropdownMenuItem onClick={() => onView(order.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewReceipt(order)}>
              <Eye className="mr-2 h-4 w-4" />
              View Receipt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
