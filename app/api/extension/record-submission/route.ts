import { NextRequest, NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

async function assertProfileOwned(
  supabase: SupabaseClient,
  profileId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

function safeHostname(pageUrl: string): string | null {
  try {
    return new URL(pageUrl).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  let body: {
    profileId?: string;
    pageUrl?: string;
    pageTitle?: string;
    notes?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profileId?.trim();
  const pageUrlRaw = typeof body.pageUrl === "string" ? body.pageUrl.trim() : "";
  const pageTitle = (typeof body.pageTitle === "string" ? body.pageTitle : "").trim().slice(0, 500);
  const notes =
    typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 500) : null;

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }
  if (!pageUrlRaw || !isHttpUrl(pageUrlRaw)) {
    return NextResponse.json({ error: "pageUrl must be an http(s) URL" }, { status: 400 });
  }

  const pageUrl = pageUrlRaw.slice(0, 2048);
  const hostname = safeHostname(pageUrl);

  const owned = await assertProfileOwned(supabase, profileId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("extension_external_submissions")
    .insert({
      profile_id: profileId,
      page_url: pageUrl,
      page_title: pageTitle,
      hostname,
      notes,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to record submission" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
