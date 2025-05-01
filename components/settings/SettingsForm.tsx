'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SettingKey, SettingsMap } from '@/lib/supabase/client-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Save, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface SettingsFormProps {
  settingKeys: SettingKey[]
  labels?: Record<SettingKey, string>
  descriptions?: Record<SettingKey, string>
}

export default function SettingsForm({
  settingKeys,
  labels = {},
  descriptions = {}
}: SettingsFormProps) {
  const [settings, setSettings] = useState<SettingsMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [formValues, setFormValues] = useState<Partial<SettingsMap>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Fetch settings directly
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true)
      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('key')

        if (error) {
          console.error('Error fetching settings:', error.message)
          setError(new Error(error.message))
          return
        }

        // Convert array of settings to a map
        const settingsMap = data.reduce((map: any, setting) => {
          map[setting.key] = setting.value
          return map
        }, {} as SettingsMap)

        setSettings(settingsMap)

        // Initialize form values
        const initialValues: Partial<SettingsMap> = {}
        settingKeys.forEach(key => {
          initialValues[key] = settingsMap[key] || ''
        })
        setFormValues(initialValues)

      } catch (err) {
        console.error('Unexpected error fetching settings:', err)
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [settingKeys])

  const handleChange = (key: SettingKey, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }))
    setIsDirty(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)

    try {
      const supabase = createClient()

      // Create an array of update promises
      const updatePromises = Object.entries(formValues).map(([key, value]) => {
        return supabase
          .from('settings')
          .update({ value })
          .eq('key', key)
      })

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises)

      // Check if any updates failed
      const errors = results
        .map(result => result.error)
        .filter(Boolean)

      if (errors.length > 0) {
        console.error('Error updating settings:', errors)
        setFormError(errors[0]?.message || 'Failed to update settings')
        toast.error('Failed to update settings')
      } else {
        setIsDirty(false)
        toast.success('Settings updated successfully')

        // Update local settings state
        setSettings(prev => ({
          ...prev,
          ...formValues
        }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setFormError(errorMessage)
      toast.error('Failed to update settings')
      console.error('Error saving settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {settingKeys.map(key => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-[100px]" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load settings: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {settingKeys.map(key => {
        const label = labels[key] || key
        const description = descriptions[key]
        const value = formValues[key] || ''

        // Use textarea for address, input for others
        const isMultiline = key === 'app_address'

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            {isMultiline ? (
              <Textarea
                id={key}
                value={value}
                onChange={e => handleChange(key, e.target.value)}
                rows={3}
              />
            ) : (
              <Input
                id={key}
                type="text"
                value={value}
                onChange={e => handleChange(key, e.target.value)}
              />
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )
      })}

      <Button
        type="submit"
        disabled={isSaving || !isDirty}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  )
}
