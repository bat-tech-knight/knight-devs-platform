"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  // ATS scoring fields
  ats_score?: number;
  ats_score_breakdown?: {
    overall_score: number;
    skills_match_score: number;
    experience_match_score: number;
    keyword_match_score: number;
    cultural_fit_score: number;
    detailed_analysis?: Record<string, unknown>;
    recommendations?: string[];
    strengths?: string[];
    weaknesses?: string[];
    score_explanation?: string;
  };
  ats_score_calculated_at?: string;
}

export interface UseJobsOptions {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  location?: string;
  jobType?: string;
  isRemote?: boolean;
  enableRealtime?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const {
    limit = 20,
    offset = 0,
    searchTerm,
    location,
    jobType,
    isRemote,
    enableRealtime = true
  } = options;

  const supabase = createClient();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .order('scraped_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      if (isRemote !== undefined) {
        query = query.eq('is_remote', isRemote);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setJobs(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [limit, offset, searchTerm, location, jobType, isRemote]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('jobs-changes')
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
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime]);

  return {
    jobs,
    loading,
    error,
    total,
    refetch: fetchJobs
  };
}

export function useJobStats() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    remoteJobs: 0,
    recentJobs: 0,
    topCompanies: [] as { company_name: string; count: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total jobs count
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      // Get remote jobs count
      const { count: remoteJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_remote', true);

      // Get recent jobs (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('scraped_at', sevenDaysAgo.toISOString());

      // Get top companies
      const { data: topCompanies } = await supabase
        .from('jobs')
        .select('company_name')
        .not('company_name', 'is', null)
        .limit(1000); // Get a large sample to count

      const companyCounts = topCompanies?.reduce((acc, job) => {
        if (job.company_name) {
          acc[job.company_name] = (acc[job.company_name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topCompaniesList = Object.entries(companyCounts)
        .map(([company_name, count]) => ({ company_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        totalJobs: totalJobs || 0,
        remoteJobs: remoteJobs || 0,
        recentJobs: recentJobs || 0,
        topCompanies: topCompaniesList
      });
    } catch (err) {
      console.error('Error fetching job stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
