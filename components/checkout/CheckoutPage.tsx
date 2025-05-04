'use client'

import React, { useState, useEffect } from 'react'
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
import { useCart } from '@/hooks/useCart'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export default function CheckoutPage() {
  // State for products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use our cart context
  const {
    addItem,
    summary: { total, itemCount }
  } = useCart()

  // Use our custom product search hook
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isScanning,
    scanBuffer,
    handleSearchInputKeyDown,
    searchInputRef
  } = useProductSearch({
    products,
    onAddToCart: addItem,
    autoFocus: false // Disable autofocus on search input
  })

  // Fetch products on component mount
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        // Use cache with a 5-minute TTL for better performance
        const { products: fetchedProducts, error: fetchError } = await getProductsClient({
          useCache: true,
          cacheTTL: 300, // 5 minutes
          pageSize: 1000 // Load more products for checkout page
        })

        if (fetchError) {
          toast.error(`Failed to load products: ${fetchError.message}`)
        } else if (fetchedProducts) {
          setProducts(fetchedProducts)

          // Extract unique categories
          const uniqueCategories = [...new Set(fetchedProducts
            .map(product => product.category)
            .filter(Boolean) as string[])]

          setCategories(uniqueCategories)
        }
      } catch (err) {
        toast.error('Failed to load products: An unexpected error occurred')
        console.error('Error loading products:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle payment completion - now handled in PaymentSection
  const handlePaymentComplete = (paymentMethod: PaymentMethod, paymentDetails?: PaymentDetails) => {
    // Show page loading indicator
    setIsPageLoading(true)

    // Show change due message for cash payments
    if (paymentMethod === 'cash' && paymentDetails?.change_due && paymentDetails.change_due > 0) {
      toast.success(`Change due: Rp. ${paymentDetails.change_due.toLocaleString('id-ID')}`)
    }

    // Switch back to Products tab after successful order
    setActiveTab('products')

    // Hide loading indicator after a short delay to ensure UI updates are complete
    setTimeout(() => {
      setIsPageLoading(false)
    }, 1500)
  }

  // State for mobile view tabs
  const [activeTab, setActiveTab] = useState<string>('products')

  // State for page loading indicator
  const [isPageLoading, setIsPageLoading] = useState(false)

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
                  </div>
                </div>

                {/* Product grid */}
                <div className="mt-2 overflow-auto" style={{ height: 'min(calc(100vh - 14rem), 500px)' }}>
                  <ProductGrid
                    products={filteredProducts}
                    isLoading={isLoading}
                    onAddToCart={addItem}
                    searchQuery={searchQuery}
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
                    <span>Rp. {total.toLocaleString('id-ID')}</span>
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

                <div className="flex-1 overflow-auto">
                  <ProductGrid
                    products={filteredProducts}
                    isLoading={isLoading}
                    onAddToCart={addItem}
                    searchQuery={searchQuery}
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
              maxHeight: 'min(calc(100vh - 24rem), 400px)',
              minHeight: '200px'
            }}>
              <CardContent className="h-full overflow-auto py-2 px-4">
                <CartList />
              </CardContent>
            </div>

            <div className="border-t mt-auto">
              <div className="px-4 py-3">
                <div className="flex justify-between py-1 font-bold text-sm">
                  <span>Total</span>
                  <span>Rp. {total.toLocaleString('id-ID')}</span>
                </div>

                {/* Ensure payment section has enough space and proper overflow handling */}
                <div className="payment-section-container lg:compact-payment" style={{
                  minHeight: '180px',
                  maxHeight: '250px',
                  overflowY: 'auto'
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
