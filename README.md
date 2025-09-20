# Leadership Board Challenge

This is a comprehensive leadership board system for coding challenges with GitHub integration. The system automatically tracks points when contributors solve issues and submit pull requests.

## Features

- **Dual Track Competition**: Separate leaderboards for Full Stack and AI/ML developers
- **Automatic Point Tracking**: Points are automatically awarded based on GitHub issue labels
- **Real-time Updates**: Live activity feed and leaderboard updates
- **GitHub Integration**: Webhook integration for automatic PR and issue tracking
- **Label-based Categorization**: Issues are automatically categorized based on labels

## Setup Instructions

### 1. Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and add:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `GITHUB_WEBHOOK_SECRET`: Secret for webhook verification (optional)

4. **Initialize the database**:
   ```bash
   python database.py
   ```

5. **Start the backend server**:
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:9000`

### 2. Frontend Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   copy .env.example .env.local
   ```
   
   Update `NEXT_PUBLIC_BACKEND_URL` if needed (default: `http://127.0.0.1:9000/api/v1`)

3. **Start the development server**:
   ```bash
   pnpm dev
   ```
   
   The frontend will be available at `http://localhost:3000`

### 3. GitHub Repository Setup

#### Issue Labels for Point System

Create these labels in your GitHub repository for automatic point calculation:

**Point-based labels:**
- `5-points`, `10-points`, `15-points`, `25-points` - Explicit point values
- `easy` (5 points), `medium` (10 points), `hard` (15 points), `expert` (25 points)

**Category labels:**
- **Full Stack**: `fullstack`, `full-stack`, `frontend`, `backend`, `react`, `node`, `api`, `database`, `web-dev`
- **AI/ML**: `ai`, `ml`, `aiml`, `machine-learning`, `artificial-intelligence`, `data-science`, `neural-network`, `tensorflow`, `pytorch`, `nlp`, `computer-vision`, `deep-learning`

#### Webhook Setup

1. Go to your repository settings → Webhooks
2. Add webhook with URL: `http://your-domain.com/api/v1/webhook/github`
3. Select events: `Pull requests`, `Issues`
4. Set content type to `application/json`
5. Add secret (optional, for production)

### 4. How It Works

#### For Issue Creators:
1. Create issues with appropriate labels:
   - Add point labels (`easy`, `medium`, `hard`, or `X-points`)
   - Add category labels (`fullstack` or `aiml`)
   - Example: An issue labeled `fullstack`, `medium`, `react` would be worth 10 points in the Full Stack category

#### For Contributors:
1. Find issues in the repository
2. Work on the issue and create a pull request
3. In the PR description, reference the issue with keywords like:
   - `Closes #123`
   - `Fixes #456` 
   - `Resolves #789`
4. When the PR is merged, points are automatically awarded!

#### Point Calculation Logic:
- Points are extracted from issue labels
- If multiple point labels exist, they are summed
- Default is 5 points if no specific point labels are found
- Category is determined by label keywords
- If no category is detected, defaults to "fullstack"

## API Endpoints

### Core Endpoints
- `GET /api/v1/leaderboard` - Get both leaderboards
- `GET /api/v1/leaderboard/{category}` - Get specific category leaderboard  
- `GET /api/v1/activities` - Get recent activities
- `POST /api/v1/register` - Register a new user
- `GET /api/v1/user/{username}` - Get user details
- `POST /api/v1/webhook/github` - GitHub webhook endpoint

### Response Format
```json
{
  "message": "Success",
  "leaderboards": {
    "fullstack": [
      {
        "github_username": "user1",
        "full_name": "John Doe",
        "category": "fullstack",
        "points": 45,
        "pr_count": 3,
        "issues_solved": 3,
        "rank": 1
      }
    ],
    "aiml": [...]
  }
}
```

## Technical Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS, React
- **Backend**: FastAPI with Python
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Integration**: GitHub Webhooks and API

## Troubleshooting

### Common Issues

1. **Webhook not working**:
   - Check if the webhook URL is accessible
   - Verify the GitHub token has proper permissions
   - Check backend logs for webhook processing

2. **Points not updating**:
   - Ensure PR description contains proper issue references
   - Check if issue has appropriate labels
   - Verify GitHub token can access repository

3. **Frontend not loading data**:
   - Check if backend is running on port 9000
   - Verify CORS settings in backend
   - Check browser console for API errors

## Authors

- Enhanced by AI Assistant for dual-track competition
- Original frontend by:
  - [Venkatesh](https://github.com/venkatesh21bit)
  
