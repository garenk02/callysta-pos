'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Product } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseProductsInfiniteProps {
  pageSize?: number
  initialCategory?: string
  initialSearchQuery?: string
}

export function useProductsInfinite({
  pageSize = 9,
  initialCategory = 'all',
  initialSearchQuery = ''
}: UseProductsInfiniteProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [totalCount, setTotalCount] = useState(0)

  // Function to fetch products directly from Supabase - completely rewritten for reliability
  const fetchProducts = useCallback(async (currentPage: number, isReset: boolean) => {
    try {
      // Set loading states
      if (isReset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      // Create Supabase client
      const supabase = createClient()

      // Calculate pagination range
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1



      // Build query with filters
      let query = supabase.from('products').select('*', { count: 'exact' })

      // Apply search filter if needed
      if (searchQuery && searchQuery.trim() !== '') {
        // Sanitize the search query to prevent SQL injection
        const sanitizedQuery = searchQuery.trim().replace(/[%_]/g, '\\$&')

        // Use sanitized query in the search
        query = query.or(`name.ilike.%${sanitizedQuery}%,sku.ilike.%${sanitizedQuery}%`)
      }

      // Apply category filter if needed
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      // Only get active products
      query = query.or('is_active.is.null,is_active.eq.true')

      // Execute query with pagination and ordering
      const { data, count, error } = await query
        .order('name', { ascending: true })
        .range(from, to)

      // Handle errors
      if (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
        return false
      }

      // Process results
      if (data) {
        // Update products state
        if (isReset) {
          // For reset, replace all products
          setProducts(data)
        } else {
          // For pagination, append new products
          setProducts(prevProducts => {
            // Get existing product IDs for duplicate checking
            const existingIds = new Set(prevProducts.map(p => p.id))

            // Filter out any duplicates
            const newProducts = data.filter(p => !existingIds.has(p.id))

            // Return combined array
            return [...prevProducts, ...newProducts]
          })
        }

        // Update total count
        if (count !== null) {
          setTotalCount(count)
        }

        // Determine if there are more products to load
        if (count !== null) {
          // If we know the total count, compare with current page
          const currentTotal = isReset ? data.length : (currentPage * pageSize)
          const hasMoreItems = currentTotal < count

          setHasMore(hasMoreItems)
        } else {
          // If count is unknown, use page size as heuristic
          const hasMoreItems = data.length >= pageSize
          setHasMore(hasMoreItems)
        }

        return true
      }

      return false
    } catch (err) {
      // Improved error handling with more details
      console.error('Error in fetchProducts:', err)

      // Only show toast for non-search errors or non-empty search queries
      if (!searchQuery || (searchQuery && searchQuery.trim() !== '')) {
        // Show a more specific error message
        if (err instanceof Error) {
          toast.error(`Failed to load products: ${err.message}`)
        } else {
          toast.error('Failed to load products. Please try again.')
        }
      }

      return false
    } finally {
      // Reset loading states
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [pageSize, searchQuery, selectedCategory])

  // Function to fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select('category')
        .or('is_active.is.null,is_active.eq.true')
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      if (data) {
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error('Error in fetchCategories:', err)
    }
  }, [])

  // Load initial data with improved error handling
  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        setIsLoading(true)

        // First load categories
        await fetchCategories()

        // Then load products if component is still mounted
        if (isMounted) {
          await fetchProducts(1, true)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        if (isMounted) {
          toast.error('Failed to load products. Please try refreshing the page.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Start loading data
    loadInitialData()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [fetchCategories, fetchProducts])

  // Debounce timer reference
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Handle search query change with debouncing
  const handleSearchChange = useCallback((query: string) => {
    // Update the search query state immediately for UI
    setSearchQuery(query)

    // Clear any existing debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    // Set a new debounce timer (300ms is a good balance)
    searchDebounceRef.current = setTimeout(() => {
      // Reset to page 1 when searching
      setPage(1)

      try {
        // Fetch products with the new search query
        fetchProducts(1, true)
      } catch (error) {
        // Don't show toast for empty search errors
        if (query.trim() !== '') {
          toast.error('Search failed. Please try again.')
        }
      }

      // Clear the reference
      searchDebounceRef.current = null
    }, 300)
  }, [fetchProducts])

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setPage(1)
    fetchProducts(1, true)
  }, [fetchProducts])

  // Load more products
  const loadMore = useCallback(async () => {
    // Prevent loading if already loading or no more products
    if (isLoading || isLoadingMore) {
      return
    }

    if (!hasMore) {
      return
    }

    try {
      // Calculate next page
      const nextPage = page + 1

      // Set page state first
      setPage(nextPage)

      // Fetch next page of products
      const success = await fetchProducts(nextPage, false)

      if (!success) {
        // Revert page number on failure
        setPage(page)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
      toast.error('Failed to load more products')
      // Reset loading state in case it wasn't reset
      setIsLoadingMore(false)
    }
  }, [fetchProducts, hasMore, isLoading, isLoadingMore, page])

  // Refresh products
  const refresh = useCallback(() => {
    setPage(1)
    fetchProducts(1, true)
  }, [fetchProducts])

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
    refresh
  }
}
