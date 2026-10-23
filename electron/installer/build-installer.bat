@echo off
cd /d "%~dp0"
set "ISCC="
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 7\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%LocalAppData%\Programs\Inno Setup 7\ISCC.exe" set "ISCC=%LocalAppData%\Programs\Inno Setup 7\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe" set "ISCC=%LocalAppData%\Programs\Inno Setup 6\ISCC.exe"
if not defined ISCC (
  echo Inno Setup is not installed.
  echo Opening the download page - install it, then run this file again.
  start "" "https://jrsoftware.org/isdl.php"
  pause
  exit /b 1
)
if not exist "Kuan\Kuan.exe" (
  echo The Kuan folder is missing. Run join-and-extract.bat first.
  pause
  exit /b 1
)
echo Building the installer...
"%ISCC%" "Kuan.iss"
if errorlevel 1 (
  echo Build failed - see the messages above.
  pause
  exit /b 1
)
echo.
echo Done: Output\Kuan-Setup-0.9.0.exe
explorer "Output"
pause
