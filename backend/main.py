import os
import sqlite3
import json
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
import uvicorn
from typing import Optional, List
import hmac
import hashlib
import requests
from datetime import datetime
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from database import init_database
import urllib.parse

# Load environment variables
load_dotenv()

# Initialize database
init_database()

app = FastAPI(title="Leadership Board API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database connection
DB_PATH = Path(__file__).parent / "leaderboard.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic models
class User(BaseModel):
    github_username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    category: str  # "fullstack" or "aiml"
    points: int = 0
    pr_count: int = 0
    issues_solved: int = 0

class WebhookPayload(BaseModel):
    action: str
    pull_request: Optional[dict] = None
    issue: Optional[dict] = None
    repository: dict

class LeaderboardEntry(BaseModel):
    github_username: str
    full_name: Optional[str]
    category: str
    points: int
    pr_count: int
    issues_solved: int
    rank: int

def verify_github_signature(payload_body: bytes, signature_header: str, secret: str) -> bool:
    """Verify GitHub webhook signature"""
    if not signature_header:
        return False
    
    hash_object = hmac.new(
        secret.encode('utf-8'),
        msg=payload_body,
        digestmod=hashlib.sha256
    )
    expected_signature = "sha256=" + hash_object.hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

def extract_points_from_labels(labels: List[dict]) -> int:
    """Extract points from issue labels"""
    points = 0
    for label in labels:
        label_name = label.get('name', '').lower()
        # Look for point labels like "5-points", "points-10", "easy-3", etc.
        if 'point' in label_name:
            # Extract numbers from the label
            import re
            numbers = re.findall(r'\d+', label_name)
            if numbers:
                points += int(numbers[0])
        elif 'easy' in label_name:
            points += 5
        elif 'medium' in label_name:
            points += 10
        elif 'hard' in label_name:
            points += 15
        elif 'expert' in label_name:
            points += 25
    
    return points if points > 0 else 5  # Default 5 points if no specific points found

def determine_category_from_labels(labels: List[dict]) -> str:
    """Determine if issue is for fullstack or AI/ML based on labels"""
    label_names = [label.get('name', '').lower() for label in labels]
    
    # AI/ML keywords
    aiml_keywords = ['ai', 'ml', 'machine-learning', 'artificial-intelligence', 
                     'data-science', 'neural-network', 'tensorflow', 'pytorch', 
                     'nlp', 'computer-vision', 'deep-learning', 'aiml']
    
    # Full Stack keywords
    fullstack_keywords = ['frontend', 'backend', 'fullstack', 'full-stack', 
                         'react', 'node', 'api', 'database', 'web-dev', 'javascript', 'typescript']
    
    for label in label_names:
        if any(keyword in label for keyword in aiml_keywords):
            return 'aiml'
        if any(keyword in label for keyword in fullstack_keywords):
            return 'fullstack'
    
    # Default to fullstack if no specific category found
    return 'fullstack'

def log_activity(activity_type: str, github_username: str = None, repository: str = None, 
                issue_number: int = None, pr_number: int = None, points: int = None, 
                category: str = None, details: str = None):
    """Log activity to database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO activities (type, github_username, repository, issue_number, pr_number, points, category, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (activity_type, github_username, repository, issue_number, pr_number, points, category, details))
    
    conn.commit()
    conn.close()

def get_or_create_user(github_username: str, category: str = 'fullstack') -> dict:
    """Get user from database or create if doesn't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE github_username = ?', (github_username,))
    user = cursor.fetchone()
    
    if not user:
        cursor.execute('''
            INSERT INTO users (github_username, category, points, pr_count, issues_solved)
            VALUES (?, ?, 0, 0, 0)
        ''', (github_username, category))
        conn.commit()
        
        cursor.execute('SELECT * FROM users WHERE github_username = ?', (github_username,))
        user = cursor.fetchone()
    
    conn.close()
    return dict(user)

def update_user_points(github_username: str, points: int, category: str):
    """Update user points in database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update or insert user
    cursor.execute('''
        INSERT OR IGNORE INTO users (github_username, category, points, pr_count, issues_solved)
        VALUES (?, ?, 0, 0, 0)
    ''', (github_username, category))
    
    cursor.execute('''
        UPDATE users 
        SET points = points + ?, pr_count = pr_count + 1, issues_solved = issues_solved + 1, 
            category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE github_username = ?
    ''', (points, category, github_username))
    
    conn.commit()
    conn.close()

# GitHub OAuth endpoints
@app.get("/api/v1/auth/github")
async def github_auth():
    """Redirect to GitHub OAuth"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=user:email&redirect_uri={os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/v1/auth/github/callback')}"
    return RedirectResponse(url=github_auth_url)

@app.get("/api/v1/auth/github/callback")
async def github_callback(code: str, state: Optional[str] = None):
    """Handle GitHub OAuth callback"""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    # Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }
    
    headers = {"Accept": "application/json"}
    response = requests.post(token_url, data=token_data, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    token_info = response.json()
    access_token = token_info.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token received")
    
    # Get user info from GitHub
    user_url = "https://api.github.com/user"
    user_headers = {"Authorization": f"token {access_token}"}
    user_response = requests.get(user_url, headers=user_headers)
    
    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    
    user_data = user_response.json()
    
    # Get user email
    email_url = "https://api.github.com/user/emails"
    email_response = requests.get(email_url, headers=user_headers)
    email = None
    if email_response.status_code == 200:
        emails = email_response.json()
        primary_email = next((e for e in emails if e.get("primary")), None)
        email = primary_email.get("email") if primary_email else None
    
    # Create or update user in database
    github_username = user_data["login"]
    full_name = user_data.get("name")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT * FROM users WHERE github_username = ?', (github_username,))
    existing_user = cursor.fetchone()
    
    if not existing_user:
        # Create new user with default category
        cursor.execute('''
            INSERT INTO users (github_username, full_name, email, category, points, pr_count, issues_solved)
            VALUES (?, ?, ?, 'fullstack', 0, 0, 0)
        ''', (github_username, full_name, email))
        conn.commit()
        
        log_activity("user_login", github_username=github_username, 
                    details=f"New user logged in via GitHub OAuth")
    else:
        # Update existing user info
        cursor.execute('''
            UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
            WHERE github_username = ?
        ''', (full_name, email, github_username))
        conn.commit()
    
    conn.close()
    
    # Redirect to frontend with user info
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    redirect_url = f"{frontend_url}/auth/callback?token={access_token}&username={github_username}"
    return RedirectResponse(url=redirect_url)

@app.get("/api/v1/auth/verify")
async def verify_token(authorization: HTTPAuthorizationCredentials = Depends(security)):
    """Verify GitHub token and return user info"""
    token = authorization.credentials
    
    # Verify token with GitHub
    user_url = "https://api.github.com/user"
    headers = {"Authorization": f"token {token}"}
    response = requests.get(user_url, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_data = response.json()
    github_username = user_data["login"]
    
    # Get user from database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE github_username = ?', (github_username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
    
    return {
        "message": "Token valid",
        "user": dict(user)
    }

@app.post("/api/v1/webhook/github")
async def github_webhook(request: Request, x_github_event: str = Header(None), x_hub_signature_256: str = Header(None)):
    """Handle GitHub webhook events"""
    payload_body = await request.body()
    
    # Verify signature (uncomment in production)
    # webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
    # if webhook_secret and not verify_github_signature(payload_body, x_hub_signature_256, webhook_secret):
    #     raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = json.loads(payload_body.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    event_type = x_github_event
    
    if event_type == "pull_request" and payload.get("action") == "closed":
        pr = payload["pull_request"]
        
        # Check if PR was merged
        if pr.get("merged"):
            await handle_pr_merged(payload)
    
    elif event_type == "issues" and payload.get("action") in ["opened", "labeled"]:
        await handle_issue_event(payload)
    
    return {"status": "success", "message": "Webhook processed"}

async def handle_pr_merged(payload: dict):
    """Handle merged pull request"""
    pr = payload["pull_request"]
    user_login = pr["user"]["login"]
    repo_name = payload["repository"]["full_name"]
    
    # Get associated issue if PR closes an issue
    issue_number = None
    pr_body = pr.get("body", "")
    
    # Look for "Closes #123", "Fixes #123", etc.
    import re
    issue_refs = re.findall(r'(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)', pr_body, re.IGNORECASE)
    
    if issue_refs:
        issue_number = int(issue_refs[0])
        
        # Fetch issue details to get labels and points
        github_token = os.getenv("GITHUB_TOKEN")
        if github_token:
            issue_url = f"https://api.github.com/repos/{repo_name}/issues/{issue_number}"
            headers = {"Authorization": f"token {github_token}"}
            
            response = requests.get(issue_url, headers=headers)
            if response.status_code == 200:
                issue_data = response.json()
                labels = issue_data.get("labels", [])
                
                points = extract_points_from_labels(labels)
                category = determine_category_from_labels(labels)
                
                # Update user points
                update_user_points(user_login, points, category)
                
                # Log activity
                log_activity(
                    activity_type="pr_merged",
                    github_username=user_login,
                    repository=repo_name,
                    issue_number=issue_number,
                    pr_number=pr["number"],
                    points=points,
                    category=category,
                    details=f"Merged PR #{pr['number']} solving issue #{issue_number}"
                )

async def handle_issue_event(payload: dict):
    """Handle issue opened or labeled events"""
    issue = payload["issue"]
    repo_name = payload["repository"]["full_name"]
    labels = issue.get("labels", [])
    
    points = extract_points_from_labels(labels)
    category = determine_category_from_labels(labels)
    
    # Store issue in database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO issues (issue_number, repository, title, category, points, status)
        VALUES (?, ?, ?, ?, ?, 'open')
    ''', (issue["number"], repo_name, issue["title"], category, points))
    
    conn.commit()
    conn.close()
    
    # Log activity
    log_activity(
        activity_type="issue_opened",
        repository=repo_name,
        issue_number=issue["number"],
        points=points,
        category=category,
        details=f"New {category} issue opened: {issue['title']}"
    )

@app.get("/api/v1/leaderboard/{category}")
async def get_leaderboard(category: str):
    """Get leaderboard for specific category"""
    if category not in ["fullstack", "aiml"]:
        raise HTTPException(status_code=400, detail="Invalid category. Use 'fullstack' or 'aiml'")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT github_username, full_name, category, points, pr_count, issues_solved,
               ROW_NUMBER() OVER (ORDER BY points DESC, pr_count DESC) as rank
        FROM users 
        WHERE category = ? AND points > 0
        ORDER BY points DESC, pr_count DESC
    ''', (category,))
    
    leaderboard = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "message": "Success",
        "category": category,
        "leaderboard": leaderboard
    }

@app.get("/api/v1/leaderboard")
async def get_all_leaderboards():
    """Get both leaderboards"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get fullstack leaderboard
    cursor.execute('''
        SELECT github_username, full_name, category, points, pr_count, issues_solved,
               ROW_NUMBER() OVER (ORDER BY points DESC, pr_count DESC) as rank
        FROM users 
        WHERE category = 'fullstack' AND points > 0
        ORDER BY points DESC, pr_count DESC
        LIMIT 100
    ''')
    fullstack_leaderboard = [dict(row) for row in cursor.fetchall()]
    
    # Get AI/ML leaderboard
    cursor.execute('''
        SELECT github_username, full_name, category, points, pr_count, issues_solved,
               ROW_NUMBER() OVER (ORDER BY points DESC, pr_count DESC) as rank
        FROM users 
        WHERE category = 'aiml' AND points > 0
        ORDER BY points DESC, pr_count DESC
        LIMIT 100
    ''')
    aiml_leaderboard = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "message": "Success",
        "leaderboards": {
            "fullstack": fullstack_leaderboard,
            "aiml": aiml_leaderboard
        }
    }

@app.get("/api/v1/activities")
async def get_activities(limit: int = 50):
    """Get recent activities"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM activities 
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (limit,))
    
    activities = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "message": "Success",
        "activities": activities
    }

@app.post("/api/v1/register")
async def register_user(user: User):
    """Register a new user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (github_username, full_name, email, category, points, pr_count, issues_solved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user.github_username, user.full_name, user.email, user.category, 
              user.points, user.pr_count, user.issues_solved))
        
        conn.commit()
        log_activity("user_registered", github_username=user.github_username, 
                    category=user.category, details=f"User registered for {user.category} track")
        
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists")
    finally:
        conn.close()
    
    return {"message": "User registered successfully", "user": user}

@app.get("/api/v1/user/{github_username}")
async def get_user(github_username: str):
    """Get user details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE github_username = ?', (github_username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "Success",
        "user": dict(user)
    }

@app.get("/")
async def root():
    return {"message": "Leadership Board API is running!"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)