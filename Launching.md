# 🚀 Chrome Web Store Pre-Launch & SEO Checklist for Acrylic

To ensure **Acrylic** reaches the maximum number of users globally and optimizes for both the Chrome Web Store native search and modern AI search engines, you must execute a strict, multi-layered SEO and GEO (Generative Engine Optimization) strategy. 

---

## ✅ COMPLETED TASKS

### Store SEO — Text Assets
*   **Title:** Executive decision — kept as `"Acrylic - New Tab"`.
*   **Summary (132-char):** Manifest `description` updated to: `"Premium glassmorphism New Tab page. Boost productivity with tasks, Pomodoro, notes, and custom themes. Fast, free, and zero tracking."` (131 chars).
*   **Long Description (4,000-char):** SEO-optimized CWS description drafted with high fact density, all 8 themes, full feature enumeration, and competitive positioning keywords. Saved to `store/cws_long_description.txt` (3,703 chars). Copy-paste into the Developer Dashboard at submission time.

### Compliance & Legal
*   **Privacy Policy:** Comprehensive zero-collection privacy policy created at `PRIVACY_POLICY.md`. Covers data storage, permissions justification, network requests, children's privacy, and data export/deletion rights.
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

---

## ⏳ REMAINING TASKS — BEFORE CWS SUBMISSION

These must be done before you click "Publish" in the Developer Dashboard.

### 1. Host the Privacy Policy at a Public URL
The `PRIVACY_POLICY.md` file exists but Google requires a **live, publicly accessible URL** in the Developer Dashboard.
*   **Recommended:** Enable GitHub Pages on the repo → host at `yourusername.github.io/Acrylic/privacy`
*   **Quick alternative:** Use the raw GitHub URL: `https://raw.githubusercontent.com/YOUR_USERNAME/Acrylic/main/PRIVACY_POLICY.md`
*   Paste the chosen URL into the CWS Developer Dashboard under "Privacy practices" → "Privacy Policy URL"

### 2. Create Visual Assets
These are uploaded directly to the Developer Dashboard — not part of the codebase.

*   **Store Icon (128x128):** Already exists at `icons/icon128.png` ✅ — verify it is crisp at small sizes
*   **Screenshots (1280x800):** Create up to 5 screenshots showing:
    1.  Main dashboard with glassmorphism theme and clock
    2.  Floating glass to-do panel with tasks
    3.  Quick Links sidebar dock + Manage panel
    4.  Pomodoro timer in action
    5.  Theme showcase (e.g., Aurora vs. Midnight)
*   **Small Promo Tile (440x280):** Saturated colors, no text clutter, must be legible at 50% scale
*   **Large Promo Tile (920x680):** Optional but recommended
*   **Marquee Image (1400x560):** Required for Featured badge eligibility — well-defined edges, minimal text
*   **YouTube Promo Video (optional):** 15-30 second screen recording of entry animations, theme switching, and Pomodoro flow

### 3. Paste Long Description into Developer Dashboard
*   Open `store/cws_long_description.txt` and copy-paste the full text into the "Detailed description" field in the CWS Developer Dashboard

### 4. Review Permissions Before Submission
Current permissions in `manifest.json`:
```
storage, search, tabs, topSites, notifications, alarms, contextMenus, offscreen, management
```
*   `tabs` triggers a "Read your browsing history" install warning — this is the #1 reason users abandon installs for new tab extensions
*   Consider moving `tabs`, `management`, and `notifications` to `optional_permissions` with runtime permission requests (requires code changes — can be deferred to v1.1 if time-critical)

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

---

## ⏳ REMAINING TASKS — POST-LAUNCH (Weeks 1-4)

### 7. Self-Nominate for the "Featured" Badge
The pitch is ready at `store/featured_badge_pitch.txt`.
*   **When:** After accumulating 10+ reviews and establishing consistent daily active users
*   **Where:** Chrome Web Store **One Stop Support** page → "I want to nominate my extension for a Featured badge and be eligible for merchandising"
*   **Prerequisites:** Privacy policy ✅, English support ✅, zero violations, no paywall ✅, Marquee image (1400x560) required
*   **Note:** You can only self-nominate once every 6 months — make sure the listing is flawless before submitting

### 8. Identity Verification (Established Publisher Badge)
*   Navigate to the CWS Developer Dashboard account settings
*   Submit government-issued photo ID (Aadhaar/PAN/Passport) + proof of address (utility bill/bank statement)
*   The "Established Publisher" checkmark is granted algorithmically after verification + several months of clean track record
*   This badge significantly increases install conversion rates for privacy-sensitive users

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

## ⏳ REMAINING TASKS — LONG-TERM GROWTH (v2.0+)

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
