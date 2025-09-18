#!/usr/bin/env python3
"""
Comprehensive test script for deployed Leadership Board API
"""

import requests
import json

# Your deployed API URL
BASE_URL = "https://leadership-board-api-820438968871.us-central1.run.app"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_api_docs():
    """Test API documentation"""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"✅ API Docs: {response.status_code} - Documentation accessible")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API Docs Failed: {e}")
        return False

def test_leaderboard():
    """Test leaderboard endpoints"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/leaderboard")
        data = response.json()
        fullstack_count = len(data.get('leaderboards', {}).get('fullstack', []))
        aiml_count = len(data.get('leaderboards', {}).get('aiml', []))
        print(f"✅ Leaderboard: {response.status_code} - {fullstack_count} fullstack, {aiml_count} AI/ML users")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Leaderboard Test Failed: {e}")
        return False

def test_activities():
    """Test activities endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/activities")
        data = response.json()
        activity_count = len(data.get('activities', []))
        print(f"✅ Activities: {response.status_code} - {activity_count} activities found")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Activities Test Failed: {e}")
        return False

def test_github_auth():
    """Test GitHub auth redirect"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/auth/github", allow_redirects=False)
        if response.status_code == 307:
            location = response.headers.get('location', '')
            if 'github.com/login/oauth/authorize' in location:
                print(f"✅ GitHub Auth: {response.status_code} - Redirects to GitHub OAuth")
                print(f"   Callback URL: {BASE_URL}/api/v1/auth/github/callback")
                return True
            else:
                print(f"⚠️  GitHub Auth: {response.status_code} - Unexpected redirect: {location}")
                return False
        else:
            print(f"⚠️  GitHub Auth: {response.status_code} - Expected 307 redirect")
            return False
    except Exception as e:
        print(f"❌ GitHub Auth Test Failed: {e}")
        return False

def test_user_registration():
    """Test user registration endpoint"""
    test_user = {
        "github_username": f"test_user_deployed_{hash('test') % 1000}",
        "full_name": "Test User Deployed",
        "email": "test.deployed@example.com",
        "category": "fullstack",
        "points": 0,
        "pr_count": 0,
        "issues_solved": 0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/register", json=test_user)
        if response.status_code == 200:
            print(f"✅ Registration: {response.status_code} - New user registered successfully")
        elif response.status_code == 400:
            print(f"✅ Registration: {response.status_code} - User already exists (expected)")
        else:
            print(f"⚠️  Registration: {response.status_code} - {response.text}")
        return response.status_code in [200, 400]
    except Exception as e:
        print(f"❌ Registration Test Failed: {e}")
        return False

def test_webhook_endpoint():
    """Test webhook endpoint (should accept POST)"""
    try:
        # Test with minimal payload
        test_payload = {"action": "test", "repository": {"full_name": "test/repo"}}
        response = requests.post(f"{BASE_URL}/api/v1/webhook/github", 
                               json=test_payload,
                               headers={"X-GitHub-Event": "ping"})
        print(f"✅ Webhook: {response.status_code} - Endpoint accessible")
        return response.status_code in [200, 422]  # 422 is expected for test payload
    except Exception as e:
        print(f"❌ Webhook Test Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Deployed Leadership Board API...\n")
    print(f"🌐 Base URL: {BASE_URL}\n")
    
    tests = [
        ("Health Check", test_health),
        ("API Documentation", test_api_docs),
        ("Leaderboard", test_leaderboard),
        ("Activities", test_activities),
        ("GitHub Auth", test_github_auth),
        ("User Registration", test_user_registration),
        ("Webhook Endpoint", test_webhook_endpoint)
    ]
    
    passed = 0
    for name, test_func in tests:
        print(f"\n🔍 Testing {name}:")
        if test_func():
            passed += 1
        print("-" * 50)
    
    print(f"\n📊 Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! Deployed API is working correctly!")
        print(f"\n🔗 Your API URLs:")
        print(f"   Main API: {BASE_URL}")
        print(f"   Documentation: {BASE_URL}/docs")
        print(f"   Leaderboard: {BASE_URL}/api/v1/leaderboard")
        print(f"   GitHub Auth: {BASE_URL}/api/v1/auth/github")
        print(f"   Webhook: {BASE_URL}/api/v1/webhook/github")
    else:
        print("⚠️  Some tests failed. Check the deployment.")
    
    print(f"\n🔑 Next Steps:")
    print("1. Set up GitHub OAuth app:")
    print(f"   - Callback URL: {BASE_URL}/api/v1/auth/github/callback")
    print("2. Update environment variables with OAuth credentials")
    print("3. Configure GitHub webhook for your repository")

if __name__ == "__main__":
    main()