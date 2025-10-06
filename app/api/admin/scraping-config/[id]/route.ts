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

// GET /api/admin/scraping-config/[id] - Get specific scraping config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, error } = await checkAdminRole();
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from('scraping_config')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Scraping config not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/admin/scraping-config/[id] - Update scraping config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, error } = await checkAdminRole();
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await params;
    
    // Remove id from body if present (shouldn't be updated)
    delete body.id;
    delete body.created_at;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('scraping_config')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Scraping config not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

// DELETE /api/admin/scraping-config/[id] - Delete scraping config
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, error } = await checkAdminRole();
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from('scraping_config')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Scraping config deleted successfully" });
}
