'use client'

import React, { useState, useEffect } from 'react'
import { getProductsClient } from '@/lib/supabase/client-queries'
import { Product, PaymentMethod, PaymentDetails } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Barcode,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import ProductGrid from './ProductGrid'
import CartList from './CartList'
import PaymentSection from './PaymentSection'
import KeyboardShortcuts from './KeyboardShortcuts'
import { useProductSearch } from '@/hooks/useProductSearch'
import { useCart } from '@/hooks/useCart'

export default function CheckoutPage() {
  // State for products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use our cart context
  const {
    addItem,
    summary: { subtotal, total, itemCount }
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
    onAddToCart: addItem
  })

  // Fetch products on component mount
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        const { products: fetchedProducts, error: fetchError } = await getProductsClient()

        if (fetchError) {
          setError(fetchError.message)
          toast.error('Failed to load products')
        } else if (fetchedProducts) {
          setProducts(fetchedProducts)

          // Extract unique categories
          const uniqueCategories = [...new Set(fetchedProducts
            .map(product => product.category)
            .filter(Boolean) as string[])]

          setCategories(uniqueCategories)
        }
      } catch (err) {
        setError('An unexpected error occurred')
        toast.error('Failed to load products')
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
    // Show change due message for cash payments
    if (paymentMethod === 'cash' && paymentDetails?.change_due && paymentDetails.change_due > 0) {
      toast.success(`Change due: Rp. ${paymentDetails.change_due.toLocaleString('id-ID')}`)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Product Selection */}
        <div className="w-2/3 p-4 overflow-hidden flex flex-col">
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Products</CardTitle>
                  <KeyboardShortcuts />
                </div>
                <div className="relative w-64">
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
            <CardContent className="flex-1 overflow-hidden">
              <Tabs
                defaultValue="all"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="h-full flex flex-col"
              >
                <TabsList className="mb-4">
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
        <div className="w-1/3 p-4 flex flex-col overflow-hidden">
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="py-0 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Current Order</CardTitle>
                <Badge variant="outline" className="ml-1">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </CardHeader>

            <div style={{ height: "285px" }}>
              <CardContent className="h-full overflow-auto py-0">
                <CartList />
              </CardContent>
            </div>

            <div className="border-t">
              <div className="px-6 py-1">
                {/* <div className="flex justify-between py-1 text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rp. {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <Separator className="my-1" /> */}
                <div className="flex justify-between py-1 font-bold text-md">
                  <span>Total</span>
                  <span>Rp. {total.toLocaleString('id-ID')}</span>
                </div>

                <PaymentSection
                  total={total}
                  onPaymentComplete={handlePaymentComplete}
                  disabled={itemCount === 0}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
