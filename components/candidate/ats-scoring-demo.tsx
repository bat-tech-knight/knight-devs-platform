"use client";

import React, { useState } from "react";
import { useATSScoring, ATSScoreResult } from "./ats-scoring-hooks";
import { ATSScoreDisplay } from "./ats-score-display";

export default function ATSScoringDemo() {
  const { calculateATSScore, loading, error } = useATSScoring();
  const [score, setScore] = useState<ATSScoreResult | null>(null);

  // Example candidate profile
  const candidateProfile = {
    first_name: "John",
    last_name: "Doe",
    headline: "Senior Full Stack Developer",
    core_skills: ["React", "Node.js", "Python", "AWS", "Docker"],
    other_skills: ["JavaScript", "TypeScript", "MongoDB", "PostgreSQL"],
    seniority: "senior",
    work_preference: "remote-anywhere",
    experiences: [
      {
        title: "Senior Developer",
        company: "Tech Corp",
        description: "Led development of microservices architecture using React and Node.js"
      }
    ]
  };

  // Example job description
  const jobDescription = {
    id: "job-123",
    title: "Senior Full Stack Engineer",
    description: "We're looking for a senior developer to lead our microservices team. Must have experience with React, Node.js, and cloud technologies.",
    skills: ["React", "Node.js", "Python", "Docker", "AWS"],
    job_level: "senior",
    job_type: "full-time",
    is_remote: true,
    location: "Remote",
    company_name: "Innovation Labs",
    company_industry: "Technology"
  };

  const handleCalculateScore = async () => {
    try {
      const result = await calculateATSScore(candidateProfile, jobDescription);
      setScore(result);
    } catch (err) {
      console.error("Error calculating ATS score:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ATS Scoring Demo
        </h1>
        <p className="text-gray-600">
          Test the AI-powered ATS scoring system with sample data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Profile */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Candidate Profile</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {candidateProfile.first_name} {candidateProfile.last_name}</p>
            <p><strong>Title:</strong> {candidateProfile.headline}</p>
            <p><strong>Seniority:</strong> {candidateProfile.seniority}</p>
            <p><strong>Core Skills:</strong> {candidateProfile.core_skills.join(", ")}</p>
            <p><strong>Work Preference:</strong> {candidateProfile.work_preference}</p>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {jobDescription.title}</p>
            <p><strong>Company:</strong> {jobDescription.company_name}</p>
            <p><strong>Level:</strong> {jobDescription.job_level}</p>
            <p><strong>Type:</strong> {jobDescription.job_type}</p>
            <p><strong>Remote:</strong> {jobDescription.is_remote ? "Yes" : "No"}</p>
            <p><strong>Required Skills:</strong> {jobDescription.skills.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="text-center">
        <button
          onClick={handleCalculateScore}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            loading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? 'Calculating ATS Score...' : 'Calculate ATS Score'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800"><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Score Display */}
      {score && (
        <div className="bg-white rounded-lg shadow-md border">
          <ATSScoreDisplay score={score} showDetails={true} />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• The AI analyzes the candidate&apos;s skills, experience, and preferences</li>
          <li>• It compares them against the job requirements and description</li>
          <li>• Provides detailed scoring across multiple dimensions</li>
          <li>• Offers specific recommendations for improvement</li>
        </ul>
      </div>
    </div>
  );
}
