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
      <aside className="w-64 flex-shrink-0 border-r border-border bg-gradient-to-b from-violet-50 via-white to-pink-50/40 flex flex-col h-full">
        <div className="p-5 h-16 flex items-center border-b border-border/50 bg-white/40 backdrop-blur-sm">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-sidebar-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Sparkles size={17} />
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">BoutiqueStock</span>
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
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20"
                        : "text-sidebar-foreground hover:bg-white/70 hover:text-violet-700"
                    )}
                  >
                    <Icon
                      size={17}
                      className={isActive ? "text-white" : "text-violet-500/70"}
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
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all shadow-md shadow-fuchsia-500/20"
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
