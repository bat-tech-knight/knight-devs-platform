"use client";

import { useState } from "react";
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
}

export interface ScrapingRun {
  id: string;
  scraping_config_id: string;
  status: 'running' | 'completed' | 'failed';
  jobs_found: number;
  jobs_saved: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  total_jobs: number;
  jobs_by_site: Record<string, number>;
  latest_run: ScrapingRun | null;
}

export interface DetailedError {
  error: string;
  error_type?: string;
  validation_errors?: string[];
  warnings?: string[];
  received_config?: Record<string, unknown>;
  supported_sites?: string[];
  supported_countries?: string[];
  supported_job_types?: string[];
}

// Update a scraping configuration in Supabase
export async function updateScrapingConfig(configId: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scraping_config')
    .update(updates)
    .eq('id', configId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function useJobExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<DetailedError | null>(null);

  const executeScraping = async (configId: string) => {
    setIsExecuting(true);
    setError(null);
    setDetailedError(null);

    try {
      const supabase = createClient();

      // Create scraping run (running)
      const { data: runRow, error: runCreateError } = await supabase
        .from('scraping_runs')
        .insert({
          scraping_config_id: configId,
          status: 'running',
          jobs_found: 0,
          jobs_saved: 0
        })
        .select()
        .single();

      if (runCreateError || !runRow) {
        throw new Error(runCreateError?.message || 'Failed to create scraping run');
      }

      // Fetch scraping configuration from Supabase to build full scrape payload
      const { data: config, error: cfgErr } = await supabase
        .from('scraping_config')
        .select('*')
        .eq('id', configId)
        .single();
      if (cfgErr || !config) {
        throw new Error(cfgErr?.message || 'Scraping configuration not found');
      }

      // Normalize values for jobspy/Flask
      const siteName = Array.isArray(config.sites) && config.sites.length > 0 ? config.sites[0] : 'indeed';
      const normalizeCountry = (c: unknown) => {
        if (!c) return 'usa';
        const s = String(c).toLowerCase();
        return ['usa', 'us', 'united states'].includes(s) ? 'usa' : s;
      };
      const isRemote = !!config.is_remote;
      const resultsWanted = config.results_wanted != null ? Number(config.results_wanted) : 15;
      const distanceVal = config.distance != null ? Number(config.distance) : undefined;
      const hoursOldVal = config.hours_old != null ? Number(config.hours_old) : undefined;
      const jobTypeVal = config.job_type ? String(config.job_type).toLowerCase().replace(/\s|-/g, '') : undefined;

      // If remote, avoid constraining by location/distance for Indeed
      const effectiveLocation = isRemote ? undefined : (config.location || undefined);
      const effectiveDistance = isRemote ? undefined : distanceVal;

      // Map DB config to Flask/jobspy expected payload
      const scrapePayload = {
        site_name: siteName,
        search_term: config.search_term,
        google_search_term: config.google_search_term || undefined,
        location: effectiveLocation,
        distance: effectiveDistance,
        is_remote: isRemote,
        job_type: jobTypeVal,
        easy_apply: typeof config.easy_apply === 'boolean' ? config.easy_apply : undefined,
        results_wanted: resultsWanted,
        country_indeed: normalizeCountry(config.country_indeed),
        linkedin_fetch_description: !!config.linkedin_fetch_description,
        linkedin_company_ids: config.linkedin_company_ids || undefined,
        offset: config.page_offset != null ? Number(config.page_offset) : 0,
        hours_old: hoursOldVal,
        enforce_annual_salary: !!config.enforce_annual_salary,
        description_format: config.description_format || 'markdown',
      };
      console.log("scrapePayload", scrapePayload)

      // Call Flask via Next.js proxy/rewrite (see next.config.ts)
      const response = await fetch(`/api/jobs/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapePayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Store detailed error information
        if (result.validation_errors || result.error_type) {
          setDetailedError({
            error: result.error || 'Scraping execution failed',
            error_type: result.error_type,
            validation_errors: result.validation_errors,
            warnings: result.warnings,
            received_config: result.received_config,
            supported_sites: result.supported_sites,
            supported_countries: result.supported_countries,
            supported_job_types: result.supported_job_types
          });
        }
        
        const errorMessage = result.validation_errors && result.validation_errors.length > 0 
          ? `Validation failed: ${result.validation_errors.join(', ')}`
          : result.error || 'Scraping execution failed';
        
        // Update run => failed
        await supabase
          .from('scraping_runs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString()
          })
          .eq('id', runRow.id);

        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Client-side: upsert scraped jobs into Supabase by job_id
      let jobsSavedCount = 0;
      const jobsArray: unknown[] = Array.isArray(result.jobs) ? result.jobs : [];
      if (jobsArray.length > 0) {
        const toArray = (val: unknown) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            return val
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
          return null;
        };

        const mapped = jobsArray.map((job) => {
          const j = job as Record<string, unknown>;
          return {
          scraping_config_id: configId,
          job_id: (j.id as string) || null,
          title: (j.title as string) || '',
          company_name: (j.company as string) || '',
          company_url: j.company_url as string | undefined,
          job_url: (j.job_url as string) || '',
          job_url_direct: j.job_url_direct as string | undefined,
          location: j.location as string | undefined,
          description: j.description as string | undefined,
          job_type: j.job_type as string | undefined,
          compensation_min: j.min_amount as number | undefined,
          compensation_max: j.max_amount as number | undefined,
          compensation_currency: (j.currency as string) || 'USD',
          compensation_interval: j.interval as string | undefined,
          date_posted: j.date_posted as string | undefined,
          emails: toArray(j.emails as unknown),
          is_remote: j.is_remote as boolean | undefined,
          listing_type: j.listing_type as string | undefined,
          job_level: j.job_level as string | undefined,
          company_industry: j.company_industry as string | undefined,
          company_addresses: j.company_addresses as string | undefined,
          company_num_employees: j.company_num_employees as string | undefined,
          company_revenue: j.company_revenue as string | undefined,
          company_description: j.company_description as string | undefined,
          company_logo: j.company_logo as string | undefined,
          banner_photo_url: j.banner_photo_url as string | undefined,
          job_function: j.job_function as string | undefined,
          skills: toArray(j.skills as unknown) as string[] | null,
          experience_range: j.experience_range as string | undefined,
          company_rating: j.company_rating as number | undefined,
          company_reviews_count: j.company_reviews_count as number | undefined,
          vacancy_count: j.vacancy_count as number | undefined,
          work_from_home_type: j.work_from_home_type as string | undefined,
          site: (j.site as string) || '',
          salary_source: j.salary_source as string | undefined,
        }});

        // Upsert in chunks by job_id (rows without job_id will insert as new rows)
        const chunkSize = 100;
        for (let i = 0; i < mapped.length; i += chunkSize) {
          const chunk = mapped.slice(i, i + chunkSize);
          const { data, error: upsertError } = await supabase
            .from('jobs')
            .upsert(chunk, { onConflict: 'job_id', ignoreDuplicates: false })
            .select('id');
          if (upsertError) throw new Error(upsertError.message);
          jobsSavedCount += data ? data.length : chunk.length;
        }
      }

      // Update run => completed
      await supabase
        .from('scraping_runs')
        .update({
          status: 'completed',
          jobs_found: jobsArray.length,
          jobs_saved: jobsSavedCount,
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(result.scraping_time_seconds || 0)
        })
        .eq('id', runRow.id);

      return {
        success: true,
        scraping_run_id: runRow.id,
        jobs_found: jobsArray.length,
        jobs_saved: jobsSavedCount,
        scraping_time_seconds: result.scraping_time_seconds,
        message: `Successfully scraped and saved ${jobsSavedCount} jobs`
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute scraping';
      if (!error) setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const clearError = () => {
    setError(null);
    setDetailedError(null);
  };

  return {
    isExecuting,
    error,
    detailedError,
    executeScraping,
    clearError,
  };
}

export function useJobs(configId: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchJobs = async (nextPage: number = page, nextPageSize: number = pageSize) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // total count
      const { count, error: countError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('scraping_config_id', configId);
      if (countError) throw new Error(countError.message);
      setTotal(count || 0);

      const from = (nextPage - 1) * nextPageSize;
      const to = from + nextPageSize - 1;
      const { data, error: queryError } = await supabase
        .from('jobs')
        .select('*')
        .eq('scraping_config_id', configId)
        .order('date_posted', { ascending: false })
        .range(from, to);

      if (queryError) {
        throw new Error(queryError.message || 'Failed to fetch jobs');
      }

      setJobs(data || []);
      setPage(nextPage);
      setPageSize(nextPageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    loading,
    error,
    page,
    pageSize,
    total,
    fetchJobs,
    setPage,
    setPageSize,
  };
}

export function useScrapingRuns(configId: string) {
  const [runs, setRuns] = useState<ScrapingRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchRuns = async (nextPage: number = page, nextPageSize: number = pageSize) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { count, error: countError } = await supabase
        .from('scraping_runs')
        .select('*', { count: 'exact', head: true })
        .eq('scraping_config_id', configId);
      if (countError) throw new Error(countError.message);
      setTotal(count || 0);

      const from = (nextPage - 1) * nextPageSize;
      const to = from + nextPageSize - 1;
      const { data, error: queryError } = await supabase
        .from('scraping_runs')
        .select('*')
        .eq('scraping_config_id', configId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (queryError) throw new Error(queryError.message);

      setRuns((data as ScrapingRun[] | null) ?? []);
      setPage(nextPage);
      setPageSize(nextPageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scraping runs');
    } finally {
      setLoading(false);
    }
  };

  return {
    runs,
    loading,
    error,
    page,
    pageSize,
    total,
    fetchRuns,
    setPage,
    setPageSize,
  };
}

export function useJobStats(configId: string) {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // total jobs
      const { count: totalJobs, error: countError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('scraping_config_id', configId);
      if (countError) throw new Error(countError.message);

      // jobs by site
      const { data: jobsBySiteRows, error: siteError } = await supabase
        .from('jobs')
        .select('site')
        .eq('scraping_config_id', configId);
      if (siteError) throw new Error(siteError.message);
      const jobsBySite: Record<string, number> = {};
      (jobsBySiteRows || []).forEach((r: { site: string | null }) => {
        const key = r.site || 'unknown';
        jobsBySite[key] = (jobsBySite[key] || 0) + 1;
      });

      // latest run
      const { data: latestRun, error: runError } = await supabase
        .from('scraping_runs')
        .select('*')
        .eq('scraping_config_id', configId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      // runError allowed if no rows; handle null
      const latest = runError ? null : (latestRun as ScrapingRun);

      setStats({
        total_jobs: totalJobs || 0,
        jobs_by_site: jobsBySite,
        latest_run: latest,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job stats');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
    refreshStats,
  };
}
