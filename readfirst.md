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

### 6. STORAGE + ARCHITECTURE
- Manifest V3 extension, no bundler, pure ES modules.
- Preferences live in `chrome.storage.sync` via `Prefs`.
- App/panel data (including tasks) live in `chrome.storage.local` via `Store`.
- Major directories: `/modules` (core logic), `/panels` (tools panel modules), `/settings` (settings UI), `/onboarding` (onboarding flow).

### 7. BEFORE YOU CHANGE ANYTHING
- Read this file first.
- Check selector specificity impact before editing theme/background CSS.
- Do not add animations to background layers.
- Do not add solid color backgrounds that override theme gradients.
- Validate in DevTools after changes: `getComputedStyle(document.getElementById('app-body')).background`, `getComputedStyle(document.getElementById('bg-grain')).opacity`, `chrome.storage.local.get('tasks')`.
