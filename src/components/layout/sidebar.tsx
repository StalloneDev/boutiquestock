"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Settings, 
  Truck,
  Layers,
  TrendingUp,
  RefreshCw,
  FileText,
  Share2,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navigation = [
  {
    title: "Pilotage",
    items: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/margins", label: "Marges & profits", icon: TrendingUp },
    ]
  },
  {
    title: "Ventes",
    items: [
      { href: "/pos", label: "Caisse", icon: ShoppingCart },
      { href: "/sales", label: "Historique ventes", icon: History },
    ]
  },
  {
    title: "Stock",
    items: [
      { href: "/products", label: "Produits", icon: Package },
      { href: "/categories", label: "Catégories", icon: Layers },
      { href: "/restock", label: "Réapprovisionner", icon: RefreshCw },
      { href: "/history", label: "Mouvements", icon: History },
    ]
  },
  {
    title: "Fournisseurs",
    items: [
      { href: "/suppliers", label: "Fournisseurs", icon: Truck },
      { href: "/orders", label: "Bons de commande", icon: FileText },
    ]
  },
  {
    title: "Public",
    items: [
      { href: "/public-catalog", label: "Catalogue partageable", icon: Share2 },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Déconnexion réussie");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <div className="flex flex-col w-72 bg-slate-900 text-white min-h-screen border-r border-slate-800">
      <div className="p-8">
        <h1 className="text-2xl font-black tracking-tighter text-blue-500">STOCK MANAGER</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Édition Boutique</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
        {navigation.map((group) => (
          <div key={group.title} className="space-y-2">
            <h2 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group",
                      isActive 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={cn(isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white")} />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </div>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-slate-800/50">
        <div className="bg-slate-800/40 rounded-xl p-4 flex items-center gap-3 border border-white/5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">SK</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Admin Boutique</p>
            <p className="text-[10px] text-slate-500 truncate">sk@manager.com</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
