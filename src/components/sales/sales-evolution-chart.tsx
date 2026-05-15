"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, startOfMonth, startOfYear, isSameDay, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/format";

interface SalesData {
  amount: number;
  date: Date;
}

export function SalesEvolutionChart({ data }: { data: SalesData[] }) {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("day");

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    data.forEach((s) => {
      let key: string;
      const date = new Date(s.date);

      if (period === "day") {
        key = format(date, "yyyy-MM-dd");
      } else if (period === "week") {
        key = format(startOfWeek(date, { locale: fr }), "yyyy-MM-dd");
      } else if (period === "month") {
        key = format(startOfMonth(date), "yyyy-MM");
      } else {
        key = format(startOfYear(date), "yyyy");
      }

      grouped.set(key, (grouped.get(key) || 0) + s.amount);
    });

    return Array.from(grouped.entries())
      .map(([key, amount]) => ({
        label: period === "day" ? format(new Date(key), "dd MMM", { locale: fr }) :
               period === "week" ? `Sem. ${format(new Date(key), "dd/MM", { locale: fr })}` :
               period === "month" ? format(new Date(key), "MMM yyyy", { locale: fr }) :
               key,
        amount,
        rawDate: key
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [data, period]);

  return (
    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm ring-1 ring-slate-200 overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
        <div>
          <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Analyse de Croissance</CardTitle>
          <p className="text-xs text-slate-500 font-medium">Visualisez l'évolution de votre chiffre d'affaires</p>
        </div>
        <Tabs value={period} onValueChange={(v: any) => setPeriod(v)} className="w-full sm:w-auto">
          <TabsList className="bg-slate-100/80 p-1">
            <TabsTrigger value="day" className="text-[10px] uppercase font-bold px-4">Jour</TabsTrigger>
            <TabsTrigger value="week" className="text-[10px] uppercase font-bold px-4">Semaine</TabsTrigger>
            <TabsTrigger value="month" className="text-[10px] uppercase font-bold px-4">Mois</TabsTrigger>
            <TabsTrigger value="year" className="text-[10px] uppercase font-bold px-4">Année</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{payload[0].payload.label}</p>
                        <p className="text-sm font-black">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
