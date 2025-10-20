import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Organization, ComplianceItem} from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import KPICards from "@/components/compliance/kpi-cards";
import ComplianceTable from "@/components/compliance/compliance-table";
import ComplianceForm from "@/components/compliance/compliance-form";
import ComplianceCalendar from "@/components/compliance/compliance-calendar";
import ComplianceTimeline from "@/components/compliance/compliance-timeline";
import { Upload, Download, Mail, Calendar, List, BarChart3, Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ViewMode = "table" | "timeline" | "calendar";

export default function Dashboard() {
  const { toast } = useToast();
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState({
    search: "",
    customerId: "",
    category: "",
    status: "",
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<{
    totalItems: number;
    completedItems: number;
    overdueItems: number;
    upcomingItems: number;
    complianceRate: number;
  }>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: complianceData, isLoading: complianceLoading, refetch } = useQuery<{ items: ComplianceItem[]; total: number }>({
    queryKey: ["/api/compliance-items", { ...filters, limit: 1000 }],
  });

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

  const handleCSVImport = () => {
    // This would open a file picker and handle CSV import
    toast({
      title: "CSV Import",
      description: "CSV import functionality will be implemented",
    });
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/export/database");
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
        description: "Database exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export database",
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
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                  Compliance Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Monitor compliance status and upcoming deadlines
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleCSVImport}
                  data-testid="button-import-csv"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button 
                  onClick={() => setShowNewItemForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-new-compliance-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Compliance Item
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <KPICards metrics={metrics} isLoading={metricsLoading} />

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

            {/* Compliance Items - Table View */}
            {viewMode === "table" && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Upcoming Compliance Items</CardTitle>
                  <CardDescription>Next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComplianceTable 
                    data={complianceData?.items || []}
                    isLoading={complianceLoading}
                    onRefresh={refetch}
                    onEdit={setEditingItem}
                    showCustomerColumn={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Compliance Items - Calendar View */}
            {viewMode === "calendar" && (
              <div className="mb-8">
                <ComplianceCalendar 
                  items={complianceData?.items || []}
                  customers={organizations}
                />
              </div>
            )}

            {/* Compliance Items - Timeline View */}
            {viewMode === "timeline" && (
              <div className="mb-8">
                <ComplianceTimeline 
                  items={complianceData?.items || []}
                  customers={organizations}
                />
              </div>
            )}

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleCSVImport}
                    data-testid="button-quick-import"
                  >
                    <Upload className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Import CSV Data</div>
                      <div className="text-sm text-muted-foreground">Bulk upload compliance items</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleExport}
                    data-testid="button-quick-export"
                  >
                    <Download className="w-4 h-4 mr-3 text-accent" />
                    <div className="text-left">
                      <div className="font-medium">Export Database</div>
                      <div className="text-sm text-muted-foreground">JSON backup export</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleSendAlerts}
                    data-testid="button-quick-alerts"
                  >
                    <Mail className="w-4 h-4 mr-3 text-secondary" />
                    <div className="text-left">
                      <div className="font-medium">Send Alerts</div>
                      <div className="text-sm text-muted-foreground">Email upcoming deadlines</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="recent-activity-list">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">System initialized successfully</p>
                        <p className="text-xs text-muted-foreground">Welcome to BizGov Compliance Hub</p>
                      </div>
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
    </div>
  );
}
