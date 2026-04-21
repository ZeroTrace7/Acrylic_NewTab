# 🚀 Chrome Web Store Pre-Launch & SEO Checklist for Acrylic

To ensure **Acrylic** reaches the maximum number of users globally and optimizes for both the Chrome Web Store native search and modern AI search engines, you must execute a strict, multi-layered SEO and GEO (Generative Engine Optimization) strategy. 

---

## ✅ COMPLETED TASKS

### Store SEO — Text Assets
*   **Title:** Executive decision — kept as `"Acrylic - New Tab"`. Front-loaded brand with primary keyword ("New Tab") for CWS TF-IDF indexing.
*   **Summary (132-char):** Manifest `description` updated to: `"Premium glassmorphism New Tab. Tasks, Pomodoro timer, notes, and 8 themes built in. Sub-100ms load. Free forever. Zero tracking."` (128 chars). Optimized for entity density ("Pomodoro timer" > "Pomodoro", "8 themes" > "custom themes", "Sub-100ms" > "Fast").
*   **Long Description:** Semantic long description rewritten with 150-word hook, implicit "Momentum alternative" entity clustering, 12 search engines listed (including Gemini, ChatGPT, Claude, Perplexity, Grok, DeepSeek), per-permission justification block, and Clipboard History feature. Saved to `store/cws_long_description.txt`. Copy-paste into the Developer Dashboard at submission time.

### Compliance & Legal
*   **Privacy Policy:** NLP-optimized privacy policy at `PRIVACY_POLICY.md`. Contains 12-category explicit data denial list, per-permission justification table with "Data Transmission" column (7 static + 2 optional + host permissions), Google-mandated Limited Use compliance string (§6), and GitHub Pages hosting infrastructure disclaimer (§10). Synchronized 1:1 against `manifest.json`.
*   **MIT License:** Standard MIT license file created at `LICENSE` (copyright 2026, Shreyash Gupta). README badge now links to a real file.
*   **Manifest V3 Compliance:** Extension is natively MV3 — `"manifest_version": 3` confirmed.

### Code Cleanup
*   **Uninstall URL:** Removed placeholder `example.com` uninstall URL from `background.js`. Comment left for v1.1 feedback form.
*   **"Preferances" Typo:** Fixed in all 4 locations — `newtab.html` (aria-label), `newtab.js` (comment), `readfirst.md` (2 instances).
*   **Rate Us Link:** Updated dead `#` link in `settings/settings.js` to CWS review URL template with `EXTENSION_ID_HERE` placeholder.
*   **Debug Code:** `debugStylesheetBinding()` identified in `newtab.js` — flagged for removal (non-critical, only fires if CSS fails to load).

### Package Cleanliness
*   **`.gitignore` updated** to exclude: `*.diff` (5 dev diffs), `Launching.md`, `AGENTS.md`, `glassy.md`, `fetch-icons.js`, `icon-paths.json`, `.tmp_ui_before/`, `store/`.
*   **`store/` directory** created for CWS submission reference materials — gitignored so it never ships in the extension package.

### Launch Preparation
*   **Featured Badge Pitch:** Self-nomination narrative drafted and saved to `store/featured_badge_pitch.txt`. Highlights MV3 cold-start solution, zero-paywall architecture, sub-100ms load, and MIT license.

### Tier 1 Geo-Optimization (v1.0)
*   **Declarative Locale & Bidi:** Created `_locales/en/messages.json` (empty `{}` stub) and added `"default_locale": "en"` to `manifest.json`. HTML now uses `lang="__MSG_@@ui_locale__" dir="__MSG_@@bidi_dir__"` — Chrome injects the user's locale and text direction *before HTML parsing*, enabling correct screen reader pronunciation, browser auto-translation, and the `[dir="rtl"]` CSS selectors for Arabic/Hebrew. Zero runtime JS needed.
*   **Locale-Aware Dates:** Stripped all 6 hardcoded `'en-US'` locale strings from `clock.js`, `utils.js`, `newtab.js` (Zen Mode), and `notes.js`. Replaced with `undefined` so the browser renders dates in the user's native format (e.g., "2026年4月19日" for Japanese, "Sonntag, 19. April" for German).
*   **Locale-Aware Greetings:** Replaced hardcoded English `Good morning/afternoon/evening` in `utils.js` with a 10-language `GREETINGS` lookup table using `navigator.language` (en, es, fr, de, pt, ja, zh, ko, ar, hi).
*   **CSS Logical Properties:** Replaced all `margin-left` → `margin-inline-start` and `text-align: left` → `text-align: start` across `newtab.css`, `components.css`, and `quicktools.css` (6 locations). RTL layouts now auto-flip correctly.
*   **RTL Shadow Inversion:** Added `--shadow-x-sm` / `--shadow-x-lg` CSS variables to `:root` and a `[dir="rtl"]` block that inverts them. Glassmorphism light-source direction stays consistent in Arabic/Hebrew.
*   **Zen Mode Date Fix:** Removed `.toUpperCase()` from Zen Mode date — uppercasing breaks non-Latin scripts (Japanese, Arabic, Chinese).

### Permission Optimization (CWS Conversion Rate)
*   **`tabs` → Optional:** Moved from static `permissions` to `optional_permissions`. Created `modules/permissions.js` with `hasTabsPermission()` / `requestTabsPermission()` helpers. Added glassmorphism permission-gate UI to `panels/tabs.js` — renders a lock icon + "Grant Permission" button when user first opens Tab Manager. Background service worker (`background.js`) `GET_TABS` and `CREATE_TAB` handlers wrapped in `chrome.permissions.contains()` guard. Eliminates the "Read your browsing history" install warning.
*   **`search` → Removed:** Phantom permission — declared in manifest but never used in codebase (search bar uses `window.location.href`, not `chrome.search.query()`). Removed from `manifest.json`, `PRIVACY_POLICY.md`, and `Launching.md` to eliminate shadowban risk.

### Final Permission State
Static permissions:
```
storage, topSites, notifications, alarms, contextMenus, offscreen, management
```
Optional permissions (requested at runtime):
```
tabs, declarativeNetRequestWithHostAccess
```
*   ⚠️ `management` triggers a "Manage your apps, extensions, and themes" warning — consider moving to `optional_permissions` in v1.1 (same pattern as `tabs`)

---

## ⏳ REMAINING TASKS — BEFORE CWS SUBMISSION

These must be done before you click "Publish" in the Developer Dashboard. **All items are non-code — visual assets and Dashboard configuration only.**

### 1. Host the Privacy Policy at a Public URL
The `PRIVACY_POLICY.md` file exists but Google requires a **live, publicly accessible URL** in the Developer Dashboard.
*   **Recommended:** Purchase a custom domain (`acrylictab.com`), map to GitHub Pages, host at `https://acrylictab.com/PRIVACY_POLICY`
*   **Quick alternative:** Use the raw GitHub URL: `https://raw.githubusercontent.com/ZeroTrace7/Acrylic_NewTab/main/PRIVACY_POLICY.md`
*   Paste the chosen URL into the CWS Developer Dashboard under "Privacy practices" → "Privacy Policy URL"

### 2. Design Visual Assets (Figma)
These are uploaded directly to the Developer Dashboard — not part of the codebase.

*   **Store Icon (128x128):** Already exists at `icons/icon128.png` ✅ — 96×96 safe zone with 16px transparent padding, verified clean at 16×16 downscale
*   **Screenshots (1280×800) — 5 required, full-bleed, zero padding:**
    1.  **Hero Shot:** Full dashboard on `midnight` or `deep-blue` theme — clock, greeting, search bar, sidebar dock, bottom row. Annotation: "Premium Glassmorphism Dashboard" (40px Geist)
    2.  **Productivity Suite:** Quick Tools panel open showing Tasks with scribble-strike completion. Annotation: "Built-In Productivity Suite"
    3.  **Quick Links Dock:** Sidebar dock + Manage panel with 50-app preset library visible. Annotation: "50+ App Presets · Drag to Reorder"
    4.  **Pomodoro Focus:** Timer panel active mid-session with ambient sound selector visible. Annotation: "Integrated Pomodoro Timer"
    5.  **Theme Showcase:** 2×4 grid composite of all 8 themes, or `aurora` theme with search bar. Annotation: "8 Premium Themes"
*   **Small Promo Tile (440×280):** Aurora/Synthwave gradient, "Acrylic" in Geist 48px, subtitle 22px. No UI mockups — too small.
*   **Marquee Image (1400×560):** Center safe zone = **980×336 px**. Dead zones: top 56px (breadcrumbs), bottom 112px (install button), left/right 210px (bleed). Place logotype + hero mockup in center safe zone only.

### 3. Paste Long Description into Developer Dashboard
*   Open `store/cws_long_description.txt` and copy-paste the full text into the "Detailed description" field
*   In the "Privacy practices" tab, **uncheck all data collection boxes** — Acrylic collects none
*   Check the **"Limited Use requirements"** certification checkbox

### 4. Localized Store Listings (Dashboard Only — No Code)
Paste these translated short descriptions into the CWS Developer Dashboard language tabs:

*   🇩🇪 **German:** `Glassmorphismus-Startseite für neue Tabs. Produktiv mit Aufgaben, Pomodoro, Notizen und Themes. Schnell, kostenlos, ohne Tracking.`
*   🇯🇵 **Japanese:** `美しいグラスモーフィズムの新しいタブ。タスク管理、ポモドーロ、メモ、カスタムテーマで生産性アップ。高速・無料・トラッキングゼロ。`
*   🇪🇸 **Spanish:** `Página de nueva pestaña con glassmorphism premium. Tareas, Pomodoro, notas y temas personalizados. Rápida, gratuita y sin rastreo.`

---

## ⏳ REMAINING TASKS — IMMEDIATELY AFTER CWS APPROVAL

### 5. Swap the Extension ID Placeholder
After CWS assigns your extension ID:
*   Open `settings/settings.js` line 297
*   Replace `EXTENSION_ID_HERE` with the real extension ID
*   This fixes the "Rate Acrylic" button so it opens the actual CWS review page
*   Push a hotfix update immediately

### 6. Add Uninstall Feedback Form (v1.1)
*   Create a Google Form or Typeform asking why users are uninstalling
*   Add back `chrome.runtime.setUninstallURL('YOUR_FORM_URL')` in `background.js`
*   This is valuable data for improving retention

---

## ⏳ REMAINING TASKS — LAUNCH DAY VELOCITY (Day 0)

The CWS algorithm heavily rewards "Install Velocity" — the rate of installs in the first 48 hours.

1.  **Do not share the link publicly until fully approved and live.**
2.  **Launch Day Blast:** Post the Web Store link simultaneously to:
    *   Reddit: `r/chrome_extensions`, `r/productivity`, `r/browsers`
    *   Product Hunt (coordinate launch at 12:01 AM PST for maximum 24-hour window)
    *   Hacker News: `Show HN: Acrylic – A native MV3, local-first New Tab dashboard`
    *   Twitter/X
3.  **Review Seeding:** Have beta testers install and leave detailed 5-star reviews specifying *why* they like it. Early positive reviews push Acrylic up the organic search ladder.
4.  **Reply to every comment** on Product Hunt and HN within 15 minutes — high reply velocity is an algorithmic signal.
5.  **Performance Comparison Video:** Record a 15-second split-screen video showing Acrylic's instant load vs. a legacy competitor (use Chrome DevTools Performance tab). Post as a short-form video on Twitter/X, Reddit, and YouTube Shorts. Visual proof of sub-100ms load time is inherently viral.
6.  **SRM University Outreach:** Pitch Acrylic to local hackathon groups (Hack4Good, Tensor'26, Beyond Hack) and CS cohorts at SRM as the ultimate distraction-free student dashboard. Target GDSC SRM and GitHub Community SRM Discord servers for beta testing and early reviews.

---

## ⏳ REMAINING TASKS — POST-LAUNCH (Weeks 1-4)

### 7. Self-Nominate for the "Featured" Badge
The pitch is ready at `store/featured_badge_pitch.txt`.
*   **When:** After accumulating 10+ reviews and establishing consistent daily active users
*   **Where:** Chrome Web Store **One Stop Support** page → "I want to nominate my extension for a Featured badge and be eligible for merchandising"
*   **Prerequisites:** Privacy policy ✅, English support ✅, zero violations, no paywall ✅, Marquee image (1400x560) required
*   **Note:** You can only self-nominate once every 6 months — make sure the listing is flawless before submitting

### 8. Identity Verification (Established Publisher Badge)
*   Purchase custom domain (`acrylictab.com`), map to GitHub Pages, verify in Google Search Console
*   Register as "Official URL" in CWS Developer Dashboard → Account → Publisher information
*   Submit government-issued photo ID (Aadhaar/PAN/Passport) + proof of address
*   The "Established Publisher" checkmark is granted algorithmically after verification + several months of clean track record

### 9. Software Directory Listings
Create profiles on high-domain-authority directories for backlinks and AI citation:
*   **AlternativeTo** — List as alternative to Momentum, Tabliss, Bonjourr
*   **Product Hunt** — Maintain the launched product page
*   **BetaList / DevHunt** — Secondary discovery channels

### 10. Store Listing Localization (Global SEO)
The CWS does *not* auto-translate your SEO data.
*   In the Developer Dashboard, select different languages in the "Store Listing" tab
*   Use LLMs to translate the Title, Summary, and Long Description for top locales
*   Priority languages: Spanish, French, German, Portuguese, Japanese, Hindi
*   This is zero-code work — purely in the CWS dashboard

---

## 📋 POST-LAUNCH ROADMAP — v2.0+ (Code Changes Deferred)

All items below require code changes and are explicitly deferred to post-launch. They do not block the v1.0 CWS submission.

### 11. Deep In-Extension Localization (v2.1)
*   Scaffold `_locales/` directory with `chrome.i18n` API integration
*   Target: English, Spanish, German, Portuguese, Hindi, Japanese
*   Add RTL support for Arabic/Hebrew via `__MSG_@@bidi_dir__` CSS tags
*   Handle CSS text expansion for languages like German
*   *Deferred per `Improvements.md` — launch English-only first*

### 12. Generative Engine Optimization (GEO)
Once a landing page/website exists:
*   Do not block AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`) in `robots.txt`
*   Implement `SoftwareApplication` and `FAQPage` JSON-LD schema markup
*   Add an `llms.txt` file to the website root for AI model consumption
*   Use question-based headers (e.g., "What features does Acrylic include?") for LLM pattern-matching

### 13. Cross-Browser Publishing
*   **Microsoft Edge Add-ons Store:** Same MV3 codebase, significantly less competition
*   **Firefox Add-ons (AMO):** Privacy-conscious user base aligns perfectly with zero-telemetry architecture

### 14. In-App Virality — "Share Your Setup" (v2.5)
*   Build a "Take a Snapshot" button using HTML Canvas
*   Export branded screenshots with "Made with Acrylic ✦" watermark
*   Users share on Pinterest, TikTok, Twitter, Reddit (`r/desktops`)
*   *Deferred per `Improvements.md` — significant engineering effort*

### 15. Programmatic SEO Landing Pages
Build a website with dedicated competitor comparison pages:
*   `/momentum-dash-alternative`
*   `/tabliss-alternative`
*   `/bonjourr-alternative`
*   Direct, honest breakdowns of why Acrylic's architecture is superior

### 16. The Open-Source "Trust" Funnel
*   Host codebase publicly on GitHub (already in progress)
*   Captures searches for "open source new tab extension github"
*   Developers trust readable code — this lowers the install barrier dramatically

---

## 📦 ARCHIVED CONCEPTS — v3.0+ (Do Not Implement Pre-Launch)

The following ideas were evaluated during the v1.0 launch planning cycle and **explicitly deferred** because they conflict with the current privacy-first architecture or are premature for an unvalidated product. They are preserved here for future reference only.

> ⚠️ **CODEBASE LOCK:** The Acrylic v1.0 codebase is officially locked for Chrome Web Store submission as of April 19, 2026. No further JS/CSS feature additions will be made until v1.0 is live and validated with real users. Only bug fixes and CWS compliance adjustments are permitted.

### A. Referral Tracking & Gated Themes
*   **Concept:** Unlock exclusive themes (e.g., "Jet Black Matte", "Neon Synthwave") when a user successfully refers 3+ peers to install Acrylic. Use a lightweight referral tracking mechanism (e.g., GrowSurf) to count installs.
*   **Why Deferred:** Referral tracking **requires an external server** to correlate referrer → referee install events. This directly violates:
    *   `AGENTS.md` Rule 3 — "No unauthorized external requests"
    *   `PRIVACY_POLICY.md` — "Acrylic does not collect, transmit, or sell any user data. Period."
    *   `store/cws_long_description.txt` — "No accounts. No cloud sync. No analytics. No tracking."
    *   `store/featured_badge_pitch.txt` — "Features that leading competitors charge $40/year for are included free — permanently."
*   **Revisit Condition:** Only if Acrylic pivots to a cloud-sync model in v3.0+ and the privacy policy is formally rewritten. Requires new user consent flows and a CMP (Consent Management Platform).

### B. Paid Acquisition — Google Ads Competitor Conquesting
*   **Concept:** Bid on competitor-adjacent search terms (e.g., "Momentum alternative", "Tabliss with task manager") to capture high-intent users actively seeking alternatives.
*   **Why Deferred:** Premature and expensive for v1.0. Competitor conquesting incurs high CPCs due to low initial relevancy scores. The indie/privacy brand positioning is better served by organic community-driven growth (Reddit, HN, Product Hunt) in the first 6 months.
*   **Revisit Condition:** Only after organic growth plateaus (6+ months post-launch) and there is a validated conversion funnel (landing page + comparison matrix + CWS listing) to route paid traffic through. Sending ads to a generic CWS listing wastes budget.

### C. Non-Financial Viral Loop Mechanics
*   **Concept:** Award cosmetic rewards (expanded SVG library, custom wallpaper packs) for social sharing or community contributions (e.g., submitting a theme, filing a bug report).
*   **Why Deferred:** Requires a tracking mechanism to verify actions occurred. Even "privacy-respecting" implementations introduce state that must be stored and validated, adding architectural complexity for unproven user behavior.
*   **Revisit Condition:** After v2.5 "Share Your Setup" (Canvas snapshot export) ships. If users are organically sharing screenshots, a reward layer can be added on top without needing external tracking — verification can be local (e.g., "you used the share button 3 times" stored in `chrome.storage.local`).
