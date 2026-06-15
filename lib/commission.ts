import { google } from "googleapis";

export type CommissionRegion = "AU" | "NZ" | "CA" | "UK" | "US";

export const COMMISSION_REGIONS: CommissionRegion[] = ["AU", "NZ", "CA", "UK", "US"];

export interface RegionValues {
  AU: number;
  NZ: number;
  CA: number;
  UK: number;
  US: number;
}

export interface BuyerRecord {
  name: string;
  month: string;
  netRevenue: RegionValues;
  commission: RegionValues;
}

function parseCurrency(v: string): number {
  if (!v) return 0;
  return parseFloat(v.replace(/[$£,]/g, "").trim()) || 0;
}

function getAuthClient() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("No Google auth credentials configured");
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function fetchMediaBuyerCommission(): Promise<BuyerRecord[]> {
  const spreadsheetId = process.env.SHEET_ID_COMMISSION;
  if (!spreadsheetId) throw new Error("SHEET_ID_COMMISSION is not configured");

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Media Buyer!A1:L300",
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = (res.data.values ?? []) as string[][];

  // Skip header rows (rows 0 and 1)
  const records: BuyerRecord[] = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]?.trim()) continue;

    const name = row[0].trim();
    const month = (row[6] ?? "").trim();
    if (!month) continue;

    records.push({
      name,
      month,
      netRevenue: {
        AU: parseCurrency(row[1] ?? ""),
        NZ: parseCurrency(row[2] ?? ""),
        CA: parseCurrency(row[3] ?? ""),
        UK: parseCurrency(row[4] ?? ""),
        US: parseCurrency(row[5] ?? ""),
      },
      commission: {
        AU: parseCurrency(row[7] ?? ""),
        NZ: parseCurrency(row[8] ?? ""),
        CA: parseCurrency(row[9] ?? ""),
        UK: parseCurrency(row[10] ?? ""),
        US: parseCurrency(row[11] ?? ""),
      },
    });
  }

  return records;
}
