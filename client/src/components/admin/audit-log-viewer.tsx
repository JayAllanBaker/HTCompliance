import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { AuditLog, User } from "@shared/schema";

export default function AuditLogViewer() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch users for filter dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.action) params.append("action", filters.action);
    if (filters.entityType) params.append("entityType", filters.entityType);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    return params.toString();
  };

  // Fetch audit logs
  const { data: auditData, isLoading, refetch, error } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["/api/admin/audit-logs", buildQueryString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/audit-logs?${buildQueryString()}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Audit log fetch error:", error);
      toast({
        title: "Failed to Load Audit Logs",
        description: error instanceof Error ? error.message : "An error occurred while fetching audit logs",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const totalPages = Math.ceil((auditData?.total || 0) / pageSize);

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "LOGIN":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "IMPORT":
      case "EXPORT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "RESET":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "System";
    const user = users?.find((u) => u.id === userId);
    return user?.username || userId.slice(0, 8);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return "Invalid date";
    }
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      entityType: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "IMPORT", "EXPORT", "RESET", "CONNECT", "DISCONNECT", "MAP_CUSTOMER", "SYNC_INVOICES", "TEST"];
  const entityTypes = ["user", "organization", "contract", "compliance_item", "billable_event", "evidence", "comment", "database", "system_settings", "quickbooks_connection", "azure_email"];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              View and filter all system activities and user actions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-audit-logs"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-user">User</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => {
                  setFilters({ ...filters, userId: value });
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-user" data-testid="select-filter-user">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-action">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => {
                  setFilters({ ...filters, action: value });
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-action" data-testid="select-filter-action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-entity-type">Entity Type</Label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => {
                  setFilters({ ...filters, entityType: value });
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-entity-type" data-testid="select-filter-entity-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-start-date">Start Date</Label>
              <Input
                id="filter-start-date"
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPage(1);
                }}
                data-testid="input-filter-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-end-date">End Date</Label>
              <Input
                id="filter-end-date"
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPage(1);
                }}
                data-testid="input-filter-end-date"
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
        ) : !auditData?.logs || auditData.logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getUserName(log.userId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.entityType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entityId.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, auditData.total)} of {auditData.total} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
