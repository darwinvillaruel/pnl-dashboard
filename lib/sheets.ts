import { google } from "googleapis";
import { type Region, MONTHS, type VerticalData, type DailyMetrics } from "./data";

// Maps PNL vertical name → LB Tracker campaign name (AU only; LB Tracker is AU-specific)
export const VERTICAL_TO_LB_CAMPAIGN: Record<string, string> = {
  "Aus Auto Finder (PRIME)": "Aus Auto - Prime",
  "Aus Auto Finder (SUB-PRIME)": "Aus Auto - Sub-Prime",
  "Aus Business Lending": "Aus Business Lending",
  "Right Health Insurance": "Au Health Insurance",
  "Right Life Insure": "Au Right Life Insure",
  "Right Life Insure Golden Insurance": "Golden Insurance",
  "Right Life Insure Direct Cover": "Direct Cover",
  "Shuffling Debt": "AU Debt - Shuffling Debt",
  "Boost Ur Super": "Au Superannuation",
  "Claims Buddy (TPD)": "AU TPD Claims",
  "Hearing Aids": "AU Hearing Aid",
  "EZI SMSF": "Self Manage Super Fund",
  "Claims Buddy (Personal Injury)": "Au Personal Injury",
  "Best Aged Carers": "Seniors Choice",
  "POS Quotes": "Au POS",
  "Ur Next Property": "AU Property Investment",
};

function getSheetId(region: Region): string | undefined {
  const map: Record<Region, string | undefined> = {
    Australia: process.env.SHEET_ID_AU,
    UK: process.env.SHEET_ID_UK,
    US: process.env.SHEET_ID_US,
    "New Zealand": process.env.SHEET_ID_NZ,
    Canada: process.env.SHEET_ID_CA,
  };
  return map[region];
}

function getAuthClient() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json or GOOGLE_SERVICE_ACCOUNT_KEY=<inline json>"
    );
  }
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function parsePct(v: string): number {
  if (!v) return 0;
  const s = v.trim().replace("%", "");
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  // If the sheet stores percentage as decimal (e.g. 0.6482 instead of 64.82%)
  // values will be < 1; multiply by 100 to normalise
  return Math.abs(n) < 1 && n !== 0 ? n * 100 : n;
}

function parseNum(v: string): number {
  if (!v) return 0;
  // Strip commas (e.g. "1,234")
  return parseFloat(v.trim().replace(/,/g, "")) || 0;
}

// Fetch and parse the LB Tracker tab.
// Returns a nested map: dayKey → lbCampaignName → { totalDailyCap }
// Multiple rows for the same campaign+day are summed.
async function fetchLBTrackerData(
  spreadsheetId: string,
  month: number
): Promise<Map<string, Map<string, number>>> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const result = new Map<string, Map<string, number>>();

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "LB Tracker!A1:I5000",
      valueRenderOption: "FORMATTED_VALUE",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch {
    // LB Tracker tab missing or inaccessible — silently skip
    return result;
  }

  if (rows.length < 2) return result;

  // Find header row and column indices
  let colDate = -1, colCampaign = -1, colDailyCap = -1;
  let headerRow = -1;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const lower = (rows[r] ?? []).map((c) => (c ?? "").trim().toLowerCase());
    const di = lower.indexOf("date");
    const ci = lower.indexOf("campaign");
    const capi = lower.findIndex((c) => c === "total daily cap" || c.includes("daily cap"));
    if (di >= 0 && ci >= 0 && capi >= 0) {
      headerRow = r;
      colDate = di;
      colCampaign = ci;
      colDailyCap = capi;
      break;
    }
  }

  if (headerRow < 0) return result;

  // e.g. month=3 → "Apr"
  const monthAbbr = MONTHS[month].slice(0, 3).toLowerCase();

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const dateVal = (row[colDate] ?? "").trim(); // e.g. "1- Apr"
    if (!dateVal.toLowerCase().includes(`- ${monthAbbr}`)) continue;

    const campaign = (row[colCampaign] ?? "").trim();
    const dailyCap = parseNum(row[colDailyCap] ?? "");

    if (!campaign || dailyCap <= 0) continue;

    // Normalise dayKey to match PNL format: parse "1- Apr" → "1- Apr"
    // The LB Tracker format already matches, but normalise day number (trim leading zero)
    const dayKeyMatch = dateVal.match(/^(\d+)-\s*([A-Za-z]+)$/);
    if (!dayKeyMatch) continue;
    const dayKey = `${parseInt(dayKeyMatch[1], 10)}- ${dayKeyMatch[2]}`;

    if (!result.has(dayKey)) result.set(dayKey, new Map());
    const dayMap = result.get(dayKey)!;

    // Sum caps when multiple rows share the same campaign on the same day
    dayMap.set(campaign, (dayMap.get(campaign) ?? 0) + dailyCap);
  }

  return result;
}


// Reversed map: LB Tracker campaign name → PNL vertical name
const LB_CAMPAIGN_TO_VERTICAL: Record<string, string> = Object.fromEntries(
  Object.entries(VERTICAL_TO_LB_CAMPAIGN).map(([vertical, campaign]) => [campaign, vertical])
);

export interface LBCapTotal {
  vertical: string;
  campaign: string;
  totalCap: number;
  actualDelivered: number;
  deliveryRate: number | null;
}

// Shared: fetches and parses all LB Tracker rows from the AU sheet for the given month.
// Returns a map of campaignName → { totalCap, actualDelivered }.
async function fetchLBTrackerRaw(month: number): Promise<Map<string, { totalCap: number; actualDelivered: number }>> {
  const spreadsheetId = process.env.SHEET_ID_AU;
  if (!spreadsheetId) throw new Error("SHEET_ID_AU is not configured");

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "LB Tracker!A1:I5000",
      valueRenderOption: "FORMATTED_VALUE",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch {
    return new Map();
  }

  if (rows.length < 2) return new Map();

  let colDate = -1, colCampaign = -1, colCurrent = -1, colDailyCap = -1, colDay = -1;
  let headerRow = -1;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const lower = (rows[r] ?? []).map((c) => (c ?? "").trim().toLowerCase());
    const di = lower.indexOf("date");
    const ci = lower.indexOf("campaign");
    const curi = lower.indexOf("current");
    const capi = lower.findIndex((c) => c === "total daily cap" || c.includes("daily cap"));
    const dayi = lower.indexOf("day");
    if (di >= 0 && ci >= 0 && capi >= 0) {
      headerRow = r;
      colDate = di;
      colCampaign = ci;
      colCurrent = curi;
      colDailyCap = capi;
      colDay = dayi;
      break;
    }
  }

  if (headerRow < 0) return new Map();

  const monthAbbr = MONTHS[month].slice(0, 3).toLowerCase();
  const totals = new Map<string, { totalCap: number; actualDelivered: number }>();

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const dateVal = (row[colDate] ?? "").trim();
    if (!dateVal.toLowerCase().includes(`- ${monthAbbr}`)) continue;

    const campaign = (row[colCampaign] ?? "").trim();
    if (!campaign) continue;

    const dayLabel = colDay >= 0 ? (row[colDay] ?? "").trim() : "";
    const isWeekend = dayLabel === "Sat" || dayLabel === "Sun";

    const current = colCurrent >= 0 ? parseNum(row[colCurrent] ?? "") : 0;
    const dailyCap = isWeekend ? 0 : parseNum(row[colDailyCap] ?? "");

    if (!totals.has(campaign)) totals.set(campaign, { totalCap: 0, actualDelivered: 0 });
    const entry = totals.get(campaign)!;
    entry.totalCap += dailyCap;
    entry.actualDelivered += current;
  }

  return totals;
}

// AU: returns only the campaigns mapped via VERTICAL_TO_LB_CAMPAIGN.
// totalCap sums weekday-only Daily Cap; actualDelivered sums Current for all days.
export async function fetchLBTrackerCapTotals(month: number): Promise<LBCapTotal[]> {
  const raw = await fetchLBTrackerRaw(month);
  return Array.from(raw.entries())
    .map(([campaign, { totalCap, actualDelivered }]) => ({
      vertical: LB_CAMPAIGN_TO_VERTICAL[campaign] ?? campaign,
      campaign,
      totalCap,
      actualDelivered,
      deliveryRate: totalCap > 0 ? actualDelivered / totalCap : null,
    }))
    .filter((r) => r.campaign in LB_CAMPAIGN_TO_VERTICAL)
    .sort((a, b) => a.vertical.localeCompare(b.vertical));
}

// All regions: returns every campaign in the AU LB Tracker without filtering.
// Callers are responsible for matching campaigns to their region's verticals.
export async function fetchLBTrackerAllCampaigns(month: number): Promise<LBCapTotal[]> {
  const raw = await fetchLBTrackerRaw(month);
  return Array.from(raw.entries())
    .map(([campaign, { totalCap, actualDelivered }]) => ({
      vertical: LB_CAMPAIGN_TO_VERTICAL[campaign] ?? campaign,
      campaign,
      totalCap,
      actualDelivered,
      deliveryRate: totalCap > 0 ? actualDelivered / totalCap : null,
    }))
    .sort((a, b) => a.campaign.localeCompare(b.campaign));
}

export async function fetchSheetData(
  region: Region,
  month: number
): Promise<{ verticals: VerticalData[] }> {
  const spreadsheetId = getSheetId(region);
  if (!spreadsheetId) throw new Error(`Sheet ID for region "${region}" is not configured`);

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const tabName = MONTHS[month];

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:AJ400`,
      valueRenderOption: "FORMATTED_VALUE",
    });
    rows = (res.data.values ?? []) as string[][];
    console.log(`[sheets] ${region}/${tabName}: fetched ${rows.length} rows`);
    if (rows.length > 0) console.log(`[sheets] first row sample:`, JSON.stringify(rows[0]).slice(0, 200));
    if (rows.length > 1) console.log(`[sheets] second row sample:`, JSON.stringify(rows[1]).slice(0, 200));
    if (rows.length > 2) console.log(`[sheets] third row sample:`, JSON.stringify(rows[2]).slice(0, 200));
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status ?? err?.code;
    const message: string = err?.response?.data?.error?.message ?? err?.message ?? "";
    console.error(`[sheets] fetch error for ${region}/${tabName}: status=${status} message=${message}`);
    if (status === 400 || status === 404 || message.includes("Unable to parse range") || message.includes("notFound")) {
      return { verticals: [] };
    }
    throw err;
  }

  if (rows.length < 3) {
    console.error(`[sheets] Too few rows (${rows.length}) for ${region}/${tabName}`);
    return { verticals: [] };
  }

  // --- Detect header row (contains "1- Jan" / "1- Feb" etc.) ---
  // It may not always be row 0; scan first 5 rows
  let headerRowIdx = -1;
  const dayColMap: { colIdx: number; dayKey: string; dayNum: number }[] = [];

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r] ?? [];
    const found: typeof dayColMap = [];
    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] ?? "").trim();
      const match = cell.match(/^(\d+)-\s*([A-Za-z]+)$/);
      if (match) {
        found.push({ colIdx: c, dayKey: `${parseInt(match[1], 10)}- ${match[2]}`, dayNum: parseInt(match[1], 10) });
      }
    }
    console.log(`[sheets] row ${r}: found ${found.length} day-cols. cells: ${JSON.stringify(row.slice(0, 5))}`);
    if (found.length >= 5) { // must find at least 5 day columns to confirm
      headerRowIdx = r;
      dayColMap.push(...found);
      break;
    }
  }

  if (dayColMap.length === 0) {
    console.error(`[sheets] No day columns detected in ${region}/${tabName}`);
    return { verticals: [] };
  }
  console.log(`[sheets] headerRowIdx=${headerRowIdx}, dayColMap first keys:`, dayColMap.slice(0, 3).map(d => d.dayKey));

  // All regions: col A (index 0) is the label column (vertical name, ROI, Margin, Leads).
  const labelColIdx = 0;
  console.log(`[sheets] labelColIdx=${labelColIdx}`);
  // Log first few data rows so we can see exact cell values
  for (let r = headerRowIdx + 1; r < Math.min(headerRowIdx + 6, rows.length); r++) {
    console.log(`[sheets] data row ${r} cols 0-3:`, JSON.stringify((rows[r] ?? []).slice(0, 4)));
  }

  const verticals: VerticalData[] = [];
  let i = headerRowIdx + 1;
  if (rows[headerRowIdx + 1] && (rows[headerRowIdx + 1][labelColIdx] ?? "").trim() === "") {
    // Skip day-of-week row
    i = headerRowIdx + 2;
  }

  while (i < rows.length) {
    const row = rows[i] ?? [];
    const labelCell = (row[labelColIdx] ?? "").trim();

    // Detect vertical header: label col contains "Facebook -" or "Tiktok -"
    const isVerticalHeader =
      (labelCell.toLowerCase().startsWith("facebook -") ||
        labelCell.toLowerCase().startsWith("tiktok -") ||
        labelCell.toLowerCase().startsWith("fb -") ||
        labelCell.toLowerCase().startsWith("tt -"));

    if (isVerticalHeader) {
      const name = labelCell.replace(/^(facebook|tiktok|fb|tt)\s*-\s*/i, "").trim();
      const platform: "Facebook" | "TikTok" =
        /^(tiktok|tt)/i.test(labelCell) ? "TikTok" : "Facebook";

      // Scan rows immediately after the header for ROI / Margin / Leads.
      // Stop as soon as all 3 are found OR we hit the next vertical header row.
      let roiRow: string[] = [];
      let marginRow: string[] = [];
      let leadsRow: string[] = [];
      let nextStart = i + 1;

      for (let j = i + 1; j < Math.min(i + 6, rows.length); j++) {
        const jIdCell = (rows[j][0] ?? "").trim();
        const jLbl = (rows[j][labelColIdx] ?? "").trim().toLowerCase();

        // Stop if we hit another vertical header
        if (jLbl.startsWith("facebook -") || jLbl.startsWith("tiktok -") || jLbl.startsWith("fb -") || jLbl.startsWith("tt -")) {
          break;
        }

        if (jLbl === "roi" && roiRow.length === 0) {
          roiRow = rows[j];
          nextStart = j + 1;
        } else if (jLbl === "margin" && marginRow.length === 0) {
          marginRow = rows[j];
          nextStart = j + 1;
        } else if (jLbl.startsWith("leads") && leadsRow.length === 0) {
          leadsRow = rows[j];
          nextStart = j + 1;
        }

        // All three found — stop immediately
        if (roiRow.length > 0 && marginRow.length > 0 && leadsRow.length > 0) break;
      }

      const daily: Record<string, DailyMetrics> = {};
      for (const { colIdx, dayKey } of dayColMap) {
        daily[dayKey] = {
          roi: parseNum(roiRow[colIdx] ?? ""),
          margin: parsePct(marginRow[colIdx] ?? ""),
          leadsSold: parseNum(leadsRow[colIdx] ?? ""),
        };
      }

      // Always compute from daily columns — never trust the Totals column
      // which can be unreliable across different sheet layouts.
      const activeDays = Object.values(daily).filter((d) => d.leadsSold > 0);
      const totalLeads = activeDays.reduce((s, d) => s + d.leadsSold, 0);
      // Lead-weighted avg so high-volume days carry more weight
      const avgROI = totalLeads > 0
        ? activeDays.reduce((s, d) => s + d.roi * d.leadsSold, 0) / totalLeads
        : 0;
      const avgMargin = totalLeads > 0
        ? activeDays.reduce((s, d) => s + d.margin * d.leadsSold, 0) / totalLeads
        : 0;

      const id = `${platform.toLowerCase().slice(0, 2)}-${region.toLowerCase().replace(/\s/g, "-")}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      verticals.push({ id, platform, name, totalLeads, avgROI, avgMargin, daily });
      i = nextStart;
    } else {
      i++;
    }
  }

  // --- Enrich with LB Tracker cap data (AU only — LB Tracker tab lives in AU sheet) ---
  if (region === "Australia") {
    const lbData = await fetchLBTrackerData(spreadsheetId, month);
    if (lbData.size > 0) {
      for (const vertical of verticals) {
        const lbCampaign = VERTICAL_TO_LB_CAMPAIGN[vertical.name];
        if (!lbCampaign) continue;

        for (const dayKey of Array.from(lbData.keys())) {
          const campaignMap = lbData.get(dayKey)!;
          const cap = campaignMap.get(lbCampaign);
          if (cap !== undefined && vertical.daily[dayKey]) {
            vertical.daily[dayKey] = { ...vertical.daily[dayKey], totalDailyCap: cap };
          }
        }
      }
    }
  }

  console.log(`[sheets] ${region}/${tabName}: parsed ${verticals.length} verticals. leads totals:`, verticals.map(v => `${v.name}:${v.totalLeads}`).join(', ').slice(0, 300));
  return { verticals };
}
