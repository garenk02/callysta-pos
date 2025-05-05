'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
import { cn, formatCurrency } from "@/lib/utils"
import { useSettings } from '@/hooks/useSettings'
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
  const { settings } = useSettings()

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

  // Using the global formatCurrency function from lib/utils.ts

  // Helper function to format percentage values
  const formatPercentage = (value: number) => {
    return value.toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + '%';
  }

  // Format payment method for display
  const formatPaymentMethod = (method: string): string => {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Handle export button click
  const handleExport = () => {
    if (loading) return;

    switch (activeTab) {
      case 'sales':
        if (salesSummary) exportSalesSummary();
        break;
      case 'products':
        if (productSales) exportProductSales();
        break;
      case 'inventory':
        if (inventoryReport) exportInventoryReport();
        break;
    }
  }

  // Export sales summary to PDF
  const exportSalesSummary = () => {
    if (!salesSummary) return;

    const doc = new jsPDF();
    const appName = settings?.app_name || 'Callysta POS';
    const dateRangeText = `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;

    // Add header
    doc.setFontSize(18);
    doc.text(appName, 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Sales Summary Report', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${dateRangeText}`, 105, 35, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 105, 40, { align: 'center' });

    // Sales overview
    doc.setFontSize(12);
    doc.text('Sales Overview', 14, 50);

    const overviewData = [
      ['Total Sales', formatCurrency(salesSummary.totalSales)],
      ['Total Orders', salesSummary.totalOrders.toString()],
      ['Average Order Value', formatCurrency(salesSummary.averageOrderValue)]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Payment methods
    doc.setFontSize(12);
    // Get the last table's y position
    const lastTableY = (doc as any).lastAutoTable.finalY;
    doc.text('Payment Methods', 14, lastTableY + 15);

    const paymentData = salesSummary.paymentMethodBreakdown.map(method => [
      formatPaymentMethod(method.method),
      method.count.toString(),
      formatCurrency(method.total),
      formatPercentage(method.percentage)
    ]);

    autoTable(doc, {
      startY: lastTableY + 20,
      head: [['Payment Method', 'Orders', 'Total', 'Percentage']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Daily sales
    doc.setFontSize(12);
    // Get the last table's y position again
    const lastTableY2 = (doc as any).lastAutoTable.finalY;
    doc.text('Daily Sales', 14, lastTableY2 + 15);

    const dailySalesData = salesSummary.dailySales.map(day => [
      day.displayDate,
      day.orders.toString(),
      formatCurrency(day.total)
    ]);

    autoTable(doc, {
      startY: lastTableY2 + 20,
      head: [['Date', 'Orders', 'Total Sales']],
      body: dailySalesData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Save the PDF
    doc.save(`sales-summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  // Export product sales to PDF
  const exportProductSales = () => {
    if (!productSales) return;

    const doc = new jsPDF();
    const appName = settings?.app_name || 'Callysta POS';
    const dateRangeText = `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;

    // Add header
    doc.setFontSize(18);
    doc.text(appName, 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Product Sales Report', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${dateRangeText}`, 105, 35, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 105, 40, { align: 'center' });

    // Sales overview
    doc.setFontSize(12);
    doc.text('Product Sales Overview', 14, 50);

    const overviewData = [
      ['Total Products Sold', productSales.totalQuantity.toString()],
      ['Unique Products', productSales.totalProducts.toString()],
      ['Total Sales', formatCurrency(productSales.totalSales)]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Top products
    doc.setFontSize(12);
    // Get the last table's y position
    const productLastTableY = (doc as any).lastAutoTable.finalY;
    doc.text('Top Selling Products', 14, productLastTableY + 15);

    const topProductsData = productSales.topProducts.slice(0, 10).map(product => [
      product.product_name,
      product.quantity.toString(),
      formatCurrency(product.total),
      formatCurrency(product.average_price),
      formatPercentage(product.percentage_of_sales)
    ]);

    autoTable(doc, {
      startY: productLastTableY + 20,
      head: [['Product', 'Quantity', 'Total Sales', 'Avg. Price', '% of Sales']],
      body: topProductsData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Category breakdown
    doc.setFontSize(12);
    // Get the last table's y position again
    const productLastTableY2 = (doc as any).lastAutoTable.finalY;
    doc.text('Sales by Category', 14, productLastTableY2 + 15);

    const categoryData = productSales.categoryBreakdown.map(category => [
      category.category,
      category.quantity.toString(),
      formatCurrency(category.total),
      formatPercentage(category.percentage)
    ]);

    autoTable(doc, {
      startY: productLastTableY2 + 20,
      head: [['Category', 'Quantity', 'Total Sales', 'Percentage']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Save the PDF
    doc.save(`product-sales-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  // Export inventory report to PDF
  const exportInventoryReport = () => {
    if (!inventoryReport) return;

    const doc = new jsPDF();
    const appName = settings?.app_name || 'Callysta POS';

    // Add header
    doc.setFontSize(18);
    doc.text(appName, 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Inventory Report', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 105, 35, { align: 'center' });

    // Inventory overview
    doc.setFontSize(12);
    doc.text('Inventory Overview', 14, 45);

    const overviewData = [
      ['Total Products', inventoryReport.totalProducts.toString()],
      ['Total Stock Value', formatCurrency(inventoryReport.inventoryValue)],
      ['Low Stock Items', inventoryReport.lowStockCount.toString()],
      ['Out of Stock Items', inventoryReport.outOfStockCount.toString()]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Inventory by category
    doc.setFontSize(12);
    // Get the last table's y position
    const inventoryLastTableY = (doc as any).lastAutoTable.finalY;
    doc.text('Inventory by Category', 14, inventoryLastTableY + 15);

    const categoryData = inventoryReport.inventoryByCategory.map(category => [
      category.category,
      category.product_count.toString(),
      category.stock_quantity.toString(),
      formatPercentage(category.percentage)
    ]);

    autoTable(doc, {
      startY: inventoryLastTableY + 20,
      head: [['Category', 'Products', 'Stock Quantity', 'Percentage']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Low stock items
    doc.setFontSize(12);
    // Get the last table's y position again
    const inventoryLastTableY2 = (doc as any).lastAutoTable.finalY;
    doc.text('Low Stock Items', 14, inventoryLastTableY2 + 15);

    const lowStockData = inventoryReport.lowStockItems.map(item => [
      item.name,
      item.sku || 'N/A',
      item.stock_quantity.toString(),
      item.low_stock_threshold?.toString() || 'N/A',
      item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'
    ]);

    autoTable(doc, {
      startY: inventoryLastTableY2 + 20,
      head: [['Product', 'SKU', 'Current Stock', 'Threshold', 'Status']],
      body: lowStockData,
      theme: 'grid',
      headStyles: { fillColor: [136, 132, 216] }
    });

    // Save the PDF
    doc.save(`inventory-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  // Check if we're on a mobile device
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [isMobileView, setIsMobileView] = useState(isMobile);

  // Add window resize listener to update mobile view state
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header section with responsive layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <h1 className="text-xl md:text-2xl font-bold">Reports</h1>

        {/* Controls section - stacks on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto justify-start text-left font-normal text-xs md:text-sm",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
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
            <PopoverContent className="w-auto p-0" align="center">
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
                numberOfMonths={isMobileView ? 1 : 2}
              />
            </PopoverContent>
          </Popover>

          {/* Period selector */}
          <Select value={salesPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] text-xs md:text-sm h-9">
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

          {/* Export button */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading || (activeTab === 'sales' && !salesSummary) ||
                     (activeTab === 'products' && !productSales) ||
                     (activeTab === 'inventory' && !inventoryReport)}
            className="w-full sm:w-auto text-xs md:text-sm h-9"
          >
            <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs with mobile-friendly styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-8 md:h-9">
          <TabsTrigger value="sales" className="text-xs md:text-sm py-1">Sales Summary</TabsTrigger>
          <TabsTrigger value="products" className="text-xs md:text-sm py-1">Product Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs md:text-sm py-1">Inventory</TabsTrigger>
        </TabsList>

        {/* Sales Summary Tab */}
        <TabsContent value="sales" className="space-y-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-6 md:py-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">Loading sales data...</p>
            </div>
          ) : error ? (
            <div className="p-3 md:p-4 text-xs md:text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : salesSummary ? (
            <>
              {/* Sales Overview Cards - Responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(salesSummary.totalSales)}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {salesSummary.totalOrders} orders
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Average Order</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(salesSummary.averageOrderValue)}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      Per transaction
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart - Responsive height */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Sales Trend</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Daily sales for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <div className="h-[200px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesSummary.dailySales}
                        margin={{
                          top: 5,
                          right: isMobileView ? 10 : 30,
                          left: isMobileView ? 0 : 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayDate" tick={{ fontSize: isMobileView ? 10 : 12 }} />
                        <YAxis tick={{ fontSize: isMobileView ? 10 : 12 }} />
                        <Tooltip
                          formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{ fontSize: isMobileView ? 10 : 12 }}
                        />
                        <Bar dataKey="total" fill="#8884d8" name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods - Responsive layout */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Payment Methods</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Breakdown of sales by payment method
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Chart - Responsive height */}
                    <div className="w-full md:w-1/2 h-[200px] md:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesSummary.paymentMethodBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={isMobileView ? 60 : 80}
                            fill="#8884d8"
                            dataKey="total"
                            nameKey="method"
                            label={isMobileView ? undefined : ({ name, percent }) =>
                              `${name} ${formatPercentage(percent * 100)}`
                            }
                          >
                            {salesSummary.paymentMethodBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                            contentStyle={{ fontSize: isMobileView ? 10 : 12 }}
                          />
                          <Legend
                            verticalAlign={isMobileView ? "bottom" : "middle"}
                            align={isMobileView ? "center" : "right"}
                            layout={isMobileView ? "horizontal" : "vertical"}
                            iconSize={isMobileView ? 8 : 10}
                            fontSize={isMobileView ? 10 : 12}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table - Scrollable on mobile */}
                    <div className="w-full md:w-1/2 overflow-x-auto">
                      <table className="w-full min-w-[300px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 md:py-2 text-xs md:text-sm">Method</th>
                            <th className="text-right py-1 md:py-2 text-xs md:text-sm">Orders</th>
                            <th className="text-right py-1 md:py-2 text-xs md:text-sm">Total</th>
                            <th className="text-right py-1 md:py-2 text-xs md:text-sm">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesSummary.paymentMethodBreakdown.map((method, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-1 md:py-2 text-xs md:text-sm capitalize">{method.method.replace('_', ' ')}</td>
                              <td className="text-right py-1 md:py-2 text-xs md:text-sm">{method.count}</td>
                              <td className="text-right py-1 md:py-2 text-xs md:text-sm">{formatCurrency(method.total)}</td>
                              <td className="text-right py-1 md:py-2 text-xs md:text-sm">{formatPercentage(method.percentage)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
              <p>No sales data available for the selected period</p>
            </div>
          )}
        </TabsContent>

        {/* Product Sales Tab */}
        <TabsContent value="products" className="space-y-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-6 md:py-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">Loading product sales data...</p>
            </div>
          ) : error ? (
            <div className="p-3 md:p-4 text-xs md:text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : productSales ? (
            <>
              {/* Product Sales Overview - Responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Products Sold</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{productSales.totalQuantity}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {productSales.totalProducts} unique products
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(productSales.totalSales)}</div>
                  </CardContent>
                </Card>

                <Card className="p-3 md:py-6 col-span-2 md:col-span-1">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Top Product</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    {productSales.topProducts.length > 0 ? (
                      <>
                        <div className="text-sm md:text-lg font-bold line-clamp-1">{productSales.topProducts[0].product_name}</div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {productSales.topProducts[0].quantity} units sold
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground text-xs md:text-sm">No data</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Products - Responsive chart */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Top Selling Products</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Products with the highest sales volume
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <div className="h-[200px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productSales.topProducts.slice(0, isMobileView ? 5 : 10)}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: isMobileView ? 10 : 30,
                          left: isMobileView ? 80 : 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: isMobileView ? 10 : 12 }} />
                        <YAxis
                          type="category"
                          dataKey="product_name"
                          width={isMobileView ? 80 : 100}
                          tick={{ fontSize: isMobileView ? 9 : 12 }}
                          tickFormatter={(value) => isMobileView && value.length > 15 ? value.substring(0, 15) + '...' : value}
                        />
                        <Tooltip
                          formatter={(value) => [value, 'Quantity']}
                          contentStyle={{ fontSize: isMobileView ? 10 : 12 }}
                        />
                        <Bar dataKey="quantity" fill="#8884d8" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Product Sales Table - Responsive with horizontal scroll */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Product Sales Details</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Detailed breakdown of all product sales
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <div className="rounded-md border overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">Product</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Quantity</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Total Sales</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Avg. Price</th>
                          <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">% of Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {productSales.products.slice(0, isMobileView ? 10 : productSales.products.length).map((product, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm max-w-[120px] md:max-w-none truncate">{product.product_name}</td>
                            <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{product.quantity}</td>
                            <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{formatCurrency(product.total)}</td>
                            <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{formatCurrency(product.average_price)}</td>
                            <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{formatPercentage(product.percentage_of_sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {isMobileView && productSales.products.length > 10 && (
                    <div className="text-center mt-2 text-xs text-muted-foreground">
                      Showing top 10 of {productSales.products.length} products
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
              <p>No product sales data available for the selected period</p>
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-6 md:py-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">Loading inventory data...</p>
            </div>
          ) : error ? (
            <div className="p-3 md:p-4 text-xs md:text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          ) : inventoryReport ? (
            <>
              {/* Inventory Overview - Responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{inventoryReport.totalProducts}</div>
                  </CardContent>
                </Card>

                <Card className="p-3 md:py-6">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(inventoryReport.inventoryValue)}</div>
                  </CardContent>
                </Card>

                <Card className="p-3 md:py-6 col-span-2 md:col-span-1">
                  <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6">
                    <div className="text-lg md:text-2xl font-bold">{inventoryReport.lowStockCount}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      Need attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Status - Responsive chart */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Inventory Status</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Overview of current inventory levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <div className="h-[200px] md:h-[300px]">
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
                          outerRadius={isMobileView ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                          label={isMobileView ? undefined : ({ name, percent }) =>
                            `${name} ${formatPercentage(percent * 100)}`
                          }
                        >
                          <Cell fill="#4ade80" /> {/* Green for In Stock */}
                          <Cell fill="#facc15" /> {/* Yellow for Low Stock */}
                          <Cell fill="#f87171" /> {/* Red for Out of Stock */}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: isMobileView ? 10 : 12 }} />
                        <Legend
                          verticalAlign={isMobileView ? "bottom" : "middle"}
                          align={isMobileView ? "center" : "right"}
                          layout={isMobileView ? "horizontal" : "vertical"}
                          iconSize={isMobileView ? 8 : 10}
                          fontSize={isMobileView ? 10 : 12}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Items - Responsive table */}
              <Card className="p-3 md:py-6">
                <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
                  <CardTitle className="text-sm md:text-base">Low Stock Items</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Products that need to be restocked soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  {inventoryReport.lowStockItems.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground">Product</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">SKU</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Stock</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Threshold</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {inventoryReport.lowStockItems.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                              <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm max-w-[120px] md:max-w-none truncate">{item.name}</td>
                              <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{item.sku || 'N/A'}</td>
                              <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{item.stock_quantity}</td>
                              <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">{item.low_stock_threshold || 'N/A'}</td>
                              <td className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-right">
                                <span className={`inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
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
                    <div className="text-center py-4 text-xs md:text-sm text-muted-foreground">
                      <p>No low stock items found</p>
                    </div>
                  )}
                </CardContent>
              </Card>


            </>
          ) : (
            <div className="text-center py-6 md:py-8 text-xs md:text-sm text-muted-foreground">
              <p>No inventory data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
