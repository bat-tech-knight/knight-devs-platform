import { NextResponse } from "next/server";

/**
 * Public values for the Chrome extension to bootstrap Supabase OAuth (anon key is safe to expose).
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration missing Supabase env" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      supabaseUrl,
      supabaseAnonKey,
    },
  });
}
