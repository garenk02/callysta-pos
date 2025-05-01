'use client'

import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">admin@example.com</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="mr-1 h-3 w-3" />
                      Administrator
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">cashier@example.com</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="mr-1 h-3 w-3" />
                      Cashier
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
