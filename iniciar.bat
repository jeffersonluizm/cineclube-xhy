@echo off
setlocal
REM Sobe a API (backend) e o site (frontend) do Cineclube XHY, cada um na sua janela.
REM API: http://localhost:3001   Site: http://localhost:3000
REM Para parar, feche as duas janelas (ou Ctrl+C em cada uma).

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 22 ou superior: https://nodejs.org
  goto fim
)

if not exist "codigo-fonte\backend\node_modules" (
  echo Instalando dependencias da API...
  pushd "codigo-fonte\backend"
  call npm install
  popd
)
if not exist "codigo-fonte\frontend\node_modules" (
  echo Instalando dependencias do site...
  pushd "codigo-fonte\frontend"
  call npm install
  popd
)

start "Cineclube XHY - API" /D "%~dp0codigo-fonte\backend" cmd /k npm run dev
start "Cineclube XHY - Site" /D "%~dp0codigo-fonte\frontend" cmd /k npm run dev

echo.
echo API:  http://localhost:3001
echo Site: http://localhost:3000  (painel do editor em /admin)
echo.
echo As duas janelas continuam abertas enquanto os servidores rodam.

:fim
pause
