# SnapDose

A comprehensive Type 1 Diabetes management application that centralizes blood sugar monitoring, AI-assisted carbohydrate estimation, and insulin pump control into a single interface.

## Problem

Managing Type 1 Diabetes requires constant vigilance and the synchronization of multiple critical data points — continuous glucose monitoring (CGM), carbohydrate counting, and insulin dosing. Patients currently toggle between 3–4 different applications to manage these tasks. This fragmented workflow introduces significant cognitive load and increases the risk of manual entry errors, which can lead to diabetes burnout and, critically, incorrect insulin dosing.

## Solution

SnapDose integrates real-time CGM data from Dexcom, computer vision-based carb estimation via the Gemini API, and direct insulin pump communication to eliminate the need for multiple apps. The goal is to reduce cognitive load, minimize manual entry errors, and give users better glycemic control.

## Architecture

```
Mobile App (React Native / Expo)
    |
    |-- Image Upload --------> Google Cloud Storage
    |                               |
    |                         Cloud Run Function (Event Handler)
    |                               |
    |                          Vertex AI / Gemini API
    |                               |
    |                           Firestore (Carb Data)
    |
    |-- Dose Request --------> Spring Boot API (Cloud Run)
    |                               |
    |                         Microcontroller (Pump Simulator)
    |
    |-- Glucose Feed <-------- Dexcom API
```

- **Mobile App** — React Native (Expo SDK 54), targeting iOS and Android, file-based routing via expo-router
- **Backend API** — Java Spring Boot, hosted on Google Cloud Run; handles dosing logic and microcontroller communication
- **Database** — Firestore (user profiles, insulin-to-carb ratios, meal logs, dosing history)
- **Image Storage** — Google Cloud Storage (meal photos for AI analysis and historical reference)
- **AI Analysis** — Gemini API via Vertex AI; invoked by a Cloud Run Function triggered on image upload for asynchronous carb estimation
- **CGM Integration** — Dexcom API for real-time glucose data via OAuth
- **Pump Simulator** — M5Stack Tab5 (ESP32-P4) microcontroller, receives secure bolus commands from the Spring Boot API

The event-driven architecture ensures Gemini's carb calculation runs asynchronously — the mobile app stays responsive while the Cloud Run Function updates Firestore in the background.

## Application Screen Flow

1. **Signup / Login** — Firebase email/password authentication
2. **Onboarding** — User profile setup, insulin-to-carb ratios
3. **Device Pairing** — Pair Dexcom CGM and M5Stack microcontroller
4. **Home Screen** — Live glucose dashboard, 12-hour trend graph
5. **AI Photo Taker** — Camera capture for food recognition
6. **Review AI Estimate** — Editable carb count returned by Gemini
7. **Dose Insulin** — Bolus calculation and confirmation modal
8. **Food Gallery** — Historical meals, carb data, edit food details
9. **Edit Profile** — Update user settings and insulin ratios
10. **Settings** — App configuration

Navigation: bottom navbar (Home, Camera) + menu overlay (Food Gallery, Edit Profile, Settings).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, Expo SDK 54, expo-router |
| Backend API | Java Spring Boot, Google Cloud Run |
| Database | Firestore (Google Cloud) |
| Image Storage | Google Cloud Storage |
| AI | Gemini API via Vertex AI |
| Event Processing | Cloud Run Functions |
| CGM | Dexcom API |
| Pump Simulator | M5Stack Tab5 (ESP32-P4) |
| Auth | Firebase Authentication |
| Project Mgmt | Jira, GitHub, Discord |

## Sprint Roadmap

| Sprint | Theme | Key Deliverables |
|---|---|---|
| Sprint 2 | Project Foundations & Auth | Working auth flow, app navigation shell, empty placeholder screens, Git workflow established |
| Sprint 3 | User Profiles & Camera | Firestore read/write across users, onboarding profile, camera UI, initial Dexcom OAuth setup |
| Sprint 4 | AI Pipeline & Food Gallery | Gemini food analysis end-to-end, GCS image upload, food gallery with history |
| Sprint 5 | CGM Integration & Dosing Calculator | Live Dexcom glucose feed, trend graph on home screen, bolus calculation logic |
| Sprint 6 | Pump Integration & Polish | M5Stack bolus command delivery, full end-to-end flow, UI polish |

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- Expo CLI
- iOS Simulator, Android Emulator, Web Browser, or Expo Go on a physical device

### Installation

```bash
git clone https://github.com/EGR302-SnapDose/SnapDose.git
cd SnapDose
cd react-native-app
npm install
```

### Running the App

```bash
npx expo start
```

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web Browser
- Scan the QR code with Expo Go on a physical device

## Development Workflow

All feature work happens on individual branches. Sync with the `testing` branch before starting new work and open a PR to merge back. No direct commits to `main`.

```
main
└── staging
    └── testing ← integration branch; sync here before starting work
        └── feature/your-feature-name
```

PRs are reviewed in the `#pr-reviews` Discord channel.

## Team

Ryan Stoffel | Team Lead 
Payton Henry | Project Lead 
Micah Suk
Mili Anderson
Elijah Tabor

EGR 302: Jr. Design Project, Spring 2026 — California Baptist University (Dr. Dan Grissom)
