'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  Download,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getSalesSummary,
  getProductSalesReport,
  getInventoryReport,
  SalesSummary,
  ProductSalesReport,
  InventoryReport
} from "@/app/api/reports/actions"
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

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState("sales")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [salesPeriod, setSalesPeriod] = useState("30days")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Report data states
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [productSales, setProductSales] = useState<ProductSalesReport | null>(null)
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)

  // Load reports based on active tab and date range
  useEffect(() => {
    if (activeTab === "sales") {
      loadSalesSummary()
    } else if (activeTab === "products") {
      loadProductSales()
    } else if (activeTab === "inventory") {
      loadInventoryReport()
    }
  }, [activeTab, dateRange])

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSalesPeriod(period)
    const today = new Date()
    let fromDate = new Date()

    switch (period) {
      case "7days":
        fromDate.setDate(today.getDate() - 7)
        break
      case "30days":
        fromDate.setDate(today.getDate() - 30)
        break
      case "90days":
        fromDate.setDate(today.getDate() - 90)
        break
      case "year":
        fromDate.setFullYear(today.getFullYear() - 1)
        break
      default:
        fromDate.setDate(today.getDate() - 30)
    }

    setDateRange({ from: fromDate, to: today })
  }

  // Load sales summary report
  const loadSalesSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: reportError } = await getSalesSummary(
        dateRange.from,
        dateRange.to
      )

      if (reportError) {
        setError(reportError.message)
      } else {
        setSalesSummary(data || null)
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching sales summary.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load product sales report
  const loadProductSales = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: reportError } = await getProductSalesReport(
        { from: dateRange.from, to: dateRange.to }
      )

      if (reportError) {
        setError(reportError.message)
      } else {
        setProductSales(data || null)
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching product sales.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load inventory report
  const loadInventoryReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: reportError } = await getInventoryReport()

      if (reportError) {
        setError(reportError.message)
      } else {
        setInventoryReport(data || null)
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching inventory report.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to safely format currency values
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'Rp.0';
    return `Rp.${value.toLocaleString('id-ID')}`;
  }

  // Helper function to format percentage values
  const formatPercentage = (value: number) => {
    return value.toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + '%';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={salesPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Summary</TabsTrigger>
          <TabsTrigger value="products">Product Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Sales Summary Tab */}
        <TabsContent value="sales" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : salesSummary ? (
            <>
              {/* Sales Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(salesSummary.totalSales)}</div>
                    <p className="text-xs text-muted-foreground">
                      {salesSummary.totalOrders} orders
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(salesSummary.averageOrderValue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Per transaction
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                  <CardDescription>
                    Daily sales for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesSummary.dailySales}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayDate" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar dataKey="total" fill="#8884d8" name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Breakdown of sales by payment method
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center justify-between">
                  <div className="w-full md:w-1/2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesSummary.paymentMethodBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                          nameKey="method"
                          label={({ name, percent }) => `${name} ${formatPercentage(percent * 100)}`}
                        >
                          {salesSummary.paymentMethodBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Method</th>
                          <th className="text-right py-2">Orders</th>
                          <th className="text-right py-2">Total</th>
                          <th className="text-right py-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesSummary.paymentMethodBreakdown.map((method, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 capitalize">{method.method.replace('_', ' ')}</td>
                            <td className="text-right py-2">{method.count}</td>
                            <td className="text-right py-2">{formatCurrency(method.total)}</td>
                            <td className="text-right py-2">{formatPercentage(method.percentage)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sales data available for the selected period</p>
            </div>
          )}
        </TabsContent>

        {/* Product Sales Tab */}
        <TabsContent value="products" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : productSales ? (
            <>
              {/* Product Sales Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Products Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{productSales.totalQuantity}</div>
                    <p className="text-xs text-muted-foreground">
                      {productSales.totalProducts} unique products
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(productSales.totalSales)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Top Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {productSales.topProducts.length > 0 ? (
                      <>
                        <div className="text-lg font-bold">{productSales.topProducts[0].product_name}</div>
                        <p className="text-xs text-muted-foreground">
                          {productSales.topProducts[0].quantity} units sold
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No data</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>
                    Products with the highest sales volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productSales.topProducts.slice(0, 10)}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="product_name" width={100} />
                        <Tooltip
                          formatter={(value) => [value, 'Quantity']}
                        />
                        <Bar dataKey="quantity" fill="#8884d8" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Product Sales Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Sales Details</CardTitle>
                  <CardDescription>
                    Detailed breakdown of all product sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Sales</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Avg. Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">% of Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {productSales.products.map((product, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="px-4 py-2 text-sm">{product.product_name}</td>
                            <td className="px-4 py-2 text-sm text-right">{product.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(product.total)}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(product.average_price)}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatPercentage(product.percentage_of_sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No product sales data available for the selected period</p>
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : inventoryReport ? (
            <>
              {/* Inventory Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventoryReport.totalProducts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(inventoryReport.inventoryValue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventoryReport.lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Need attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>
                    Overview of current inventory levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'In Stock', value: inventoryReport.totalProducts - inventoryReport.lowStockCount - inventoryReport.outOfStockCount },
                            { name: 'Low Stock', value: inventoryReport.lowStockCount },
                            { name: 'Out of Stock', value: inventoryReport.outOfStockCount },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${formatPercentage(percent * 100)}`}
                        >
                          <Cell fill="#4ade80" /> {/* Green for In Stock */}
                          <Cell fill="#facc15" /> {/* Yellow for Low Stock */}
                          <Cell fill="#f87171" /> {/* Red for Out of Stock */}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Items</CardTitle>
                  <CardDescription>
                    Products that need to be restocked soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {inventoryReport.lowStockItems.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">SKU</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Current Stock</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Threshold</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {inventoryReport.lowStockItems.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                              <td className="px-4 py-2 text-sm">{item.name}</td>
                              <td className="px-4 py-2 text-sm text-right">{item.sku || 'N/A'}</td>
                              <td className="px-4 py-2 text-sm text-right">{item.stock_quantity}</td>
                              <td className="px-4 py-2 text-sm text-right">{item.low_stock_threshold || 'N/A'}</td>
                              <td className="px-4 py-2 text-sm text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.stock_status === 'out_of_stock'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No low stock items found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Full Inventory</CardTitle>
                  <CardDescription>
                    Complete list of all products in inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">SKU</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Stock</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Value</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inventoryReport.products.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="px-4 py-2 text-sm">{item.name}</td>
                            <td className="px-4 py-2 text-sm">{item.category || 'Uncategorized'}</td>
                            <td className="px-4 py-2 text-sm text-right">{item.sku || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-right">{item.stock_quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.stock_quantity * item.price)}</td>
                            <td className="px-4 py-2 text-sm text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.stock_status === 'out_of_stock'
                                  ? 'bg-red-100 text-red-800'
                                  : item.stock_status === 'low_stock'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {item.stock_status === 'out_of_stock'
                                  ? 'Out of Stock'
                                  : item.stock_status === 'low_stock'
                                    ? 'Low Stock'
                                    : 'In Stock'
                                }
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No inventory data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
