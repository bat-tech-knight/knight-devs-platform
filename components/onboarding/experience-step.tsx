"use client";

import { useState } from "react";
import { Button, Card, Input, DatePicker, Switch } from "antd";
import { PlusOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { ArrowRight, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import { OnboardingData, Experience } from "@/types/onboarding";

interface ExperienceStepProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function ExperienceStep({ data, onNext, onPrevious, isLoading, isFirstStep }: ExperienceStepProps) {
  const [experiences, setExperiences] = useState(data.experiences || []);

  const handleFinish = () => {
    onNext({ experiences });
  };

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
    };
    setExperiences([...experiences, newExperience]);
  };

  const updateExperience = (id: string, field: string, value: string | boolean | string[]) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addAchievement = (experienceId: string) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (experience) {
      const newAchievements = [...experience.achievements, ''];
      updateExperience(experienceId, 'achievements', newAchievements);
    }
  };

  const updateAchievement = (experienceId: string, index: number, value: string) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (experience) {
      const newAchievements = [...experience.achievements];
      newAchievements[index] = value;
      updateExperience(experienceId, 'achievements', newAchievements);
    }
  };

  const removeAchievement = (experienceId: string, index: number) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (experience) {
      const newAchievements = experience.achievements.filter((_: string, i: number) => i !== index);
      updateExperience(experienceId, 'achievements', newAchievements);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Work Experience</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add your professional experience to showcase your background
          </p>
        </div>

        <div className="space-y-6">
          {experiences.map((experience: Experience, index: number) => (
            <Card key={experience.id} className="border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileTextOutlined />
                  Experience #{index + 1}
                </h3>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeExperience(experience.id)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title</label>
                  <Input
                    placeholder="e.g., Full Stack Developer"
                    value={experience.title}
                    onChange={(e) => updateExperience(experience.id, 'title', e.target.value)}
                    size="large"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <Input
                    placeholder="e.g., Google"
                    value={experience.company}
                    onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                    size="large"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Input
                    placeholder="e.g., San Francisco, CA"
                    value={experience.location}
                    onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
                    size="large"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Currently Working Here</label>
                  <Switch
                    checked={experience.current}
                    onChange={(checked) => updateExperience(experience.id, 'current', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <DatePicker
                    placeholder="Select start date"
                    value={experience.startDate ? dayjs(experience.startDate) : null}
                    onChange={(date) => updateExperience(experience.id, 'startDate', date?.format('YYYY-MM-DD'))}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </div>
                
                {!experience.current && (
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <DatePicker
                      placeholder="Select end date"
                      value={experience.endDate ? dayjs(experience.endDate) : null}
                      onChange={(date) => updateExperience(experience.id, 'endDate', date?.format('YYYY-MM-DD'))}
                      size="large"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input.TextArea
                  placeholder="Describe your role and responsibilities..."
                  rows={4}
                  value={experience.description}
                  onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Key Achievements</label>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => addAchievement(experience.id)}
                  >
                    Add Achievement
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {experience.achievements.map((achievement: string, achIndex: number) => (
                    <div key={achIndex} className="flex gap-2">
                      <Input
                        placeholder="Enter achievement..."
                        value={achievement}
                        onChange={(e) => updateAchievement(experience.id, achIndex, e.target.value)}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeAchievement(experience.id, achIndex)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          <div className="text-center">
            <Button
              type="dashed"
              size="large"
              icon={<PlusOutlined />}
              onClick={addExperience}
              className="w-full"
            >
              Add Work Experience
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 mt-8">
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
            onClick={handleFinish}
            loading={isLoading}
            size="large"
            className="flex items-center gap-2"
          >
            Next Step
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
