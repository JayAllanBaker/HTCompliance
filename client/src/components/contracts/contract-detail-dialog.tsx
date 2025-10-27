import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Calendar, Building2, DollarSign, X, Edit, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Contract } from "@shared/schema";

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
      <DialogContent className="max-w-2xl" data-testid="dialog-contract-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">{contract.title}</DialogTitle>
                <DialogDescription>
                  Contract details and information
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-contract">
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

          {/* File Path */}
          {contract.filePath && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contract Document</label>
              <div className="mt-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">{contract.filePath.split('/').pop()}</span>
              </div>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
