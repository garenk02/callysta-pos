'use client'

import React from 'react'
import { Product } from '@/types'
import {
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Barcode } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  onAddToCart: (product: Product) => void
  searchQuery?: string
}

export default function ProductGrid({
  products,
  isLoading,
  onAddToCart,
  searchQuery = ''
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="overflow-hidden shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    // Check if this might be a barcode scan attempt
    const mightBeBarcode = searchQuery &&
      (searchQuery.length >= 8 || /^[0-9]+$/.test(searchQuery));

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        {mightBeBarcode ? (
          <>
            <Barcode className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground mb-2">Barcode not found</p>
            <p className="text-muted-foreground mb-2">{searchQuery}</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This barcode doesn't match any product in the system. Please check the barcode or add this product to your inventory.
            </p>
          </>
        ) : searchQuery ? (
          <>
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No products found</p>
            <p className="text-muted-foreground mb-2">No results for "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          </>
        ) : (
          <>
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No products found</p>
            <p className="text-sm text-muted-foreground">Try selecting a different category or adding products to your inventory</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const handleAddToCart = () => {
    onAddToCart(product)
  }

  // Determine product status
  const isOutOfStock = product.stock_quantity <= 0;
  const isInactive = product.is_active === false;
  const isLowStock = product.low_stock_threshold !== undefined &&
                    product.stock_quantity <= product.low_stock_threshold &&
                    product.stock_quantity > 0;

  return (
    <Card className={`overflow-hidden flex flex-col shadow-sm transition-all duration-200 hover:shadow-md ${isInactive ? 'opacity-70' : ''}`}>
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <h3 className="font-medium line-clamp-2">{product.name}</h3>
            {product.sku && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                SKU: {product.sku}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">Rp. {product.price.toLocaleString('id-ID')}</p>
            <div className="flex items-center justify-end mt-1">
              {isOutOfStock ? (
                <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm">
                  Out of stock
                </span>
              ) : isLowStock ? (
                <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">
                  Low stock: {product.stock_quantity}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Stock: {product.stock_quantity}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          variant={isInactive || isOutOfStock ? "outline" : "default"}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isInactive}
          title={isInactive ? "Product not available" :
                 isOutOfStock ? "Out of stock" : "Add to cart"}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isInactive ? "Unavailable" : isOutOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
