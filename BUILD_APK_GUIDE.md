# Building Vibe AI Agent APK

## Option 1: Build Locally (Requires Android SDK)

### Prerequisites
- Node.js 18+
- Java JDK 17+
- Android Studio with SDK

### Steps
```bash
# Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Build
cd vibe-ai-agent
npm install
npx cap sync android
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Option 2: Build with Android Studio

1. Open the `android` folder in Android Studio
2. Let Gradle sync complete
3. Click Build > Build Bundle(s) / APK(s) > Build APK(s)
4. APK will be in `app/build/outputs/apk/debug/`

---

## Option 3: Build Online (No SDK Required)

### Using Capacitor Cloud Build
1. Push to GitHub
2. Connect to Capacitor Cloud
3. Build automatically

### Using AppFlow
1. Create Ionic account at https://ionicframework.com/appflow
2. Connect repository
3. Configure build
4. Download APK

### Using Codemagic
1. Sign up at https://codemagic.io
2. Add repository
3. Configure Capacitor/Ionic build
4. Download artifacts

### Using GitHub Actions
Create `.github/workflows/build.yml`:
```yaml
name: Build Android APK
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          distribution: temurin
          java-version: 17
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      - name: Install dependencies
        run: npm install
      - name: Build web
        run: npm run copy-files
      - name: Sync Capacitor
        run: npx cap sync android
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 4: PWA (No APK Needed!)

The app works as a Progressive Web App:

1. Open `www/index.html` in Chrome on Android
2. Tap menu (⋮) > "Add to Home Screen"
3. App icon appears on your home screen
4. Works offline!

For serving:
```bash
npx serve www
# Then open http://localhost:3000 on your phone
```

Or upload `www/` folder to any web hosting (Vercel, Netlify, GitHub Pages).

---

## Quick PWA Deploy

### Vercel (Free)
```bash
npm i -g vercel
cd www
vercel
```

### Netlify (Free)
1. Go to https://app.netlify.com/drop
2. Drag the `www` folder
3. Done! Get your URL

### GitHub Pages (Free)
1. Push `www/` contents to `gh-pages` branch
2. Enable Pages in repository settings
3. Access at `username.github.io/repo-name`
