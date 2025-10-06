from __future__ import annotations

import logging
import re
from itertools import cycle

import numpy as np
import requests
import tls_client
import urllib3
from markdownify import markdownify as md
from requests.adapters import HTTPAdapter, Retry

from jobspy.model import CompensationInterval, JobType, Site

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def create_logger(name: str):
    logger = logging.getLogger(f"JobSpy:{name}")
    logger.propagate = False
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        console_handler = logging.StreamHandler()
        format = "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
        formatter = logging.Formatter(format)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    return logger


class RotatingProxySession:
    def __init__(self, proxies=None):
        if isinstance(proxies, str):
            self.proxy_cycle = cycle([self.format_proxy(proxies)])
        elif isinstance(proxies, list):
            self.proxy_cycle = (
                cycle([self.format_proxy(proxy) for proxy in proxies])
                if proxies
                else None
            )
        else:
            self.proxy_cycle = None

    @staticmethod
    def format_proxy(proxy):
        """Utility method to format a proxy string into a dictionary."""
        if proxy.startswith("http://") or proxy.startswith("https://"):
            return {"http": proxy, "https": proxy}
        if proxy.startswith("socks5://"):
            return {"http": proxy, "https": proxy}
        return {"http": f"http://{proxy}", "https": f"http://{proxy}"}


class RequestsRotating(RotatingProxySession, requests.Session):
    def __init__(self, proxies=None, has_retry=False, delay=1, clear_cookies=False):
        RotatingProxySession.__init__(self, proxies=proxies)
        requests.Session.__init__(self)
        self.clear_cookies = clear_cookies
        self.allow_redirects = True
        self.setup_session(has_retry, delay)

    def setup_session(self, has_retry, delay):
        if has_retry:
            retries = Retry(
                total=3,
                connect=3,
                status=3,
                status_forcelist=[500, 502, 503, 504, 429],
                backoff_factor=delay,
            )
            adapter = HTTPAdapter(max_retries=retries)
            self.mount("http://", adapter)
            self.mount("https://", adapter)

    def request(self, method, url, **kwargs):
        if self.clear_cookies:
            self.cookies.clear()

        if self.proxy_cycle:
            next_proxy = next(self.proxy_cycle)
            if next_proxy["http"] != "http://localhost":
                self.proxies = next_proxy
            else:
                self.proxies = {}
        return requests.Session.request(self, method, url, **kwargs)


class TLSRotating(RotatingProxySession, tls_client.Session):
    def __init__(self, proxies=None):
        RotatingProxySession.__init__(self, proxies=proxies)
        tls_client.Session.__init__(self, random_tls_extension_order=True)

    def execute_request(self, *args, **kwargs):
        if self.proxy_cycle:
            next_proxy = next(self.proxy_cycle)
            if next_proxy["http"] != "http://localhost":
                self.proxies = next_proxy
            else:
                self.proxies = {}
        response = tls_client.Session.execute_request(self, *args, **kwargs)
        response.ok = response.status_code in range(200, 400)
        return response


def create_session(
    *,
    proxies: dict | str | None = None,
    ca_cert: str | None = None,
    is_tls: bool = True,
    has_retry: bool = False,
    delay: int = 1,
    clear_cookies: bool = False,
) -> requests.Session:
    """
    Creates a requests session with optional tls, proxy, and retry settings.
    :return: A session object
    """
    if is_tls:
        session = TLSRotating(proxies=proxies)
    else:
        session = RequestsRotating(
            proxies=proxies,
            has_retry=has_retry,
            delay=delay,
            clear_cookies=clear_cookies,
        )

    if ca_cert:
        session.verify = ca_cert

    return session


def set_logger_level(verbose: int):
    """
    Adjusts the logger's level. This function allows the logging level to be changed at runtime.

    Parameters:
    - verbose: int {0, 1, 2} (default=2, all logs)
    """
    if verbose is None:
        return
    level_name = {2: "INFO", 1: "WARNING", 0: "ERROR"}.get(verbose, "INFO")
    level = getattr(logging, level_name.upper(), None)
    if level is not None:
        for logger_name in logging.root.manager.loggerDict:
            if logger_name.startswith("JobSpy:"):
                logging.getLogger(logger_name).setLevel(level)
    else:
        raise ValueError(f"Invalid log level: {level_name}")


def markdown_converter(description_html: str):
    if description_html is None:
        return None
    markdown = md(description_html)
    return markdown.strip()

def plain_converter(decription_html:str):
    from bs4 import BeautifulSoup
    if decription_html is None:
        return None
    soup = BeautifulSoup(decription_html, "html.parser")
    text = soup.get_text(separator=" ")
    text = re.sub(r'\s+',' ',text)
    return text.strip()


def extract_emails_from_text(text: str) -> list[str] | None:
    if not text:
        return None
    email_regex = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
    return email_regex.findall(text)


def get_enum_from_job_type(job_type_str: str) -> JobType | None:
    """
    Given a string, returns the corresponding JobType enum member if a match is found.
    """
    res = None
    for job_type in JobType:
        if job_type_str in job_type.value:
            res = job_type
    return res


def currency_parser(cur_str):
    # Remove any non-numerical characters
    # except for ',' '.' or '-' (e.g. EUR)
    cur_str = re.sub("[^-0-9.,]", "", cur_str)
    # Remove any 000s separators (either , or .)
    cur_str = re.sub("[.,]", "", cur_str[:-3]) + cur_str[-3:]

    if "." in list(cur_str[-3:]):
        num = float(cur_str)
    elif "," in list(cur_str[-3:]):
        num = float(cur_str.replace(",", "."))
    else:
        num = float(cur_str)

    return np.round(num, 2)


def remove_attributes(tag):
    for attr in list(tag.attrs):
        del tag[attr]
    return tag


def extract_salary(
    salary_str,
    lower_limit=1000,
    upper_limit=700000,
    hourly_threshold=350,
    monthly_threshold=30000,
    enforce_annual_salary=False,
):
    """
    Extracts salary information from a string and returns the salary interval, min and max salary values, and currency.
    (TODO: Needs test cases as the regex is complicated and may not cover all edge cases)
    """
    if not salary_str:
        return None, None, None, None

    annual_max_salary = None
    min_max_pattern = r"\$(\d+(?:,\d+)?(?:\.\d+)?)([kK]?)\s*[-—–]\s*(?:\$)?(\d+(?:,\d+)?(?:\.\d+)?)([kK]?)"

    def to_int(s):
        return int(float(s.replace(",", "")))

    def convert_hourly_to_annual(hourly_wage):
        return hourly_wage * 2080

    def convert_monthly_to_annual(monthly_wage):
        return monthly_wage * 12

    match = re.search(min_max_pattern, salary_str)

    if match:
        min_salary = to_int(match.group(1))
        max_salary = to_int(match.group(3))
        # Handle 'k' suffix for min and max salaries independently
        if "k" in match.group(2).lower() or "k" in match.group(4).lower():
            min_salary *= 1000
            max_salary *= 1000

        # Convert to annual if less than the hourly threshold
        if min_salary < hourly_threshold:
            interval = CompensationInterval.HOURLY.value
            annual_min_salary = convert_hourly_to_annual(min_salary)
            if max_salary < hourly_threshold:
                annual_max_salary = convert_hourly_to_annual(max_salary)

        elif min_salary < monthly_threshold:
            interval = CompensationInterval.MONTHLY.value
            annual_min_salary = convert_monthly_to_annual(min_salary)
            if max_salary < monthly_threshold:
                annual_max_salary = convert_monthly_to_annual(max_salary)

        else:
            interval = CompensationInterval.YEARLY.value
            annual_min_salary = min_salary
            annual_max_salary = max_salary

        # Ensure salary range is within specified limits
        if not annual_max_salary:
            return None, None, None, None
        if (
            lower_limit <= annual_min_salary <= upper_limit
            and lower_limit <= annual_max_salary <= upper_limit
            and annual_min_salary < annual_max_salary
        ):
            if enforce_annual_salary:
                return interval, annual_min_salary, annual_max_salary, "USD"
            else:
                return interval, min_salary, max_salary, "USD"
    return None, None, None, None


def extract_job_type(description: str):
    if not description:
        return []

    keywords = {
        JobType.FULL_TIME: r"full\s?time",
        JobType.PART_TIME: r"part\s?time",
        JobType.INTERNSHIP: r"internship",
        JobType.CONTRACT: r"contract",
    }

    listing_types = []
    for key, pattern in keywords.items():
        if re.search(pattern, description, re.IGNORECASE):
            listing_types.append(key)

    return listing_types if listing_types else None


def map_str_to_site(site_name: str) -> Site:
    return Site[site_name.upper()]


def get_enum_from_value(value_str):
    for job_type in JobType:
        if value_str in job_type.value:
            return job_type
    raise Exception(f"Invalid job type: {value_str}")


def convert_to_annual(job_data: dict):
    if job_data["interval"] == "hourly":
        job_data["min_amount"] *= 2080
        job_data["max_amount"] *= 2080
    if job_data["interval"] == "monthly":
        job_data["min_amount"] *= 12
        job_data["max_amount"] *= 12
    if job_data["interval"] == "weekly":
        job_data["min_amount"] *= 52
        job_data["max_amount"] *= 52
    if job_data["interval"] == "daily":
        job_data["min_amount"] *= 260
        job_data["max_amount"] *= 260
    job_data["interval"] = "yearly"


desired_order = [
    "id",
    "site",
    "job_url",
    "job_url_direct",
    "title",
    "company",
    "location",
    "date_posted",
    "job_type",
    "salary_source",
    "interval",
    "min_amount",
    "max_amount",
    "currency",
    "is_remote",
    "job_level",
    "job_function",
    "listing_type",
    "emails",
    "description",
    "company_industry",
    "company_url",
    "company_logo",
    "company_url_direct",
    "company_addresses",
    "company_num_employees",
    "company_revenue",
    "company_description",
    # naukri-specific fields
    "skills",
    "experience_range",
    "company_rating",
    "company_reviews_count",
    "vacancy_count",
    "work_from_home_type",
]


def extract_skills_from_description(description: str) -> list[str]:
    """
    Extract skills from job description using pattern matching and common skill keywords.
    
    Args:
        description: Job description text (HTML or plain text)
        
    Returns:
        List of extracted skills
    """
    if not description:
        return []
    
    # Convert HTML to plain text if needed
    if '<' in description and '>' in description:
        description = markdown_converter(description)
    
    skills = set()
    description_lower = description.lower()
    
    # Common skill patterns to look for
    skill_patterns = [
        r'(?:required|must have|essential|preferred|nice to have|skills?)[\s:]*([^.!?]*)',
        r'(?:experience with|proficient in|knowledge of|familiar with)[\s:]*([^.!?]*)',
        r'(?:technologies?|tools?|frameworks?|languages?)[\s:]*([^.!?]*)',
    ]
    
    # Extract text using patterns
    for pattern in skill_patterns:
        matches = re.findall(pattern, description_lower, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            # Split by common separators and clean up
            skill_candidates = re.split(r'[,;•\n\r\t]+', match)
            for candidate in skill_candidates:
                skill = candidate.strip()
                if len(skill) > 2 and len(skill) < 50:  # Reasonable skill length
                    skills.add(skill)
    
    # Common technical skills to look for
    technical_skills = [
        # Programming Languages
        'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
        'typescript', 'scala', 'r', 'matlab', 'perl', 'haskell', 'clojure', 'dart', 'elixir',
        # Web Technologies
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'sass', 'less', 'webpack', 'babel',
        # Databases
        'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra',
        'elasticsearch', 'dynamodb', 'neo4j', 'mariadb',
        # Cloud & DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform',
        'ansible', 'chef', 'puppet', 'vagrant', 'nginx', 'apache',
        # Data & Analytics
        'sql', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'spark',
        'hadoop', 'hive', 'pig', 'kafka', 'airflow', 'jupyter', 'tableau', 'power bi',
        # Mobile Development
        'ios', 'android', 'react native', 'flutter', 'xamarin', 'cordova', 'ionic',
        # Other Technologies
        'linux', 'unix', 'windows', 'macos', 'bash', 'powershell', 'rest api', 'graphql',
        'microservices', 'api', 'json', 'xml', 'yaml', 'tomcat', 'jboss', 'weblogic'
    ]
    
    # Look for technical skills in description
    for skill in technical_skills:
        if skill in description_lower:
            skills.add(skill.title() if skill.islower() else skill)
    
    # Soft skills
    soft_skills = [
        'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
        'creative', 'time management', 'project management', 'agile', 'scrum',
        'customer service', 'mentoring', 'collaboration', 'adaptability', 'initiative'
    ]
    
    for skill in soft_skills:
        if skill in description_lower:
            skills.add(skill.title())
    
    # Clean up and filter skills
    cleaned_skills = []
    for skill in skills:
        # Remove common prefixes/suffixes
        skill = re.sub(r'^(experience with|knowledge of|proficient in|familiar with)\s*', '', skill, flags=re.IGNORECASE)
        skill = re.sub(r'\s+(experience|knowledge|proficiency|familiarity)$', '', skill, flags=re.IGNORECASE)
        
        # Skip if too short, too long, or contains unwanted characters
        if (len(skill) >= 3 and len(skill) <= 40 and 
            not re.search(r'[^\w\s\-\./\+]', skill) and
            not skill.lower() in ['and', 'or', 'the', 'with', 'in', 'of', 'for', 'to', 'a', 'an']):
            cleaned_skills.append(skill.strip())
    
    return list(set(cleaned_skills))  # Remove duplicates


def extract_skills_from_attributes(attributes: list[dict]) -> list[str]:
    """
    Extract skills from Indeed API attributes field.
    
    Args:
        attributes: List of attribute dictionaries with 'key' and 'label' fields
        
    Returns:
        List of extracted skills
    """
    if not attributes:
        return []
    
    skills = []
    skill_keywords = ['skill', 'technology', 'tool', 'language', 'framework', 'platform']
    
    for attr in attributes:
        key = attr.get('key', '').lower()
        label = attr.get('label', '').strip()
        
        # Check if this attribute might contain skills
        if any(keyword in key for keyword in skill_keywords) or len(label) < 50:
            # Split by common separators
            skill_candidates = re.split(r'[,;•\n\r\t]+', label)
            for candidate in skill_candidates:
                skill = candidate.strip()
                if len(skill) > 2 and len(skill) < 50:
                    skills.append(skill)
    
    return list(set(skills))  # Remove duplicates
