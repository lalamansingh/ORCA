import { NextRequest, NextResponse } from "next/server";
import { ServerSOSStore } from "@/features/sos/server-store";
import { SOSReport } from "@/features/sos/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    let reports = ServerSOSStore.getAllReports();

    if (status && status !== "ALL") {
      reports = reports.filter((r) => r.status === status);
    }

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("GET /api/v1/sos error:", error);
    return NextResponse.json({ error: "Failed to fetch SOS reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SOSReport = await request.json();

    if (!body.sos_id || !body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: "Invalid SOS payload. Requires sos_id, latitude, and longitude." },
        { status: 400 }
      );
    }

    const saved = ServerSOSStore.saveReport(body);

    console.log(
      `[API_SOS] Inbound distress received: sos_id=${saved.sos_id} lat=${saved.latitude} lon=${saved.longitude} status=${saved.status}`
    );

    return NextResponse.json({
      success: true,
      message: "Distress report received and dispatched to Authority Dashboard.",
      sos_id: saved.sos_id,
      status: saved.status,
      report: saved,
    });
  } catch (error) {
    console.error("POST /api/v1/sos error:", error);
    return NextResponse.json({ error: "Failed to process SOS distress report" }, { status: 500 });
  }
}
