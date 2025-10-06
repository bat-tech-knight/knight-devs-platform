"""
Test script for job scraper integration
This script tests the job scraper service and API endpoints
"""

import requests
import json
import time

# API base URL
BASE_URL = "http://localhost:5000"

def test_api_endpoints():
    """Test all job scraping API endpoints"""
    
    print("🧪 Testing Job Scraper API Integration")
    print("=" * 50)
    
    # Test 1: Get supported sites
    print("\n1. Testing GET /api/jobs/sites")
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/sites")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {data['count']} supported sites")
            print(f"   Sites: {', '.join(data['sites'][:5])}...")  # Show first 5
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: Get supported countries
    print("\n2. Testing GET /api/jobs/countries")
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/countries")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {data['count']} supported countries")
            print(f"   Countries: {', '.join(data['countries'][:5])}...")  # Show first 5
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 3: Get supported job types
    print("\n3. Testing GET /api/jobs/job-types")
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/job-types")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {data['count']} supported job types")
            print(f"   Job Types: {', '.join(data['job_types'][:5])}...")  # Show first 5
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 4: Get scraping stats
    print("\n4. Testing GET /api/jobs/stats")
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Retrieved scraping statistics")
            print(f"   Stats: {json.dumps(data['stats'], indent=2)}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 5: Get example config
    print("\n5. Testing GET /api/jobs/example-config")
    try:
        response = requests.get(f"{BASE_URL}/api/jobs/example-config")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Retrieved example configuration")
            print(f"   Example Config: {json.dumps(data['example_config'], indent=2)}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 6: Validate configuration
    print("\n6. Testing POST /api/jobs/config/validate")
    test_config = {
        "site_name": "indeed",
        "search_term": "python developer",
        "location": "New York, NY",
        "country_indeed": "usa",
        "job_type": "fulltime",
        "results_wanted": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/jobs/config/validate",
            json=test_config,
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code == 200:
            data = response.json()
            validation_result = data['validation_result']
            if validation_result['is_valid']:
                print(f"✅ Success: Configuration is valid")
                if validation_result['warnings']:
                    print(f"   Warnings: {validation_result['warnings']}")
            else:
                print(f"❌ Configuration validation failed:")
                print(f"   Errors: {validation_result['errors']}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 7: Test invalid configuration
    print("\n7. Testing POST /api/jobs/config/validate with invalid config")
    invalid_config = {
        "site_name": "invalid_site",
        "search_term": "",  # Empty search term
        "results_wanted": -5  # Invalid negative number
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/jobs/config/validate",
            json=invalid_config,
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code == 200:
            data = response.json()
            validation_result = data['validation_result']
            if not validation_result['is_valid']:
                print(f"✅ Success: Correctly identified invalid configuration")
                print(f"   Errors: {validation_result['errors']}")
            else:
                print(f"❌ Failed: Should have detected invalid configuration")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 8: Test actual job scraping (small test)
    print("\n8. Testing POST /api/jobs/scrape (small test)")
    scrape_config = {
        "site_name": "indeed",
        "search_term": "python",
        "location": "New York, NY",
        "country_indeed": "usa",
        "results_wanted": 3,  # Small number for testing
        "distance": 25
    }
    
    try:
        print("   Starting job scraping... (this may take a moment)")
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/jobs/scrape",
            json=scrape_config,
            headers={'Content-Type': 'application/json'},
            timeout=60  # 60 second timeout
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✅ Success: Scraped {data['total_jobs']} jobs in {end_time - start_time:.2f} seconds")
                if data['jobs']:
                    print(f"   Sample job: {data['jobs'][0]['title']} at {data['jobs'][0]['company']}")
                if data['warnings']:
                    print(f"   Warnings: {data['warnings']}")
            else:
                print(f"❌ Scraping failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except requests.exceptions.Timeout:
        print(f"⏰ Timeout: Job scraping took longer than 60 seconds")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing completed!")

def test_service_directly():
    """Test the job scraper service directly (without Flask)"""
    
    print("\n🔧 Testing Job Scraper Service Directly")
    print("=" * 50)
    
    try:
        from job_scraper_service import JobScraperService
        
        # Initialize service
        service = JobScraperService()
        
        # Test getting supported options
        print(f"✅ Supported sites: {len(service.get_supported_sites())}")
        print(f"✅ Supported countries: {len(service.get_supported_countries())}")
        print(f"✅ Supported job types: {len(service.get_supported_job_types())}")
        
        # Test configuration validation
        test_config = {
            "site_name": "indeed",
            "search_term": "python developer",
            "location": "New York, NY",
            "country_indeed": "usa",
            "results_wanted": 5
        }
        
        validation_result = service.validate_scraping_config(test_config)
        if validation_result['is_valid']:
            print("✅ Configuration validation works")
        else:
            print(f"❌ Configuration validation failed: {validation_result['errors']}")
        
        print("✅ Service initialization and basic functions work")
        
    except Exception as e:
        print(f"❌ Error testing service directly: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Job Scraper Integration Tests")
    print("Make sure the Flask server is running on http://localhost:5000")
    print("Run: python api/index.py")
    print()
    
    # Test service directly first
    test_service_directly()
    
    # Test API endpoints
    test_api_endpoints()
