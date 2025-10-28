import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Database, FileText, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ExportImport() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [unifiedFile, setUnifiedFile] = useState<File | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/export/database");
      return response;
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizgov-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Database exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export database.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/import/database", formData);
      return response.json();
    },
    onSuccess: (result) => {
      const importDetails = [];
      if (result.imported) {
        if (result.imported.organizations > 0) importDetails.push(`${result.imported.organizations} organizations`);
        if (result.imported.contracts > 0) importDetails.push(`${result.imported.contracts} contracts`);
        if (result.imported.complianceItems > 0) importDetails.push(`${result.imported.complianceItems} compliance items`);
        if (result.imported.billableEvents > 0) importDetails.push(`${result.imported.billableEvents} billable events`);
        if (result.imported.evidence > 0) importDetails.push(`${result.imported.evidence} evidence items`);
        if (result.imported.users > 0) importDetails.push(`${result.imported.users} users`);
      }
      
      const description = result.total > 0 
        ? `Successfully imported ${result.total} records: ${importDetails.join(', ')}`
        : "No new records were imported. All records already exist in the database.";
      
      toast({
        title: "Import Complete",
        description,
      });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to import database.";
      
      // Extract error message from Error thrown by apiRequest
      if (error?.message) {
        // Error format is "500: {\"error\":\"message\"}" from throwIfResNotOk
        const match = error.message.match(/\d+:\s*({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If JSON parse fails, use the full error message
            errorMessage = error.message.replace(/^\d+:\s*/, '');
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const unifiedExportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/export/unified");
      return response;
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizgov-complete-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Complete Export Successful",
        description: "Database and evidence files exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export complete system.",
        variant: "destructive",
      });
    },
  });

  const unifiedImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/import/unified", formData);
      return response.json();
    },
    onSuccess: (result) => {
      const importDetails = [];
      if (result.imported) {
        if (result.imported.organizations > 0) importDetails.push(`${result.imported.organizations} organizations`);
        if (result.imported.contracts > 0) importDetails.push(`${result.imported.contracts} contracts`);
        if (result.imported.complianceItems > 0) importDetails.push(`${result.imported.complianceItems} compliance items`);
        if (result.imported.billableEvents > 0) importDetails.push(`${result.imported.billableEvents} billable events`);
        if (result.imported.evidenceRecords > 0) importDetails.push(`${result.imported.evidenceRecords} evidence records`);
        if (result.imported.evidenceFiles > 0) importDetails.push(`${result.imported.evidenceFiles} evidence files`);
        if (result.imported.users > 0) importDetails.push(`${result.imported.users} users`);
      }
      
      const description = importDetails.length > 0
        ? `Successfully restored: ${importDetails.join(', ')}`
        : "Complete system restore successful.";
      
      toast({
        title: "Import Complete",
        description,
      });
      setUnifiedFile(null);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to import system data.";
      if (error?.message) {
        const match = error.message.match(/\d+:\s*({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = error.message.replace(/^\d+:\s*/, '');
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest("POST", "/api/compliance-items/import-csv", formData);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "CSV Import Complete",
        description: result.message,
      });
      setCsvFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "CSV Import Failed",
        description: error.message || "Failed to import CSV file.",
        variant: "destructive",
      });
    },
  });

  const handleDatabaseExport = () => {
    exportMutation.mutate();
  };

  const handleDatabaseImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a JSON file to import.",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(selectedFile);
  };

  const handleCsvImport = () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }
    csvImportMutation.mutate(csvFile);
  };

  const handleUnifiedExport = () => {
    unifiedExportMutation.mutate();
  };

  const handleUnifiedImport = () => {
    if (!unifiedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a complete backup ZIP file to restore.",
        variant: "destructive",
      });
      return;
    }
    unifiedImportMutation.mutate(unifiedFile);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 overflow-auto bg-muted/30 min-h-screen">
          <div className="p-6 max-w-4xl">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-export-import-title">
                Export & Import
              </h2>
              <p className="text-muted-foreground">
                Backup and restore your compliance data, or import bulk compliance items
              </p>
            </div>

            {/* Unified Complete System Export/Import */}
            <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Recommended:</strong> Use Complete System Backup to export/import both database data AND evidence files together. This ensures all evidence files remain properly linked to their database records after restoration.
              </AlertDescription>
            </Alert>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Complete System Backup & Restore
                </CardTitle>
                <CardDescription>
                  Export and restore your entire system including database data and all evidence files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unified Export Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Export Complete System</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a complete backup including all database records AND evidence files as a ZIP archive. 
                    This is the recommended backup method to ensure evidence files stay connected to their records.
                  </p>
                  <Button 
                    onClick={handleUnifiedExport}
                    disabled={unifiedExportMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-export-unified"
                  >
                    {unifiedExportMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Complete System
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Unified Import Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Restore Complete System</h3>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> This will restore database records and evidence files. 
                      Make sure to export your current data first as a backup before restoring.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="unified-file">Select complete backup ZIP file</Label>
                      <Input 
                        id="unified-file"
                        type="file"
                        accept=".zip"
                        onChange={(e) => setUnifiedFile(e.target.files?.[0] || null)}
                        className="mt-1"
                        data-testid="input-unified-file"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleUnifiedImport}
                      disabled={unifiedImportMutation.isPending || !unifiedFile}
                      variant="outline"
                      data-testid="button-import-unified"
                    >
                      {unifiedImportMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Restore Complete System
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Export/Import */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Backup & Restore
                </CardTitle>
                <CardDescription>
                  Export your entire database for backup or import a previous backup to restore data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Export Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Export Database</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a complete backup of your compliance data as a JSON file. This includes all contracts, 
                    compliance items, billable events, evidence, and audit logs.
                  </p>
                  <Button 
                    onClick={handleDatabaseExport}
                    disabled={exportMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-export-database"
                  >
                    {exportMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Database
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Import Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Import Database</h3>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Importing a database will add new records to your existing data. 
                      Make sure to export your current data first as a backup.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="database-file">Select JSON backup file</Label>
                      <Input 
                        id="database-file"
                        type="file"
                        accept=".json"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="mt-1"
                        data-testid="input-database-file"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleDatabaseImport}
                      disabled={importMutation.isPending || !selectedFile}
                      variant="outline"
                      data-testid="button-import-database"
                    >
                      {importMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CSV Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  CSV Compliance Import
                </CardTitle>
                <CardDescription>
                  Import compliance items in bulk from a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Import Compliance Items</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file containing compliance items. The CSV should include columns for: 
                    Category, Type, Commitment, Description, Responsible Party, Status, Due Date, and optionally Customer.
                  </p>
                  
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>CSV Format:</strong> Make sure your CSV has the following headers: Category, Type, Commitment, 
                      Description, Responsible Party, Status, Due Date. If Customer is not specified, items will be assigned to CCAH by default.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="csv-file">Select CSV file</Label>
                    <Input 
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="mt-1"
                      data-testid="input-csv-file"
                    />
                    {csvFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleCsvImport}
                    disabled={csvImportMutation.isPending || !csvFile}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-import-csv"
                  >
                    {csvImportMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importing CSV...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </>
                    )}
                  </Button>
                </div>

                {/* CSV Example */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Example CSV Format:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const csvContent = `Category,Type,Commitment,Description,Responsible Party,Status,Due Date,Customer
Billing,Monthly Invoice,Submit monthly invoice,Invoice for services rendered,Jay Baker,pending,2025-01-15,CCAH
Compliance,Quarterly Report,Submit quarterly compliance report,Q1 compliance documentation,Laura Gleason,pending,2025-03-31,CCAH
Legal,Contract Review,Annual contract review,Review and update all vendor contracts,Legal Team,in_progress,2025-02-28,Health Partners
Data Security,HIPAA Audit,Complete HIPAA compliance audit,Annual security and privacy audit,IT Security,pending,2025-06-30,CCAH
Financial,Tax Filing,File quarterly taxes,Q1 tax documents submission,Finance Dept,completed,2024-12-31,All Customers`;
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sample-compliance-import.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        toast({
                          title: "Sample Downloaded",
                          description: "Sample CSV file downloaded successfully.",
                        });
                      }}
                      data-testid="button-download-sample-csv"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
                    <div>Category,Type,Commitment,Description,Responsible Party,Status,Due Date,Customer</div>
                    <div>Billing,Monthly Invoice,Submit monthly invoice,Invoice for services,Jay Baker,pending,2025-01-15,CCAH</div>
                    <div>Compliance,Quarterly Report,Submit quarterly report,Compliance review,Laura Gleason,pending,2025-03-31,CCAH</div>
                    <div>Legal,Contract Review,Annual contract review,Review vendor contracts,Legal Team,in_progress,2025-02-28,Health Partners</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management Tips */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Data Management Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Download className="w-4 h-4 mr-2 text-primary" />
                      Regular Backups
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Export your database weekly to ensure you have recent backups of all compliance data.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-secondary" />
                      CSV Validation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Validate your CSV files before import to ensure proper formatting and data integrity.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-accent" />
                      Version Control
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Keep multiple versions of your exports with timestamps for easy rollback if needed.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                      Test Imports
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Test CSV imports with small datasets first to validate format and prevent data issues.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  );
}
