"use client";

import { Button, Card, Select, Form, Tag } from "antd";
import { CodeOutlined, StarOutlined, GlobalOutlined } from "@ant-design/icons";
import { ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { OnboardingData } from "@/types/onboarding";

interface SkillsStepProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function SkillsStep({ data, onNext, onPrevious, isLoading, isFirstStep }: SkillsStepProps) {
  const [form] = Form.useForm();

  // Ensure positions data is unique to prevent duplicate key errors
  const safeData = {
    ...data,
    positions: data?.positions ? [...new Set(data.positions)] : [],
    coreSkills: data?.coreSkills ? [...new Set(data.coreSkills)] : [],
    otherSkills: data?.otherSkills ? [...new Set(data.otherSkills)] : []
  };

  const handleFinish = (values: Record<string, unknown>) => {
    onNext(values);
  };

  const positionOptions = [
    'Front End Developer',
    'Back End Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'Technical Writer',
    'Solution Architect',
  ];

  const seniorityOptions = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid (2-5 years)' },
    { value: 'senior', label: 'Senior (5-10 years)' },
    { value: 'lead', label: 'Lead (10+ years)' },
    { value: 'principal', label: 'Principal/Staff' },
  ];

  const coreSkillsOptions = [
    'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
    'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'HTML/CSS', 'Sass', 'Tailwind CSS', 'Bootstrap', 'Material-UI',
    'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Rails',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
    'Git', 'GitHub', 'GitLab', 'Jenkins', 'CI/CD', 'Agile', 'Scrum',
  ];

  const otherSkillsOptions = [
    'GraphQL', 'REST API', 'Microservices', 'Serverless', 'WebRTC',
    'WebSocket', 'JWT', 'OAuth', 'Firebase', 'Supabase', 'Prisma',
    'Next.js', 'Nuxt.js', 'Gatsby', 'Svelte', 'Ember.js', 'Backbone.js',
    'Redux', 'Vuex', 'MobX', 'Zustand', 'Jest', 'Cypress', 'Playwright',
    'Webpack', 'Vite', 'Parcel', 'Rollup', 'Babel', 'ESLint', 'Prettier',
    'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Storybook',
    'Linux', 'Bash', 'PowerShell', 'Vim', 'VS Code', 'IntelliJ',
  ];

  const workEligibilityOptions = [
    { value: 'us', label: 'US Citizen/Permanent Resident' },
    { value: 'us-visa', label: 'US Work Visa Required' },
    { value: 'canada', label: 'Canada Citizen/Permanent Resident' },
    { value: 'eu', label: 'EU Citizen' },
    { value: 'uk', label: 'UK Citizen' },
    { value: 'remote-only', label: 'Remote Only (No Visa Required)' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Skills & Requirements</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about your technical skills and experience level
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={safeData}
          className="space-y-6"
        >
          {/* Positions */}
          <Form.Item
            label="Positions"
            name="positions"
            rules={[{ required: true, message: 'Please select at least one position' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select positions you're interested in"
              size="large"
              options={positionOptions.map(pos => ({ value: pos, label: pos }))}
              suffixIcon={<CodeOutlined />}
            />
          </Form.Item>

          {/* Seniority Level */}
          <Form.Item
            label="Seniority Level"
            name="seniority"
            rules={[{ required: true, message: 'Please select your seniority level' }]}
          >
            <Select
              placeholder="Select your experience level"
              size="large"
              options={seniorityOptions}
              suffixIcon={<StarOutlined />}
            />
          </Form.Item>

          {/* Core Skills */}
          <Form.Item
            label="Core Skills"
            name="coreSkills"
            rules={[{ required: true, message: 'Please select your core skills' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select your main technical skills"
              size="large"
              options={coreSkillsOptions.map(skill => ({ value: skill, label: skill }))}
              suffixIcon={<CodeOutlined />}
              tagRender={(props) => {
                const { label, closable, onClose } = props;
                return (
                  <Tag
                    color="blue"
                    closable={closable}
                    onClose={onClose}
                    className="mb-2"
                  >
                    {label}
                  </Tag>
                );
              }}
            />
          </Form.Item>

          {/* Other Skills */}
          <Form.Item
            label="Other Skills"
            name="otherSkills"
          >
            <Select
              mode="multiple"
              placeholder="Select additional skills (optional)"
              size="large"
              options={otherSkillsOptions.map(skill => ({ value: skill, label: skill }))}
              suffixIcon={<Plus className="w-4 h-4" />}
              tagRender={(props) => {
                const { label, closable, onClose } = props;
                return (
                  <Tag
                    color="green"
                    closable={closable}
                    onClose={onClose}
                    className="mb-2"
                  >
                    {label}
                  </Tag>
                );
              }}
            />
          </Form.Item>

          {/* Work Eligibility */}
          <Form.Item
            label="Work Eligibility"
            name="workEligibility"
            rules={[{ required: true, message: 'Please select your work eligibility' }]}
          >
            <Select
              placeholder="Select your work authorization status"
              size="large"
              options={workEligibilityOptions}
              suffixIcon={<GlobalOutlined />}
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
