"""
Job Scraper Service Module
Handles jobspy integration and provides a clean interface for job scraping operations
"""

import html as html_lib
import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from markdownify import markdownify as html_to_markdown

from jobspy import scrape_jobs
from jobspy.model import Site, Country, JobType
from jobspy.util import desired_order

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GREENHOUSE_SITE = "greenhouse"
_GREENHOUSE_TOKEN_RE = re.compile(r"^[a-zA-Z0-9_-]+$")


def _greenhouse_looks_remote(title: str, loc_display: Optional[str]) -> bool:
    blob = f"{title} {loc_display or ''}".lower()
    return "remote" in blob or "work from home" in blob


class JobScraperService:
    """Service class for handling job scraping operations using jobspy"""
    
    def __init__(self):
        self.supported_sites = [site.value for site in Site] + [GREENHOUSE_SITE]
        self.supported_countries = [country.value[0] for country in Country]
        self.supported_job_types = [job_type.value[0] for job_type in JobType]
    
    def get_supported_sites(self) -> List[str]:
        """Get list of supported job sites"""
        return self.supported_sites
    
    def get_supported_countries(self) -> List[str]:
        """Get list of supported countries"""
        return self.supported_countries
    
    def get_supported_job_types(self) -> List[str]:
        """Get list of supported job types"""
        return self.supported_job_types

    def _request_is_greenhouse(self, cfg: Dict[str, Any]) -> bool:
        sn = cfg.get("site_name")
        if isinstance(sn, str):
            return sn == GREENHOUSE_SITE
        if isinstance(sn, list):
            return len(sn) == 1 and sn[0] == GREENHOUSE_SITE
        return False

    @staticmethod
    def _parse_greenhouse_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value or not isinstance(value, str):
            return None
        s = value.strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except ValueError:
            return None

    def _scrape_greenhouse(self, config: Dict[str, Any]) -> pd.DataFrame:
        """Fetch jobs from Greenhouse Job Board API (public boards-api)."""
        token = config.get("greenhouse_board_token") or ""
        token = str(token).strip()
        if not token:
            raise ValueError("greenhouse_board_token is required for Greenhouse scraping")

        board_url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
        headers = {"User-Agent": "KnightDevsJobScraper/1.0"}
        list_resp = requests.get(board_url, headers=headers, timeout=60)
        if list_resp.status_code == 404:
            raise ValueError(
                f"Greenhouse board not found for token '{token}'. Check the board slug (e.g. stripe, airbnb)."
            )
        list_resp.raise_for_status()
        payload = list_resp.json()
        jobs_raw: List[dict] = payload.get("jobs") or []
        if not isinstance(jobs_raw, list):
            jobs_raw = []

        search_term = (config.get("search_term") or "").strip().lower()
        location_sub = (config.get("location") or "").strip().lower()
        want_remote = bool(config.get("is_remote"))
        hours_old = config.get("hours_old")
        results_wanted = int(config.get("results_wanted") or 15)
        description_format = (config.get("description_format") or "markdown").lower()

        now_utc = datetime.now(timezone.utc)
        cutoff: Optional[datetime] = None
        if hours_old is not None:
            try:
                cutoff = now_utc - timedelta(hours=int(hours_old))
            except (TypeError, ValueError):
                cutoff = None

        def passes_filters(job: dict) -> bool:
            title = (job.get("title") or "").lower()
            loc_name = ((job.get("location") or {}) or {}).get("name") or ""
            loc_lower = str(loc_name).lower()
            if search_term and search_term not in title:
                return False
            if location_sub and location_sub not in loc_lower:
                return False
            if want_remote:
                blob = f"{title} {loc_lower}"
                if "remote" not in blob and "work from home" not in blob:
                    return False
            if cutoff is not None:
                published = self._parse_greenhouse_datetime(
                    job.get("first_published") or job.get("updated_at")
                )
                if published is None or published < cutoff:
                    return False
            return True

        filtered = [j for j in jobs_raw if isinstance(j, dict) and passes_filters(j)]
        filtered = filtered[: max(1, min(results_wanted, 500))]

        rows: List[Dict[str, Any]] = []
        detail_base = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"

        for job in filtered:
            jid = job.get("id")
            if jid is None:
                continue
            detail_url = f"{detail_base}/{jid}"
            desc: Optional[str] = None
            try:
                dresp = requests.get(detail_url, headers=headers, timeout=45)
                if dresp.ok:
                    detail = dresp.json()
                    raw_html = html_lib.unescape(detail.get("content") or "")
                    raw_html = raw_html.strip()
                    if raw_html:
                        if description_format == "markdown":
                            desc = html_to_markdown(raw_html, heading_style="ATX").strip() or None
                        else:
                            desc = raw_html
            except requests.RequestException as ex:
                logger.warning("Greenhouse job %s detail fetch failed: %s", jid, ex)

            loc_obj = job.get("location") if isinstance(job.get("location"), dict) else {}
            loc_display = loc_obj.get("name") if loc_obj else None
            posted = self._parse_greenhouse_datetime(
                job.get("first_published") or job.get("updated_at")
            )
            date_posted = posted.date() if posted else None

            title = job.get("title") or ""
            company = job.get("company_name") or ""
            job_url = job.get("absolute_url") or detail_url

            rows.append(
                {
                    "id": str(jid),
                    "site": GREENHOUSE_SITE,
                    "job_url": job_url,
                    "job_url_direct": job_url,
                    "title": title,
                    "company": company,
                    "location": loc_display,
                    "date_posted": date_posted,
                    "job_type": None,
                    "salary_source": None,
                    "interval": None,
                    "min_amount": None,
                    "max_amount": None,
                    "currency": None,
                    "is_remote": _greenhouse_looks_remote(title, loc_display),
                    "job_level": None,
                    "job_function": None,
                    "listing_type": None,
                    "emails": None,
                    "description": desc,
                    "company_industry": None,
                    "company_url": None,
                    "company_logo": None,
                    "company_url_direct": None,
                    "company_addresses": None,
                    "company_num_employees": None,
                    "company_revenue": None,
                    "company_description": None,
                    "skills": None,
                    "experience_range": None,
                    "company_rating": None,
                    "company_reviews_count": None,
                    "vacancy_count": None,
                    "work_from_home_type": None,
                }
            )

        if not rows:
            return pd.DataFrame()

        jobs_df = pd.DataFrame(rows)
        for column in desired_order:
            if column not in jobs_df.columns:
                jobs_df[column] = None
        return jobs_df[desired_order].sort_values(
            by=["site", "date_posted"], ascending=[True, False]
        ).reset_index(drop=True)
    
    def validate_scraping_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate scraping configuration parameters
        
        Args:
            config: Dictionary containing scraping configuration
            
        Returns:
            Dictionary with validation results and cleaned config
        """
        errors = []
        warnings = []
        cleaned_config = config.copy()
        
        # Validate site_name
        if 'site_name' in config:
            site_name = config['site_name']
            if isinstance(site_name, str):
                if site_name not in self.supported_sites:
                    errors.append(f"Unsupported site: {site_name}. Supported sites: {self.supported_sites}")
                else:
                    cleaned_config['site_name'] = site_name
            elif isinstance(site_name, list):
                invalid_sites = [site for site in site_name if site not in self.supported_sites]
                if invalid_sites:
                    errors.append(f"Unsupported sites: {invalid_sites}. Supported sites: {self.supported_sites}")
                else:
                    cleaned_config['site_name'] = site_name
            else:
                errors.append("site_name must be a string or list of strings")
        else:
            errors.append("site_name is required")

        sn = cleaned_config.get("site_name")
        site_slugs: List[str] = []
        if isinstance(sn, str):
            site_slugs = [sn]
        elif isinstance(sn, list):
            site_slugs = list(sn)

        if GREENHOUSE_SITE in site_slugs:
            if len(site_slugs) > 1:
                errors.append(
                    "greenhouse cannot be combined with other sites in the same scrape request"
                )
            raw_tok = config.get("greenhouse_board_token")
            if not raw_tok or not str(raw_tok).strip():
                errors.append(
                    "greenhouse_board_token is required for Greenhouse (board slug from the jobs URL, e.g. stripe)"
                )
            else:
                tok = str(raw_tok).strip()
                if not _GREENHOUSE_TOKEN_RE.match(tok):
                    errors.append(
                        "greenhouse_board_token must contain only letters, numbers, underscores, and hyphens"
                    )
                else:
                    cleaned_config["greenhouse_board_token"] = tok
        else:
            cleaned_config.pop("greenhouse_board_token", None)
        
        # Validate search_term (optional)
        if 'search_term' in config and config['search_term']:
            cleaned_config['search_term'] = str(config['search_term']).strip()
        else:
            cleaned_config['search_term'] = None  # Make it optional
        
        # Validate location (optional)
        if 'location' in config and config['location']:
            cleaned_config['location'] = str(config['location'])
        
        # Validate country_indeed
        if 'country_indeed' in config:
            country = config['country_indeed']
            # Check if country matches any of the supported countries (including comma-separated values)
            country_matched = False
            for supported_country in self.supported_countries:
                if country.lower() in [c.strip().lower() for c in supported_country.split(',')]:
                    cleaned_config['country_indeed'] = supported_country.split(',')[0].strip()  # Use first part
                    country_matched = True
                    break
            
            if not country_matched:
                errors.append(f"Unsupported country: {country}. Supported countries: {self.supported_countries}")
        else:
            cleaned_config['country_indeed'] = 'usa'  # Default to USA
        
        greenhouse_only = len(site_slugs) == 1 and site_slugs[0] == GREENHOUSE_SITE

        # Validate job_type (optional)
        if 'job_type' in config and config['job_type']:
            if greenhouse_only:
                cleaned_config["job_type"] = None
            else:
                job_type = config['job_type']
                if job_type not in self.supported_job_types:
                    errors.append(f"Unsupported job type: {job_type}. Supported job types: {self.supported_job_types}")
                else:
                    cleaned_config['job_type'] = job_type
        
        # Validate results_wanted
        if 'results_wanted' in config:
            try:
                results_wanted = int(config['results_wanted'])
                if results_wanted <= 0:
                    errors.append("results_wanted must be a positive integer")
                elif results_wanted > 100:
                    warnings.append("results_wanted is very high, this may take a long time")
                elif greenhouse_only and results_wanted > 25:
                    warnings.append(
                        "Greenhouse loads each job description separately; large results_wanted may be slow"
                    )
                cleaned_config['results_wanted'] = results_wanted
            except (ValueError, TypeError):
                errors.append("results_wanted must be a valid integer")
        else:
            cleaned_config['results_wanted'] = 15  # Default value
        
        # Validate distance (optional)
        if 'distance' in config:
            try:
                distance = int(config['distance'])
                if distance < 0 or distance > 200:
                    errors.append("distance must be between 0 and 200 miles")
                cleaned_config['distance'] = distance
            except (ValueError, TypeError):
                errors.append("distance must be a valid integer")
        else:
            cleaned_config['distance'] = 50  # Default value
        
        # Validate boolean fields
        boolean_fields = ['is_remote', 'easy_apply', 'linkedin_fetch_description', 'enforce_annual_salary']
        for field in boolean_fields:
            if field in config:
                if isinstance(config[field], bool):
                    cleaned_config[field] = config[field]
                elif isinstance(config[field], str):
                    if config[field].lower() in ['true', '1', 'yes']:
                        cleaned_config[field] = True
                    elif config[field].lower() in ['false', '0', 'no']:
                        cleaned_config[field] = False
                    else:
                        errors.append(f"{field} must be a boolean value")
                else:
                    errors.append(f"{field} must be a boolean value")
        
        # Validate numeric fields
        numeric_fields = ['offset', 'hours_old']
        for field in numeric_fields:
            if field in config and config[field] is not None:
                try:
                    cleaned_config[field] = int(config[field])
                except (ValueError, TypeError):
                    errors.append(f"{field} must be a valid integer")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'cleaned_config': cleaned_config
        }
    
    def scrape_jobs(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scrape jobs based on the provided configuration
        
        Args:
            config: Dictionary containing scraping configuration
            
        Returns:
            Dictionary containing scraping results or error information
        """
        try:
            # Validate configuration
            validation_result = self.validate_scraping_config(config)
            
            if not validation_result['is_valid']:
                return {
                    'success': False,
                    'error': 'Configuration validation failed',
                    'validation_errors': validation_result['errors'],
                    'warnings': validation_result['warnings']
                }
            
            cleaned_config = validation_result['cleaned_config']
            
            # Log the scraping attempt
            logger.info(f"Starting job scraping with config: {cleaned_config}")
            
            # Perform the scraping
            start_time = datetime.now()
            
            # Capture any errors that occur during scraping
            scraping_errors = []
            jobs_df = None
            
            try:
                if self._request_is_greenhouse(cleaned_config):
                    jobs_df = self._scrape_greenhouse(cleaned_config)
                else:
                    jobspy_kwargs = {
                        k: v
                        for k, v in cleaned_config.items()
                        if k != "greenhouse_board_token"
                    }
                    jobs_df = scrape_jobs(**jobspy_kwargs)
            except Exception as scraping_error:
                scraping_errors.append(f"Scraping error: {str(scraping_error)}")
                logger.error(f"Error during scraping: {str(scraping_error)}")
            
            end_time = datetime.now()
            
            # Check if scraping failed completely
            if scraping_errors:
                return {
                    'success': False,
                    'error': 'Scraping failed due to errors',
                    'error_type': 'scraping_error',
                    'scraping_errors': scraping_errors,
                    'config_used': cleaned_config
                }
            
            # Convert DataFrame to dictionary for JSON serialization
            if jobs_df is not None and not jobs_df.empty:
                jobs_data = jobs_df.to_dict('records')
                
                # Clean up the data for JSON serialization
                for job in jobs_data:
                    # Convert datetime objects to strings
                    if 'date_posted' in job and pd.notna(job['date_posted']):
                        job['date_posted'] = job['date_posted'].strftime('%Y-%m-%d')
                    
                    # Convert NaN values to None
                    for key, value in job.items():
                        if pd.isna(value):
                            job[key] = None
                
                result = {
                    'success': True,
                    'jobs': jobs_data,
                    'total_jobs': len(jobs_data),
                    'scraping_time_seconds': (end_time - start_time).total_seconds(),
                    'config_used': cleaned_config,
                    'warnings': validation_result['warnings']
                }
                
                logger.info(f"Successfully scraped {len(jobs_data)} jobs in {(end_time - start_time).total_seconds():.2f} seconds")
                return result
            else:
                # Check if this is likely due to an error (e.g., 403, site blocking, etc.)
                # by checking if we have a specific site that might have failed
                site_name = cleaned_config.get('site_name', 'unknown')
                
                # If we're scraping a specific site and got no results, it might be an error
                if isinstance(site_name, str) and site_name in ['bayt', 'naukri', 'bdjobs']:
                    return {
                        'success': False,
                        'error': f'No jobs found from {site_name}. This might be due to site blocking or anti-bot protection.',
                        'error_type': 'site_blocking',
                        'config_used': cleaned_config,
                        'warnings': validation_result['warnings'],
                        'suggestion': 'Try using a different site or check if the site is accessible'
                    }
                else:
                    return {
                        'success': True,
                        'jobs': [],
                        'total_jobs': 0,
                        'scraping_time_seconds': (end_time - start_time).total_seconds(),
                        'config_used': cleaned_config,
                        'warnings': validation_result['warnings'],
                        'message': 'No jobs found matching the criteria'
                    }
                
        except Exception as e:
            logger.error(f"Error during job scraping: {str(e)}")
            return {
                'success': False,
                'error': f'Scraping failed: {str(e)}',
                'error_type': type(e).__name__
            }
    
    def get_scraping_stats(self) -> Dict[str, Any]:
        """
        Get statistics about supported scraping options
        
        Returns:
            Dictionary containing scraping statistics
        """
        return {
            'supported_sites_count': len(self.supported_sites),
            'supported_countries_count': len(self.supported_countries),
            'supported_job_types_count': len(self.supported_job_types),
            'supported_sites': self.supported_sites,
            'supported_countries': self.supported_countries,
            'supported_job_types': self.supported_job_types
        }
