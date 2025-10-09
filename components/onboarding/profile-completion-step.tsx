"use client";

import { useState } from "react";
import { Button, Card, Progress } from "antd";
import { DownloadOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ArrowLeft, ArrowRight, Star, CheckCircle2 } from "lucide-react";
import { KnightLogo } from "@/components/knight-logo";
import { OnboardingData } from "@/types/onboarding";

interface ProfileCompletionStepProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function ProfileCompletionStep({ data, onNext, onPrevious, isLoading, isFirstStep }: ProfileCompletionStepProps) {
  const [profileComplete, setProfileComplete] = useState(false);

  const handleComplete = () => {
    setProfileComplete(true);
    setTimeout(() => {
      onNext({});
    }, 2000);
  };

  const calculateProfileCompleteness = () => {
    let completed = 0;
    let total = 0;

    // Personal Info
    total += 6;
    if (data.firstName) completed++;
    if (data.lastName) completed++;
    if (data.location) completed++;
    if (data.timezone) completed++;
    if (data.headline) completed++;
    if (data.availability) completed++;

    // Skills
    total += 4;
    if (data.positions && data.positions.length > 0) completed++;
    if (data.seniority) completed++;
    if (data.coreSkills && data.coreSkills.length > 0) completed++;
    if (data.workEligibility) completed++;

    // Job Preferences
    total += 4;
    if (data.workPreference) completed++;
    if (data.employmentType) completed++;
    if (data.expectedSalary) completed++;
    if (data.industries && data.industries.length > 0) completed++;

    // Experience
    total += 1;
    if (data.experiences && data.experiences.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const completeness = calculateProfileCompleteness();

  const features = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      title: "Profile Complete",
      description: "Your profile is now visible to employers"
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-500" />,
      title: "Smart Matching",
      description: "Get matched with relevant job opportunities"
    },
    {
      icon: <DownloadOutlined className="w-6 h-6 text-blue-500" />,
      title: "CV Generation",
      description: "Download your professional CV anytime"
    },
    {
      icon: <EyeOutlined className="w-6 h-6 text-purple-500" />,
      title: "Profile Visibility",
      description: "Employers can discover and contact you"
    }
  ];

  if (profileComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card className="shadow-lg">
          <div className="py-12">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleOutlined className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Welcome to Knight Devs!</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Your profile has been created successfully. You&apos;re now ready to discover amazing opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {feature.icon}
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                type="primary"
                size="large"
                icon={<EyeOutlined />}
                className="flex items-center gap-2"
                onClick={() => window.location.href = '/candidate/discover'}
              >
                Browse Jobs
              </Button>
              <Button
                size="large"
                icon={<DownloadOutlined />}
                className="flex items-center gap-2"
              >
                Download CV
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <KnightLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You&apos;re almost done! Let&apos;s finish setting up your profile.
          </p>
        </div>

        {/* Profile Completeness */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Profile Completeness</h3>
            <span className="text-2xl font-bold text-blue-600">{completeness}%</span>
          </div>
          <Progress 
            percent={completeness} 
            strokeColor={{
              '0%': '#3B82F6',
              '100%': '#8B5CF6',
            }}
            size={200}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {completeness >= 80 ? 'Excellent! Your profile is well-completed.' : 
             completeness >= 60 ? 'Good! Add a bit more information to improve your profile.' :
             'Consider adding more details to make your profile stand out.'}
          </p>
        </div>

        {/* Profile Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Profile Summary</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {data.firstName} {data.lastName}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">{data.location}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{data.headline}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Positions:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {data.positions?.join(', ') || 'Not specified'}
                </p>
              </div>
              <div>
                <span className="font-medium">Seniority:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {data.seniority || 'Not specified'}
                </p>
              </div>
              <div>
                <span className="font-medium">Work Preference:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {data.workPreference || 'Not specified'}
                </p>
              </div>
              <div>
                <span className="font-medium">Experience:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {data.experiences?.length || 0} position(s)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={onPrevious}
            disabled={isFirstStep}
            size="large"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button
            type="primary"
            onClick={handleComplete}
            loading={isLoading}
            size="large"
            className="flex items-center gap-2"
          >
            Complete Profile
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
