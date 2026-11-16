@echo off
rem Called from the launchers after changing to the project directory.
rem Do not use setlocal: the Node PATH fallback must reach the caller.
where node >nul 2>nul
if errorlevel 1 if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS from https://nodejs.org/
  exit /b 1
)
node -e "for (const p of ['vite','typescript','electron','concurrently','wait-on','cross-env','electron-builder']) require.resolve(p)" >nul 2>nul
if errorlevel 1 (
  echo Installing missing dependencies...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)
node -e "if (!require('fs').existsSync(require('electron'))) process.exit(1)" >nul 2>nul
if errorlevel 1 (
  echo Repairing the missing Electron runtime. Internet may be required...
  call npm.cmd rebuild electron
  if errorlevel 1 exit /b 1
)
node -e "if (!require('fs').existsSync(require('electron'))) process.exit(1)" >nul 2>nul
if errorlevel 1 (
  echo Electron is still missing. Check the install output and retry.
  exit /b 1
)
exit /b 0
