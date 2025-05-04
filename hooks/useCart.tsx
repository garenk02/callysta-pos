'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
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

// Create a global variable to store the cart state
// This ensures the state persists across page navigations and refreshes
let globalCartState: CartItem[] | null = null;

// Helper function to safely parse cart from localStorage
const getCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return globalCartState || [];
  }

  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart) as CartItem[];
      globalCartState = parsedCart;
      return parsedCart;
    }
  } catch (error) {
    console.error('Failed to parse saved cart:', error);
    localStorage.removeItem('cart');
  }

  return globalCartState || [];
};

// Helper function to safely save cart to localStorage
const saveCartToStorage = (cart: CartItem[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    globalCartState = cart;
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize cart state from localStorage or global variable
  const [cart, setCart] = useState<CartItem[]>(() => getCartFromStorage());
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    total: 0,
    itemCount: 0,
    uniqueItemCount: 0
  });

  // Track if component is mounted to avoid hydration issues
  const isMounted = useRef(false);

  // Set mounted flag after initial render
  useEffect(() => {
    isMounted.current = true;

    // Ensure we have the latest cart data from localStorage
    if (typeof window !== 'undefined') {
      const storedCart = getCartFromStorage();
      if (storedCart.length > 0 && cart.length === 0) {
        setCart(storedCart);
      }
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Skip during server-side rendering and initial hydration
    if (!isMounted.current) return;

    saveCartToStorage(cart);
  }, [cart]);

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

    let updatedCart: CartItem[];

    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingItemIndex >= 0) {
      // Update quantity if product is already in cart
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      updatedCart = [...cart, { product, quantity }];
    }

    // Update state
    setCart(updatedCart);

    // Ensure the updated cart is saved to localStorage and global state
    if (isMounted.current) {
      saveCartToStorage(updatedCart);
    }

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

    const updatedCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );

    setCart(updatedCart);

    // Ensure the updated cart is saved to localStorage and global state
    if (isMounted.current) {
      saveCartToStorage(updatedCart);
    }
  }

  // Remove an item from the cart
  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart)
    // Ensure the updated cart is saved to localStorage and global state
    if (isMounted.current) {
      saveCartToStorage(updatedCart)
    }
    toast.info('Item removed from cart')
  }

  // Clear the entire cart
  const clearCart = () => {
    setCart([])
    // Also clear the cart in localStorage and global state
    saveCartToStorage([])
    globalCartState = []
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
