import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ResumeGenerationRequest {
  candidateProfile: Record<string, unknown>;
  jobDescription: Record<string, unknown>;
  atsScore: number;
  resumeFormat?: string;
}

export interface ResumeGenerationResult {
  success: boolean;
  resumeContent?: string;
  resumeTitle?: string;
  generationMetadata?: Record<string, unknown>;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResumeGenerationRequest = await request.json();
    const { candidateProfile, jobDescription, atsScore, resumeFormat = 'markdown' } = body;

    // Validate ATS score requirement
    if (atsScore < 95) {
      return NextResponse.json({
        success: false,
        error: `ATS score ${atsScore} is below the required threshold of 95`
      }, { status: 400 });
    }

    // Create the generation prompt
    const prompt = createResumePrompt(candidateProfile, jobDescription, resumeFormat);

    // Generate resume using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer and career coach. Create professional, ATS-optimized resumes that highlight the candidate's most relevant skills and experiences for specific job opportunities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, professional output
      max_tokens: 3000
    });

    const resumeContent = response.choices[0].message.content;
    const resumeTitle = generateResumeTitle(candidateProfile, jobDescription);

    // Create generation metadata
    const generationMetadata = {
      model: "gpt-4",
      temperature: 0.3,
      max_tokens: 3000,
      atsScore,
      jobTitle: jobDescription.title || "Unknown",
      companyName: jobDescription.company_name || "Unknown",
      generationTimestamp: response.created,
      promptLength: prompt.length
    };

    // Save to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not authenticated"
      }, { status: 401 });
    }

    // Upload resume file to storage bucket
    const fileName = `${user.id}/${jobDescription.id}/${resumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${resumeFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-resumes')
      .upload(fileName, resumeContent, {
        contentType: resumeFormat === 'html' ? 'text/html' : resumeFormat === 'pdf' ? 'application/pdf' : resumeFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/markdown',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading resume to storage:', uploadError);
      return NextResponse.json({
        success: false,
        error: "Failed to upload resume file"
      }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('generated-resumes')
      .getPublicUrl(fileName);

    // Save resume metadata to database
    const { data, error } = await supabase
      .from('generated_resumes')
      .insert({
        candidate_id: user.id,
        job_id: jobDescription.id,
        ats_score: atsScore,
        resume_title: resumeTitle,
        resume_content: resumeContent,
        resume_format: resumeFormat,
        file_url: urlData.publicUrl,
        generation_prompt: prompt,
        generation_metadata: generationMetadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving resume to Supabase:', error);
      return NextResponse.json({
        success: false,
        error: "Failed to save resume to database"
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resumeContent,
      resumeTitle,
      generationMetadata,
      resumeId: data.id
    });

  } catch (error) {
    console.error('Error generating resume:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}

function createResumePrompt(candidateProfile: Record<string, unknown>, jobDescription: Record<string, unknown>, resumeFormat: string = 'markdown'): string {
  // Extract candidate information
  const firstName = candidateProfile.first_name as string || "Candidate";
  const lastName = candidateProfile.last_name as string || "";
  const headline = candidateProfile.headline as string || "Professional";
  const coreSkills = candidateProfile.core_skills as string[] || [];
  const otherSkills = candidateProfile.other_skills as string[] || [];
  const seniority = candidateProfile.seniority as string || "mid-level";
  const workPreference = candidateProfile.work_preference as string || "any";
  const experienceYears = candidateProfile.experience_years as number || 0;
  
  // Extract education and experience
  const education = candidateProfile.education as string || "";
  const experience = candidateProfile.experience as string || "";
  const projects = candidateProfile.projects as string || "";
  const achievements = candidateProfile.achievements as string || "";

  // Extract job information
  const jobTitle = jobDescription.title as string || "Position";
  const companyName = jobDescription.company_name as string || "Company";
  const jobDescriptionText = jobDescription.description as string || "";
  const requiredSkills = jobDescription.skills as string[] || [];
  const jobLevel = jobDescription.job_level as string || "";
  const jobType = jobDescription.job_type as string || "";
  const location = jobDescription.location as string || "";

  return `
Create a professional, ATS-optimized resume for the following candidate targeting this specific job opportunity.

CANDIDATE PROFILE:
- Name: ${firstName} ${lastName}
- Professional Headline: ${headline}
- Seniority Level: ${seniority}
- Years of Experience: ${experienceYears}
- Work Preference: ${workPreference}
- Core Skills: ${coreSkills.join(', ') || 'Not specified'}
- Additional Skills: ${otherSkills.join(', ') || 'Not specified'}

CANDIDATE EDUCATION:
${education || 'Education information not provided'}

CANDIDATE EXPERIENCE:
${experience || 'Experience information not provided'}

CANDIDATE PROJECTS:
${projects || 'Project information not provided'}

CANDIDATE ACHIEVEMENTS:
${achievements || 'Achievement information not provided'}

TARGET JOB OPPORTUNITY:
- Job Title: ${jobTitle}
- Company: ${companyName}
- Location: ${location}
- Job Level: ${jobLevel}
- Job Type: ${jobType}
- Required Skills: ${requiredSkills.join(', ') || 'Not specified'}

JOB DESCRIPTION:
${jobDescriptionText.substring(0, 1000)}...

RESUME REQUIREMENTS:
1. Format the resume in clean ${resumeFormat === 'docx' ? 'DOCX format (structured document ready for Word processing)' : resumeFormat === 'pdf' ? 'HTML format (ready for PDF conversion)' : 'markdown format'}
2. Optimize for ATS (Applicant Tracking System) compatibility
3. Highlight skills and experiences most relevant to this specific job
4. Use action verbs and quantifiable achievements where possible
5. Include a compelling professional summary tailored to this role
6. Organize sections logically: Header, Summary, Experience, Education, Skills, Projects/Achievements
7. Emphasize transferable skills and relevant experience
8. Use industry-standard keywords from the job description
9. Keep the resume concise but comprehensive (1-2 pages when converted to PDF)
10. Ensure the resume tells a coherent story of why this candidate is perfect for this role
${resumeFormat === 'docx' ? '11. Use proper document structure with clear headings and formatting' : ''}
${resumeFormat === 'pdf' ? '11. Use proper HTML structure with semantic tags (h1, h2, h3, p, ul, li, strong, em)' : ''}
${resumeFormat === 'pdf' ? '12. Include inline CSS styling for professional appearance' : ''}
${resumeFormat === 'pdf' ? '13. Ensure the HTML is print-ready and ATS-friendly' : ''}

Please generate a professional resume that maximizes the candidate's chances of getting an interview for this specific position.
`;
}

function generateResumeTitle(candidateProfile: Record<string, unknown>, jobDescription: Record<string, unknown>): string {
  const firstName = candidateProfile.first_name as string || "Candidate";
  const lastName = candidateProfile.last_name as string || "";
  const jobTitle = jobDescription.title as string || "Position";
  const companyName = jobDescription.company_name as string || "Company";

  return `${firstName} ${lastName} - ${jobTitle} at ${companyName}`;
}
