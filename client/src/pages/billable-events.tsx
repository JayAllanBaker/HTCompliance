import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Customer, BillableEvent } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, DollarSign, Search } from "lucide-react";
import BillableForm from "@/components/billable/billable-form";
import { format } from "date-fns";

export default function BillableEvents() {
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    search: "",
  });

  const { data: billableEvents, isLoading, refetch } = useQuery<BillableEvent[]>({
    queryKey: ["/api/billable-events", { customerId: filters.customerId }],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const filteredEvents = billableEvents?.filter((event) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        event.description?.toLowerCase().includes(searchLower) ||
        event.invoiceNumber?.toLowerCase().includes(searchLower) ||
        getCustomerName(event.customerId).toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const totalAmount = filteredEvents.reduce((sum: number, event) => {
    return sum + parseFloat(event.totalAmount || "0");
  }, 0);

  const paidAmount = filteredEvents
    .filter((event) => event.isPaid)
    .reduce((sum: number, event) => {
      return sum + parseFloat(event.totalAmount || "0");
    }, 0);

  const unpaidAmount = totalAmount - paidAmount;

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
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-billable-events-title">
                  Billable Events
                </h2>
                <p className="text-muted-foreground">
                  Track billable events and revenue across all customers
                </p>
              </div>
              
              <Button 
                onClick={() => setShowNewEventForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-new-billable-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Billable Event
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-revenue">
                        {formatCurrency(totalAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-paid-amount">
                        {formatCurrency(paidAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-unpaid-amount">
                        {formatCurrency(unpaidAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">Unpaid Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search billable events..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                        data-testid="input-search-events"
                      />
                    </div>
                  </div>
                  
                  <Select value={filters.customerId || "__all__"} onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value === "__all__" ? "" : value }))}>
                    <SelectTrigger className="w-48" data-testid="select-customer-filter">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Customers</SelectItem>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Billable Events Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Billable Events
                </CardTitle>
                <CardDescription>
                  Revenue tracking and invoice management - {filteredEvents.length} events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading billable events...</div>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Billable Events Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking revenue by creating your first billable event
                    </p>
                    <Button 
                      onClick={() => setShowNewEventForm(true)}
                      data-testid="button-create-first-event"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Billable Event
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.map((event: any) => (
                          <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(event.billingDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm font-medium text-foreground">
                                {event.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getCustomerName(event.customerId)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(event.rate)}
                            </TableCell>
                            <TableCell>
                              {parseFloat(event.units).toFixed(2)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(event.totalAmount)}
                            </TableCell>
                            <TableCell>
                              {event.invoiceNumber || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={event.isPaid ? "default" : "secondary"}>
                                {event.isPaid ? "Paid" : "Unpaid"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-view-${event.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-edit-${event.id}`}
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
          </div>
        </main>
      </div>
      
      {showNewEventForm && (
        <BillableForm 
          onClose={() => setShowNewEventForm(false)}
          onSuccess={() => {
            setShowNewEventForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
