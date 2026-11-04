@echo off
REM ================================================================
REM  ZGLF Local Preview Launcher (Windows — for testing before XAMPP)
REM ================================================================
REM Requires PHP on PATH (XAMPP installs it at C:\xampp\php\php.exe)
REM Usage: double-click this file from the zglf folder
REM Then open http://localhost:8080/ in your browser

echo.
echo  ==============================================
echo   ZGLF Website — Local Preview
echo  ==============================================
echo.
echo  Starting PHP server on http://localhost:8080 ...
echo  Public site:  http://localhost:8080/
echo  Admin panel:  http://localhost:8080/admin/
echo  Admin login:  admin / admin123
echo.
echo  Press Ctrl+C to stop the server.
echo.

php -S 0.0.0.0:8080 router.php

pause
