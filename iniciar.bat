@echo off
setlocal
chcp 65001 >nul
REM Sobe a API (backend) e o site (frontend) do Cineclube XHY, cada um na sua janela.
REM Pode rodar quantas vezes quiser: só instala e configura o que estiver faltando.
REM API: http://localhost:3001   Site: http://localhost:3000   Painel: http://localhost:3000/admin/login

cd /d "%~dp0"

echo.
echo === Cineclube XHY: preparando o ambiente local ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [erro] Node.js nao encontrado. Instale o Node.js 22 ou superior: https://nodejs.org
  goto fim
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 (
  echo [erro] O Node.js instalado e antigo. Instale o Node.js 22 ou superior: https://nodejs.org
  goto fim
)

if not exist "codigo-fonte\backend\node_modules" (
  echo Instalando dependencias da API...
  pushd "codigo-fonte\backend"
  call npm install --no-fund --no-audit
  popd
)
if not exist "codigo-fonte\frontend\node_modules" (
  echo Instalando dependencias do site...
  pushd "codigo-fonte\frontend"
  call npm install --no-fund --no-audit
  popd
)

REM Cria os .env com segredos fortes aleatorios (so na primeira vez)
node ferramentas\preparar-local.mjs
if errorlevel 1 goto fim

netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul
if not errorlevel 1 (
  echo [aviso] A porta 3001 ja esta em uso: a API provavelmente ja esta rodando.
) else (
  start "Cineclube XHY - API" /D "%~dp0codigo-fonte\backend" cmd /k npm run dev
)
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo [aviso] A porta 3000 ja esta em uso: o site provavelmente ja esta rodando.
) else (
  start "Cineclube XHY - Site" /D "%~dp0codigo-fonte\frontend" cmd /k npm run dev
)

echo.
echo Esperando a API ficar pronta (na primeira vez o banco embutido e baixado; pode levar alguns minutos)
node ferramentas\esperar-api.mjs http://localhost:3001/api/health 300000
if errorlevel 1 goto fim

start "" http://localhost:3000

echo.
echo ============================================================
echo  Site:   http://localhost:3000
echo  Painel: http://localhost:3000/admin/login
echo          botao "Entrar no painel como editor de demonstracao"
echo          (a senha do editor esta em codigo-fonte\backend\.env)
echo  API:    http://localhost:3001/api/health
echo ============================================================
echo Os dados de exemplo sao criados se o banco estiver vazio.
echo Para parar, feche as janelas "Cineclube XHY - API" e "Cineclube XHY - Site".

:fim
echo.
pause
