'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Product } from '@/types'
import { getProductsClient } from '@/lib/supabase/client-queries'
import { toast } from 'sonner'

interface UseInfiniteProductsProps {
  pageSize?: number
  initialCategory?: string
  initialSearchQuery?: string
}

export function useInfiniteProducts({
  pageSize = 9, // Default to 9 products per page
  initialCategory = 'all',
  initialSearchQuery = ''
}: UseInfiniteProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [totalCount, setTotalCount] = useState(0)

  // Track if we need to reset data
  const resetRef = useRef(false)

  // Track if component is mounted
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Function to fetch categories (only once)
  const fetchCategories = useCallback(async () => {
    try {
      const { products: allProducts } = await getProductsClient({
        pageSize: 1000,
        isActive: true,
        useCache: true,
        cacheTTL: 3600, // Cache for 1 hour
      })

      if (allProducts && isMountedRef.current) {
        const uniqueCategories = [...new Set(allProducts
          .map(product => product.category)
          .filter(Boolean) as string[])]

        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Function to fetch products
  const fetchProducts = useCallback(async (currentPage: number, isReset: boolean) => {
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory

      console.log(`Fetching products for page ${currentPage} with pageSize ${pageSize}`)

      // Use cache for initial load to improve performance
      const { products: fetchedProducts, totalCount: count, error: fetchError } = await getProductsClient({
        page: currentPage,
        pageSize,
        searchQuery,
        category,
        isActive: true,
        useCache: isReset, // Use cache for initial load, but not for pagination
        cacheTTL: 60, // 1 minute cache
      })

      if (fetchError) {
        toast.error(`Failed to load products: ${fetchError.message}`)
        return false
      }

      if (fetchedProducts && isMountedRef.current) {
        console.log(`Fetched ${fetchedProducts.length} products, total: ${count}`)

        // Calculate if there are more products to load
        const totalItems = count || 0
        const hasMoreItems = (currentPage * pageSize) < totalItems

        console.log(`Page: ${currentPage}, Total: ${totalItems}, Has more: ${hasMoreItems}`)

        // Update state
        setTotalCount(totalItems)
        setHasMore(hasMoreItems)

        if (isReset) {
          // Reset products
          console.log(`Resetting products with ${fetchedProducts.length} items`)
          setProducts(fetchedProducts)
        } else if (fetchedProducts.length > 0) {
          // Append new products, avoiding duplicates
          const existingIds = new Set(products.map(p => p.id))
          const newProducts = fetchedProducts.filter(p => !existingIds.has(p.id))

          console.log(`Adding ${newProducts.length} new products to existing ${products.length} products`)

          if (newProducts.length > 0) {
            setProducts(prev => [...prev, ...newProducts])
          } else {
            console.log('No new products to add, might have reached the end')
            // If no new products were added but we fetched products, we might have duplicates
            if (fetchedProducts.length > 0 && newProducts.length === 0) {
              console.log('Got duplicates, setting hasMore to false')
              setHasMore(false)
            }
          }
        } else {
          // No products returned, we've reached the end
          console.log('No products returned, reached the end')
          setHasMore(false)
        }

        return true
      }

      return false
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Failed to load products')
      return false
    }
  }, [pageSize, products, searchQuery, selectedCategory])

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)

    try {
      // Fetch categories and initial products in parallel for better performance
      await Promise.all([
        fetchCategories(),
        fetchProducts(1, true)
      ])
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [fetchCategories, fetchProducts])

  // Load more data
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) {
      console.log(`Cannot load more: hasMore=${hasMore}, isLoadingMore=${isLoadingMore}, isLoading=${isLoading}`)
      return
    }

    setIsLoadingMore(true)
    const nextPage = page + 1

    console.log(`Loading more products, incrementing page from ${page} to ${nextPage}`)

    try {
      const success = await fetchProducts(nextPage, false)
      if (success && isMountedRef.current) {
        setPage(nextPage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false)
      }
    }
  }, [fetchProducts, hasMore, isLoading, isLoadingMore, page])

  // Reset and reload data
  const resetAndReload = useCallback(() => {
    setPage(1)
    resetRef.current = true
    loadInitialData()
  }, [loadInitialData])

  // Handle search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    resetAndReload()
  }, [resetAndReload])

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    resetAndReload()
  }, [resetAndReload])

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  return {
    products,
    categories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery: handleSearchChange,
    selectedCategory,
    setSelectedCategory: handleCategoryChange,
    totalCount,
    refresh: resetAndReload
  }
}
