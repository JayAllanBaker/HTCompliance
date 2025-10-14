import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Trash2, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface Comment {
  id: string;
  complianceItemId: string;
  userId: string;
  comment: string;
  createdAt: string;
  userName: string | null;
  username: string;
}

interface ComplianceCommentsProps {
  complianceItemId: string;
}

export default function ComplianceComments({ complianceItemId }: ComplianceCommentsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/compliance-items", complianceItemId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/compliance-items/${complianceItemId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const response = await apiRequest("POST", `/api/compliance-items/${complianceItemId}/comments`, {
        comment,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-items", complianceItemId, "comments"] });
      setNewComment("");
      toast({
        title: "Comment Added",
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

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-items", complianceItemId, "comments"] });
      toast({
        title: "Comment Deleted",
        description: "The comment has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const handleDelete = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
          data-testid="textarea-comment"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || createCommentMutation.isPending}
            size="sm"
            data-testid="button-add-comment"
          >
            {createCommentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Comment"
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground" data-testid="text-no-comments">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-muted/50 rounded-lg p-4 space-y-2"
              data-testid={`comment-${comment.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" data-testid={`comment-author-${comment.id}`}>
                      {comment.userName || comment.username}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id}`}>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap" data-testid={`comment-text-${comment.id}`}>
                    {comment.comment}
                  </p>
                </div>
                {(user?.id === comment.userId || user?.role === "admin") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                    className="ml-2"
                    data-testid={`button-delete-comment-${comment.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
