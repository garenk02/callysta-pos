'use client'

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersTable } from "./users-table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { NoAutofocusDialogContent } from "@/components/ui/no-autofocus-dialog";
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
  getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser,
  bulkToggleUserStatus
} from "@/app/api/users/actions";
import { User as UserType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

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

export default function UsersClient() {
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
    resolver: zodResolver(
      userFormSchema.omit({ password: true })
    ) as any,
    defaultValues: {
      name: "",
      email: "",
      role: "cashier",
      is_active: true,
    },
  });

  // Handle adding a new user
  const handleAddUser = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await createUser(
        values.email,
        values.password || "",
        values.name,
        values.role,
        values.is_active
      );

      if (error) {
        toast.error(`Failed to create user: ${error.message}`);
        return;
      }

      // Add the new user to the list
      if (data) {
        setUsers((prev) => [data, ...prev]);
      }

      toast.success("User created successfully");
      setIsAddDialogOpen(false);
      addUserForm.reset();
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("An unexpected error occurred while creating the user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog and populate form with user data
  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.name || "",
      email: user.email,
      role: user.role,
      is_active: user.is_active !== false, // Default to true if undefined
    });
    setIsEditDialogOpen(true);
  };

  // Handle editing a user
  const handleEditUser = async (values: any) => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await updateUser(selectedUser.id, {
        name: values.name,
        email: values.email,
        role: values.role,
        is_active: values.is_active,
      });

      if (error) {
        toast.error(`Failed to update user: ${error.message}`);
        return;
      }

      // Update the user in the list
      if (data) {
        setUsers((prev) =>
          prev.map((user) => (user.id === data.id ? data : user))
        );
      }

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("An unexpected error occurred while updating the user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling user status (active/inactive)
  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { data, error } = await toggleUserStatus(userId, isActive);

      if (error) {
        toast.error(`Failed to update user status: ${error.message}`);
        return;
      }

      // Update the user in the list
      if (data) {
        setUsers((prev) =>
          prev.map((user) => (user.id === data.id ? data : user))
        );
      }

      toast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      console.error("Error toggling user status:", err);
      toast.error(
        "An unexpected error occurred while updating the user status"
      );
    }
  };

  // Bulk actions removed as checkbox column has been removed

  // Handle resetting a user's password
  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await resetUserPassword(email);

      if (error) {
        toast.error(`Failed to reset password: ${error.message}`);
        return;
      }

      toast.success("Password reset email sent successfully");
    } catch (err) {
      console.error("Error resetting password:", err);
      toast.error(
        "An unexpected error occurred while resetting the password"
      );
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    try {
      const { data, error } = await deleteUser(userId);

      if (error) {
        toast.error(`Failed to delete user: ${error.message}`);
        return;
      }

      // Remove the user from the list
      setUsers((prev) => prev.filter((user) => user.id !== userId));

      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("An unexpected error occurred while deleting the user");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                // Reset form when dialog is closed
                addUserForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <NoAutofocusDialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specific permissions.
                </DialogDescription>
              </DialogHeader>

              <Form {...addUserForm}>
                <form
                  onSubmit={addUserForm.handleSubmit(handleAddUser)}
                  className="space-y-4 overflow-y-auto pr-1"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={addUserForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
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
                            <Input
                              type="email"
                              placeholder="Email address"
                              {...field}
                            />
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
                            <Input
                              type="password"
                              placeholder="Password"
                              {...field}
                            />
                          </FormControl>
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
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Admins have full access. Cashiers can only access checkout and products.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addUserForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active</FormLabel>
                            <FormDescription className="text-xs">
                              Inactive users cannot log in.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="mt-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        addUserForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </NoAutofocusDialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen && selectedUser !== null} onOpenChange={(open) => {
            if (!open) {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
            }
          }}>
            <NoAutofocusDialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and permissions.
                </DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <Form {...editUserForm}>
                  <form
                    onSubmit={editUserForm.handleSubmit(handleEditUser)}
                    className="space-y-4 overflow-y-auto pr-1"
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={editUserForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editUserForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Email address"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Email cannot be changed
                            </FormDescription>
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
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                              Admins have full access. Cashiers can only access checkout and products.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editUserForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Active</FormLabel>
                              <FormDescription className="text-xs">
                                Inactive users cannot log in.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter className="mt-2 pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setSelectedUser(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </NoAutofocusDialogContent>
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
              <UsersTable
                columns={columns({
                  onEdit: openEditDialog,
                  onResetPassword: handleResetPassword,
                  onToggleStatus: handleToggleUserStatus,
                  onDelete: handleDeleteUser
                })}
                data={users}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
