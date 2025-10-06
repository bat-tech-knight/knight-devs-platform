from jobspy.model import JobType, JobPost, Location
from jobspy.util import extract_skills_from_description, extract_emails_from_text
from datetime import datetime


def process_producthunt_post(post_data: dict) -> JobPost | None:
    """
    Converts a ProductHunt post to a JobPost
    :param post_data: ProductHunt post data from API
    :return: JobPost object or None if invalid
    """
    try:
        # Extract basic information
        name = post_data.get("name", "")
        description = post_data.get("description", "")
        website = post_data.get("website", "")
        url = post_data.get("url", "")
        slug = post_data.get("slug", "")
        
        if not name or not description:
            return None
        
        # Create a job-like title from the product name
        title = f"Product: {name}"
        
        # Use the website URL as the job URL (this will be the actual product website)
        job_url = website if website else url
        
        # Extract skills from description
        skills = extract_skills_from_description(description) if description else []
        
        # Extract emails from description
        emails = extract_emails_from_text(description) if description else []
        
        # Create a location (ProductHunt posts are typically global/remote)
        location = Location(
            country="Worldwide",
            city=None,
            state=None,
        )
        
        # Set job type as contract/freelance since these are product launches
        job_type = [JobType.CONTRACT]
        
        # Set as remote since products are typically digital
        is_remote = True
        
        # Use current date as posted date (ProductHunt doesn't provide exact dates in this query)
        date_posted = datetime.now().strftime("%Y-%m-%d")
        
        return JobPost(
            id=f'ph-{slug}',
            title=title,
            description=description,
            company_name=name,  # Use product name as company name
            company_url=website,
            company_url_direct=None,
            location=location,
            job_type=job_type,
            compensation=None,  # ProductHunt posts don't have salary info
            date_posted=date_posted,
            job_url=job_url,
            job_url_direct=None,
            emails=emails if emails else None,
            is_remote=is_remote,
            skills=skills if skills else None,
        )
        
    except Exception as e:
        print(f"Error processing ProductHunt post: {e}")
        return None


def is_valid_post(post_data: dict) -> bool:
    """
    Validates if a ProductHunt post should be included
    :param post_data: ProductHunt post data
    :return: True if valid, False otherwise
    """
    # Check if required fields are present
    required_fields = ["name", "description", "url"]
    return all(field in post_data and post_data[field] for field in required_fields)
