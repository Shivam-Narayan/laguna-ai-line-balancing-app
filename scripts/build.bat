@echo off
setlocal
set args=%*
if defined args set args=%args:--=-%
powershell -ExecutionPolicy Bypass -File "%~dp0build.ps1" %args%
