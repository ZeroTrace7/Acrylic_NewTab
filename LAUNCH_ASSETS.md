# Acrylic v1.1.3 Launch Assets

## Show HN Post

**Title:** Show HN: Acrylic — A native MV3, zero-telemetry glassmorphism new tab

**Body:**

I've been building Acrylic for the past two years as a response to a frustrating market failure: the new tab page — opened dozens of times daily across billions of browser sessions — has been carved up between bloated feature dashboards (Momentum: $40/yr paywall + cloud sync + analytics) and minimalist-only alternatives (Tabliss, Bonjourr: zero productivity).

Acrylic breaks the tradeoff. **Native Manifest V3 architecture** means:

- **Sub-100ms load**: No bundler, no transpiler, no React hydration. Pure ES modules loaded straight from `<script type="module">` in newtab.html. Critical rendering path never waits on chrome.runtime.
- **Zero-telemetry by design**: 100% local storage. No accounts. No CDN calls except favicon fetches. Every setting lives in chrome.storage.sync (encrypted, user-owned).
- **Full productivity suite**: Tasks (with strike-through animations), Pomodoro (30-min long breaks, 100% reliable audio), Notes (web clipper via right-click), Tab Manager, Extensions Manager, Clipboard history.
- **Hardware-accelerated cinematics**: Custom cubic-bezier(0.16, 1, 0.3, 1) motion curves, FLIP animations for tile removal, spring-pop badges. All CSS will-change. No frame drops.
- **Glassmorphism + brightness adaptation**: 8 premium themes, YouTube video wallpapers (with declarativeNetRequest referer masking), and automatic luminosity sampling to flip text colors on bright backgrounds for legibility.

**What makes it technically distinct:**

Manifest V2 extensions died in July 2025. Every competitor (Momentum, Tabliss, Bonjourr) migrated V2→V3 by bundling. They load React/Webpack/Rollup bundles and hydrate the DOM via service worker postMessage. Cold start: 200–400ms.

Acrylic was **built natively for MV3 from day one**. Zero build step. No node_modules. The exact code in this repo runs in your browser — no obfuscation, no transpilation. Security researchers and paranoid users can verify every byte.

**Launch status:**
- ✅ Chrome Web Store (live, ~500 installs/week)
- ✅ Firefox Add-ons (v1.1.3)
- ✅ Brave/Edge (manifest compatibility)

**Stack**: Vanilla HTML, CSS variables, native ES modules. No Tailwind, no TypeScript, no build step.

**Source**: https://github.com/ZeroTrace7/Acrylic_NewTab (GPLv3)

**Links**: 
- Chrome: https://chromewebstore.google.com/detail/acrylic-new-tab/cfoafjghblbnolmmkglboeddfpohjihi
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/acrylic-new-tab/

---

## Reddit Post: r/productivity

**Title:** Acrylic — A Glassmorphism New Tab with Pomodoro, Tasks, Notes, and Zero Tracking (Now on Firefox + Chrome)

**Body:**

After two years of development, **Acrylic v1.1.3** is now available on both Chrome and Firefox Add-ons.

It's a replacement for your new tab page that combines **premium aesthetics** with a **full productivity suite**:

**Features:**
- ⏱️ **Pomodoro Timer**: 25min focus, 5min short break, 30min long break with auto-rotating cycles. Ambient chimes. 100% reliable.
- ✅ **Smart Tasks**: Drag-to-reorder, strike-through animations, progress tracking, completion rewards.
- 📝 **Notes + Web Clipper**: Persistent local storage. Right-click any text on the web and save it to your notes.
- 🗂️ **Tab Manager**: Live sync of open tabs, saved tab groups (optional permission).
- 🧩 **Extensions Manager**: Full chrome.management interface for toggling extensions without leaving your new tab.
- 📋 **Clipboard History**: Last 20 copied items, always accessible.
- 🎨 **8 Premium Themes**: Midnight, Deep Blue, Aurora, Rose Noir, Espresso, Forest, Carbon, Synthwave.
- 🎥 **YouTube Wallpapers**: Drop a YouTube URL or image link. Automatic brightness detection flips text colors for legibility.
- ⌨️ **Keyboard Shortcuts**: `/` or `Ctrl+K` → search, `T` → tasks, `Ctrl+,` → preferences, `Escape` → zen mode.

**Why it's different:**
- **Sub-100ms load**: No React, no Webpack. Native ES modules. Your new tab renders instantly.
- **Zero telemetry**: Everything is local. No accounts, no cloud sync, no analytics. Install warnings are minimal.
- **Glassmorphism UI**: Hardware-accelerated animations, custom scrollbars, cinematic transitions. Pixel-perfect on all screens.
- **Responsive**: Optimized for laptops and ultrawide displays. New media queries for small-height displays (v1.1.3).

**Install:**
- 🔗 [Chrome Web Store](https://chromewebstore.google.com/detail/acrylic-new-tab/cfoafjghblbnolmmkglboeddfpohjihi)
- 🔗 [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/acrylic-new-tab/)
- 🔗 [GitHub (Manual Install)](https://github.com/ZeroTrace7/Acrylic_NewTab)

It's free, forever, with zero paywalls. GPL-3 licensed. The code you see is the code that runs.

---

## Reddit Post: r/unixporn

**Title:** [OC] Acrylic — Glassmorphism New Tab, Pomodoro, Tasks, Notes. Zero Telemetry. Now on Firefox.

**Body:**

Submitted a few weeks back to r/productivity. Now shipping **v1.1.3** with Firefox support, hardware layout protection, and full multi-platform availability.

**Acrylic** is a pixel-perfect glassmorphism replacement for your new tab page. Built natively for Manifest V3 (zero bundler overhead). Everything is local. No telemetry. No paywalls.

**Visual highlights:**
- 8 premium themes (Midnight, Deep Blue, Aurora, Rose Noir, Espresso, Forest, Carbon, Synthwave)
- Custom webkit scrollbars with low-opacity glassmorphism treatment
- Cinematic FLIP animations for tile removal
- Hardware-accelerated spring-pop badges and micro-interactions
- Automatic brightness adaptation (flips text colors on bright wallpapers)
- YouTube video wallpapers with declarativeNetRequest referer masking
- Zen Mode (full black, retro flip clock)

**Productivity suite:**
- Pomodoro timer (25/5/30 with chimes)
- Drag-to-reorder tasks with progress tracking
- Notes with web clipper (right-click → save)
- Tab manager (synced with open browser tabs)
- Extensions manager (full chrome.management API)
- Clipboard history (last 20 items)

**Tech stack (the appeal):**
- Pure ES modules (no build step, no transpiler)
- Vanilla CSS with custom properties (no Tailwind)
- Manifest V3 (native, not migrated from V2)
- ~285 lines of service worker
- Zero external dependencies
- Zero telemetry
- Sub-100ms load

**Install:**
- Chrome: https://chromewebstore.google.com/detail/acrylic-new-tab/cfoafjghblbnolmmkglboeddfpohjihi
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/acrylic-new-tab/
- Manual: https://github.com/ZeroTrace7/Acrylic_NewTab

GPL-3 licensed. Fork away. Build your own version.

**Gallery & Details:** https://github.com/ZeroTrace7/Acrylic_NewTab

---

## Talking Points for Promotion

### For Product Hunt (if submitted)
- "Manifest V3 native (not migrated) — sub-100ms load, zero framework overhead"
- "8 premium themes + glassmorphism aesthetics + Pomodoro + Tasks + Notes"
- "Zero telemetry, zero paywalls, zero accounts"
- "Firefox + Chrome + Edge + Brave support"

### For Twitter/X
- "Acrylic v1.1.3 ships on Firefox today. Native MV3, zero telemetry, 8 themes, Pomodoro + Tasks + Notes. Sub-100ms load. No paywalls. Pure ES modules. https://addons.mozilla.org/en-US/firefox/addon/acrylic-new-tab/"
- "Built natively for Manifest V3. No Webpack. No React. No build step. Just browserified HTML+CSS+JS. 285 lines of service worker. https://github.com/ZeroTrace7/Acrylic_NewTab"

### For Hacker News
- "Show HN: Acrylic — Native MV3 glassmorphism new tab. Zero telemetry, sub-100ms load, full productivity suite (Tasks, Pomodoro, Notes). Now on Firefox."
- "Built with zero bundlers. Pure ES modules. 500 installs/week on Chrome. Seeking feedback from the HN community."


