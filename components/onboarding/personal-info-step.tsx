"use client";

import { useState } from "react";
import { Button, Card, Input, Select, Form, Upload, Avatar } from "antd";
import { UserOutlined, EnvironmentOutlined, ClockCircleOutlined, EditOutlined } from "@ant-design/icons";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { OnboardingData } from "@/types/onboarding";

interface PersonalInfoStepProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function PersonalInfoStep({ data, onNext, onPrevious, isLoading, isFirstStep }: PersonalInfoStepProps) {
  const [form] = Form.useForm();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleFinish = (values: Record<string, unknown>) => {
    onNext({
      ...values,
      profileImage: profileImage || undefined,
    });
  };

  const timezones = [
    'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-9:00', 'UTC-8:00', 'UTC-7:00', 'UTC-6:00',
    'UTC-5:00', 'UTC-4:00', 'UTC-3:00', 'UTC-2:00', 'UTC-1:00', 'UTC+0:00', 'UTC+1:00',
    'UTC+2:00', 'UTC+3:00', 'UTC+4:00', 'UTC+5:00', 'UTC+6:00', 'UTC+7:00', 'UTC+8:00',
    'UTC+9:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
  ];

  const availabilityOptions = [
    { value: 'immediately', label: 'Immediately' },
    { value: '1-week', label: '1 week' },
    { value: '2-weeks', label: '2 weeks' },
    { value: '1-month', label: '1 month' },
    { value: '2-months', label: '2 months' },
    { value: '3-months', label: '3 months' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const statusOptions = [
    { value: 'actively-looking', label: 'Actively looking' },
    { value: 'open-to-opportunities', label: 'Open to opportunities' },
    { value: 'not-looking', label: 'Not looking' },
    { value: 'passive', label: 'Passive' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Let&apos;s get to know you</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about yourself so we can help you find the perfect opportunities
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={data}
          className="space-y-6"
        >
          {/* Profile Picture */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Avatar
                size={120}
                src={profileImage}
                icon={<UserOutlined />}
                className="border-4 border-blue-100 dark:border-blue-900"
              />
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={(info) => {
                  if (info.file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setProfileImage(e.target?.result as string);
                    };
                    reader.readAsDataURL(info.file as unknown as File);
                  }
                }}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<EditOutlined />}
                  className="absolute -bottom-2 -right-2"
                  size="small"
                />
              </Upload>
            </div>
            <p className="text-sm text-gray-500 mt-2">Click to upload profile picture</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please enter your first name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="John"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please enter your last name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Doe"
                size="large"
              />
            </Form.Item>
          </div>

          {/* Location */}
          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: 'Please enter your location' }]}
          >
            <Input
              prefix={<EnvironmentOutlined />}
              placeholder="San Francisco, CA, USA"
              size="large"
            />
          </Form.Item>

          {/* Timezone */}
          <Form.Item
            label="Timezone"
            name="timezone"
            rules={[{ required: true, message: 'Please select your timezone' }]}
          >
            <Select
              prefix={<ClockCircleOutlined />}
              placeholder="Select your timezone"
              size="large"
              options={timezones.map(tz => ({ value: tz, label: tz }))}
            />
          </Form.Item>

          {/* Professional Headline */}
          <Form.Item
            label="Professional Headline"
            name="headline"
            rules={[{ required: true, message: 'Please enter your professional headline' }]}
          >
            <Input.TextArea
              placeholder="e.g., Open to hearing from fully remote HealthTech and Productivity Tools companies about Front End Developer and Full Stack Developer positions."
              rows={3}
              size="large"
            />
          </Form.Item>

          {/* Professional Summary */}
          <Form.Item
            label="Professional Summary"
            name="professionalSummary"
            rules={[{ required: true, message: 'Please enter your professional summary' }]}
          >
            <Input.TextArea
              placeholder="Briefly describe your professional background, key achievements, and what makes you unique as a candidate."
              rows={4}
              size="large"
            />
          </Form.Item>

          {/* Availability and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Availability"
              name="availability"
              rules={[{ required: true, message: 'Please select your availability' }]}
            >
              <Select
                placeholder="When can you start?"
                size="large"
                options={availabilityOptions}
              />
            </Form.Item>
            
            <Form.Item
              label="Job Search Status"
              name="status"
              rules={[{ required: true, message: 'Please select your status' }]}
            >
              <Select
                placeholder="What&apos;s your status?"
                size="large"
                options={statusOptions}
              />
            </Form.Item>
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
