"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/src/lib/formatCurrency';

interface RevenuePoint { date: string; total: number; }

export default function RevenueAreaChart({ data }: { data: RevenuePoint[] | undefined }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd MMM', { locale: fr })} fontSize={10} />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v)), "Recette"]}
          contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
        />
        <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="url(#colorTotal)" strokeWidth={4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
