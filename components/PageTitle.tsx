'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSettings } from '@/hooks/useSettings'

export default function PageTitle() {
  const pathname = usePathname()
  const { settings } = useSettings()
  
  // Get app name from settings or use default
  const appName = settings?.app_name || 'EasyFlow POS'
  
  // Convert pathname to title (e.g., "/dashboard" -> "Dashboard")
  const getPageTitle = () => {
    if (!pathname) return 'Dashboard'
    
    // Handle root path
    if (pathname === '/') return 'Dashboard'
    
    // Get the last part of the path
    const path = pathname.split('/').pop() || 'dashboard'
    
    // Capitalize first letter and replace hyphens with spaces
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Set document title
  useEffect(() => {
    const pageTitle = getPageTitle()
    document.title = `${pageTitle} | ${appName}`
  }, [pathname, appName])
  
  // This component doesn't render anything visible
  return null
}
