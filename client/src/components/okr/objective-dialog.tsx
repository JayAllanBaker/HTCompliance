import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { InsertObjective, User } from "@shared/schema";
import { insertObjectiveSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultTimeframe?: string;
}

const formSchema = insertObjectiveSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
});

type FormData = z.infer<typeof formSchema>;

const TIMEFRAMES = [
  "Q1 FY26",
  "Q2 FY26",
  "Q3 FY26",
  "Q4 FY26",
  "Q1 FY27",
  "Q2 FY27",
  "Q3 FY27",
  "Q4 FY27",
];

export default function ObjectiveDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultTimeframe = "Q1 FY26",
}: ObjectiveDialogProps) {
  const { toast } = useToast();

  // Fetch users for owner dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      timeframe: defaultTimeframe,
      ownerId: null,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/objectives", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective Created",
        description: "Strategic objective has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Objective creation error:", error);
      let errorMessage = "Failed to create objective.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-create-objective">Create New Objective</DialogTitle>
          <DialogDescription>
            Define a strategic objective to track progress against your key results.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Eliminate missed filings and payments across states"
                      {...field}
                      data-testid="input-objective-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what success looks like for this objective..."
                      rows={4}
                      {...field}
                      data-testid="textarea-objective-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context about what you're trying to achieve
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timeframe */}
            <FormField
              control={form.control}
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeframe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-objective-timeframe">
                        <SelectValue placeholder="Select a timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEFRAMES.map((timeframe) => (
                        <SelectItem key={timeframe} value={timeframe}>
                          {timeframe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the quarter and fiscal year for this objective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Owner (Optional) */}
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-objective-owner">
                        <SelectValue placeholder="Select an owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Assign an owner responsible for this objective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                data-testid="button-cancel-objective"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-objective"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Objective
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
