@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instala una version LTS reciente desde https://nodejs.org/ y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" goto install
if not exist "node_modules\@supabase\supabase-js\package.json" goto install
goto start
:install
echo Sincronizando dependencias de SalesIA. Se requiere conexion a Internet...
call npm install
if errorlevel 1 (
  echo No se pudieron instalar las dependencias. Revisa tu conexion a Internet y vuelve a intentarlo.
  pause
  exit /b 1
)
:start
call npm run start
pause
