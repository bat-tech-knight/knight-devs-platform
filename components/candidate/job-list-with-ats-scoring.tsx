"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import InfiniteJobList from "./infinite-job-list";
import { useCandidateDiscover } from "./use-candidate-discover";
import { getProfileDisplayName, getStoredActiveProfileId, setStoredActiveProfileId, UserProfileOption } from "@/lib/profile-selection";

export default function JobListWithATSScoring() {
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
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
  } = useCandidateDiscover({ selectedProfileId });

  // Load profiles and current selected profile for ATS/resume workflows
  useEffect(() => {
    const loadCandidateProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          const normalizedProfiles = (userProfiles || []) as UserProfileOption[];
          setProfiles(normalizedProfiles);

          const storedProfileId = getStoredActiveProfileId();
          if (storedProfileId && normalizedProfiles.some((profile) => profile.id === storedProfileId)) {
            setSelectedProfileId(storedProfileId);
          } else {
            setSelectedProfileId(null);
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

  useEffect(() => {
    const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) || null;
    setCandidateProfile(selectedProfile);
  }, [profiles, selectedProfileId]);

  const handleSelectProfile = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = event.target.value || null;
    setSelectedProfileId(profileId);
    if (profileId) {
      setStoredActiveProfileId(profileId);
    }
  };

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
      {profiles.length > 0 && (
        <div className="mb-4 p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
          <label className="block text-sm text-slate-300 mb-2">
            Select profile for ATS and resume actions
          </label>
          <select
            value={selectedProfileId || ""}
            onChange={handleSelectProfile}
            className="w-full md:w-auto min-w-[280px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
          >
            <option value="">Choose a profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {getProfileDisplayName(profile)}
              </option>
            ))}
          </select>
        </div>
      )}

      {!candidateProfile && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Select a profile</strong> to enable ATS scoring and resume generation.
            <a href="/settings/expert" className="ml-2 text-blue-600 hover:underline">
              Manage Profiles →
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
