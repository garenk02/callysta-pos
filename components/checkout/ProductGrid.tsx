'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Product } from '@/types'
import {
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Barcode, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  onAddToCart: (product: Product) => void
  searchQuery?: string
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export default function ProductGrid({
  products,
  isLoading,
  onAddToCart,
  searchQuery = '',
  hasMore = false,
  isLoadingMore = false,
  onLoadMore
}: ProductGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Setup intersection observer for infinite scrolling
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Get the first entry
      const entry = entries[0];

      // Only proceed if the element is intersecting (visible)
      if (!entry.isIntersecting) {
        return;
      }

      // Check all conditions before loading more
      if (!hasMore) {
        return;
      }

      if (isLoadingMore) {
        return;
      }

      if (isLoading) {
        return;
      }

      if (!onLoadMore) {
        return;
      }

      // All conditions met, load more products
      onLoadMore();
    },
    [hasMore, isLoadingMore, isLoading, onLoadMore]
  );

  // Initialize and cleanup the intersection observer
  useEffect(() => {
    // Only set up observer if we have products and there might be more to load
    if (products.length === 0 || !hasMore) {
      return;
    }

    // Get the reference to the load more element
    const currentRef = loadMoreRef.current;
    if (!currentRef) {
      return;
    }

    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new observer with optimal settings
    observerRef.current = new IntersectionObserver(observerCallback, {
      root: null, // Use the viewport
      rootMargin: '500px', // Start loading well before the element is visible
      threshold: 0 // Trigger as soon as any part of the element is visible
    });

    // Start observing the load more element
    observerRef.current.observe(currentRef);

    // Clean up function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observerCallback, products.length, hasMore]);
  // Determine if we should show skeletons
  const showSkeletons = isLoading && products.length === 0;

  // Render skeletons or products
  return (
    <div className="flex flex-col space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        {/* Show skeletons during initial loading */}
        {showSkeletons &&
          [...Array(9)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))
        }

        {/* Show products when available */}
        {products.map(product => (
          <ProductCard
            key={`product-${product.id}`}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}

        {/* Show loading skeletons at the bottom during "load more" */}
        {isLoadingMore && !showSkeletons && (
          [...Array(3)].map((_, i) => (
            <Card key={`loading-more-${i}`} className="overflow-hidden shadow-sm animate-pulse">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Show empty state when no products and not loading */}
      {products.length === 0 && !showSkeletons && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          {searchQuery ? (
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
      )}

      {/* Load more section - completely rewritten for reliability */}
      <div className="flex flex-col items-center justify-center py-6 mt-2">
        {/* Observer target for infinite scroll */}
        <div ref={loadMoreRef} className="h-4 w-full" />

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex items-center space-x-2 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading more products...</span>
          </div>
        )}

        {/* Load more button - always visible when there are more products */}
        {hasMore && products.length > 0 && !isLoadingMore && (
          <Button
            variant="default"
            size="default" // Larger size for better visibility and touch target
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Load more button clicked manually');
              if (onLoadMore) {
                onLoadMore();
              }
            }}
            className="px-6 py-2 font-medium" // Larger button
            disabled={isLoadingMore || isLoading}
          >
            Load More...
          </Button>
        )}

        {/* End of list message */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-2">
            {/* <p className="text-sm text-muted-foreground font-medium">No more products to load</p> */}
          </div>
        )}
      </div>
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

  // Double tap detection for mobile
  const lastTapRef = React.useRef<number>(0);

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!isOutOfStock && !isInactive) {
        handleAddToCart();
      }
    }

    lastTapRef.current = now;
  }

  // Determine product status
  const isOutOfStock = product.stock_quantity <= 0;
  const isInactive = product.is_active === false;
  const isLowStock = product.low_stock_threshold !== undefined &&
                    product.stock_quantity <= product.low_stock_threshold &&
                    product.stock_quantity > 0;

  return (
    <Card
      className={`overflow-hidden flex flex-col shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 ${isInactive ? 'opacity-70' : ''}`}
      onClick={handleTap}
    >
      <CardContent className="p-3 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
            {product.sku && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                SKU: {product.sku}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatCurrency(product.price)}</p>
            <div className="flex items-center justify-end mt-0.5">
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
      <CardFooter className="p-3 pt-0">
        <Button
          className="w-full"
          size="sm"
          variant={isInactive || isOutOfStock ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation(); // Prevent double tap from triggering
            handleAddToCart();
          }}
          disabled={isOutOfStock || isInactive}
          title={isInactive ? "Product not available" :
                 isOutOfStock ? "Out of stock" : "Add to cart"}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">
            {isInactive ? "Unavailable" : isOutOfStock ? "Out of stock" : "Add to cart"}
          </span>
        </Button>
      </CardFooter>

      {/* Double tap hint - only on mobile */}
      {!isOutOfStock && !isInactive && (
        <div className="absolute top-0 right-0 bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded-bl-md md:hidden">
          Double tap to add
        </div>
      )}
    </Card>
  )
}
