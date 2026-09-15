import { NextRequest, NextResponse } from "next/server";
import { HazardAlertBroadcaster } from "@/features/hazards/alert-broadcaster";
import { Hazard } from "@/features/hazards/types";

export async function GET() {
  try {
    const hazards = HazardAlertBroadcaster.getActiveHazards();
    return NextResponse.json({
      success: true,
      count: hazards.length,
      hazards,
    });
  } catch (error) {
    console.error("GET /api/v1/hazards error:", error);
    return NextResponse.json({ error: "Failed to fetch hazards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Hazard = await request.json();

    if (!body.hazard_id || !body.type || !body.affected_zone) {
      return NextResponse.json(
        { error: "Invalid hazard payload. Requires hazard_id, type, and affected_zone." },
        { status: 400 }
      );
    }

    HazardAlertBroadcaster.addHazard(body);

    return NextResponse.json({
      success: true,
      message: "Hazard advisory created successfully.",
      hazard: body,
    });
  } catch (error) {
    console.error("POST /api/v1/hazards error:", error);
    return NextResponse.json({ error: "Failed to create hazard" }, { status: 500 });
  }
}
