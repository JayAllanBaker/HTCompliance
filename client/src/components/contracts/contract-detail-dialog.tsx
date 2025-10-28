import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Calendar, Building2, DollarSign, X, Edit, Save } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contract, Organization } from "@shared/schema";

interface ContractDetailDialogProps {
  contract: Contract | null;
  onClose: () => void;
  onEdit?: () => void;
  organizationName?: string;
}

export default function ContractDetailDialog({
  contract,
  onClose,
  onEdit,
  organizationName
}: ContractDetailDialogProps) {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: "",
    startDate: "",
    endDate: "",
    maxAmount: "",
    isActive: true,
  });

  // Fetch organizations for the dropdown
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isEditMode,
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", `/api/contracts/${contract?.id}`, {
        ...data,
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract updated",
        description: "The contract has been updated successfully.",
      });
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize form when entering edit mode
  const handleEnterEditMode = () => {
    if (!contract) return;
    setFormData({
      title: contract.title,
      description: contract.description || "",
      customerId: contract.customerId,
      startDate: contract.startDate ? format(new Date(contract.startDate), 'yyyy-MM-dd') : "",
      endDate: contract.endDate ? format(new Date(contract.endDate), 'yyyy-MM-dd') : "",
      maxAmount: contract.maxAmount || "",
      isActive: contract.isActive,
    });
    setIsEditMode(true);
  };

  const handleSave = () => {
    updateContractMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  if (!contract) return null;

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <Dialog open={!!contract} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-contract-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">
                  {isEditMode ? "Edit Contract" : contract.title}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Update contract information" : "Contract details and information"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEnterEditMode} 
                  data-testid="button-edit-contract"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-contract-detail">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEditMode ? (
          /* Edit Form */
          <div className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter contract title"
                  data-testid="input-contract-title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger data-testid="select-organization">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter contract description"
                  rows={3}
                  data-testid="textarea-contract-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxAmount">Maximum Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-max-amount"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.isActive.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6 mt-4">
            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <div className="mt-1">
                <Badge variant={contract.isActive ? "default" : "secondary"}>
                  {contract.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {contract.description && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{contract.description}</p>
              </div>
            )}

            {/* Organization */}
            {organizationName && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Organization</label>
                <div className="mt-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{organizationName}</span>
                </div>
              </div>
            )}

            {/* Maximum Amount */}
            {contract.maxAmount && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Maximum Amount</label>
                <div className="mt-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-lg">{formatCurrency(contract.maxAmount)}</span>
                </div>
              </div>
            )}

            {/* Contract Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Start Date</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {contract.startDate ? format(new Date(contract.startDate), 'MMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">End Date</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {contract.endDate ? format(new Date(contract.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Created</label>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(contract.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</label>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(contract.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with action buttons for edit mode */}
        {isEditMode && (
          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateContractMutation.isPending}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateContractMutation.isPending || !formData.title || !formData.customerId || !formData.startDate}
              data-testid="button-save-contract"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateContractMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
