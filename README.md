# Daily Expanse 📱

An offline-first personal expense tracker built with **React Native + Expo** for Android.

## Stack

- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage for local offline persistence
- Lucide React Native

## Run locally

```bash
npm install
npx expo start
```

Then press `a` for Android, or run:

```bash
npx expo start --android
```

## Build an installable Android APK

Install EAS CLI if needed:

```bash
npm install -g eas-cli
eas login
```

Build a preview APK:

```bash
eas build -p android --profile preview
```

The generated APK can be downloaded to an Android phone and installed directly.

## Production

For Google Play Store, build an Android App Bundle:

```bash
eas build -p android --profile production
```

Core expense data is stored locally on the device, so the app does not require an internet connection for normal expense tracking.
