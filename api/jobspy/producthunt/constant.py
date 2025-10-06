# ProductHunt API configuration
PRODUCTHUNT_API_URL = "https://api.producthunt.com/v2/api/graphql"

# Bearer token for ProductHunt API
PRODUCTHUNT_BEARER_TOKEN = "AM2DBEIuTlXh8g8ypfwlNwPn8t7gv1f_Zup4wovCZvs"

# GraphQL query for fetching posts
PRODUCTHUNT_QUERY = """
{
    posts {
        edges {
            node {
                slug
                name
                description
                url
                website
            }
        }
    }
}
"""

# Headers for ProductHunt API requests
api_headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PRODUCTHUNT_BEARER_TOKEN}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
}
