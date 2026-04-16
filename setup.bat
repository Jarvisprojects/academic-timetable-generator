@echo off

REM ============================================================================
REM Academic Timetable Generator - Complete Setup Script (Windows)
REM ============================================================================
REM Usage: setup.bat
REM ============================================================================

setlocal enabledelayedexpansion

color 0B
cls

echo.
echo ============================================================================
echo Academic Timetable Generator - Setup for Windows
echo ============================================================================
echo.

REM ============================================================================
REM 1. Check Prerequisites
REM ============================================================================

echo [Step 1/6] Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo   - Node.js: OK

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo   - npm: OK

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python 3 is not installed.
    echo Download from: https://www.python.org/
    pause
    exit /b 1
)
echo   - Python 3: OK

where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed.
    echo Download from: https://git-scm.com/
    pause
    exit /b 1
)
echo   - Git: OK
echo.

REM ============================================================================
REM 2. Node.js Dependencies
REM ============================================================================

echo [Step 2/6] Installing Node.js dependencies...
if exist "package.json" (
    call npm install
    echo Setup: Node.js dependencies installed
) else (
    echo ERROR: package.json not found
    pause
    exit /b 1
)
echo.

REM ============================================================================
REM 3. Python Virtual Environment
REM ============================================================================

echo [Step 3/6] Setting up Python environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Setup: Virtual environment created
) else (
    echo WARN: Virtual environment already exists
)
echo.

REM ============================================================================
REM 4. Python Dependencies
REM ============================================================================

echo [Step 4/6] Installing Python packages...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel
python -m pip install ortools
echo Setup: Python packages installed
echo.

REM ============================================================================
REM 5. Environment Configuration
REM ============================================================================

echo [Step 5/6] Configuring environment...
if not exist ".env" (
    (
        echo # Server Configuration
        echo PORT=3000
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://timetable_user:timetable123@localhost:5432/timetable_db
        echo.
        echo # Security
        echo JWT_SECRET=c8e7d3a9f2b4e1c6d9a3f5e8b2c7d1a4f6e9b2c5d8e1a4f7b0c3d6e9a2f5
        echo.
        echo # Python
        echo PYTHON_PATH=venv\Scripts\python.exe
        echo.
        echo # Environment
        echo NODE_ENV=development
    ) > .env
    echo Setup: .env file created
) else (
    echo WARN: .env file already exists
)
echo.

REM ============================================================================
REM 6. Database Instructions
REM ============================================================================

echo [Step 6/6] Database setup...
echo.
echo NOTE: PostgreSQL setup is required.
echo.
echo Option A: Use Docker
echo   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
echo   2. Run: docker run -d --name timetable-postgres -e POSTGRES_USER=timetable_user -e POSTGRES_PASSWORD=timetable123 -e POSTGRES_DB=timetable_db -p 5432:5432 postgres:16-alpine
echo.
echo Option B: Use Local PostgreSQL
echo   1. Install PostgreSQL: https://www.postgresql.org/download/windows/
echo   2. Create database: timetable_db
echo   3. Create user: timetable_user with password: timetable123
echo   4. Update DATABASE_URL in .env if different
echo.

REM ============================================================================
REM Completion
REM ============================================================================

echo.
echo ============================================================================
echo Setup Complete!
echo ============================================================================
echo.
echo To start the development server:
echo   1. Open a command prompt in this directory
echo   2. Run: npm start
echo.
echo Then open your browser to: http://localhost:3000
echo.
echo Default Admin Login:
echo   Username: admin
echo   Email: admin@timetable.local
echo   Password: Admin@123
echo.
pause
