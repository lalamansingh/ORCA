import { NextRequest, NextResponse } from "next/server";
import { ServerSOSStore } from "@/features/sos/server-store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    let actor = "Coast Guard Operations Room";
    let note = "Emergency distress signal acknowledged by coastal authorities. Rescue coordination underway.";

    try {
      const body = await request.json();
      if (body.actor) actor = body.actor;
      if (body.note) note = body.note;
    } catch {
      // Body optional
    }

    const updated = ServerSOSStore.updateStatus(id, "ACKNOWLEDGED", actor, note);

    if (!updated) {
      return NextResponse.json({ error: "SOS report not found" }, { status: 404 });
    }

    console.log(`[AUTHORITY_ACK] SOS ${id} ACKNOWLEDGED by ${actor}`);

    return NextResponse.json({
      success: true,
      message: "SOS acknowledged successfully. Reverse notification dispatched to user vessel.",
      report: updated,
    });
  } catch (error) {
    console.error("POST /api/v1/sos/[id]/acknowledge error:", error);
    return NextResponse.json({ error: "Failed to acknowledge SOS incident" }, { status: 500 });
  }
}
