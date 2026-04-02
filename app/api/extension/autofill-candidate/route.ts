import { NextRequest, NextResponse } from "next/server";
import { loadExtensionCandidatePayload } from "@/lib/extension-candidate-data";
import { getExtensionAuth } from "@/lib/extension-auth";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  const result = await loadExtensionCandidatePayload(supabase, profileId, user.id);

  if (!result.ok) {
    const status = result.error === "Profile not found" ? 404 : 500;
    return NextResponse.json(
      {
        error: result.error,
        ...(process.env.NODE_ENV === "development" && result.supabaseError
          ? { detail: result.supabaseError }
          : {}),
      },
      { status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
