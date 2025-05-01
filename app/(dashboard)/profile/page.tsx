'use client'

import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Mail } from "lucide-react";

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              View your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold">{user?.email}</h3>
                  <div className="flex items-center justify-center sm:justify-start text-sm text-muted-foreground">
                    <Shield className="mr-1 h-4 w-4" />
                    {isAdmin ? 'Administrator' : 'Cashier'}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <dl className="divide-y">
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6">Email</dt>
                    <dd className="mt-1 flex items-center text-sm leading-6 sm:col-span-2 sm:mt-0">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      {user?.email}
                    </dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6">Role</dt>
                    <dd className="mt-1 flex items-center text-sm leading-6 sm:col-span-2 sm:mt-0">
                      <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                      {isAdmin ? 'Administrator' : 'Cashier'}
                    </dd>
                  </div>
                  <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6">Account created</dt>
                    <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
