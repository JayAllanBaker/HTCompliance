import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@shared/schema";

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactEmail: "",
    isActive: true
  });

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/organizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", code: "", contactEmail: "", isActive: true });
      toast({
        title: "Organization Created",
        description: "Organization has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Create Failed",
        description: error.message || "Failed to create organization.",
        variant: "destructive",
      });
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<typeof formData>) => {
      const response = await apiRequest("PATCH", `/api/organizations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsEditDialogOpen(false);
      setSelectedOrganization(null);
      toast({
        title: "Organization Updated",
        description: "Organization has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update organization.",
        variant: "destructive",
      });
    },
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/organizations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Organization Deleted",
        description: "Organization has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete organization.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClick = () => {
    setFormData({ name: "", code: "", contactEmail: "", isActive: true });
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setFormData({
      name: organization.name,
      code: organization.code,
      contactEmail: organization.contactEmail || "",
      isActive: organization.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganizationMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrganization) {
      updateOrganizationMutation.mutate({ id: selectedOrganization.id, ...formData });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Building2 className="h-8 w-8" />
                  Organization Management
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage client organizations, codes, and contact information
                </p>
              </div>
              <Button
                onClick={handleCreateClick}
                data-testid="button-create-organization"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>
                  All client organizations in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !organizations || organizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No organizations found. Click "Add Organization" to create one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Contact Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.id} data-testid={`row-organization-${org.id}`}>
                          <TableCell className="font-medium" data-testid={`text-org-name-${org.id}`}>
                            {org.name}
                          </TableCell>
                          <TableCell data-testid={`text-org-code-${org.id}`}>
                            {org.code}
                          </TableCell>
                          <TableCell data-testid={`text-org-email-${org.id}`}>
                            {org.contactEmail || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.isActive ? "default" : "secondary"} data-testid={`badge-org-status-${org.id}`}>
                              {org.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(org)}
                                data-testid={`button-edit-organization-${org.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteOrganizationMutation.mutate(org.id)}
                                data-testid={`button-delete-organization-${org.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Add a new organization to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-org-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  data-testid="input-org-code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  data-testid="input-org-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrganizationMutation.isPending}
                data-testid="button-submit-create"
              >
                {createOrganizationMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update organization information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Organization Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-edit-org-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  data-testid="input-edit-org-code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  data-testid="input-edit-org-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateOrganizationMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateOrganizationMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
