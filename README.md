# CurateLess — Anti-Bloat Micro-Tools & Software Directory

A modern, distraction-free web directory application curated for lightweight, focused "anti-bloat" micro-tools designed to replace bloated software giants (Jira, Loom, Bitly, Notion, Microsoft Word, Figma, Adobe Premiere, etc.).

---

## 🌟 Key Features

### 1. Dynamic Grid / Card Layout & Automated Logo Pipeline
- **Automated Backend Logo Downloader:** Built-in backend server utility (`server/logoService.js` and `server/apiMiddleware.js`). When a tool's website URL is provided:
  1. The backend automatically queries public logo/favicon sources (`a.favicon.im`, `Google S2`, `Clearbit`).
  2. Downloads the binary image directly to server storage (`public/logos/{slug}.png`).
  3. Updates the tool's database record (`server/data/tools.json`) with the persistent local file path (`localLogoPath: "/logos/{slug}.png"`).
  4. Guarantees 100% locally-hosted logos with **zero broken links** and zero external runtime dependencies.
- **Comprehensive Tool Cards:** Each card displays:
  - Tool Name & Locally-Hosted Brand Logo Icon
  - **Clean 2-Line Truncation:** Descriptions and "What It Replaces" anti-bloat rationale are cleanly truncated to 2 lines with an ellipsis (`line-clamp-2 text-ellipsis`).
  - **Interactive Hover Card / Popover:** Hovering over the brand logo, card header, or description triggers a smooth elevated popover ([`ToolHoverCard.jsx`](file:///c:/Users/apox8/OneDrive/Desktop/Antigravity/SEo/src/components/ToolHoverCard.jsx)) displaying the complete, unabridged description, full anti-bloat breakdown, target audience, learning curve meter, tutorial guide counts, and full tag badges.
  - Prominent **"What It Replaces"** badge with detailed anti-bloat rationale
  - **Target Audience** specification
  - Performance & bloat reduction metrics
- **Multi-Category Filtering:** Real-time filtering across `All`, `Organization`, `Video`, `Utilities`, `Writing`, and `Design` with dynamic badge counters.
- **Flexible Sorting:** Sort by *Newest Tools First*, *Learning Curve: Gentlest First*, *Most Tutorials / Guides*, and *Name (A–Z)*.
- **Instant Search:** Fuzzy search by tool name, what it replaces, target audience, description, or tags.

### 2. Admin Staging & AI Backend Pipeline (Exclusively at `/admin`)
- **Route Isolation:** The Admin Staging Dashboard is accessible exclusively by navigating to `/admin` (e.g. `http://localhost:3000/admin`). It is completely hidden from public users and excluded from all public homepage navigation links.
- **Full Edit & Management Capabilities for Every Tool Record:**
  - **Inline Edit Mode on Every Tool Card:** An **"Edit"** button on each card opens an inline form allowing immediate modification of all fields:
    - **Tool Name**
    - **Description / Tagline**
    - **Category** (`Organization`, `Video`, `Utilities`, `Writing`, `Design`)
    - **Tags** (customizable comma-separated system)
    - **Visual Learning Curve** (Gentle, Low, Moderate, Steep & time estimate)
    - **Tutorial Count** (automatically recalculates guide breakdowns)
    - **Personal Affiliate / Referral Link**
    - **"What It Replaces"** & Detailed Anti-Bloat Rationale
    - **Target Audience**
  - **Instant Live Public Directory Updates:** Saving changes via `PUT /api/admin/tools/:id` updates `server/data/tools.json` and instantly reflects across the public homepage directory in real-time.
  - **Clear 'Delete' & 'Remove' Actions:**
    - Every draft and live tool features a prominent **"Delete"** / **"Delete Draft"** button (`DELETE /api/admin/tools/:id`).
    - Dedicated **"Clear All Drafts"** bulk action button to purge unwanted draft items from staging in a single click (`POST /api/admin/drafts/clear-all`).
  - **Multi-View Filter Switcher:** Seamlessly switch between **Drafts Queue**, **Live Published Tools**, and **All Records** with live badge counters.
- **AI Batch Sync (Curated 10-Tool Generator):**
  - Clicking the **"AI Batch Sync (Generate 10 Tools)"** button in the top toolbar automatically triggers an agentic pipeline (`POST /api/admin/sync-batch-ai`).
  - Synthesizes a curated batch of 10 distinct, popular anti-bloat micro-tools (*Zed Editor*, *Excalidraw*, *Ghost*, *Cal.com*, *Hoppscotch*, *Baserow*, *Plausible Analytics*, *Kitemaker*, *Snipd*, *Standard Notes*).
  - Automatically fetches their official **Brandfetch logo links**, AI descriptions, categories, tags (`Beginner-Friendly`, `Free Tier Available`, `Alternative to [Competitor]`, etc.), learning curve ratings, tutorial counts, and onboarding lesson plans.
  - Automatically downloads and permanently caches high-res logos to server storage (`public/logos/{slug}.png`).
- **Clean Manual Entry Form Alongside Queue:**
  - A clean tabbed manual entry interface allows administrators to craft or adjust tool entries by hand.
  - Fields for Tool Name, Website URL, Category, What It Replaces, Detailed Anti-Bloat Rationale, Target Audience, Learning Curve Difficulty & Time, Tags, and Personal Affiliate Link.
  - Supports staging directly as a Draft or one-click direct publishing to the public live directory.

### 3. Advanced Tag System
- **Customizable Badges:** Cards feature distinct, color-coded interactive badges:
  - `Beginner-Friendly`
  - `Free Tier Available`
  - `Alternative to [Tool Name]` (e.g., *Alternative to Notion*, *Alternative to Jira*, *Alternative to Loom*, *Alternative to Bitly*, *Alternative to Figma*, *Alternative to MS Word*)
  - `Open Source`, `Sub-50ms Sync`, `Local-First`
- **Click-to-Filter:** Clicking any badge instantly filters the entire directory by that tag, with a dedicated filter chip and one-click clear button.

### 3. Visual Learning Curve Indicator
- **Segmented Meter & Badge:** 4-segment visual battery / gauge indicator displaying the curve difficulty:
  - `Gentle` (Score 1/4, emerald green) — Intuitive in minutes, zero setup fatigue
  - `Low` (Score 2/4, sky blue) — Short 10-minute curve with instant payoff
  - `Moderate` (Score 3/4, amber) — Power-user features with quick mental model shift
  - `Steep` (Score 4/4, rose) — High mastery curve with massive long-term velocity
- **Time-to-Learn:** Clean indicator (e.g., `~5 mins`, `~10 mins`).
- **Interactive Tooltip:** Hover or click to reveal an explanation of the tool's learning curve.

### 4. Tutorial Counter Metadata
- **Resource Indicator:** Clean badge showing verified guides (e.g., `🎓 18 Guides`).
- **Interactive Breakdown Popover:** Inspect counts for video walkthroughs, step-by-step documentation, and community cheatsheets.

### 5. Dedicated Lesson Plan Route & Page
- **Clean URL Structure:** Deep-linking via bookmarkable and shareable hash routes (e.g., `#/lesson-plan/linear`, `#/lesson-plan/cap`, `#/lesson-plan/obsidian`).
- **Step-by-Step Structured Curriculum:**
  - Onboarding summary, prerequisites, and estimated completion time.
  - Interactive **Checklist & Progress Tracker** with persistent localStorage progress bar (`X of Y steps completed - Z%`).
  - Step number, title, time estimate, description, action items checklist, and highlighted **"Anti-Bloat Pro-Tip"** callouts.
  - One-click **Markdown Export** to download the lesson plan as a local checklist.
  - **"Add Custom Step"** modal to append user-defined or team-specific onboarding actions.

### 6. Seamless Affiliate Link Integration (Zero Popups)
- **Direct New-Tab Navigation (`target="_blank"`):** Clicking the primary action button (`Try [Tool Name] ↗`) or the action button inside the full hover card instantly launches the tool's stored custom affiliate/referral link in a brand new browser tab (`target="_blank"`, `rel="noopener noreferrer"`).
- **Zero Interstitial Popups:** Completely eliminates intermediate modal popups or interstitial confirmation dialogs, ensuring instant frictionless handoff directly to your affiliate partner URL.
- **Disabled Raw Direct Tool Links:** Removed any raw, unmonetized direct links from the brand logo hover cards and card displays, displaying clean non-clickable verification badges instead.
- **100% Database Mapping:** Every tool in the persistent database (`server/data/tools.json`) and frontend dataset is strictly mapped to a stored custom affiliate link field (`affiliateUrl`).

### 7. Decoupled Workflow & Static Export
- **Local Admin/Backend Environment (`server/`):** Manages tool drafts, AI metadata analysis, Brandfetch logo fetching, and local database storage (`server/data/tools.json`) at `/admin`.
- **Zero-Dependency Static Client Build (`dist/`):** A 100% self-contained frontend bundle that can be deployed to **GitHub Pages**, **Cloudflare Pages**, **Vercel**, or **Netlify** with a **custom domain**.
- **Automated Pre-Build Data Sync:** Running `npm run build` executes `scripts/export-static.js` to compile all published tools into `src/data/publishedTools.js` and `public/data/tools.json`.
- **GitHub Actions Ready:** Automated CI/CD deployment configured in `.github/workflows/deploy.yml`.
- Complete instructions are documented in [DEPLOYMENT.md](file:///c:/Users/apox8/OneDrive/Desktop/Antigravity/SEo/DEPLOYMENT.md).

### 8. Additional Minimalist Features
- **Anti-Bloat Manifesto:** Expandable philosophy modal detailing our 5 criteria (Sub-100ms response, Single superpower, Data sovereignty, Zero distraction, Honest pricing).
- **Dark & Light Mode:** System-aware theme toggle with persistent preferences.
- **Suggest a Tool:** Community submission modal to suggest new micro-tools.

---

## 🛠️ Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Scandinavian minimalist monochrome with subtle warm/cool accents)
- **Icons:** Lucide React
- **Typography:** Inter & JetBrains Mono (via Google Fonts)

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server (includes integrated backend logo utility API)
npm run dev
# -> Runs at http://localhost:3000

# Download and sync all logos to local storage
npm run sync-logos

# Optional: Run standalone backend server
npm run server
# -> Runs at http://localhost:3001

# Build for production (automatically bundles all local logo assets)
npm run build
```

---

## 📡 Backend Logo & Admin AI Pipeline Endpoints

### 🤖 Admin Staging & AI Pipeline
- **`POST /api/admin/ai-generate-tool`**: AI agent analyzes input tool name or URL, synthesizes anti-bloat metadata, downloads official logo, and creates a record in `status: 'draft'`.
- **`GET /api/admin/drafts`**: Returns all tools currently in the draft queue.
- **`PUT /api/admin/drafts/:id`**: Updates draft tool metadata (e.g. personal affiliate link).
- **`POST /api/admin/drafts/:id/publish`**: Moves tool from draft queue to the live public directory.
- **`DELETE /api/admin/drafts/:id`**: Discards a draft tool.

### 🔐 Secure Brandfetch Integration (Zero Key Exposure)
- **`GET /api/brandfetch/status`**: Checks whether `BRANDFETCH_API_KEY` is configured on the server without leaking the key.
- **`POST /api/brandfetch/logo`** or **`GET /api/brandfetch/logo?domain=linear.app`**:
  - Securely queries `https://api.brandfetch.io/v2/brands/{domain}` on the server side with `Authorization: Bearer ${BRANDFETCH_API_KEY}`.
  - Returns official high-res logo and icon asset URLs, official brand colors, and description.
  - **Security Guarantee:** The `BRANDFETCH_API_KEY` is never included in the response payload or frontend bundles.
- **`GET /api/brandfetch/asset?domain=linear.app`**:
  - Proxies and streams the official brand image directly to the client with HTTP caching (`Cache-Control: public, max-age=86400`).

### 📦 Local Storage & Logo Pipeline
- **`POST /api/tools/fetch-logo`**: Downloads official logo from domain to `public/logos/`.
  ```json
  // Request
  { "website": "https://zed.dev", "slug": "zed", "name": "Zed Editor" }
  // Response
  {
    "success": true,
    "localLogoPath": "/logos/zed.png",
    "domain": "zed.dev",
    "sizeBytes": 2546
  }
  ```
- **`POST /api/tools`**: Creates tool record and auto-downloads its logo.
- **`GET /api/tools`**: Retrieves all stored tools with their `localLogoPath`.
- **`POST /api/tools/sync-all-logos`**: Batch re-downloads all tool logos to local storage.
