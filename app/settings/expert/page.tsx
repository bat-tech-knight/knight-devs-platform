"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Select, Upload, message, Tag, Progress, Alert, Typography } from "antd";
import { 
  SaveOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  CodeOutlined,
  StarOutlined,
  GlobalOutlined,
  BankOutlined,
  UploadOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import pdfToText from "react-pdftotext";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

interface ExpertProfile {
  id: string;
  user_id: string;
  resume_url?: string;
  resume_text?: string;
  ai_parsed_data?: Record<string, unknown>;
  headline?: string;
  positions?: string[];
  seniority?: string;
  core_skills?: string[];
  other_skills?: string[];
  industries?: string[];
  work_eligibility?: string;
  work_preference?: string;
  working_timezones?: string[];
  employment_type?: string;
  expected_salary?: string;
  skills_preference?: string[];
  funding_stages?: string[];
  company_sizes?: string[];
  availability?: string;
  status?: string;
  experiences?: Experience[];
  created_at: string;
  updated_at: string;
}

export default function ExpertSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [, setExpert] = useState<ExpertProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  
  // Resume upload states
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  useEffect(() => {
    const fetchExpert = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: expertData } = await supabase
          .from('experts')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (expertData) {
          setExpert(expertData);
          setExperiences(expertData.experiences || []);
          form.setFieldsValue({
            headline: expertData.headline,
            positions: expertData.positions,
            seniority: expertData.seniority,
            coreSkills: expertData.core_skills,
            otherSkills: expertData.other_skills,
            industries: expertData.industries,
            workEligibility: expertData.work_eligibility,
            workPreference: expertData.work_preference,
            workingTimezones: expertData.working_timezones,
            employmentType: expertData.employment_type,
            expectedSalary: expertData.expected_salary,
            skillsPreference: expertData.skills_preference,
            fundingStages: expertData.funding_stages,
            companySizes: expertData.company_sizes,
            availability: expertData.availability,
            status: expertData.status,
          });
        }
      }
    };

    fetchExpert();
  }, [form]);

  const handleSave = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('experts')
          .upsert({
            user_id: user.id,
            headline: values.headline,
            positions: values.positions,
            seniority: values.seniority,
            core_skills: values.coreSkills,
            other_skills: values.otherSkills,
            industries: values.industries,
            work_eligibility: values.workEligibility,
            work_preference: values.workPreference,
            working_timezones: values.workingTimezones,
            employment_type: values.employmentType,
            expected_salary: values.expectedSalary,
            skills_preference: values.skillsPreference,
            funding_stages: values.fundingStages,
            company_sizes: values.companySizes,
            availability: values.availability,
            status: values.status,
            experiences: experiences,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        
        message.success('Expert profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating expert profile:', error);
      message.error('Failed to update expert profile');
    } finally {
      setLoading(false);
    }
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

  const handleResumeUpload = async (file: File) => {
    setUploading(true);
    setResumeError(null);
    setProgress(0);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Please sign in to upload your resume');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/resume-${Date.now()}.${fileExt}`;

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 50));
      }, 200);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(uploadInterval);
      setProgress(50);

      if (uploadError) {
        throw new Error('Failed to upload resume');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Extract text from file using react-pdftotext
      setParsing(true);
      const parseInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      let resumeText = '';
      try {
        if (file.type === 'application/pdf') {
          // Use react-pdftotext for PDF files
          resumeText = await pdfToText(file);
        } else if (file.type.includes('wordprocessingml') || file.type === 'application/msword') {
          // Use Next.js API route for DOCX text extraction
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const extractResponse = await fetch('/api/extract-docx-text', {
              method: 'POST',
              body: formData,
            });
            
            if (extractResponse.ok) {
              const extractData = await extractResponse.json();
              if (extractData.success && extractData.text) {
                resumeText = extractData.text;
              }
            } else {
              console.error('DOCX extraction failed:', await extractResponse.text());
            }
          } catch (extractError) {
            console.error('DOCX extraction error:', extractError);
            // Continue without text extraction
          }
        }
      } catch {
        // Continue without text extraction (Flask can still attempt AI parsing on empty text)
      }

      clearInterval(parseInterval);
      setProgress(90);

      // Parse resume with AI via Flask
      const parseResponse = await fetch('/api/flask/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume_text: resumeText }),
      });

      setProgress(100);

      if (!parseResponse.ok) {
        throw new Error('Failed to parse resume');
      }

      const parsedData = await parseResponse.json();
      
      // Update experts table with parsed resume data
      const { error: expertError } = await supabase
        .from('experts')
        .upsert({
          user_id: user.id,
          resume_url: urlData.publicUrl,
          resume_text: resumeText,
          ai_parsed_data: parsedData.parsed_data,
          headline: parsedData.parsed_data?.headline || '',
          positions: [...new Set(parsedData.parsed_data?.positions || [])],
          seniority: parsedData.parsed_data?.seniority || '',
          core_skills: [...new Set(parsedData.parsed_data?.core_skills || [])],
          other_skills: [...new Set(parsedData.parsed_data?.other_skills || [])],
          industries: [...new Set(parsedData.parsed_data?.industries || [])],
          work_eligibility: parsedData.parsed_data?.work_eligibility || '',
          work_preference: parsedData.parsed_data?.work_preference || '',
          working_timezones: [...new Set(parsedData.parsed_data?.working_timezones || [])],
          employment_type: parsedData.parsed_data?.employment_type || '',
          expected_salary: parsedData.parsed_data?.expected_salary || '',
          skills_preference: [...new Set(parsedData.parsed_data?.skills_preference || [])],
          funding_stages: [...new Set(parsedData.parsed_data?.funding_stages || [])],
          company_sizes: [...new Set(parsedData.parsed_data?.company_sizes || [])],
          availability: parsedData.parsed_data?.availability || '',
          status: parsedData.parsed_data?.status || '',
          experiences: parsedData.parsed_data?.experiences || [],
          updated_at: new Date().toISOString(),
        });

      if (expertError) {
        console.error('Expert update error:', expertError);
      }

      // Update form with parsed data
      form.setFieldsValue({
        headline: parsedData.parsed_data?.headline || '',
        positions: [...new Set(parsedData.parsed_data?.positions || [])],
        seniority: parsedData.parsed_data?.seniority || '',
        coreSkills: [...new Set(parsedData.parsed_data?.core_skills || [])],
        otherSkills: [...new Set(parsedData.parsed_data?.other_skills || [])],
        industries: [...new Set(parsedData.parsed_data?.industries || [])],
        workEligibility: parsedData.parsed_data?.work_eligibility || '',
        workPreference: parsedData.parsed_data?.work_preference || '',
        workingTimezones: [...new Set(parsedData.parsed_data?.working_timezones || [])],
        employmentType: parsedData.parsed_data?.employment_type || '',
        expectedSalary: parsedData.parsed_data?.expected_salary || '',
        skillsPreference: [...new Set(parsedData.parsed_data?.skills_preference || [])],
        fundingStages: [...new Set(parsedData.parsed_data?.funding_stages || [])],
        companySizes: [...new Set(parsedData.parsed_data?.company_sizes || [])],
        availability: parsedData.parsed_data?.availability || '',
        status: parsedData.parsed_data?.status || '',
      });

      // Update experiences
      if (parsedData.parsed_data?.experiences) {
        setExperiences(parsedData.parsed_data.experiences);
      }
      
      setResumeSuccess(true);
      message.success('Resume uploaded and parsed successfully!');
      
      // Refresh expert data
      const { data: expertData } = await supabase
        .from('experts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (expertData) {
        setExpert(expertData);
      }

    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'An error occurred');
      message.error('Failed to upload resume');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const positionOptions = [
    'Front End Developer', 'Back End Developer', 'Full Stack Developer',
    'Mobile Developer', 'DevOps Engineer', 'Data Scientist',
    'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
    'QA Engineer', 'Technical Writer', 'Solution Architect',
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

  const industryOptions = [
    'HealthTech', 'FinTech', 'EdTech', 'PropTech', 'AgriTech', 'CleanTech',
    'Productivity Tools', 'E-commerce', 'SaaS', 'Enterprise Software', 'Gaming',
    'Social Media', 'Streaming', 'Cybersecurity', 'AI/ML', 'Blockchain', 'IoT',
    'Automotive', 'Aerospace', 'Manufacturing', 'Retail', 'Food & Beverage',
    'Travel', 'Real Estate', 'Insurance', 'Banking', 'Education', 'Healthcare',
  ];

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isPDF = file.type === 'application/pdf';
      const isDoc = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isPDF && !isDoc) {
        setResumeError('Please upload a PDF or Word document');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        setResumeError('File must be smaller than 10MB');
        return false;
      }

      handleResumeUpload(file);
      return false; // Prevent default upload
    },
    showUploadList: false,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Expert Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your professional skills, experience, and career preferences
        </p>
      </div>

      {/* Resume Upload Section */}
      <Card title="Resume Upload" className="mb-6">
        <div className="text-center">
          <Title level={4} className="mb-4">Upload Your Resume</Title>
          <Text type="secondary" className="block mb-4">
            Upload your resume and we&apos;ll automatically extract your information to pre-fill your profile
          </Text>

          {resumeError && (
            <Alert
              message="Upload Error"
              description={resumeError}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          {resumeSuccess && (
            <Alert
              message="Resume Parsed Successfully!"
              description="We&apos;ve extracted your information and pre-filled your profile fields."
              type="success"
              icon={<CheckCircleOutlined />}
              className="mb-4"
            />
          )}

          {(uploading || parsing) && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Text strong>
                  {uploading ? 'Uploading Resume...' : 'Parsing Resume with AI...'}
                </Text>
                <Text>{progress}%</Text>
              </div>
              <Progress 
                percent={progress} 
                strokeColor={{
                  '0%': '#3B82F6',
                  '100%': '#8B5CF6',
                }}
              />
            </div>
          )}

          <Upload {...uploadProps}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading || parsing}
              disabled={uploading || parsing || resumeSuccess}
              className="mb-4"
            >
              {uploading ? 'Uploading...' : parsing ? 'Parsing...' : 'Upload Resume'}
            </Button>
          </Upload>
          
          <div className="text-sm text-gray-500 mb-4">
            <FileTextOutlined className="mr-2" />
            Supports PDF and Word documents (max 10MB)
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
            <Text strong className="block mb-2">What we&apos;ll extract:</Text>
            <ul className="text-sm text-gray-600 dark:text-gray-400">
              <li>• Personal information (name, contact, location)</li>
              <li>• Work experience and job titles</li>
              <li>• Skills and technologies</li>
              <li>• Education background</li>
              <li>• Professional summary</li>
            </ul>
          </div>
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="space-y-6"
      >
        {/* Professional Summary */}
        <Card title="Professional Summary" className="mb-6">
          <Form.Item
            label="Professional Headline"
            name="headline"
            rules={[{ required: true, message: 'Please enter your professional headline' }]}
          >
            <TextArea
              placeholder="e.g., Open to hearing from fully remote HealthTech and Productivity Tools companies about Front End Developer and Full Stack Developer positions."
              rows={3}
              size="large"
            />
          </Form.Item>
        </Card>

        {/* Skills & Experience */}
        <Card title="Skills & Experience" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

            <Form.Item
              label="Other Skills"
              name="otherSkills"
            >
              <Select
                mode="multiple"
                placeholder="Select additional skills (optional)"
                size="large"
                options={coreSkillsOptions.map(skill => ({ value: skill, label: skill }))}
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
          </div>

          <Form.Item
            label="Industries"
            name="industries"
            rules={[{ required: true, message: 'Please select at least one industry' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select industries you're interested in"
              size="large"
              options={industryOptions.map(industry => ({ value: industry, label: industry }))}
              suffixIcon={<BankOutlined />}
            />
          </Form.Item>
        </Card>

        {/* Work Experience */}
        <Card title="Work Experience" className="mb-6">
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

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <TextArea
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
        </Card>

        {/* Job Preferences */}
        <Card title="Job Preferences" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Work Eligibility"
              name="workEligibility"
              rules={[{ required: true, message: 'Please select your work eligibility' }]}
            >
              <Select
                placeholder="Select your work authorization status"
                size="large"
                options={[
                  { value: 'us', label: 'US Citizen/Permanent Resident' },
                  { value: 'us-visa', label: 'US Work Visa Required' },
                  { value: 'canada', label: 'Canada Citizen/Permanent Resident' },
                  { value: 'eu', label: 'EU Citizen' },
                  { value: 'uk', label: 'UK Citizen' },
                  { value: 'remote-only', label: 'Remote Only (No Visa Required)' },
                  { value: 'other', label: 'Other' },
                ]}
                suffixIcon={<GlobalOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Work Preference"
              name="workPreference"
              rules={[{ required: true, message: 'Please select your work preference' }]}
            >
              <Select
                placeholder="How do you prefer to work?"
                size="large"
                options={[
                  { value: 'remote-anywhere', label: 'Remote Anywhere (No onsite)' },
                  { value: 'remote-us', label: 'Remote (US only)' },
                  { value: 'hybrid', label: 'Hybrid (Some onsite required)' },
                  { value: 'onsite', label: 'Onsite Only' },
                  { value: 'flexible', label: 'Flexible' },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Form.Item
              label="Employment Type"
              name="employmentType"
              rules={[{ required: true, message: 'Please select employment type' }]}
            >
              <Select
                placeholder="What type of employment are you looking for?"
                size="large"
                options={[
                  { value: 'permanent', label: 'Permanent' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'freelance', label: 'Freelance' },
                  { value: 'part-time', label: 'Part-time' },
                  { value: 'flexible', label: 'Flexible' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Expected Salary"
              name="expectedSalary"
            >
              <Input
                placeholder="e.g., $120,000"
                size="large"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Form.Item
              label="Availability"
              name="availability"
            >
              <Select
                placeholder="When can you start?"
                size="large"
                options={[
                  { value: 'immediately', label: 'Immediately' },
                  { value: '1-week', label: '1 week' },
                  { value: '2-weeks', label: '2 weeks' },
                  { value: '1-month', label: '1 month' },
                  { value: '2-months', label: '2 months' },
                  { value: '3-months', label: '3 months' },
                  { value: 'flexible', label: 'Flexible' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Job Search Status"
              name="status"
            >
              <Select
                placeholder="What's your status?"
                size="large"
                options={[
                  { value: 'actively-looking', label: 'Actively looking' },
                  { value: 'open-to-opportunities', label: 'Open to opportunities' },
                  { value: 'not-looking', label: 'Not looking' },
                  { value: 'passive', label: 'Passive' },
                ]}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}
