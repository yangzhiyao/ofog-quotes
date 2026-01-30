Ofog Quotes - mobile app (Ionic/React skeleton)

What is included
- Minimal React-based single-page app with search, author filter, favorites (localStorage), and export JSON/MD.
- Data copied from /data/ofog-quotes.json into src/data/
- build_and_deploy.md with steps to add Capacitor and build an APK
- QA_REPORT.md summarizing data issues

How to run
1. cd app
2. npm install
3. npm run start

To prepare for Android
1. npm run build
2. npx cap add android
3. npx cap sync
4. npx cap open android (then build in Android Studio)
