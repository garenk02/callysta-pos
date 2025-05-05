'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getProductsClient } from '@/lib/supabase/client-queries'
import { Product, PaymentMethod, PaymentDetails } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Search,
  Barcode,
  Loader2,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ProductGrid from './ProductGrid'
import CartList from './CartList'
import PaymentSection from './PaymentSection'
import { useProductSearch } from '@/hooks/useProductSearch'
import { useProductsInfinite } from '@/hooks/useProductsInfinite'
import { useCart } from '@/hooks/useCart'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  // State for UI
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('products')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use our cart context
  const {
    addItem,
    summary: { total, itemCount }
  } = useCart()

  // Use our infinite products hook
  const {
    products,
    categories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refresh
  } = useProductsInfinite({
    pageSize: 9
  })

  // Debug function to force refresh products
  const debugProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .or('is_active.is.null,is_active.eq.true')
        .order('name', { ascending: true })
        .range(0, 8)

      if (error) {
        console.error('Direct Supabase error:', error)
      }
    } catch (err) {
      console.error('Error in direct API call:', err)
    }

    // Force refresh
    refresh()
  }

  // Debug function to manually load more products
  const debugLoadMore = async () => {
    // Check if we can load more
    if (!hasMore) {
      toast.info('No more products to load')
      return
    }

    if (isLoadingMore || isLoading) {
      toast.info('Already loading products, please wait')
      return
    }

    try {
      // Call the loadMore function
      await loadMore()
      toast.success('Loaded more products')
    } catch (error) {
      toast.error('Failed to load more products')
    }
  }

  // State for barcode scanning
  const [isScanning, setIsScanning] = useState(false)
  const [scanBuffer, setScanBuffer] = useState('')

  // Handle keyboard input for barcode scanning
  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed and we have a search query, treat it as a potential barcode
    if (e.key === 'Enter' && searchQuery) {
      const barcode = searchQuery.trim()

      // Try to find the product by SKU in the current products array
      const productBySku = products.find(
        p => p.sku?.toLowerCase() === barcode.toLowerCase()
      )

      if (productBySku) {
        // If found locally, add to cart
        addItem(productBySku)
        setSearchQuery('')
        toast.success(`Added ${productBySku.name} to cart`)
        return
      }

      // If not found locally, show a message
      toast.error(`Product not found: ${barcode}`)
    }
  }

  // Handle search input change - now properly connected to the search function
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the search value from the input
    const value = e.target.value

    // Call the search function from the hook
    // This will trigger the debounced search in the hook
    setSearchQuery(value)
  }

  // Handle payment completion - now handled in PaymentSection
  const handlePaymentComplete = (paymentMethod: PaymentMethod, paymentDetails?: PaymentDetails) => {
    // Show page loading indicator
    setIsPageLoading(true)

    // Show change due message for cash payments
    if (paymentMethod === 'cash' && paymentDetails?.change_due && paymentDetails.change_due > 0) {
      toast.success(`Change due: ${formatCurrency(paymentDetails.change_due)}`)
    }

    // Switch back to Products tab after successful order
    setActiveTab('products')

    // Hide loading indicator after a short delay to ensure UI updates are complete
    setTimeout(() => {
      setIsPageLoading(false)
    }, 1500)
  }

  // Mobile view tabs and page loading are managed by the state at the top of the component

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Page Loading Overlay */}
      <LoadingOverlay isLoading={isPageLoading} message="Processing your order..." />
      {/* Mobile and Tablet View: Tab Navigation */}
      <div className="lg:hidden px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-2">
            <TabsTrigger value="products" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {itemCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search bar - only visible when in Products tab */}
          {activeTab === 'products' && (
            <div className="relative w-full mb-3">
              {isScanning ? (
                <Barcode className="absolute left-2 top-2.5 h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                ref={searchInputRef}
                placeholder={isScanning ? "Scanning barcode..." : "Search or scan barcode..."}
                className={`pl-8 ${isScanning ? 'border-primary' : ''}`}
                value={isScanning ? scanBuffer : searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchInputKeyDown}
                autoComplete="off"
              />
              {isScanning && (
                <div className="absolute right-2 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}

          <TabsContent value="products" className="m-0 p-0">
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                {/* Category tabs - horizontal scrollable on mobile */}
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                  <div className="flex space-x-1 min-w-max">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs h-7"
                    >
                      All
                    </Button>
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="text-xs h-7 whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={debugProducts}
                      className="text-xs h-7 ml-2"
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={debugLoadMore}
                      className="text-xs h-7 ml-2"
                      disabled={isLoadingMore || !hasMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Product grid with improved scroll container */}
                <div
                  className="mt-2 overflow-y-auto overflow-x-hidden"
                  style={{
                    height: 'min(calc(100vh - 14rem), 500px)',
                    scrollBehavior: 'smooth'
                  }}
                >
                  <ProductGrid
                    products={products}
                    isLoading={isLoading}
                    onAddToCart={addItem}
                    searchQuery={searchQuery}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cart" className="m-0 p-0">
            <Card className="overflow-hidden flex flex-col">
              <CardHeader className="py-2 px-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Current Order</CardTitle>
                  <Badge variant="outline">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </CardHeader>

              {/* Cart items */}
              <div className="flex-1 overflow-hidden" style={{
                height: 'min(calc(100vh - 20rem), 400px)',
                minHeight: '200px'
              }}>
                <CardContent className="h-full overflow-auto py-2 px-3">
                  <CartList />
                </CardContent>
              </div>

              {/* Payment section */}
              <div className="border-t mt-auto">
                <div className="px-3 py-2">
                  <div className="flex justify-between py-0.5 font-bold text-sm">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>

                  {/* Ensure payment section has enough space and proper overflow handling */}
                  <div className="payment-section-container" style={{
                    minHeight: '180px',
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}>
                    <PaymentSection
                      total={total}
                      onPaymentComplete={handlePaymentComplete}
                      disabled={itemCount === 0}
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating cart button when in products view */}
        {activeTab === 'products' && itemCount > 0 && (
          <div className="fixed bottom-4 right-4 z-10">
            <Button
              onClick={() => setActiveTab('cart')}
              size="sm"
              className="rounded-full h-12 w-12 shadow-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
              >
                {itemCount}
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* Desktop View: Side-by-side layout */}
      <div className="hidden lg:flex lg:flex-row flex-1 overflow-hidden">
        {/* Left side - Product Selection */}
        <div className="w-3/5 p-4 overflow-hidden flex flex-col">
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2 px-4">
              <div className="flex justify-center items-center w-full">
                <div className="relative w-full max-w-md">
                  {isScanning ? (
                    <Barcode className="absolute left-2 top-2.5 h-4 w-4 text-primary animate-pulse" />
                  ) : (
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    ref={searchInputRef}
                    placeholder={isScanning ? "Scanning barcode..." : "Search or scan barcode..."}
                    className={`pl-8 ${isScanning ? 'border-primary' : ''}`}
                    value={isScanning ? scanBuffer : searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchInputKeyDown}
                    autoComplete="off"
                  />
                  {isScanning && (
                    <div className="absolute right-2 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-4">
              <Tabs
                defaultValue="all"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="h-full flex flex-col"
              >
                <TabsList className="mb-3 flex-wrap">
                  <TabsTrigger value="all">All Products</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <ProductGrid
                    products={products}
                    isLoading={isLoading}
                    onAddToCart={addItem}
                    searchQuery={searchQuery}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Cart and Payment */}
        <div className="w-2/5 p-4 flex flex-col overflow-hidden">
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="py-2 px-4">
              <div className="flex justify-between items-center">
                <CardTitle>Current Order</CardTitle>
                <Badge variant="outline" className="ml-1">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </CardHeader>

            {/* Cart area with better height control */}
            <div className="flex-1 overflow-hidden" style={{
              maxHeight: 'min(calc(100vh - 26rem), 350px)',
              minHeight: '180px'
            }}>
              <CardContent className="h-full overflow-auto py-2 px-4">
                <CartList />
              </CardContent>
            </div>

            <div className="border-t mt-auto">
              <div className="px-4 py-3">
                <div className="flex justify-between py-1 font-bold text-sm">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                {/* Ensure payment section has enough space and proper overflow handling */}
                <div className="payment-section-container lg:compact-payment" style={{
                  minHeight: '150px',
                  maxHeight: '300px',
                  overflowY: 'visible'
                }}>
                  <PaymentSection
                    total={total}
                    onPaymentComplete={handlePaymentComplete}
                    disabled={itemCount === 0}
                    isCompact={true}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
