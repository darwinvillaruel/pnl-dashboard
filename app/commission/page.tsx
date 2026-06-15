"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import type { BuyerRecord, CommissionRegion } from "@/lib/commission";
import type { LBCapTotal } from "@/lib/sheets";

type Role = "Creative Strategist" | "Media Buyer";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const REGIONS: CommissionRegion[] = ["AU", "NZ", "CA", "UK", "US"];

const REGION_CURRENCY: Record<CommissionRegion, string> = {
  AU: "AUD", NZ: "NZD", CA: "CAD", UK: "GBP", US: "USD",
};

const REGION_SYMBOL: Record<CommissionRegion, string> = {
  AU: "$", NZ: "$", CA: "$", UK: "£", US: "$",
};

const COMMISSION_REGION_TO_FULL: Record<CommissionRegion, string> = {
  AU: "Australia", NZ: "New Zealand", CA: "Canada", UK: "UK", US: "US",
};

function formatCurrency(value: number, symbol: string): string {
  if (value === 0) return "—";
  return `${symbol}${value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function totalCommission(record: BuyerRecord): number {
  return Object.values(record.commission).reduce((s, v) => s + v, 0);
}

function MonthSelector({
  month,
  setMonth,
  disabled,
}: {
  month: number;
  setMonth: (m: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1 w-fit">
      {MONTH_ABBR.map((abbr, i) => (
        <button
          key={abbr}
          onClick={() => setMonth(i)}
          disabled={disabled}
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
  );
}

export default function CommissionPage() {
  const [role, setRole] = useState<Role>("Media Buyer");

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Header />

      <main className="relative mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
        {/* Breadcrumb + title */}
        <div className="mb-6 animate-fade-up">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-400">Commission</span>
          </div>
          <h2
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Commission
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Net revenue and commission breakdown by role
          </p>
        </div>

        {/* Role toggle */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1">
            {(["Creative Strategist", "Media Buyer"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  role === r
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          {role === "Creative Strategist" ? (
            <CreativeStrategistView />
          ) : (
            <MediaBuyerView />
          )}
        </div>

        <div className="mt-12 border-t border-slate-800/40 py-6 text-center">
          <p className="text-xs text-slate-600">
            PNL Dashboard · Commission · Internal Use Only
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Creative Strategist ────────────────────────────────────────────────────

function CreativeStrategistView() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [region, setRegion] = useState<CommissionRegion>("AU");
  const [totals, setTotals] = useState<LBCapTotal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: CommissionRegion, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commission/creative?region=${r}&month=${m}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to fetch");
      setTotals(json.totals as LBCapTotal[]);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(region, month);
  }, [region, month, fetchData]);

  return (
    <div>
      {/* Region + Month selectors */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1">
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
        <MonthSelector month={month} setMonth={(m) => setMonth(m)} disabled={loading} />
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span className="font-medium">Failed to load data:</span>
          <span className="text-red-400/70">{error}</span>
          <button onClick={() => fetchData(region, month)} className="ml-auto text-red-400/60 hover:text-red-400">
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800/40 bg-surface-800/30 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/40">
          <div>
            <p className="font-semibold text-white">Lead Volume Delivery</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {MONTHS[month]} · {COMMISSION_REGION_TO_FULL[region]} — Cap excludes weekends · Actual includes all days
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> ≥ 80%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> &lt; 80%
            </span>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-800/40">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
                <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-800" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-800" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-800" />
                <div className="h-5 w-12 animate-pulse rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        ) : totals.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-slate-500">No data for {MONTHS[month]} · {COMMISSION_REGION_TO_FULL[region]}.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Vertical</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Cap (target)</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Actual</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Delivery %</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((row) => {
                const pct = row.deliveryRate !== null ? row.deliveryRate * 100 : null;
                const met = pct !== null && pct >= 80;
                const noData = row.totalCap === 0;
                return (
                  <tr
                    key={row.campaign}
                    className="border-b border-slate-800/20 last:border-0 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-300">{row.vertical}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400">
                      {row.totalCap > 0 ? row.totalCap.toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400">
                      {row.actualDelivered > 0 ? row.actualDelivered.toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs">
                      {noData ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className={met ? "text-green-400" : "text-red-400"}>
                          {pct!.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {noData ? (
                        <span className="text-slate-600 text-xs">—</span>
                      ) : met ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                          Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                          Not met
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Media Buyer ────────────────────────────────────────────────────────────

function MediaBuyerView() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [records, setRecords] = useState<BuyerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commission");
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to fetch");
      setRecords(json.records as BuyerRecord[]);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthRecords = records.filter(
    (r) => r.month.toLowerCase() === MONTHS[month].toLowerCase()
  );
  const buyers = Array.from(new Set(records.map((r) => r.name)));

  return (
    <div>
      <div className="mb-8">
        <MonthSelector month={month} setMonth={setMonth} disabled={loading} />
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span className="font-medium">Failed to load commission data:</span>
          <span className="text-red-400/70">{error}</span>
          <button onClick={fetchData} className="ml-auto text-red-400/60 hover:text-red-400">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-800/40 bg-surface-800/30" />
          ))}
        </div>
      ) : monthRecords.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/40 bg-surface-800/30 px-6 py-20 text-center">
          <p className="text-slate-500">No commission data for {MONTHS[month]}.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {buyers.map((name) => {
            const record = monthRecords.find((r) => r.name === name);
            if (!record) return null;
            return <BuyerCard key={name} record={record} total={totalCommission(record)} />;
          })}
        </div>
      )}
    </div>
  );
}

function BuyerCard({ record, total }: { record: BuyerRecord; total: number }) {
  return (
    <div className="rounded-2xl border border-slate-800/40 bg-surface-800/30 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400">
            {record.name.slice(0, 1).toUpperCase()}
          </div>
          <span className="font-semibold text-white">{record.name}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total Commission</p>
          <p className="text-base font-bold text-blue-400">
            ${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/40">
            <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">Region</th>
            <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">Net Revenue</th>
            <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">Commission (AUD)</th>
          </tr>
        </thead>
        <tbody>
          {REGIONS.map((region) => {
            const rev = record.netRevenue[region];
            const com = record.commission[region];
            const symbol = REGION_SYMBOL[region];
            const currency = REGION_CURRENCY[region];
            const hasData = rev !== 0 || com !== 0;
            return (
              <tr
                key={region}
                className="border-b border-slate-800/20 last:border-0 hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300">{region}</span>
                    <span className="text-xs text-slate-600">{currency}</span>
                  </div>
                </td>
                <td className={`px-5 py-3 text-right font-mono text-xs ${hasData ? "text-slate-300" : "text-slate-700"}`}>
                  {formatCurrency(rev, symbol)}
                </td>
                <td className={`px-5 py-3 text-right font-mono text-xs ${com > 0 ? "text-green-400" : "text-slate-700"}`}>
                  {formatCurrency(com, "$")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
