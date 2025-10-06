"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrapingConfig } from "./scraping-data";

export function useScrapingConfigs(initialConfigs: ScrapingConfig[]) {
  const [configs, setConfigs] = useState<ScrapingConfig[]>(initialConfigs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('scraping_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setConfigs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh configs');
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (config: Omit<ScrapingConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('scraping_config')
        .insert([config])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setConfigs(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create config');
      throw err;
    }
  };

  const updateConfig = async (id: string, config: Partial<ScrapingConfig>) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('scraping_config')
        .update(config)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setConfigs(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
      throw err;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('scraping_config')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
      throw err;
    }
  };

  return {
    configs,
    loading,
    error,
    refreshConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}

export function useScrapingConfigForm() {
  const [formData, setFormData] = useState<Partial<ScrapingConfig>>({
    name: '',
    search_term: '',
    location: '',
    sites: ['indeed'],
    results_wanted: 10,
    hours_old: 24,
    is_remote: false,
    job_type: 'full-time',
    country_indeed: 'us',
    google_search_term: '',
    distance: 25,
    easy_apply: false,
    linkedin_fetch_description: true,
    linkedin_company_ids: [],
    enforce_annual_salary: false,
    description_format: 'markdown',
    page_offset: 0,
    log_level: 1,
    is_active: true,
  });

  const updateFormData = (updates: Partial<ScrapingConfig>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      search_term: '',
      location: '',
      sites: ['indeed'],
      results_wanted: 10,
      hours_old: 24,
      is_remote: false,
      job_type: 'full-time',
      country_indeed: 'us',
      google_search_term: '',
      distance: 25,
      easy_apply: false,
      linkedin_fetch_description: true,
      linkedin_company_ids: [],
      enforce_annual_salary: false,
      description_format: 'markdown',
      page_offset: 0,
      log_level: 1,
      is_active: true,
    });
  };

  return {
    formData,
    updateFormData,
    resetForm,
  };
}
