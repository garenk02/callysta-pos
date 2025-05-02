'use client'

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react"
import {
  getTodaySales,
  getTotalSales,
  getTotalOrders,
  getLowStockItems,
  getDailySales,
  getTopSellingProducts
} from "@/app/api/dashboard/actions"
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

// Define types for our dashboard data
type DashboardData = {
  todaySales: { total: number; count: number } | null
  totalSales: { total: number; percentChange: number } | null
  totalOrders: { count: number; percentChange: number } | null
  lowStockItems: { count: number; items: Array<{ id: string; name: string; stock_quantity: number; threshold: number }> } | null
  dailySales: Array<{ date: string; displayDate: string; total: number }> | null
  topProducts: Array<{ id: string; name: string; quantity: number; total: number }> | null
}

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('Rp', 'Rp.')
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData>({
    todaySales: null,
    totalSales: null,
    totalOrders: null,
    lowStockItems: null,
    dailySales: null,
    topProducts: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch all dashboard data in parallel
        const [
          todaySalesResult,
          totalSalesResult,
          totalOrdersResult,
          lowStockItemsResult,
          dailySalesResult,
          topProductsResult
        ] = await Promise.all([
          getTodaySales(),
          getTotalSales(),
          getTotalOrders(),
          getLowStockItems(),
          getDailySales(),
          getTopSellingProducts()
        ])

        // Check for errors
        if (todaySalesResult.error) setError(todaySalesResult.error.message)
        if (totalSalesResult.error) setError(totalSalesResult.error.message)
        if (totalOrdersResult.error) setError(totalOrdersResult.error.message)
        if (lowStockItemsResult.error) setError(lowStockItemsResult.error.message)
        if (dailySalesResult.error) setError(dailySalesResult.error.message)
        if (topProductsResult.error) setError(topProductsResult.error.message)

        // Update state with the fetched data
        setData({
          todaySales: todaySalesResult.data,
          totalSales: totalSalesResult.data,
          totalOrders: totalOrdersResult.data,
          lowStockItems: lowStockItemsResult.data,
          dailySales: dailySalesResult.data,
          topProducts: topProductsResult.data
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Format the pie chart data
  const pieChartData = data.topProducts?.map(product => ({
    name: product.name,
    value: product.quantity
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(data.totalSales?.total || 0)}</p>
                <p className={`text-xs flex items-center ${data.totalSales?.percentChange && data.totalSales.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.totalSales?.percentChange && data.totalSales.percentChange >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.totalSales?.percentChange || 0).toFixed(1)}% from last week
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.totalOrders?.count || 0}</p>
                <p className={`text-xs flex items-center ${data.totalOrders?.percentChange && data.totalOrders.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {data.totalOrders?.percentChange && data.totalOrders.percentChange >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(data.totalOrders?.percentChange || 0).toFixed(1)}% from last week
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.lowStockItems?.count || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {data.lowStockItems?.count === 1 ? 'Item needs' : 'Items need'} attention
                </p>
                {data.lowStockItems?.items && data.lowStockItems.items.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">Top items to restock:</p>
                    <ul className="mt-1">
                      {data.lowStockItems.items.slice(0, 2).map(item => (
                        <li key={item.id} className="truncate">
                          {item.name}: {item.stock_quantity} left
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Sales Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(data.todaySales?.total || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  {data.todaySales?.count || 0} transactions
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Daily sales for the past week</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {data.dailySales && data.dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.dailySales}
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
                      formatter={(value) => [`Rp. ${value.toLocaleString('id-ID')}`, 'Sales']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Bar dataKey="total" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <p className="text-sm text-muted-foreground">Most popular items this week</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} units`, 'Quantity']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
