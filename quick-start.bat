@echo off
REM Chat App Quick Start Script for Windows
REM Run this script to set up both backend and frontend

echo.
echo ==========================================
echo Chat App - Quick Start Setup
echo ==========================================
echo.

REM Backend Setup
echo Setting up Backend...
cd backend

if exist .env (
    echo .env file already exists
) else (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Please update backend\.env with your MongoDB URI
)

echo Installing backend dependencies...
call npm install

echo.
echo Backend setup complete!
echo To start backend: cd backend ^&^& npm run dev
echo.

REM Frontend Setup
cd ..\frontend

if exist .env.local (
    echo .env.local file already exists
) else (
    echo Creating .env.local from .env ...
    copy .env .env.local
)

echo Installing frontend dependencies...
call npm install

echo.
echo Frontend setup complete!
echo To start frontend: cd frontend ^&^& npm run dev
echo.

echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Update backend\.env with your MongoDB URI
echo 2. Open two terminals:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo 3. Open http://localhost:5173 in your browser
echo.
echo Happy chatting!
echo.
pause
