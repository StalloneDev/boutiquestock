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
  Activity,
  Truck,
  ClipboardList,
  TrendingUp,
  Receipt,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const { data: health, isError } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    },
  });

  const navGroups: NavGroup[] = [
    {
      title: "Pilotage",
      items: [
        { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
        { href: "/margins", label: "Marges & profits", icon: TrendingUp },
      ],
    },
    {
      title: "Ventes",
      items: [
        { href: "/pos", label: "Caisse", icon: ShoppingCart },
        { href: "/sales", label: "Historique ventes", icon: Receipt },
      ],
    },
    {
      title: "Stock",
      items: [
        { href: "/products", label: "Produits", icon: Package },
        { href: "/categories", label: "Catégories", icon: Tags },
        { href: "/stock-entries", label: "Réapprovisionner", icon: ArrowDownUp },
        { href: "/history", label: "Mouvements", icon: History },
      ],
    },
    {
      title: "Fournisseurs",
      items: [
        { href: "/suppliers", label: "Fournisseurs", icon: Truck },
        { href: "/purchase-orders", label: "Bons de commande", icon: ClipboardList },
      ],
    },
    {
      title: "Public",
      items: [
        { href: "/catalog", label: "Catalogue partageable", icon: Share2 },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
        <div className="p-5 h-16 flex items-center border-b border-border/50">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-sidebar-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-sm">
              <Sparkles size={16} />
            </div>
            <span>BoutiqueStock</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              <div className="px-3 pb-1.5 pt-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location === item.href || (item.href !== "/" && location.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon
                      size={17}
                      className={isActive ? "text-primary" : "text-muted-foreground"}
                    />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border/50 flex flex-col gap-3">
          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Nouveau produit
          </Link>

          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isError
                  ? "bg-destructive"
                  : health?.status === "ok"
                  ? "bg-green-500 animate-pulse"
                  : "bg-muted-foreground"
              )}
            />
            <span>
              Système : {isError ? "hors ligne" : health?.status === "ok" ? "en ligne" : "vérification..."}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
