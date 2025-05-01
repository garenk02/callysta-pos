'use client'

import { useState } from 'react'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoading(false)
    }
  }
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
