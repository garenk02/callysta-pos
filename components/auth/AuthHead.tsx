'use client'

import { useEffect } from 'react'
import Head from 'next/head'
import { usePublicSettings } from '@/hooks/usePublicSettings'

interface AuthHeadProps {
  pageType: 'login' | 'signup'
}

export default function AuthHead({ pageType }: AuthHeadProps) {
  const { settings } = usePublicSettings()
  
  // Update document title directly
  useEffect(() => {
    if (settings?.app_name) {
      const title = pageType === 'login' 
        ? `Login - ${settings.app_name}`
        : `Sign Up - ${settings.app_name}`
        
      document.title = title
      // console.log('AuthHead updated document title to:', document.title)
    }
  }, [settings, pageType])
  
  // This component doesn't render anything visible
  return null
}
