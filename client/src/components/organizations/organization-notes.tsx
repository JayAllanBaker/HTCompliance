import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface Note {
  id: string;
  organizationId: string;
  userId: string;
  note: string;
  createdAt: string;
  userName: string | null;
  username: string;
}

interface OrganizationNotesProps {
  organizationId: string;
}

export default function OrganizationNotes({ organizationId }: OrganizationNotesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/organizations", organizationId, "notes"],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/notes`, {
        note,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Your note has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest("DELETE", `/api/organization-notes/${noteId}`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete note");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: "Note Deleted",
        description: "The note has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    createNoteMutation.mutate(newNote);
  };

  const handleDelete = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Notes</h3>
        <span className="text-sm text-muted-foreground">({notes.length})</span>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Add a note to provide context for this organization..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[80px]"
          data-testid="textarea-organization-note"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!newNote.trim() || createNoteMutation.isPending}
            size="sm"
            data-testid="button-add-organization-note"
          >
            {createNoteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Note"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground" data-testid="text-no-notes">
            No notes yet. Add a note to provide context for this organization.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-muted/50 rounded-lg p-4 space-y-2"
              data-testid={`note-${note.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" data-testid={`note-author-${note.id}`}>
                      {note.userName || note.username}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`note-time-${note.id}`}>
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap" data-testid={`note-text-${note.id}`}>
                    {note.note}
                  </p>
                </div>
                {(user?.id === note.userId || user?.role === "admin") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    disabled={deleteNoteMutation.isPending}
                    className="ml-2"
                    data-testid={`button-delete-note-${note.id}`}
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
