"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type ApplicationStatus = 'clicked' | 'applied' | 'not_applied';

export interface UserJobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  clicked_at: string;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseJobApplicationTrackingReturn {
  trackApplyClick: (jobId: string) => Promise<void>;
  updateApplicationStatus: (jobId: string, status: 'applied' | 'not_applied') => Promise<void>;
  getApplicationStatus: (jobId: string) => Promise<ApplicationStatus | null>;
  getApplicationCount: () => Promise<number>;
  loadApplicationStatuses: (jobIds: string[]) => Promise<void>;
  loadAppliedJobIds: (jobIds: string[]) => Promise<string[]>;
  applicationStatuses: Map<string, ApplicationStatus>;
  loading: boolean;
  error: string | null;
}

export function useJobApplicationTracking(): UseJobApplicationTrackingReturn {
  const [applicationStatuses, setApplicationStatuses] = useState<Map<string, ApplicationStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Track when user clicks "Apply Now"
  const trackApplyClick = useCallback(async (jobId: string) => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if application already exists
      const { data: existing } = await supabase
        .from('user_job_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();

      if (existing) {
        // If already exists and status is not 'clicked', don't update
        if (existing.status !== 'clicked') {
          return;
        }
        // Update clicked_at timestamp
        const { error: updateError } = await supabase
          .from('user_job_applications')
          .update({ clicked_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new application record
        const { error: insertError } = await supabase
          .from('user_job_applications')
          .insert({
            user_id: user.id,
            job_id: jobId,
            status: 'clicked',
            clicked_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setApplicationStatuses(prev => new Map(prev).set(jobId, 'clicked'));

      // Store in sessionStorage for page visibility detection
      const clickedJobs = JSON.parse(sessionStorage.getItem('clicked_jobs') || '[]');
      if (!clickedJobs.includes(jobId)) {
        clickedJobs.push({
          jobId,
          timestamp: Date.now()
        });
        sessionStorage.setItem('clicked_jobs', JSON.stringify(clickedJobs));
      }
    } catch (err) {
      console.error('Error tracking apply click:', err);
      setError(err instanceof Error ? err.message : 'Failed to track apply click');
    }
  }, [supabase]);

  // Update application status (applied or not_applied)
  const updateApplicationStatus = useCallback(async (jobId: string, status: 'applied' | 'not_applied') => {
    try {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: Partial<UserJobApplication> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'applied') {
        updateData.applied_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('user_job_applications')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('job_id', jobId);

      if (updateError) throw updateError;

      // Update local state
      setApplicationStatuses(prev => new Map(prev).set(jobId, status));

      // Remove from sessionStorage
      const clickedJobs = JSON.parse(sessionStorage.getItem('clicked_jobs') || '[]');
      const filtered = clickedJobs.filter((item: { jobId: string }) => item.jobId !== jobId);
      sessionStorage.setItem('clicked_jobs', JSON.stringify(filtered));
    } catch (err) {
      console.error('Error updating application status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update application status');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Get application status for a specific job
  const getApplicationStatus = useCallback(async (jobId: string): Promise<ApplicationStatus | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error: fetchError } = await supabase
        .from('user_job_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record found
          return null;
        }
        throw fetchError;
      }

      return data?.status as ApplicationStatus || null;
    } catch (err) {
      console.error('Error getting application status:', err);
      return null;
    }
  }, [supabase]);

  // Get total application count for the user
  const getApplicationCount = useCallback(async (): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return 0;
      }

      const { count, error: countError } = await supabase
        .from('user_job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'applied');

      if (countError) throw countError;

      return count || 0;
    } catch (err) {
      console.error('Error getting application count:', err);
      return 0;
    }
  }, [supabase]);

  // Load application statuses for multiple jobs
  const loadApplicationStatuses = useCallback(async (jobIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || jobIds.length === 0) {
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_job_applications')
        .select('job_id, status')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      if (fetchError) throw fetchError;

      const statusMap = new Map<string, ApplicationStatus>();
      data?.forEach((item) => {
        statusMap.set(item.job_id, item.status as ApplicationStatus);
      });

      setApplicationStatuses(statusMap);
    } catch (err) {
      console.error('Error loading application statuses:', err);
    }
  }, [supabase]);

  // Load applied job IDs for filtering
  const loadAppliedJobIds = useCallback(async (jobIds: string[]): Promise<string[]> => {
    try {
      if (jobIds.length === 0) {
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from('user_job_applications')
        .select('job_id')
        .eq('user_id', user.id)
        .in('job_id', jobIds)
        .eq('status', 'applied');

      if (fetchError) throw fetchError;

      return (data || []).map(item => item.job_id);
    } catch (err) {
      console.error('Error loading applied job IDs:', err);
      return [];
    }
  }, [supabase]);

  return {
    trackApplyClick,
    updateApplicationStatus,
    getApplicationStatus,
    getApplicationCount,
    loadApplicationStatuses,
    loadAppliedJobIds,
    applicationStatuses,
    loading,
    error
  };
}
