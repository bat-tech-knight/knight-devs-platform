from jobspy.model import CompensationInterval, JobType, Compensation
from jobspy.util import get_enum_from_job_type


def get_job_type(job_type_code: int) -> list[JobType]:
    """
    Maps JSJobbs job type codes to JobType enum
    :param job_type_code: job type code from API
    :return: list of JobType
    """
    job_types: list[JobType] = []
    
    # JSJobbs job type mapping based on the API response
    # From the API data, jobType: 10 appears to be full-time
    # jobLevel: 40 appears to be senior level
    job_type_mapping = {
        10: JobType.FULL_TIME,
        20: JobType.PART_TIME,
        30: JobType.CONTRACT,
        40: JobType.INTERNSHIP,
    }
    
    if job_type_code in job_type_mapping:
        job_types.append(job_type_mapping[job_type_code])
    else:
        # Default to full-time if unknown
        job_types.append(JobType.FULL_TIME)
    
    return job_types


def get_compensation(job: dict) -> Compensation | None:
    """
    Parses the job to get compensation from minSalary and maxSalary
    :param job: job dict from API
    :return: compensation object
    """
    min_salary = job.get("minSalary")
    max_salary = job.get("maxSalary")
    
    if not min_salary and not max_salary:
        return None
    
    # JSJobbs doesn't provide salary interval, assume yearly
    return Compensation(
        interval=CompensationInterval.YEARLY,
        min_amount=float(min_salary) if min_salary else None,
        max_amount=float(max_salary) if max_salary else None,
        currency="USD",  # Default currency, could be enhanced to detect from job data
    )


def is_job_remote(job: dict, description: str) -> bool:
    """
    Determines if job is remote based on workplaceType and description
    :param job: job dict from API
    :param description: job description
    :return: boolean indicating if job is remote
    """
    # Check workplaceType field
    # From the API data, workplaceType: 10 appears to be on-site
    # We'll assume other values might indicate remote/hybrid
    workplace_type = job.get("workplaceType")
    if workplace_type and workplace_type != 10:
        return True
    
    # Check description for remote keywords
    if description:
        remote_keywords = ["remote", "work from home", "wfh", "virtual", "distributed", "fully remote", "work anywhere"]
        description_lower = description.lower()
        return any(keyword in description_lower for keyword in remote_keywords)
    
    return False
