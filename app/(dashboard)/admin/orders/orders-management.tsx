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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Receipt as ReceiptIcon,
  Loader2
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getOrders, getOrderById, OrderWithUser } from "@/app/api/orders/actions"
import { OrderItem } from "@/types"
import ReceiptComponent from "@/components/checkout/Receipt"

export default function OrdersManagement() {
  const [orders, setOrders] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Load orders on component mount
  useEffect(() => {
    loadOrders()
  }, [dateRange])

  // Load orders function
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getOrders(dateRange)

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setOrders(data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching orders.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // View order details
  const handleViewOrder = async (orderId: string) => {
    try {
      const { data, error } = await getOrderById(orderId)

      if (error) {
        console.error('Error fetching order details:', error.message)
        return
      }

      if (data) {
        setSelectedOrder(data.order)
        setOrderItems(data.items)
        setIsViewDialogOpen(true)
      }
    } catch (err) {
      console.error('Error viewing order:', err)
    }
  }

  // View receipt
  const handleViewReceipt = async (order: OrderWithUser) => {
    try {
      const { data, error } = await getOrderById(order.id)

      if (error) {
        console.error('Error fetching order details for receipt:', error.message)
        return
      }

      if (data) {
        setSelectedOrder(data.order)
        setOrderItems(data.items)
        setIsReceiptDialogOpen(true)
      }
    } catch (err) {
      console.error('Error viewing receipt:', err)
    }
  }

  // Helper function to safely format currency values
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'Rp.0';
    return `Rp.${value.toLocaleString('id-ID')}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            View and manage customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ReceiptIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No orders found</p>
              <p className="text-sm mt-2">Orders will appear here when customers make purchases</p>
            </div>
          ) : (
            <DataTable
              columns={columns({
                onView: handleViewOrder,
                onViewReceipt: handleViewReceipt
              })}
              data={orders}
              searchKey="id"
              filterableColumns={[
                {
                  id: "payment_method",
                  title: "Payment Method",
                  options: [
                    { label: "Cash", value: "cash" },
                    { label: "Card", value: "card" },
                    { label: "Mobile Payment", value: "mobile_payment" },
                    { label: "Bank Transfer", value: "bank_transfer" },
                  ].map(option => ({
                    ...option,
                    value: option.value || "undefined"
                  })),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                  <p>{selectedOrder.user?.name || selectedOrder.user?.email || 'Guest'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                  <p className="capitalize">{selectedOrder.payment_method.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
                  <p className="font-medium">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Items</h3>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.product_name}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.product_price)}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Subtotal:</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(selectedOrder.subtotal)}</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Tax:</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(selectedOrder.tax)}</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Total:</td>
                        <td className="px-4 py-2 text-sm font-medium text-right">{formatCurrency(selectedOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.payment_details && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Details</h3>
                  <div className="border rounded-md p-4 space-y-2">
                    {selectedOrder.payment_method === 'cash' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount Tendered:</span>
                          <span className="text-sm">{formatCurrency(selectedOrder.payment_details.amount_tendered)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Change Due:</span>
                          <span className="text-sm">{formatCurrency(selectedOrder.payment_details.change_due)}</span>
                        </div>
                      </>
                    )}
                    {selectedOrder.payment_method === 'card' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Card Type:</span>
                          <span className="text-sm capitalize">{selectedOrder.payment_details.card_type || 'Unknown'}</span>
                        </div>
                        {selectedOrder.payment_details.card_last_four && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Card Number:</span>
                            <span className="text-sm">**** **** **** {selectedOrder.payment_details.card_last_four}</span>
                          </div>
                        )}
                      </>
                    )}
                    {selectedOrder.payment_method === 'mobile_payment' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Provider:</span>
                        <span className="text-sm">{selectedOrder.payment_details.mobile_payment_provider || 'Unknown'}</span>
                      </div>
                    )}
                    {selectedOrder.payment_method === 'bank_transfer' && (
                      <>
                        {selectedOrder.payment_details.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Bank:</span>
                            <span className="text-sm">{selectedOrder.payment_details.bank_name}</span>
                          </div>
                        )}
                        {selectedOrder.payment_details.bank_reference && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Reference:</span>
                            <span className="text-sm">{selectedOrder.payment_details.bank_reference}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {selectedOrder && (
        <ReceiptComponent
          open={isReceiptDialogOpen}
          onOpenChange={setIsReceiptDialogOpen}
          order={{
            id: selectedOrder.id,
            date: new Date(selectedOrder.created_at),
            items: orderItems.map(item => ({
              name: item.product_name,
              price: item.product_price,
              quantity: item.quantity,
              total: item.total
            })),
            subtotal: selectedOrder.subtotal,
            tax: selectedOrder.tax,
            total: selectedOrder.total,
            paymentMethod: selectedOrder.payment_method,
            paymentDetails: selectedOrder.payment_details
          }}
        />
      )}
    </div>
  )
}
