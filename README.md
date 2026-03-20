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

The Manage Quick Links panel is intentionally compact and focused on active links + manual add flow.

- Opens from the middle-left dock `...` button
- Panel opens to the right of the sidebar and is vertically centered in the viewport
- Active links section shows current app links with remove controls
- Add New Link section includes URL field, Name field, and full-width Add Link button
- Quick Add library/search grid is removed by design (do not expect preset app picker)
- Active link tiles use the internal monochrome SVG icon system with URL/key-based mapping

## Stack

- Manifest V3 Chrome Extension
- Pure ES modules (no bundler)
- `chrome.storage.sync` for preferences, `chrome.storage.local` for app data
