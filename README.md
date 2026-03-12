<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XvbZSx14JmjHBHc8AqZaVX1iGvwVX25I

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in a local `.env` file (used by the server)
3. Build and run:
   `npm run build`
   `npm run start`

Optional for local frontend dev with Vite:
1. Start the server with `GEMINI_API_KEY=... npm run server`
2. In another terminal, run `VITE_API_BASE=http://localhost:4173 npm run dev`

## Convert to Xcode (iOS)

This project is configured for Capacitor so it can be opened in Xcode.

1. Install dependencies:
   `npm install`
2. Build and create the iOS project:
   `npm run ios:init`
3. Open in Xcode:
   `npm run ios:open`

For later web/app changes, re-sync before opening/running:
`npm run ios:sync`
