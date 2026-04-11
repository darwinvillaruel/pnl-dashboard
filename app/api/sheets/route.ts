import { NextRequest, NextResponse } from "next/server";
import { REGIONS, type Region } from "@/lib/data";
import { fetchSheetData } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const region = searchParams.get("region") as Region | null;
  const monthStr = searchParams.get("month");

  if (!region || !(REGIONS as readonly string[]).includes(region)) {
    return NextResponse.json({ error: `Invalid region. Must be one of: ${REGIONS.join(", ")}` }, { status: 400 });
  }

  const month = parseInt(monthStr ?? "", 10);
  if (isNaN(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month. Must be 0–11." }, { status: 400 });
  }

  try {
    const { verticals } = await fetchSheetData(region, month);
    return NextResponse.json({ verticals });
  } catch (err: any) {
    const message = err?.message ?? "Failed to fetch sheet data";
    console.error("[sheets/route]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
