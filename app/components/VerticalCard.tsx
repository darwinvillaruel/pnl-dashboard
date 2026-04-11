"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { VerticalData } from "@/lib/data";
import { generateDaysForMonth } from "@/lib/data";

interface VerticalCardProps {
  vertical: VerticalData;
  month?: number;
  year?: number;
}

function marginColor(margin: number) {
  if (margin === 0) return "text-slate-600";
  if (margin >= 30) return "text-emerald-400";
  return "text-rose-400";
}

function cellBg(value: number, type: "margin" | "leads") {
  if (value === 0) return "";
  if (type === "margin") {
    return value >= 30 ? "bg-emerald-500/10" : "bg-rose-500/8";
  }
  return "bg-blue-500/5";
}

function leadsCapColor(leadsSold: number, totalDailyCap?: number): string {
  if (leadsSold === 0 || totalDailyCap === undefined || totalDailyCap <= 0) return leadsSold > 0 ? "text-blue-300" : "text-slate-700";
  return leadsSold >= totalDailyCap * 0.8 ? "text-emerald-400" : "text-rose-400";
}

export default function VerticalCard({ vertical, month = 0, year = 2026 }: VerticalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasData = vertical.totalLeads > 0;
  const days = generateDaysForMonth(month, year);

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        hasData
          ? "border-slate-700/50 bg-surface-800/60 hover:border-slate-600/60"
          : "border-slate-800/40 bg-surface-900/30 opacity-50"
      }`}
    >
      {/* Header */}
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => hasData && setExpanded(!expanded)}
        disabled={!hasData}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-2 w-2 rounded-full flex-shrink-0 ${
              hasData ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-700"
            }`}
          />
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-white"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {vertical.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{vertical.platform}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0 ml-4">
          {/* Metrics */}
          <div className="hidden sm:flex items-center gap-5">
            <div className="text-right">
              <p className="text-xs text-slate-500">Leads</p>
              <p
                className="font-mono text-sm font-semibold text-white"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                {hasData ? vertical.totalLeads.toLocaleString() : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">ROI</p>
              <p
                className="font-mono text-sm font-semibold text-white"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                {hasData ? `${vertical.avgROI.toFixed(2)}x` : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Margin</p>
              <p
                className={`font-mono text-sm font-semibold ${marginColor(vertical.avgMargin)}`}
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                {hasData ? `${vertical.avgMargin.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>

          {hasData && (
            <div className="rounded-lg p-1 text-slate-400 transition-colors hover:text-white">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded daily table */}
      {expanded && hasData && (
        <div className="border-t border-slate-700/40 px-5 pb-5 pt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-700/30">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="border-b border-slate-700/30 bg-surface-700/40">
                  <th className="sticky left-0 z-10 bg-surface-700/60 px-3 py-2.5 text-left font-semibold uppercase tracking-widest text-slate-400 backdrop-blur-sm">
                    Metric
                  </th>
                  {days.map((d) => (
                    <th
                      key={d.key}
                      className="px-2.5 py-2.5 text-center font-medium text-slate-500"
                    >
                      <div className="leading-tight">
                        <div className="text-slate-400">{d.label.replace(/^\w+ /, "")}</div>
                        <div className="text-slate-600">{d.day}</div>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-widest text-slate-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ROI Row */}
                <tr className="border-b border-slate-700/20 hover:bg-slate-800/30">
                  <td className="sticky left-0 z-10 bg-surface-800/80 px-3 py-2 backdrop-blur-sm">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">ROI</span>
                  </td>
                  {days.map((d) => {
                    const roi = vertical.daily[d.key]?.roi ?? 0;
                    return (
                      <td
                        key={d.key}
                        className="px-2.5 py-2 text-center"
                        style={{ fontFamily: "var(--font-jetbrains)" }}
                      >
                        {roi > 0 ? (
                          <span className="text-white">{roi.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-700">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className="px-3 py-2 text-center font-semibold text-white"
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    {vertical.avgROI.toFixed(2)}
                  </td>
                </tr>

                {/* Margin Row */}
                <tr className="border-b border-slate-700/20 hover:bg-slate-800/30">
                  <td className="sticky left-0 z-10 bg-surface-800/80 px-3 py-2 backdrop-blur-sm">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">Margin</span>
                  </td>
                  {days.map((d) => {
                    const margin = vertical.daily[d.key]?.margin ?? 0;
                    return (
                      <td
                        key={d.key}
                        className={`px-2.5 py-2 text-center ${cellBg(margin, "margin")}`}
                        style={{ fontFamily: "var(--font-jetbrains)" }}
                      >
                        <span className={marginColor(margin)}>
                          {margin > 0 ? `${margin.toFixed(0)}%` : <span className="text-slate-700">—</span>}
                        </span>
                      </td>
                    );
                  })}
                  <td
                    className="px-3 py-2 text-center font-semibold"
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    <span className={marginColor(vertical.avgMargin)}>{vertical.avgMargin.toFixed(1)}%</span>
                  </td>
                </tr>

                {/* Leads Row */}
                <tr className="hover:bg-slate-800/30">
                  <td className="sticky left-0 z-10 bg-surface-800/80 px-3 py-2 backdrop-blur-sm">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">Leads</span>
                  </td>
                  {days.map((d) => {
                    const metrics = vertical.daily[d.key];
                    const leads = metrics?.leadsSold ?? 0;
                    const cap = metrics?.totalDailyCap;
                    return (
                      <td
                        key={d.key}
                        className={`px-2.5 py-2 text-center ${cellBg(leads, "leads")}`}
                        style={{ fontFamily: "var(--font-jetbrains)" }}
                        title={cap !== undefined ? `Cap: ${cap}` : undefined}
                      >
                        <span className={leadsCapColor(leads, cap)}>
                          {leads > 0 ? leads : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td
                    className="px-3 py-2 text-center font-bold text-blue-300"
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    {vertical.totalLeads.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
