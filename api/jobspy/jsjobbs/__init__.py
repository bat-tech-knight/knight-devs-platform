from __future__ import annotations

import math
from datetime import datetime
from typing import Tuple

from jobspy.jsjobbs.constant import api_headers, base_url
from jobspy.jsjobbs.util import get_job_type, get_compensation, is_job_remote
from jobspy.model import (
    Scraper,
    ScraperInput,
    Site,
    JobPost,
    Location,
    JobResponse,
    JobType,
    DescriptionFormat,
)
from jobspy.util import (
    extract_emails_from_text,
    markdown_converter,
    create_session,
    create_logger,
    extract_skills_from_description,
)

log = create_logger("JSJobbs")


class JSJobbs(Scraper):
    def __init__(
        self, proxies: list[str] | str | None = None, ca_cert: str | None = None, user_agent: str | None = None
    ):
        """
        Initializes JSJobbsScraper with the JSJobbs API url
        """
        super().__init__(Site.JSJOBBS, proxies=proxies)

        self.session = create_session(
            proxies=self.proxies, ca_cert=ca_cert, is_tls=False
        )
        self.scraper_input = None
        self.jobs_per_page = 100  # Maximum page size for JSJobbs API
        self.seen_urls = set()
        self.headers = api_headers.copy()

    def scrape(self, scraper_input: ScraperInput) -> JobResponse:
        """
        Scrapes JSJobbs for jobs with scraper_input criteria
        :param scraper_input:
        :return: job_response
        """
        self.scraper_input = scraper_input
        job_list = []
        page = 1
        total_jobs_fetched = 0

        # First, get the total count to know how many jobs are available
        total_count = self._get_total_job_count()
        if total_count is None:
            log.warning("Could not determine total job count, will fetch until no more jobs")
            total_count = float('inf')

        log.info(f"Total jobs available: {total_count}")

        # Set default values if not provided
        results_wanted = scraper_input.results_wanted if scraper_input.results_wanted else 100
        offset = scraper_input.offset if scraper_input.offset else 0
        
        while total_jobs_fetched < total_count and len(self.seen_urls) < results_wanted + offset:
            log.info(f"Fetching page {page} (jobs fetched so far: {total_jobs_fetched})")
            jobs = self._scrape_page(page)
            if not jobs:
                log.info(f"found no jobs on page: {page}")
                break
            job_list += jobs
            total_jobs_fetched += len(jobs)
            page += 1
            
        log.info(f"Finished scraping. Total jobs fetched: {total_jobs_fetched}")
        return JobResponse(
            jobs=job_list[offset:offset + results_wanted]
        )

    def _get_total_job_count(self) -> int | None:
        """
        Gets the total number of jobs available from the API
        :return: total count or None if failed
        """
        try:
            params = {
                'pageNum': 1,
                'pageSize': 1  # Just get 1 job to get the count
            }
            
            response = self.session.get(
                base_url,
                headers=self.headers,
                params=params,
                timeout=10,
                verify=False,
            )
            
            if response.ok:
                data = response.json()
                return data.get("count")
            else:
                log.warning(f"Failed to get total count: {response.status_code}")
                return None
                
        except Exception as e:
            log.warning(f"Error getting total job count: {e}")
            return None

    def _is_email(self, text: str) -> bool:
        """
        Check if a string is an email address
        :param text: string to check
        :return: True if it's an email, False otherwise
        """
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, text.strip()))

    def _scrape_page(self, page: int) -> list[JobPost]:
        """
        Scrapes a page of JSJobbs for jobs with scraper_input criteria
        :param page: page number to scrape
        :return: jobs found on page
        """
        jobs = []
        
        # Build query parameters - JSJobbs API uses pageNum and pageSize
        # Use maximum page size of 100 as specified
        params = {
            'pageNum': page,
            'pageSize': 100  # Maximum page size
        }
        
        # Note: JSJobbs API doesn't seem to support search/location filters in the URL
        # We'll filter results after fetching if needed

        response = self.session.get(
            base_url,
            headers=self.headers,
            params=params,
            timeout=10,
            verify=False,
        )
        
        if not response.ok:
            log.info(
                f"responded with status code: {response.status_code} (submit GitHub issue if this appears to be a bug)"
            )
            return jobs
            
        data = response.json()
        jobs_data = data.get("jobs", [])

        for job in jobs_data:
            processed_job = self._process_job(job)
            if processed_job:
                # Apply search term filter if provided
                if self.scraper_input.search_term and self.scraper_input.search_term.strip():
                    search_term = self.scraper_input.search_term.lower()
                    job_text = f"{processed_job.title} {processed_job.description or ''} {processed_job.company_name or ''}".lower()
                    if search_term not in job_text:
                        continue
                
                # Apply location filter if provided
                if self.scraper_input.location and self.scraper_input.location.strip() and processed_job.location:
                    location_text = f"{processed_job.location.city or ''} {processed_job.location.state or ''} {processed_job.location.country or ''}".lower()
                    if self.scraper_input.location.lower() not in location_text:
                        continue
                
                jobs.append(processed_job)

        return jobs

    def _process_job(self, job: dict) -> JobPost | None:
        """
        Parses the job dict into JobPost model
        :param job: dict to parse
        :return: JobPost if it's a new job
        """
        job_url = job.get("applyLinkOrEmail")
        if not job_url or job_url in self.seen_urls:
            return None
        self.seen_urls.add(job_url)
        
        description = job.get("description", "")
        if self.scraper_input.description_format == DescriptionFormat.MARKDOWN:
            description = markdown_converter(description)

        # Extract job type from jobType field
        job_type = get_job_type(job.get("jobType"))
        
        # Convert timestamp to date - use dateCreated or datePublished
        date_created = job.get("dateCreated") or job.get("datePublished")
        if date_created:
            timestamp_seconds = date_created / 1000
            date_posted = datetime.fromtimestamp(timestamp_seconds).strftime("%Y-%m-%d")
        else:
            date_posted = None

        # Extract company information
        company = job.get("company", {})
        company_name = company.get("name")
        company_url = company.get("website")
        
        # Extract location information from applicantLocations
        applicant_locations = job.get("applicantLocations", [])
        location = None
        if applicant_locations:
            loc = applicant_locations[0]  # Take first location
            location = Location(
                country=loc.get("abbreviation"),
                city=None,  # Not provided in API
                state=None,  # Not provided in API
            )

        # Extract skills from tags
        skills = []
        tags = job.get("tags", [])
        if tags:
            skills = [tag.get("name") for tag in tags if tag.get("name")]

        # Extract additional skills from description
        skills_from_description = extract_skills_from_description(description) if description else []
        all_skills = list(set(skills + skills_from_description))

        # Get compensation
        compensation = get_compensation(job)

        # Extract emails from description
        emails = extract_emails_from_text(description) if description else []
        
        # Check if applyLinkOrEmail is an email address instead of a URL
        apply_link_or_email = job.get("applyLinkOrEmail", "")
        if apply_link_or_email and self._is_email(apply_link_or_email):
            emails.append(apply_link_or_email)
        
        # Remove duplicates and convert to None if empty
        emails = list(set(emails)) if emails else None

        return JobPost(
            id=f'js-{job.get("publicId", "")}',
            title=job.get("title", ""),
            description=description,
            company_name=company_name,
            company_url=company_url,
            company_url_direct=None,
            location=location,
            job_type=job_type,
            compensation=compensation,
            date_posted=date_posted,
            job_url=job_url,
            job_url_direct=None,
            emails=emails,
            is_remote=is_job_remote(job, description),
            skills=all_skills if all_skills else None,
        )
