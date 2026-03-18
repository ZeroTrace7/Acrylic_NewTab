# Acrylic ReadFirst

## CRITICAL RULES — READ BEFORE MAKING ANY CHANGE

### 1. BODY ELEMENT
- The `<body>` tag has `id="app-body"`
- All theme selectors MUST use `#app-body.theme-*` NOT `body.theme-*`
- Animation triggers use `body.acrylic-loaded` (`document.body`)
- Both refer to the same element

### 2. BACKGROUND SYSTEM
- Three background divs: `#bg-layer`, `#bg-overlay`, `#bg-grain`
- `#bg-grain` must NEVER have `anim-hidden` class or `anim-bg` animation
- `#bg-grain` opacity is controlled by `--bg-grain-opacity` CSS variable (`0.035`)
- Do NOT change `#bg-grain` opacity or add animations to it
- `#bg-layer` and `#bg-overlay` can have `anim-bg` class but NOT `anim-hidden`

### 3. THEME SYSTEM
- Default theme: `theme-slate` (navy blue gradient)
- Theme class is applied to `#app-body` by `modules/background.js`
- Never hardcode a background color on `#app-body` — themes override it
- Never add `background: #0a0f1c` or any solid color fallback to `#app-body`

### 4. ANIMATION SYSTEM
- Entry animations are sub-800ms total
- `acrylic-loaded` class is added to `document.body` via `armEntryAnimation()` in `newtab.js`
- `anim-hidden` class starts elements at `opacity: 0`
- `anim-hidden` must NEVER be applied to background divs (`#bg-layer`, `#bg-overlay`, `#bg-grain`)
- `prefers-reduced-motion` disables all animations

### 5. CSS SPECIFICITY RULES
- `#app-body` has higher specificity than `body`
- Theme gradients on `#app-body.theme-*` will lose to any rule on `#app-body` alone
- Never add a `background` property directly to `#app-body {}` block
- If you add a fallback, it must go on `body {}` not `#app-body {}`

### 6. FILE STRUCTURE
- All modules are in `/modules/`
- Panels are in `/panels/`
- Settings in `/settings/`
- Onboarding in `/onboarding/`
- No bundler — pure ES modules
- Manifest V3 — no background page, uses service worker

### 7. BEFORE MAKING ANY CHANGE
- Read this file completely
- Do not rename selectors without checking specificity
- Do not add animations to background divs
- Do not add solid color fallbacks to `#app-body`
- Test by checking: `getComputedStyle(document.getElementById('app-body')).background`
