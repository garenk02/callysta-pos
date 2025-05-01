'use client'

import { useEffect, useState } from 'react'

interface HydrationFixProps {
  children: React.ReactNode
}

/**
 * This component prevents hydration errors by only rendering children on the client
 * It's useful for components that use browser-specific APIs or have hydration issues
 */
export default function HydrationFix({ children }: HydrationFixProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // During SSR and initial hydration, render a hidden placeholder
  if (!isClient) {
    return <div style={{ visibility: 'hidden' }} />
  }

  // Once on the client, render the actual children
  return <>{children}</>
}
