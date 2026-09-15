import { NextRequest, NextResponse } from "next/server";
import { HazardAlertBroadcaster } from "@/features/hazards/alert-broadcaster";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = HazardAlertBroadcaster.broadcastHazard(id);

    return NextResponse.json({
      success: true,
      hazard_id: id,
      matched_recipients: result.matchedUsers.length,
      recipients: result.matchedUsers,
      message: `Emergency hazard broadcast dispatched to ${result.matchedUsers.length} impacted vessels in geofence zone.`,
    });
  } catch (error) {
    console.error("POST /api/v1/hazards/[id]/broadcast error:", error);
    return NextResponse.json({ error: "Failed to broadcast hazard" }, { status: 500 });
  }
}
