import { NextRequest, NextResponse } from "next/server";
import { HazardAlertBroadcaster } from "@/features/hazards/alert-broadcaster";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { response, user_id } = body as {
      response: "SAFE" | "NEED_HELP" | "VIEWED_ROUTE" | "DISMISSED";
      user_id?: string;
    };

    const targetUserId = user_id || "vessel-active-user";
    HazardAlertBroadcaster.recordResponse(id, targetUserId, response || "DISMISSED");

    return NextResponse.json({
      success: true,
      hazard_id: id,
      user_id: targetUserId,
      response,
      message: "Hazard alert response acknowledged and logged on Authority Command Center.",
    });
  } catch (error) {
    console.error("POST /api/v1/alerts/[id]/response error:", error);
    return NextResponse.json({ error: "Failed to record alert response" }, { status: 500 });
  }
}
