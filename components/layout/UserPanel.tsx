
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Settings, User, Shield, Loader2 } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import CartSummary from '@/components/checkout/CartSummary'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { NoAutofocusAlertDialogContent } from '@/components/ui/no-autofocus-alert-dialog'

export default function UserPanel() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get first letter of email for avatar
  const getInitial = () => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
  }

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
    <div className="flex items-center gap-2">
      <CartSummary />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-muted-foreground flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              {isAdmin ? 'Administrator' : 'Cashier'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setIsLogoutDialogOpen(true);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>

        {/* Logout Confirmation Dialog */}
        <AlertDialog
          open={isLogoutDialogOpen}
          onOpenChange={(open) => {
            setIsLogoutDialogOpen(open);
            if (!open) {
              setIsLoading(false);
            }
          }}
        >
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
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}

