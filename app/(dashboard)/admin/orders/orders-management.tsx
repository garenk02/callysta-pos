'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateRange } from 'react-day-picker'
import { useOrderDetails } from '@/hooks/useOrders'
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
import { Button } from "@/components/ui/button"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { virtualizedColumns } from "./virtualized-columns"
import { getOrders, OrderWithUser } from "@/app/api/orders/actions"
import ReceiptComponent from "@/components/checkout/Receipt"
import { formatCurrency } from "@/lib/utils"

export default function OrdersManagement() {
  const [orders, setOrders] = useState<OrderWithUser[]>([])
  const [loading, setLoading] = useState(true) // Main loading state for initial data fetch
  const [filterLoading, setFilterLoading] = useState(false) // Loading state for filter/search operations
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Use the cached order details hook
  const {
    orderDetails,
    isLoading: loadingOrderDetails
  } = useOrderDetails(selectedOrderId || '', {
    enabled: !!selectedOrderId && (isViewDialogOpen || isReceiptDialogOpen)
  })

  // Extract order and items from the cached data
  const selectedOrder = orderDetails?.order || null
  const orderItems = orderDetails?.items || []
  const [columnFilters, setColumnFilters] = useState<{
    payment_method?: string;
  }>({})
  const [searchInput, setSearchInput] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Load orders on component mount or when pagination/filters/date range changes
  useEffect(() => {
    loadOrders()
  }, [page, pageSize, dateRange])

  // We no longer need to store unfiltered orders since we're using server-side pagination

  // We no longer need the client-side filtering effect since we're using server-side pagination and filtering
  // The loadOrders function now handles all filtering and pagination

  // Load orders function
  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getOrders({
        dateRange,
        page,
        pageSize,
        searchQuery: searchInput,
        paymentMethod: columnFilters.payment_method
      })

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        // Store the orders and pagination data
        setOrders(data.orders)
        setTotalItems(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching orders.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [dateRange, page, pageSize, searchInput, columnFilters.payment_method])

  // View order details - now using the cached hook
  const handleViewOrder = (orderId: string) => {
    // Set the selected order ID and open the dialog
    // The hook will automatically fetch the data
    setSelectedOrderId(orderId)
    setIsViewDialogOpen(true)
  }

  // View receipt - now using the cached hook
  const handleViewReceipt = (order: OrderWithUser) => {
    // Set the selected order ID and open the receipt dialog
    // The hook will automatically fetch the data
    setSelectedOrderId(order.id)
    setIsReceiptDialogOpen(true)
  }

  // Using the global formatCurrency function from lib/utils.ts

  // Handle search for Order ID or Cashier
  const handleSearch = (query: string) => {
    // Show loading indicator immediately
    setFilterLoading(true);

    // Update the search input
    setSearchInput(query);

    // Reset to first page when search changes
    setPage(1);

    // Load orders with the new search query
    loadOrders();
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
                    setPage(1);
                    setPageSize(10);

                    // Reload orders with reset filters and pagination
                    loadOrders();
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

                  // Reset to first page when filter changes
                  setPage(1);

                  // Load orders with the new filter
                  setTimeout(() => {
                    loadOrders();
                  }, 100);
                }
              }}
              selectedFilters={columnFilters}
              height={560} // Reduced height to make room for pagination
            />

            {/* Custom Pagination */}
            {!loading && orders.length > 0 && (
              <DataTablePagination
                table={{
                  getState: () => ({ pagination: { pageIndex: page - 1, pageSize } }),
                  getFilteredRowModel: () => ({ rows: { length: totalItems } }),
                  getPageCount: () => totalPages,
                  getFilteredSelectedRowModel: () => ({ rows: { length: 0 } }),
                  setPageIndex: () => {},
                  setPageSize: () => {},
                } as any}
                customPagination={{
                  page,
                  pageSize,
                  totalItems,
                  totalPages,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newSize) => {
                    setPageSize(newSize);
                    setPage(1); // Reset to first page when changing page size
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            // Reset the selected order ID when closing the dialog
            setSelectedOrderId(null);
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
                  <p>{selectedOrder.user?.name || selectedOrder.user?.email || 'Admin'}</p>
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
        onOpenChange={(open) => {
          setIsReceiptDialogOpen(open);
          if (!open) {
            // Reset the selected order ID when closing the receipt
            setSelectedOrderId(null);
          }
        }}
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
