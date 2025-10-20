import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ComplianceItem, Organization } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface ComplianceItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (itemId: string, itemLabel: string) => void;
  selectedId?: string;
}

export default function ComplianceItemSelector({
  open,
  onOpenChange,
  onSelect,
  selectedId
}: ComplianceItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: complianceData } = useQuery<{ items: ComplianceItem[]; total: number }>({
    queryKey: ["/api/compliance-items", { limit: 1000 }],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/customers"],
  });

  const filteredItems = useMemo(() => {
    if (!complianceData?.items) return [];
    
    if (!searchTerm.trim()) return complianceData.items;

    const term = searchTerm.toLowerCase();
    return complianceData.items.filter(item => {
      const org = organizations?.find(o => o.id === item.customerId);
      return (
        item.commitment?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.responsibleParty?.toLowerCase().includes(term) ||
        org?.name?.toLowerCase().includes(term)
      );
    });
  }, [complianceData?.items, searchTerm, organizations]);

  const getOrganizationName = (customerId: string | null) => {
    if (!customerId) return "—";
    const org = organizations?.find(o => o.id === customerId);
    return org?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleSelect = (item: ComplianceItem) => {
    onSelect(item.id, item.commitment);
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleClearSelection = () => {
    onSelect("", "");
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Compliance Item</DialogTitle>
          <DialogDescription>
            Search and select a compliance item to link with this evidence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by commitment, category, organization, or responsible person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-compliance"
            />
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Commitment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No compliance items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedId === item.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleSelect(item)}
                      data-testid={`row-compliance-item-${item.id}`}
                    >
                      <TableCell className="whitespace-nowrap">
                        {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : "—"}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={item.commitment}>
                          {item.commitment}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getOrganizationName(item.customerId)}</TableCell>
                      <TableCell>{item.responsibleParty || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {selectedId === item.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClearSelection}
              data-testid="button-clear-selection"
            >
              Clear Selection
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel-selection"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
