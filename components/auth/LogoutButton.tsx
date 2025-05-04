'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { NoAutofocusAlertDialogContent } from '@/components/ui/no-autofocus-alert-dialog'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const result = await logout()
      if (result.success) {
        // Handle the redirect on the client side
        router.push('/login')
      }
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setIsLoading(false);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? 'Signing out...' : 'Sign out'}
        </Button>
      </AlertDialogTrigger>
      <NoAutofocusAlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              'Sign out'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </NoAutofocusAlertDialogContent>
    </AlertDialog>
  )
}
