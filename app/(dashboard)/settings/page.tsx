'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings as SettingsIcon, Store, Phone, Mail, AlertCircle, Save, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

// Define the settings types
type SettingKey = 'app_name' | 'app_address' | 'app_phone' | 'app_email'
type SettingsMap = Record<SettingKey, string>

export default function SettingsPage() {
  // State for settings
  const [settings, setSettings] = useState<SettingsMap>({
    app_name: '',
    app_address: '',
    app_phone: '',
    app_email: ''
  })
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
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
        
        console.log('User found:', user.id)
        
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
        
        console.log('User role:', profile.role)
        
        // Check if user is admin
        if (profile.role !== 'admin') {
          console.log('User is not admin')
          setError('You do not have permission to access this page')
          setIsLoading(false)
          return
        }
        
        setIsAdmin(true)
        console.log('User is admin, loading settings...')
        
        // Load settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('key, value')
          
        if (settingsError) {
          console.log('Settings error:', settingsError)
          setError('Failed to load settings')
          setIsLoading(false)
          return
        }
        
        console.log('Settings loaded:', settingsData)
        
        // Convert to map
        const settingsMap: Partial<SettingsMap> = {}
        settingsData.forEach(setting => {
          if (setting.key === 'app_name' || 
              setting.key === 'app_address' || 
              setting.key === 'app_phone' || 
              setting.key === 'app_email') {
            settingsMap[setting.key] = setting.value
          }
        })
        
        console.log('Settings map:', settingsMap)
        
        setSettings(prev => ({
          ...prev,
          ...settingsMap
        }))
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing settings page:', err)
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }
    
    initialize()
  }, [])
  
  // Handle input changes
  const handleChange = (key: SettingKey, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const supabase = createClient()
      
      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) => {
        return supabase
          .from('settings')
          .update({ value })
          .eq('key', key)
      })
      
      const results = await Promise.all(updates)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      
      if (errors.length > 0) {
        console.error('Errors saving settings:', errors)
        toast.error('Failed to save some settings')
      } else {
        toast.success('Settings saved successfully')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading settings...</div>
      </div>
    )
  }
  
  // Show error if not admin
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // Show settings form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="business">
            <Store className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure the general settings for your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={settings.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The name of your application that will be displayed in the header and receipts.
                </p>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details that will appear on receipts and invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_address">Business Address</Label>
                <Textarea
                  id="app_address"
                  value={settings.app_address}
                  onChange={(e) => handleChange('app_address', e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Your business address that will be displayed on receipts and invoices.
                </p>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your contact information that will be displayed to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_phone">Phone Number</Label>
                <Input
                  id="app_phone"
                  value={settings.app_phone}
                  onChange={(e) => handleChange('app_phone', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Your business phone number that will be displayed on receipts and invoices.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="app_email">Email Address</Label>
                <Input
                  id="app_email"
                  value={settings.app_email}
                  onChange={(e) => handleChange('app_email', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Your business email address that will be displayed on receipts and invoices.
                </p>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
