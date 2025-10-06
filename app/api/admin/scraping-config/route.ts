import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to check if user is admin
async function checkAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isAdmin: false, error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { isAdmin: false, error: "Profile not found" };
  }

  return { isAdmin: profile.role === 'admin', error: null };
}

// GET /api/admin/scraping-config - Get all scraping configs
export async function GET() {
  const { isAdmin, error } = await checkAdminRole();
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from('scraping_config')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/admin/scraping-config - Create new scraping config
export async function POST(request: NextRequest) {
  const { isAdmin, error } = await checkAdminRole();
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'search_term', 'location', 'sites', 'results_wanted'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('scraping_config')
      .insert([body])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
