#!/usr/bin/env python3
"""
Test script for the Leadership Board API
This script tests the various endpoints and simulates GitHub webhook events
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USERS = [
    {
        "github_username": "alice_fullstack",
        "full_name": "Alice Johnson",
        "category": "fullstack",
        "points": 0,
        "pr_count": 0,
        "issues_solved": 0
    },
    {
        "github_username": "bob_aiml",
        "full_name": "Bob Smith", 
        "category": "aiml",
        "points": 0,
        "pr_count": 0,
        "issues_solved": 0
    },
    {
        "github_username": "charlie_fullstack",
        "full_name": "Charlie Brown",
        "category": "fullstack", 
        "points": 0,
        "pr_count": 0,
        "issues_solved": 0
    }
]

def test_api_endpoint(method, endpoint, data=None, expected_status=200):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        
        print(f"{method} {endpoint}: {response.status_code}")
        
        if response.status_code == expected_status:
            print("✅ Success")
            if response.status_code == 200:
                return response.json()
        else:
            print(f"❌ Expected {expected_status}, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error - Make sure backend is running on port 9000")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def simulate_github_webhook(event_type, payload):
    """Simulate a GitHub webhook event"""
    url = f"{BASE_URL}/webhook/github"
    headers = {
        "X-GitHub-Event": event_type,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Webhook {event_type}: {response.status_code}")
        if response.status_code == 200:
            print("✅ Webhook processed successfully")
            return response.json()
        else:
            print(f"❌ Webhook failed: {response.text}")
    except Exception as e:
        print(f"❌ Webhook error: {e}")
    
    return None

def main():
    print("🚀 Starting Leadership Board API Tests")
    print("=" * 50)
    
    # Test 1: Check if API is running
    print("\n1. Testing API Health")
    test_api_endpoint("GET", "/")
    
    # Test 2: Register test users
    print("\n2. Registering Test Users")
    for user in TEST_USERS:
        test_api_endpoint("POST", "/register", user, 200)
    
    # Test 3: Test leaderboard endpoints
    print("\n3. Testing Leaderboard Endpoints")
    test_api_endpoint("GET", "/leaderboard")
    test_api_endpoint("GET", "/leaderboard/fullstack")
    test_api_endpoint("GET", "/leaderboard/aiml")
    
    # Test 4: Test user endpoints
    print("\n4. Testing User Endpoints")
    test_api_endpoint("GET", "/user/alice_fullstack")
    test_api_endpoint("GET", "/user/nonexistent_user", expected_status=404)
    
    # Test 5: Test activities endpoint
    print("\n5. Testing Activities Endpoint")
    test_api_endpoint("GET", "/activities")
    
    # Test 6: Simulate GitHub webhook events
    print("\n6. Simulating GitHub Webhook Events")
    
    # Simulate issue opened
    issue_payload = {
        "action": "opened",
        "issue": {
            "number": 1,
            "title": "Add user authentication",
            "labels": [
                {"name": "fullstack"},
                {"name": "medium"},
                {"name": "backend"}
            ]
        },
        "repository": {
            "full_name": "test/repo"
        }
    }
    simulate_github_webhook("issues", issue_payload)
    
    # Simulate PR merged
    pr_payload = {
        "action": "closed",
        "pull_request": {
            "number": 10,
            "merged": True,
            "body": "This PR closes #1 and implements user authentication",
            "user": {
                "login": "alice_fullstack"
            }
        },
        "repository": {
            "full_name": "test/repo"
        }
    }
    simulate_github_webhook("pull_request", pr_payload)
    
    # Simulate AI/ML issue and PR
    aiml_issue_payload = {
        "action": "opened", 
        "issue": {
            "number": 2,
            "title": "Implement neural network for image classification",
            "labels": [
                {"name": "ai"},
                {"name": "hard"},
                {"name": "machine-learning"}
            ]
        },
        "repository": {
            "full_name": "test/ai-repo"
        }
    }
    simulate_github_webhook("issues", aiml_issue_payload)
    
    aiml_pr_payload = {
        "action": "closed",
        "pull_request": {
            "number": 5,
            "merged": True,
            "body": "Fixes #2 - Added CNN model for image classification",
            "user": {
                "login": "bob_aiml"
            }
        },
        "repository": {
            "full_name": "test/ai-repo"
        }
    }
    simulate_github_webhook("pull_request", aiml_pr_payload)
    
    # Test 7: Check updated leaderboards
    print("\n7. Checking Updated Leaderboards")
    time.sleep(1)  # Give time for processing
    
    fullstack_result = test_api_endpoint("GET", "/leaderboard/fullstack")
    aiml_result = test_api_endpoint("GET", "/leaderboard/aiml")
    activities_result = test_api_endpoint("GET", "/activities?limit=10")
    
    # Display results
    if fullstack_result:
        print(f"\n📊 Full Stack Leaderboard:")
        for user in fullstack_result.get('leaderboard', []):
            print(f"  {user['rank']}. {user['github_username']} - {user['points']} points")
    
    if aiml_result:
        print(f"\n🤖 AI/ML Leaderboard:")
        for user in aiml_result.get('leaderboard', []):
            print(f"  {user['rank']}. {user['github_username']} - {user['points']} points")
    
    if activities_result:
        print(f"\n📈 Recent Activities:")
        for activity in activities_result.get('activities', [])[:5]:
            print(f"  • {activity['type']} by {activity.get('github_username', 'system')} - {activity.get('details', 'No details')}")
    
    print("\n✅ All tests completed!")
    print("\n💡 Tips:")
    print("  - Check the frontend at http://localhost:3000")
    print("  - View the database at backend/leaderboard.db")
    print("  - Monitor API logs for webhook processing")

if __name__ == "__main__":
    main()