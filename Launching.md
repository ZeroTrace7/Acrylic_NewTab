# 🚀 Chrome Web Store Pre-Launch & SEO Checklist for Acrylic

To ensure **Acrylic** reaches the maximum number of users globally and optimizes for both the Chrome Web Store native search and modern AI search engines, you must execute a strict, multi-layered SEO and GEO (Generative Engine Optimization) strategy. 

---

## 1. Store Search Engine Optimization (SEO)

The CWS algorithm index weights specific fields heavier than others. You must optimize your text assets before publishing.

### A. Title Optimization (Highest Weight)
Never just name the extension "Acrylic". The algorithm ranks the exact Title string highest. 
*   **Rule:** Keep your title **under 30 characters** to ensure it isn't truncated in search views and accurately describes core functionality.
*   **Formula:** `[Brand Name] - [Primary Keyword]`
*   **Recommended:** `Acrylic - Premium New Tab`

### B. Summary & Long Description (Indexing Text)
*   **Summary:** Pack exactly 2-3 high-value secondary keywords in your 132-character summary.
*   **Long Description (Max 4,000 chars):** Naturally mention core keywords (`productivity dashboard`, `pomodoro timer`, `glassmorphism`). Avoid repeating the short description. 
*   **Fact Density:** Increase "fact density" by clearly stating specific features and performance metrics (e.g., "loads in under 100ms").

### C. Self-Nominate for the "Featured" Badge
Earning the Featured badge heavily boosts visibility. 
*   **Action:** You can personally self-nominate your extension via the Chrome Web Store **One Stop Support page**.
*   **Requirements:** Must have a privacy policy, English language support, zero policy violations, and your core features must be accessible without a paywall (which Acrylic satisfies perfectly).

---

## 2. Geo-Optimization (Localization / i18n)

To show up "everywhere", you cannot rely on English alone. Users in Germany, Japan, and Brazil search the CWS in their native languages. 

### A. Store Listing Localization (Crucial for Global SEO)
The Chrome Web Store *does not auto-translate your SEO data*.
*   In the Chrome Developer Dashboard, explicitly select different languages in the "Store Listing" tab.
*   Paste translated versions of your Title, Summary, and Long Description for each locale. If a Spanish user searches for "nueva pestaña", Acrylic will instantly outrank English-only extensions.

### B. Deep In-Extension Localization
True localization in 2026 goes beyond word-for-word translation.
*   **`chrome.i18n` API:** Do not hardcode text. Extract all UI text into `messages.json` files organized inside a `_locales/` directory (e.g., `_locales/en/`, `_locales/es/`). Set `"default_locale": "en"` in `manifest.json`.
*   **Text Expansion:** Design your CSS containers/buttons to handle "text expansion", as languages like German require significantly more horizontal space than English.
*   **Right-to-Left (RTL):** Use Chrome's built-in `__MSG_@@bidi_dir__` tags in your CSS to automatically flip the UI structure for languages like Arabic or Hebrew.

---

## 3. Generative Engine Optimization (GEO) for 2026

With millions of users discovering software through AI search engines like ChatGPT, Perplexity, and Google AI Overviews, you must optimize for AI models.

### A. Technical AI Readiness
If you build a landing page or GitHub repo for your extension:
*   Do not block AI crawlers (like `GPTBot`, `ClaudeBot`, or `PerplexityBot`) in your `robots.txt` file.
*   Use Schema markup (like `SoftwareApplication` or `FAQ`) on your website so AI systems understand the structured data.

### B. Implement an `llms.txt` File
A modern GEO strategy involves adding an `llms.txt` file to your website's root directory. This is a markdown file specifically designed to guide AI systems on how to properly interpret, summarize, and cite your extension's capabilities when answering user queries.

---

## 4. Visual Assets & Conversion Rate Optimization (CRO)

A high rank doesn't matter if users don't click "Add to Chrome".

### A. High-Fidelity Promotional Assets
*   **Store Icon (128x128):** Must be crisp and recognizable without text.
*   **Promotional Tiles:** Provide tiles at **440x280**, **920x680**, and a **1400x560 "Marquee"** image. Ensure these images use saturated colors, have well-defined edges, and avoid being cluttered with text.

### B. Screenshots & Video
*   **Screenshots (1280x800):** Upload up to 5 defining real-world use cases (e.g., "Built-in Pomodoro", "Zero-Latency Tasks").
*   **YouTube Promo Video:** Create a 15-30 second screen recording of the extension's beautiful animations and link it in the dashboard.

---

## 5. Technical / Manifest Pre-Launch Checks

Before uploading the `.zip`:

*   **Manifest V3 Compliance:** Ensure `"manifest_version": 3`.
*   **Minimal Permissions:** Only declare the absolute minimum. Use `"optional_permissions"` for things not strictly required on load to avoid reviewer rejection.
*   **Privacy Policy URL:** You **must** have a hosted privacy policy stating "Acrylic does not collect, transmit, or sell user data."

---

## 6. The Launch Day "Velocity" Strategy

The CWS algorithm heavily rewards "Install Velocity".

1.  **Do not link it publicly until approved.**
2.  **Launch Day Blast:** Post the Web Store link simultaneously to Reddit (`r/chrome_extensions`, `r/productivity`), Product Hunt, and Twitter/X.
3.  **Review Seeding:** Have beta testers install it and leave a 5-star review specifying *why* they like it. Early positive reviews signal the algorithm to push Acrylic up the Organic Search ladder.

---

## 7. Long-Term Growth & Maximum Reach Strategies

If your goal is to continuously scale users over the months and years following your launch, you must implement optimization channels outside the native Chrome Web Store.

### A. Cross-Browser Publishing (Zero Extra Code)
Because Acrylic is built natively for Manifest V3, you do not need to restrict yourself to Chrome. You can instantly increase your total addressable market by 30% by publishing the exact same codebase to:
*   **Microsoft Edge Add-ons Store:** Edge is built on Chromium and perfectly supports MV3. The Edge store is rapidly growing and has significantly less competition than Google Chrome, making it much easier to rank #1.
*   **Firefox Add-ons (Mozilla AMo):** Firefox users represent a massive demographic of privacy-conscious power users. Since you are "Zero Telemetry" and "Local-First", the Firefox community will aggressively champion your product.

### B. In-App Virality ("Share Your Setup")
The biggest marketing hurdle is getting users to show off your product for you.
*   **The Feature:** Build a "Take a Snapshot" or "Share Setup" button directly inside the Acrylic side-panel. This button should use an HTML Canvas function to take a beautiful, branded image of the user's current background, glass widgets, and custom layout.
*   **Why it works:** When users design a beautiful "Aesthetic Desk Setup" or "Digital Workspace", they love posting it on Pinterest, TikTok, Twitter, and Reddit (`r/desktops`). By adding a subtle "Made with Acrylic" watermark to the exported image, you get free, highly visual marketing.

### C. Programmatic SEO Landing Pages (pSEO)
To capture people actively searching for alternatives to your competitors on Google (not just the Web Store), build a simple landing page website for Acrylic with dedicated comparison pages:
*   `/momentum-dash-alternative`
*   `/tabliss-alternative`
*   `/bonjourr-alternative`
These pages should feature a direct, honest breakdown of why Acrylic's "Local First, Free Forever" Glassmorphism architecture is superior to the bloated or paid competitors.

### D. The Open-Source "Trust" Funnel
Consider hosting the codebase (or an earlier "core" version of it) publicly on **GitHub**. 
*   **Why:** Developers are naturally skeptical of extensions having access to their browser. By making the code readable on GitHub, you earn their ultimate trust. Furthermore, your GitHub repository acts as a secondary SEO channel, as many users search for "open source new tab extension github."
