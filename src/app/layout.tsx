import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Asset Analyser | Stock Manager",
  description: "Système de gestion de stock premium",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const role = session?.user?.role;

  return (
    <html lang="fr" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-slate-900`}>
        <AppShell role={role}>{children}</AppShell>
      </body>
    </html>
  );
}
