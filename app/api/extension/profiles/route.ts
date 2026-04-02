import { NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";
import { getProfileDisplayName } from "@/lib/profile-selection";

export async function GET(request: Request) {
  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const profiles = (data ?? []).map((profile) => ({
    id: profile.id,
    role: profile.role,
    displayName: getProfileDisplayName(profile),
  }));

  return NextResponse.json({ success: true, data: profiles });
}
