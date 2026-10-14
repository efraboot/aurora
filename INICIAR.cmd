@echo off
setlocal
cd /d "%~dp0"
set "AURORA_NODE="
where node.exe >nul 2>&1
if not errorlevel 1 set "AURORA_NODE=node.exe"
if not defined AURORA_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "AURORA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined AURORA_NODE (
  echo No se encontro Node.js. Instala Node.js o usa el runtime incluido con Codex.
  echo No se descarga ni instala nada automaticamente.
  pause
  exit /b 1
)
"%AURORA_NODE%" "%~dp0iniciar-local.mjs" --open %*
if errorlevel 1 pause
endlocal
