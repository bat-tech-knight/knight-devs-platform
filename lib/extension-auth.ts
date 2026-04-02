import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseBearerClient, getBearerTokenFromRequest } from "@/lib/supabase/bearer";

export type ExtensionAuthResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; status: 401 };

/**
 * Prefer Authorization: Bearer (extension). Fall back to cookie session (web app).
 */
export async function getExtensionAuth(request: Request): Promise<ExtensionAuthResult> {
  const bearer = getBearerTokenFromRequest(request);
  if (bearer) {
    const supabase = createSupabaseBearerClient(bearer);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return { ok: false, status: 401 };
    }
    return { ok: true, supabase, user };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401 };
  }
  return { ok: true, supabase, user };
}
