"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Order } from "@/types"
import { OrderWithUser } from "@/app/api/orders/actions"
import { MoreHorizontal, Eye, Printer, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"

interface OrdersColumnProps {
  onViewDetails: (order: string) => void
  onPrintReceipt: (order: OrderWithUser) => void
}

export const virtualizedColumns = ({ onViewDetails, onPrintReceipt }: OrdersColumnProps): ColumnDef<OrderWithUser>[] => [
  // 1. Order ID column
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.id.substring(0, 8)}</div>
    },
    meta: {
      className: "w-[120px]" // Increased width from 100px to 120px
    }
  },

  // 2. Date column
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      return <div>{formatDate(row.original.created_at)}</div>
    },
    meta: {
      className: "w-[180px]" // Increased width from 120px to 180px
    }
  },

  // 3. Cashier column (using user information if available)
  {
    id: "cashier",
    header: "Cashier",
    cell: ({ row }) => {
      // Try to get cashier name from user information if available
      const userName = row.original.user?.name;
      const userEmail = row.original.user?.email;

      // Show name if available, email as fallback, or "Unknown" as default
      return <div>{userName || userEmail || "Unknown"}</div>
    },
    meta: {
      className: "w-[250px]" // Changed from flex-1 min-w-[150px] to fixed width
    }
  },

  // 4. Total column
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      // Safely handle the total value using the global formatCurrency function
      const total = row.original.total;
      const amount = typeof total === 'string' ? parseFloat(total) : total;
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
    meta: {
      className: "text-right w-[200px]"
    }
  },

  // 5. Payment Method column
  {
    accessorKey: "payment_method",
    header: "Payment",
    cell: ({ row }) => {
      const method = row.original.payment_method;

      // Format payment method for display
      let displayMethod;
      switch (method) {
        case 'bank_transfer':
          displayMethod = 'Bank Transfer';
          break;
        case 'mobile_payment':
          displayMethod = 'Mobile Payment';
          break;
        default:
          // Capitalize first letter of each word for other payment methods
          displayMethod = method
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      return <div>{displayMethod}</div>;
    },
    meta: {
      className: "w-[200px]" // Increased width from 120px to 140px
    }
  },

  // 6. Actions column
  {
    id: "actions",
    header: "Actions",
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
            <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPrintReceipt(order as OrderWithUser)}>
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    meta: {
      className: "text-right w-[100px]"
    }
  },
]
