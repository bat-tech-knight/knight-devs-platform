# Knight Devs Platform - Flask API

This Flask API handles job scraping and resume parsing for the Knight Devs Platform.

## Features

- **Job Scraping**: Scrape jobs from multiple platforms
- **Resume Parsing**: AI-powered resume text parsing
- **CORS Support**: Configured for cross-origin requests
- **Environment Variables**: Uses python-dotenv for configuration

## Setup

### 1. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the `api` directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=true
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Start the Flask API

```bash
# Development mode
python index.py

# Production mode
gunicorn -w 4 -b 0.0.0.0:5000 index:app
```

## API Endpoints

### Health Check
- `GET /api/health` - API health status

### Resume Parsing
- `POST /api/parse-resume` - Parse resume text using AI
- `GET /api/parse-resume/health` - Check resume parser health

### Job Scraping
- `POST /api/scrape-jobs` - Scrape jobs from multiple platforms

## Environment Variables

The API uses `python-dotenv` to load environment variables from a `.env` file:

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI resume parsing)
- `OPENAI_BASE_URL`: OpenAI API base URL (defaults to official endpoint)
- `FLASK_ENV`: Flask environment (development/production)
- `FLASK_DEBUG`: Enable Flask debug mode
- `FLASK_HOST`: Flask host (default: 0.0.0.0)
- `FLASK_PORT`: Flask port (default: 5000)

## Development

The API automatically loads environment variables and validates the OpenAI API key on startup. If the key is missing or invalid, it will log a warning and use fallback parsing.
