"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "sonner";
import { Menu, X } from "lucide-react";

export function AppShell({ children, role }: { children: React.ReactNode, role?: string }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/login";
  const isPublicPage = pathname === "/public-catalog";

  if (isLoginPage || isPublicPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="flex h-full min-h-[100dvh] relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} role={role} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Mobile Header Toolbar */}
        <div className="lg:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 -ml-2 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="ml-2 font-black text-blue-500 tracking-tighter">STOCK MANAGER</span>
        </div>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
