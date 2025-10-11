import os
import json
import requests
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

@dataclass
class ATSScoreResult:
    """Result of ATS scoring analysis"""
    overall_score: int  # 0-100
    skills_match_score: int  # 0-100
    experience_match_score: int  # 0-100
    keyword_match_score: int  # 0-100
    cultural_fit_score: int  # 0-100
    detailed_analysis: Dict[str, Any]
    recommendations: List[str]
    strengths: List[str]
    weaknesses: List[str]

class ATSScorer:
    """
    Advanced ATS scoring system using OpenAI for intelligent candidate-job matching
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.openai_base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    
    def calculate_ats_score(
        self, 
        candidate_profile: Dict[str, Any], 
        job_description: Dict[str, Any],
        resume_text: Optional[str] = None
    ) -> ATSScoreResult:
        """
        Calculate comprehensive ATS score using OpenAI's advanced analysis capabilities
        
        Args:
            candidate_profile: Parsed candidate profile data
            job_description: Job posting data
            resume_text: Raw resume text (optional, for additional context)
        
        Returns:
            ATSScoreResult with detailed scoring breakdown
        """
        if not self.openai_api_key:
            raise Exception("OpenAI API key is not configured")
        
        # Prepare the analysis prompt
        prompt = self._build_ats_analysis_prompt(candidate_profile, job_description, resume_text)
        
        # Call OpenAI API
        analysis_result = self._call_openai_api(prompt)
        
        # Parse and structure the result
        return self._parse_ats_result(analysis_result)
    
    def _build_ats_analysis_prompt(
        self, 
        candidate_profile: Dict[str, Any], 
        job_description: Dict[str, Any],
        resume_text: Optional[str] = None
    ) -> str:
        """Build comprehensive prompt for ATS analysis"""
        
        # Extract key information
        candidate_skills = candidate_profile.get('core_skills', []) + candidate_profile.get('other_skills', [])
        candidate_experience = candidate_profile.get('experiences', [])
        candidate_seniority = candidate_profile.get('seniority', 'mid')
        
        job_skills = job_description.get('skills', [])
        job_title = job_description.get('title', '')
        job_description_text = job_description.get('description', '')
        job_level = job_description.get('job_level', '')
        job_type = job_description.get('job_type', '')
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) scoring specialist. Analyze the candidate's profile against the job requirements and provide a comprehensive scoring assessment.

CANDIDATE PROFILE:
- Name: {candidate_profile.get('first_name', '')} {candidate_profile.get('last_name', '')}
- Headline: {candidate_profile.get('headline', '')}
- Seniority Level: {candidate_seniority}
- Core Skills: {', '.join(candidate_skills[:10])}
- Additional Skills: {', '.join(candidate_profile.get('other_skills', [])[:10])}
- Work Experience: {len(candidate_experience)} positions
- Location: {candidate_profile.get('location', '')}
- Work Preference: {candidate_profile.get('work_preference', '')}
- Professional Summary: {candidate_profile.get('professional_summary', '')}

JOB REQUIREMENTS:
- Title: {job_title}
- Job Level: {job_level}
- Job Type: {job_type}
- Required Skills: {', '.join(job_skills[:15])}
- Job Description: {job_description_text[:1000]}...

{f"RESUME TEXT (for additional context): {resume_text[:500]}..." if resume_text else ""}

SCORING CRITERIA:
1. Skills Match (0-100): How well do the candidate's skills align with job requirements?
2. Experience Match (0-100): Does the candidate's experience level and background fit the role?
3. Keyword Match (0-100): How many relevant keywords and phrases match between resume and job description?
4. Cultural Fit (0-100): Based on work preferences, location, and career progression patterns
5. Overall Score (0-100): Weighted combination of all factors

ANALYSIS REQUIREMENTS:
- Provide specific, actionable feedback
- Identify both strengths and areas for improvement
- Consider industry context and role seniority
- Account for transferable skills and potential
- Be objective and fair in assessment

Return ONLY a valid JSON object with this exact structure:
{{
    "overall_score": 85,
    "skills_match_score": 90,
    "experience_match_score": 80,
    "keyword_match_score": 75,
    "cultural_fit_score": 88,
    "detailed_analysis": {{
        "skills_analysis": "Detailed analysis of skills alignment...",
        "experience_analysis": "Analysis of experience relevance...",
        "keyword_analysis": "Analysis of keyword matching...",
        "cultural_fit_analysis": "Analysis of cultural compatibility..."
    }},
    "recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2"
    ],
    "strengths": [
        "Key strength 1",
        "Key strength 2"
    ],
    "weaknesses": [
        "Area for improvement 1",
        "Area for improvement 2"
    ]
}}

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting, code blocks, or any other text.
"""
        
        return prompt
    
    def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        """Call OpenAI API for ATS analysis"""
        
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.1,  # Low temperature for consistent scoring
            'max_tokens': 2000
        }
        
        response = requests.post(
            f'{self.openai_base_url}/chat/completions',
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            error_detail = response.text if response.text else "No error details"
            raise Exception(f"OpenAI API error {response.status_code}: {error_detail}")
        
        try:
            result = response.json()
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenAI API response: {str(e)}")
        
        if 'choices' not in result or not result['choices']:
            raise Exception("No choices in OpenAI API response")
        
        return result['choices'][0]['message']['content']
    
    def _parse_ats_result(self, content: str) -> ATSScoreResult:
        """Parse OpenAI response into ATSScoreResult"""
        
        # Parse JSON - handle markdown code blocks if present
        parsed_data = None
        
        # First try direct parsing
        try:
            parsed_data = json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # If direct parsing failed, try removing markdown code blocks
        if parsed_data is None:
            try:
                cleaned_content = content.strip()
                
                # Remove markdown code blocks
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                elif cleaned_content.startswith('```'):
                    cleaned_content = cleaned_content[3:]
                
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                
                cleaned_content = cleaned_content.strip()
                parsed_data = json.loads(cleaned_content)
            except json.JSONDecodeError:
                pass
        
        # If still failed, try regex extraction
        if parsed_data is None:
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
        
        if parsed_data is None:
            raise Exception(f"Failed to parse AI response as JSON. Content: {content[:200]}...")
        
        # Validate and create ATSScoreResult
        return ATSScoreResult(
            overall_score=self._validate_score(parsed_data.get('overall_score', 0)),
            skills_match_score=self._validate_score(parsed_data.get('skills_match_score', 0)),
            experience_match_score=self._validate_score(parsed_data.get('experience_match_score', 0)),
            keyword_match_score=self._validate_score(parsed_data.get('keyword_match_score', 0)),
            cultural_fit_score=self._validate_score(parsed_data.get('cultural_fit_score', 0)),
            detailed_analysis=parsed_data.get('detailed_analysis', {}),
            recommendations=parsed_data.get('recommendations', []),
            strengths=parsed_data.get('strengths', []),
            weaknesses=parsed_data.get('weaknesses', [])
        )
    
    def _validate_score(self, score: Any) -> int:
        """Validate and normalize score to 0-100 range"""
        try:
            score_int = int(score)
            return max(0, min(100, score_int))
        except (ValueError, TypeError):
            return 0
    
    def batch_calculate_ats_scores(
        self, 
        candidate_profile: Dict[str, Any], 
        job_descriptions: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], ATSScoreResult]]:
        """
        Calculate ATS scores for multiple jobs efficiently
        
        Args:
            candidate_profile: Candidate profile data
            job_descriptions: List of job descriptions
        
        Returns:
            List of tuples containing (job_description, ats_score_result)
        """
        results = []
        
        for job_desc in job_descriptions:
            try:
                score_result = self.calculate_ats_score(candidate_profile, job_desc)
                results.append((job_desc, score_result))
            except Exception as e:
                print(f"Error calculating ATS score for job {job_desc.get('id', 'unknown')}: {str(e)}")
                # Create a default low score result for failed calculations
                default_result = ATSScoreResult(
                    overall_score=0,
                    skills_match_score=0,
                    experience_match_score=0,
                    keyword_match_score=0,
                    cultural_fit_score=0,
                    detailed_analysis={"error": str(e)},
                    recommendations=["Unable to analyze this job match"],
                    strengths=[],
                    weaknesses=["Analysis failed"]
                )
                results.append((job_desc, default_result))
        
        return results
    
    def get_score_explanation(self, score: int) -> str:
        """Get human-readable explanation of ATS score"""
        if score >= 90:
            return "Excellent match - Highly recommended for immediate review"
        elif score >= 80:
            return "Very good match - Strong candidate for the role"
        elif score >= 70:
            return "Good match - Worth considering for the position"
        elif score >= 60:
            return "Moderate match - May need additional evaluation"
        elif score >= 50:
            return "Fair match - Consider if other factors align"
        elif score >= 40:
            return "Below average match - Unlikely to be a good fit"
        else:
            return "Poor match - Not recommended for this role"
