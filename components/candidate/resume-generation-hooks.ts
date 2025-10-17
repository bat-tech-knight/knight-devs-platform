"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface GeneratedResume {
  id: string;
  candidate_id: string;
  job_id: string;
  ats_score: number;
  resume_title: string;
  resume_content: string;
  resume_format: string;
  file_url?: string;
  generation_prompt?: string;
  generation_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResumeGenerationRequest {
  candidateProfile: Record<string, unknown>;
  jobDescription: Record<string, unknown>;
  atsScore: number;
  resumeFormat?: string;
}

export interface ResumeGenerationResult {
  success: boolean;
  resumeContent?: string;
  resumeTitle?: string;
  generationMetadata?: Record<string, unknown>;
  resumeId?: string;
  error?: string;
}

export function useResumeGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResume = useCallback(async (
    request: ResumeGenerationRequest
  ): Promise<ResumeGenerationResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getGeneratedResumes = useCallback(async (
    candidateId: string,
    jobIds?: string[]
  ): Promise<Record<string, GeneratedResume>> => {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('generated_resumes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (jobIds && jobIds.length > 0) {
        query = query.in('job_id', jobIds);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Convert array to object keyed by job_id
      const resumesMap: Record<string, GeneratedResume> = {};
      data?.forEach((resume) => {
        resumesMap[resume.job_id] = resume;
      });

      return resumesMap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error getting generated resumes:", errorMessage);
      return {};
    }
  }, []);

  const getResumeById = useCallback(async (resumeId: string): Promise<GeneratedResume | null> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error getting resume by ID:", errorMessage);
      return null;
    }
  }, []);

  const deleteResume = useCallback(async (resumeId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('generated_resumes')
        .delete()
        .eq('id', resumeId);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error deleting resume:", errorMessage);
      return false;
    }
  }, []);

  const downloadResume = useCallback(async (resume: GeneratedResume): Promise<void> => {
    try {
      // Create a blob with the resume content
      const blob = new Blob([resume.resume_content], { 
        type: resume.resume_format === 'html' ? 'text/html' : 'text/markdown' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.resume_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${resume.resume_format}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error downloading resume:", errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    generateResume,
    getGeneratedResumes,
    getResumeById,
    deleteResume,
    downloadResume,
    loading,
    error,
  };
}
