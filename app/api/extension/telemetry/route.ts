import { NextRequest, NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventType?: string;
      data?: Record<string, unknown>;
    };

    const auth = await getExtensionAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
    }
    const { user } = auth;

    // Telemetry is intentionally non-blocking and best-effort.
    console.info("extension_telemetry", {
      userId: user.id,
      eventType: body.eventType ?? "unknown",
      data: body.data ?? {},
      source: "knight-devs-autofill-extension",
      at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
