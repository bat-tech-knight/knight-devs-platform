"use client";

import CandidateHeader from "@/components/candidate/candidate-header";
import FilterButtons from "@/components/candidate/filter-buttons";
import JobCard from "@/components/candidate/job-card";
import { useJobs } from "@/components/candidate/job-hooks";
import { Info, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DiscoverPage() {
  const [jobType, setJobType] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(12);

  const { jobs, loading, error, total, refetch } = useJobs({
    limit: pageSize,
    offset: currentPage * pageSize,
    jobType: jobType || undefined,
    isRemote: isRemote,
    enableRealtime: true
  });


  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleFilterChange = (filterType: string) => {
    switch (filterType) {
      case 'all':
        setJobType('');
        setIsRemote(undefined);
        break;
      case 'direct':
        setJobType('full-time');
        setIsRemote(undefined);
        break;
      case 'external':
        setJobType('contract');
        setIsRemote(undefined);
        break;
      case 'agency':
        setJobType('part-time');
        setIsRemote(undefined);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <CandidateHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title and Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-white">
              Positions you might like ({total.toLocaleString()})
            </h1>
            <Info className="w-5 h-5 text-slate-400" />
          </div>
          <FilterButtons onFilterChange={handleFilterChange} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">Error loading jobs: {error}</p>
            <button 
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-slate-400">Loading jobs...</span>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading || jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Load More Button */}
            {jobs.length < total && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Load More Positions
                </button>
              </div>
            )}

            {/* No More Jobs */}
            {jobs.length >= total && jobs.length > 0 && (
              <div className="text-center mt-12">
                <p className="text-slate-400">You&apos;ve reached the end of available positions</p>
              </div>
            )}
          </>
        ) : null}

        {/* Empty State */}
        {!loading && jobs.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search criteria or check back later for new positions.
            </p>
            <button 
              onClick={refetch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
