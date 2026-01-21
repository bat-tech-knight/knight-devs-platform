"use client";

import { useEffect, useRef, useState } from "react";
import { Job } from "./job-hooks";
import JobListItem from "./job-list-item";
import { Loader2 } from "lucide-react";

interface InfiniteJobListProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  selectedJob: Job | null;
  onSelectJob: (job: Job) => void;
  onBookmarkJob: (job: Job) => void;
  onDismissJob: (job: Job) => void;
  candidateProfile?: Record<string, unknown>; // Optional candidate profile for ATS scoring
  onTrackApplyClick?: (jobId: string) => Promise<void>; // Function to track Apply Now clicks
  getApplicationStatus?: (jobId: string) => 'clicked' | 'applied' | 'not_applied' | null; // Function to get application status
}

export default function InfiniteJobList({
  jobs,
  loading,
  error,
  hasMore,
  onLoadMore,
  selectedJob,
  onSelectJob,
  onBookmarkJob,
  onDismissJob,
  candidateProfile,
  onTrackApplyClick,
  getApplicationStatus
}: InfiniteJobListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          setIsLoadingMore(true);
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, isLoadingMore, onLoadMore]);

  // Reset loading more state when loading changes
  useEffect(() => {
    if (!loading) {
      setIsLoadingMore(false);
    }
  }, [loading]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error loading jobs</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (jobs.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-400 text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-slate-400">
            Try adjusting your search criteria or check back later for new positions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Jobs List */}
      <div className="space-y-0">
        {jobs.map((job) => (
          <JobListItem
            key={job.id}
            job={job}
            isSelected={selectedJob?.id === job.id}
            onSelect={onSelectJob}
            onBookmark={onBookmarkJob}
            onDismiss={onDismissJob}
            candidateProfile={candidateProfile}
            onTrackApplyClick={onTrackApplyClick}
            applicationStatus={getApplicationStatus ? getApplicationStatus(job.id) : null}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading more jobs...</span>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              Scroll down to load more
            </div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && jobs.length > 0 && (
        <div className="flex justify-center py-8">
            <div className="text-slate-400 text-sm">
              You&apos;ve reached the end of available positions
            </div>
        </div>
      )}

      {/* Initial Loading */}
      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading jobs...</span>
          </div>
        </div>
      )}
    </div>
  );
}
