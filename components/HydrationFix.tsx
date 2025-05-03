'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface HydrationFixProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  skipFallback?: boolean
}

/**
 * This component prevents hydration errors by only rendering children on the client
 * It's useful for components that use browser-specific APIs or have hydration issues
 *
 * @param children - The content to render after hydration
 * @param fallback - Optional custom fallback UI during SSR/hydration
 * @param skipFallback - If true, renders children during SSR (useful for nested components)
 */
export default function HydrationFix({
  children,
  fallback,
  skipFallback = false
}: HydrationFixProps) {
  // Use a ref to track if we're in the browser
  // This avoids hydration mismatches by not using state during initial render
  const hasMounted = useRef(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as mounted after first render
    hasMounted.current = true
    // Then update state to trigger re-render
    setIsClient(true)
  }, [])

  // During SSR, render children if skipFallback is true
  // This helps with nested components
  if (!hasMounted.current) {
    if (skipFallback) {
      return <div suppressHydrationWarning>{children}</div>
    }

    if (fallback) {
      return <div suppressHydrationWarning>{fallback}</div>
    }

    // Simple loading indicator that won't cause hydration issues
    return (
      <div className="flex items-center justify-center min-h-[50vh]" suppressHydrationWarning>
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
          <div className="text-primary">Loading...</div>
        </div>
      </div>
    )
  }

  // Once mounted on the client, render the actual children
  return <div suppressHydrationWarning>{children}</div>
}
