'use client'

import { Suspense, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ProductsManagement from './products-management'

export default function ProductsWrapper() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex flex-col justify-center items-center py-12" suppressHydrationWarning>
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products management...</p>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    }>
      <div suppressHydrationWarning>
        <ProductsManagement />
      </div>
    </Suspense>
  )
}
