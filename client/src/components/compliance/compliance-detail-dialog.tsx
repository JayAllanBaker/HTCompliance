import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, Building2, User, X, Edit } from "lucide-react";
import { format } from "date-fns";
import type { ComplianceItem } from "@shared/schema";

interface ComplianceDetailDialogProps {
  item: ComplianceItem | null;
  onClose: () => void;
  onEdit?: () => void;
  organizationName?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "pending":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "overdue":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    case "na":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Compliance":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
    case "Marketing Agreement":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "Billing":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "Deliverable":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    case "End-of-Term":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    case "Accounts Payable":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  }
};

export default function ComplianceDetailDialog({
  item,
  onClose,
  onEdit,
  organizationName
}: ComplianceDetailDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-compliance-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">{item.commitment}</DialogTitle>
                <DialogDescription>
                  Compliance item details
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-compliance">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-compliance-detail">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status and Category */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <div className="mt-1">
                <Badge variant="secondary" className={getStatusColor(item.status)}>
                  {item.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
              <div className="mt-1">
                <Badge variant="secondary" className={getCategoryColor(item.category)}>
                  {item.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Type */}
          {item.type && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
              <p className="mt-1 text-sm text-foreground">{item.type}</p>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{item.description}</p>
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

          {/* Responsible Party */}
          {item.responsibleParty && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Responsible Party</label>
              <div className="mt-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{item.responsibleParty}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Due Date</label>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : 'No due date'}
                </span>
              </div>
            </div>
            {item.completedAt && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Completed</label>
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(item.completedAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Created</label>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</label>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(item.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
