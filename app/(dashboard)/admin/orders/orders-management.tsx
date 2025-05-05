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
  Loader2,
  RefreshCw
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { virtualizedColumns } from "./virtualized-columns"
import { useDebounce } from "@/hooks/useDebounce"
import { getOrders, getOrderById, OrderWithUser } from "@/app/api/orders/actions"
import { OrderItem } from "@/types"
import ReceiptComponent from "@/components/checkout/Receipt"
import { toast } from "sonner"

export default function OrdersManagement() {
  const [orders, setOrders] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true) // Main loading state for initial data fetch
  const [filterLoading, setFilterLoading] = useState(false) // Loading state for filter/search operations
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const [columnFilters, setColumnFilters] = useState<{
    payment_method?: string;
  }>({})
  const [searchInput, setSearchInput] = useState('')

  // Load orders on component mount or when date range changes
  useEffect(() => {
    loadOrders()
  }, [dateRange])

  // Store the original unfiltered orders
  const [allOrders, setAllOrders] = useState<OrderWithUser[]>([])

  // Apply filters when columnFilters or searchInput changes
  useEffect(() => {
    // If we're in the main loading state or don't have any orders yet, don't do anything
    if (loading || allOrders.length === 0) return;

    // Set filter loading state to true to show loading indicator
    setFilterLoading(true);

    // Use setTimeout to ensure the loading indicator is shown
    // This creates a small delay that makes the UI feel more responsive
    setTimeout(() => {
      // Start with all orders
      let filteredOrders = [...allOrders];

      // Apply payment method filter if set
      if (columnFilters.payment_method) {
        filteredOrders = filteredOrders.filter(order =>
          order.payment_method === columnFilters.payment_method
        );
      }

      // Apply search filter if set
      if (searchInput) {
        filteredOrders = filteredOrders.filter(order => {
          // Search by Order ID (case insensitive)
          const idMatch = order.id.toLowerCase().includes(searchInput.toLowerCase());

          // Search by Cashier name or email (case insensitive)
          const cashierNameMatch = order.user?.name?.toLowerCase().includes(searchInput.toLowerCase()) || false;
          const cashierEmailMatch = order.user?.email?.toLowerCase().includes(searchInput.toLowerCase()) || false;

          // Return true if any of the conditions match
          return idMatch || cashierNameMatch || cashierEmailMatch;
        });
      }

      // Update the orders list with filtered results
      setOrders(filteredOrders);

      // Set filter loading state back to false
      setFilterLoading(false);
    }, 300); // Small delay for better UX
  }, [columnFilters, searchInput, allOrders, loading])

  // Load orders function
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getOrders(dateRange)

      if (fetchError) {
        setError(fetchError.message)
      } else {
        // Store both the filtered and unfiltered orders
        setOrders(data || [])
        setAllOrders(data || [])
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
    // Open the dialog immediately with loading state
    setIsViewDialogOpen(true)
    setLoadingOrderDetails(true)
    setSelectedOrder(null)
    setOrderItems([])

    try {
      const { data, error } = await getOrderById(orderId)

      if (error) {
        console.error('Error fetching order details:', error.message)
        toast.error(`Failed to load order details: ${error.message}`)
        setIsViewDialogOpen(false)
        return
      }

      if (data) {
        setSelectedOrder(data.order)
        setOrderItems(data.items)
      } else {
        // No data returned
        toast.error('Failed to load order details: No data found')
        setIsViewDialogOpen(false)
      }
    } catch (err) {
      console.error('Error viewing order:', err)
      toast.error('An unexpected error occurred while loading the order details')
      setIsViewDialogOpen(false)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  // View receipt
  const handleViewReceipt = async (order: OrderWithUser) => {
    // Open the receipt dialog immediately with loading state
    setIsReceiptDialogOpen(true)
    setLoadingOrderDetails(true)
    setSelectedOrder(null)
    setOrderItems([])

    try {
      const { data, error } = await getOrderById(order.id)

      if (error) {
        console.error('Error fetching order details for receipt:', error.message)
        toast.error(`Failed to load receipt: ${error.message}`)
        setIsReceiptDialogOpen(false)
        return
      }

      if (data) {
        setSelectedOrder(data.order)
        setOrderItems(data.items)
      } else {
        // No data returned
        toast.error('Failed to load receipt: No data found')
        setIsReceiptDialogOpen(false)
      }
    } catch (err) {
      console.error('Error viewing receipt:', err)
      toast.error('An unexpected error occurred while loading the receipt')
      setIsReceiptDialogOpen(false)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  // Helper function to safely format currency values
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'Rp.0';
    return `Rp.${value.toLocaleString('id-ID')}`;
  }

  // Handle search for Order ID or Cashier
  const handleSearch = (query: string) => {
    // Show loading indicator immediately
    setFilterLoading(true);

    // Update the search input - the useEffect will handle the filtering
    setSearchInput(query);
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

          <div className="relative">
            {/* Loading overlay - absolute positioned over the table */}
            {(loading || filterLoading) && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-primary">
                  {loading ? "Loading orders..." : "Updating results..."}
                </p>
              </div>
            )}

            {/* Empty state message - shown only when not loading/filtering and no orders */}
            {!loading && !filterLoading && orders.length === 0 && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50">
                <ReceiptIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm mt-1 text-muted-foreground mb-4">
                  {searchInput || Object.keys(columnFilters).length > 0
                    ? "Try adjusting your search or filters"
                    : "Orders will appear here when customers make purchases"}
                </p>

                {/* Always show reset button in empty state */}
                <Button
                  variant="default"
                  onClick={() => {
                    // Show loading indicator immediately
                    setFilterLoading(true);

                    // Reset all state values
                    setSearchInput('');
                    setColumnFilters({});
                    setDateRange(undefined);

                    // Use setTimeout to ensure the loading indicator is shown
                    setTimeout(() => {
                      // Reset to all orders without making a new API call
                      if (allOrders.length > 0) {
                        setOrders([...allOrders]);
                        setFilterLoading(false);
                      } else {
                        // If we don't have any orders yet, reload them
                        loadOrders();
                      }
                    }, 300); // Small delay for better UX
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}

            {/* Always render the table */}
            <VirtualizedDataTable
              columns={virtualizedColumns({
                onViewDetails: handleViewOrder,
                onPrintReceipt: handleViewReceipt
              })}
              data={loading ? [] : orders}
              searchKey="id"
              searchPlaceholder="Search by Order ID or Cashier..."
              onSearch={handleSearch}
              currentSearchValue={searchInput}
              filterableColumns={[
                {
                  id: "payment_method",
                  title: "Payment Method",
                  options: [
                    { label: "Cash", value: "cash" },
                    { label: "Bank Transfer", value: "bank_transfer" },
                  ].map(option => ({
                    ...option,
                    value: option.value || "undefined"
                  }))
                }
              ]}
              onFilterChange={(columnId: string, value: string | undefined) => {
                // Show loading indicator immediately
                setFilterLoading(true);

                if (columnId === 'payment_method') {
                  setColumnFilters(prev => ({
                    ...prev,
                    payment_method: value
                  }));
                }
              }}
              selectedFilters={columnFilters}
              height={600}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setOrderItems([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Order #${selectedOrder.id.substring(0, 8)}` : 'Loading order details...'}
            </DialogDescription>
          </DialogHeader>

          {loadingOrderDetails ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading order details...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cashier</h3>
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
          ) : null}
        </DialogContent>
      </Dialog>

      <ReceiptComponent
        open={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        isLoading={loadingOrderDetails}
        order={selectedOrder && orderItems.length > 0 ? {
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
        } : undefined}
      />
    </div>
  )
}
