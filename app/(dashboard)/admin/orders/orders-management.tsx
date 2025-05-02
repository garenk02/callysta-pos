'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateRange } from 'react-day-picker'
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
} from "@/components/ui/dialog"
import {
  Receipt,
  Loader2,
  Search
} from "lucide-react"
import { columns } from "./columns"
import { getOrders, getOrderById, OrderWithUser } from "@/app/api/orders/actions"
import { OrderItem } from "@/types"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format, subDays } from "date-fns"

export default function OrdersManagement() {
  const [orders, setOrders] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30), // Default to last 30 days
    to: new Date()
  })

  // Function to fetch orders with date range
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getOrders(dateRange)
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Fetch orders when component mounts or date range changes
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  // Function to open order details dialog
  const openDetailsDialog = async (order: OrderWithUser) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
    setDetailsLoading(true)

    try {
      const result = await getOrderById(order.id)
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data) {
        setOrderItems(result.data.items)
        // Update the selected order with the latest data
        setSelectedOrder(result.data.order)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to fetch order details')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Function to format payment method for display
  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get unique payment methods for filtering
  const paymentMethods = [...new Set(orders.map(order => order.payment_method))].map(method => ({
    label: formatPaymentMethod(method),
    value: method,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Order History</CardTitle>
          <CardDescription>
            View and manage all orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Filter by Date Range</h3>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No orders found</p>
              <p className="text-sm mt-2">Orders will appear here when customers make purchases</p>
            </div>
          ) : (
            <DataTable
              columns={columns({
                onViewDetails: openDetailsDialog,
              })}
              data={orders}
              searchKey="user"
              filterableColumns={[
                {
                  id: "payment_method",
                  title: "Payment Method",
                  options: paymentMethods,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order ID: ${selectedOrder.id}`}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                  <p>{format(new Date(selectedOrder.created_at), "PPP p")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                  <p className="capitalize">{formatPaymentMethod(selectedOrder.payment_method)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">User</h3>
                  <p>{selectedOrder.user?.name || selectedOrder.user?.email || 'Unknown User'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                  <p className="text-xs truncate" title={selectedOrder.user_id}>{selectedOrder.user_id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subtotal</h3>
                  <p>{new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedOrder.subtotal)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tax</h3>
                  <p>{new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedOrder.tax)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
                  <p className="font-medium">{new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedOrder.total)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Items</h3>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.product_name}</td>
                          <td className="px-4 py-2 text-sm">{new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(item.product_price)}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.payment_details && selectedOrder.payment_method === 'cash' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount Tendered</h3>
                    <p>{new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(selectedOrder.payment_details.amount_tendered || 0)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Change Due</h3>
                    <p>{new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(selectedOrder.payment_details.change_due || 0)}</p>
                  </div>
                </div>
              )}

              {selectedOrder.payment_details && selectedOrder.payment_method === 'card' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Card Type</h3>
                    <p className="capitalize">{selectedOrder.payment_details.card_type || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Four</h3>
                    <p>{selectedOrder.payment_details.card_last_four || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No order details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
