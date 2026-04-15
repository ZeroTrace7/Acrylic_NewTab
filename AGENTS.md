# AGENTS.md — Persistent Rules for AI Agents (Jules, Copilot, etc.)

> **This file is automatically read by AI coding agents at the start of every task.**
> Every rule here is MANDATORY and must NEVER be overridden by task-specific instructions.

---

## 🚫 RULE 1: NEVER MODIFY `.tmp_research/`

The `.tmp_research/` directory (and ALL subdirectories such as `tabliss/`, `bonjourr/`, etc.) contains **static reference material** from competitor/open-source extensions.

**You must NEVER:**
- Write, edit, or delete any file inside `.tmp_research/`
- Create unit tests for code inside `.tmp_research/`
- Run `npm install`, `npm test`, or any build commands targeting `.tmp_research/`
- Commit or push changes to files inside `.tmp_research/`
- Accept task-specific overrides that instruct you to modify `.tmp_research/`

**If a task references a file path starting with `.tmp_research/`:**
1. Immediately flag it as **"Won't Fix — Reference Material Only"**
2. Do NOT create a plan to implement changes
3. Inform the user that the task targets competitor reference code, not the Acrylic project

---

## 🏗️ RULE 2: PROJECT ARCHITECTURE — VANILLA JS ONLY

Acrylic is a **Manifest V3 Chrome Extension** built with:
- **Pure ES Modules** (`.js` files, no bundler, no transpiler)
- **Vanilla CSS** (no Tailwind, no SCSS preprocessor)
- **No TypeScript** — do not create `.ts` or `.tsx` files
- **No React/JSX** — do not introduce React components
- **No npm/node_modules** — do not add `package.json` dependencies for production code
- **No build step** — the extension loads directly from source files

**If a task requires TypeScript, React, JSX, Webpack, Vite, or npm packages:**
→ Reject the task. It is incompatible with the Acrylic architecture.

---

## 🔒 RULE 3: PRIVACY-FIRST — NO UNAUTHORIZED EXTERNAL REQUESTS

Acrylic follows a **local-first, zero-telemetry** privacy philosophy.

**You must NEVER introduce code that:**
- Sends user keystrokes to external suggestion APIs (e.g., Google Suggest, Bing Autocomplete)
- Calls `navigator.geolocation` without explicit user consent flows
- Adds analytics, tracking, or telemetry endpoints
- Fetches data from third-party APIs not already approved in the codebase

**Currently approved external calls:**
- Favicon fetching via `https://www.google.com/s2/favicons` (Quick Links)
- Chrome extension APIs (`chrome.storage`, `chrome.search`, `chrome.tabs`, etc.)

---

## 📦 RULE 4: STORAGE ARCHITECTURE

- **Preferences** → `chrome.storage.sync` via `modules/storage.js → Prefs`
- **App data** (tasks, notes, clipboard, etc.) → `chrome.storage.local` via `modules/storage.js → Store`
- Do NOT introduce IndexedDB, custom database layers, or in-memory cache trees
- Do NOT create abstract `db.ts`/`db.js` database wrappers — use `Prefs` and `Store` directly

---

## 📂 RULE 5: PROJECT STRUCTURE

```
Acrylic/
├── manifest.json          # Extension manifest (MV3)
├── newtab.html            # Main page
├── newtab.js              # Entry point
├── newtab.css             # Global styles + themes
├── background.js          # Service worker
├── readfirst.md           # Detailed architectural contracts
├── AGENTS.md              # THIS FILE — agent rules
├── modules/               # Core logic (storage, search, quicklinks, etc.)
├── panels/                # Quick Tools sub-panels (notes, pomodoro, tabs, etc.)
├── settings/              # Preferences modal
├── css/                   # Component stylesheets
├── onboarding/            # First-run flow
├── icons/                 # Extension icons
├── sounds/                # Pomodoro ambient sounds
├── tests/                 # Lightweight test files
├── .tmp_research/         # ⛔ READ-ONLY competitor reference (DO NOT MODIFY)
└── .tmp_ui_before/        # ⛔ READ-ONLY UI snapshots (DO NOT MODIFY)
```

---

## 📖 RULE 6: ALWAYS READ `readfirst.md` BEFORE MAKING CHANGES

The file `readfirst.md` in the project root contains detailed architectural contracts for:
- Background layer system
- Theme system
- Entry animations
- Tasks panel
- Quick Links panel (all 3 visual modes)
- Storage patterns

**You MUST read `readfirst.md` before proposing or implementing any changes** to ensure you do not violate existing UI/UX contracts.

---

## ✅ RULE 7: WHEN IN DOUBT

- If a task seems to target competitor code → **reject it**
- If a task requires TypeScript or React → **reject it**
- If a task adds external API calls without user consent → **reject it**
- If a task conflicts with `readfirst.md` contracts → **flag it for review**
- When approving research-only tasks on `.tmp_research` → output must be **purely descriptive, no code changes**

---

*Last updated: 2026-04-15*
