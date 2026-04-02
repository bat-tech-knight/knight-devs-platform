import { NextRequest, NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";
import { buildBuiltinQuestionKey, buildQuestionKey } from "@/lib/question-key";
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

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  const questionKey = request.nextUrl.searchParams.get("questionKey");
  const builtinKey = request.nextUrl.searchParams.get("builtinKey")?.trim();

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  const owned = await assertProfileOwned(supabase, profileId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (builtinKey) {
    const canonicalKey = buildBuiltinQuestionKey(builtinKey);
    const { data, error } = await supabase
      .from("saved_application_answers")
      .select("*")
      .eq("profile_id", profileId)
      .eq("question_key", canonicalKey)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data ?? null });
  }

  if (questionKey) {
    const { data, error } = await supabase
      .from("saved_application_answers")
      .select("*")
      .eq("profile_id", profileId)
      .eq("question_key", questionKey)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data ?? null });
  }

  const { data, error } = await supabase
    .from("saved_application_answers")
    .select("*")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to list answers" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  let body: {
    profileId?: string;
    answerText?: string;
    labelSnapshot?: string;
    source?: string;
    hostname?: string;
    externalFieldId?: string | null;
    questionKey?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profileId?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const owned = await assertProfileOwned(supabase, profileId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const labelSnapshot = (body.labelSnapshot ?? "").trim().slice(0, 2000);
  const answerText = typeof body.answerText === "string" ? body.answerText : "";
  const source = (body.source ?? "generic").trim().toLowerCase() || "generic";
  const hostname = (body.hostname ?? "").trim().toLowerCase() || "unknown";
  const externalFieldId = body.externalFieldId?.trim() || null;

  const questionKey =
    body.questionKey?.trim() ||
    buildQuestionKey({
      source,
      hostname,
      externalFieldId,
      labelText: labelSnapshot || "untitled",
    });

  const row = {
    profile_id: profileId,
    question_key: questionKey,
    label_snapshot: labelSnapshot || questionKey,
    answer_text: answerText,
    source,
    hostname: hostname || null,
    external_field_id: externalFieldId,
  };

  const { data, error } = await supabase
    .from("saved_application_answers")
    .upsert(row, { onConflict: "profile_id,question_key" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const profileId = request.nextUrl.searchParams.get("profileId");

  if (!id || !profileId) {
    return NextResponse.json({ error: "id and profileId are required" }, { status: 400 });
  }

  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  const owned = await assertProfileOwned(supabase, profileId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("saved_application_answers")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
