import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Customer, ComplianceItem } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceTableProps {
  data: ComplianceItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  showCustomerColumn?: boolean;
}

export default function ComplianceTable({ 
  data, 
  isLoading, 
  onRefresh,
  showCustomerColumn = false 
}: ComplianceTableProps) {
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
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

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer?.name || "Unknown";
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
        return "bg-accent/10 text-accent dark:bg-accent/20";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Commitment</TableHead>
            <TableHead>Category</TableHead>
            {showCustomerColumn && <TableHead>Customer</TableHead>}
            <TableHead>Responsible</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell className="whitespace-nowrap">
                <Badge 
                  variant="secondary"
                  className={getCategoryColor(item.category)}
                >
                  {item.category}
                </Badge>
              </TableCell>
              {showCustomerColumn && (
                <TableCell className="whitespace-nowrap text-sm text-foreground">
                  {getCustomerName(item.customerId)}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap text-sm text-foreground">
                {item.responsibleParty}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge 
                  variant="secondary"
                  className={getStatusColor(item.status)}
                >
                  {item.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
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
