<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vetta

Vetta is an influencer discovery + deep-audit POC for cross-border creator sourcing. It combines:

- Apify (Instagram scraping / search)
- Gemini (LLM-based strategy + audit report generation)

## Features

- Discovery: generate a strategy matrix from a product image/description, then source creators across multiple query dimensions
- Deep Audit: scrape recent posts, proxy images, and generate a structured audit report (brand fit, consistency, risks, DM draft)
- Image proxy: `/api/image` whitelists Instagram CDN domains and provides a fallback path for higher success rate

## Run locally

**Prerequisites:**  Node.js

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Fill in:

- `VETTA_GEMINI_KEY`: Gemini API key (Google AI Studio)
- `APIFY_API_TOKEN`: Apify API token

Notes:

- `.env` is ignored by git (do not commit secrets).
- You can also use `GEMINI_API_KEY` instead of `VETTA_GEMINI_KEY` (the app reads either).

### 3) Start dev server

```bash
npm run dev
```

Open: http://localhost:3000

## How it works (high level)

- Secure mode (default in dev): the browser never sends API keys/tokens.
  - `/api/apify/*` is forwarded by the dev server to `https://api.apify.com/v2/*` with `Authorization: Bearer <APIFY_API_TOKEN>` injected server-side.
  - `/api/gemini/*` is forwarded by the dev server to `https://generativelanguage.googleapis.com/*` with `?key=<VETTA_GEMINI_KEY>` injected server-side.
- `/api/image` is a local middleware that fetches Instagram CDN images and returns them with proper content-type.

## Known limits

- Apify quota/hard limit: when your monthly usage hits the hard limit, Apify will return `403` with `platform-feature-disabled` / `Monthly usage hard limit exceeded`.
- Instagram CDNs may intermittently return 403/expired URLs; the app will skip failed images.
