@echo off
setlocal enabledelayedexpansion

REM iTunes Search App - Windows Startup Script (Database + Local Next.js)
REM This script starts the database in Docker and runs Next.js locally

title iTunes Search App Launcher

REM Colors for output (Windows doesn't support colors well, so we'll use echo)
set "INFO=[INFO]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

echo ================================
echo   iTunes Search App Launcher
echo   Database: Docker
echo   Frontend: Local
echo ================================
echo.

REM Handle command line arguments
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--stop" goto :stop
if "%1"=="--status" goto :status
if "%1"=="--db-only" goto :db_only

REM Check if Docker is installed
echo %INFO% Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker Compose is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

echo %INFO% Docker and Docker Compose are installed
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Node.js is not installed. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% npm is not installed. Please install Node.js with npm first.
    pause
    exit /b 1
)

echo %INFO% Node.js and npm are installed
echo.

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker daemon is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo %INFO% Docker daemon is running
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo %ERROR% package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo %INFO% Found package.json
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo %INFO% Installing dependencies...
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo %ERROR% Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo %INFO% Dependencies already installed
)

REM Generate Prisma client if needed
if exist "prisma" (
    echo %INFO% Generating Prisma client...
    npm run db:generate
    if errorlevel 1 (
        echo %ERROR% Failed to generate Prisma client.
        pause
        exit /b 1
    )
    echo %INFO% Prisma client generated
)

REM Start database services
echo %INFO% Starting database services...
docker-compose up -d
if errorlevel 1 (
    echo %ERROR% Failed to start database services.
    pause
    exit /b 1
)

REM Wait for database to be ready
echo %INFO% Waiting for database to start...
timeout /t 15 /nobreak >nul

REM Check if database is ready (simple approach)
set retries=0
:check_database
if %retries% geq 15 (
    echo %WARNING% Database might still be starting up...
    goto :push_schema
)

docker-compose exec -T postgres pg_isready -U itunes_user -d itunes_search >nul 2>&1
if errorlevel 1 (
    set /a retries+=1
    echo|set /p="."
    timeout /t 2 /nobreak >nul
    goto :check_database
)

echo %INFO% Database is ready!
echo.

:push_schema
REM Push database schema
if exist "prisma" (
    echo %INFO% Pushing database schema...
    npm run db:push
    if errorlevel 1 (
        echo %ERROR% Failed to push database schema.
        pause
        exit /b 1
    )
    echo %INFO% Database schema updated
)

REM Display service information
echo.
echo ^> All Services Started Successfully!
echo.
echo Available Services:
echo +---------------------------------------------+
echo ^| Frontend:     http://localhost:3000         ^|
echo ^| Database:     localhost:5432                ^|
echo ^| Admin Panel:  http://localhost:8080         ^|
echo +---------------------------------------------+
echo.
echo Database Admin Credentials:
echo Email:    admin@example.com
echo Password: admin123
echo.
echo Useful Commands:
echo * Stop database:    docker-compose down
echo * View DB logs:     docker-compose logs -f postgres
echo * Restart database: docker-compose restart
echo.

echo Opening database admin in your browser...
start http://localhost:8080

echo.
echo Starting Next.js development server...
echo Press Ctrl+C to stop the development server
echo.

REM Start Next.js dev server
npm run dev

goto :end

:help
echo iTunes Search App Startup Script for Windows
echo.
echo Usage: start-app.bat [options]
echo.
echo Options:
echo   -h, --help     Show this help message
echo   --stop         Stop database services
echo   --status       Show service status
echo   --db-only      Start only database services
echo.
echo Examples:
echo   start-app.bat              # Start database + Next.js
echo   start-app.bat --stop       # Stop database services
echo   start-app.bat --status     # Show service status
echo   start-app.bat --db-only    # Start only database
echo.
goto :end

:stop
echo %INFO% Stopping database services...
docker-compose down
if errorlevel 1 (
    echo %ERROR% Failed to stop database services.
) else (
    echo %INFO% Database services stopped successfully!
)
goto :end

:status
echo %INFO% Service status:
echo.
echo Database Services:
docker-compose ps
echo.
echo Next.js: Check if running on http://localhost:3000
goto :end

:db_only
echo %INFO% Starting only database services...
docker-compose up -d
if errorlevel 1 (
    echo %ERROR% Failed to start database services.
    pause
    exit /b 1
)
echo.
echo %INFO% Database services started. Run 'npm run dev' to start Next.js locally.
goto :end

:end
if "%1"=="" (
    echo.
    echo Next.js development server stopped.
    echo Database services are still running.
    echo To stop database: docker-compose down
    echo To restart app: start-app.bat
    pause
)
