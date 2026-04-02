import { NextRequest, NextResponse } from "next/server";
import { createExtensionAuthServerClient } from "@/lib/supabase/extension-auth-server";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const supabase = createExtensionAuthServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Invalid email or password" },
        { status: 401 }
      );
    }

    const { access_token, refresh_token, expires_in, expires_at } = data.session;

    return NextResponse.json({
      success: true,
      data: {
        access_token,
        refresh_token,
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
