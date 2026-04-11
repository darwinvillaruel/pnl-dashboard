"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Header from "./components/Header";
import KPICards from "./components/KPICards";
import DailyChart from "./components/DailyChart";
import VerticalCard from "./components/VerticalCard";
import PlatformFilter from "./components/PlatformFilter";
import SearchBar from "./components/SearchBar";
import SortControl, { type SortKey, type SortDir } from "./components/SortControl";
import { SkeletonKPICards, SkeletonChart, SkeletonVerticalCard } from "./components/Skeleton";
import {
  RAW_VERTICALS,
  getActiveVerticals,
  getSummaryStats,
  getDailyAggregated,
  generateDaysForMonth,
  REGIONS,
  MONTHS,
  type Region,
  type VerticalData,
} from "@/lib/data";

type Platform = "All" | "Facebook" | "TikTok";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const [platform, setPlatform] = useState<Platform>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showInactive, setShowInactive] = useState(false);
  const [region, setRegion] = useState<Region>("Australia");
  const [month, setMonth] = useState(0);
  const year = 2026;

  const [verticals, setVerticals] = useState<VerticalData[]>(RAW_VERTICALS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: Region, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sheets?region=${encodeURIComponent(r)}&month=${m}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to fetch data");
      }
      setVerticals(json.verticals as VerticalData[]);
    } catch (err: any) {
      const msg = err?.message ?? "Unknown error";
      setError(msg);
      // Fallback to static data for AU / January
      if (r === "Australia" && m === 0) {
        setVerticals(RAW_VERTICALS);
      } else {
        setVerticals([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(region, month);
  }, [region, month, fetchData]);

  const exportCSV = useCallback(() => {
    const days = generateDaysForMonth(month, year);
    const header = ["Platform", "Vertical", "Total Leads", "Avg ROI", "Avg Margin %", ...days.map((d) => d.label)];
    const rows = verticals
      .filter((v) => v.totalLeads > 0)
      .map((v) => [
        v.platform,
        v.name,
        v.totalLeads,
        v.avgROI.toFixed(2),
        v.avgMargin.toFixed(2),
        ...days.map((d) => v.daily[d.key]?.leadsSold ?? 0),
      ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl-${region.toLowerCase().replace(/\s/g, "-")}-${MONTHS[month].toLowerCase()}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [verticals, month, year, region]);

  const platformCounts = useMemo<Record<Platform, number>>(() => ({
    All: verticals.length,
    Facebook: verticals.filter((v) => v.platform === "Facebook").length,
    TikTok: verticals.filter((v) => v.platform === "TikTok").length,
  }), [verticals]);

  const filteredVerticals = useMemo(() => {
    let v = verticals;

    if (platform !== "All") v = v.filter((x) => x.platform === platform);
    if (!showInactive) v = v.filter((x) => x.totalLeads > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      v = v.filter((x) => x.name.toLowerCase().includes(q) || x.platform.toLowerCase().includes(q));
    }

    v = [...v].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortKey === "leads") { av = a.totalLeads; bv = b.totalLeads; }
      if (sortKey === "roi") { av = a.avgROI; bv = b.avgROI; }
      if (sortKey === "margin") { av = a.avgMargin; bv = b.avgMargin; }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return v;
  }, [verticals, platform, search, sortKey, sortDir, showInactive]);

  const summaryData = useMemo(() => {
    const base = platform === "All"
      ? verticals
      : verticals.filter((v) => v.platform === platform);
    return getSummaryStats(base);
  }, [verticals, platform]);

  const chartData = useMemo(() => {
    const base = platform === "All"
      ? verticals
      : verticals.filter((v) => v.platform === platform);
    const days = generateDaysForMonth(month, year);
    return getDailyAggregated(getActiveVerticals(base), days);
  }, [verticals, platform, month]);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Header onRefresh={() => fetchData(region, month)} onExport={exportCSV} loading={loading} />

      <main className="relative mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
        {/* Page title */}
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-400">{region} P&L</span>
          </div>
          <h2
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Creative Strategy
            <span className="ml-3 text-slate-600">— {MONTHS[month]} {year}</span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Performance metrics across all verticals and ad platforms
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium">Failed to load data from Google Sheets</p>
              <p className="mt-0.5 text-xs text-red-400/70">{error}{region === "Australia" && month === 0 ? " — showing cached data." : ""}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Region & Month selectors */}
        <div className="mb-8 animate-fade-up flex flex-wrap gap-3 items-center" style={{ animationDelay: "40ms" }}>
          {/* Region selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                disabled={loading}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-60 ${
                  region === r
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1">
            {MONTH_ABBR.map((abbr, i) => (
              <button
                key={abbr}
                onClick={() => setMonth(i)}
                disabled={loading}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-60 ${
                  month === i
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {abbr}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {loading ? <SkeletonKPICards /> : <KPICards {...summaryData} />}
        </div>

        {/* Chart */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: "160ms" }}>
          {loading ? <SkeletonChart /> : <DailyChart data={chartData} monthLabel={`${MONTHS[month]} ${year}`} region={region} />}
        </div>

        {/* Controls */}
        <div
          className="mb-5 flex flex-wrap items-center gap-3 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <PlatformFilter
            selected={platform}
            onChange={setPlatform}
            counts={platformCounts}
          />
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <SortControl
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
          />
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              showInactive
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                : "border-slate-700/50 bg-surface-800/60 text-slate-400 hover:text-white"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${showInactive ? "bg-blue-400" : "bg-slate-600"}`}
            />
            {showInactive ? "Showing All" : "Active Only"}
          </button>
        </div>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-300">{filteredVerticals.length}</span> vertical
            {filteredVerticals.length !== 1 ? "s" : ""} shown
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Verticals */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "320ms" }}>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonVerticalCard key={i} />)
          ) : filteredVerticals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/40 bg-surface-800/30 py-16 text-center">
              <p className="text-slate-500">No verticals match your filters.</p>
            </div>
          ) : (
            filteredVerticals.map((v) => <VerticalCard key={v.id} vertical={v} month={month} year={year} />)
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-slate-800/40 py-6 text-center">
          <p className="text-xs text-slate-600">
            PNL Dashboard · {region} Creative Strategy · Internal Use Only
          </p>
        </div>
      </main>
    </div>
  );
}
