import { useMutation, useQuery } from "@tanstack/react-query";
import type { Customer, Contract, ComplianceItem, BillableEvent } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  contractId: z.string().optional(),
  complianceItemId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  rate: z.string().min(1, "Rate is required"),
  units: z.string().min(1, "Units is required"),
  billingDate: z.date({ required_error: "Billing date is required" }),
  invoiceNumber: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BillableFormProps {
  onClose: () => void;
  onSuccess: () => void;
  event?: BillableEvent;
}

export default function BillableForm({ onClose, onSuccess, event }: BillableFormProps) {
  const { toast } = useToast();
  const isEditing = !!event;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: event?.customerId || "",
      contractId: event?.contractId || "",
      complianceItemId: event?.complianceItemId || "",
      description: event?.description || "",
      rate: event?.rate || "",
      units: event?.units || "",
      billingDate: event?.billingDate ? new Date(event.billingDate) : new Date(),
      invoiceNumber: event?.invoiceNumber || "",
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", { customerId: form.watch("customerId") }],
    enabled: !!form.watch("customerId"),
  });

  const { data: complianceItems } = useQuery<{ items: ComplianceItem[]; total: number }>({
    queryKey: ["/api/compliance-items", { customerId: form.watch("customerId"), limit: 100 }],
    enabled: !!form.watch("customerId"),
  });

  const rate = parseFloat(form.watch("rate") || "0");
  const units = parseFloat(form.watch("units") || "0");
  const totalAmount = rate * units;

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        rate: parseFloat(data.rate),
        units: parseFloat(data.units),
        totalAmount,
        billingDate: data.billingDate.toISOString(),
        contractId: (data.contractId && data.contractId !== "__none__") ? data.contractId : null,
        complianceItemId: (data.complianceItemId && data.complianceItemId !== "__none__") ? data.complianceItemId : null,
      };
      
      if (isEditing) {
        const response = await apiRequest("PUT", `/api/billable-events/${event.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/billable-events", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billable-events"] });
      toast({
        title: isEditing ? "Event Updated" : "Event Created",
        description: `Billable event has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: `Failed to ${isEditing ? "update" : "create"} billable event.`,
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
            {isEditing ? "Edit Billable Event" : "Add New Billable Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the billable event details." : "Create a new billable event for tracking revenue."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer">
                        <SelectValue placeholder="Select customer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contract">
                          <SelectValue placeholder="Select contract..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">No contract</SelectItem>
                        {contracts?.map((contract) => (
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
                name="complianceItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Item (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-compliance-item">
                          <SelectValue placeholder="Select compliance item..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">No compliance item</SelectItem>
                        {complianceItems?.items?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.commitment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Enter event description..." 
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-units"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="text-sm font-medium" data-testid="text-total-amount">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Billing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-billing-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick billing date</span>
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="INV-001" 
                        {...field}
                        data-testid="input-invoice-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                  isEditing ? "Update Event" : "Create Event"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
