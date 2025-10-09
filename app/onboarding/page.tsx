"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { KnightLogo } from "@/components/knight-logo";
import { PersonalInfoStep } from "@/components/onboarding/personal-info-step";
import { SkillsStep } from "@/components/onboarding/skills-step";
import { JobPreferencesStep } from "@/components/onboarding/job-preferences-step";
import { ExperienceStep } from "@/components/onboarding/experience-step";
import { ProfileCompletionStep } from "@/components/onboarding/profile-completion-step";
import { ResumeUpload } from "@/components/onboarding/resume-upload";
import { CheckCircle, ArrowRight } from "lucide-react";

interface OnboardingData {
  // Personal Info
  firstName: string;
  lastName: string;
  location: string;
  timezone: string;
  headline: string;
  availability: string;
  status: string;
  
  // Skills
  positions: string[];
  seniority: string;
  coreSkills: string[];
  otherSkills: string[];
  workEligibility: string;
  
  // Job Preferences
  workPreference: string;
  workingTimezones: string[];
  employmentType: string;
  expectedSalary: string;
  skillsPreference: string[];
  industries: string[];
  fundingStages: string[];
  companySizes: string[];
  
  // Experience
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
}

const steps = [
  { id: 'resume', title: 'Upload Resume', component: ResumeUpload },
  { id: 'personal', title: 'Personal Info', component: PersonalInfoStep },
  { id: 'skills', title: 'Skills & Requirements', component: SkillsStep },
  { id: 'preferences', title: 'Job Preferences', component: JobPreferencesStep },
  { id: 'experience', title: 'Work Experience', component: ExperienceStep },
  { id: 'completion', title: 'Complete Profile', component: ProfileCompletionStep },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    location: '',
    timezone: '',
    headline: '',
    availability: '',
    status: '',
    positions: [],
    seniority: '',
    coreSkills: [],
    otherSkills: [],
    workEligibility: '',
    workPreference: '',
    workingTimezones: [],
    employmentType: '',
    expectedSalary: '',
    skillsPreference: [],
    industries: [],
    fundingStages: [],
    companySizes: [],
    experiences: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = async (stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      await completeOnboarding({ ...data, ...stepData });
    }
  };

  const handleResumeParsed = (parsedData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...parsedData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleSkipResume = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save profile data to database
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            first_name: finalData.firstName,
            last_name: finalData.lastName,
            location: finalData.location,
            timezone: finalData.timezone,
            headline: finalData.headline,
            availability: finalData.availability,
            status: finalData.status,
            positions: finalData.positions,
            seniority: finalData.seniority,
            core_skills: finalData.coreSkills,
            other_skills: finalData.otherSkills,
            work_eligibility: finalData.workEligibility,
            work_preference: finalData.workPreference,
            working_timezones: finalData.workingTimezones,
            employment_type: finalData.employmentType,
            expected_salary: finalData.expectedSalary,
            skills_preference: finalData.skillsPreference,
            industries: finalData.industries,
            funding_stages: finalData.fundingStages,
            company_sizes: finalData.companySizes,
            experiences: finalData.experiences,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        
        router.push('/candidate/discover');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  // Handle special cases for different step components
  const renderStepComponent = () => {
    const StepComponent = CurrentStepComponent;
    
    if (currentStep === 0) {
      // Resume upload step
      const ResumeUploadComponent = StepComponent as React.ComponentType<{
        onResumeParsed: (data: Record<string, unknown>) => void;
        onSkip: () => void;
      }>;
      return (
        <ResumeUploadComponent
          onResumeParsed={handleResumeParsed}
          onSkip={handleSkipResume}
        />
      );
    }
    
    // Regular steps
    const RegularStepComponent = StepComponent as React.ComponentType<{
      data: OnboardingData;
      onNext: (data: OnboardingData) => void;
      onPrevious: () => void;
      isLoading: boolean;
      isFirstStep: boolean;
      isLastStep: boolean;
    }>;
    return (
      <RegularStepComponent
        data={data}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isLoading}
        isFirstStep={currentStep === 1}
        isLastStep={currentStep === steps.length - 1}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KnightLogo size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Knight Devs
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= currentStep 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {renderStepComponent()}
      </div>
    </div>
  );
}
