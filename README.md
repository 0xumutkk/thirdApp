<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1J1eiwUUrzuQZfK7e08K0qSm71PKFNKLD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set API keys in [.env.local](.env.local):
   - `VITE_GEMINI_API_KEY` – your Gemini API key
   - `VITE_GOOGLE_MAPS_API_KEY` – your Google Maps/Places API key (for map cafe search). Enable Places API and Maps JavaScript API in Google Cloud Console; restrict the key by HTTP referrer for browser use.
3. Run the app:
   `npm run dev`
