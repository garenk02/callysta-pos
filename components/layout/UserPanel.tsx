
'use client'

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
import { LogOut, Settings, User, Shield } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import CartSummary from '@/components/checkout/CartSummary'

export default function UserPanel() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()

  // Get first letter of email for avatar
  const getInitial = () => {
    if (!user?.email) return '?'
    return user.email.charAt(0).toUpperCase()
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
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button className="w-full flex items-center cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}

