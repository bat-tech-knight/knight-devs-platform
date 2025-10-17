"use client";

import { useState } from "react";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";
import { useResumeGeneration, GeneratedResume } from "./resume-generation-hooks";
import { Job } from "./job-hooks";

interface ResumeGenerationButtonProps {
  job: Job;
  candidateProfile: Record<string, unknown>;
  atsScore: number;
  existingResume?: GeneratedResume;
  onResumeGenerated?: (resume: GeneratedResume) => void;
  onResumeDeleted?: () => void;
}

export default function ResumeGenerationButton({
  job,
  candidateProfile,
  atsScore,
  existingResume,
  onResumeGenerated,
  onResumeDeleted
}: ResumeGenerationButtonProps) {
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { generateResume, deleteResume, downloadResume, loading, error } = useResumeGeneration();

  // Only show button if ATS score is 95 or above
  if (atsScore < 95) {
    return null;
  }

  const handleGenerateResume = async () => {
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
        atsScore,
        resumeFormat: 'markdown'
      });

      if (result.success && result.resumeId) {
        // Create a GeneratedResume object from the result
        const newResume: GeneratedResume = {
          id: result.resumeId,
          candidate_id: candidateProfile.id as string,
          job_id: job.id,
          ats_score: atsScore,
          resume_title: result.resumeTitle || `${candidateProfile.first_name} ${candidateProfile.last_name} - ${job.title}`,
          resume_content: result.resumeContent || '',
          resume_format: 'markdown',
          generation_metadata: result.generationMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        onResumeGenerated?.(newResume);
        setShowResumeModal(true);
      }
    } catch (error) {
      console.error('Error generating resume:', error);
    }
  };

  const handleDeleteResume = async () => {
    if (!existingResume) return;

    try {
      const success = await deleteResume(existingResume.id);
      if (success) {
        onResumeDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const handleDownloadResume = async () => {
    if (!existingResume) return;

    try {
      await downloadResume(existingResume);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {existingResume ? (
          <>
            <button
              onClick={() => setShowResumeModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
              title="View generated resume"
            >
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">View Resume</span>
            </button>
            <button
              onClick={handleDownloadResume}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
              title="Download resume"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleDeleteResume}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
              title="Delete resume"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleGenerateResume}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              loading
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            }`}
            title="Generate tailored resume for this job"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {loading ? 'Generating...' : 'Generate Resume'}
            </span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && existingResume && (
        <ResumeModal
          resume={existingResume}
          job={job}
          onClose={() => setShowResumeModal(false)}
          onDownload={handleDownloadResume}
        />
      )}
    </>
  );
}

// Resume Modal Component
interface ResumeModalProps {
  resume: GeneratedResume;
  job: Job;
  onClose: () => void;
  onDownload: () => void;
}

function ResumeModal({ resume, job, onClose, onDownload }: ResumeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{resume.resume_title}</h2>
            <p className="text-sm text-gray-600">Generated for {job.title} at {job.company_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded-lg">
              {resume.resume_content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
