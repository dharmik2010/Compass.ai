@echo off
setlocal enabledelayedexpansion
title AI Travel Planner
cd /d "%~dp0"

echo ============================================
echo    AI Travel Planner - Quick Start
echo ============================================
echo.

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [1] Start with Docker (PostgreSQL + Redis + Backend + Frontend)
    echo [2] Start backend only (requires local PostgreSQL + Redis)
    echo [3] Install deps + start backend
    echo [4] Open in VS Code
    echo.
    set /p "choice=Choose (1/2/3/4): "
) else (
    echo [Docker not found - using local mode]
    echo [2] Start backend only
    echo [3] Install deps + start backend
    echo [4] Open in VS Code
    echo.
    set /p "choice=Choose (2/3/4): "
)

if "!choice!"=="" set choice=1

if "!choice!"=="1" (
    echo.
    echo [1/4] Building and starting containers...
    docker-compose up --build -d
    echo.
    echo [2/4] Waiting for PostgreSQL...
    :wait_loop
    timeout /t 2 /nobreak >nul
    docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
    if errorlevel 1 goto wait_loop
    echo [OK] PostgreSQL is ready
    echo.
    echo [3/4] Running migrations...
    docker-compose exec -T backend alembic upgrade head 2>nul
    if errorlevel 1 echo [SKIP] No migrations found
    echo.
    echo [4/4] Done!
    echo.
    echo ============================================
    echo  AI Travel Planner is running!
    echo.
    echo  Frontend: http://localhost:5173
    echo  Backend:  http://localhost:8000
    echo  API Docs: http://localhost:8000/docs
    echo ============================================
    echo.
    echo Press any key to stop all services...
    pause >nul
    docker-compose down
    echo [INFO] Services stopped.
    goto :eof
)

if "!choice!"=="2" (
    echo.
    echo [INFO] Starting backend only...
    echo [INFO] Make sure PostgreSQL and Redis are running locally.
    echo.
    python --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found in PATH.
        pause
        exit /b 1
    )
    if not exist "backend\.env" (
        echo [INFO] Creating .env from template...
        copy "backend\.env.example" "backend\.env" >nul
        echo [WARN] Edit backend\.env with your API keys.
    )
    cd backend
    echo [INFO] Starting FastAPI on http://localhost:8000
    echo [INFO] API docs at http://localhost:8000/docs
    echo.
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    goto :eof
)

if "!choice!"=="3" (
    echo.
    echo [INFO] Installing Python dependencies...
    cd backend
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] pip install failed.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
    if not exist ".env" (
        copy ".env.example" ".env" >nul
        echo [WARN] Created .env from template. Edit with your API keys.
    )
    echo.
    echo [INFO] Starting FastAPI on http://localhost:8000
    echo [INFO] API docs at http://localhost:8000/docs
    echo.
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    goto :eof
)

if "!choice!"=="4" (
    where code >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] VS Code 'code' command not found in PATH.
    ) else (
        code .
        echo [OK] VS Code opened.
    )
    pause
    goto :eof
)

echo [ERROR] Invalid choice.
pause
