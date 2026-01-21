"use client";

import { useState, useEffect, useCallback } from "react";
import EnhancedCandidateHeader from "@/components/candidate/enhanced-candidate-header";
import SearchBar from "@/components/candidate/search-bar";
import InfiniteJobList from "@/components/candidate/infinite-job-list";
import JobDetailPanel from "@/components/candidate/job-detail-panel";
import ApplicationConfirmationModal from "@/components/candidate/application-confirmation-modal";
import { useCandidateDiscover } from "@/components/candidate/use-candidate-discover";
import { useJobApplicationTracking } from "@/components/candidate/job-application-hooks";

export default function DiscoverPage() {
  const {
    jobs,
    loading,
    error,
    total,
    hasMore,
    filters,
    searchJobs,
    loadMoreJobs,
    selectedJob,
    selectJob,
    bookmarkJob,
    dismissJob,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    candidateProfile,
    pendingApplicationConfirmations,
    removePendingConfirmation
  } = useCandidateDiscover({
    pageSize: 20,
    enableRealtime: true
  });

  // Application tracking
  const {
    trackApplyClick,
    updateApplicationStatus,
    loadApplicationStatuses,
    applicationStatuses
  } = useJobApplicationTracking();

  // Modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingJobForConfirmation, setPendingJobForConfirmation] = useState<string | null>(null);
  const [confirmingApplication, setConfirmingApplication] = useState(false);

  // Load application statuses when jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      const jobIds = jobs.map(job => job.id);
      loadApplicationStatuses(jobIds);
    }
  }, [jobs, loadApplicationStatuses]);

  // Show confirmation modal when there are pending confirmations
  useEffect(() => {
    if (pendingApplicationConfirmations.length > 0 && !showConfirmationModal) {
      const firstPendingJobId = pendingApplicationConfirmations[0];
      const job = jobs.find(j => j.id === firstPendingJobId);
      if (job) {
        setPendingJobForConfirmation(firstPendingJobId);
        setShowConfirmationModal(true);
      }
    }
  }, [pendingApplicationConfirmations, jobs, showConfirmationModal]);

  // Handle confirmation
  const handleConfirmation = useCallback(async (applied: boolean) => {
    if (!pendingJobForConfirmation) return;

    try {
      setConfirmingApplication(true);
      await updateApplicationStatus(
        pendingJobForConfirmation,
        applied ? 'applied' : 'not_applied'
      );
      removePendingConfirmation(pendingJobForConfirmation);
      setShowConfirmationModal(false);
      setPendingJobForConfirmation(null);

      // If there are more pending confirmations, show the next one
      if (pendingApplicationConfirmations.length > 1) {
        const remaining = pendingApplicationConfirmations.filter(id => id !== pendingJobForConfirmation);
        if (remaining.length > 0) {
          const nextJob = jobs.find(j => j.id === remaining[0]);
          if (nextJob) {
            setTimeout(() => {
              setPendingJobForConfirmation(remaining[0]);
              setShowConfirmationModal(true);
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setConfirmingApplication(false);
    }
  }, [pendingJobForConfirmation, updateApplicationStatus, removePendingConfirmation, pendingApplicationConfirmations, jobs]);

  const handleCancelModal = useCallback(() => {
    setShowConfirmationModal(false);
    setPendingJobForConfirmation(null);
  }, []);

  // Get application status for a job
  const getJobApplicationStatus = useCallback((jobId: string) => {
    return applicationStatuses.get(jobId) || null;
  }, [applicationStatuses]);

  const handleSearchChange = (searchTerm: string) => {
    searchJobs({ searchTerm });
  };

  const handleSearch = () => {
    // Trigger search with current filters
    searchJobs({});
  };

  const handleSaveSearch = async (name: string) => {
    try {
      await saveSearch(name);
    } catch (error) {
      console.error('Failed to save search:', error);
      // You could add a toast notification here to inform the user
      alert(error instanceof Error ? error.message : 'Failed to save search');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <EnhancedCandidateHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Job Discovery
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Discover your next career opportunity
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            searchTerm={filters.searchTerm}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            savedSearches={savedSearches}
            onLoadSavedSearch={loadSavedSearch}
            onSaveSearch={handleSaveSearch}
          />
        </div>

        {/* Profile Status */}
        {!candidateProfile && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Complete your profile</strong> to enable ATS scoring for better job matching.
              <a href="/settings/expert" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                Complete Profile →
              </a>
            </p>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Job List */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden h-[calc(100vh-200px)]">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Jobs for you ({total.toLocaleString()})
              </h2>
            </div>
            
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
              onTrackApplyClick={trackApplyClick}
              getApplicationStatus={getJobApplicationStatus}
            />
          </div>

          {/* Right Panel - Job Details - Fixed Position */}
          <div className="lg:sticky lg:top-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden h-[calc(100vh-200px)]">
              <JobDetailPanel
                job={selectedJob}
                onBookmark={bookmarkJob}
                onDismiss={dismissJob}
                candidateProfile={candidateProfile || undefined}
                onTrackApplyClick={trackApplyClick}
                applicationStatus={selectedJob ? getJobApplicationStatus(selectedJob.id) : null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Application Confirmation Modal */}
      <ApplicationConfirmationModal
        visible={showConfirmationModal}
        job={pendingJobForConfirmation ? jobs.find(j => j.id === pendingJobForConfirmation) || null : null}
        onConfirm={handleConfirmation}
        onCancel={handleCancelModal}
        loading={confirmingApplication}
      />
    </div>
  );
}
