import { NextResponse } from "next/server";
import { fetchMediaBuyerCommission } from "@/lib/commission";

export async function GET() {
  try {
    const records = await fetchMediaBuyerCommission();
    return NextResponse.json({ records });
  } catch (err: any) {
    console.error("[commission/route]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch commission data" }, { status: 500 });
  }
}
