'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSettingsMap, updateSettings, SettingsMap } from '@/lib/supabase/client-settings'
import { toast } from 'sonner'

interface SettingsContextType {
  settings: SettingsMap | null
  isLoading: boolean
  error: Error | null
  updateAppSettings: (newSettings: Partial<SettingsMap>) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
  error: null,
  updateAppSettings: async () => false,
  refreshSettings: async () => {}
})

export const useSettings = () => useContext(SettingsContext)

interface SettingsProviderProps {
  children: React.ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<SettingsMap | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  const fetchSettings = async () => {
    if (!isMounted) return

    setIsLoading(true)
    try {
      const { settings: fetchedSettings, error: fetchError } = await getSettingsMap()

      if (fetchError) {
        setError(fetchError)
        toast.error('Failed to load application settings')
      } else {
        setSettings(fetchedSettings)
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(new Error(errorMessage))
      toast.error('Failed to load application settings')
    } finally {
      setIsLoading(false)
    }
  }

  // First mark component as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Then load settings once mounted
  useEffect(() => {
    if (isMounted) {
      fetchSettings()
    }
  }, [isMounted])

  const updateAppSettings = async (newSettings: Partial<SettingsMap>): Promise<boolean> => {
    if (!isMounted) return false

    try {
      const { success, error: updateError } = await updateSettings(newSettings)

      if (updateError) {
        toast.error(`Failed to update settings: ${updateError.message}`)
        return false
      }

      if (success) {
        // Update local state with new settings
        setSettings(prev => {
          if (!prev) return newSettings as SettingsMap
          // Create a new object with all required properties
          const updatedSettings = {
            ...prev,
            ...newSettings
          } as SettingsMap
          return updatedSettings
        })

        toast.success('Settings updated successfully')
        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      toast.error(`Failed to update settings: ${errorMessage}`)
      return false
    }
  }

  const refreshSettings = async () => {
    if (isMounted) {
      await fetchSettings()
    }
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      error,
      updateAppSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
