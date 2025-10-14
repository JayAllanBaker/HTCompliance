import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Organization, ComplianceItem } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ComplianceTable from "@/components/compliance/compliance-table";
import ComplianceForm from "@/components/compliance/compliance-form";
import ComplianceCalendar from "@/components/compliance/compliance-calendar";
import ComplianceTimeline from "@/components/compliance/compliance-timeline";
import { Plus, Upload, Download, Mail, Search, Filter, Calendar, List, BarChart3, Info, FileWarning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ViewMode = "table" | "timeline" | "calendar";
type DuplicateHandling = "skip" | "update";

export default function Compliance() {
  const { toast } = useToast();
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    customerId: "",
    category: "",
    status: "",
    limit: 50,
    offset: 0,
  });

  const { data: complianceData, isLoading, refetch } = useQuery<{ items: ComplianceItem[]; total: number }>({
    queryKey: ["/api/compliance-items", filters],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiRequest('GET', '/api/csv/template');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download template' }));
        throw new Error(errorData.error || 'Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compliance-import-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Template Downloaded",
        description: "CSV template downloaded successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download CSV template';
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCSVImport = () => {
    setSelectedFile(null);
    setDuplicateHandling("skip");
    setShowImportDialog(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePerformImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('duplicateHandling', duplicateHandling);

    try {
      const response = await apiRequest('POST', '/api/compliance-items/import-csv', formData);
      const result = await response.json();
      
      // Build detailed message
      let description = result.message;
      if (result.skippedItems && result.skippedItems.length > 0) {
        const skippedList = result.skippedItems.slice(0, 3).map((item: any) => 
          `Row ${item.row}: ${item.commitment}`
        ).join('\n');
        description += `\n\nSkipped items:\n${skippedList}`;
        if (result.skippedItems.length > 3) {
          description += `\n...and ${result.skippedItems.length - 3} more`;
        }
      }
      
      toast({
        title: "Import Complete",
        description,
      });
      
      setShowImportDialog(false);
      setSelectedFile(null);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import CSV file";
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSendAlerts = async () => {
    try {
      const response = await apiRequest("POST", "/api/email-alerts/send");
      const result = await response.json();
      toast({
        title: "Alerts Sent",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email alerts",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/export/database");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Compliance data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export compliance data",
        variant: "destructive",
      });
    }
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
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-compliance-title">
                  Compliance Management
                </h2>
                <p className="text-muted-foreground">
                  Track and manage compliance items across all customers
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  data-testid="button-download-csv-template"
                  title="Download CSV import template with format specification"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCSVImport}
                  data-testid="button-import-csv"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSendAlerts}
                  data-testid="button-send-alerts"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Alerts
                </Button>
                <Button 
                  onClick={() => setShowNewItemForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-new-compliance-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Item
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search compliance items..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                        data-testid="input-search-compliance"
                      />
                    </div>
                  </div>
                  
                  <Select value={filters.customerId || "__all__"} onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value === "__all__" ? "" : value }))}>
                    <SelectTrigger className="w-48" data-testid="select-organization-filter">
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Organizations</SelectItem>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.category || "__all__"} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "__all__" ? "" : value }))}>
                    <SelectTrigger className="w-48" data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Categories</SelectItem>
                      <SelectItem value="Marketing Agreement">Marketing Agreement</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Deliverable">Deliverable</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="End-of-Term">End-of-Term</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.status || "__all__"} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "__all__" ? "" : value }))}>
                    <SelectTrigger className="w-48" data-testid="select-status-filter">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={viewMode === "table" ? "default" : "outline"} 
                      size="sm" 
                      title="Table View" 
                      onClick={() => setViewMode("table")}
                      data-testid="button-table-view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "timeline" ? "default" : "outline"} 
                      size="sm" 
                      title="Timeline View" 
                      onClick={() => setViewMode("timeline")}
                      data-testid="button-timeline-view"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "calendar" ? "default" : "outline"} 
                      size="sm" 
                      title="Calendar View" 
                      onClick={() => setViewMode("calendar")}
                      data-testid="button-calendar-view"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Items - Different Views */}
            {viewMode === "table" && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Compliance Items</CardTitle>
                      <CardDescription>
                        All compliance items across customers - {complianceData?.total || 0} total items
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ComplianceTable 
                    data={complianceData?.items || []}
                    isLoading={isLoading}
                    onRefresh={refetch}
                    onEdit={setEditingItem}
                    showCustomerColumn={true}
                  />
                </CardContent>
              </Card>
            )}

            {viewMode === "calendar" && (
              <div className="mb-6">
                <ComplianceCalendar 
                  items={complianceData?.items || []}
                  customers={organizations}
                />
              </div>
            )}

            {viewMode === "timeline" && (
              <div className="mb-6">
                <ComplianceTimeline 
                  items={complianceData?.items || []}
                  customers={organizations}
                />
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <List className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-items">
                        {complianceData?.total || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100">
                      <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-items">
                        {complianceData?.items?.filter((item: any) => item.status === 'pending').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-complete-items">
                        {complianceData?.items?.filter((item: any) => item.status === 'complete').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-100">
                      <Filter className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-overdue-items">
                        {complianceData?.items?.filter((item: any) => item.status === 'overdue').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      {showNewItemForm && (
        <ComplianceForm 
          onClose={() => setShowNewItemForm(false)}
          onSuccess={() => {
            setShowNewItemForm(false);
            refetch();
          }}
        />
      )}

      {editingItem && (
        <ComplianceForm 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            refetch();
          }}
        />
      )}

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-csv-import">
          <DialogHeader>
            <DialogTitle>Import Compliance Items</DialogTitle>
            <DialogDescription>
              Select a CSV file and choose how to handle duplicates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file" className="text-base font-semibold">
                CSV File
              </Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                data-testid="input-csv-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Duplicate Handling</Label>
              <p className="text-sm text-muted-foreground">
                Duplicates are matched by: Category + Commitment + Customer + Due Date
              </p>
              
              <RadioGroup 
                value={duplicateHandling} 
                onValueChange={(value) => setDuplicateHandling(value as DuplicateHandling)}
                data-testid="radio-duplicate-handling"
              >
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="skip" id="skip" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="skip" className="font-medium cursor-pointer">
                      Skip Duplicates (Recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Leave existing items unchanged and skip duplicate rows from the CSV
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="update" id="update" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="update" className="font-medium cursor-pointer">
                      Update Duplicates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Overwrite existing items with data from the CSV file
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {duplicateHandling === "update" && (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Updating duplicates will overwrite existing compliance data
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePerformImport}
              disabled={!selectedFile || isImporting}
              data-testid="button-confirm-import"
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
