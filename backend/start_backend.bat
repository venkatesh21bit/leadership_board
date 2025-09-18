@echo off
echo Starting Leadership Board Backend...

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
if exist "requirements.txt" (
    echo Installing Python dependencies...
    pip install -r requirements.txt
) else (
    echo Installing core dependencies...
    pip install fastapi uvicorn pydantic requests python-dotenv cryptography python-multipart
)

REM Initialize database
echo Initializing database...
python database.py

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please edit .env file and add your GitHub token
)

REM Start the server
echo Starting FastAPI server on http://localhost:9000
echo Press Ctrl+C to stop the server
python main.py

pause