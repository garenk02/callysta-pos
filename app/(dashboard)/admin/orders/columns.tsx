"use client"

import { ColumnDef } from "@tanstack/react-table"
import { OrderWithUser } from "@/app/api/orders/actions"
import { Checkbox } from "@/components/ui/checkbox"
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

interface OrderActionsProps {
  order: OrderWithUser
  onViewDetails: (order: OrderWithUser) => void
}

export function OrderActions({
  order,
  onViewDetails,
}: OrderActionsProps) {
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
        <DropdownMenuItem onClick={() => onViewDetails(order)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns = ({
  onViewDetails,
}: {
  onViewDetails: (order: OrderWithUser) => void
}): ColumnDef<OrderWithUser>[] => [
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
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return <div className="font-medium">{id.substring(0, 8)}...</div>
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string)
      return <div>{format(date, "PPP p")}</div>
    },
  },
  {
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const order = row.original
      const userEmail = order.user?.email
      const userName = order.user?.name
      const displayName = userName || userEmail || 'Unknown User'

      return (
        <div className="flex items-center">
          <User className="mr-1 h-3 w-3 text-muted-foreground" />
          <span title={userEmail}>{displayName}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const order = row.original
      const userEmail = order.user?.email || ''
      const userName = order.user?.name || ''
      return userEmail.toLowerCase().includes(value.toLowerCase()) ||
             userName.toLowerCase().includes(value.toLowerCase())
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(total).replace('Rp', 'Rp.')
      return <div className="font-medium">{formatted}</div>
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
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original
      return (
        <OrderActions
          order={order}
          onViewDetails={onViewDetails}
        />
      )
    },
  },
]
