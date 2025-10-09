"use client";

import { Button, Card, Select, Form, InputNumber } from "antd";
import { HomeOutlined, ClockCircleOutlined, DollarOutlined, BankOutlined } from "@ant-design/icons";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { OnboardingData } from "@/types/onboarding";

interface JobPreferencesStepProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function JobPreferencesStep({ data, onNext, onPrevious, isLoading, isFirstStep }: JobPreferencesStepProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: Record<string, unknown>) => {
    onNext(values);
  };

  const workPreferenceOptions = [
    { value: 'remote-anywhere', label: 'Remote Anywhere (No onsite)' },
    { value: 'remote-us', label: 'Remote (US only)' },
    { value: 'hybrid', label: 'Hybrid (Some onsite required)' },
    { value: 'onsite', label: 'Onsite Only' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const employmentTypeOptions = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const skillsPreferenceOptions = [
    'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Go',
    'Vue.js', 'Angular', 'Nuxt.js', 'Next.js', 'Django', 'Flask', 'Express',
    'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'GraphQL',
    'Machine Learning', 'Data Science', 'DevOps', 'Mobile Development', 'iOS', 'Android',
  ];

  const industryOptions = [
    'HealthTech', 'FinTech', 'EdTech', 'PropTech', 'AgriTech', 'CleanTech',
    'Productivity Tools', 'E-commerce', 'SaaS', 'Enterprise Software', 'Gaming',
    'Social Media', 'Streaming', 'Cybersecurity', 'AI/ML', 'Blockchain', 'IoT',
    'Automotive', 'Aerospace', 'Manufacturing', 'Retail', 'Food & Beverage',
    'Travel', 'Real Estate', 'Insurance', 'Banking', 'Education', 'Healthcare',
  ];


  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
    { value: 'not-specified', label: 'Not specified' },
  ];

  const timezoneOptions = [
    'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-9:00', 'UTC-8:00', 'UTC-7:00', 'UTC-6:00',
    'UTC-5:00', 'UTC-4:00', 'UTC-3:00', 'UTC-2:00', 'UTC-1:00', 'UTC+0:00', 'UTC+1:00',
    'UTC+2:00', 'UTC+3:00', 'UTC+4:00', 'UTC+5:00', 'UTC+6:00', 'UTC+7:00', 'UTC+8:00',
    'UTC+9:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Preferences</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us what you&apos;re looking for in your next role
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={data}
          className="space-y-6"
        >
          {/* Work Preference */}
          <Form.Item
            label="Work Preference"
            name="workPreference"
            rules={[{ required: true, message: 'Please select your work preference' }]}
          >
            <Select
              placeholder="How do you prefer to work?"
              size="large"
              options={workPreferenceOptions}
              suffixIcon={<HomeOutlined />}
            />
          </Form.Item>

          {/* Working Timezones */}
          <Form.Item
            label="Working Timezones"
            name="workingTimezones"
            rules={[{ required: true, message: 'Please select working timezones' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select timezones you can work in"
              size="large"
              options={timezoneOptions.map(tz => ({ value: tz, label: tz }))}
              suffixIcon={<ClockCircleOutlined />}
            />
          </Form.Item>

          {/* Employment Type */}
          <Form.Item
            label="Employment Type"
            name="employmentType"
            rules={[{ required: true, message: 'Please select employment type' }]}
          >
            <Select
              placeholder="What type of employment are you looking for?"
              size="large"
              options={employmentTypeOptions}
            />
          </Form.Item>

          {/* Expected Salary */}
          <Form.Item
            label="Expected Salary"
            name="expectedSalary"
            rules={[{ required: true, message: 'Please enter your expected salary' }]}
          >
            <InputNumber
              placeholder="Enter your expected salary"
              size="large"
              style={{ width: '100%' }}
              prefix={<DollarOutlined />}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => {
                const num = Number(value!.replace(/\$\s?|(,*)/g, ''));
                return (isNaN(num) ? 0 : num) as 0;
              }}
              min={0}
            />
          </Form.Item>

          {/* Skills Preference */}
          <Form.Item
            label="Skills Preference"
            name="skillsPreference"
          >
            <Select
              mode="multiple"
              placeholder="Select technologies you want to work with"
              size="large"
              options={skillsPreferenceOptions.map(skill => ({ value: skill, label: skill }))}
            />
          </Form.Item>

          {/* Industries */}
          <Form.Item
            label="Industries"
            name="industries"
            rules={[{ required: true, message: 'Please select at least one industry' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select industries you&apos;re interested in"
              size="large"
              options={industryOptions.map(industry => ({ value: industry, label: industry }))}
              suffixIcon={<BankOutlined />}
            />
          </Form.Item>

          {/* Company Sizes */}
          <Form.Item
            label="Company Sizes"
            name="companySizes"
          >
            <Select
              mode="multiple"
              placeholder="Select company sizes (optional)"
              size="large"
              options={companySizeOptions}
            />
          </Form.Item>

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
              htmlType="submit"
              loading={isLoading}
              size="large"
              className="flex items-center gap-2"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
