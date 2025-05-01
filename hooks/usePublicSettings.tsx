'use client'

import { useState, useEffect } from 'react'
import { SettingsMap } from '@/lib/supabase/client-settings'

export function usePublicSettings() {
  const [settings, setSettings] = useState<SettingsMap | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPublicSettings() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/settings')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Public settings loaded:', data)
        setSettings(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching public settings:', err)
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicSettings()
  }, [])

  return { settings, isLoading, error }
}
