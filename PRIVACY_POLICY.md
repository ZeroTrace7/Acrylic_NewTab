# Privacy Policy — Acrylic: New Tab

**Last Updated:** April 25, 2026
**Extension Name:** Acrylic - New Tab
**Developer:** Shreyash Gupta
**Manifest Version:** 3

---

## 1. Data Collection Statement

Acrylic collects **zero** user data. Zero telemetry. Zero analytics. Zero tracking. Zero advertising. All data processing occurs 100% locally on your device. No user information is collected, transmitted, stored on external servers, or shared with any third party at any time and under any circumstances.

Specifically, Acrylic does **not** collect, process, or transmit:

- Personally identifiable information (name, email, address, phone number, government ID)
- Browsing history, navigation patterns, or page visit data
- Search queries entered in the integrated search bar
- Keystroke data, mouse movements, or interaction telemetry
- Device fingerprints, hardware identifiers, or IP addresses
- Geolocation data
- Financial or payment information
- Health information
- Authentication credentials
- User-generated content created within the extension (tasks, notes, Quick Links)
- Behavioral analytics, session recordings, or usage metrics

**No data leaves the user's browser. Acrylic does not operate any external servers, databases, APIs, or cloud infrastructure.**

---

## 2. Data Storage

All user-created data — including tasks, notes, clipboard history, Quick Links, Pomodoro session records, and personalization preferences — is stored **exclusively on the user's local device** using Chrome's built-in storage APIs:

| Storage API | Data Stored | Scope |
|---|---|---|
| `chrome.storage.sync` | Lightweight preferences (theme selection, clock format, greeting name, search engine choice) | Syncs across the user's Chrome browsers via their Google account. This is a native Chrome platform feature — no Acrylic server is involved. |
| `chrome.storage.local` | Application data (tasks, notes, clipboard history, Quick Links, tab groups, Pomodoro statistics) | Remains exclusively on the user's local device. |

No external databases, IndexedDB wrappers, or custom caching layers are used. Data portability is provided through a user-initiated JSON Export/Import function accessible via the Preferences panel, which writes and reads files on the user's local filesystem only.

---

## 3. Network Requests

Acrylic makes **no unsolicited, autonomous, or background network requests**. All external communication is user-initiated and strictly limited to the following:

### 3.1 Favicon Retrieval
When a user adds a website to Quick Links, Acrylic retrieves the site's favicon image from:
- **Primary:** `https://t0.gstatic.com/faviconV2` (Google's public favicon service)
- **Fallback:** `https://icon.horse/icon/` (public favicon CDN)

Only the target website's domain name is transmitted in these requests. No user data, session identifiers, cookies, or authentication tokens are included.

### 3.2 Search Engine Favicons
The integrated search bar displays small favicon icons for search engines (Google, Bing, DuckDuckGo, Brave, YouTube, Perplexity, ChatGPT, Claude, Grok). These icons are loaded from their respective public `/favicon.ico` endpoints. No search queries or user data are transmitted during icon loading.

### 3.3 Custom Wallpapers
If a user provides a URL for a custom wallpaper image, Acrylic loads that image directly. No data is sent to any server — the image is simply rendered in the browser.

### 3.4 YouTube Video Wallpapers
If a user uses a YouTube video as a wallpaper, an embedded YouTube player (via `youtube-nocookie.com`) is loaded within a sandboxed iframe. This connection is governed by the [YouTube Terms of Service](https://www.youtube.com/t/terms) and the [Google Privacy Policy](https://policies.google.com/privacy). Acrylic does not transmit any additional data to YouTube beyond the embed request. YouTube host permissions are **optional** and only requested at runtime when the user configures a YouTube wallpaper.

### 3.5 Declarative Net Request (YouTube Referer)
If YouTube wallpaper functionality is enabled and the user grants the optional `declarativeNetRequestWithHostAccess` permission, Acrylic injects a `Referer` header on YouTube embed requests to enable playback. This is a browser-level network rule — no user data is transmitted.

---

## 4. Third-Party Services

Acrylic does **not** integrate with, load, or embed any third-party analytics, advertising, data-processing, or tracking services. Specifically:

- No analytics SDKs (Google Analytics, Mixpanel, Amplitude, Segment, PostHog, or equivalent)
- No advertising networks or ad-serving scripts
- No tracking pixels, web beacons, or conversion tags
- No A/B testing or experimentation platforms
- No crash reporting services (Sentry, Bugsnag, or equivalent)
- No customer data platforms (CDPs) or data management platforms (DMPs)
- No social media tracking widgets or share button scripts
- No external fonts loaded from CDNs (all fonts are bundled locally within the extension package)

---

## 5. Permission Justification

Acrylic requests only the minimum browser permissions strictly necessary for its local-only functionality. Each permission is justified below. **No permission is used to collect, read, transmit, or monitor user browsing activity or personal data.**

### 5.1 Static Permissions (Granted at Install)

| Permission | Functionality | Data Transmission |
|---|---|---|
| `storage` | Persists all user data (tasks, notes, preferences, Quick Links, Pomodoro stats) locally via `chrome.storage.sync` and `chrome.storage.local`. | **None.** All data remains on-device. `chrome.storage.sync` uses Chrome's native sync infrastructure — Acrylic has no access to or control over this transport layer. |
| `topSites` | Populates the bottom Quick Links row with the user's most-visited sites via `chrome.topSites.get()`. | **None.** The top sites list is provided by Chrome's local history database and never leaves the device. |
| `notifications` | Displays desktop notifications when a Pomodoro timer session (focus, short break, or long break) completes. | **None.** Notifications are rendered locally by the operating system. |
| `alarms` | Schedules Pomodoro timer intervals and daily statistic resets via `chrome.alarms.create()`. | **None.** Alarms execute locally within the browser's alarm scheduler. |
| `contextMenus` | Creates a "Save to Acrylic Notes" option in the browser's right-click context menu, allowing users to save selected text to their local notes. | **None.** The selected text is saved to `chrome.storage.local` on the user's device. |
| `offscreen` | Creates an offscreen document to play Pomodoro ambient audio (rain, cafe, fireplace) using the Web Audio API while the New Tab page is not focused. | **None.** Audio files are bundled locally within the extension package. |
| `management` | Powers the Extensions panel in Quick Tools, allowing users to view and toggle their installed Chrome extensions via `chrome.management.getAll()` and `chrome.management.setEnabled()`. | **None.** Extension metadata is provided by Chrome's local extension registry and never leaves the device. |

### 5.2 Optional Permissions (Requested at Runtime)

These permissions are **not** granted at install. They are requested only when the user actively attempts to use the corresponding feature.

| Permission | Functionality | When Requested | Data Transmission |
|---|---|---|---|
| `tabs` | Powers the Tab Manager panel in Quick Tools, allowing users to view, switch to, close, save, and restore open browser tabs. | Requested the first time the user opens the Tab Manager panel. | **None.** Tab metadata (title, URL, favicon) is provided by Chrome's local tab registry and never leaves the device. |
| `declarativeNetRequestWithHostAccess` | Injects a `Referer` header on embedded YouTube video requests to enable wallpaper playback. | Requested when the user configures a YouTube video wallpaper. | **None.** This modifies a browser-level network header. No user data is transmitted. |

### 5.3 Optional Host Permissions

| Host Pattern | Functionality | Data Transmission |
|---|---|---|
| `https://youtube.com/*`, `https://www.youtube.com/*`, `https://youtube-nocookie.com/*`, `https://www.youtube-nocookie.com/*` | Required for the `declarativeNetRequest` rule that sets the `Referer` header on YouTube embed requests. | **None** beyond the YouTube embed request itself, which is governed by the [Google Privacy Policy](https://policies.google.com/privacy). |

### 5.4 Permissions NOT Requested

Acrylic does **not** request and will never request the following permissions:

- `<all_urls>` or broad host permissions
- `webRequest` or `webRequestBlocking`
- `history` or `bookmarks`
- `geolocation`
- `identity` or `identity.email`
- `cookies`
- `debugger`
- `desktopCapture` or `tabCapture`
- `webNavigation`
- `contentSettings`
- `privacy`

---

## 6. Chrome Web Store User Data Policy Compliance

The use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.

Acrylic's compliance with the Limited Use requirements is as follows:

- **Transfer restriction:** Acrylic does not transfer any data obtained from Google APIs to any external server, third party, or remote endpoint.
- **Use restriction:** Data obtained from Google APIs (including `chrome.storage`, `chrome.tabs`, `chrome.topSites`, and `chrome.management`) is used solely to provide the user-facing functionality described in this policy.
- **Display restriction:** User data obtained from Google APIs is displayed only within the extension's New Tab interface and is never exposed to external services.
- **Human access restriction:** No Acrylic developer, contributor, or third party has access to user data stored by the extension, because no user data is transmitted to any server or infrastructure under any party's control.

---

## 7. Data Sharing

Acrylic does **not** share, sell, rent, license, trade, or disclose any user data to any third party, under any circumstances. There is no data to share because no data is collected or transmitted.

---

## 8. Data Export, Portability, and Deletion

Users maintain complete control over their data at all times:

- **Export:** All Acrylic data (preferences, tasks, notes, Quick Links, Pomodoro statistics) can be exported as a JSON file at any time via the Preferences panel.
- **Import:** A previously exported JSON file can be imported to restore data on any Chrome installation.
- **Deletion:** Uninstalling the Acrylic extension **permanently and irrevocably** removes all data stored in `chrome.storage.sync` and `chrome.storage.local`. No residual data remains on any external server, because no external server was ever used at any point during the extension's operation.

---

## 9. Children's Privacy

Acrylic does not knowingly collect any information from children under the age of 13 (or the applicable age of digital consent in the user's jurisdiction). Since Acrylic collects no data from any user of any age, this provision is satisfied by design.

---

## 10. Hosting Infrastructure Disclaimer

This privacy policy document is hosted on GitHub Pages (`github.io`). While Acrylic itself collects zero data, the hosting platform (GitHub, a subsidiary of Microsoft Corporation) may collect standard technical information — such as IP addresses, browser type, and server access logs — when you visit this page. This data collection is governed by the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) and is entirely separate from and unrelated to the Acrylic extension's operation.

The Acrylic extension's data practices are limited exclusively to the behavior described in Sections 1 through 8 of this document. The hosting of this policy document does not imply any data collection by the Acrylic extension itself.

---

## 11. Changes to This Policy

If this privacy policy is updated, the "Last Updated" date at the top of this document will be revised. Since Acrylic collects no user data, future changes would only involve clarifying language, addressing new browser features, or documenting new optional permissions for future versions of the extension.

Users are encouraged to review this policy periodically. Continued use of the Acrylic extension after a policy update constitutes acceptance of the revised terms.

---

## 12. Contact

If you have questions, concerns, or requests regarding this privacy policy, please contact the developer:

- **GitHub Issues:** [github.com/ZeroTrace7/Acrylic_NewTab/issues](https://github.com/ZeroTrace7/Acrylic_NewTab/issues)
- **Developer:** Shreyash Gupta

---

**Acrylic — Premium glassmorphism New Tab for Chrome.**
**Zero telemetry. Zero accounts. Zero paywalls. 100% local.**
