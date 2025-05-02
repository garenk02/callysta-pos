'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, CartItem } from '@/types'
import { toast } from 'sonner'

// No tax is applied in this application

interface CartSummary {
  subtotal: number
  total: number
  itemCount: number
  uniqueItemCount: number
}

interface CartContextType {
  cart: CartItem[]
  summary: CartSummary
  addItem: (product: Product, quantity?: number) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    total: 0,
    itemCount: 0,
    uniqueItemCount: 0
  })

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[]
        setCart(parsedCart)
      } catch (error) {
        console.error('Failed to parse saved cart:', error)
        localStorage.removeItem('cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // Calculate summary whenever cart changes
  useEffect(() => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueItemCount = cart.length

    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    // No tax calculation - total equals subtotal
    const total = subtotal

    setSummary({
      subtotal,
      total,
      itemCount,
      uniqueItemCount
    })
  }, [cart])

  // Add an item to the cart
  const addItem = (product: Product, quantity = 1) => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    // Check if product is active
    if (product.is_active === false) {
      toast.error(`${product.name} is not available for purchase`)
      return
    }

    // Check if product has stock
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is out of stock`)
      return
    }

    // Check if adding this quantity would exceed available stock
    const existingItem = cart.find(item => item.product.id === product.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newTotalQuantity = currentQuantity + quantity

    if (newTotalQuantity > product.stock_quantity) {
      toast.error(`Cannot add ${quantity} more. Only ${product.stock_quantity - currentQuantity} available.`)
      return
    }

    setCart(prevCart => {
      // Check if product is already in cart
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id)

      if (existingItemIndex >= 0) {
        // Update quantity if product is already in cart
        const updatedCart = [...prevCart]
        updatedCart[existingItemIndex].quantity += quantity
        return updatedCart
      } else {
        // Add new item to cart
        return [...prevCart, { product, quantity }]
      }
    })

    toast.success(`Added ${quantity} ${product.name} to cart`)
  }

  // Update the quantity of an item in the cart
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    // Find the product in the cart
    const item = cart.find(item => item.product.id === productId)
    if (!item) {
      toast.error('Product not found in cart')
      return
    }

    // Check if new quantity exceeds available stock
    if (newQuantity > item.product.stock_quantity) {
      toast.error(`Cannot set quantity to ${newQuantity}. Only ${item.product.stock_quantity} available.`)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // Remove an item from the cart
  const removeItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
    toast.info('Item removed from cart')
  }

  // Clear the entire cart
  const clearCart = () => {
    setCart([])
    toast.info('Cart cleared')
  }

  const value = {
    cart,
    summary,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
