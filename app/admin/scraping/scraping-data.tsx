import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth, createServerDataFetcher } from "@/lib/server-auth";

export interface ScrapingConfig {
  id: string;
  name: string;
  search_term: string;
  location: string;
  sites: string[];
  results_wanted: number;
  hours_old?: number;
  is_remote: boolean;
  job_type?: string;
  country_indeed?: string;
  google_search_term?: string;
  distance?: number;
  easy_apply: boolean;
  linkedin_fetch_description: boolean;
  linkedin_company_ids?: string[];
  enforce_annual_salary: boolean;
  description_format: string;
  page_offset?: number;
  log_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getScrapingConfigs(): Promise<ScrapingConfig[]> {
  // Ensure user is authenticated and is admin
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    const { data: configs, error } = await supabase
      .from('scraping_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return configs || [];
  }, 'Fetch scraping configs');
}

export async function createScrapingConfig(config: Omit<ScrapingConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ScrapingConfig> {
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('scraping_config')
      .insert([config])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }, 'Create scraping config');
}

export async function updateScrapingConfig(id: string, config: Partial<ScrapingConfig>): Promise<ScrapingConfig> {
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('scraping_config')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }, 'Update scraping config');
}

export async function deleteScrapingConfig(id: string): Promise<void> {
  await requireAdminAuth();

  return createServerDataFetcher(async () => {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('scraping_config')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }, 'Delete scraping config');
}
