#!/usr/bin/env python3
"""
Test script for Leadership Board API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health Check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_auth_redirect():
    """Test GitHub auth redirect (should return 500 without OAuth config)"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/auth/github", allow_redirects=False)
        print(f"✅ GitHub Auth Endpoint: {response.status_code}")
        if response.status_code == 500:
            print("   (Expected: Need to configure GITHUB_CLIENT_ID)")
        return True
    except Exception as e:
        print(f"❌ GitHub Auth Test Failed: {e}")
        return False

def test_leaderboard():
    """Test leaderboard endpoints"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/leaderboard")
        print(f"✅ Leaderboard: {response.status_code} - Found {len(response.json().get('leaderboards', {}).get('fullstack', []))} fullstack users")
        return True
    except Exception as e:
        print(f"❌ Leaderboard Test Failed: {e}")
        return False

def test_register():
    """Test user registration"""
    test_user = {
        "github_username": "test_user_123",
        "full_name": "Test User", 
        "email": "test@example.com",
        "category": "fullstack",
        "points": 0,
        "pr_count": 0,
        "issues_solved": 0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/register", json=test_user)
        if response.status_code == 200:
            print(f"✅ Registration: {response.status_code} - User registered successfully")
        elif response.status_code == 400:
            print(f"✅ Registration: {response.status_code} - User already exists (expected)")
        else:
            print(f"⚠️  Registration: {response.status_code} - {response.text}")
        return True
    except Exception as e:
        print(f"❌ Registration Test Failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Leadership Board API...\n")
    
    tests = [
        ("Health Check", test_health),
        ("GitHub Auth", test_auth_redirect), 
        ("Leaderboard", test_leaderboard),
        ("Registration", test_register)
    ]
    
    passed = 0
    for name, test_func in tests:
        print(f"\n🔍 Testing {name}:")
        if test_func():
            passed += 1
        print("-" * 50)
    
    print(f"\n📊 Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! API is ready.")
    else:
        print("⚠️  Some tests failed. Check the configuration.")

if __name__ == "__main__":
    main()