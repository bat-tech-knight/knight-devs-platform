"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ATSScoreResult {
  overall_score: number;
  skills_match_score: number;
  experience_match_score: number;
  keyword_match_score: number;
  cultural_fit_score: number;
  detailed_analysis: {
    skills_analysis?: string;
    experience_analysis?: string;
    keyword_analysis?: string;
    cultural_fit_analysis?: string;
  };
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  score_explanation: string;
  [key: string]: unknown; // Add index signature for flexibility
}

export interface BatchATSScoreResult extends ATSScoreResult {
  job_id: string;
  job_title: string;
}

export interface UseATSScoringOptions {
  apiBaseUrl?: string;
}

export function useATSScoring(options: UseATSScoringOptions = {}) {
  const { apiBaseUrl = "/api/flask" } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateATSScore = useCallback(async (
    candidateProfile: Record<string, unknown>,
    jobDescription: Record<string, unknown>,
    resumeText?: string
  ): Promise<ATSScoreResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ats-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_profile: candidateProfile,
          job_description: jobDescription,
          resume_text: resumeText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to calculate ATS score");
      }

      return data.ats_score;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const calculateBatchATSScores = useCallback(async (
    candidateProfile: Record<string, unknown>,
    jobDescriptions: Record<string, unknown>[]
  ): Promise<BatchATSScoreResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ats-score/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_profile: candidateProfile,
          job_descriptions: jobDescriptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to calculate batch ATS scores");
      }

      return data.ats_scores;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const saveATSScore = useCallback(async (
    jobId: string,
    candidateId: string,
    atsScore: ATSScoreResult
  ): Promise<void> => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('job_candidate_ats_scores')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          overall_score: atsScore.overall_score,
          skills_match_score: atsScore.skills_match_score,
          experience_match_score: atsScore.experience_match_score,
          keyword_match_score: atsScore.keyword_match_score,
          cultural_fit_score: atsScore.cultural_fit_score,
          detailed_analysis: atsScore.detailed_analysis,
          recommendations: atsScore.recommendations,
          strengths: atsScore.strengths,
          weaknesses: atsScore.weaknesses,
          score_explanation: atsScore.score_explanation,
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log("ATS score saved successfully to Supabase");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error saving ATS score:", errorMessage);
      // Don't throw here - saving is not critical for the user experience
    }
  }, []);

  const getATSScores = useCallback(async (
    candidateId: string,
    jobIds: string[]
  ): Promise<Record<string, ATSScoreResult>> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('job_candidate_ats_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .in('job_id', jobIds)
        .order('calculated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Convert array to object keyed by job_id
      const scoresMap: Record<string, ATSScoreResult> = {};
      data?.forEach((scoreData) => {
        scoresMap[scoreData.job_id] = {
          overall_score: scoreData.overall_score,
          skills_match_score: scoreData.skills_match_score,
          experience_match_score: scoreData.experience_match_score,
          keyword_match_score: scoreData.keyword_match_score,
          cultural_fit_score: scoreData.cultural_fit_score,
          detailed_analysis: scoreData.detailed_analysis || {},
          recommendations: scoreData.recommendations || [],
          strengths: scoreData.strengths || [],
          weaknesses: scoreData.weaknesses || [],
          score_explanation: scoreData.score_explanation || '',
        };
      });

      return scoresMap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error getting ATS scores:", errorMessage);
      return {}; // Return empty object on error
    }
  }, []);

  const getScoreColor = useCallback((score: number): string => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-green-500 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    if (score >= 60) return "text-yellow-500 bg-yellow-50";
    if (score >= 50) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  }, []);

  const getScoreLabel = useCallback((score: number): string => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Very Good Match";
    if (score >= 70) return "Good Match";
    if (score >= 60) return "Moderate Match";
    if (score >= 50) return "Fair Match";
    if (score >= 40) return "Below Average";
    return "Poor Match";
  }, []);

  const getScoreIcon = useCallback((score: number): string => {
    if (score >= 80) return "🎯";
    if (score >= 60) return "👍";
    if (score >= 40) return "⚠️";
    return "❌";
  }, []);

  return {
    calculateATSScore,
    calculateBatchATSScores,
    saveATSScore,
    getATSScores,
    getScoreColor,
    getScoreLabel,
    getScoreIcon,
    loading,
    error,
  };
}
