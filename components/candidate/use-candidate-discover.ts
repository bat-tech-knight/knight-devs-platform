"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useATSScoring, ATSScoreResult } from "./ats-scoring-hooks";

export interface Job {
  id: string;
  scraping_config_id: string;
  title: string;
  company_name?: string;
  company_url?: string;
  job_url: string;
  job_url_direct?: string;
  location?: string;
  description?: string;
  job_type?: string;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_interval?: string;
  date_posted?: string;
  emails?: string[];
  is_remote?: boolean;
  listing_type?: string;
  job_level?: string;
  company_industry?: string;
  company_addresses?: string;
  company_num_employees?: string;
  company_revenue?: string;
  company_description?: string;
  company_logo?: string;
  banner_photo_url?: string;
  job_function?: string;
  skills?: string[];
  experience_range?: string;
  company_rating?: number;
  company_reviews_count?: number;
  vacancy_count?: number;
  work_from_home_type?: string;
  site: string;
  salary_source?: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

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

export interface DiscoverSearchFilters {
  searchTerm: string;
  location?: string;
  jobType?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}

export interface UseCandidateDiscoverOptions {
  initialFilters?: Partial<DiscoverSearchFilters>;
  pageSize?: number;
  enableRealtime?: boolean;
}

export function useCandidateDiscover(options: UseCandidateDiscoverOptions = {}) {
  const {
    initialFilters = {},
    pageSize = 20,
    enableRealtime = true
  } = options;

  // State for jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // State for search and filters
  const [filters, setFilters] = useState<DiscoverSearchFilters>({
    searchTerm: '',
    ...initialFilters
  });

  // State for selected job
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // State for saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(true);
  
  // State for candidate profile and ATS scores
  const [candidateProfile, setCandidateProfile] = useState<Record<string, unknown> | null>(null);
  const [atsScores, setAtsScores] = useState<Record<string, ATSScoreResult>>({});

  const supabase = createClient();
  const { getATSScores } = useATSScoring();

  // Load candidate profile
  const loadCandidateProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCandidateProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
    }
  }, [supabase]);

  // Load ATS scores for jobs
  const loadATSScores = useCallback(async (jobIds: string[]) => {
    if (!candidateProfile?.id || jobIds.length === 0) return;
    
    try {
      const scores = await getATSScores(candidateProfile.id as string, jobIds);
      setAtsScores(prev => ({ ...prev, ...scores }));
    } catch (error) {
      console.error('Error loading ATS scores:', error);
    }
  }, [candidateProfile?.id, getATSScores]);

  // Fetch jobs with current filters and pagination
  const fetchJobs = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const offset = page * pageSize;
      
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .order('scraped_at', { ascending: false });

      // Apply search filters
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters.isRemote !== undefined) {
        query = query.eq('is_remote', filters.isRemote);
      }

      if (filters.salaryMin) {
        query = query.gte('compensation_min', filters.salaryMin);
      }

      if (filters.salaryMax) {
        query = query.lte('compensation_max', filters.salaryMax);
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const newJobs = data || [];
      
      if (append) {
        setJobs(prev => [...prev, ...newJobs]);
      } else {
        setJobs(newJobs);
        // Reset selected job if it's not in the new results
        if (selectedJob && !newJobs.find(job => job.id === selectedJob.id)) {
          setSelectedJob(null);
        }
      }

      setTotal(count || 0);
      setHasMore(newJobs.length === pageSize);
      setCurrentPage(page);
      
      // Load ATS scores for the new jobs
      if (candidateProfile?.id && newJobs.length > 0) {
        const jobIds = newJobs.map(job => job.id);
        loadATSScores(jobIds);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, pageSize, selectedJob, supabase, candidateProfile?.id, loadATSScores]);

  // Load more jobs (infinite scroll)
  const loadMoreJobs = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchJobs(currentPage + 1, true);
    }
  }, [fetchJobs, currentPage, loadingMore, hasMore]);

  // Search jobs with new filters
  const searchJobs = useCallback((newFilters: Partial<DiscoverSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(0);
    setHasMore(true);
  }, [filters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setFilters({ searchTerm: '' });
    setCurrentPage(0);
    setHasMore(true);
  }, []);

  // Select a job
  const selectJob = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  // Bookmark a job
  const bookmarkJob = useCallback(async (job: Job) => {
    try {
      // Here you would implement bookmarking logic
      // For now, just log it
      console.log('Bookmarking job:', job.id);
      // You could add a bookmarked_jobs table and store user bookmarks
    } catch (err) {
      console.error('Error bookmarking job:', err);
    }
  }, []);

  // Dismiss a job
  const dismissJob = useCallback(async (job: Job) => {
    try {
      // Here you would implement dismissing logic
      // For now, just remove it from the current view
      setJobs(prev => prev.filter(j => j.id !== job.id));
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error dismissing job:', err);
    }
  }, [selectedJob]);

  // Fetch saved searches
  const fetchSavedSearches = useCallback(async () => {
    try {
      setSavedSearchesLoading(true);
      
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, just return empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation "saved_searches" does not exist')) {
          console.log('Saved searches table not found, skipping saved searches functionality');
          setSavedSearches([]);
          return;
        }
        throw error;
      }

      setSavedSearches(data || []);
    } catch (err) {
      console.error('Error fetching saved searches:', err);
      // Set empty array on error to prevent UI issues
      setSavedSearches([]);
    } finally {
      setSavedSearchesLoading(false);
    }
  }, [supabase]);

  // Save a search
  const saveSearch = useCallback(async (name: string) => {
    try {
      const searchData = {
        name,
        search_term: filters.searchTerm,
        location: filters.location,
        job_type: filters.jobType,
        is_remote: filters.isRemote
      };

      const { data, error } = await supabase
        .from('saved_searches')
        .insert([searchData])
        .select()
        .single();

      if (error) {
        // If table doesn't exist, show user-friendly message
        if (error.code === 'PGRST116' || error.message?.includes('relation "saved_searches" does not exist')) {
          throw new Error('Saved searches feature is not available yet. Please run the database migration.');
        }
        throw error;
      }

      setSavedSearches(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error saving search:', err);
      throw err;
    }
  }, [filters, supabase]);

  // Load a saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    const newFilters: DiscoverSearchFilters = {
      searchTerm: savedSearch.search_term,
      location: savedSearch.location,
      jobType: savedSearch.job_type,
      isRemote: savedSearch.is_remote
    };
    
    setFilters(newFilters);
    setCurrentPage(0);
    setHasMore(true);
  }, []);

  // Delete a saved search
  const deleteSavedSearch = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) {
        // If table doesn't exist, just return silently
        if (error.code === 'PGRST116' || error.message?.includes('relation "saved_searches" does not exist')) {
          return;
        }
        throw error;
      }

      setSavedSearches(prev => prev.filter(search => search.id !== id));
    } catch (err) {
      console.error('Error deleting saved search:', err);
      throw err;
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    fetchJobs(0);
    fetchSavedSearches();
  }, [fetchJobs, fetchSavedSearches, supabase]);

  // Set up real-time subscription for jobs
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('candidate-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        (payload) => {
          console.log('Jobs table changed:', payload);
          // Refresh jobs when there are changes
          fetchJobs(0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, fetchJobs, supabase]);

  // Load candidate profile on mount
  useEffect(() => {
    loadCandidateProfile();
  }, [loadCandidateProfile]);

  return {
    // Jobs data
    jobs,
    loading,
    loadingMore,
    error,
    total,
    hasMore,
    
    // Search and filters
    filters,
    searchJobs,
    clearSearch,
    
    // Pagination
    loadMoreJobs,
    
    // Job selection
    selectedJob,
    selectJob,
    
    // Job actions
    bookmarkJob,
    dismissJob,
    
    // Saved searches
    savedSearches,
    savedSearchesLoading,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    
    // ATS scoring
    candidateProfile,
    atsScores,
    
    // Utilities
    refetch: () => fetchJobs(0)
  };
}
