import { useState, useMemo } from "react";
import { ComplianceItem, Customer } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  addMonths,
  subMonths,
  differenceInDays,
  isWithinInterval,
  parseISO,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComplianceTimelineProps {
  items: ComplianceItem[];
  customers?: Customer[];
}

type GroupBy = "customer" | "category" | "status";

export default function ComplianceTimeline({ items, customers }: ComplianceTimelineProps) {
  const [timelineStart, setTimelineStart] = useState(subMonths(new Date(), 2));
  const [timelineEnd, setTimelineEnd] = useState(addMonths(new Date(), 4));
  const [groupBy, setGroupBy] = useState<GroupBy>("customer");
  const [zoom, setZoom] = useState(1);

  const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  const totalDays = differenceInDays(timelineEnd, timelineStart);

  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500 hover:bg-green-600";
      case "overdue":
        return "bg-red-500 hover:bg-red-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Group items based on selected grouping
  const groupedItems = useMemo(() => {
    const groups: Record<string, ComplianceItem[]> = {};

    items.forEach((item) => {
      let key: string;
      switch (groupBy) {
        case "customer":
          key = getCustomerName(item.customerId);
          break;
        case "category":
          key = item.category;
          break;
        case "status":
          key = item.status;
          break;
        default:
          key = "All Items";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items, groupBy, customers]);

  // Calculate bar position and width for timeline
  const getBarStyle = (item: ComplianceItem) => {
    if (!item.dueDate) return null;

    const dueDate = typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate;
    
    // Use createdAt or 30 days before due date as start
    const startDate = item.createdAt 
      ? (typeof item.createdAt === 'string' ? parseISO(item.createdAt) : item.createdAt)
      : subMonths(dueDate, 1);

    // Check if item's date range overlaps with visible timeline
    // Item is visible if: startDate <= timelineEnd AND dueDate >= timelineStart
    if (startDate > timelineEnd || dueDate < timelineStart) {
      return null;
    }

    // Calculate position as percentage, clamping to visible window
    const startOffset = Math.max(0, Math.min(totalDays, differenceInDays(startDate, timelineStart)));
    const endOffset = Math.max(0, Math.min(totalDays, differenceInDays(dueDate, timelineStart)));
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max(1, ((endOffset - startOffset) / totalDays) * 100);

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const handlePreviousPeriod = () => {
    setTimelineStart(prev => subMonths(prev, 2));
    setTimelineEnd(prev => subMonths(prev, 2));
  };

  const handleNextPeriod = () => {
    setTimelineStart(prev => addMonths(prev, 2));
    setTimelineEnd(prev => addMonths(prev, 2));
  };

  const handleZoomIn = () => {
    if (zoom < 2) {
      const totalDays = differenceInDays(timelineEnd, timelineStart);
      const centerDays = Math.floor(totalDays / 2);
      const center = new Date(timelineStart.getTime() + centerDays * 24 * 60 * 60 * 1000);
      setTimelineStart(subMonths(center, 2));
      setTimelineEnd(addMonths(center, 2));
      setZoom(prev => Math.min(2, prev + 0.5));
    }
  };

  const handleZoomOut = () => {
    if (zoom > 0.5) {
      const totalDays = differenceInDays(timelineEnd, timelineStart);
      const centerDays = Math.floor(totalDays / 2);
      const center = new Date(timelineStart.getTime() + centerDays * 24 * 60 * 60 * 1000);
      setTimelineStart(subMonths(center, 4));
      setTimelineEnd(addMonths(center, 4));
      setZoom(prev => Math.max(0.5, prev - 0.5));
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold" data-testid="text-timeline-title">
            Compliance Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(timelineStart, "MMM yyyy")} - {format(timelineEnd, "MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="w-40" data-testid="select-timeline-groupby">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">By Customer</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            data-testid="button-timeline-zoomout"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
            data-testid="button-timeline-zoomin"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPeriod}
            data-testid="button-timeline-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPeriod}
            data-testid="button-timeline-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month Headers */}
          <div className="flex border-b bg-muted/50 sticky top-0 z-10">
            <div className="w-48 p-3 border-r font-semibold flex-shrink-0">
              {groupBy === "customer" ? "Customer" : groupBy === "category" ? "Category" : "Status"}
            </div>
            <div className="flex-1 flex">
              {months.map((month, index) => (
                <div
                  key={index}
                  className="flex-1 p-3 text-center text-sm font-semibold border-r last:border-r-0"
                >
                  {format(month, "MMM yyyy")}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          {groupedItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No compliance items to display
            </div>
          ) : (
            groupedItems.map(([groupName, groupItems]) => (
              <div key={groupName} className="border-b last:border-b-0">
                <div className="flex items-start">
                  {/* Group Label */}
                  <div className="w-48 p-3 border-r font-medium flex-shrink-0 bg-muted/30">
                    <div className="truncate" title={groupName}>
                      {groupName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Timeline Bars */}
                  <div className="flex-1 p-3 relative min-h-[80px]">
                    {groupItems.map((item, index) => {
                      const barStyle = getBarStyle(item);
                      if (!barStyle) return null;

                      return (
                        <TooltipProvider key={item.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute h-7 rounded px-2 py-1 cursor-pointer transition-all ${getStatusColor(
                                  item.status
                                )} text-white text-xs flex items-center justify-between shadow-sm`}
                                style={{
                                  ...barStyle,
                                  top: `${index * 32}px`,
                                  zIndex: 1,
                                }}
                                data-testid={`timeline-bar-${item.id}`}
                              >
                                <span className="truncate font-medium">
                                  {item.commitment}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-1">
                                <div className="font-semibold">{item.commitment}</div>
                                <div className="text-xs space-y-0.5">
                                  <div>Customer: {getCustomerName(item.customerId)}</div>
                                  <div>Category: {item.category}</div>
                                  <div>Status: {item.status}</div>
                                  {item.dueDate && (
                                    <div>Due: {format(typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate, "MMM d, yyyy")}</div>
                                  )}
                                  <div>Responsible: {item.responsibleParty}</div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-semibold">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span>N/A</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
