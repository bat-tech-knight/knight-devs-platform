import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Generic function to check admin authentication
 * Redirects to login if not authenticated or to protected if not admin
 */
export async function requireAdminAuth() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    redirect("/protected");
  }

  return { user, profile };
}

/**
 * Generic function to check user authentication
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return { user };
}

/**
 * Generic function to get user profile
 * Returns null if no profile found
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return profile;
}

/**
 * Generic function to handle Supabase errors
 */
export function handleSupabaseError(error: unknown, operation: string): never {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  throw new Error(`${operation} failed: ${message}`);
}

/**
 * Generic function to create a server-side data fetcher with error handling
 */
export async function createServerDataFetcher<T>(
  fetcher: () => Promise<T>,
  operation: string
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    handleSupabaseError(error, operation);
  }
}
