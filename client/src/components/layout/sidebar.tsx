import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  DollarSign, 
  Shield, 
  Download,
  Activity
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Contracts",
    href: "/contracts",
    icon: FileText,
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: Calendar,
  },
  {
    name: "Billable Events",
    href: "/billable-events",
    icon: DollarSign,
  },
  {
    name: "Evidence Locker",
    href: "/evidence-locker",
    icon: Shield,
  },
  {
    name: "Export/Import",
    href: "/export-import",
    icon: Download,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <nav className="w-64 bg-card dark:bg-sidebar border-r border-border dark:border-sidebar-border flex flex-col h-screen">
      <div className="p-6 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start px-4 py-3 ${
                      active 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    } transition-colors`}
                    data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 mt-auto">
        <div className="bg-muted dark:bg-sidebar-accent rounded-lg p-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
            <span className="text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
