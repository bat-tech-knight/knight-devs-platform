import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBearerTokenFromRequest } from "@/lib/supabase/bearer";

/**
 * Revokes the session server-side when the access token is still valid.
 * The extension clears local storage regardless; this is best-effort.
 */
export async function POST(request: NextRequest) {
  const token = getBearerTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Authorization Bearer token required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ success: true, warning: error.message });
  }
  return NextResponse.json({ success: true });
}
