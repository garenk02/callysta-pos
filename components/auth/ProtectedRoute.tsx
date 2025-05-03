'use client'

import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

export default function ProtectedRoute({
  children,
  allowedRoles = ['admin', 'cashier'],
  fallbackPath = '/'
}: ProtectedRouteProps) {
  const { user, isLoading, checkUserRole } = useAuth()
  const router = useRouter()
  const hasMounted = useRef(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Set up auth check after component has mounted
  useEffect(() => {
    try {
      hasMounted.current = true

      // Wait until auth state is determined
      if (isLoading) return

      // If no user, they will be redirected by the auth context
      if (!user) return

      // Check if user has required role
      if (!checkUserRole(allowedRoles)) {
        router.push(fallbackPath)
      }
    } catch (error) {
      console.error('Error in ProtectedRoute:', error)
      setHasError(true)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }, [user, isLoading, allowedRoles, fallbackPath, router, checkUserRole])

  // During server-side rendering and initial hydration, render children
  // This prevents hydration mismatches
  if (!hasMounted.current) {
    return <>{children}</>
  }

  // Show error state if something went wrong
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="flex items-center text-destructive mb-4">
          <AlertCircle className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-semibold">Error</h2>
        </div>
        <p className="text-center mb-6">
          {errorMessage || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  // Show loading state only after hydration is complete and we're still loading auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
          <div className="text-primary">Loading...</div>
        </div>
      </div>
    )
  }

  // Show unauthorized message if user doesn't have required role
  if (!isLoading && user && !checkUserRole(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="flex items-center text-destructive mb-4">
          <AlertCircle className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
        </div>
        <p className="text-center mb-6">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  // Render children if authorized or still checking auth
  return <>{children}</>
}
