import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, Download, File, Calendar, Building2, FileSignature, ClipboardList, X, Edit, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Evidence } from "@shared/schema";

interface EvidenceComment {
  id: string;
  evidenceId: string;
  userId: string;
  comment: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    fullName: string | null;
  };
}

interface EvidenceDetailDialogProps {
  evidence: Evidence | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  organizationName?: string;
  contractTitle?: string;
  complianceItemTitle?: string;
}

export default function EvidenceDetailDialog({
  evidence,
  onClose,
  onEdit,
  onDelete,
  organizationName,
  contractTitle,
  complianceItemTitle
}: EvidenceDetailDialogProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch comments for this evidence
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<EvidenceComment[]>({
    queryKey: ["/api/evidence", evidence?.id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/evidence/${evidence?.id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!evidence,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      return apiRequest("POST", `/api/evidence/${evidence?.id}/comments`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence", evidence?.id, "comments"] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/evidence/${evidence?.id}/comments/${commentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence", evidence?.id, "comments"] });
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete evidence mutation
  const deleteEvidenceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/evidence/${evidence?.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Evidence deleted",
        description: "The evidence has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      onDelete?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete evidence. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
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
          <div className="pt-4 border-t">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Created</label>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>
                {evidence.createdAt 
                  ? format(new Date(evidence.createdAt), 'MMM dd, yyyy HH:mm')
                  : 'Not available'
                }
              </span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Comments</h3>
              <Badge variant="outline">{comments.length}</Badge>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {isLoadingComments ? (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className="p-3 bg-muted/50 rounded-lg space-y-1"
                    data-testid={`comment-${comment.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user.fullName || comment.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        data-testid={`button-delete-comment-${comment.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                data-testid="textarea-new-comment"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                size="sm"
                data-testid="button-add-comment"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-evidence"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Evidence
            </Button>
            {onEdit && (
              <Button onClick={onEdit} data-testid="button-edit-evidence">
                <Edit className="h-4 w-4 mr-2" />
                Edit Evidence
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-evidence-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evidence? This action cannot be undone.
              All associated comments will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-evidence">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEvidenceMutation.mutate()}
              disabled={deleteEvidenceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-evidence"
            >
              {deleteEvidenceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
