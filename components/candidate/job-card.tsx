"use client";

import { 
  Send, 
  Building2, 
  Globe, 
  DollarSign, 
  MapPin, 
  Users, 
  Clock,
  Star,
  ExternalLink
} from "lucide-react";
import { Job } from "./job-hooks";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
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

  const formatRemoteOption = () => {
    if (job.is_remote) {
      return job.location ? `Remote in ${job.location}` : "Remote anywhere";
    }
    return "On-site only";
  };

  const getCompanyLogo = () => {
    if (job.company_logo) {
      return job.company_logo;
    }
    return job.company_name?.charAt(0) || 'C';
  };

  const getCompanySize = () => {
    if (job.company_num_employees) {
      return job.company_num_employees;
    }
    return "Unknown size";
  };

  const getSkills = () => {
    return job.skills || [];
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

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
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
        <div className="flex gap-2">
          {job.job_url_direct && (
            <a
              href={job.job_url_direct}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Apply</span>
            </a>
          )}
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            <Send className="w-4 h-4" />
            <span className="text-sm">Message</span>
          </button>
        </div>
      </div>

      {/* Company and Position */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          {job.company_name || 'Unknown Company'}
        </h3>
        <h4 className="text-xl font-bold text-white mb-2">{job.title}</h4>
        {job.description && (
          <p className="text-slate-300 text-sm line-clamp-2">
            {job.description.length > 150 
              ? `${job.description.substring(0, 150)}...` 
              : job.description
            }
          </p>
        )}
      </div>

      {/* Position Details */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-white mb-2">The position</h5>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{formatWorkArrangement()}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4" />
            <span className="text-sm">{formatRemoteOption()}</span>
          </div>
          {(formatSalary() || job.job_level) && (
            <div className="flex items-center gap-2 text-slate-300">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">
                {formatSalary() || job.job_level}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      {getSkills().length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-white mb-2">Core skills considered</h5>
          <div className="flex flex-wrap gap-2">
            {getSkills().slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-700 border border-blue-500 text-blue-300 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
            {getSkills().length > 6 && (
              <span className="px-3 py-1 bg-slate-700 border border-slate-500 text-slate-400 rounded-full text-sm">
                +{getSkills().length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Company Details */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-white mb-2">The company</h5>
        <div className="space-y-2">
          {job.location && (
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Based in {job.location}</span>
            </div>
          )}
          {job.company_industry && (
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">{job.company_industry}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4" />
            <span className="text-sm">{getCompanySize()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {job.site.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              Posted on {job.site}
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock className="w-3 h-3" />
              <span>{formatDatePosted()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3 text-yellow-400" />
          <span className="text-slate-400 text-xs">
            {job.company_rating ? `${job.company_rating}/5` : 'No rating'}
          </span>
        </div>
      </div>

      {/* Recently Posted Badge */}
      {isRecentlyPosted() && (
        <div className="mt-3">
          <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded-full">
            Recently posted!
          </span>
        </div>
      )}
    </div>
  );
}
