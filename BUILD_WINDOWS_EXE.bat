@echo off
setlocal
cd /d "%~dp0"
call scripts\prepare-windows.bat
if errorlevel 1 goto :failed
echo Building Poison Windows installer and portable EXE...
call npm.cmd run dist:win
if errorlevel 1 goto :failed
echo.
echo Done. Your Windows files are in the release folder.
pause
exit /b 0
:failed
echo.
echo Windows build failed. See the error above.
pause
exit /b 1
