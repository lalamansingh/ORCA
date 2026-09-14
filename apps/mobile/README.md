# ORCA Marine Mobile App (React Native & Expo)

A dedicated, native mobile application designed specifically for Indian fishermen and coastal mariners.

## Features
- **Design System**: Maritime Navy (`#082536`), Ocean Marine (`#087d98`), Marine Cyan (`#34bdd1`), and PFZ Mint (`#edf8f5`).
- **Live Ocean & Risk Assessment**: 1-glance safety pill (🟢 Safe / 🟡 Caution / 🔴 Danger), risk score, advisory text, and 6-metric grid (waves, wind, SST, currents, visibility, tides).
- **AI Sagar Saathi (साग़र साथी)**: Multilingual voice and text fisherman assistant supporting 10 Indian coastal languages.
- **PFZ Zones (मछली पकड़ने के क्षेत्र)**: Potential Fishing Zones with distances in km, compass directions (bearings), depth, and catch probability percentage.
- **Coastal Harbor Selector**: Veraval, Porbandar, Mumbai, Kochi, Chennai, Visakhapatnam, Paradip, etc.
- **1-Tap Emergency SOS**: Instant direct phone dialer for Indian Coast Guard (`1554`) and Coastal Police (`1093`).

---

## Running on your Android Phone with Expo Go

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 2. Start the Expo Development Server
```bash
npx expo start
```

### 3. Open on your Android Device
1. Install **Expo Go** from Google Play Store on your Android phone.
2. Scan the QR code displayed in your terminal using the **Expo Go** app (or Camera).
3. The app will launch instantly on your device as a native Android app!

---

## Building a Standalone Android APK (.apk) via EAS

You can compile a direct, downloadable `.apk` file for Android without needing Android Studio:

```bash
# 1. Install EAS CLI (if not installed)
npm install -g eas-cli

# 2. Log in to your free Expo account
eas login

# 3. Build standalone preview APK
cd apps/mobile
eas build -p android --profile preview
```

Once the cloud build finishes (typically 3–5 minutes), EAS will provide a direct download URL for the `.apk` which can be installed on any Android phone immediately!
