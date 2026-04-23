"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface MarginChartsProps {
  data: {
    name: string;
    cost: number;
    revenue: number;
    profit: number;
    margin: number;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function MarginCharts({ data }: MarginChartsProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
        Aucune donnée de marge disponible. Commencez par ajouter des produits avec des prix.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Potential Revenue vs Cost by Category */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Coût vs Revenu Potentiel par Catégorie</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                fontSize={11} 
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={11} 
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Bar dataKey="cost" name="Coût Total" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenu Potentiel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Margin Percentage by Category */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Marge Bénéficiaire (%) par Catégorie</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="profit"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                label={({ name, margin }) => `${name} (${margin}%)`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${formatCurrency(value)} (Marge: ${props.payload.margin}%)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
