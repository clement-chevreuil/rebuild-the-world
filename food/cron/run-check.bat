@echo off
cd /d "%~dp0"
node check-expirations.js >> run-check.log 2>&1
