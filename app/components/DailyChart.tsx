"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DailyChartProps {
  data: Array<{
    label: string;
    day: string;
    leads: number;
    avgROI: number;
    avgMargin: number;
  }>;
  monthLabel?: string;
  region?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700/60 bg-surface-800/95 p-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">
            {p.name === "Leads" ? p.value.toLocaleString() : `${Number(p.value).toFixed(2)}${p.name === "Margin %" ? "%" : "x"}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DailyChart({ data, monthLabel = "January 2026", region = "Australia" }: DailyChartProps) {
  const chartData = data.filter((d) => d.leads > 0 || d.avgROI > 0);
  const isEmpty = chartData.length === 0;

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-surface-800/60 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3
            className="text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Daily Performance
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">Leads, ROI & Margin — {monthLabel} · {region}</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-blue-500/70 inline-block" />
            Leads
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-emerald-400 inline-block" />
            ROI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-400 inline-block" />
            Margin
          </span>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-slate-600">No data available for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="leads"
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="ratio"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
            <Bar
              yAxisId="leads"
              dataKey="leads"
              name="Leads"
              fill="rgba(59,130,246,0.5)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="avgROI"
              name="ROI"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="avgMargin"
              name="Margin %"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: "#fbbf24", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
