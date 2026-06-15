import { NextRequest, NextResponse } from "next/server";
import { fetchLBTrackerCapTotals, fetchLBTrackerAllCampaigns, type LBCapTotal } from "@/lib/sheets";
import { fetchSheetData } from "@/lib/sheets";
import type { Region, VerticalData } from "@/lib/data";

const REGION_MAP: Record<string, Region> = {
  AU: "Australia",
  UK: "UK",
  US: "US",
  NZ: "New Zealand",
  CA: "Canada",
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Matches each PNL vertical to the closest LB Tracker campaign by name overlap.
// Returns one LBCapTotal per matched vertical (using the PNL vertical name as the label).
function matchVerticalsToLB(verticals: VerticalData[], campaigns: LBCapTotal[]): LBCapTotal[] {
  const used = new Set<string>();
  const result: LBCapTotal[] = [];

  for (const v of verticals) {
    const normV = normalizeName(v.name);
    const vWords = normV.split(" ").filter((w) => w.length > 2);

    let best: LBCapTotal | null = null;
    let bestScore = 0;

    for (const c of campaigns) {
      if (used.has(c.campaign)) continue;
      const normC = normalizeName(c.campaign);

      if (normC === normV) {
        best = c;
        bestScore = Infinity;
        break;
      }

      const cWords = normC.split(" ").filter((w) => w.length > 2);
      const overlap = vWords.filter((w) => cWords.includes(w)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        best = c;
      }
    }

    if (best && bestScore >= 1) {
      used.add(best.campaign);
      result.push({ ...best, vertical: v.name });
    }
  }

  return result.sort((a, b) => a.vertical.localeCompare(b.vertical));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const regionCode = (searchParams.get("region") ?? "AU").toUpperCase();
  const monthStr = searchParams.get("month");
  const month = parseInt(monthStr ?? "", 10);

  if (isNaN(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month. Must be 0–11." }, { status: 400 });
  }

  try {
    if (regionCode === "AU") {
      const totals = await fetchLBTrackerCapTotals(month);
      return NextResponse.json({ totals });
    }

    const fullRegion = REGION_MAP[regionCode];
    if (!fullRegion) {
      return NextResponse.json({ error: `Unknown region: ${regionCode}` }, { status: 400 });
    }

    const [allCampaigns, sheetData] = await Promise.all([
      fetchLBTrackerAllCampaigns(month),
      fetchSheetData(fullRegion, month),
    ]);

    const totals = matchVerticalsToLB(sheetData.verticals, allCampaigns);
    return NextResponse.json({ totals });
  } catch (err: any) {
    console.error("[commission/creative]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch data" }, { status: 500 });
  }
}
