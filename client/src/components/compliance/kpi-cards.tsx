import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, AlertTriangle, Calendar, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface KPICardsProps {
  metrics?: {
    totalItems: number;
    completedItems: number;
    overdueItems: number;
    upcomingItems: number;
    complianceRate: number;
  };
  isLoading?: boolean;
}

export default function KPICards({ metrics, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Compliance Rate",
      value: `${metrics?.complianceRate?.toFixed(1) || 0}%`,
      icon: ClipboardCheck,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      testId: "kpi-compliance-rate",
      filterUrl: "/compliance?filter=completed",
    },
    {
      title: "Overdue Items",
      value: metrics?.overdueItems || 0,
      icon: AlertTriangle,
      iconColor: "text-secondary",
      bgColor: "bg-secondary/10",
      testId: "kpi-overdue-items",
      filterUrl: "/compliance?filter=overdue",
    },
    {
      title: "Due This Week",
      value: metrics?.upcomingItems || 0,
      icon: Calendar,
      iconColor: "text-accent",
      bgColor: "bg-accent/10",
      testId: "kpi-upcoming-items",
      filterUrl: "/compliance?filter=upcoming",
    },
    {
      title: "Total Items",
      value: metrics?.totalItems || 0,
      icon: ListChecks,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      testId: "kpi-total-items",
      filterUrl: "/compliance?filter=all",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link key={kpi.title} href={kpi.filterUrl}>
            <Card className="border border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                  </div>
                  <div className="ml-4">
                    <p 
                      className="text-2xl font-bold text-foreground"
                      data-testid={kpi.testId}
                    >
                      {kpi.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
