'use client'

import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
  
  useEffect(() => {
    // Wait until auth state is determined
    if (isLoading) return
    
    // If no user, they will be redirected by the auth context
    if (!user) return
    
    // Check if user has required role
    if (!checkUserRole(allowedRoles)) {
      router.push(fallbackPath)
    }
  }, [user, isLoading, allowedRoles, fallbackPath, router, checkUserRole])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading...</div>
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
  
  // Render children if authorized
  return <>{children}</>
}
