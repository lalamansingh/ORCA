import { NextRequest, NextResponse } from "next/server";
import { HazardAlertBroadcaster } from "@/features/hazards/alert-broadcaster";
import { UserLocationRecord } from "@/features/hazards/types";

export async function POST(request: NextRequest) {
  try {
    const body: UserLocationRecord = await request.json();

    if (!body.user_id || body.latitude == null || body.longitude == null) {
      return NextResponse.json(
        { error: "Invalid location record. Requires user_id, latitude, longitude." },
        { status: 400 }
      );
    }

    HazardAlertBroadcaster.updateUserLocation(body);

    return NextResponse.json({
      success: true,
      message: "User vessel location updated in geofence registry.",
    });
  } catch (error) {
    console.error("POST /api/v1/users/location error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}
