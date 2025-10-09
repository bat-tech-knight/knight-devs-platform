// Types for onboarding form data
export interface OnboardingData {
  firstName?: string;
  lastName?: string;
  location?: string;
  timezone?: string;
  headline?: string;
  professionalSummary?: string;
  availability?: string;
  status?: string;
  positions?: string[];
  seniority?: string;
  coreSkills?: string[];
  otherSkills?: string[];
  workEligibility?: string;
  workPreference?: string;
  workingTimezones?: string[];
  employmentType?: string;
  expectedSalary?: string;
  skillsPreference?: string[];
  industries?: string[];
  companySizes?: string[];
  fundingStages?: string[];
  experiences?: Experience[];
  profileImage?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}
