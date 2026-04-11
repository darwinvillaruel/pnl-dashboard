"use client";

import { ArrowUpDown } from "lucide-react";

export type SortKey = "name" | "leads" | "roi" | "margin";
export type SortDir = "asc" | "desc";

interface SortControlProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onChange: (key: SortKey, dir: SortDir) => void;
}

const options: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "leads", label: "Leads" },
  { key: "roi", label: "ROI" },
  { key: "margin", label: "Margin" },
];

export default function SortControl({ sortKey, sortDir, onChange }: SortControlProps) {
  function handleClick(key: SortKey) {
    if (sortKey === key) {
      onChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onChange(key, "desc");
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-surface-800/60 p-1">
      <span className="px-2 text-xs text-slate-500 hidden sm:inline">Sort:</span>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => handleClick(opt.key)}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            sortKey === opt.key
              ? "bg-blue-600/80 text-white"
              : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
          }`}
        >
          {opt.label}
          {sortKey === opt.key && (
            <ArrowUpDown className="h-3 w-3" />
          )}
        </button>
      ))}
    </div>
  );
}
