import { useState, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Pencil, Trash2, Link as LinkIcon, Search, Filter, FileText, ChevronDown, ChevronRight, FileSignature, ClipboardList, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organization, QuickbooksConnection, Contract, ComplianceItem, Evidence } from "@shared/schema";
import OrganizationNotes from "@/components/organizations/organization-notes";
import EvidenceDetailDialog from "@/components/evidence/evidence-detail-dialog";
import ContractDetailDialog from "@/components/contracts/contract-detail-dialog";
import ContractForm from "@/components/contracts/contract-form";
import ComplianceForm from "@/components/compliance/compliance-form";

interface QBCustomer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
}

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQBDialogOpen, setIsQBDialogOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactEmail: "",
    orgType: "customer" as "customer" | "vendor" | "contractor" | "internal" | "state_govt" | "federal_govt",
    isActive: true
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [qbCustomers, setQbCustomers] = useState<QBCustomer[]>([]);
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("all");
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [detailEvidence, setDetailEvidence] = useState<Evidence | null>(null);
  const [detailContract, setDetailContract] = useState<Contract | null>(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [isCreateComplianceOpen, setIsCreateComplianceOpen] = useState(false);
  const [prefilledOrgId, setPrefilledOrgId] = useState<string | null>(null);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Fetch QB connections for all organizations
  const { data: qbConnections = {} } = useQuery<Record<string, QuickbooksConnection>>({
    queryKey: ["/api/quickbooks/connections"],
    enabled: !!organizations && organizations.length > 0,
  });

  // Fetch contracts for expanded organization
  const { data: expandedContracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", { organizationId: expandedOrgId }],
    queryFn: async () => {
      const response = await fetch(`/api/contracts?organizationId=${expandedOrgId}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    enabled: !!expandedOrgId,
  });

  // Fetch compliance items for expanded organization
  const { data: expandedComplianceData } = useQuery<{ items: ComplianceItem[], total: number }>({
    queryKey: ["/api/compliance-items", { organizationId: expandedOrgId }],
    queryFn: async () => {
      const response = await fetch(`/api/compliance-items?organizationId=${expandedOrgId}`);
      if (!response.ok) throw new Error("Failed to fetch compliance items");
      return response.json();
    },
    enabled: !!expandedOrgId,
  });

  const expandedComplianceItems = expandedComplianceData?.items || [];

  // Fetch evidence for expanded organization
  const { data: allEvidence = [] } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
    enabled: !!expandedOrgId,
  });

  // Filter evidence for this organization (related to its contracts or compliance items)
  const expandedEvidence = allEvidence.filter(evidence => {
    // Evidence linked to contracts of this org
    const linkedToContract = expandedContracts.some(contract => contract.id === evidence.contractId);
    // Evidence linked to compliance items of this org
    const linkedToCompliance = expandedComplianceItems.some(item => item.id === evidence.complianceItemId);
    return linkedToContract || linkedToCompliance;
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/organizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", code: "", contactEmail: "", orgType: "customer", isActive: true });
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
    setFormData({ name: "", code: "", contactEmail: "", orgType: "customer", isActive: true });
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setFormData({
      name: organization.name,
      code: organization.code,
      contactEmail: organization.contactEmail || "",
      orgType: organization.orgType || "customer",
      isActive: organization.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleNotesClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsNotesDialogOpen(true);
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

  const handleQBConnect = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/quickbooks/auth-url?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.authUrl) {
        // Open QuickBooks OAuth in a popup
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        window.open(
          data.authUrl,
          'QuickBooks OAuth',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        toast({
          title: "QuickBooks Authorization",
          description: "Please authorize in the popup window.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to QuickBooks",
        variant: "destructive",
      });
    }
  };

  const handleQBManage = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsQBDialogOpen(true);
  };

  const disconnectQBMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest("DELETE", `/api/quickbooks/${organizationId}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/connections"] });
      setIsQBDialogOpen(false);
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect QuickBooks.",
        variant: "destructive",
      });
    },
  });

  const syncInvoicesMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/qb-sync`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invoices Synced",
        description: `Synced ${data.syncedCount || 0} invoices from QuickBooks.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync QuickBooks invoices.",
        variant: "destructive",
      });
    },
  });

  const mapCustomerMutation = useMutation({
    mutationFn: async ({ organizationId, customerId, customerName }: { organizationId: string; customerId: string; customerName: string }) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/qb-map-customer`, {
        qbCustomerId: customerId,
        qbCustomerName: customerName
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quickbooks/connections"] });
      setIsCustomerSearchOpen(false);
      setCustomerSearchTerm("");
      setQbCustomers([]);
      toast({
        title: "Customer Mapped",
        description: "QuickBooks customer has been mapped successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Mapping Failed",
        description: error.message || "Failed to map QuickBooks customer.",
        variant: "destructive",
      });
    },
  });

  const handleSearchCustomers = async () => {
    if (!selectedOrganization) return;
    
    try {
      const searchParam = customerSearchTerm ? `?search=${encodeURIComponent(customerSearchTerm)}` : '';
      const response = await fetch(`/api/organizations/${selectedOrganization.id}/qb-customers${searchParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to search customers');
      }
      
      const data = await response.json();
      setQbCustomers(data.customers || []);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search QuickBooks customers",
        variant: "destructive",
      });
    }
  };

  const handleOpenCustomerSearch = () => {
    setIsCustomerSearchOpen(true);
    // Auto-load customers on open
    setTimeout(() => handleSearchCustomers(), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 overflow-auto bg-muted/30 min-h-screen">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
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

            {/* Summary Cards */}
            {organizations && organizations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Organizations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold" data-testid="text-total-organizations">
                        {organizations.length}
                      </div>
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Active Organizations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-active-organizations">
                        {organizations.filter(org => org.isActive).length}
                      </div>
                      <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {organizations.filter(org => !org.isActive).length} inactive
                    </p>
                  </CardContent>
                </Card>

                {/* By Type Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      By Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customers:</span>
                        <span className="font-semibold" data-testid="text-customer-count">{organizations.filter(o => o.orgType === "customer").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendors:</span>
                        <span className="font-semibold" data-testid="text-vendor-count">{organizations.filter(o => o.orgType === "vendor").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contractors:</span>
                        <span className="font-semibold" data-testid="text-contractor-count">{organizations.filter(o => o.orgType === "contractor").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Internal:</span>
                        <span className="font-semibold" data-testid="text-internal-count">{organizations.filter(o => o.orgType === "internal").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Government:</span>
                        <span className="font-semibold" data-testid="text-government-count">{organizations.filter(o => o.orgType === "state_govt" || o.orgType === "federal_govt").length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QuickBooks Connections */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      QuickBooks Connected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-qb-connected">
                        {Object.values(qbConnections).filter(conn => conn.status === 'connected').length}
                      </div>
                      <LinkIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      of {organizations.length} organizations
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Organizations Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organizations</CardTitle>
                    <CardDescription>
                      All client organizations in the system
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-org-type-filter">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="state_govt">State Govt</SelectItem>
                        <SelectItem value="federal_govt">Federal Govt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QuickBooks</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations
                        .filter(org => orgTypeFilter === "all" || org.orgType === orgTypeFilter)
                        .map((org) => (
                        <Fragment key={org.id}>
                          <TableRow data-testid={`row-organization-${org.id}`}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}
                                data-testid={`button-expand-${org.id}`}
                              >
                                {expandedOrgId === org.id ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-org-name-${org.id}`}>
                              {org.name}
                            </TableCell>
                          <TableCell data-testid={`text-org-code-${org.id}`}>
                            {org.code}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                org.orgType === "customer" ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700" :
                                org.orgType === "vendor" ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700" :
                                org.orgType === "contractor" ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700" :
                                org.orgType === "internal" ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700" :
                                org.orgType === "state_govt" ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700" :
                                org.orgType === "federal_govt" ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-700" :
                                "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                              }
                              data-testid={`badge-org-type-${org.id}`}
                            >
                              {org.orgType ? org.orgType.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Customer"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-org-email-${org.id}`}>
                            {org.contactEmail || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.isActive ? "default" : "secondary"} data-testid={`badge-org-status-${org.id}`}>
                              {org.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {qbConnections[org.id] ? (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={qbConnections[org.id].status === 'connected' ? 'default' : 'secondary'}
                                  data-testid={`badge-qb-status-${org.id}`}
                                >
                                  {qbConnections[org.id].status === 'connected' ? 'Connected' : qbConnections[org.id].status}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQBManage(org)}
                                  data-testid={`button-qb-manage-${org.id}`}
                                >
                                  Manage
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQBConnect(org.id)}
                                data-testid={`button-qb-connect-${org.id}`}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Connect
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotesClick(org)}
                                data-testid={`button-view-notes-${org.id}`}
                                title="View Notes"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
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
                        
                        {expandedOrgId === org.id && (
                          <TableRow data-testid={`row-expanded-${org.id}`}>
                            <TableCell colSpan={8} className="bg-muted/50 p-6">
                              <div className="space-y-6">
                                {/* Contracts Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <FileSignature className="h-5 w-5 text-primary" />
                                      <h3 className="font-semibold text-lg">Contracts</h3>
                                      <Badge variant="outline">{expandedContracts.length}</Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setPrefilledOrgId(org.id);
                                        setIsCreateContractOpen(true);
                                      }}
                                      data-testid={`button-add-contract-${org.id}`}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Contract
                                    </Button>
                                  </div>
                                  {expandedContracts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground ml-7">No contracts found for this organization.</p>
                                  ) : (
                                    <div className="ml-7 space-y-3">
                                      {expandedContracts.map((contract) => (
                                        <button
                                          key={contract.id}
                                          onClick={() => setDetailContract(contract)}
                                          className="w-full p-4 bg-background rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left"
                                          data-testid={`contract-item-${contract.id}`}
                                        >
                                          <div className="space-y-3">
                                            {/* Header with title and status */}
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1">
                                                <h4 className="font-semibold text-base">{contract.title}</h4>
                                                {contract.description && (
                                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                                    {contract.description}
                                                  </p>
                                                )}
                                              </div>
                                              <Badge variant={contract.isActive ? "default" : "secondary"}>
                                                {contract.isActive ? "Active" : "Inactive"}
                                              </Badge>
                                            </div>
                                            
                                            {/* Contract details grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                              <div>
                                                <span className="text-muted-foreground">Start Date:</span>
                                                <div className="font-medium">
                                                  {new Date(contract.startDate).toLocaleDateString()}
                                                </div>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">End Date:</span>
                                                <div className="font-medium">
                                                  {contract.endDate 
                                                    ? new Date(contract.endDate).toLocaleDateString() 
                                                    : 'Ongoing'}
                                                </div>
                                              </div>
                                              {contract.maxAmount && (
                                                <div className="col-span-2">
                                                  <span className="text-muted-foreground">Max Amount:</span>
                                                  <div className="font-medium text-base">
                                                    ${parseFloat(contract.maxAmount).toLocaleString('en-US', {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Compliance Items Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <ClipboardList className="h-5 w-5 text-primary" />
                                      <h3 className="font-semibold text-lg">Compliance Items</h3>
                                      <Badge variant="outline">{expandedComplianceItems.length}</Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setPrefilledOrgId(org.id);
                                        setIsCreateComplianceOpen(true);
                                      }}
                                      data-testid={`button-add-compliance-${org.id}`}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Compliance Item
                                    </Button>
                                  </div>
                                  {expandedComplianceItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground ml-7">No compliance items found for this organization.</p>
                                  ) : (
                                    <div className="ml-7 space-y-2">
                                      {expandedComplianceItems.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                          data-testid={`compliance-item-${item.id}`}
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium">{item.commitment}</div>
                                            <div className="text-sm text-muted-foreground">
                                              Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
                                            </div>
                                          </div>
                                          <Badge 
                                            variant={
                                              item.status === "complete" ? "default" :
                                              item.status === "overdue" ? "destructive" :
                                              "outline"
                                            }
                                          >
                                            {item.status.toUpperCase()}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Evidence Items Section */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-lg">Evidence</h3>
                                    <Badge variant="outline">{expandedEvidence.length}</Badge>
                                  </div>
                                  {expandedEvidence.length === 0 ? (
                                    <p className="text-sm text-muted-foreground ml-7">No evidence found for this organization.</p>
                                  ) : (
                                    <div className="ml-7 space-y-2">
                                      {expandedEvidence.map((evidence) => (
                                        <button
                                          key={evidence.id}
                                          onClick={() => setDetailEvidence(evidence)}
                                          className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
                                          data-testid={`evidence-item-${evidence.id}`}
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium hover:text-primary transition-colors">{evidence.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {evidence.evidenceType} • {evidence.filePath ? 'Has file' : 'No file'}
                                            </div>
                                          </div>
                                          <Badge variant="secondary">
                                            {evidence.evidenceType}
                                          </Badge>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

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
                <Label htmlFor="orgType">Organization Type *</Label>
                <Select
                  value={formData.orgType}
                  onValueChange={(value) => setFormData({ ...formData, orgType: value as typeof formData.orgType })}
                >
                  <SelectTrigger id="orgType" data-testid="select-org-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="state_govt">State Government</SelectItem>
                    <SelectItem value="federal_govt">Federal Government</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Customer Search Dialog */}
      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Map QuickBooks Customer</DialogTitle>
            <DialogDescription>
              Search and select a QuickBooks customer to map to {selectedOrganization?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2">
              <Input
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomers()}
                data-testid="input-qb-customer-search"
              />
              <Button onClick={handleSearchCustomers} data-testid="button-search-qb-customers">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg">
              {qbCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found. Try searching or click the search button to load all customers.
                </div>
              ) : (
                <div className="divide-y">
                  {qbCustomers.map((customer) => (
                    <div
                      key={customer.Id}
                      className="p-4 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        if (selectedOrganization) {
                          mapCustomerMutation.mutate({
                            organizationId: selectedOrganization.id,
                            customerId: customer.Id,
                            customerName: customer.DisplayName
                          });
                        }
                      }}
                      data-testid={`qb-customer-${customer.Id}`}
                    >
                      <div>
                        <p className="font-medium">{customer.DisplayName}</p>
                        {customer.CompanyName && (
                          <p className="text-sm text-muted-foreground">{customer.CompanyName}</p>
                        )}
                        {customer.PrimaryEmailAddr && (
                          <p className="text-xs text-muted-foreground">{customer.PrimaryEmailAddr.Address}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mapCustomerMutation.isPending}
                        data-testid={`button-select-customer-${customer.Id}`}
                      >
                        {mapCustomerMutation.isPending ? 'Mapping...' : 'Select'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QuickBooks Management Dialog */}
      <Dialog open={isQBDialogOpen} onOpenChange={setIsQBDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QuickBooks Management</DialogTitle>
            <DialogDescription>
              Manage QuickBooks connection and customer mapping for {selectedOrganization?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrganization && qbConnections[selectedOrganization.id] ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Connection Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {qbConnections[selectedOrganization.id].status === 'connected' 
                        ? 'Successfully connected to QuickBooks'
                        : `Status: ${qbConnections[selectedOrganization.id].status}`
                      }
                    </p>
                  </div>
                  <Badge 
                    variant={qbConnections[selectedOrganization.id].status === 'connected' ? 'default' : 'secondary'}
                    data-testid="badge-qb-connection-status"
                  >
                    {qbConnections[selectedOrganization.id].status}
                  </Badge>
                </div>

                {qbConnections[selectedOrganization.id].qbCustomerName && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Mapped QuickBooks Customer</p>
                    <p className="text-sm mt-1">{qbConnections[selectedOrganization.id].qbCustomerName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer ID: {qbConnections[selectedOrganization.id].qbCustomerId}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleOpenCustomerSearch}
                    data-testid="button-qb-search-customer"
                  >
                    {qbConnections[selectedOrganization.id].qbCustomerId ? 'Change Customer' : 'Map Customer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    disabled={!qbConnections[selectedOrganization.id].qbCustomerId || syncInvoicesMutation.isPending}
                    onClick={() => syncInvoicesMutation.mutate(selectedOrganization.id)}
                    data-testid="button-qb-sync-invoices"
                  >
                    {syncInvoicesMutation.isPending ? 'Syncing...' : 'Sync Invoices'}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => disconnectQBMutation.mutate(selectedOrganization.id)}
                    disabled={disconnectQBMutation.isPending}
                    data-testid="button-qb-disconnect"
                  >
                    {disconnectQBMutation.isPending ? 'Disconnecting...' : 'Disconnect QuickBooks'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No QuickBooks connection found for this organization.
              </div>
            )}
          </div>
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
                <Label htmlFor="edit-orgType">Organization Type *</Label>
                <Select
                  value={formData.orgType}
                  onValueChange={(value) => setFormData({ ...formData, orgType: value as typeof formData.orgType })}
                >
                  <SelectTrigger id="edit-orgType" data-testid="select-edit-org-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="state_govt">State Government</SelectItem>
                    <SelectItem value="federal_govt">Federal Government</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organization Notes</DialogTitle>
            <DialogDescription>
              View and manage notes for {selectedOrganization?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedOrganization && (
            <OrganizationNotes organizationId={selectedOrganization.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Evidence Detail Dialog */}
      <EvidenceDetailDialog
        evidence={detailEvidence}
        onClose={() => setDetailEvidence(null)}
        onEdit={() => {
          // TODO: Add edit functionality if needed
          setDetailEvidence(null);
        }}
        onDelete={() => {
          setDetailEvidence(null);
          queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
        }}
        complianceItemTitle={
          detailEvidence?.complianceItemId
            ? expandedComplianceItems.find((c) => c.id === detailEvidence.complianceItemId)?.commitment
            : undefined
        }
        contractTitle={
          detailEvidence?.contractId
            ? expandedContracts.find((c) => c.id === detailEvidence.contractId)?.title
            : undefined
        }
        organizationName={expandedOrgId ? organizations?.find((o) => o.id === expandedOrgId)?.name : undefined}
      />

      {/* Contract Detail Dialog */}
      <ContractDetailDialog
        contract={detailContract}
        onClose={() => setDetailContract(null)}
        organizationName={detailContract ? organizations?.find((o) => o.id === detailContract.customerId)?.name : undefined}
      />

      {/* Create Contract Form */}
      {isCreateContractOpen && (
        <ContractForm
          prefilledCustomerId={prefilledOrgId || undefined}
          onClose={() => {
            setIsCreateContractOpen(false);
            setPrefilledOrgId(null);
          }}
          onSuccess={() => {
            setIsCreateContractOpen(false);
            setPrefilledOrgId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/contracts", { organizationId: expandedOrgId }] });
          }}
        />
      )}

      {/* Create Compliance Item Form */}
      {isCreateComplianceOpen && (
        <ComplianceForm
          prefilledCustomerId={prefilledOrgId || undefined}
          onClose={() => {
            setIsCreateComplianceOpen(false);
            setPrefilledOrgId(null);
          }}
          onSuccess={() => {
            setIsCreateComplianceOpen(false);
            setPrefilledOrgId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/compliance-items"] });
            queryClient.invalidateQueries({ queryKey: ["/api/compliance-items", { organizationId: expandedOrgId }] });
          }}
        />
      )}
    </div>
  );
}
