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
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-1/4" />
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
            <Barcode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Barcode not found: {searchQuery}</p>
            <p className="text-sm text-muted-foreground">
              This barcode doesn't match any product in the system.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-2">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
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

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium line-clamp-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {product.sku && <span className="text-xs">SKU: {product.sku}</span>}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Rp. {product.price.toLocaleString('id-ID')}</p>
            <p className="text-xs text-muted-foreground">
              Stock: {product.stock_quantity}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={product.stock_quantity <= 0 || product.is_active === false}
          title={product.is_active === false ? "Product not available" :
                 product.stock_quantity <= 0 ? "Out of stock" : "Add to cart"}
        >
          <Plus className="h-4 w-4 mr-1" />
          {product.is_active === false ? "Unavailable" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  )
}
