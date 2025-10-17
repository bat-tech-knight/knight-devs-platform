"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import InfiniteJobList from "./infinite-job-list";
import { useCandidateDiscover } from "./use-candidate-discover";

export default function JobListWithATSScoring() {
  const [candidateProfile, setCandidateProfile] = useState<Record<string, unknown> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const {
    jobs,
    loading,
    error,
    hasMore,
    loadMoreJobs,
    selectedJob,
    selectJob,
    bookmarkJob,
    dismissJob
  } = useCandidateDiscover();

  // Load candidate profile for ATS scoring
  useEffect(() => {
    const loadCandidateProfile = async () => {
      try {
        const supabase = createClient();
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
      } finally {
        setLoadingProfile(false);
      }
    };

    loadCandidateProfile();
  }, []);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Profile Status */}
      {!candidateProfile && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Complete your profile</strong> to enable ATS scoring for better job matching.
            <a href="/settings/expert" className="ml-2 text-blue-600 hover:underline">
              Complete Profile →
            </a>
          </p>
        </div>
      )}

      {/* Job List with ATS Scoring */}
      <InfiniteJobList
        jobs={jobs}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMoreJobs}
        selectedJob={selectedJob}
        onSelectJob={selectJob}
        onBookmarkJob={bookmarkJob}
        onDismissJob={dismissJob}
        candidateProfile={candidateProfile || undefined}
      />
    </div>
  );
}
