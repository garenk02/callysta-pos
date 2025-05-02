'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays, format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Loader2,
  DollarSign,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Receipt,
  AlertTriangle,
  Archive,
  Clock,
  Tag
} from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { toast } from "sonner"
import {
  getSalesSummary,
  SalesSummary,
  getProductSalesReport,
  ProductSalesReport,
  getInventoryReport,
  InventoryReport
} from "@/app/api/reports/actions"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ReportsManagement() {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30), // Default to last 30 days
    to: new Date()
  })

  // Loading states for different reports
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)

  // State for report data
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [productSalesReport, setProductSalesReport] = useState<ProductSalesReport | null>(null)
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Fetch sales summary data
  const fetchSalesSummary = useCallback(async () => {
    if (!dateRange) return

    setLoadingSales(true)
    try {
      const result = await getSalesSummary(dateRange)
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data) {
        setSalesSummary(result.data)
      }
    } catch (error) {
      console.error('Error fetching sales summary:', error)
      toast.error('Failed to fetch sales summary')
    } finally {
      setLoadingSales(false)
    }
  }, [dateRange])

  // Fetch product sales report data
  const fetchProductSalesReport = useCallback(async () => {
    if (!dateRange) return

    setLoadingProducts(true)
    try {
      const result = await getProductSalesReport(dateRange)
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data) {
        setProductSalesReport(result.data)
      }
    } catch (error) {
      console.error('Error fetching product sales report:', error)
      toast.error('Failed to fetch product sales report')
    } finally {
      setLoadingProducts(false)
    }
  }, [dateRange])

  // Fetch inventory report data
  const fetchInventoryReport = useCallback(async () => {
    setLoadingInventory(true)
    try {
      const result = await getInventoryReport()
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data) {
        setInventoryReport(result.data)
      }
    } catch (error) {
      console.error('Error fetching inventory report:', error)
      toast.error('Failed to fetch inventory report')
    } finally {
      setLoadingInventory(false)
    }
  }, [])

  // Fetch report data when date range changes
  useEffect(() => {
    fetchSalesSummary()
    fetchProductSalesReport()
    fetchInventoryReport()
  }, [fetchSalesSummary, fetchProductSalesReport, fetchInventoryReport])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reports</CardTitle>
          <CardDescription>
            View sales and inventory reports
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

          <Tabs defaultValue="sales" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales">Sales Summary</TabsTrigger>
              <TabsTrigger value="products">Product Sales</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
            </TabsList>

            {/* Sales Summary Report Tab */}
            <TabsContent value="sales" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Sales Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of sales performance for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSales ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !salesSummary ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No sales data available for the selected period</p>
                      <p className="text-sm mt-2">Try selecting a different date range</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Sales Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{formatCurrency(salesSummary.totalSales)}</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Total Orders Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{salesSummary.totalOrders}</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Average Order Value Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{formatCurrency(salesSummary.averageOrderValue)}</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Charts Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily Sales Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Daily Sales</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              {salesSummary.dailySales.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={salesSummary.dailySales}
                                    margin={{
                                      top: 20,
                                      right: 30,
                                      left: 20,
                                      bottom: 5,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="displayDate" />
                                    <YAxis
                                      tickFormatter={(value) => `Rp. ${value.toLocaleString('id-ID')}`}
                                    />
                                    <Tooltip
                                      formatter={(value) => [`Rp. ${(value as number).toLocaleString('id-ID')}`, 'Sales']}
                                      labelFormatter={(label) => `Day: ${label}`}
                                    />
                                    <Bar dataKey="total" fill="#8884d8" />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No daily sales data available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Payment Method Breakdown */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Payment Methods</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              {salesSummary.paymentMethodBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={salesSummary.paymentMethodBreakdown.map(item => ({
                                        name: formatPaymentMethod(item.method),
                                        value: item.total
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {salesSummary.paymentMethodBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`Rp. ${(value as number).toLocaleString('id-ID')}`, 'Sales']} />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No payment method data available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Payment Method Details Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Payment Method Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4">Payment Method</th>
                                  <th className="text-right py-3 px-4">Orders</th>
                                  <th className="text-right py-3 px-4">Total</th>
                                  <th className="text-right py-3 px-4">Percentage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {salesSummary.paymentMethodBreakdown.map((method, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="py-3 px-4">
                                      <Badge variant="outline" className="capitalize">
                                        {formatPaymentMethod(method.method)}
                                      </Badge>
                                    </td>
                                    <td className="text-right py-3 px-4">{method.count}</td>
                                    <td className="text-right py-3 px-4">{formatCurrency(method.total)}</td>
                                    <td className="text-right py-3 px-4">{method.percentage.toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Sales Report Tab */}
            <TabsContent value="products" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Product Sales
                  </CardTitle>
                  <CardDescription>
                    Sales breakdown by product for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProducts ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !productSalesReport ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No product sales data available for the selected period</p>
                      <p className="text-sm mt-2">Try selecting a different date range</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Products Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Products Sold</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{productSalesReport.totalProducts}</p>
                                <p className="text-xs text-muted-foreground">Unique products</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Total Quantity Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{productSalesReport.totalQuantity}</p>
                                <p className="text-xs text-muted-foreground">Items sold</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Total Sales Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{formatCurrency(productSalesReport.totalSales)}</p>
                                <p className="text-xs text-muted-foreground">From all products</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Charts Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Products Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Top Selling Products</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              {productSalesReport.topProducts.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={productSalesReport.topProducts.map(product => ({
                                      name: product.product_name.length > 20
                                        ? product.product_name.substring(0, 20) + '...'
                                        : product.product_name,
                                      quantity: product.quantity,
                                      total: product.total
                                    }))}
                                    layout="vertical"
                                    margin={{
                                      top: 20,
                                      right: 30,
                                      left: 100,
                                      bottom: 5,
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis
                                      dataKey="name"
                                      type="category"
                                      width={100}
                                      tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                      formatter={(value, name) => [
                                        name === 'total' ? `Rp. ${(value as number).toLocaleString('id-ID')}` : value,
                                        name === 'total' ? 'Revenue' : 'Quantity'
                                      ]}
                                    />
                                    <Legend />
                                    <Bar dataKey="quantity" name="Quantity" fill="#8884d8" />
                                    <Bar dataKey="total" name="Revenue" fill="#82ca9d" />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No product data available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Category Breakdown */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Sales by Category</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              {productSalesReport.categoryBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={productSalesReport.categoryBreakdown.map(item => ({
                                        name: item.category || 'Uncategorized',
                                        value: item.total
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {productSalesReport.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`Rp. ${(value as number).toLocaleString('id-ID')}`, 'Sales']} />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No category data available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Product Details Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Product Sales Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4">Product</th>
                                  <th className="text-right py-3 px-4">Quantity</th>
                                  <th className="text-right py-3 px-4">Avg. Price</th>
                                  <th className="text-right py-3 px-4">Total</th>
                                  <th className="text-right py-3 px-4">% of Sales</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productSalesReport.products
                                  .sort((a, b) => b.total - a.total)
                                  .map((product, index) => (
                                    <tr key={product.product_id} className="border-b">
                                      <td className="py-3 px-4">
                                        {product.product_name}
                                      </td>
                                      <td className="text-right py-3 px-4">{product.quantity}</td>
                                      <td className="text-right py-3 px-4">{formatCurrency(product.average_price)}</td>
                                      <td className="text-right py-3 px-4">{formatCurrency(product.total)}</td>
                                      <td className="text-right py-3 px-4">{product.percentage_of_sales.toFixed(1)}%</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Levels Report Tab */}
            <TabsContent value="inventory" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Inventory Levels
                  </CardTitle>
                  <CardDescription>
                    Current inventory status and low stock alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInventory ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !inventoryReport ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No inventory data available</p>
                      <p className="text-sm mt-2">Please try again later</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Products Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{inventoryReport.totalProducts}</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Tag className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Total Stock Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{inventoryReport.totalStockQuantity}</p>
                                <p className="text-xs text-muted-foreground">Items in inventory</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Archive className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Low Stock Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{inventoryReport.lowStockCount}</p>
                                <p className="text-xs text-muted-foreground">Products need attention</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Inventory Value Card */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-2xl font-bold">{formatCurrency(inventoryReport.inventoryValue)}</p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Charts Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inventory by Category */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Inventory by Category</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              {inventoryReport.inventoryByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={inventoryReport.inventoryByCategory.map(item => ({
                                        name: item.category,
                                        value: item.stock_quantity
                                      }))}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {inventoryReport.inventoryByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [value, 'Items']} />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No category data available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Low Stock Items */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Low Stock Items</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80 overflow-auto">
                              {inventoryReport.lowStockItems.length > 0 ? (
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-background">
                                    <tr className="border-b">
                                      <th className="text-left py-3 px-4">Product</th>
                                      <th className="text-right py-3 px-4">Current</th>
                                      <th className="text-right py-3 px-4">Threshold</th>
                                      <th className="text-center py-3 px-4">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inventoryReport.lowStockItems.map((item) => (
                                      <tr key={item.id} className="border-b">
                                        <td className="py-3 px-4">{item.name}</td>
                                        <td className="text-right py-3 px-4">{item.stock_quantity}</td>
                                        <td className="text-right py-3 px-4">{item.low_stock_threshold}</td>
                                        <td className="text-center py-3 px-4">
                                          <Badge
                                            variant={item.stock_status === 'out_of_stock' ? 'destructive' : 'outline'}
                                            className={item.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                                          >
                                            {item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  No low stock items
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Inventory Movements */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Recent Inventory Movements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            {inventoryReport.recentMovements.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-3 px-4">Date</th>
                                    <th className="text-left py-3 px-4">Product</th>
                                    <th className="text-right py-3 px-4">Change</th>
                                    <th className="text-right py-3 px-4">Previous</th>
                                    <th className="text-right py-3 px-4">New</th>
                                    <th className="text-left py-3 px-4">Reason</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inventoryReport.recentMovements.map((movement, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="py-3 px-4">
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                          {movement.date}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">{movement.product_name}</td>
                                      <td className={`text-right py-3 px-4 ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}
                                      </td>
                                      <td className="text-right py-3 px-4">{movement.previous_quantity}</td>
                                      <td className="text-right py-3 px-4">{movement.new_quantity}</td>
                                      <td className="py-3 px-4">{movement.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>No recent inventory movements</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* All Products Inventory Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">All Products Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4">Product</th>
                                  <th className="text-left py-3 px-4">SKU</th>
                                  <th className="text-left py-3 px-4">Category</th>
                                  <th className="text-right py-3 px-4">Stock</th>
                                  <th className="text-right py-3 px-4">Threshold</th>
                                  <th className="text-center py-3 px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inventoryReport.products.map((product) => (
                                  <tr key={product.id} className="border-b">
                                    <td className="py-3 px-4">{product.name}</td>
                                    <td className="py-3 px-4">{product.sku || '-'}</td>
                                    <td className="py-3 px-4">{product.category}</td>
                                    <td className="text-right py-3 px-4">{product.stock_quantity}</td>
                                    <td className="text-right py-3 px-4">{product.low_stock_threshold}</td>
                                    <td className="text-center py-3 px-4">
                                      <Badge
                                        variant={
                                          product.stock_status === 'out_of_stock'
                                            ? 'destructive'
                                            : product.stock_status === 'low_stock'
                                              ? 'outline'
                                              : 'secondary'
                                        }
                                        className={product.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                                      >
                                        {product.stock_status === 'out_of_stock'
                                          ? 'Out of Stock'
                                          : product.stock_status === 'low_stock'
                                            ? 'Low Stock'
                                            : 'In Stock'
                                        }
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
