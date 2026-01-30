Ofog Quotes - Build & Deploy

Prerequisites
- Node 18+ and npm
- Java JDK 11+
- Android Studio (for Android SDK / emulator)
- Capacitor CLI (installed via npm)

Local dev
1. cd app
2. npm install
3. npm run start

Build web
1. npm run build
2. (optional) npm run preview

Add Capacitor Android
1. npm run cap-add-android
2. npm run cap-sync

Open Android project
1. npx cap open android
2. Build APK in Android Studio (Build > Build Bundle / APKs)
3. For release signing, create a keystore and configure signingConfigs in app/build.gradle

Notes
- The app loads data from src/data/ofog-quotes.json (pre-scraped). For large datasets consider fetching remotely or using compressed assets.
- Exports (JSON/MD) are generated from favorites stored in localStorage.
- To produce a reproducible signed APK from CLI: use Gradle tasks via ./gradlew assembleRelease after setting signing config.
