'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Use dynamic import with SSR disabled to prevent hydration issues
const ProductsManagement = dynamic(
  () => import('./products-management'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products management...</p>
      </div>
    )
  }
)

export default function ProductsClient() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    }>
      <ProductsManagement />
    </Suspense>
  )
}
