import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ComplianceItem, Organization } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ComplianceCalendarProps {
  items: ComplianceItem[];
  customers?: Organization[];
  onRefresh?: () => void;
}

export default function ComplianceCalendar({ items, customers, onRefresh }: ComplianceCalendarProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // DEBUG: Log when items prop changes
  console.log("[CALENDAR DEBUG] Items received:", {
    itemCount: items.length,
    sampleItem: items[0],
    timestamp: new Date().toISOString()
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      console.log("[CALENDAR DEBUG] Updating status:", { itemId, status });
      const updates: any = { status };
      if (status === "complete") {
        updates.completedAt = new Date().toISOString();
      }
      const response = await apiRequest("PUT", `/api/compliance-items/${itemId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      console.log("[CALENDAR DEBUG] Status update success, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      console.log("[CALENDAR DEBUG] Calling onRefresh");
      onRefresh?.();
      toast({
        title: "Status Updated",
        description: "Compliance item status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update compliance item status.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.itemId);
        return newSet;
      });
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getItemsForDate = (date: Date) => {
    return items.filter(item => {
      if (!item.dueDate) return false;
      const dueDate = typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate;
      return isSameDay(dueDate, date);
    });
  };

  const getItemsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getItemsForDate(selectedDate);
  };

  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
      case "overdue":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold" data-testid="text-calendar-month">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {items.length} total compliance items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            data-testid="button-calendar-today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            data-testid="button-calendar-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            data-testid="button-calendar-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayItems = getItemsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b last:border-r-0 ${
                  !isCurrentMonth ? "bg-muted/30" : ""
                } ${isToday ? "bg-primary/5" : ""}`}
                data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      !isCurrentMonth ? "text-muted-foreground" : ""
                    } ${isToday ? "text-primary font-bold" : ""}`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayItems.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-xs"
                    >
                      {dayItems.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDate(day)}
                      className={`w-full text-left p-1.5 rounded text-xs border ${getStatusColor(
                        item.status
                      )} hover:opacity-80 transition-opacity`}
                      data-testid={`calendar-item-${item.id}`}
                    >
                      <div className="font-medium truncate">
                        {item.commitment}
                      </div>
                      <div className="text-[10px] opacity-70 truncate">
                        {getCustomerName(item.customerId)}
                      </div>
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <button
                      onClick={() => setSelectedDate(day)}
                      className="w-full text-left p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      +{dayItems.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected Date Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              {getItemsForSelectedDate().length} compliance item(s) due on this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {getItemsForSelectedDate().map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{item.commitment}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getCustomerName(item.customerId)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{item.type || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Responsible:</span>
                    <span className="ml-2 font-medium">{item.responsibleParty}</span>
                  </div>
                  {item.completedAt && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2 font-medium">
                        {format(typeof item.completedAt === 'string' ? parseISO(item.completedAt) : item.completedAt, "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
                
                {item.description && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                )}

                {/* Status Change Controls */}
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Change Status:
                    </label>
                    <Select
                      value={item.status}
                      onValueChange={(value) => {
                        setUpdatingItems(prev => new Set(prev).add(item.id));
                        updateStatusMutation.mutate({ itemId: item.id, status: value });
                      }}
                      disabled={updatingItems.has(item.id)}
                    >
                      <SelectTrigger 
                        className="w-full"
                        data-testid={`select-status-${item.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {item.status !== "complete" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-6"
                      onClick={() => {
                        setUpdatingItems(prev => new Set(prev).add(item.id));
                        updateStatusMutation.mutate({ itemId: item.id, status: "complete" });
                      }}
                      disabled={updatingItems.has(item.id)}
                      data-testid={`button-mark-complete-${item.id}`}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
