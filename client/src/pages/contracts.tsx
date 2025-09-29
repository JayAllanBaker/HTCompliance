import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Customer, Contract } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, FileText } from "lucide-react";
import ContractForm from "@/components/contracts/contract-form";
import { format } from "date-fns";

export default function Contracts() {
  const [showNewContractForm, setShowNewContractForm] = useState(false);

  const { data: contracts, isLoading, refetch } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer?.name || "Unknown Customer";
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
                          <TableHead>Contract Title</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Max Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts?.map((contract) => (
                          <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                            <TableCell className="font-medium">
                              {contract.title}
                            </TableCell>
                            <TableCell>
                              {getCustomerName(contract.customerId)}
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
                                  data-testid={`button-view-${contract.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-edit-${contract.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
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
    </div>
  );
}
