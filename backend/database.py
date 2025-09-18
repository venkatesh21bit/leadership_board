import sqlite3
from pathlib import Path
import os

def init_database():
    """Initialize SQLite database with required tables"""
    db_path = Path(__file__).parent / "leaderboard.db"
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            github_username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            email TEXT,
            category TEXT NOT NULL DEFAULT 'fullstack',
            points INTEGER DEFAULT 0,
            pr_count INTEGER DEFAULT 0,
            issues_solved INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Issues table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_number INTEGER NOT NULL,
            repository TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            points INTEGER NOT NULL,
            status TEXT DEFAULT 'open',
            assignee TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(issue_number, repository)
        )
    ''')
    
    # Pull requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pull_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_number INTEGER NOT NULL,
            repository TEXT NOT NULL,
            github_username TEXT NOT NULL,
            issue_number INTEGER,
            points_earned INTEGER DEFAULT 0,
            category TEXT NOT NULL,
            merged_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(pr_number, repository)
        )
    ''')
    
    # Activities log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            github_username TEXT,
            repository TEXT,
            issue_number INTEGER,
            pr_number INTEGER,
            points INTEGER,
            category TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Leaderboard cache table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(category)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_category ON users(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_points ON users(points)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at)')
    
    conn.commit()
    conn.close()
    
    print(f"Database initialized at {db_path}")

if __name__ == "__main__":
    init_database()