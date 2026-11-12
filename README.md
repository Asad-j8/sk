# 🎙️ YouTube Podcast Channel Finder

A free, 100% client-side web application designed for content creators, short-form clipping editors, and researchers to discover, filter, and export YouTube channels that publish genuine podcast-style long-form video content.

Runs entirely in your browser using Vite, React, and Tailwind CSS. Zero backend required. Powered directly by Google's official **YouTube Data API v3** with your own free API key.

---

## ✨ Features

- **Smart Podcast Detection Scoring (0–100)**:
  - ⏱️ **Episode Duration**: Evaluates recent uploads (+35 pts for $\ge 20$ min averages, proportional for 10–20 min).
  - 🏷️ **Channel Keywords**: Detects words like *podcast, episode, interview, conversations, show, talk, live* in channel title & description (+20 pts).
  - 🔢 **Episode Numbering Pattern**: Identifies episode syntax (*Episode #, Ep 124, #42*) in recent video titles (+15 pts).
  - 📅 **Upload Consistency**: Rewards channels that upload at least 2 times in the last 30 days (+15 pts).
  - 📂 **Active Uploads Playlist**: Confirms active media content structure (+10 pts).
  - 🟢 **Score Badges**: Color-coded badges with an interactive breakdown tooltip.
- **Search by Niche or YouTube Handle**:
  - Search any keyword (e.g. *"true crime"*, *"personal finance"*, *"startup founders"*).
  - Or paste a YouTube handle or URL (e.g. `@hubermanlab` or `youtube.com/@lexfridman`) to automatically resolve the channel and discover similar podcasts.
- **Instant Client-Side Filtering**:
  - Subscriber count range with instant presets (1K, 10K, 100K, 1M).
  - Total video count range.
  - Upload recency (Last 7 days, 30 days, 90 days, or any time).
  - Podcast score slider (0–100) and **Podcast-only toggle** ($\ge 60$).
  - Country filter.
  - Option to hide channels with hidden subscriber counts.
- **Dual View Modes**:
  - **Responsive Card Grid**: Visual cards with thumbnails, metrics, episode length, and score breakdown.
  - **Compact Table View**: High-density table designed for clip editors and outreach teams scanning dozens of channels quickly.
- **Sorting Options**:
  - By Podcast Score (highest first)
  - By Subscribers (highest first)
  - By Average Views (last 10 uploads)
  - By Last Upload Date (newest first)
  - Alphabetical (A → Z)
- **Favorites & Outreach Notes**:
  - Star channels to save them into your local favorites list.
  - Add free-text notes for guest outreach, pitch ideas, or video editor assignments.
- **Excel-Ready UTF-8 CSV Export**:
  - Exports filtered channels or saved favorites with UTF-8 BOM encoding for seamless Microsoft Excel and Google Sheets compatibility.
- **Quota Efficiency & Protection**:
  - Tracks daily YouTube API units used against Google's free 10,000 unit limit.
  - Automatic quota reset at **midnight Pacific Time (PT)**.
  - 24-hour search cache in `localStorage` so repeat searches consume **0 units**.
  - Interactive "Demo Mode" to test the UI without consuming any quota.
- **Modern UI**:
  - Dark mode and light mode toggle.
  - Mobile-responsive layout with collapsible slide-over filter drawer.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) and **pnpm** installed on your machine:

```bash
node -v
pnpm -v
```

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd youtube-podcast-channel-finder
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

3. Start the local development server:
   ```bash
   pnpm dev
   ```

4. Open your browser at the displayed local URL (default: `http://localhost:5173`).

---

## 🔑 Obtaining a Free YouTube Data API v3 Key

Google Cloud provides **10,000 free quota units every day** for personal API keys:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** (or Create a new project, e.g. *"PodcastFinder"*).
3. In the left navigation menu, go to **APIs & Services &gt; Library**.
4. Search for **YouTube Data API v3** and click **Enable**.
5. Go to **APIs & Services &gt; Credentials**.
6. Click **Create Credentials &gt; API key**.
7. Copy your generated key (`AIzaSy...`).
8. In the app, click the **Key icon (Settings)** in the navbar, paste your key, and click **Save Key**. You can click **Test Key** to verify it.

*(Your API key is saved exclusively in your browser's `localStorage` and is never sent to any external server.)*

---

## 📊 Understanding YouTube API Quota Usage

Google allocates 10,000 units per day per project. Our application utilizes an optimized batch flow:

| Endpoint | Purpose | Quota Cost |
| :--- | :--- | :--- |
| `search.list` | Find up to 50 channel IDs for the niche | **100 units** |
| `channels.list` | Fetch stats & snippet for all 50 channels in 1 batch | **1 unit** |
| `playlistItems.list` | Fetch recent uploads playlist items | **1 unit per channel** |
| `videos.list` | Hydrate video durations & view counts in batches of 50 | **1 unit per batch** |

- **Repeat searches within 24 hours cost 0 units** thanks to automatic `localStorage` caching.
- Quotas reset daily at **midnight Pacific Time (PT)**. The top navbar counter displays your estimated usage and updates live.

---

## 🌐 Deploying for Free

This project is 100% static and can be deployed for free in seconds on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

### Deploy to Vercel

1. Push your repository to GitHub or GitLab.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. Framework Preset: **Vite**.
5. Build command: `pnpm build`
6. Output directory: `dist`
7. Click **Deploy**.

### Deploy to Netlify

1. Go to [Netlify](https://netlify.com/) and click **Add new site &gt; Import an existing project**.
2. Connect your Git repository.
3. Build command: `pnpm build`
4. Publish directory: `dist`
5. Click **Deploy Site**.

---

## 📁 Project Structure

```
├── index.html                 # App HTML with fonts & meta tags
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind styling with dark mode
├── vite.config.js             # Vite configuration
├── src/
│   ├── main.jsx               # Application entry point
│   ├── index.css              # Global styles & Tailwind layers
│   ├── App.jsx                # Main application state & routing
│   ├── api/
│   │   └── youtube.js         # YouTube API client, quota tracker, cache & scoring
│   └── components/
│       ├── ApiKeySettings.jsx # Modal to configure and test YouTube API key
│       ├── ChannelCard.jsx    # Card grid item with podcast score breakdown
│       ├── ExportButtons.jsx  # CSV export utility with UTF-8 BOM
│       ├── FavoritesPanel.jsx # Starred channels list with outreach notes
│       ├── FilterPanel.jsx    # Client-side filtering controls
│       ├── Icons.jsx          # Self-contained SVG icon library
│       ├── Navbar.jsx         # App navigation, theme toggle, quota counter
│       ├── OnboardingModal.jsx# First-visit step-by-step walkthrough
│       ├── QuotaCounter.jsx   # Live quota usage tracker with midnight PT reset
│       ├── ResultsGrid.jsx    # Grid view, sort controls, and load more
│       ├── ResultsTable.jsx   # High-density compact table view
│       └── SearchBar.jsx      # Search box with handle & niche resolution
└── README.md                  # Documentation and deployment instructions
```

---

## 📄 License

MIT License. Free for personal, commercial, and open-source use.
