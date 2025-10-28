import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Organization, ComplianceItem, Contract } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ComplianceComments from "./compliance-comments";

const formSchema = z.object({
  customerId: z.string().min(1, "Organization is required"),
  contractId: z.string().optional(),
  category: z.enum(["Marketing Agreement", "Billing", "Deliverable", "Compliance", "End-of-Term", "Accounts Payable"]),
  type: z.string().min(1, "Type is required"),
  commitment: z.string().min(1, "Commitment is required"),
  description: z.string().optional(),
  responsibleParty: z.string().min(1, "Responsible party is required"),
  dueDate: z.date().optional(),
  status: z.enum(["pending", "complete", "overdue", "na"]).default("pending"),
});

type FormData = z.infer<typeof formSchema>;

interface ComplianceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  item?: ComplianceItem;
  prefilledCustomerId?: string;
  prefilledContractId?: string;
}

// Helper function to get organization type color classes
const getOrgTypeColor = (orgType: string) => {
  switch (orgType) {
    case "customer":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700";
    case "vendor":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700";
    case "contractor":
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700";
    case "internal":
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700";
    case "state_govt":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700";
    case "federal_govt":
      return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-700";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700";
  }
};

const formatOrgType = (orgType: string) => {
  return orgType.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ComplianceForm({ onClose, onSuccess, item, prefilledCustomerId, prefilledContractId }: ComplianceFormProps) {
  const { toast } = useToast();
  const isEditing = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: item?.customerId || prefilledCustomerId || "",
      contractId: item?.contractId || prefilledContractId || undefined,
      category: item?.category || "Compliance",
      type: item?.type || "",
      commitment: item?.commitment || "",
      description: item?.description || "",
      responsibleParty: item?.responsibleParty || "",
      dueDate: item?.dueDate ? new Date(item.dueDate) : undefined,
      status: item?.status || "pending",
    },
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  // Watch the selected organization to filter contracts
  const selectedOrgId = form.watch("customerId");
  const selectedContractId = form.watch("contractId");
  
  // Filter contracts by selected organization for better UX
  // Always include the currently selected contract even if it's from a different org
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    if (!selectedOrgId) return contracts;
    
    // Filter by organization
    const orgContracts = contracts.filter(contract => contract.customerId === selectedOrgId);
    
    // If there's a selected contract that's not in the filtered list, include it
    if (selectedContractId) {
      const isIncluded = orgContracts.some(c => c.id === selectedContractId);
      if (!isIncluded) {
        const selectedContract = contracts.find(c => c.id === selectedContractId);
        if (selectedContract) {
          return [selectedContract, ...orgContracts];
        }
      }
    }
    
    return orgContracts;
  }, [contracts, selectedOrgId, selectedContractId]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate?.toISOString() || null,
        contractId: data.contractId && data.contractId !== "" ? data.contractId : undefined,
      };
      
      try {
        if (isEditing) {
          const response = await apiRequest("PUT", `/api/compliance-items/${item.id}`, payload);
          return response.json();
        } else {
          const response = await apiRequest("POST", "/api/compliance-items", payload);
          return response.json();
        }
      } catch (err: any) {
        console.error("API Request error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: isEditing ? "Item Updated" : "Item Created",
        description: `Compliance item has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Form submission error:", error);
      let errorMessage = `Failed to ${isEditing ? "update" : "create"} compliance item.`;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {isEditing ? "Edit Compliance Item" : "Add New Compliance Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the compliance item details." : "Create a new compliance item to track."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-organization">
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations?.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span>{org.name}</span>
                              <Badge variant="outline" className={cn("text-xs", getOrgTypeColor(org.orgType))}>
                                {formatOrgType(org.orgType)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Marketing Agreement">Marketing Agreement</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Deliverable">Deliverable</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="End-of-Term">End-of-Term</SelectItem>
                        <SelectItem value="Accounts Payable">Accounts Payable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contract">
                        <SelectValue placeholder="Select contract (optional)..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredContracts?.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Regulatory Filing">Regulatory Filing</SelectItem>
                      <SelectItem value="Audit">Audit</SelectItem>
                      <SelectItem value="Certification">Certification</SelectItem>
                      <SelectItem value="License Renewal">License Renewal</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Report Submission">Report Submission</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Assessment">Assessment</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="commitment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commitment Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter commitment title..." 
                      {...field}
                      data-testid="input-commitment"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Enter detailed description..." 
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-due-date"
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
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="responsibleParty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsible Party</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter responsible party..." 
                        {...field}
                        data-testid="input-responsible"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {isEditing && item && (
              <div className="pt-6 border-t">
                <ComplianceComments complianceItemId={item.id} />
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-save"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Item" : "Create Item"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
