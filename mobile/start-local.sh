#!/bin/bash

# This script automates starting the backend and frontend servers for local development.
# It is designed to be run from the project's root directory.
# It requires a terminal that supports background jobs and basic commands like `kill`.

echo "--- Starting CMMS Local Development Environment ---"

# --- Start Backend Server ---
echo "[1/3] Starting backend server in the background..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
echo "      Backend server running with PID: $BACKEND_PID"

# Give the backend a moment to initialize
sleep 5

# --- Start Frontend Server ---
echo "[2/3] Starting frontend Expo web server..."
cd mobile
# The `npm run web` command from Project_Progress.md is used here.
# It will automatically open the browser.
npm run web &
FRONTEND_PID=$!
cd ..
echo "      Frontend server running with PID: $FRONTEND_PID"

echo "[3/3] Your application should now be open in your browser."
echo "---"
echo "To stop all servers, press [Ctrl+C] in this window or run the following commands:"
echo "kill $BACKEND_PID"
echo "kill $FRONTEND_PID"

# Wait for the user to manually stop the script, which keeps the PIDs visible.
wait $FRONTEND_PID
wait $BACKEND_PID