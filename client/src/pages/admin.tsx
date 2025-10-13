import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, UserPlus, Pencil, Trash2, Database, AlertTriangle, Key } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

type UserWithoutPassword = Omit<User, "password">;

export default function AdminPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "user" as "admin" | "user"
  });

  const [qbSettings, setQbSettings] = useState({
    qb_client_id: "",
    qb_client_secret: "",
    qb_redirect_uri: "",
    qb_environment: "sandbox"
  });

  const { data: users, isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/users"],
  });

  // Fetch QB settings
  const { data: qbSettingsData } = useQuery<Record<string, { value: string; description?: string | null }>>({
    queryKey: ["/api/admin/qb-settings"],
  });

  useEffect(() => {
    if (qbSettingsData) {
      setQbSettings({
        qb_client_id: qbSettingsData.qb_client_id?.value || "",
        // Keep masked value from server as placeholder, but track separately
        qb_client_secret: "", // Empty by default for security
        qb_redirect_uri: qbSettingsData.qb_redirect_uri?.value || "",
        qb_environment: qbSettingsData.qb_environment?.value || "sandbox"
      });
    }
  }, [qbSettingsData]);

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setFormData({ username: "", email: "", fullName: "", password: "", role: "user" });
      toast({
        title: "User Created",
        description: "User has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Create Failed",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<typeof formData>) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reset-database");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Database Reset",
        description: "All data has been cleared except users.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset database.",
        variant: "destructive",
      });
    },
  });

  const saveQBSettingsMutation = useMutation({
    mutationFn: async (settings: typeof qbSettings) => {
      // Only send client secret if it has been changed (not empty)
      const payload = {
        qb_client_id: settings.qb_client_id,
        qb_redirect_uri: settings.qb_redirect_uri,
        qb_environment: settings.qb_environment,
        // Only include secret if user entered a new value
        ...(settings.qb_client_secret ? { qb_client_secret: settings.qb_client_secret } : {})
      };
      
      const response = await apiRequest("POST", "/api/admin/qb-settings", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/qb-settings"] });
      // Clear the client secret field after save for security
      setQbSettings(prev => ({ ...prev, qb_client_secret: "" }));
      toast({
        title: "Settings Saved",
        description: "QuickBooks settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save QuickBooks settings.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    createUserMutation.mutate(formData);
  };

  const handleEditUser = (user: UserWithoutPassword) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      fullName: user.fullName || "",
      password: "",
      role: user.role as "admin" | "user"
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    const updates: any = {
      id: selectedUser.id,
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role
    };
    if (formData.password) {
      updates.password = formData.password;
    }
    updateUserMutation.mutate(updates);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-6 max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center" data-testid="text-admin-title">
                <Settings className="mr-2 h-6 w-6" />
                Admin Panel
              </h2>
              <p className="text-muted-foreground">
                Manage users and system settings
              </p>
            </div>

            {/* User Management Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Create, edit, and manage user accounts</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setFormData({ username: "", email: "", fullName: "", password: "", role: "user" });
                      setIsCreateDialogOpen(true);
                    }}
                    data-testid="button-create-user"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.fullName || "-"}</TableCell>
                            <TableCell>{user.email || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      data-testid={`button-delete-user-${user.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QuickBooks Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  QuickBooks Online Settings
                </CardTitle>
                <CardDescription>
                  Configure QuickBooks OAuth credentials for invoice synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qb_client_id">Client ID</Label>
                    <Input
                      id="qb_client_id"
                      type="text"
                      placeholder="Enter QuickBooks Client ID"
                      value={qbSettings.qb_client_id}
                      onChange={(e) => setQbSettings({ ...qbSettings, qb_client_id: e.target.value })}
                      data-testid="input-qb-client-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qb_client_secret">Client Secret</Label>
                    <Input
                      id="qb_client_secret"
                      type="password"
                      placeholder={qbSettingsData?.qb_client_secret?.value === "••••••••" 
                        ? "Leave empty to keep current secret" 
                        : "Enter QuickBooks Client Secret"}
                      value={qbSettings.qb_client_secret}
                      onChange={(e) => setQbSettings({ ...qbSettings, qb_client_secret: e.target.value })}
                      data-testid="input-qb-client-secret"
                    />
                    {qbSettingsData?.qb_client_secret?.value === "••••••••" && (
                      <p className="text-xs text-muted-foreground">
                        Secret is already configured. Enter a new value only if you want to update it.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qb_redirect_uri">Redirect URI</Label>
                    <Input
                      id="qb_redirect_uri"
                      type="text"
                      placeholder="e.g., http://localhost:5000/api/quickbooks/callback"
                      value={qbSettings.qb_redirect_uri}
                      onChange={(e) => setQbSettings({ ...qbSettings, qb_redirect_uri: e.target.value })}
                      data-testid="input-qb-redirect-uri"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qb_environment">Environment</Label>
                    <Select
                      value={qbSettings.qb_environment}
                      onValueChange={(value) => setQbSettings({ ...qbSettings, qb_environment: value })}
                    >
                      <SelectTrigger id="qb_environment" data-testid="select-qb-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Development)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => saveQBSettingsMutation.mutate(qbSettings)}
                      disabled={saveQBSettingsMutation.isPending}
                      data-testid="button-save-qb-settings"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {saveQBSettingsMutation.isPending ? "Saving..." : "Save QuickBooks Settings"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <Database className="mr-2 h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Dangerous operations that affect all system data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Reset Database</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will permanently delete all customers, contracts, compliance items, billable events, evidence, and audit logs. 
                        User accounts will be preserved. This action cannot be undone.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" data-testid="button-reset-database">
                            <Database className="mr-2 h-4 w-4" />
                            Reset Database
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all data from the database except user accounts. 
                              This action cannot be undone and will clear:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>All customers</li>
                                <li>All contracts</li>
                                <li>All compliance items</li>
                                <li>All billable events</li>
                                <li>All evidence documents</li>
                                <li>All audit logs</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => resetDatabaseMutation.mutate()}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Reset Database
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user account to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-create-username"
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-create-email"
              />
            </div>
            <div>
              <Label htmlFor="create-fullname">Full Name</Label>
              <Input
                id="create-fullname"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                data-testid="input-create-fullname"
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="input-create-password"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending} data-testid="button-confirm-create-user">
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-edit-username"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div>
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                data-testid="input-edit-fullname"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                data-testid="input-edit-password"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending} data-testid="button-confirm-edit-user">
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
