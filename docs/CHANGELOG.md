# Changelog

All notable changes to **Acrylic — New Tab** are documented in this file.

This changelog is the **permanent source of truth** for version history. For every Chrome Web Store release, a new section is prepended here. Older versions are never removed.

Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## v1.1.1 — 2026-05-29

*Focus: Premium micro-interactions, cinematic UI polish, and timer reliability.*

### Added
- **Search Bar Identity** — Default web search icon upgraded to a polished, recognizable design for a more premium search bar appearance.
- **AI Destination Picker** — Engine picker button now features a glass border and interactive hover/active states, making the AI destinations (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek) clearly visible as interactive options.
- **Custom Glassmorphism Tooltips** — Replaced native browser `title` tooltips with a custom glassmorphism tooltip system using event delegation for zero-flicker pointer mechanics. Sidebar dock tooltips delayed 600ms on hover, suppressed during drag or when panel is open. Preset library tooltips use accelerated 300ms delay.
- **Update Notification Engine** — New `modules/update-banner.js` module. Glassmorphic "What's New" banner appears once after each extension update. Waits 2400ms post-boot to avoid fighting the curtain/entry animation. Dismiss with buttery 600ms blur melt-away.
- **Animated Tile Removal (FLIP)** — Deleting a Quick Link now triggers a hardware-accelerated FLIP exit animation (blur + scale out) rather than instantly disappearing.
- **Micro-Interaction Upgrades** — 1.56 spring-overshoot pop-in for remove badges, box-shadow pulses on input focus, press-state scale transformations for buttons.
- **`icons/google-classic.svg`** — New multicolor Google "G" vector icon asset.

### Changed
- **Quick Links Manage Panel Animation** — Entrance upgraded from `0.6s` to `1s cubic-bezier(0.16, 1, 0.3, 1)` with mid-animation blur dissolve (`filter: blur(3px) → blur(0)`). Stagger tiers widened from `0–370ms` to `120–680ms`. Internal section slide distance increased from `10px` to `14px`.
- **Long Break Duration** — Changed from 60 minutes to 30 minutes in both `background.js` (`MODE_DURATION`) and `panels/pomodoro.js` (`MODES`).
- **Quick Links Module** — Major logic refinements (+243 lines): enhanced FLIP exit animations, improved mono-icon rendering, Quick Add library behavior improvements.
- **Component Styles** — Refined CSS in `css/components.css` (+68 lines) and `css/panels.css` (+58 lines).

### Fixed
- **Pomodoro Offscreen Audio Race Condition** — Wrapped offscreen document creation in an async IIFE with `try/finally` so `creatingOffscreen` is always cleared, even if `chrome.offscreen.createDocument()` rejects. Concurrent callers now await the full creation + 150ms warm-up delay instead of skipping it.
- **Tooltip Ghost Bug** — Resolved the native "Drag Dock to reposition" tooltip appearing when edit layout mode was not active.

### Architecture
- `readfirst.md` §6 updated: panel timing contract changed from `0.6s` to `1s`.
- `readfirst.md` §8 updated: glassmorphism tooltip behavior documented for all three Quick Links surfaces.

---

## v1.0.1 — 2026-05-01

*Focus: Boot sequence lockdown, premium OLED reveal, and production hardening.*

### Added
- **Pure CSS Boot Curtain** — Replaced the buggy JS-based background fade with a bulletproof, GPU-accelerated `::after` pseudo-element (`.fade-in-from-black`). Hardcoded in HTML, `@keyframes fade-out-cover`, `1s` duration, `200ms` delay, Material standard easing. `prefers-reduced-motion` disables animation and sets `opacity: 0 !important`.
- **180ms Intentional JS Delay** — `newtab.js → initApp()` Step 0: `await new Promise(resolve => setTimeout(resolve, 180))`. Ensures the GPU has composited the black overlay before JS starts mutating the DOM.
- **1.86s Cinematic Foreground Stagger** — Clock → Greeting → Search → Sidebar emerge through the dissolving curtain via `acrylic-loaded` class cascade.
- **Architecture Documentation Lockdown** — `readfirst.md`, `AGENTS.md`, and `Improvements.md` updated with exact timing rules and explicit prohibitions against JS-based boot curtain management.

### Changed
- **Default Theme** — Set to `carbon` so the `#000` curtain melts seamlessly into a `#000` background for flawless OLED aesthetic.
- **Background Layer Rendering** — Background elements (`#bg-layer`, `#bg-overlay`, `#bg-grain`) made visible immediately (opacity 1). `anim-bg` and animated fade/bloom removed from background layers.

### Fixed
- **YouTube Embed Handshake** — Added `enablejsapi: '1'` parameter to resolve Error 153 and cinematic curtain playback issues (`2d8ae2e`).
- **Search Auto-Focus Removed** — Eliminated the aggressive auto-focus that was popping up the typing cursor on every new tab load (`3409ed2`).
- **Wallpaper Sync & Theme Transitions** — Resolved wallpaper ghost crossfading and theme switching inconsistencies.

### Deprecated
- `clearThemeRevealHold()` / `holdThemeReveal()` — Now no-op compatibility stubs in `modules/background.js`. The old JS-based hold/clear boot reveal system is permanently retired.

### Security
- Production `.zip` audited and packaged for Chrome Web Store submission.

---

## v1.0.0 — 2026-04-19

*Initial Chrome Web Store release.*

### Core Architecture
- **Manifest V3 Native** — Pure ES modules, no bundler, no transpiler, no service worker dependency for rendering. Critical render path never waits on `chrome.runtime`.
- **Zero Build System** — Extension loads directly from source files. No npm, Webpack, Vite, or any build step.
- **Privacy Sovereignty** — Zero telemetry, zero accounts, zero analytics, zero external API calls (except favicon fetch). All data stored locally via `chrome.storage.sync` (preferences) and `chrome.storage.local` (app data).

### Features
- **Productivity Suite (Quick Tools Panel)**
  - ✅ Smart Tasks — Scribble strike animations (3 pattern variants), progress tracking, reward states, incremental DOM rendering.
  - ⏱️ Pomodoro Timer — 25/5/60 min modes, ambient sounds (rain, cafe, fireplace), offscreen audio via `chrome.offscreen`, desktop notifications, daily session counter.
  - 📝 Notes — Persistent draft saving, rich text, context menu "Save to Acrylic Notes".
  - 🗂️ Tabs Manager — Live DOM-synced open tab management via optional `tabs` permission.
  - 🧩 Extensions Manager — Full `chrome.management` interface for toggling extensions.
  - 📋 Clipboard Manager — Caches last 20 copied items.
- **Quick Links System** — Three visual modes:
  - Left sidebar dock: glass squircle tiles, monochrome SVG icons, manual mouse drag reordering, Geist labels.
  - Bottom row: soft squircle favicon tiles, full-color icons inside glass shell.
  - Manage panel: active links grid, custom URL/name form, 50-app SVG preset library (`MONO_ICONS`), `evenodd` vector clipping.
- **8 Premium Themes** — Carbon, Deep Blue, Aurora, Espresso, Rose Noir, Synthwave, Midnight, Slate. Applied via `#app-body.theme-*` selectors.
- **Dynamic Backgrounds** — Custom wallpaper URLs, YouTube video ambient wallpapers (via `youtube-nocookie.com` iframe), wallpaper ghost crossfading.
- **Dynamic Background Brightness Adaptation** — Canvas-based BT.709 luminosity sampling auto-flips text/UI colors on bright wallpapers.
- **Zen Mode** — Single-click distraction-free mode with pure `#000` background and retro-mechanical flip clock.
- **Search & AI Bar** — Default web search via Chrome Search API (respects user's browser default), plus AI destinations: ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek.
- **Glassmorphism Architecture** — `rgba(255,255,255,0.04)` fill, `backdrop-filter: blur(16px)`, `1px solid rgba(255,255,255,0.08)` borders, grain texture overlay (`--bg-grain-opacity: 0.035`).
- **Keyboard Shortcuts** — `/` (focus search), `Ctrl+K` / `⌘K` (focus search), `T` (toggle tasks), `Ctrl+,` / `⌘,` (preferences), `Escape` (exit/blur).
- **Data Portability** — Full JSON Export/Import via Preferences panel.
- **Onboarding Flow** — First-run welcome card with search and AI destination selection.

### Accessibility
- WCAG `:focus-visible` glass-themed focus rings.
- `prefers-reduced-transparency` — Solid opaque panels.
- `prefers-reduced-motion` — Disables all entry animations, boot overlay instant.

### Internationalization (Tier 1)
- Declarative `_locales/en/messages.json` with `default_locale: "en"`.
- Locale-aware dates via `undefined` locale (browser-native formatting).
- 10-language greeting lookup table (en, es, fr, de, pt, ja, zh, ko, ar, hi).
- CSS logical properties (`margin-inline-start`, `text-align: start`) for RTL support.
- RTL shadow inversion via `--shadow-x-sm` / `--shadow-x-lg` CSS variables.

### Compliance
- GPLv3 license headers applied to all source files.
- `PRIVACY_POLICY.md` — 12-section privacy policy with per-permission justification.
- `tabs` moved to `optional_permissions` to eliminate "Read your browsing history" install warning.
- Web search uses `chrome.search.query()` via the `search` permission to respect the user's default browser search provider. AI destinations navigate directly to their respective URLs.

---

*For the latest highlights, see the [README](README.md). For the future roadmap, see [Improvements.md](Improvements.md) (local-only).*
