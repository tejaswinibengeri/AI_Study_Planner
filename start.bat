@echo off
echo Starting AI Study Planner...
cd backend
start cmd /c "npm start"
timeout /t 3 >nul
start http://localhost:5005/
