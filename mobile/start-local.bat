@echo off
echo --- Starting CMMS Local Development Environment for Windows ---

REM This script starts the backend and frontend servers in separate windows.
REM It should be run from the project's root directory.

echo [1/2] Starting backend server in a new window...
cd backend
start "CMMS Backend" cmd /k "npm run dev"
cd ..

echo Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

echo [2/2] Starting frontend Expo web server in a new window...
cd mobile
start "CMMS Frontend" cmd /k "npm run web"
cd ..

echo --- Startup complete. Check the new terminal windows. ---