import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Evidence, ComplianceItem, BillableEvent } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, Shield, File, Download, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const evidenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  evidenceType: z.enum(["document", "email", "screenshot", "report", "other"]),
  complianceItemId: z.string().optional(),
  billableEventId: z.string().optional(),
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

export default function EvidenceLocker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    search: "",
  });

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      title: "",
      description: "",
      evidenceType: "document",
      complianceItemId: "",
      billableEventId: "",
    },
  });

  const { data: evidence, isLoading, refetch } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
  });

  const { data: complianceItems } = useQuery<{ items: ComplianceItem[]; total: number }>({
    queryKey: ["/api/compliance-items", { limit: 1000 }],
  });

  const { data: billableEvents } = useQuery<BillableEvent[]>({
    queryKey: ["/api/billable-events"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: EvidenceFormData & { file?: File }) => {
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value && key !== 'file') {
          formData.append(key, value.toString());
        }
      });
      
      // Append file if selected
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const response = await apiRequest("POST", "/api/evidence", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      toast({
        title: "Evidence Uploaded",
        description: "Evidence has been uploaded successfully to the locker.",
      });
      setShowUploadForm(false);
      setSelectedFile(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload evidence to the locker.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest("POST", "/api/evidence/import", formData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      toast({
        title: "Import Successful",
        description: `Imported ${data.imported} evidence items${data.errors ? ` with ${data.errors} errors` : ''}.`,
      });
      setShowImportDialog(false);
      setImportFile(null);
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import evidence from ZIP file.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EvidenceFormData) => {
    uploadMutation.mutate({ ...data, file: selectedFile || undefined });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/evidence/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export evidence');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Evidence locker exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export evidence locker.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  const handleDownload = async (evidenceId: string) => {
    try {
      const response = await fetch(`/api/evidence/${evidenceId}/download?download=true`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${evidenceId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the evidence file.",
        variant: "destructive",
      });
    }
  };

  const handleView = (evidenceId: string) => {
    // Open file in new tab for inline viewing (works for PDFs, images, etc.)
    window.open(`/api/evidence/${evidenceId}/download`, '_blank');
  };

  const getEvidenceTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "email":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "screenshot":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "report":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "other":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getComplianceItemTitle = (id: string | null) => {
    if (!id) return "N/A";
    const item = complianceItems?.items?.find((item) => item.id === id);
    return item?.commitment || "Unknown Item";
  };

  const getBillableEventTitle = (id: string | null) => {
    if (!id) return "N/A";
    const event = billableEvents?.find((event) => event.id === id);
    return event?.description || "Unknown Event";
  };

  const filteredEvidence = evidence?.filter((item) => {
    if (filters.type && item.evidenceType !== filters.type) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

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
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-evidence-locker-title">
                  Evidence Locker
                </h2>
                <p className="text-muted-foreground">
                  Secure storage for compliance evidence and audit documentation
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  data-testid="button-import-evidence"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExport}
                  data-testid="button-export-evidence"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => setShowUploadForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-upload-evidence"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Evidence
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-evidence">
                        {evidence?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Evidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <File className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-documents">
                        {evidence?.filter((e: any) => e.evidenceType === 'document').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100">
                      <File className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-emails">
                        {evidence?.filter((e: any) => e.evidenceType === 'email').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Emails</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-orange-100">
                      <File className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-reports">
                        {evidence?.filter((e: any) => e.evidenceType === 'report').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Reports</p>
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
                        placeholder="Search evidence..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                        data-testid="input-search-evidence"
                      />
                    </div>
                  </div>
                  
                  <Select value={filters.type || "__all__"} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "__all__" ? "" : value }))}>
                    <SelectTrigger className="w-48" data-testid="select-type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Types</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="screenshot">Screenshot</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Evidence Files
                </CardTitle>
                <CardDescription>
                  Audit-ready evidence storage - {filteredEvidence.length} files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading evidence...</div>
                  </div>
                ) : filteredEvidence.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Evidence Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your audit trail by uploading evidence
                    </p>
                    <Button 
                      onClick={() => setShowUploadForm(true)}
                      data-testid="button-upload-first-evidence"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Evidence
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Related Item</TableHead>
                          <TableHead>Uploaded By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvidence.map((item: any) => (
                          <TableRow key={item.id} data-testid={`row-evidence-${item.id}`}>
                            <TableCell className="font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                className={getEvidenceTypeColor(item.evidenceType)}
                              >
                                {item.evidenceType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm text-muted-foreground truncate">
                                {item.description || "No description"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.complianceItemId && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Compliance:</span><br />
                                  {getComplianceItemTitle(item.complianceItemId)}
                                </div>
                              )}
                              {item.billableEventId && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Billable:</span><br />
                                  {getBillableEventTitle(item.billableEventId)}
                                </div>
                              )}
                              {!item.complianceItemId && !item.billableEventId && (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {user?.fullName || user?.username || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {item.filePath && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleView(item.id)}
                                      title="View file"
                                      data-testid={`button-view-${item.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDownload(item.id)}
                                      title="Download file"
                                      data-testid={`button-download-${item.id}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {!item.filePath && (
                                  <span className="text-sm text-muted-foreground">No file</span>
                                )}
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
      
      {/* Upload Evidence Dialog */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-upload-title">Upload Evidence</DialogTitle>
            <DialogDescription>
              Add evidence to the secure locker for compliance tracking.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter evidence title..." 
                        {...field}
                        data-testid="input-evidence-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="evidenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-evidence-type">
                          <SelectValue placeholder="Select evidence type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="screenshot">Screenshot</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        placeholder="Enter description..." 
                        {...field}
                        data-testid="textarea-evidence-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="complianceItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Compliance Item (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-compliance-item">
                            <SelectValue placeholder="Select compliance item..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No compliance item</SelectItem>
                          {complianceItems?.items?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.commitment}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="billableEventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Billable Event (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-billable-event">
                            <SelectValue placeholder="Select billable event..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No billable event</SelectItem>
                          {billableEvents?.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">File Upload (Optional)</label>
                <Input 
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  data-testid="input-file-upload"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUploadForm(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-save-evidence"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Evidence"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Evidence Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="dialog-import-title">Import Evidence</DialogTitle>
            <DialogDescription>
              Upload a ZIP file containing evidence files and manifest to restore evidence items with their reference IDs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select ZIP File</label>
              <Input 
                type="file"
                accept=".zip"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                data-testid="input-import-file"
              />
              {importFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                The ZIP file should contain a manifest.json file and a files/ directory with evidence files.
                Evidence items will be restored with their original reference IDs to compliance items and billable events.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
                data-testid="button-cancel-import"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!importFile || importMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-confirm-import"
              >
                {importMutation.isPending ? "Importing..." : "Import Evidence"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
