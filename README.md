# SolfaTonic

SolfaTonic is an offline-first Tonic Sol-fa SATB choir notation editor for church choirs and music teams. It runs as a Vite React web app and is packaged as an Android APK with Capacitor.

## Features

- Animated splash screen, project dashboard, about page, and help page.
- Project creation and editing with required title and scale fields.
- Dynamic S, A, T, B voice selection for SATB, SA, TB, or partial layouts.
- A4 notation editor with a maximum of five SATB blocks per page.
- Tiptap editor area, touch-friendly note toolbar, symbol controls, octaves, undo, and redo.
- Offline project persistence with localforage.
- Auto-save, dark mode, mobile-first layout, print support, PDF export, and PNG export.
- Validation for meter patterns and basic tonic sol-fa token spacing.
- Prepared extension boundary for OCR scanning, image insertion, Firebase sync, cloud backup, collaboration, and audio playback.

## Install

```bash
npm install
```

Installs React, Vite, TailwindCSS, Capacitor, Tiptap, jsPDF, localforage, Framer Motion, and test tooling.

## Run Locally

```bash
npm run dev
```

Starts the Vite development server. Open the printed local URL in a browser.

## Test

```bash
npm test
```

Runs Vitest tests for the project model and notation validation engine.

## Build Web Assets

```bash
npm run build
```

Type-checks the project and creates the production web build in `dist/`.

## Capacitor Android Commands

```bash
npx cap init
npx cap add android
npx cap sync
```

This project already includes `capacitor.config.ts`, so `npx cap init` is only needed if you intentionally reset Capacitor metadata. Use `npx cap add android` once to create the native Android project, then use `npx cap sync` after each web build to copy `dist/` into Android.

## Build APK

```bash
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected Android device with:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Play Store Release Build

1. Open the Android project in Android Studio.
2. Set the application ID, version code, and version name in `android/app/build.gradle`.
3. Create a release keystore in Android Studio.
4. Build a signed Android App Bundle with `Build > Generate Signed Bundle / APK`.
5. Upload the generated `.aab` file to Play Console.
6. Complete store listing, privacy, content rating, and testing requirements before production rollout.

## Folder Structure

- `src/components` contains reusable UI, notation, toolbar, and A4 page components.
- `src/pages` contains splash, dashboard, form, editor, about, and help screens.
- `src/context` contains app state and project persistence wiring.
- `src/services` contains storage, export, validation, and future integration boundaries.
- `src/utils` contains project creation, layout, pagination, and date formatting helpers.
- `src/data` contains constants, toolbar data, and future feature descriptors.
- `src/styles` contains Tailwind and print styles.
- `public` contains the web manifest and app icon.

## Troubleshooting

- If Android build fails with missing SDK errors, install Android Studio and the current Android SDK platform.
- If Capacitor says `dist` is missing, run `npm run build` first.
- If exports fail, check that the A4 page is visible before tapping PDF or PNG.
- If local data is corrupt, the app recovers by loading an empty project list instead of crashing.
