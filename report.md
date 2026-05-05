# Acrylic Codebase Analysis Report

Based on the prompt, the goal is to analyze the coding patterns, naming conventions, and structure used in the Acrylic repository, and document them to strictly follow these standards in the future.

## 1. Project Architecture and Scope
* **Type:** Manifest V3 Chrome Extension.
* **Paradigm:** Vanilla JavaScript, pure ES modules (`.js` files), and standard CSS.
* **Build System:** Zero build steps. No Webpack, Vite, TypeScript, or JSX. Files are loaded directly via `<script type="module">`.
* **Privacy:** Local-first, zero telemetry. External API requests are strictly forbidden unless explicitly approved (e.g., fetching favicons from Google).
* **Restrictions:** The `.tmp_research/` directory and `.tmp_ui_before/` directory are strictly read-only and must never be modified.

## 2. Directory Structure
* `/modules/`: Core logic (storage, search, quicklinks, etc.).
* `/panels/`: Logic for Quick Tools sub-panels (notes, pomodoro, tabs, extensions).
* `/settings/`: Preferences UI and logic.
* `/onboarding/`: First-run onboarding flow logic.
* `/css/`: Vanilla CSS files containing variables and stylesheets for layout, components, and panels.
* `/tests/`: Test files utilizing the native Node.js test runner (`node:test`).
* Root files: `manifest.json`, `newtab.html`, `newtab.js`, `background.js`, `readfirst.md`.

## 3. Naming Conventions
* **Files:** Lowercase, kebab-case for CSS and some scripts (e.g., `newtab.css`, `fetch-icons.js`), simple snake-case or no-dash names for JS modules (e.g., `storage.js`, `quicklinks.js`, `ui-config.js`).
* **Variables/Functions:** CamelCase is standard (e.g., `initApp`, `triggerSearch`, `settingsOpen`).
* **Constants:** UPPER_SNAKE_CASE for globally significant configuration values (e.g., `SUCCESS_REVEAL_DELAY_MS`, `MONO_ICONS`).
* **DOM Builders:** Use the `create*` prefix when writing helper functions that construct and return DOM elements (e.g., `createStatsSection`).
* **CSS Selectors:** Kebab-case. Identifiers generally use meaningful names. Modifiers use `.is-*` or `.has-*` prefixes for state (e.g., `.is-done`, `.has-wallpaper`).

## 4. Coding Patterns

### a. UI and DOM Manipulation
* **Selectors:** Rely on strict class and ID targeting. Modifiers control visual state. `document.getElementById` and `document.querySelector` are used. Often centralized through `modules/dom.js`.
* **Security:** Use `textContent` and `createElement` for user-generated or dynamic data to avoid XSS. `innerHTML` is restricted strictly to trusted constants or static SVGs.
* **Component Styling:** Use custom CSS properties (variables) instead of hardcoded values, allowing dynamic updates (like brightness adaptation or background positioning).
* **Animation:** State changes often trigger CSS transitions or keyframes. Classes like `.anim-hidden`, `.is-active`, and `.acrylic-loaded` coordinate entry animations. Avoid animating layout properties or background layers (`#bg-grain`).

### b. Storage (`modules/storage.js`)
* **Dual Layer Approach:**
  * `Prefs` (`chrome.storage.sync`): For settings and small configuration options.
  * `Store` (`chrome.storage.local`): For user data, task lists, tab groups, and notes.
* **Data Write Optimizations:** Group updates when possible. The codebase prefers atomic writes using a single `chrome.storage.local.set(update)` instead of firing multiple separate `set` calls (or `Promise.all` sets).
* **Data Read Optimizations:** Minimize broad reads like `chrome.storage.local.get(null)`. Use targeted key retrieval.

### c. Event Handling
* **Custom Event Bus:** An internal event bus (`modules/event-bus.js`) coordinates inter-module communication (e.g., listening for `themeChanged`).
* **Fire-and-forget Wrappers:** Wrapper functions (like `triggerSearch`) centralize logic and error handling rather than implementing it raw inside UI listeners.

### d. String Manipulation
* **Emoji/Multibyte Safety:** Use the spread operator (`[...str]`) over `.length` or `.slice()` when truncating or manipulating text to preserve surrogate pairs and complex characters.

### e. Validation
* **Strict Checks:** Use explicit strict equality and null checks (e.g., `latitude == null || longitude == null`) instead of truthy/falsy checks to prevent incorrectly flagging valid `0` values.

### f. Testing
* Uses `node:test`.
* **Mocking:** Relies on `import { mock } from 'node:test'` and `mock.method(object, 'methodName')`.
* **Global Browser Mocks:** Must manually instantiate or declare `global.chrome` and `global.document` at the top of test files before importing the module.
* **Testability:** Export internal vanilla functions when possible so they can be unit-tested directly, rather than only testing through rendering functions.

## 5. Specific Component Rules

### Quick Links (`modules/quicklinks.js`)
* Drag-and-drop is supported on the left sidebar dock but uses manual mouse coordinate translation over native HTML5 Drag and Drop (`dragstart` is intentionally suppressed).
* Visual differentiation between sidebar dock (glass squircle, monochrome), bottom row (soft squircle, full favicon), and management panel (small badges).

### Tasks (`modules/tasks.js`)
* Relies on standard map iterations and incremental DOM updates. `innerHTML = ""` resets are frowned upon.
* Strike-through effect cycles through 3 pre-defined SVGs via `data-scribble`.

### Theme & Aesthetics (`readfirst.md` rules)
* Glassmorphism relies on blur offsets, grain layers, and carefully tuned cubic-bezier curves for transitions.
* `body` styling defaults dictate theme. Theme changes apply classes like `#app-body.theme-midnight` to trigger CSS variables changes.
