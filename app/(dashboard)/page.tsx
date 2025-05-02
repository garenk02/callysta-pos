// app/(dashboard)/page.tsx
'use client'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
// Add revalidation to ensure fresh data
export const revalidate = 0;

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart} from "lucide-react";
import { ArrowUp, DollarSign, AlertTriangle } from "lucide-react";

export default function Dashboard() {
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
                <p className="text-2xl font-bold">Rp. 1.893.840</p>
                <p className="text-xs flex items-center text-green-500">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  8% from last week
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
                <p className="text-2xl font-bold">25</p>
                <p className="text-xs flex items-center text-green-500">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  12% from last week
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
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">
                  Items need attention
                </p>
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
                <p className="text-2xl font-bold">Rp. 421.500</p>
                <p className="text-xs text-muted-foreground">
                  8 transactions
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
            <div className="h-80 flex items-end space-x-2">
              {/* Simplified bar chart representation */}
              <div className="bg-primary/20 w-1/7 h-[10%]"></div>
              <div className="bg-primary/20 w-1/7 h-[15%]"></div>
              <div className="bg-primary/20 w-1/7 h-[90%]"></div>
              <div className="bg-primary/20 w-1/7 h-[30%]"></div>
              <div className="bg-primary/20 w-1/7 h-[5%]"></div>
              <div className="bg-primary/20 w-1/7 h-[10%]"></div>
              <div className="bg-primary/20 w-1/7 h-[15%]"></div>
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
            <div className="h-80 flex items-center justify-center">
              {/* Placeholder for pie chart */}
              <div className="relative h-40 w-40 rounded-full overflow-hidden">
                <div className="absolute h-full w-full bg-primary/20 rounded-full"></div>
                <div className="absolute h-full w-1/2 bg-primary rounded-l-full"></div>
                <div className="absolute top-0 right-0 h-1/3 w-1/2 bg-blue-400 rounded-tr-full"></div>
                <div className="absolute h-16 w-16 bg-background rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}