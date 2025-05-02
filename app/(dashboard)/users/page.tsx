'use client'

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User, UserPlus, Loader2
} from "lucide-react";
import { columns } from "./columns";
import {
  getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser
} from "@/app/api/users/actions";
import { User as UserType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// Form schema for adding/editing users
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "cashier"], {
    required_error: "Please select a role.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }).optional(),
  is_active: z.boolean().default(true),
});

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users on component mount
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);

      try {
        const { data: fetchedUsers, error: fetchError } = await getUsers();

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setUsers(fetchedUsers || []);
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching users.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Form for adding a new user
  const addUserForm = useForm({
    resolver: zodResolver(userFormSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      role: "cashier",
      password: "",
      is_active: true,
    },
  });

  // Form for editing an existing user
  const editUserForm = useForm({
    resolver: zodResolver(userFormSchema.omit({ password: true, email: true })) as any,
    defaultValues: {
      name: "",
      role: "cashier",
      is_active: true,
    },
  });

  // Handle adding a new user
  const handleAddUser = async (values: any) => {
    setIsSubmitting(true);

    try {
      // Use the server action to create the user
      const { data, error } = await createUser(
        values.email,
        values.password || 'temppassword123', // Fallback to a default if somehow empty
        values.name,
        values.role,
        values.is_active
      );

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the user list
      const { data: updatedUsers } = await getUsers();
      setUsers(updatedUsers || []);

      // Show success toast
      toast.success('User created successfully');

      // Close the dialog and reset the form
      setIsAddDialogOpen(false);
      addUserForm.reset();

    } catch (err) {
      console.error('Error adding user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a user
  const handleEditUser = async (values: any) => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      // Use the server action to update the user
      const { data, error } = await updateUser(selectedUser.id, {
        name: values.name,
        role: values.role,
        is_active: values.is_active
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the user list
      const { data: updatedUsers } = await getUsers();
      setUsers(updatedUsers || []);

      // Show success toast
      toast.success('User updated successfully');

      // Close the dialog and reset the form
      setIsEditDialogOpen(false);
      setSelectedUser(null);

    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the edit dialog for a user
  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.name || '',
      role: user.role,
      is_active: user.is_active !== undefined ? user.is_active : true,
    });
    setIsEditDialogOpen(true);
  };

  // Handle toggling user status (active/inactive)
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await toggleUserStatus(userId, !currentStatus);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the user list
      const { data: updatedUsers } = await getUsers();
      setUsers(updatedUsers || []);

      // Show success toast
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error toggling user status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle sending password reset email
  const handleResetPassword = async (email: string) => {
    try {
      const { data, error } = await resetUserPassword(email);

      if (error) {
        throw new Error(error.message);
      }

      // Show success toast
      toast.success('Password reset email sent successfully');
    } catch (err) {
      console.error('Error sending password reset email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    try {
      const { data, error } = await deleteUser(userId);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the user list
      const { data: updatedUsers } = await getUsers();
      setUsers(updatedUsers || []);

      // Show success toast
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>

          {/* Add User Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. The user will receive an email to verify their account.
                </DialogDescription>
              </DialogHeader>

              <Form {...addUserForm}>
                <form onSubmit={addUserForm.handleSubmit(handleAddUser)} className="space-y-4">
                  <FormField
                    control={addUserForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Active
                          </FormLabel>
                          <FormDescription>
                            User can log in and access the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user details and permissions
                </DialogDescription>
              </DialogHeader>

              <Form {...editUserForm}>
                <form onSubmit={editUserForm.handleSubmit(handleEditUser)} className="space-y-4">
                  <FormField
                    control={editUserForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editUserForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Active
                          </FormLabel>
                          <FormDescription>
                            User can log in and access the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No users found</p>
                <p className="text-sm mt-2">Click "Add User" to create your first user</p>
              </div>
            ) : (
              <DataTable
                columns={columns({
                  onEdit: openEditDialog,
                  onResetPassword: handleResetPassword,
                  onToggleStatus: handleToggleUserStatus,
                  onDelete: handleDeleteUser
                })}
                data={users}
                searchKey="name"
                filterableColumns={[
                  {
                    id: "role",
                    title: "Role",
                    options: [
                      { label: "Admin", value: "admin" },
                      { label: "Cashier", value: "cashier" },
                    ],
                  },
                  {
                    id: "is_active",
                    title: "Status",
                    options: [
                      { label: "Active", value: "true" },
                      { label: "Inactive", value: "false" },
                    ],
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
