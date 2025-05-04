'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export function LoadingOverlay({ isLoading, message = 'Processing your order...' }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full mx-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{message}</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we process your transaction. This may take a few moments.
        </p>
      </div>
    </div>
  )
}
