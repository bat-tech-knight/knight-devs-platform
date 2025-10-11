"use client";

import { 
  Bookmark, 
  ThumbsDown, 
  Send, 
  MapPin, 
  DollarSign,
  Clock,
  Star
} from "lucide-react";
import { Job } from "./job-hooks";

interface JobListItemProps {
  job: Job;
  isSelected?: boolean;
  onSelect: (job: Job) => void;
  onBookmark: (job: Job) => void;
  onDismiss: (job: Job) => void;
}

export default function JobListItem({ 
  job, 
  isSelected = false, 
  onSelect, 
  onBookmark, 
  onDismiss 
}: JobListItemProps) {
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


  const isRecentlyPosted = () => {
    if (!job.scraped_at) return false;
    const scrapedDate = new Date(job.scraped_at);
    const now = new Date();
    const daysDiff = (now.getTime() - scrapedDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7; // Posted within last 7 days
  };

  const formatDatePosted = () => {
    if (!job.scraped_at) return "Unknown";
    const date = new Date(job.scraped_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 3600);
    
    if (hoursDiff < 1) return "Just posted";
    if (hoursDiff < 24) return `${Math.floor(hoursDiff)} hours ago`;
    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) return "1 day ago";
    return `${daysDiff} days ago`;
  };

  const getSkills = () => {
    return job.skills || [];
  };

  return (
    <div 
      className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-800/50 transition-colors ${
        isSelected ? 'bg-slate-800/80 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onSelect(job)}
    >
      {/* Header with labels */}
      <div className="flex items-center gap-2 mb-2">
        {isRecentlyPosted() && (
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
            New
          </span>
        )}
      </div>

      {/* Job Title */}
      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
        {job.title}
      </h3>

      {/* Company Name */}
      <p className="text-slate-300 font-medium mb-2">
        {job.company_name || 'Unknown Company'}
      </p>

      {/* Location */}
      <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
        <MapPin className="w-4 h-4" />
        <span>{formatWorkArrangement()}</span>
      </div>

      {/* Salary */}
      {formatSalary() && (
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
          <DollarSign className="w-4 h-4" />
          <span>{formatSalary()}</span>
        </div>
      )}

      {/* Benefits/Details */}
      <div className="flex flex-wrap gap-1 mb-3">
        {job.job_type && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
            {job.job_type}
          </span>
        )}
        {job.is_remote && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
            Remote
          </span>
        )}
        {job.job_level && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
            {job.job_level}
          </span>
        )}
        {job.company_industry && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
            {job.company_industry}
          </span>
        )}
        {getSkills().length > 0 && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
            {getSkills().length} skills
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.job_url_direct && (
            <a
              href={job.job_url_direct}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <Send className="w-3 h-3" />
              Easily apply
            </a>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(job);
            }}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(job);
            }}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer with company info */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {job.site.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="w-3 h-3" />
            <span>{formatDatePosted()}</span>
          </div>
        </div>
        
        {job.company_rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-slate-400 text-xs">
              {job.company_rating}/5
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
