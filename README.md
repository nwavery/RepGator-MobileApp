# RepGator Mobile App

## Overview

This is the mobile application for RepGator, built using React Native and Expo. It allows users to:

*   Authenticate (Login/Register)
*   View their dashboard
*   Find and view details about their political representatives based on their district.
*   Engage in messaging with representatives (functionality may vary).
*   Stay updated with political news.
*   Manage their profile settings, including address.

## Setup

1.  **Prerequisites:**
    *   Node.js (LTS version recommended)
    *   npm or yarn
    *   Expo Go app installed on your physical device or an Android/iOS simulator set up on your development machine.

2.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd RepGator-MobileApp
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Custom Fonts:**
    *   This project uses the Playfair Display font.
    *   Ensure you have the necessary font files (`.ttf` or `.otf`, e.g., `PlayfairDisplay-Regular.ttf`, `PlayfairDisplay-Bold.ttf`) located in the `./assets/fonts/` directory.
    *   If the directory or files are missing, create the `assets/fonts` directory and add the font files.

5.  **Environment Variables:**
    *   The application connects to a backend API. The API base URL is configured via an environment variable.
    *   Create a `.env` file in the root of the project.
    *   Add the following line to the `.env` file, replacing the placeholder with your actual API URL:
        ```
        EXPO_PUBLIC_API_URL=http://your-backend-api-url:port
        ```
        (For local development, this might be `http://localhost:8080`, `http://10.0.2.2:8080` for standard Android emulator, or your machine's local IP for physical devices, e.g., `http://192.168.1.100:8080`).

## Running the App

1.  **Start the development server:**
    ```bash
    npx expo start
    ```
    *   To clear the cache (recommended after installing dependencies or adding assets): `npx expo start -c`
    *   To run on a specific port (e.g., 8088): `npx expo start --port 8088`

2.  **Open the app:**
    *   **iOS Simulator:** Press `i` in the terminal running Expo.
    *   **Android Emulator:** Press `a` in the terminal running Expo.
    *   **Physical Device:** Scan the QR code displayed in the terminal using the Expo Go app (Android) or the Camera app (iOS).

## Key Technologies

*   React Native
*   Expo
*   TypeScript
*   React Navigation (v6)
*   Zustand (State Management)
*   date-fns (Date utilities)
*   expo-font (Custom font loading)
*   expo-linear-gradient

## Project Structure (Simplified)

```
.
├── assets/         # Static assets like images, fonts
│   └── fonts/      # Custom font files
├── src/
│   ├── components/   # Reusable UI components (e.g., DashboardHeader)
│   ├── navigation/   # Navigation setup (AppNavigator.tsx)
│   ├── screens/      # Screen components (Auth, Main, etc.)
│   ├── services/     # API client logic (apiClient.ts)
│   ├── stores/       # Zustand state stores (authStore.ts, etc.)
│   └── utils/        # Utility functions (formatters.ts)
├── .env            # Environment variables (API URL - create this file)
├── App.tsx         # Root component, font loading
├── index.ts        # App entry point
├── package.json    # Project dependencies and scripts
└── README.md       # This file
``` 