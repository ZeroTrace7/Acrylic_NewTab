# Acrylic ReadFirst

## CRITICAL RULES — READ BEFORE MAKING ANY CHANGE

### 1. BODY + SELECTOR CONTRACT
- The root element is `<body id="app-body">`.
- Theme selectors must use `#app-body.theme-*` (not `body.theme-*`).
- Entry animation trigger uses `document.body.classList.add('acrylic-loaded')`.
- `body` and `#app-body` are the same node; keep selectors consistent with existing specificity.

### 2. BACKGROUND LAYER SYSTEM
- Background stack is: `#bg-layer` (wallpaper) -> `#bg-overlay` (wallpaper shading) -> `#bg-grain` (texture) -> UI.
- `#bg-grain` must never receive `anim-hidden` or `anim-bg`.
- Do not animate `#bg-grain`; its visibility is controlled by `--bg-grain-opacity` (`0.035`).
- `#bg-overlay` base state must stay `background: none;`.
- Overlay visuals must only activate through `#app-body.has-wallpaper #bg-overlay`.

### 3. THEME SYSTEM
- Theme classes are applied by `modules/background.js` to `document.body`.
- Current default preference is `midnight` (`Prefs.defaults.theme`).
- Keep theme backgrounds in `newtab.css` under `#app-body.theme-*`.
- Never introduce solid fallback colors that can flatten theme gradients.

### 4. ENTRY ANIMATION RULES
- Entry animation budget is sub-800ms total.
- `anim-hidden` is only for foreground elements that should fade/slide in.
- Background elements (`#bg-layer`, `#bg-overlay`, `#bg-grain`) must be visible immediately.
- Honor `prefers-reduced-motion`; do not add forced motion bypasses.

### 5. TASKS PANEL (FINALIZED IMPLEMENTATION)
- Primary files: `modules/tasks.js` and `css/panels.css`.
- Trigger is `#tasks-btn`; panel mounts into `#tasks-panel-mount`.
- Use `.tasks-panel.open` for visible state and `.tasks-panel.is-success` for completed-all reward state.
- Progress formula: `completed / total * 100` -> `.tasks-progress-fill` width.
- Task rendering must remain incremental (Map + DOM reuse); do not reintroduce list `innerHTML = ''` redraws.
- Completed row state must stay on `.tasks-item.is-done` and `.tasks-check.is-done`.
- Scribble strike is controlled by `data-scribble` variants (`0/1/2`) and must stay three-pattern cycling.
- Success flow timing constants in `modules/tasks.js` are part of UX tuning: `SUCCESS_REVEAL_DELAY_MS`, `SUCCESS_AUTOCLEAR_MS`, `TASK_REORDER_DELAY_MS`.
- Keep persistence wired to `Store.getTasks()` and `Store.setTasks()`.

### 6. QUICK LINKS PANEL (CURRENT CONTRACT)
- Primary file: `modules/quicklinks.js`.
- Panel id/class: `#manage-links-panel.manage-links-panel`.
- Trigger: middle-left dock `...` button (`DOM.manageQuicklinksBtn`).
- Layout order must stay:
  1) Header (`Quick Links` + close)
  2) Active links grid
  3) Divider
  4) `Add New Link` label
  5) URL input row
  6) Name input row
  7) Quick Add preset library grid
  8) Add Link button
- Positioning is applied on every open inside `openManagePanel()` using fixed positioning and direct `panel.style.*` assignments.
- Do not reintroduce `cssText +=` positioning merges for the panel.
- Panel opens to the right of the left dock and is vertically centered.
- Panel open motion is the premium scale-and-glide path:
  - `@keyframes premiumPanelOpen` in `css/panels.css`
  - `.animate-premium-panel` on the outer panel wrapper
  - timing must stay `0.4s cubic-bezier(0.16, 1, 0.3, 1)`
- Do not reintroduce legacy fade classes or inline open transitions that fight `.animate-premium-panel`.
- Panel typography uses `Geist`; `newtab.html` loads the font and the panel applies it inline.
- Close affordance is a larger bare circular hit target with hover circle feedback; do not wrap it in an always-visible box again.
- Active links use small red corner remove badges. Keep them manually styled in `modules/quicklinks.js`; do not convert them back to default browser buttons.
- Active link labels are compact title-case text below the icon tile.
- Divider between active links and add flow is a subtle 1px horizontal line with controlled top/bottom spacing.
- URL and Name rows are icon-leading fields:
  - wrapper is `position: relative`
  - left icon is absolutely positioned
  - input text uses extra left padding to avoid icon overlap
- Quick Add library is present:
  - 50 preset entries from `QUICK_LIBRARY`
  - dense 5-column grid
  - monochrome SVG icon tiles only, no text labels under tiles
  - click adds the preset immediately to active links
- Keep active link icon rendering on `MONO_ICONS` + URL/key matching; custom links still use favicon fallback only when no mono match exists.
- `MONO_ICONS` is the source of truth for branded monochrome icons used in both active links and the preset library.
- Quick Links labels are now intentionally explicit in JS, not inherited:
  - shared label font family and weight are defined in `modules/quicklinks.js`
  - sidebar labels, bottom-row labels, and active-link labels should stay visually aligned unless there is a deliberate UX reason to split them

### 7. STORAGE + ARCHITECTURE
- Manifest V3 extension, no bundler, pure ES modules.
- Preferences live in `chrome.storage.sync` via `Prefs`.
- App/panel data (including tasks) live in `chrome.storage.local` via `Store`.
- Major directories: `/modules` (core logic), `/panels` (tools panel modules), `/settings` (Preferances UI), `/onboarding` (onboarding flow).

### 8. QUICK LINKS VISUAL MODES
- There are three different Quick Links surfaces. Do not collapse them back into one style:
- Left sidebar dock:
  - glass squircle icon tile
  - monochrome app icon treatment
  - compact label below icon
  - manual mouse drag reordering is supported
  - drag start is delegated from `#sidebar-apps-grid` in `modules/quicklinks.js`
  - do not switch this back to native HTML5 drag-and-drop; native `dragstart` is intentionally suppressed
  - reorder animation uses `SIDEBAR_REORDER_ANIM_MS`
  - active drag cursor state is forced through `#app-body.is-sidebar-reordering` in `css/components.css` to avoid hand/arrow flicker
- Bottom quick links row:
  - Glassy-style soft squircle favicon tile
  - favicon remains full-color inside the glass shell
  - label is lighter/thinner than before and tuned separately for readability on the bottom row
- Manage Quick Links panel:
  - active links use compact management tiles with small corner remove badges
  - preset library uses dense icon-only tiles
- Bottom-row icon shell styling is partly enforced inline in `modules/quicklinks.js` because shared tile CSS is overridden there.
- If bottom-row visuals are not changing, inspect the inline styles in `createTile()` / `updateTile()` first before editing CSS.
- Left dock menu button (`#tools-fab`) is a slim rounded rectangle with 3 larger dots; preserve its softer spacing and lower-opacity default state unless explicitly redesigning it.

### 9. BEFORE YOU CHANGE ANYTHING
- Read this file first.
- Check selector specificity impact before editing theme/background CSS.
- Do not add animations to background layers.
- Do not add solid color backgrounds that override theme gradients.
- Validate in DevTools after changes: `getComputedStyle(document.getElementById('app-body')).background`, `getComputedStyle(document.getElementById('bg-grain')).opacity`, `chrome.storage.local.get('tasks')`.

### Extension Routing Map
- Middle-Left Dock (`#tools-fab` / ... oval): Triggers "Manage Quick Links" popover.
- Bottom-Left Icon (`#focus-btn`, target/circles): Triggers "Zen Mode".
- Bottom-Right Group (List Icon, `#settings-btn`): Triggers "Preferances" modal.
- Bottom-Right Group (Grid Icon, `#grid-view-btn`): Triggers "Quick Tools" panel (Productivity/Notes/Tabs/Extensions).
