import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  ArrowDownUp,
  History,
  PlusCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const { data: health, isError } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    }
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "POS", icon: ShoppingCart },
    { href: "/products", label: "Products", icon: Package },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/sales", label: "Sales History", icon: History },
    { href: "/purchase-orders", label: "Purchase Orders", icon: PlusCircle },
    { href: "/stock-entries", label: "Restock", icon: ArrowDownUp },
    { href: "/suppliers", label: "Suppliers", icon: LayoutDashboard }, // You can swap with a better icon if imported
    { href: "/margins", label: "Margins", icon: Activity },
    { href: "/history", label: "System History", icon: History },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
        <div className="p-6 h-16 flex items-center border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-foreground hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
              <Package size={14} />
            </div>
            BoutiqueStock
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 flex flex-col gap-4">
          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            New Product
          </Link>

          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <Activity size={14} className={isError ? "text-destructive" : health?.status === "ok" ? "text-green-500" : "text-muted-foreground"} />
            <span>System: {isError ? "Offline" : health?.status === "ok" ? "Online" : "Checking..."}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
