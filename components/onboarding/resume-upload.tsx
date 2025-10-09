"use client";

import { useState } from "react";
import { Button, Card, Upload, Progress, Alert, Typography } from "antd";
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { KnightLogo } from "@/components/knight-logo";
import { createClient } from "@/lib/supabase/client";
import pdfToText from "react-pdftotext";

const { Title, Text } = Typography;

interface ResumeUploadProps {
  onResumeParsed: (data: Record<string, unknown>) => void;
  onSkip: () => void;
}

export function ResumeUpload({ onResumeParsed, onSkip }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
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
      
      // Map AI response fields to onboarding form fields
      const mappedData = {
        firstName: parsedData.parsed_data?.first_name || '',
        lastName: parsedData.parsed_data?.last_name || '',
        location: parsedData.parsed_data?.location || '',
        timezone: parsedData.parsed_data?.timezone || '',
        headline: parsedData.parsed_data?.headline || '',
        professionalSummary: parsedData.parsed_data?.professional_summary || '', // Added missing field
        availability: parsedData.parsed_data?.availability || '',
        status: parsedData.parsed_data?.status || '',
        positions: [...new Set(parsedData.parsed_data?.positions || [])], // Remove duplicates
        seniority: parsedData.parsed_data?.seniority || '',
        coreSkills: [...new Set(parsedData.parsed_data?.core_skills || [])], // Remove duplicates
        otherSkills: [...new Set(parsedData.parsed_data?.other_skills || [])], // Remove duplicates
        workEligibility: parsedData.parsed_data?.work_eligibility || '',
        workPreference: parsedData.parsed_data?.work_preference || '',
        workingTimezones: [...new Set(parsedData.parsed_data?.working_timezones || [])], // Remove duplicates
        employmentType: parsedData.parsed_data?.employment_type || '',
        expectedSalary: parsedData.parsed_data?.expected_salary || '',
        skillsPreference: [...new Set(parsedData.parsed_data?.skills_preference || [])], // Remove duplicates
        industries: [...new Set(parsedData.parsed_data?.industries || [])], // Remove duplicates
        companySizes: [...new Set(parsedData.parsed_data?.company_sizes || [])], // Remove duplicates
        experiences: parsedData.parsed_data?.experiences || []
      };
      
      // Update user profile with resume info
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          resume_url: urlData.publicUrl,
          resume_text: resumeText,
          ai_parsed_data: parsedData.parsed_data,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onResumeParsed(mappedData);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isPDF = file.type === 'application/pdf';
      const isDoc = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isPDF && !isDoc) {
        setError('Please upload a PDF or Word document');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        setError('File must be smaller than 10MB');
        return false;
      }

      handleUpload(file);
      return false; // Prevent default upload
    },
    showUploadList: false,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <KnightLogo size="lg" />
          </div>
          <Title level={2}>Upload Your Resume</Title>
          <Text type="secondary" className="text-lg">
            Upload your resume and we&apos;ll automatically extract your information to pre-fill your profile
          </Text>
        </div>

        {error && (
          <Alert
            message="Upload Error"
            description={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        {success && (
          <Alert
            message="Resume Parsed Successfully!"
            description="We&apos;ve extracted your information and will pre-fill your profile fields."
            type="success"
            icon={<CheckCircleOutlined />}
            className="mb-6"
          />
        )}

        {(uploading || parsing) && (
          <div className="mb-6">
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

        <div className="text-center">
          <Upload {...uploadProps}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading || parsing}
              disabled={uploading || parsing || success}
              className="mb-4"
            >
              {uploading ? 'Uploading...' : parsing ? 'Parsing...' : 'Upload Resume'}
            </Button>
          </Upload>
          
          <div className="text-sm text-gray-500 mb-6">
            <FileTextOutlined className="mr-2" />
            Supports PDF and Word documents (max 10MB)
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <Button
                type="link"
                onClick={onSkip}
                disabled={uploading || parsing}
                className="text-gray-600"
              >
                Skip and fill manually
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <Text strong className="block mb-2">What we&apos;ll extract:</Text>
              <ul className="text-sm text-gray-600 dark:text-gray-400 text-left">
                <li>• Personal information (name, contact, location)</li>
                <li>• Work experience and job titles</li>
                <li>• Skills and technologies</li>
                <li>• Education background</li>
                <li>• Professional summary</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

