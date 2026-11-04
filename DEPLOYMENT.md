# Decoupled Architecture & Static Deployment Guide

This project is engineered around a **decoupled workflow**:
1. **Local Admin & AI Backend Environment (`server/`):** Manages AI ingestion, Brandfetch API logo fetching, draft staging, inline edits, and persistent JSON database records (`server/data/tools.json`).
2. **Clean Frontend Static Build (`dist/`):** A 100% self-contained, lightning-fast static client bundle that can be deployed to **GitHub Pages**, **Cloudflare Pages**, **Vercel**, **Netlify**, or any static CDN with **custom domain** support.

---

## 🏗️ Project Architecture Overview

```
├── .github/workflows/
│   └── deploy.yml              # Automated GitHub Pages CI/CD deployment
├── public/
│   ├── 404.html                # SPA redirect helper for GitHub Pages / static deep linking
│   ├── CNAME.example           # Custom domain template for GitHub Pages
│   ├── data/
│   │   └── tools.json          # Decoupled static JSON API export
│   └── logos/                  # Permanently downloaded local PNG brand logos
├── scripts/
│   ├── export-static.js        # Compiles published tools from database into static bundle
│   └── set-custom-domain.js    # Sets CNAME for custom domains in 1 command
├── server/                     # Local Admin & AI Backend Environment
│   ├── data/tools.json         # Persistent JSON database (drafts & published tools)
│   ├── aiToolAnalyzer.js       # AI curation engine & Brandfetch logo pipeline
│   ├── apiMiddleware.js        # Vite & Express API routes (/api/*)
│   └── index.js                # Standalone local backend server
├── src/                        # Pure React Frontend Application
│   ├── data/
│   │   ├── publishedTools.js   # Pre-compiled static published dataset
│   │   └── toolsData.js        # Core configuration & category definitions
│   └── components/
│       ├── AdminStagingDashboard.jsx  # Local /admin management & staging panel
│       ├── ToolCard.jsx        # Public directory tool cards
│       ├── ToolBrandLogo.jsx   # Resilient logo renderer (local > CDN > fallback)
│       └── LessonPlanView.jsx  # Onboarding curriculum view
└── package.json
```

---

## ⚡ Workflow 1: Local Admin & Data Management

In your local environment, you have full access to the AI agent, Brandfetch key, and staging dashboard.

### 1. Start the Local Development Environment
```bash
npm run dev
```
- Public Homepage: `http://localhost:3000/`
- Admin Staging Dashboard: `http://localhost:3000/admin`

### 2. Manage Tools in `/admin`
- **Batch Sync 10 Tools:** Click **"AI Batch Sync (Generate 10 Tools)"** to automatically scrape, analyze, and stage 10 popular anti-bloat tools with Brandfetch logos.
- **Manual Tool Entry:** Switch to the **Clean Manual Entry Form** tab to hand-craft entries.
- **Edit Any Field Inline:** Click **"Edit"** on any card to modify Tool Name, Description, Category, Tags, Learning Curve, Tutorial Count, or Affiliate Link.
- **Publish to Live Directory:** Click **"Publish to Live Site 🚀"** to move drafts into the live published dataset.
- **Export Static Data:** Click **"Export Static Bundle"** in the top toolbar to sync your database to the static export files.

---

## 🚀 Workflow 2: Exporting & Building the Static Frontend

Whenever you are ready to publish or update your static site:

### 1. Export Data & Build
```bash
npm run build
```
This automatically runs `scripts/export-static.js` before `vite build`:
- Filters published tools from `server/data/tools.json`
- Generates `src/data/publishedTools.js` and `public/data/tools.json`
- Ensures all downloaded local logos in `public/logos/` are bundled into `dist/logos/`
- Copies `public/404.html` and `public/CNAME` into `dist/`
- Generates a production-ready, zero-dependency static folder in `dist/`

### 2. Preview the Static Build Locally
```bash
npm run preview
```
Visit `http://localhost:4173/` to verify your static production build.

---

## 🌐 Workflow 3: Deploying to Vercel (Recommended)

Our project includes native Vercel configuration (`vercel.json`) with SPA route rewrites configured:

### 1. Connect Repository to Vercel
1. Import `micro-saas-directory` into [Vercel Dashboard](https://vercel.com/new).
2. Framework Preset will automatically detect **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

Every `git push` to your `main` branch (including one-click updates via the Admin **"Publish Live 🚀"** button) will trigger an instant zero-downtime deployment on Vercel with zero GitHub Pages errors.

---

## ☁️ Workflow 4: Deploying to Other Static CDNs (Netlify, Cloudflare Pages)

Because `dist/` is a standard static build, you can deploy to any modern hosting platform in seconds:

### Cloudflare Pages
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### Netlify
- **Build command:** `npm run build`
- **Publish directory:** `dist`

---

## 🛡️ Static Resiliency Guarantee

- **Zero Backend Dependency in Production:** Static builds operate 100% autonomously without requiring Node.js servers, databases, or API keys at runtime.
- **Zero Broken Logos:** `ToolBrandLogo.jsx` resolves logos through a fallback hierarchy:
  1. Permanent local downloaded asset (`/logos/{slug}.png`)
  2. Brandfetch direct CDN link
  3. Public high-res favicon service (`a.favicon.im`)
  4. Dynamic letter-initial SVG badge
- **Zero Interstitial Popups:** Outgoing affiliate buttons directly launch partner links in a new browser tab (`target="_blank"`).
- **SPA Deep Link Preservation:** `public/404.html` prevents 404 errors on GitHub Pages when reloading hash and path routes.
