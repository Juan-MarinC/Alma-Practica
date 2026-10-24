@echo off
rem Enciende el PostgreSQL local de .pgdata (puerto 5434) si no está encendido ya.
set PG_CTL="C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
cd /d "%~dp0.."
%PG_CTL% status -D .pgdata >nul 2>&1 && (echo La base de datos ya estaba encendida. & exit /b 0)
%PG_CTL% -D .pgdata -o "-p 5434" -l .pgdata\postgres.log -w start
