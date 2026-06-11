<div align="center">
  <h1>Inzeedo ERP - Mobile Client</h1>
  <p>Native mobile companion app for on-the-go management and reporting.</p>
</div>

---

## 📖 Overview

The **Mobile Client** is the portable extension of the Inzeedo ERP suite, designed for managers, owners, and floor staff who need to access critical business functions on the move. Built using Next.js and packaged natively with Capacitor, it delivers a smooth, app-like experience on both iOS and Android devices.

## ⚡ Key Features

- **Mobile Dashboards**: Access vital analytics and daily summaries from anywhere.
- **Inventory Scanning**: Utilize device cameras for quick barcode scanning and stock checks.
- **Dynamic Reporting**: View mobile-optimized reports for manufacturing, retail, and restaurant modules.
- **Native Experience**: Packaged via Capacitor to leverage native device capabilities like haptic feedback, camera, and secure storage.
- **Responsive UI**: Tailored touch-friendly interfaces using Tailwind CSS and mobile-specific components.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (Static Export)
- **Native Wrapper**: [Capacitor](https://capacitorjs.com/) by Ionic
- **Styling**: Tailwind CSS & mobile-optimized UI components
- **State Management**: Zustand

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### Installation

1. Clone the repository and navigate to the `mobile-app` directory:
   ```bash
   cd pos/important/mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally (Web View)
To run the Next.js application in a standard mobile browser view for rapid UI development:
```bash
npm run dev
```

### Running on Device/Simulator
To build the app and sync it with Capacitor for native deployment:

1. Build the Next.js static export:
   ```bash
   npm run build
   ```
2. Sync the web assets to the native Android/iOS projects:
   ```bash
   npx cap sync
   ```
3. Open the native IDE to run the app:
   ```bash
   npx cap open android
   # or
   npx cap open ios
   ```

## 📦 Deployment

Production builds are handled through the standard App Store Connect (iOS) and Google Play Console (Android) release pipelines using the compiled native projects.
