import re
import json
import os
import requests
from typing import Dict, List, Any, Optional

class ResumeParser:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.openai_base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    
    def parse_resume_with_ai(self, resume_text: str) -> Dict[str, Any]:
        """
        Parse resume text using AI to extract structured information
        """
        try:
            # Use OpenAI API for parsing
            return self._parse_resume_with_openai(resume_text)
            
        except Exception as e:
            # Log the error and re-raise it to get proper error handling
            print(f"AI parsing failed: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            raise e
    
    def _parse_resume_with_openai(self, resume_text: str) -> Dict[str, Any]:
        """
        Parse resume using OpenAI API
        """
        # Check API key
        if not self.openai_api_key:
            raise Exception("OpenAI API key is not configured")
        
        prompt = f"""
        You are a professional resume parser. Extract structured information from the resume text below and return ONLY a valid JSON object.

        CRITICAL EXTRACTION RULES - FOLLOW EXACTLY:
        1. first_name: Extract ONLY the first name (e.g., "David" from "David Lee")
        2. last_name: Extract ONLY the last name (e.g., "Lee" from "David Lee") 
        3. headline: Extract ONLY a short professional title (max 30 characters, e.g., "Full Stack Developer")
        4. location: Extract ONLY the location (e.g., "Grande Prairie, Alberta, Canada")
        5. professional_summary: Extract or Make ONLY a brief 2-3 sentence professional summary from the resume
        6. industries: Extract industries the person has worked in or is interested in (e.g., ["HealthTech", "FinTech"])
        7. experiences: Extract actual work experiences with REAL company names and dates
        8. core_skills: Extract ONLY the most important technical skills (max 10)
        9. other_skills: Extract additional skills not in core_skills

        Return a JSON object with these exact fields:
        {{
            "first_name": "string (first name only)",
            "last_name": "string (last name only)", 
            "location": "string (city, state, country)",
            "timezone": "string (e.g., UTC-8:00)",
            "headline": "string (brief professional title, max 50 characters)",
            "professional_summary": "string (2-3 sentence summary)",
            "availability": "string (immediately, 1-week, 2-weeks, 1-month, 2-months, 3-months, flexible)",
            "status": "string (actively-looking, open-to-opportunities, not-looking, passive)",
            "positions": ["array of position titles"],
            "seniority": "string (junior, mid, senior, lead, principal)",
            "core_skills": ["array of main technical skills (max 10)"],
            "other_skills": ["array of additional skills"],
            "work_eligibility": "string (us, us-visa, canada, eu, uk, remote-only, other)",
            "work_preference": "string (remote-anywhere, remote-us, hybrid, onsite, flexible)",
            "working_timezones": ["array of timezones"],
            "employment_type": "string (permanent, contract, freelance, part-time, flexible)",
            "expected_salary": "string (e.g., $70,000)",
            "skills_preference": ["array of preferred technologies"],
            "industries": ["array of industry interests"],
            "company_sizes": ["array of preferred company sizes"],
            "experiences": [
                {{
                    "title": "string (job title only)",
                    "company": "string (REAL company name, not 'Company Name')",
                    "location": "string",
                    "start_date": "string (YYYY-MM-DD)",
                    "end_date": "string (YYYY-MM-DD or null if current)",
                    "current": "boolean",
                    "description": "string (job description)",
                    "achievements": ["array of achievements"]
                }}
            ]
        }}

        Resume text:
        {resume_text}

        CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting, code blocks, or any other text. Start your response with {{ and end with }}.
        """
        
        headers = {
            'Authorization': f'Bearer {self.openai_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.1,
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
        
        content = result['choices'][0]['message']['content']
        
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
                    cleaned_content = cleaned_content[7:]  # Remove ```json
                elif cleaned_content.startswith('```'):
                    cleaned_content = cleaned_content[3:]   # Remove ```
                
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]  # Remove trailing ```
                
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
        
        # Transform the data to match frontend expert profile expectations
        transformed_data = self._transform_for_frontend(parsed_data)
        
        return transformed_data
    
    def _transform_for_frontend(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform AI response to match frontend expert profile form expectations
        """
        try:
            # Map AI response fields to frontend expert profile form fields
            transformed_data = {
                # Personal Info Step
                "first_name": parsed_data.get("first_name", ""),
                "last_name": parsed_data.get("last_name", ""),
                "location": parsed_data.get("location", ""),
                "timezone": parsed_data.get("timezone", "UTC"),
                "headline": parsed_data.get("headline", ""),
                "professional_summary": parsed_data.get("professional_summary", ""),
                "availability": parsed_data.get("availability", "flexible"),
                "status": parsed_data.get("status", "open-to-opportunities"),
                
                # Skills Step
                "positions": list(set(parsed_data.get("positions", []))),  # Remove duplicates
                "seniority": parsed_data.get("seniority", "mid"),
                "core_skills": list(set(parsed_data.get("core_skills", []))),  # Remove duplicates
                "other_skills": list(set(parsed_data.get("other_skills", []))),  # Remove duplicates
                "work_eligibility": parsed_data.get("work_eligibility", "other"),
                "work_preference": parsed_data.get("work_preference", "flexible"),
                "working_timezones": list(set(parsed_data.get("working_timezones", ["UTC"]))),  # Remove duplicates
                "employment_type": parsed_data.get("employment_type", "permanent"),
                
                # Job Preferences Step
                "expected_salary": parsed_data.get("expected_salary", ""),
                "skills_preference": list(set(parsed_data.get("skills_preference", []))),  # Remove duplicates
                "industries": list(set(parsed_data.get("industries", []))),  # Remove duplicates
                "company_sizes": list(set(parsed_data.get("company_sizes", []))),  # Remove duplicates
                
                # Experience Step
                "experiences": parsed_data.get("experiences", [])
            }
            
            # Clean and validate data
            transformed_data = self._clean_and_validate_data(transformed_data)
            
            return transformed_data
            
        except Exception as e:
            # Return minimal valid structure if transformation fails
            return {
                "first_name": "",
                "last_name": "",
                "location": "",
                "timezone": "UTC",
                "headline": "",
                "professional_summary": "",
                "availability": "flexible",
                "status": "open-to-opportunities",
                "positions": [],
                "seniority": "mid",
                "core_skills": [],
                "other_skills": [],
                "work_eligibility": "other",
                "work_preference": "flexible",
                "working_timezones": ["UTC"],
                "employment_type": "permanent",
                "expected_salary": "",
                "skills_preference": [],
                "industries": [],
                "company_sizes": [],
                "experiences": []
            }
    
    def _clean_and_validate_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean and validate the transformed data
        """
        # Ensure all string fields are strings
        string_fields = [
            "first_name", "last_name", "location", "timezone", "headline", 
            "professional_summary", "availability", "status", "seniority",
            "work_eligibility", "work_preference", "employment_type", "expected_salary"
        ]
        
        for field in string_fields:
            if field in data and not isinstance(data[field], str):
                data[field] = str(data[field]) if data[field] is not None else ""
        
        # Ensure all list fields are lists
        list_fields = [
            "positions", "core_skills", "other_skills", "working_timezones",
            "skills_preference", "industries", "company_sizes", "experiences"
        ]
        
        for field in list_fields:
            if field in data and not isinstance(data[field], list):
                data[field] = []
        
        # Clean up experiences
        if "experiences" in data and isinstance(data["experiences"], list):
            cleaned_experiences = []
            for exp in data["experiences"]:
                if isinstance(exp, dict):
                    cleaned_exp = {
                        "title": str(exp.get("title", "")),
                        "company": str(exp.get("company", "")),
                        "location": str(exp.get("location", "")),
                        "start_date": str(exp.get("start_date", "")),
                        "end_date": str(exp.get("end_date", "")) if exp.get("end_date") else None,
                        "current": bool(exp.get("current", False)),
                        "description": str(exp.get("description", "")),
                        "achievements": list(exp.get("achievements", [])) if isinstance(exp.get("achievements"), list) else []
                    }
                    cleaned_experiences.append(cleaned_exp)
            data["experiences"] = cleaned_experiences
        
        return data
    
    