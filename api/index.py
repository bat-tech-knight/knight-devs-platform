from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
from job_scraper_service import JobScraperService
from resume_parser import ResumeParser
from ats_scorer import ATSScorer
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Validate required environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY or OPENAI_API_KEY == 'your_openai_api_key_here':
    logger.warning("⚠️  OPENAI_API_KEY not set or using placeholder. AI resume parsing will use fallback mode.")
else:
    logger.info("✅ OpenAI API key loaded successfully")

app = Flask(__name__)
CORS(app)

# Initialize services
job_scraper = JobScraperService()
resume_parser = ResumeParser()
ats_scorer = ATSScorer()

def _get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        database=os.getenv('SUPABASE_DB_NAME'),
        user=os.getenv('SUPABASE_DB_USER'),
        password=os.getenv('SUPABASE_DB_PASSWORD')
    )

def _fetch_combined_candidate_profile(user_id: str) -> dict:
    """
    Fetch combined candidate profile data from both profiles and experts tables
    
    Args:
        user_id: The user ID to fetch profile data for
    
    Returns:
        Combined profile dictionary with all relevant data
    """
    try:
        conn = _get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch profile data
        cursor.execute("""
            SELECT 
                id, first_name, last_name, email, phone_number,
                linkedin_url, github_url, twitter_url, location, timezone,
                avatar_url, created_at, updated_at
            FROM profiles 
            WHERE id = %s
        """, (user_id,))
        
        profile_data = cursor.fetchone()
        if not profile_data:
            raise Exception(f"Profile not found for user_id: {user_id}")
        
        # Fetch expert data
        cursor.execute("""
            SELECT 
                user_id, resume_url, resume_text, ai_parsed_data,
                experiences, core_skills, other_skills, industries,
                positions, seniority, headline, work_eligibility,
                work_preference, working_timezones, employment_type,
                expected_salary, skills_preference, funding_stages,
                company_sizes, availability, status, created_at, updated_at
            FROM experts 
            WHERE user_id = %s
        """, (user_id,))
        
        expert_data = cursor.fetchone()
        
        # Combine profile and expert data
        combined_profile = dict(profile_data)
        
        if expert_data:
            # Add expert data to combined profile
            expert_dict = dict(expert_data)
            combined_profile.update(expert_dict)
        else:
            # If no expert data exists, create empty structure
            combined_profile.update({
                'resume_url': None,
                'resume_text': None,
                'ai_parsed_data': {},
                'experiences': [],
                'core_skills': [],
                'other_skills': [],
                'industries': [],
                'positions': [],
                'seniority': None,
                'headline': None,
                'work_eligibility': None,
                'work_preference': None,
                'working_timezones': [],
                'employment_type': None,
                'expected_salary': None,
                'skills_preference': [],
                'funding_stages': [],
                'company_sizes': [],
                'availability': None,
                'status': None
            })
        
        cursor.close()
        conn.close()
        
        return combined_profile
        
    except Exception as e:
        print(f"Error fetching combined candidate profile: {str(e)}")
        raise Exception(f"Failed to fetch candidate profile: {str(e)}")

# Enable CORS for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


# Job Scraping Endpoints

@app.route('/api/jobs/scrape', methods=['POST'])
def scrape_jobs():
    """
    Scrape jobs from various job boards based on configuration
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required',
                'error_type': 'missing_request_body'
            }), 400
        
        # Log the incoming request for debugging
        print(f"Received scraping request: {data}")
        
        # Perform job scraping
        result = job_scraper.scrape_jobs(data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            # Return detailed error information with appropriate HTTP status
            error_response = {
                'success': False,
                'error': result.get('error', 'Unknown error'),
                'error_type': result.get('error_type', 'validation_error'),
                'validation_errors': result.get('validation_errors', []),
                'scraping_errors': result.get('scraping_errors', []),
                'warnings': result.get('warnings', []),
                'received_config': data,
                'config_used': result.get('config_used', {}),
                'suggestion': result.get('suggestion', ''),
                'supported_sites': job_scraper.get_supported_sites(),
                'supported_countries': job_scraper.get_supported_countries(),
                'supported_job_types': job_scraper.get_supported_job_types()
            }
            
            # Determine appropriate HTTP status code based on error type
            error_type = result.get('error_type', 'validation_error')
            if error_type in ['site_blocking', 'scraping_error']:
                status_code = 503  # Service Unavailable
            elif error_type == 'validation_error':
                status_code = 400  # Bad Request
            else:
                status_code = 500  # Internal Server Error
                
            return jsonify(error_response), status_code
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'error_type': 'server_error',
            'exception_type': type(e).__name__
        }), 500



# Resume Parsing Endpoints

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    """
    Parse resume text using AI to extract structured information
    """
    try:
        print("Received resume parsing request")
        
        data = request.get_json()
        
        if not data or 'resume_text' not in data:
            print("Error: Resume text is required")
            return jsonify({
                'success': False,
                'error': 'Resume text is required',
                'error_type': 'missing_resume_text'
            }), 400
        
        resume_text = data['resume_text']
        
        if not resume_text.strip():
            print("Error: Resume text is empty")
            return jsonify({
                'success': False,
                'error': 'Resume text cannot be empty',
                'error_type': 'empty_resume_text'
            }), 400
        
        print(f"Parsing resume text (length: {len(resume_text)} characters)")
        
        # Parse resume with AI
        parsed_data = resume_parser.parse_resume_with_ai(resume_text)
        
        print("Resume parsing completed successfully")
        
        return jsonify({
            'success': True,
            'parsed_data': parsed_data
        }), 200
        
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        print(f"Exception type: {type(e).__name__}")
        
        # Return more detailed error information
        error_response = {
            'success': False,
            'error': f'Failed to parse resume: {str(e)}',
            'error_type': 'parsing_error',
            'exception_type': type(e).__name__
        }
        
        # Add specific error handling for common issues
        if 'timeout' in str(e).lower():
            error_response['error_type'] = 'timeout_error'
            error_response['suggestion'] = 'The AI service took too long to respond. Please try again.'
        elif 'api' in str(e).lower():
            error_response['error_type'] = 'api_error'
            error_response['suggestion'] = 'There was an issue with the AI service. Please check your API configuration.'
        elif 'json' in str(e).lower():
            error_response['error_type'] = 'json_parsing_error'
            error_response['suggestion'] = 'The AI response could not be parsed. Please try again.'
        
        return jsonify(error_response), 500


# ATS Scoring Endpoints

@app.route('/api/ats-score', methods=['POST'])
def calculate_ats_score():
    """
    Calculate ATS score for a candidate against a specific job
    Supports both legacy single profile format and new profile+expert format
    """
    try:
        print("Received ATS scoring request")
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required',
                'error_type': 'missing_request_body'
            }), 400
        
        # Validate required fields
        required_fields = ['job_description']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'error_type': 'missing_required_fields',
                'missing_fields': missing_fields
            }), 400
        
        job_description = data['job_description']
        
        # Check if using new profile+expert format or legacy format
        if 'candidate_profile' in data:
            # Legacy format - single profile
            candidate_profile = data['candidate_profile']
            resume_text = data.get('resume_text')
            print(f"Using legacy profile format for ATS scoring")
        elif 'user_id' in data:
            # New format - fetch from database
            user_id = data['user_id']
            candidate_profile = _fetch_combined_candidate_profile(user_id)
            resume_text = candidate_profile.get('resume_text')
            print(f"Using new profile+expert format for ATS scoring (user_id: {user_id})")
        else:
            return jsonify({
                'success': False,
                'error': 'Either candidate_profile or user_id is required',
                'error_type': 'missing_candidate_data'
            }), 400
        
        print(f"Calculating ATS score for candidate against job: {job_description.get('title', 'Unknown')}")
        
        # Calculate ATS score
        score_result = ats_scorer.calculate_ats_score(
            candidate_profile=candidate_profile,
            job_description=job_description,
            resume_text=resume_text
        )
        
        print(f"ATS scoring completed successfully. Overall score: {score_result.overall_score}")
        
        # Convert result to dictionary for JSON response
        result_dict = {
            'overall_score': score_result.overall_score,
            'skills_match_score': score_result.skills_match_score,
            'experience_match_score': score_result.experience_match_score,
            'keyword_match_score': score_result.keyword_match_score,
            'cultural_fit_score': score_result.cultural_fit_score,
            'detailed_analysis': score_result.detailed_analysis,
            'recommendations': score_result.recommendations,
            'strengths': score_result.strengths,
            'weaknesses': score_result.weaknesses,
            'score_explanation': ats_scorer.get_score_explanation(score_result.overall_score)
        }
        
        return jsonify({
            'success': True,
            'ats_score': result_dict
        }), 200
        
    except Exception as e:
        print(f"Error calculating ATS score: {str(e)}")
        print(f"Exception type: {type(e).__name__}")
        
        error_response = {
            'success': False,
            'error': f'Failed to calculate ATS score: {str(e)}',
            'error_type': 'ats_scoring_error',
            'exception_type': type(e).__name__
        }
        
        # Add specific error handling
        if 'api' in str(e).lower():
            error_response['error_type'] = 'api_error'
            error_response['suggestion'] = 'There was an issue with the AI service. Please check your API configuration.'
        elif 'timeout' in str(e).lower():
            error_response['error_type'] = 'timeout_error'
            error_response['suggestion'] = 'The AI service took too long to respond. Please try again.'
        
        return jsonify(error_response), 500


@app.route('/api/ats-score/batch', methods=['POST'])
def calculate_batch_ats_scores():
    """
    Calculate ATS scores for a candidate against multiple jobs
    Supports both legacy single profile format and new profile+expert format
    """
    try:
        print("Received batch ATS scoring request")
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required',
                'error_type': 'missing_request_body'
            }), 400
        
        # Validate required fields
        required_fields = ['job_descriptions']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'error_type': 'missing_required_fields',
                'missing_fields': missing_fields
            }), 400
        
        job_descriptions = data['job_descriptions']
        
        if not isinstance(job_descriptions, list) or len(job_descriptions) == 0:
            return jsonify({
                'success': False,
                'error': 'job_descriptions must be a non-empty array',
                'error_type': 'invalid_job_descriptions'
            }), 400
        
        # Check if using new profile+expert format or legacy format
        if 'candidate_profile' in data:
            # Legacy format - single profile
            candidate_profile = data['candidate_profile']
            print(f"Using legacy profile format for batch ATS scoring")
        elif 'user_id' in data:
            # New format - fetch from database
            user_id = data['user_id']
            candidate_profile = _fetch_combined_candidate_profile(user_id)
            print(f"Using new profile+expert format for batch ATS scoring (user_id: {user_id})")
        else:
            return jsonify({
                'success': False,
                'error': 'Either candidate_profile or user_id is required',
                'error_type': 'missing_candidate_data'
            }), 400
        
        print(f"Calculating ATS scores for candidate against {len(job_descriptions)} jobs")
        
        # Calculate batch ATS scores
        batch_results = ats_scorer.batch_calculate_ats_scores(
            candidate_profile=candidate_profile,
            job_descriptions=job_descriptions
        )
        
        # Convert results to dictionaries for JSON response
        results = []
        for job_desc, score_result in batch_results:
            result_dict = {
                'job_id': job_desc.get('id'),
                'job_title': job_desc.get('title'),
                'overall_score': score_result.overall_score,
                'skills_match_score': score_result.skills_match_score,
                'experience_match_score': score_result.experience_match_score,
                'keyword_match_score': score_result.keyword_match_score,
                'cultural_fit_score': score_result.cultural_fit_score,
                'detailed_analysis': score_result.detailed_analysis,
                'recommendations': score_result.recommendations,
                'strengths': score_result.strengths,
                'weaknesses': score_result.weaknesses,
                'score_explanation': ats_scorer.get_score_explanation(score_result.overall_score)
            }
            results.append(result_dict)
        
        # Sort by overall score (highest first)
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        
        print(f"Batch ATS scoring completed successfully. Processed {len(results)} jobs")
        
        return jsonify({
            'success': True,
            'ats_scores': results,
            'total_jobs': len(results),
            'average_score': sum(r['overall_score'] for r in results) / len(results) if results else 0
        }), 200
        
    except Exception as e:
        print(f"Error calculating batch ATS scores: {str(e)}")
        print(f"Exception type: {type(e).__name__}")
        
        error_response = {
            'success': False,
            'error': f'Failed to calculate batch ATS scores: {str(e)}',
            'error_type': 'batch_ats_scoring_error',
            'exception_type': type(e).__name__
        }
        
        return jsonify(error_response), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5328)
