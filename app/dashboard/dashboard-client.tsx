'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getTodaySales,
  getTotalSales,
  getTotalOrders,
  getLowStockItems,
  getDailySales,
  getTopSellingProducts
} from "@/app/api/dashboard/actions";
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
} from "recharts";

// Chart colors
const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function DashboardClient() {
  // State for dashboard data
  const [todaySales, setTodaySales] = useState<{ total: number; count: number } | null>(null);
  const [totalSales, setTotalSales] = useState<{ total: number; percentChange: number } | null>(null);
  const [totalOrders, setTotalOrders] = useState<{ count: number; percentChange: number } | null>(null);
  const [lowStockItems, setLowStockItems] = useState<{ count: number; items: any[] } | null>(null);
  const [dailySales, setDailySales] = useState<Array<{ date: string; displayDate: string; total: number }> | null>(null);
  const [topProducts, setTopProducts] = useState<Array<{ id: string; name: string; quantity: number; total: number }> | null>(null);

  // Loading states
  const [loadingTodaySales, setLoadingTodaySales] = useState(true);
  const [loadingTotalSales, setLoadingTotalSales] = useState(true);
  const [loadingTotalOrders, setLoadingTotalOrders] = useState(true);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [loadingDailySales, setLoadingDailySales] = useState(true);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch today's sales
        setLoadingTodaySales(true);
        const { data: todaySalesData, error: todaySalesError } = await getTodaySales();
        if (todaySalesError) {
          console.error('Error fetching today\'s sales:', todaySalesError.message);
        } else {
          setTodaySales(todaySalesData);
        }
        setLoadingTodaySales(false);

        // Fetch total sales
        setLoadingTotalSales(true);
        const { data: totalSalesData, error: totalSalesError } = await getTotalSales();
        if (totalSalesError) {
          console.error('Error fetching total sales:', totalSalesError.message);
        } else {
          setTotalSales(totalSalesData);
        }
        setLoadingTotalSales(false);

        // Fetch total orders
        setLoadingTotalOrders(true);
        const { data: totalOrdersData, error: totalOrdersError } = await getTotalOrders();
        if (totalOrdersError) {
          console.error('Error fetching total orders:', totalOrdersError.message);
        } else {
          setTotalOrders(totalOrdersData);
        }
        setLoadingTotalOrders(false);

        // Fetch low stock items
        setLoadingLowStock(true);
        const { data: lowStockData, error: lowStockError } = await getLowStockItems();
        if (lowStockError) {
          console.error('Error fetching low stock items:', lowStockError.message);
        } else {
          setLowStockItems(lowStockData);
        }
        setLoadingLowStock(false);

        // Fetch daily sales
        setLoadingDailySales(true);
        const { data: dailySalesData, error: dailySalesError } = await getDailySales();
        if (dailySalesError) {
          console.error('Error fetching daily sales:', dailySalesError.message);
        } else {
          setDailySales(dailySalesData);
        }
        setLoadingDailySales(false);

        // Fetch top selling products
        setLoadingTopProducts(true);
        const { data: topProductsData, error: topProductsError } = await getTopSellingProducts();
        if (topProductsError) {
          console.error('Error fetching top selling products:', topProductsError.message);
        } else {
          setTopProducts(topProductsData);
        }
        setLoadingTopProducts(false);
      } catch (err) {
        console.error('Unexpected error fetching dashboard data:', err);
        setError('An unexpected error occurred while fetching dashboard data.');
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTotalSales ? (
              <div className="flex justify-center items-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalSales ? formatCurrency(totalSales.total) : 'Rp.0'}</p>
                  <p className={`text-xs flex items-center ${totalSales && totalSales.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalSales && totalSales.percentChange >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {totalSales ? Math.abs(totalSales.percentChange).toFixed(1) : '0'}% from last week
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTotalOrders ? (
              <div className="flex justify-center items-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalOrders ? totalOrders.count : '0'}</p>
                  <p className={`text-xs flex items-center ${totalOrders && totalOrders.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalOrders && totalOrders.percentChange >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {totalOrders ? Math.abs(totalOrders.percentChange).toFixed(1) : '0'}% from last week
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLowStock ? (
              <div className="flex justify-center items-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{lowStockItems ? lowStockItems.count : '0'}</p>
                  <p className="text-xs text-muted-foreground">
                    Items need attention
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Sales Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTodaySales ? (
              <div className="flex justify-center items-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{todaySales ? formatCurrency(todaySales.total) : 'Rp.0'}</p>
                  <p className="text-xs text-muted-foreground">
                    {todaySales ? todaySales.count : '0'} transactions
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Daily sales for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDailySales ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !dailySales || dailySales.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-80 text-muted-foreground">
                <p>No sales data available</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailySales}
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
                    <Bar dataKey="total" fill="var(--chart-1)" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Most popular items this week</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTopProducts ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !topProducts || topProducts.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-80 text-muted-foreground">
                <p>No product sales data available</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="var(--chart-1)"
                      dataKey="quantity"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name.length > 15 ? name.substring(0, 15) + '...' : name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {topProducts.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [value, 'Quantity']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
