from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
from job_scraper_service import JobScraperService
from resume_parser import ResumeParser

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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5328)
