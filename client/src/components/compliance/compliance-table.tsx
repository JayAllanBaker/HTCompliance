import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Organization, ComplianceItem } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, RefreshCw, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ComplianceTableProps {
  data: ComplianceItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onEdit?: (item: ComplianceItem) => void;
  showCustomerColumn?: boolean;
}

type ColumnKey = 'dueDate' | 'commitment' | 'category' | 'organization' | 'responsible' | 'status';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'dueDate', label: 'Due Date', defaultVisible: true, alwaysVisible: true },
  { key: 'commitment', label: 'Commitment', defaultVisible: true, alwaysVisible: true },
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'organization', label: 'Organization', defaultVisible: true },
  { key: 'responsible', label: 'Responsible', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
];

const STORAGE_KEY = 'compliance-table-columns';

export default function ComplianceTable({ 
  data, 
  isLoading, 
  onRefresh,
  onEdit,
  showCustomerColumn = false 
}: ComplianceTableProps) {
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to defaults if parsing fails
      }
    }
    // Initialize with defaults
    return COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
  });

  // Save to localStorage whenever column visibility changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const updates: any = { status };
      if (status === "complete") {
        updates.completedAt = new Date().toISOString();
      }
      const response = await apiRequest("PUT", `/api/compliance-items/${itemId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      onRefresh?.();
      toast({
        title: "Status Updated",
        description: "Compliance item status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update compliance item status.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.itemId);
        return newSet;
      });
    },
  });

  const getOrganizationName = (customerId: string) => {
    const organization = organizations?.find((org) => org.id === customerId);
    return organization?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "na":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Marketing Agreement":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400";
      case "Billing":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Deliverable":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Compliance":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "End-of-Term":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getUrgencyIndicator = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "complete") return "bg-gray-400";
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "bg-red-500"; // Overdue
    if (diffDays <= 7) return "bg-yellow-500"; // Due soon
    return "bg-green-500"; // Future
  };

  const handleMarkComplete = (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    updateStatusMutation.mutate({ itemId, status: "complete" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">No compliance items found</div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} data-testid="button-refresh-empty">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-column-settings">
              <Settings2 className="w-4 h-4 mr-2" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-3">
              <div className="font-semibold text-sm">Toggle Columns</div>
              {COLUMNS.map((column) => {
                const isOrgColumn = column.key === 'organization';
                const shouldShow = !isOrgColumn || showCustomerColumn;
                
                if (!shouldShow) return null;
                
                return (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.key}`}
                      checked={visibleColumns[column.key]}
                      onCheckedChange={() => toggleColumn(column.key)}
                      disabled={column.alwaysVisible}
                      data-testid={`checkbox-column-${column.key}`}
                    />
                    <Label
                      htmlFor={`column-${column.key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                      {column.alwaysVisible && " (required)"}
                    </Label>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.dueDate && <TableHead>Due Date</TableHead>}
            {visibleColumns.commitment && <TableHead>Commitment</TableHead>}
            {visibleColumns.category && <TableHead>Category</TableHead>}
            {showCustomerColumn && visibleColumns.organization && <TableHead>Organization</TableHead>}
            {visibleColumns.responsible && <TableHead>Responsible</TableHead>}
            {visibleColumns.status && <TableHead>Status</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => (
            <TableRow 
              key={item.id} 
              className="table-hover"
              data-testid={`row-compliance-${item.id}`}
            >
              {visibleColumns.dueDate && (
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className={`w-2 h-2 rounded-full mr-3 ${getUrgencyIndicator(item.dueDate, item.status)}`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(item.dueDate)}
                    </span>
                  </div>
                </TableCell>
              )}
              {visibleColumns.commitment && (
                <TableCell>
                  <div className="text-sm text-foreground font-medium">
                    {item.commitment}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </TableCell>
              )}
              {visibleColumns.category && (
                <TableCell className="whitespace-nowrap">
                  <Badge 
                    variant="secondary"
                    className={getCategoryColor(item.category)}
                  >
                    {item.category}
                  </Badge>
                </TableCell>
              )}
              {showCustomerColumn && visibleColumns.organization && (
                <TableCell className="whitespace-nowrap text-sm text-foreground">
                  {getOrganizationName(item.customerId)}
                </TableCell>
              )}
              {visibleColumns.responsible && (
                <TableCell className="whitespace-nowrap text-sm text-foreground">
                  {item.responsibleParty}
                </TableCell>
              )}
              {visibleColumns.status && (
                <TableCell className="whitespace-nowrap">
                  <Badge 
                    variant="secondary"
                    className={getStatusColor(item.status)}
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEdit?.(item)}
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                  {item.status !== "complete" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleMarkComplete(item.id)}
                      disabled={updatingItems.has(item.id)}
                      data-testid={`button-complete-${item.id}`}
                    >
                      <Check className={`h-4 w-4 ${updatingItems.has(item.id) ? 'animate-spin' : 'text-secondary'}`} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {data.length} results
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-table">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
