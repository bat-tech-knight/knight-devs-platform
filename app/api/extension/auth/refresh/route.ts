import { NextRequest, NextResponse } from "next/server";
import { createExtensionAuthServerClient } from "@/lib/supabase/extension-auth-server";

export async function POST(request: NextRequest) {
  let body: { refresh_token?: string };
  try {
    body = (await request.json()) as { refresh_token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const refresh_token = typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";
  if (!refresh_token) {
    return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
  }

  try {
    const supabase = createExtensionAuthServerClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Session expired — sign in again" },
        { status: 401 }
      );
    }

    const { access_token, refresh_token: new_refresh, expires_in, expires_at } = data.session;

    return NextResponse.json({
      success: true,
      data: {
        access_token,
        refresh_token: new_refresh ?? refresh_token,
        expires_in,
        expires_at,
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Auth service error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
