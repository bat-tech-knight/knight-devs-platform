"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SavedSearch {
  id: string;
  name: string;
  search_term: string;
  location?: string;
  job_type?: string;
  is_remote?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseSavedSearchesOptions {
  userId?: string;
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSavedSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSavedSearches(data || []);
    } catch (err) {
      console.error('Error fetching saved searches:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch saved searches');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const saveSearch = async (searchData: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert([searchData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSavedSearches(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error saving search:', err);
      throw err;
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSavedSearches(prev => prev.filter(search => search.id !== id));
    } catch (err) {
      console.error('Error deleting saved search:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  return {
    savedSearches,
    loading,
    error,
    saveSearch,
    deleteSavedSearch,
    refetch: fetchSavedSearches
  };
}
