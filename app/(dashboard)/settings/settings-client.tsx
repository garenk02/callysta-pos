'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SettingsMap } from '@/lib/supabase/client-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SettingsForm from '@/components/settings/SettingsForm'

export default function SettingsClient() {
  // State for settings - used throughout the component
  const [settings, setSettings] = useState<SettingsMap>({
    app_name: '',
    app_address: '',
    app_phone: '',
    app_email: ''
  })

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  // isAdmin is used to track if the user has admin permissions
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings and check permissions
  useEffect(() => {
    async function initialize() {
      try {
        console.log('Initializing settings page...')
        const supabase = createClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log('No user found')
          setError('You must be logged in to access this page')
          setIsLoading(false)
          return
        }

        // console.log('User found:', user.id)

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          console.log('Profile error:', profileError)
          setError('Failed to load user profile')
          setIsLoading(false)
          return
        }

        // console.log('User role:', profile.role)

        // Only admins can access settings
        if (profile.role !== 'admin') {
          console.log('User is not admin')
          setError('You do not have permission to access settings')
          setIsLoading(false)
          return
        }

        setIsAdmin(true)

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('key, value')

        if (settingsError) {
          console.log('Settings error:', settingsError)
          setError('Failed to load settings')
          setIsLoading(false)
          return
        }

        // console.log('Settings loaded:', settingsData)

        // Convert array to map
        const settingsMap = settingsData.reduce((map: SettingsMap, setting) => {
          map[setting.key as keyof SettingsMap] = setting.value
          return map
        }, {} as SettingsMap)

        setSettings(settingsMap)
        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing settings page:', err)
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }

    initialize()
  }, [])



  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Configure your business details that will appear on receipts and the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-md flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <SettingsForm
                settingKeys={['app_name', 'app_address', 'app_phone', 'app_email']}
                labels={{
                  app_name: 'Business Name',
                  app_address: 'Business Address',
                  app_phone: 'Business Phone',
                  app_email: 'Business Email'
                }}
                descriptions={{
                  app_name: 'The name of your business that will appear on receipts',
                  app_address: 'Your business address',
                  app_phone: 'Your business phone number',
                  app_email: 'Your business email address'
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
