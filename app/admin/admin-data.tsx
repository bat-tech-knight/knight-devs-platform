import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth, createServerDataFetcher } from "@/lib/server-auth";

export interface AdminStats {
  configCount: number;
  userCount: number;
  activeConfigCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export async function getAdminData(): Promise<AdminStats> {
  // Ensure user is authenticated and is admin
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    // Get stats in parallel
    const [configResult, userResult, activeConfigResult] = await Promise.all([
      supabase
        .from('scraping_config')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('scraping_config')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
    ]);

    return {
      configCount: configResult.count || 0,
      userCount: userResult.count || 0,
      activeConfigCount: activeConfigResult.count || 0,
    };
  }, 'Fetch admin statistics');
}

export async function getAdminUser(): Promise<AdminUser> {
  const { user, profile } = await requireAdminAuth();

  return {
    id: user.id,
    email: user.email || '',
    role: profile.role,
  };
}
