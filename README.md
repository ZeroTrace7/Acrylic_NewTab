# Acrylic — New Tab

Premium glassmorphism new tab Chrome extension. Improved version of "Glassy - New Tab".

## What Acrylic Includes

- Gloria Hallelujah clock with AM/PM
- Date display
- Greeting with user name
- Search bar with engine picker (Google, Bing, DuckDuckGo, Brave, Perplexity)
- Left sidebar dock with glass pill container
- Bottom quick links row with labels
- Bottom-left focus button
- Bottom-right grid + sliders buttons
- Premium entry animation (sub-800ms, staggered)
- Multiple themes (midnight, deep-blue, aurora, rose-noir, jet, espresso, slate, forest)
- Pomodoro, Notes, Tabs, Clipboard panels
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
- Active links render in a 4-column management grid with small corner remove badges
- Divider cleanly separates current links from the add flow
- Add New Link section includes URL field and Name field with leading icons
- Quick Add library provides a dense preset grid of 50 monochrome app icons
- Add Link button stays below the library grid for manual custom-link creation
- Icons use the internal monochrome SVG dictionary first, then favicon fallback for unknown domains
- Panel typography uses Geist for title, labels, inputs, and button copy

## Stack

- Manifest V3 Chrome Extension
- Pure ES modules (no bundler)
- `chrome.storage.sync` for preferences, `chrome.storage.local` for app data
