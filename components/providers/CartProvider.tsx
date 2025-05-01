'use client'

import { CartProvider as CartContextProvider } from '@/hooks/useCart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <CartContextProvider>{children}</CartContextProvider>
}
