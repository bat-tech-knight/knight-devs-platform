import { NextRequest, NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";

export async function GET(request: NextRequest) {
  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { user } = auth;
  return NextResponse.json({
    success: true,
    data: { id: user.id, email: user.email },
  });
}
