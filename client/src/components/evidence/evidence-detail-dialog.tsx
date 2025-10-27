import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Download, File, Calendar, Building2, FileSignature, ClipboardList, X } from "lucide-react";
import { format } from "date-fns";
import type { Evidence } from "@shared/schema";

interface EvidenceDetailDialogProps {
  evidence: Evidence | null;
  onClose: () => void;
  organizationName?: string;
  contractTitle?: string;
  complianceItemTitle?: string;
}

export default function EvidenceDetailDialog({
  evidence,
  onClose,
  organizationName,
  contractTitle,
  complianceItemTitle
}: EvidenceDetailDialogProps) {
  if (!evidence) return null;

  const handleDownload = async () => {
    if (!evidence.filePath) return;
    
    try {
      const response = await fetch(`/api/evidence/${evidence.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = async () => {
    if (!evidence.filePath) return;
    window.open(`/api/evidence/${evidence.id}/download`, '_blank');
  };

  return (
    <Dialog open={!!evidence} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-evidence-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">{evidence.title}</DialogTitle>
                <DialogDescription>
                  Evidence details and metadata
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-evidence-detail">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Evidence Type */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
            <div className="mt-1">
              <Badge variant="secondary" className="text-sm">
                {evidence.evidenceType}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {evidence.description && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
              <p className="mt-1 text-sm text-foreground">{evidence.description}</p>
            </div>
          )}

          {/* File Information */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">File</label>
            <div className="mt-1 flex items-center gap-3">
              {evidence.filePath ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <File className="h-4 w-4 text-primary" />
                    <span className="font-medium">{evidence.filePath.split('/').pop()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleView} data-testid="button-view-file">
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-file">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No file attached</p>
              )}
            </div>
          </div>

          {/* Associations */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Associated With</label>
            
            {contractTitle && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <FileSignature className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Contract</div>
                  <div className="font-medium text-sm">{contractTitle}</div>
                </div>
              </div>
            )}

            {complianceItemTitle && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <ClipboardList className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Compliance Item</div>
                  <div className="font-medium text-sm">{complianceItemTitle}</div>
                </div>
              </div>
            )}

            {organizationName && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Organization</div>
                  <div className="font-medium text-sm">{organizationName}</div>
                </div>
              </div>
            )}

            {!contractTitle && !complianceItemTitle && !organizationName && (
              <p className="text-sm text-muted-foreground">No associations</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Created</label>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(evidence.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</label>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(evidence.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
