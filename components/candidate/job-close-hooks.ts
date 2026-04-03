"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UseJobCloseReturn {
  closeJob: (jobId: string) => Promise<void>;
  reopenJob: (jobId: string) => Promise<void>;
  isJobClosed: (jobId: string) => Promise<boolean>;
  loadClosedJobIds: (jobIds: string[]) => Promise<string[]>;
  closedJobIds: Set<string>;
  loading: boolean;
  error: string | null;
}

export function useJobClose(): UseJobCloseReturn {
  const [closedJobIds, setClosedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Close a job (mark as dismissed)
  const closeJob = useCallback(async (jobId: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if already closed
      const { data: existing } = await supabase
        .from('user_closed_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();

      if (existing) {
        setClosedJobIds(prev => {
          if (prev.has(jobId)) return prev;
          const next = new Set(prev);
          next.add(jobId);
          return next;
        });
        return;
      }

      // Insert new closed job record
      const { error: insertError } = await supabase
        .from('user_closed_jobs')
        .insert({
          user_id: user.id,
          job_id: jobId,
          closed_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setClosedJobIds(prev => {
        if (prev.has(jobId)) return prev;
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
    } catch (err) {
      console.error('Error closing job:', err);
      setError(err instanceof Error ? err.message : 'Failed to close job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Reopen a job (remove from closed jobs)
  const reopenJob = useCallback(async (jobId: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('user_closed_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);

      if (deleteError) throw deleteError;

      // Update local state
      setClosedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } catch (err) {
      console.error('Error reopening job:', err);
      setError(err instanceof Error ? err.message : 'Failed to reopen job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check if a job is closed
  const isJobClosed = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      // Check local state first
      if (closedJobIds.has(jobId)) {
        return true;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data, error: fetchError } = await supabase
        .from('user_closed_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record found
          return false;
        }
        throw fetchError;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking if job is closed:', err);
      return false;
    }
  }, [supabase, closedJobIds]);

  // Load closed job IDs for a batch of jobs
  const loadClosedJobIds = useCallback(async (jobIds: string[]): Promise<string[]> => {
    try {
      if (jobIds.length === 0) {
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from('user_closed_jobs')
        .select('job_id')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      if (fetchError) throw fetchError;

      const closedIds = (data || []).map(item => item.job_id);

      // Only update state when membership changes. A new Set() on every fetch
      // would change `closedJobIds` by reference, which recreates `fetchJobs` in
      // use-candidate-discover and retriggers effects that call fetchJobs again.
      setClosedJobIds(prev => {
        if (closedIds.length === 0) {
          return prev;
        }
        let changed = false;
        const next = new Set(prev);
        for (const id of closedIds) {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      return closedIds;
    } catch (err) {
      console.error('Error loading closed job IDs:', err);
      return [];
    }
  }, [supabase]);

  return {
    closeJob,
    reopenJob,
    isJobClosed,
    loadClosedJobIds,
    closedJobIds,
    loading,
    error
  };
}
