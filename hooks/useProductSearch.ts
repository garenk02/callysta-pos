'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Product } from '@/types'
import { toast } from 'sonner'
import { getProductByIdClient } from '@/lib/supabase/client-queries'

// Debounce function to limit how often a function is called
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface UseProductSearchProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  autoFocus?: boolean
}

interface UseProductSearchResult {
  filteredProducts: Product[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  isScanning: boolean
  scanBuffer: string
  handleSearchInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  searchInputRef: React.RefObject<HTMLInputElement>
}

export function useProductSearch({
  products,
  onAddToCart,
  autoFocus = true
}: UseProductSearchProps): UseProductSearchResult {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isScanning, setIsScanning] = useState(false)
  const [scanBuffer, setScanBuffer] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>

  // Barcode scanner typically sends characters very quickly
  // and ends with an Enter key press
  const scanTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTime = useRef<number>(0)
  const keyBuffer = useRef<string[]>([])

  // Constants for barcode scanner detection
  const SCAN_SPEED_THRESHOLD = 50 // milliseconds between keystrokes
  const SCAN_TIMEOUT = 100 // milliseconds after last keystroke to process barcode

  // Filter products based on search query and selected category
  const filterProducts = useCallback(() => {
    let filtered = [...products]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, products])

  // Debounced filter function to prevent excessive filtering during typing
  const debouncedFilterProducts = useCallback(
    debounce(filterProducts, 300),
    [filterProducts]
  )

  // Update filtered products when search query or category changes
  useEffect(() => {
    debouncedFilterProducts()
  }, [searchQuery, selectedCategory, debouncedFilterProducts])

  // Process a potential barcode scan
  const processScan = useCallback(async (barcode: string) => {
    setIsScanning(false)
    setScanBuffer('')

    // First, try to find the product by SKU in the current products array
    const productBySku = products.find(
      p => p.sku?.toLowerCase() === barcode.toLowerCase()
    )

    if (productBySku) {
      // If found locally, add to cart
      onAddToCart(productBySku)
      setSearchQuery('')
      toast.success(`Added ${productBySku.name} to cart`)
      return
    }

    // If not found locally, try to fetch from the database
    try {
      // Use cache for better performance
      const { data, error } = await getProductByIdClient(barcode, {
        useCache: true,
        cacheTTL: 300 // 5 minutes
      })

      if (error) {
        toast.error(`Product not found: ${barcode}`)
        return
      }

      if (data) {
        onAddToCart(data)
        setSearchQuery('')
        toast.success(`Added ${data.name} to cart`)
      }
    } catch (err) {
      toast.error('Failed to lookup product')
      console.error('Error looking up product by barcode:', err)
    }
  }, [products, onAddToCart])

  // Handle keyboard events for barcode scanner
  const handleSearchInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - lastKeyTime.current

    // Reset scan state if it's been too long since the last keystroke
    if (timeDiff > 500) {
      keyBuffer.current = []
    }

    // Update the last key time
    lastKeyTime.current = currentTime

    // If Enter key is pressed and we might be scanning
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent form submission

      // If we have keys in the buffer and they were typed quickly, treat as barcode
      if (keyBuffer.current.length > 3 && timeDiff < SCAN_SPEED_THRESHOLD) {
        const barcode = keyBuffer.current.join('')
        keyBuffer.current = []
        processScan(barcode)
      } else if (e.currentTarget.value.trim()) {
        // If it's a manual search with Enter, process the current input value
        processScan(e.currentTarget.value.trim())
      }

      return
    }

    // Add the key to the buffer if it's a printable character
    if (e.key.length === 1) {
      keyBuffer.current.push(e.key)

      // If keys are coming in fast enough, consider it a scan in progress
      if (timeDiff < SCAN_SPEED_THRESHOLD) {
        setIsScanning(true)
        setScanBuffer(keyBuffer.current.join(''))

        // Reset the scan timeout
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current)
        }

        // Set a timeout to process the scan if no more keys come in
        scanTimeout.current = setTimeout(() => {
          if (keyBuffer.current.length > 3) {
            const barcode = keyBuffer.current.join('')
            keyBuffer.current = []
            processScan(barcode)
          } else {
            setIsScanning(false)
          }
        }, SCAN_TIMEOUT)
      }
    }
  }, [processScan])

  // Focus the search input when the component mounts (if autoFocus is enabled)
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }

    return () => {
      // Clean up any pending timeouts
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current)
      }
    }
  }, [])

  return {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isScanning,
    scanBuffer,
    handleSearchInputKeyDown,
    searchInputRef
  }
}
