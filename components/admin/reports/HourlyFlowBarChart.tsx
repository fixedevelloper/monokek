"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface HourlyFlowPoint { hour: number; count: number; }

export default function HourlyFlowBarChart({ data }: { data: HourlyFlowPoint[] | undefined }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} fontSize={10} />
        <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
        <Tooltip cursor={{ fill: 'transparent' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
