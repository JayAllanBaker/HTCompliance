import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { InsertCheckIn } from "@shared/schema";
import { insertCheckInSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Circle, Loader2 } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CheckInDialogProps {
  objectiveId: string;
  objectiveTitle: string;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = insertCheckInSchema.extend({
  weekOf: z.date({
    required_error: "Week of date is required",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function CheckInDialog({
  objectiveId,
  objectiveTitle,
  onSuccess,
  open,
  onOpenChange,
}: CheckInDialogProps) {
  const { toast } = useToast();

  const getCurrentMonday = () => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectiveId,
      weekOf: getCurrentMonday(),
      confidence: "green",
      progressNotes: undefined,
      risks: undefined,
      nextWeekPlan: undefined,
      createdBy: "", // Will be set by backend from session
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        weekOf: data.weekOf.toISOString(),
      };

      const response = await apiRequest("POST", "/api/check-ins", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      toast({
        title: "Check-In Created",
        description: "Weekly check-in has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Check-in creation error:", error);
      let errorMessage = "Failed to create check-in.";

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

  const confidenceOptions = [
    {
      value: "green",
      label: "On Track",
      color: "bg-green-500",
      description: "Everything is going according to plan",
    },
    {
      value: "yellow",
      label: "At Risk",
      color: "bg-yellow-500",
      description: "Some challenges, but manageable",
    },
    {
      value: "red",
      label: "Off Track",
      color: "bg-red-500",
      description: "Significant blockers or delays",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-check-in">Add Weekly Check-In</DialogTitle>
          <DialogDescription>
            Create a weekly check-in for: <strong>{objectiveTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Week Of Date Picker */}
            <FormField
              control={form.control}
              name="weekOf"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Week Of</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-week-of-picker"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2020-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confidence Radio Group */}
            <FormField
              control={form.control}
              name="confidence"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Confidence Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-3"
                      data-testid="radio-group-confidence"
                    >
                      {confidenceOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-start space-x-3 space-y-0"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            data-testid={`radio-confidence-${option.value}`}
                          />
                          <Label
                            htmlFor={option.value}
                            className="flex items-center gap-3 cursor-pointer font-normal"
                          >
                            <Circle
                              className={`w-4 h-4 ${option.color} rounded-full fill-current`}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-sm text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress Notes */}
            <FormField
              control={form.control}
              name="progressNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What progress did you make this week?"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-progress-notes"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risks and Blockers */}
            <FormField
              control={form.control}
              name="risks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risks and Blockers</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any risks or blockers to be aware of?"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-risks"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next Week Plan */}
            <FormField
              control={form.control}
              name="nextWeekPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Week Plan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What are you planning for next week?"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-next-week-plan"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                data-testid="button-cancel-check-in"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-check-in"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Check-In
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
