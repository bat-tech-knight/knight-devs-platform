"use client";

import CandidateHeader from "@/components/candidate/candidate-header";
import SearchBar from "@/components/candidate/search-bar";
import InfiniteJobList from "@/components/candidate/infinite-job-list";
import JobDetailPanel from "@/components/candidate/job-detail-panel";
import { useCandidateDiscover } from "@/components/candidate/use-candidate-discover";

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
    candidateProfile
  } = useCandidateDiscover({
    pageSize: 20,
    enableRealtime: true
  });

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
    <div className="min-h-screen bg-slate-900">
      <CandidateHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Job Discovery
          </h1>
          <p className="text-slate-400">
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
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Complete your profile</strong> to enable ATS scoring for better job matching.
              <a href="/onboarding" className="ml-2 text-blue-600 hover:underline">
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
