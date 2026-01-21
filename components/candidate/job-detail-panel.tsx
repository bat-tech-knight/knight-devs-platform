"use client";

import React from "react";
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
  CheckCircle,
  Calculator,
  Target,
  FileText,
  Download,
  Trash2,
  Loader2
} from "lucide-react";
import { Job } from "./job-hooks";
import { useState, useRef, useEffect, useCallback } from "react";
import { useATSScoring, ATSScoreResult } from "./ats-scoring-hooks";
import { ATSScoreDisplay } from "./ats-score-display";
import { useResumeGeneration, GeneratedResume } from "./resume-generation-hooks";

interface JobDetailPanelProps {
  job: Job | null;
  onBookmark: (job: Job) => void;
  onDismiss: (job: Job) => void;
  candidateProfile?: Record<string, unknown>; // Optional candidate profile for ATS scoring
  onTrackApplyClick?: (jobId: string) => Promise<void>; // Function to track Apply Now clicks
  applicationStatus?: 'clicked' | 'applied' | 'not_applied' | null; // Current application status
}

export default function JobDetailPanel({ 
  job, 
  onBookmark, 
  onDismiss, 
  candidateProfile,
  onTrackApplyClick,
  applicationStatus
}: JobDetailPanelProps) {
  const [showMoreSkills, setShowMoreSkills] = useState(false);
  const [atsScore, setAtsScore] = useState<ATSScoreResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ats' | 'resume'>('overview');
  const [loadingExistingScore, setLoadingExistingScore] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { calculateATSScore, saveATSScore, getATSScores, loading: atsLoading, error: atsError } = useATSScoring();
  const { generateResume, getGeneratedResumes, deleteResume, downloadResume, loading: resumeLoading, error: resumeError } = useResumeGeneration();

  // Load existing ATS score when job changes
  const fetchExistingATSScore = useCallback(async () => {
    if (!job?.id || !candidateProfile?.id) return;
    
    setLoadingExistingScore(true);
    try {
      const scores = await getATSScores(candidateProfile.id as string, [job.id]);
      if (scores[job.id]) {
        setAtsScore(scores[job.id]);
      }
    } catch (error) {
      console.error("Error loading existing ATS score:", error);
    } finally {
      setLoadingExistingScore(false);
    }
  }, [job?.id, candidateProfile?.id, getATSScores]);

  // Load existing generated resume
  const fetchExistingResume = useCallback(async () => {
    if (!job?.id || !candidateProfile?.id) return;
    
    setLoadingResume(true);
    try {
      const resumes = await getGeneratedResumes(candidateProfile.id as string, [job.id]);
      if (resumes[job.id]) {
        setGeneratedResume(resumes[job.id]);
      } else {
        setGeneratedResume(null);
      }
    } catch (error) {
      console.error("Error loading existing resume:", error);
    } finally {
      setLoadingResume(false);
    }
  }, [job?.id, candidateProfile?.id, getGeneratedResumes]);

  // Reset scroll position and ATS score when job changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Reset ATS score when job changes
    setAtsScore(null);
    setActiveTab('overview');
  }, [job?.id]);

  // Load existing ATS score and resume when job or candidate profile changes
  useEffect(() => {
    fetchExistingATSScore();
    fetchExistingResume();
  }, [fetchExistingATSScore, fetchExistingResume]);

  // ATS Scoring function
  const handleCalculateATSScore = async () => {
    if (!job || !candidateProfile) {
      alert("Please complete your profile to calculate ATS score");
      return;
    }

    try {
      const jobDescription = {
        id: job.id,
        title: job.title,
        description: job.description,
        skills: job.skills || [],
        job_level: job.job_level,
        job_type: job.job_type,
        is_remote: job.is_remote,
        location: job.location,
        company_name: job.company_name,
        company_industry: job.company_industry
      };

      const score = await calculateATSScore(candidateProfile, jobDescription);
      setAtsScore(score);
      setActiveTab('ats'); // Switch to ATS tab after calculation
      
      // Save the ATS score to database
      if (candidateProfile?.id) {
        await saveATSScore(job.id, candidateProfile.id as string, score);
      }
    } catch (error) {
      console.error("Error calculating ATS score:", error);
      alert("Failed to calculate ATS score. Please try again.");
    }
  };

  // Resume Generation function
  const handleGenerateResume = async () => {
    if (!job || !candidateProfile) {
      alert("Please complete your profile to generate resume");
      return;
    }

    try {
      const jobDescription = {
        id: job.id,
        title: job.title,
        description: job.description,
        skills: job.skills || [],
        job_level: job.job_level,
        job_type: job.job_type,
        is_remote: job.is_remote,
        location: job.location,
        company_name: job.company_name,
        company_industry: job.company_industry
      };

      const result = await generateResume({
        candidateProfile,
        jobDescription,
        atsScore: 100, // Always use 100% for resume generation
        resumeFormat: 'docx'
      });

      if (result.success && result.resumeId) {
        // Create a GeneratedResume object from the result
        const newResume: GeneratedResume = {
          id: result.resumeId,
          candidate_id: candidateProfile.id as string,
          job_id: job.id,
          ats_score: 100, // Always use 100% for generated resumes
          resume_title: result.resumeTitle || `${candidateProfile.first_name} ${candidateProfile.last_name} - ${job.title}`,
          resume_content: result.resumeContent || '',
          resume_format: 'docx',
          generation_metadata: result.generationMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setGeneratedResume(newResume);
        setActiveTab('resume'); // Switch to resume tab after generation
      }
    } catch (error) {
      console.error('Error generating resume:', error);
    }
  };

  const handleDeleteResume = async () => {
    if (!generatedResume) return;

    try {
      const success = await deleteResume(generatedResume.id);
      if (success) {
        setGeneratedResume(null);
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const handleDownloadResume = async () => {
    if (!generatedResume) return;

    try {
      await downloadResume(generatedResume);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const handleCalculateATSScoreWithResume = async (resumeContent: string) => {
    if (!candidateProfile || !job) return;

    try {
      const jobDescription = {
        id: job.id,
        title: job.title,
        description: job.description,
        skills: job.skills || [],
        job_level: job.job_level,
        job_type: job.job_type,
        location: job.location,
        company_name: job.company_name,
        company_industry: job.company_industry
      };

      // Create a mock candidate profile with the generated resume content
      const resumeProfile = {
        ...candidateProfile,
        resume_content: resumeContent
      };

      const result = await calculateATSScore(resumeProfile, jobDescription);
      
      if (result.success && result.score) {
        setAtsScore(result.score);
        setActiveTab('ats'); // Switch to ATS tab to show the results
      }
    } catch (error) {
      console.error('Error calculating ATS score with resume:', error);
    }
  };

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
            {applicationStatus === 'applied' ? (
              <button
                disabled
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium text-center cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Applied
              </button>
            ) : (
              <>
                {job.job_url_direct ? (
                  <button
                    onClick={async () => {
                      if (onTrackApplyClick && job.id) {
                        await onTrackApplyClick(job.id);
                      }
                      window.open(job.job_url_direct, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    {applicationStatus === 'clicked' ? 'Apply now (clicked)' : 'Apply now'}
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (onTrackApplyClick && job.id) {
                        await onTrackApplyClick(job.id);
                      }
                      window.open(job.job_url, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    {applicationStatus === 'clicked' ? 'Apply now (clicked)' : 'Apply now'}
                  </button>
                )}
              </>
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

      {/* Tab Navigation */}
      <div className="px-6 pt-6 border-b border-slate-700">
        <div className="flex space-x-1 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('ats')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ats'
                ? 'bg-slate-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ATS Score
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'resume'
                ? 'bg-slate-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Resume
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <React.Fragment>
          {/* Profile Insights */}
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-2">Profile insights</h2>
          <p className="text-slate-400 text-sm mb-4">
            Here&apos;s how the job qualifications align with your profile.
          </p>
        </div>

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

          {/* Employment Type */}
          {job.job_type && (
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3">Employment Type</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-slate-300 text-sm">{job.job_type}</span>
              </div>
            </div>
          )}

          {/* Job Level */}
          {job.job_level && (
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3">Job Level</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-slate-300 text-sm">{job.job_level}</span>
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
        </React.Fragment>
      )}

      {/* ATS Tab Content */}
      {activeTab === 'ats' && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">ATS Compatibility Score</h2>
          </div>
          
          {loadingExistingScore ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
                <p className="text-slate-400">Loading ATS score...</p>
              </div>
            </div>
          ) : atsScore ? (
            <div className="bg-slate-800 rounded-lg p-4">
              <ATSScoreDisplay 
                score={atsScore}
                showDetails={true}
                compact={false}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No ATS Score Available</h3>
              <p className="text-slate-400 mb-4">
                Calculate your ATS compatibility score to see how well you match this job.
              </p>
              <button
                onClick={handleCalculateATSScore}
                disabled={atsLoading || !candidateProfile}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  atsLoading || !candidateProfile
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                title={!candidateProfile ? "Complete your profile to calculate ATS score" : "Calculate ATS compatibility score"}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                {atsLoading ? 'Calculating...' : 'Calculate ATS Score'}
              </button>
            </div>
          )}
          
          {/* ATS Error */}
          {atsError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">
                <strong>Error:</strong> {atsError}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resume Tab Content */}
      {activeTab === 'resume' && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Generated Resume</h2>
          </div>
          
          {loadingResume ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-slate-400">Loading resume...</p>
              </div>
            </div>
          ) : generatedResume ? (
            <div className="space-y-4">
              {/* Resume Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadResume}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Resume
                </button>
                <button
                  onClick={handleDeleteResume}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Resume
                </button>
                <button
                  onClick={() => handleCalculateATSScoreWithResume(generatedResume.resume_content)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate ATS Score
                </button>
              </div>

              {/* Resume Content */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">{generatedResume.resume_title}</h3>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono bg-slate-700 p-4 rounded-lg overflow-x-auto">
                    {generatedResume.resume_content}
                  </pre>
                </div>
              </div>

              {/* Resume Metadata */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">Resume Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                  <div>
                    <span className="font-medium">ATS Score:</span> {generatedResume.ats_score}%
                  </div>
                  <div>
                    <span className="font-medium">Format:</span> {generatedResume.resume_format}
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span> {new Date(generatedResume.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">File URL:</span> 
                    <a href={generatedResume.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                      View File
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Resume Generated</h3>
              <p className="text-slate-400 mb-4">
                Generate a tailored resume optimized for this job opportunity to pass ATS filtering.
              </p>
              <button
                onClick={handleGenerateResume}
                disabled={resumeLoading || !candidateProfile}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  resumeLoading || !candidateProfile
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {resumeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 inline mr-2" />
                    Generate Resume
                  </>
                )}
              </button>
              {!candidateProfile && (
                <p className="text-sm text-slate-500 mt-2">
                  Complete your profile to generate resumes.
                </p>
              )}
            </div>
          )}
          
          {/* Resume Error */}
          {resumeError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">
                <strong>Error:</strong> {resumeError}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}