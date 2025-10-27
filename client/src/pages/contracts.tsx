import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Organization, Contract, Evidence } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, FileText, ChevronDown, ChevronRight, Shield } from "lucide-react";
import ContractForm from "@/components/contracts/contract-form";
import ContractDetailDialog from "@/components/contracts/contract-detail-dialog";
import { format } from "date-fns";

export default function Contracts() {
  const [showNewContractForm, setShowNewContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [detailContract, setDetailContract] = useState<Contract | null>(null);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  const { data: contracts, isLoading, refetch } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Fetch evidence for expanded contract
  const { data: allEvidence = [] } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
    enabled: !!expandedContractId,
  });

  // Filter evidence for the expanded contract
  const expandedEvidence = allEvidence.filter(evidence => evidence.contractId === expandedContractId);

  const getOrganizationName = (customerId: string) => {
    const organization = organizations?.find((org) => org.id === customerId);
    return organization?.name || "Unknown Organization";
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-contracts-title">
                  Contract Management
                </h2>
                <p className="text-muted-foreground">
                  Manage customer contracts and lifecycle tracking
                </p>
              </div>
              
              <Button 
                onClick={() => setShowNewContractForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-new-contract"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </div>

            {/* Contracts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Active Contracts
                </CardTitle>
                <CardDescription>
                  Manage and monitor contract status across all customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading contracts...</div>
                  </div>
                ) : contracts?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Contracts Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first contract
                    </p>
                    <Button 
                      onClick={() => setShowNewContractForm(true)}
                      data-testid="button-create-first-contract"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Contract
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Contract Title</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Max Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts?.map((contract) => (
                          <Fragment key={contract.id}>
                            <TableRow data-testid={`row-contract-${contract.id}`}>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedContractId(expandedContractId === contract.id ? null : contract.id)}
                                  data-testid={`button-expand-${contract.id}`}
                                >
                                  {expandedContractId === contract.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                <button
                                  onClick={() => setDetailContract(contract)}
                                  className="text-left hover:text-primary transition-colors hover:underline cursor-pointer"
                                  data-testid={`button-contract-title-${contract.id}`}
                                >
                                  {contract.title}
                                </button>
                              </TableCell>
                              <TableCell>
                                {getOrganizationName(contract.customerId)}
                              </TableCell>
                              <TableCell>
                                {contract.startDate ? format(new Date(contract.startDate), 'MMM dd, yyyy') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {contract.endDate ? format(new Date(contract.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(contract.maxAmount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={contract.isActive ? "default" : "secondary"}>
                                  {contract.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setDetailContract(contract)}
                                    data-testid={`button-view-${contract.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setEditingContract(contract)}
                                    data-testid={`button-edit-${contract.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {expandedContractId === contract.id && (
                              <TableRow data-testid={`row-expanded-${contract.id}`}>
                                <TableCell colSpan={8} className="bg-muted/50 p-6">
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Shield className="h-5 w-5 text-primary" />
                                      <h3 className="font-semibold text-lg">Evidence</h3>
                                      <Badge variant="outline">{expandedEvidence.length}</Badge>
                                    </div>
                                    {expandedEvidence.length === 0 ? (
                                      <p className="text-sm text-muted-foreground ml-7">No evidence found for this contract.</p>
                                    ) : (
                                      <div className="ml-7 space-y-2">
                                        {expandedEvidence.map((evidence) => (
                                          <Link
                                            key={evidence.id}
                                            href="/evidence-locker"
                                            className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                            data-testid={`evidence-item-${evidence.id}`}
                                          >
                                            <div className="flex-1">
                                              <div className="font-medium">{evidence.title}</div>
                                              <div className="text-sm text-muted-foreground">
                                                {evidence.evidenceType} • {evidence.filePath ? 'Has file' : 'No file'}
                                              </div>
                                            </div>
                                            <Badge variant="secondary">
                                              {evidence.evidenceType}
                                            </Badge>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-contracts">
                        {contracts?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-active-contracts">
                        {contracts?.filter((c: any) => c.isActive).length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Active Contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <FileText className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-contract-value">
                        {formatCurrency(
                          contracts?.reduce((sum: number, c: any) => 
                            sum + (parseFloat(c.maxAmount || '0')), 0
                          ).toString() || '0'
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Contract Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      {showNewContractForm && (
        <ContractForm 
          onClose={() => setShowNewContractForm(false)}
          onSuccess={() => {
            setShowNewContractForm(false);
            refetch();
          }}
        />
      )}
      
      {editingContract && (
        <ContractForm 
          contract={editingContract}
          onClose={() => setEditingContract(null)}
          onSuccess={() => {
            setEditingContract(null);
            refetch();
          }}
        />
      )}
      
      {viewingContract && (
        <ContractForm 
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
          onSuccess={() => {
            setViewingContract(null);
            refetch();
          }}
        />
      )}

      <ContractDetailDialog
        contract={detailContract}
        onClose={() => setDetailContract(null)}
        onEdit={() => {
          setEditingContract(detailContract);
          setDetailContract(null);
        }}
        organizationName={detailContract ? getOrganizationName(detailContract.customerId) : undefined}
      />
    </div>
  );
}
