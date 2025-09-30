@echo on
title Ran A Han - Inline Server (keeps window open)
setlocal ENABLEDELAYEDEXPANSION

set BACKEND_DIR=C:\Users\peach\Downloads\Ran_A_Han_Prototype_2\Ran _A_Han_Prototype\backend
set DB_FILE=ranahan.db
set SEED_FILE=seed.sql

echo [1/4] cd to backend
cd /d "%BACKEND_DIR%" || (echo [ERROR] โฟลเดอร์ไม่พบ: %BACKEND_DIR% & pause & exit /b 1)

echo [2/4] seed database (ถ้ามี sqlite3)
where sqlite3 || echo [WARN] ไม่พบ sqlite3 ใน PATH - จะข้าม seed
where sqlite3 >nul 2>&1 && sqlite3 "%DB_FILE%" < "%SEED_FILE%"

echo [3/4] npm install
call npm install || (echo [ERROR] npm install ล้มเหลว & pause & exit /b 1)

echo [4/4] start node server.js (กด Ctrl+C เพื่อหยุด)
node server.js
echo.
echo (server ปิดตัวลงแล้ว / errorlevel=%ERRORLEVEL%)
pause
