# SnapDose

A comprehensive Type 1 Diabetes management application that centralizes blood sugar monitoring, AI-assisted carbohydrate estimation, and insulin pump control into a single interface.

## Overview

SnapDose integrates real-time CGM data from Dexcom, computer vision-based carb estimation via the Gemini API, and direct insulin pump communication to eliminate the need for toggling between multiple apps. The goal is to reduce cognitive load, minimize manual entry errors, and give users better glycemic control.

## Architecture

- **Mobile App** -- React Native (Expo), targeting iOS and Android
- **Backend API** -- Java Spring Boot, hosted on Google Cloud Run
- **Database** -- Firestore (user profiles, meal logs, dosing history)
- **Image Storage** -- Google Cloud Storage
- **AI Analysis** -- Gemini API via Vertex AI for carbohydrate estimation from food photos
- **CGM Integration** -- Dexcom API for real-time glucose data
- **Pump Simulator** -- M5Stack CoreS3 (ESP32-P4) microcontroller, receiving bolus commands over secure connection

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- Expo CLI
- iOS Simulator, Android Emulator, or Expo Go on a physical device

### Installation

```bash
git clone https://github.com/<org>/EGR302-JR-Design-Group-3.git
cd EGR302-JR-Design-Group-3
npm install
```

### Running the App

```bash
npx expo start
```

From there, open the app on your preferred target:

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with Expo Go on a physical device

## Team

- Ryan Stoffel (Team Lead)
- Payton Henry (Project Lead)
- Micah Suk
- Mili Anderson
- Elijah Tabor

EGR 302: Jr. Design Project, Spring 2026 -- California Baptist University
