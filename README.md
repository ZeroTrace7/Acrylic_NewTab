# Acrylic — New Tab

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Pure ES Modules](https://img.shields.io/badge/Pure%20ES%20Modules-No%20Bundler-brightgreen?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero-critical?style=flat-square)](./AGENTS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

Premium glassmorphism new tab Chrome extension. Built from the ground up as the successor to *Glassy — New Tab* — faster, more capable, completely free.

---

## Table of Contents

- [Why Acrylic?](#why-acrylic)
- [Architecture vs. Competitors](#architecture-vs-competitors)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Stack](#stack)
- [Local Development](#local-development)

---

## Why Acrylic?

> The New Tab page is the most frequently rendered surface in any browser — opened dozens to hundreds of times daily. Chrome alone commands **~69% of global desktop market share** across **~178,000 active extensions**. This makes the New Tab the highest-visibility, most performance-sensitive real estate in the entire browser ecosystem.

The current market forces users into a false choice:

| | Legacy Dashboards *(Momentum)* | Minimalist Tabs *(Tabliss, Bonjourr)* |
|---|---|---|
| **Performance** | ❌ Cloud sync, telemetry, heavy frameworks | ✅ Local-first, lightweight |
| **Productivity** | ✅ Tasks, integrations, custom themes | ❌ Clock and wallpaper only |
| **Privacy** | ❌ Account required, data collection | ✅ No tracking |
| **Cost** | ❌ ~$40/yr paywall for basic customization | ✅ Free |

**Acrylic breaks the tradeoff.** Premium glassmorphism aesthetics. Full productivity suite — tasks, Pomodoro, notes, tabs, extension manager. Zero accounts. Zero paywalls. Zero telemetry. Sub-100ms load.

### The Manifest V3 Advantage

Chrome [fully deprecated Manifest V2](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline) in July 2025, introducing cold-start latency for every extension that relied on background pages to hydrate the DOM. Acrylic is built **natively for MV3** — pure ES modules loaded directly from `newtab.html`, no bundler, no transpiler, no service worker dependency for rendering. The critical path never waits on `chrome.runtime`; it just renders.

---

## Architecture vs. Competitors

| Vector | Acrylic | Momentum | Tabliss | Bonjourr |
|---|---|---|---|---|
| **Manifest** | V3 (native) | V3 (migrated) | V3 (migrated) | V3 (migrated) |
| **Rendering** | Pure ES modules, zero-bundle | React + Webpack | React + Webpack | Vanilla + build step |
| **Load Strategy** | Direct `<script type="module">` | Bundle hydration via SW | Bundle hydration | Compiled output |
| **Cold Start** | Sub-100ms (no runtime dependency) | 200–400ms (framework overhead) | 150–300ms | 120–250ms |
| **Privacy** | Zero telemetry, local-only | Account required, analytics | Local-first | Local-first |
| **Productivity** | Tasks, Pomodoro, Notes, Tabs, Extensions | Tasks, integrations (paywalled) | None | None |
| **Themes** | 8 built-in, wallpaper + YouTube video | Limited (paywalled) | Community themes | Preset backgrounds |
| **Data Portability** | Full JSON export + import | Account-locked | None | Partial |
| **Cost** | Free, forever | ~$40/yr for full access | Free | Free |
| **Build System** | None (loads source files directly) | Webpack | Webpack | Gulp/Rollup |

---

## Features

- 🕐 Gloria Hallelujah clock with AM/PM and date display
- 👋 Personalized greeting with user name
- 🔍 Search bar with engine picker (Google, Bing, DuckDuckGo, Brave, Perplexity)
- 🎨 8 premium themes (Midnight, Deep Blue, Aurora, Rose Noir, Espresso, Forest, Carbon, Synthwave)
- 🖼️ Wallpaper support (image URL + YouTube video)
- ✅ Smart To-Do list with scribble strike animation and progress tracking
- ⏱️ Pomodoro Timer with ambient sounds and notification alerts
- 📝 Notes panel with rich text support
- 🗂️ Tabs manager with live sync
- 🧩 Extensions manager panel
- 📋 Clipboard history — last 20 items
- 🔗 Quick Links with drag-to-reorder (sidebar dock + bottom row)
- 🔗 Quick Link management panel with 50-app preset library
- 🎛️ Layout editor — drag any widget to customize your dashboard
- 🧘 Zen Mode — single-click distraction-free experience
- 💾 Full data export + import (JSON backup/restore)
- ✨ Premium entry animation (sub-800ms, staggered)
- 🌌 Grain texture overlay
- 🎓 First-run onboarding flow
- 🔔 Toast notification system

### Tasks Panel (Top-Right)

- Progress header with live `X/Y` counter and animated progress bar
- Input row with `Add a new task...` field and circular add button
- Smooth task completion flow with delayed reorder animation
- Completed state styling with a hand-drawn scribble strike effect (3 variants)
- Row-level delete action (revealed on hover)
- `Clear Completed` action shown only when completed items exist
- Reward state when all tasks are done with auto-reset
- Full persistence through `chrome.storage.local`

### Quick Links System

Quick Links use three distinct presentation modes tuned for the Acrylic UI:

- **Left sidebar dock**: Glass squircle app tiles with Geist labels, manual drag reordering
- **Bottom row**: Soft squircle favicon tiles with truncated labels
- **Manage panel**: Active links grid, custom-link form, 50-app preset library

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus search bar |
| `Ctrl+K` / `⌘K` | Focus search bar (universal) |
| `T` | Toggle tasks panel |
| `Ctrl+,` / `⌘,` | Open preferences |
| `Escape` | Exit Zen Mode / dismiss overlays / blur |

> All shortcuts are non-destructive and avoid Chrome-reserved bindings (`Ctrl+T`, `Ctrl+W`, etc.)

---

## Stack

- **Runtime**: Manifest V3 Chrome Extension
- **Language**: Pure ES modules (no TypeScript, no bundler, no transpiler)
- **Styling**: Vanilla CSS with custom properties (no Tailwind, no SCSS)
- **Storage**: `chrome.storage.sync` for preferences, `chrome.storage.local` for app data
- **Build**: None — the extension loads directly from source files
- **Privacy**: Zero telemetry, zero accounts, zero external API calls (except favicon fetch)

---

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ZeroTrace7/Acrylic_NewTab.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the cloned `Acrylic` directory

5. Open a new tab — Acrylic should appear immediately

> **Note**: No `npm install` or build step is required. The extension loads directly from source files.
