from __future__ import annotations

import json
from typing import List

from jobspy.producthunt.constant import PRODUCTHUNT_API_URL, api_headers, PRODUCTHUNT_QUERY
from jobspy.producthunt.util import process_producthunt_post, is_valid_post
from jobspy.model import (
    Scraper,
    ScraperInput,
    Site,
    JobPost,
    JobResponse,
    JobType,
    DescriptionFormat,
)
from jobspy.util import (
    create_session,
    create_logger,
)

log = create_logger("ProductHunt")


class ProductHunt(Scraper):
    def __init__(
        self, proxies: list[str] | str | None = None, ca_cert: str | None = None, user_agent: str | None = None
    ):
        """
        Initializes ProductHunt scraper with the ProductHunt GraphQL API
        """
        super().__init__(Site.PRODUCTHUNT, proxies=proxies)

        self.session = create_session(
            proxies=self.proxies, ca_cert=ca_cert, is_tls=False
        )
        self.scraper_input = None
        self.seen_urls = set()
        self.headers = api_headers.copy()

    def scrape(self, scraper_input: ScraperInput) -> JobResponse:
        """
        Scrapes ProductHunt for product posts with scraper_input criteria
        :param scraper_input: search criteria
        :return: job_response
        """
        self.scraper_input = scraper_input
        job_list = []
        
        log.info("Starting ProductHunt scraping")
        
        try:
            # Make GraphQL request to ProductHunt API
            posts = self._fetch_producthunt_posts()
            if not posts:
                log.warning("No posts found from ProductHunt API")
                return JobResponse(jobs=[])
            
            # Process each post
            for post_data in posts:
                if not is_valid_post(post_data):
                    continue
                    
                # Check for duplicates
                post_url = post_data.get("url", "")
                if post_url in self.seen_urls:
                    continue
                self.seen_urls.add(post_url)
                
                # Apply search term filter if provided
                if self.scraper_input.search_term and self.scraper_input.search_term.strip():
                    search_term = self.scraper_input.search_term.lower()
                    post_text = f"{post_data.get('name', '')} {post_data.get('description', '')}".lower()
                    if search_term not in post_text:
                        continue
                
                # Process the post into a JobPost
                job_post = process_producthunt_post(post_data)
                if job_post:
                    job_list.append(job_post)
            
            # Apply offset and limit
            offset = scraper_input.offset if scraper_input.offset else 0
            results_wanted = scraper_input.results_wanted if scraper_input.results_wanted else 15
            
            log.info(f"ProductHunt scraping completed. Found {len(job_list)} posts")
            
            return JobResponse(
                jobs=job_list[offset:offset + results_wanted]
            )
            
        except Exception as e:
            log.error(f"Error during ProductHunt scraping: {e}")
            return JobResponse(jobs=[])

    def _fetch_producthunt_posts(self) -> List[dict]:
        """
        Fetches posts from ProductHunt GraphQL API
        :return: List of post data
        """
        try:
            # Prepare GraphQL request
            payload = {
                "query": PRODUCTHUNT_QUERY
            }
            
            response = self.session.post(
                PRODUCTHUNT_API_URL,
                headers=self.headers,
                json=payload,
                timeout=30,
                verify=False,
            )
            
            if not response.ok:
                log.error(f"ProductHunt API responded with status code: {response.status_code}")
                return []
            
            data = response.json()
            
            # Extract posts from GraphQL response
            if "data" in data and "posts" in data["data"] and "edges" in data["data"]["posts"]:
                posts = []
                for edge in data["data"]["posts"]["edges"]:
                    if "node" in edge:
                        posts.append(edge["node"])
                return posts
            else:
                log.warning("Unexpected response format from ProductHunt API")
                return []
                
        except Exception as e:
            log.error(f"Error fetching ProductHunt posts: {e}")
            return []
