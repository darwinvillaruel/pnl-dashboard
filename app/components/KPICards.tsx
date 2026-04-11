"use client";

import { TrendingUp, Users, BarChart3, Target } from "lucide-react";

interface KPICardsProps {
  totalLeads: number;
  avgROI: number;
  avgMargin: number;
  activeVerticals: number;
}

const cards = [
  {
    key: "totalLeads" as const,
    label: "Total Leads Sold",
    icon: Users,
    format: (v: number) => v.toLocaleString(),
    color: "blue",
    gradient: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  {
    key: "avgROI" as const,
    label: "Avg. ROI",
    icon: TrendingUp,
    format: (v: number) => `${v.toFixed(2)}x`,
    color: "emerald",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  {
    key: "avgMargin" as const,
    label: "Avg. Margin",
    icon: BarChart3,
    format: (v: number) => `${v.toFixed(1)}%`,
    color: "violet",
    gradient: "from-violet-500/10 to-violet-600/5",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    glow: "shadow-violet-500/10",
  },
  {
    key: "activeVerticals" as const,
    label: "Active Verticals",
    icon: Target,
    format: (v: number) => v.toString(),
    color: "amber",
    gradient: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
];

export default function KPICards(props: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = props[card.key];
        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.glow} transition-all duration-200 hover:scale-[1.02] hover:shadow-xl`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-current opacity-5" />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  {card.label}
                </p>
                <p
                  className={`mt-2 font-display text-3xl font-bold tracking-tight text-white`}
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {card.format(value)}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} strokeWidth={1.5} />
              </div>
            </div>

            {/* Subtle bottom indicator */}
            <div className={`mt-4 h-0.5 w-full rounded-full bg-gradient-to-r ${card.gradient} opacity-50`} />
          </div>
        );
      })}
    </div>
  );
}
