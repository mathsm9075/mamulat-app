MAMULAT-E-YOMIYA | PRIVATE ANDROID APK PROJECT
=================================================
This is an Android APK BUILD PROJECT, NOT a precompiled APK.

REQUIREMENTS ON WINDOWS:
1. Windows computer with Node.js 22 or newer.
2. Android Studio, Android SDK installed, and an internet connection for first setup.
3. Android Studio SDK Manager -> install Android API platform + Build Tools.

FASTEST METHOD
--------------
1. Extract this ZIP to a normal folder (e.g. C:\MamulatAndroid).
2. Double-click BUILD_APK_WINDOWS.bat.
3. If the script says Java or the Android SDK was not found, open Android
   Studio once, finish its setup wizard (it installs the SDK), then rerun
   the BAT file. The script finds Android Studio's own Java and the SDK in
   their default folders automatically.
4. The BAT script also installs the supplied custom app launcher icon.
5. Install the generated Mamulat_Yomiya_Private.apk on your phone.
6. Share the same APK with family members. Each device saves its own data.

MANUAL METHOD (terminal in project folder)
------------------------------------------
npm install
npm run build
npx cap add android
npx cap open android

Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s).
Result: android/app/build/outputs/apk/debug/app-debug.apk

For updates to the same installed app, keep the package ID
'com.mamulat.yomiya' and use the same signing key. Android Studio's
Debug APK may have a different debug key on a different computer; use a
consistent release keystore for future update builds.

PERSONAL DATA AND BACKUPS
-------------------------
- Each phone has separate private offline progress. No admin dashboard.
- Native private file mirrors provide extra protection if WebView storage
  is reclaimed; there is NO automatic cloud backup/sync.
- Export backup: open app menu -> backup. Android's share/save dialog opens.
- Import backup: choose the JSON backup file in the app's import option.
- Uninstall deletes app-private data. Always keep an exported JSON backup.
- Existing HTML/browser data will NOT copy automatically into the Android
  app. Export a JSON backup from HTML app, then import into Android app.
- A sample completed-day record from 2024 has been intentionally removed
  for new Android installs; routine text, IDs, categories and images remain.
- No Google fonts are downloaded. Android uses the fonts installed on device.

LIMITATIONS
-----------
- This package has NOT been compiled to APK in the creation environment
  because Android SDK, Gradle and npm registry access are unavailable.
- You need to test file picking/sharing on your Android handset.
- The debug APK is suitable for testing and private distribution, but for
  stable future update releases create a signed APK and keep its keystore.

Reference: https://capacitorjs.com/docs/getting-started
