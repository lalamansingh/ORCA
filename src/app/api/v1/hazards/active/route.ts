import { NextResponse } from "next/server";
import { HazardAlertBroadcaster } from "@/features/hazards/alert-broadcaster";

export async function GET() {
  try {
    const active = HazardAlertBroadcaster.getActiveHazards();
    return NextResponse.json(active);
  } catch (error) {
    console.error("GET /api/v1/hazards/active error:", error);
    return NextResponse.json({ error: "Failed to fetch active hazards" }, { status: 500 });
  }
}
