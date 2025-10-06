"""
Job Scraper Service Module
Handles jobspy integration and provides a clean interface for job scraping operations
"""

import pandas as pd
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from jobspy import scrape_jobs
from jobspy.model import Site, Country, JobType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobScraperService:
    """Service class for handling job scraping operations using jobspy"""
    
    def __init__(self):
        self.supported_sites = [site.value for site in Site]
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
        
        # Validate search_term
        if 'search_term' not in config or not config['search_term']:
            errors.append("search_term is required")
        
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
        
        # Validate job_type (optional)
        if 'job_type' in config and config['job_type']:
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
            jobs_df = scrape_jobs(**cleaned_config)
            end_time = datetime.now()
            
            # Convert DataFrame to dictionary for JSON serialization
            if not jobs_df.empty:
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
