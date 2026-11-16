@echo off
setlocal
cd /d "%~dp0"
call scripts\prepare-windows.bat
if errorlevel 1 goto :failed
echo Starting Poison Creator Studio...
call npm.cmd run dev
if errorlevel 1 goto :failed
exit /b 0
:failed
echo.
echo Poison could not start. See the error above.
pause
exit /b 1
