"use client";

import { 
  Bookmark, 
  ThumbsDown, 
  ExternalLink, 
  MapPin, 
  DollarSign,
  Clock,
  Star,
  Lightbulb,
  Building2,
  Users,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import { Job } from "./job-hooks";
import { useState, useRef, useEffect } from "react";

interface JobDetailPanelProps {
  job: Job | null;
  onBookmark: (job: Job) => void;
  onDismiss: (job: Job) => void;
}

export default function JobDetailPanel({ job, onBookmark, onDismiss }: JobDetailPanelProps) {
  const [showMoreSkills, setShowMoreSkills] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when job changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [job?.id]);

  if (!job) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Select a job</h3>
          <p className="text-slate-400">
            Choose a job from the list to view details
          </p>
        </div>
      </div>
    );
  }

  // Helper functions
  const formatSalary = () => {
    if (job.compensation_min && job.compensation_max) {
      const currency = job.compensation_currency || 'USD';
      const interval = job.compensation_interval || 'year';
      return `${currency} ${job.compensation_min.toLocaleString()} - ${job.compensation_max.toLocaleString()} / ${interval}`;
    }
    return null;
  };

  const formatWorkArrangement = () => {
    if (job.is_remote) {
      return job.work_from_home_type || "Remote";
    }
    return job.location || "On-site";
  };

  const getCompanyLogo = () => {
    if (job.company_logo) {
      return job.company_logo;
    }
    return job.company_name?.charAt(0) || 'C';
  };

  const getSkills = () => {
    return job.skills || [];
  };


  return (
    <div ref={scrollContainerRef} className="w-full h-full bg-slate-800 overflow-y-auto">
      {/* Company Header */}
      <div className="relative">
        {/* Company Logo */}
        <div className="absolute top-4 left-4 z-10">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={job.company_name || 'Company'} 
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {getCompanyLogo()}
              </span>
            )}
          </div>
        </div>

        {/* Banner Image */}
        {job.banner_photo_url ? (
          <img 
            src={job.banner_photo_url} 
            alt={`${job.company_name} banner`}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Building2 className="w-16 h-16 mx-auto mb-2" />
              <p className="text-lg font-semibold">{job.company_name}</p>
            </div>
          </div>
        )}

        {/* Job Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
          <div className="flex items-center gap-4 text-white">
            <span className="font-medium">{job.company_name}</span>
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Company page</span>
            </div>
            {job.company_rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{job.company_rating}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-sm mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatWorkArrangement()}</span>
            </div>
            {formatSalary() && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{formatSalary()} - Full-time</span>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            {job.job_url_direct ? (
              <a
                href={job.job_url_direct}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Apply now
              </a>
            ) : (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Apply now
              </a>
            )}
          <button
            onClick={() => onBookmark(job)}
            className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDismiss(job)}
            className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
          <button className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
        
        {/* Application Insights */}
        {job.company_rating && job.company_reviews_count && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Company rating: {job.company_rating}/5 ({job.company_reviews_count} reviews)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Insights */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-2">Profile insights</h2>
        <p className="text-slate-400 text-sm mb-4">
          Here&apos;s how the job qualifications align with your profile.
        </p>

        {/* Skills Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Skills</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {getSkills().slice(0, showMoreSkills ? getSkills().length : 4).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-700 border border-blue-500 text-blue-300 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
            {getSkills().length > 4 && (
              <button
                onClick={() => setShowMoreSkills(!showMoreSkills)}
                className="px-3 py-1 bg-slate-700 border border-slate-500 text-slate-400 rounded-full text-sm hover:bg-slate-600 transition-colors"
              >
                {showMoreSkills ? 'Show less' : '+ show more'}
              </button>
            )}
          </div>

          {/* Skills from database */}
          {getSkills().length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-white font-medium mb-3">
                Required Skills ({getSkills().length})
              </p>
              <div className="flex flex-wrap gap-2">
                {getSkills().map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-600 text-slate-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Job details</h2>
        <p className="text-slate-400 text-sm mb-4">
          Here&apos;s how the job details align with your profile.
        </p>

        {/* Pay Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Pay</h3>
          </div>
          
          {formatSalary() ? (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{formatSalary()}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ) : (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <span className="text-slate-400">Pay information not provided</span>
            </div>
          )}
        </div>

        {/* Job Description */}
        {job.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3">Job Description</h3>
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-slate-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: job.description.length > 1000 
                    ? `${job.description.substring(0, 1000)}...` 
                    : job.description
                }}
              />
            </div>
          </div>
        )}

        {/* Job Requirements */}
        {job.experience_range && (
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3">Experience Required</h3>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <span className="text-slate-300 text-sm">{job.experience_range}</span>
            </div>
          </div>
        )}

        {/* Job Function */}
        {job.job_function && (
          <div className="mb-6">
            <h3 className="font-semibold text-white mb-3">Job Function</h3>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <span className="text-slate-300 text-sm">{job.job_function}</span>
            </div>
          </div>
        )}

        {/* Company Information */}
        <div className="mb-6">
          <h3 className="font-semibold text-white mb-3">About {job.company_name}</h3>
          <div className="space-y-2">
            {job.location && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location: {job.location}</span>
              </div>
            )}
            {job.company_industry && (
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Industry: {job.company_industry}</span>
              </div>
            )}
            {job.company_num_employees && (
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4" />
                <span className="text-sm">Company size: {job.company_num_employees}</span>
              </div>
            )}
            {job.company_revenue && (
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Revenue: {job.company_revenue}</span>
              </div>
            )}
            {job.company_description && (
              <div className="mt-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {job.company_description.length > 300 
                    ? `${job.company_description.substring(0, 300)}...` 
                    : job.company_description
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Posted Information */}
        <div className="flex items-center justify-between text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Posted {new Date(job.scraped_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Posted on {job.site}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
