@echo off
setlocal
cd /d "%~dp0"
echo === Mamulat-e-Yomiya: private Android APK ===

where node >NUL 2>&1
if errorlevel 1 (
  echo Node.js not found. Install Node.js 22 LTS or newer from nodejs.org, then run this file again.
  goto failed
)

rem --- Java: Gradle needs JDK 21. Use Android Studio's bundled JDK if JAVA_HOME is not set.
if not defined JAVA_HOME (
  if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
)
if not defined JAVA_HOME (
  echo JAVA_HOME is not set and Android Studio's JDK was not found in "%ProgramFiles%\Android\Android Studio\jbr".
  echo Install Android Studio, or set JAVA_HOME to a JDK 21 folder, then run this file again.
  goto failed
)
echo Using Java: %JAVA_HOME%

rem --- Android SDK: default location used by Android Studio.
if not defined ANDROID_HOME (
  if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)
if not defined ANDROID_HOME (
  echo Android SDK not found in "%LOCALAPPDATA%\Android\Sdk".
  echo Open Android Studio once and finish its setup wizard so it installs the SDK, then run this file again.
  goto failed
)
echo Using Android SDK: %ANDROID_HOME%

echo Installing required tools from npm (internet required for first run)...
call npm install
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
if not exist "android\gradlew.bat" (
  call npx cap add android
) else (
  call npx cap sync android
)
if errorlevel 1 goto failed
if not exist "android\gradlew.bat" goto failed

rem --- Tell Gradle where the SDK is (forward slashes avoid escaping problems).
set "SDKDIR=%ANDROID_HOME:\=/%"
> "android\local.properties" echo sdk.dir=%SDKDIR%

echo Applying Mamulat launcher icon...
xcopy /E /I /Y "android_branding\res\*" "android\app\src\main\res\" >NUL
if errorlevel 1 goto failed
rem The template's vector icon in drawable-v24 would override the custom icon on Android 7+.
if exist "android\app\src\main\res\drawable-v24\ic_launcher_foreground.xml" del /Q "android\app\src\main\res\drawable-v24\ic_launcher_foreground.xml"

echo Building the debug APK...
call android\gradlew.bat -p android assembleDebug
if errorlevel 1 goto failed
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "Mamulat_Yomiya_Private.apk"
if errorlevel 1 goto failed
echo.
echo SUCCESS: Mamulat_Yomiya_Private.apk
pause
exit /b 0

:failed
echo.
echo BUILD FAILED. Read the message above, or see README_FIRST.txt.
pause
exit /b 1
