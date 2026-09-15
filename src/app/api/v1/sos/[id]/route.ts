import { NextRequest, NextResponse } from "next/server";
import { ServerSOSStore } from "@/features/sos/server-store";
import { SOSStatus } from "@/features/sos/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const report = ServerSOSStore.getReportById(id);

    if (!report) {
      return NextResponse.json({ error: "SOS report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/v1/sos/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve incident" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, note, actor } = body as {
      status: SOSStatus;
      note?: string;
      actor?: string;
    };

    if (!status) {
      return NextResponse.json({ error: "Missing status in update body" }, { status: 400 });
    }

    const updated = ServerSOSStore.updateStatus(id, status, actor, note);

    if (!updated) {
      return NextResponse.json({ error: "SOS report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Incident status updated to ${status}`,
      report: updated,
    });
  } catch (error) {
    console.error("PATCH /api/v1/sos/[id] error:", error);
    return NextResponse.json({ error: "Failed to update incident status" }, { status: 500 });
  }
}
