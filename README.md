# Acrylic — New Tab

Premium glassmorphism new tab Chrome extension. Built from the ground up as the successor to *Glassy — New Tab* — faster, more capable, completely free.

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

## What Acrylic Includes

- Gloria Hallelujah clock with AM/PM
- Date display
- Greeting with user name
- Search bar with engine picker (Google, Bing, DuckDuckGo, Brave, Perplexity)
- Left sidebar dock with glass pill container
- Left dock app reordering with smooth drag-and-drop
- Bottom quick links row with labels
- Bottom-left focus button
- Bottom-right Preferances + grid buttons
- Premium entry animation (sub-800ms, staggered)
- Multiple themes (midnight, deep-blue, aurora, rose-noir, jet, espresso, slate, forest)
- Pomodoro, Notes, Tabs, Extensions panels
- Wallpaper support
- Grain texture overlay
- Onboarding flow
- Toast notifications

## Tasks Button (Top-Right)

The top-right Tasks button opens a premium floating glass to-do panel designed for fast capture and progress tracking.

- Progress header with live `X/Y` counter and animated progress bar
- Input row with `Add a new task...` field and circular add button
- Smooth task completion flow with delayed reorder animation for better readability
- Completed state styling with a hand-drawn scribble strike effect (3 variants that cycle)
- Row-level delete action (revealed on hover)
- `Clear Completed` action shown only when completed items exist
- Reward state when all tasks are done: celebratory card with auto-reset after a short delay
- Full persistence through `chrome.storage.local` (`Store.getTasks` / `Store.setTasks`)

## Quick Links Management (Middle-Left `...`)

The Manage Quick Links panel is a compact glass popover for editing the left dock and adding app links quickly.

- Opens from the middle-left dock `...` button
- Panel opens to the right of the sidebar and is vertically centered in the viewport
- Panel uses a premium scale-and-glide open animation (`premiumPanelOpen`, `0.4s cubic-bezier(0.16, 1, 0.3, 1)`)
- Active links render in a 4-column management grid with small corner remove badges
- Divider cleanly separates current links from the add flow
- Add New Link section includes URL field and Name field with leading icons
- Quick Add library provides a dense preset grid of 50 monochrome app icons
- Add Link button stays below the library grid for manual custom-link creation
- Icons use the internal monochrome SVG dictionary first, then favicon fallback for unknown domains
- Panel typography uses Geist for title, labels, inputs, and button copy

## Quick Links System

Quick Links now use three distinct presentation modes tuned for the Acrylic UI instead of sharing a single visual treatment everywhere.

- Left sidebar dock: glass squircle app tiles with clear Geist labels, manual drag reordering, and a custom drag preview/cursor state
- Bottom quick links row: Glassy-style soft squircle favicon tiles with lighter Geist labels and truncated names
- Manage Quick Links panel: active links grid, compact custom-link form, divider-separated layout, and 50-app preset library
- Shared icon rendering prefers `MONO_ICONS` for known apps and falls back to favicons for unknown custom links
- Shared label styling is centralized in `modules/quicklinks.js` so future typography tuning stays consistent across Quick Links surfaces

## Stack

- Manifest V3 Chrome Extension
- Pure ES modules (no bundler)
- `chrome.storage.sync` for preferences, `chrome.storage.local` for app data
