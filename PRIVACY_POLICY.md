# Privacy Policy — Acrylic: New Tab

**Last Updated:** April 19, 2026

---

## Overview

Acrylic is a Chrome browser extension that replaces your New Tab page with a premium glassmorphism productivity dashboard. This privacy policy explains what data Acrylic collects (none), how your data is stored (locally on your device), and how your privacy is protected.

**In short: Acrylic does not collect, transmit, or sell any user data. Period.**

---

## Data Collection

Acrylic collects **zero** user data. Specifically:

- **No analytics or telemetry** — Acrylic does not track page views, clicks, usage patterns, or behavioral metrics of any kind.
- **No personal information** — Acrylic does not ask for, store, or process your name, email address, location, or any personally identifiable information.
- **No account creation** — Acrylic does not require sign-up, login, or authentication of any kind.
- **No advertising** — Acrylic contains no advertisements and does not collect data for advertising purposes.
- **No cookies or fingerprinting** — Acrylic does not use cookies, browser fingerprinting, or any tracking technology.

---

## Data Storage

All of your data — including tasks, notes, preferences, themes, Quick Links, and Pomodoro session history — is stored **exclusively on your device** using Chrome's built-in storage APIs:

- **`chrome.storage.sync`** — Used for lightweight preferences (such as theme choice and clock format) that sync across your Chrome browsers via your Google account. This is a native Chrome feature and does not involve any Acrylic servers.
- **`chrome.storage.local`** — Used for application data (such as tasks, notes, and clipboard history) that remains on your local device.

Acrylic does **not** operate any external servers, databases, or cloud infrastructure. Your data never leaves your browser.

---

## Network Requests

Acrylic makes **no unsolicited network requests**. The only external communication is:

- **Favicon fetching** — When you add a website to Quick Links, Acrylic retrieves the site's favicon image via `https://www.google.com/s2/favicons`. This is a standard, publicly available Google service. No user data is transmitted in this request — only the domain name of the website you added.
- **Custom wallpapers** — If you choose to set a custom wallpaper by providing a URL, Acrylic will load that image from the URL you specified. No data is sent to any server; the image is simply displayed in your browser.
- **YouTube wallpapers** — If you choose to use a YouTube video as a wallpaper, an embedded YouTube player is loaded. This is governed by YouTube's own privacy policy. Acrylic does not transmit any additional data to YouTube.

---

## Third-Party Services

Acrylic does **not** integrate with any third-party analytics, advertising, or data-processing services. There are no SDKs, no tracking pixels, and no external scripts loaded by the extension.

---

## Permissions

Acrylic requests only the minimum browser permissions necessary for its core functionality:

| Permission | Why It's Needed |
|---|---|
| `storage` | Save your preferences, tasks, notes, and Quick Links locally |
| `search` | Enable the integrated search bar |
| `topSites` | Display your most-visited sites in the bottom Quick Links row |
| `notifications` | Alert you when a Pomodoro timer session completes |
| `alarms` | Schedule Pomodoro timer intervals and daily statistic resets |
| `contextMenus` | Provide the "Save to Acrylic Notes" right-click option |
| `offscreen` | Play Pomodoro ambient sounds in the background |
| `management` | Power the Extensions panel in Quick Tools |

**Optional permissions (requested at runtime only when needed):**

| Permission | Why It's Needed |
|---|---|
| `tabs` | Power the Tabs panel in Quick Tools — **only requested when you open the Tab Manager for the first time** |

No permission is used to read, modify, or monitor your browsing activity. The `tabs` permission is only requested on-demand when you actively choose to use the Tab Manager feature. The `management` permission is used solely to display installed extensions within Acrylic's Quick Tools panel — it is **never** used to track or log your browsing history.

---

## Data Sharing

Acrylic does **not** share, sell, rent, or trade any user data with any third party, under any circumstances. There is no data to share because no data is collected.

---

## Data Export & Deletion

You are in complete control of your data at all times:

- **Export:** You can export all your Acrylic data (preferences, tasks, notes, Quick Links) as a JSON file at any time via the Preferences panel.
- **Import:** You can import a previously exported JSON file to restore your data.
- **Deletion:** Uninstalling the Acrylic extension permanently removes all locally stored data. No residual data remains on any external server because no external server was ever used.

---

## Children's Privacy

Acrylic does not knowingly collect any information from children under the age of 13. Since Acrylic collects no data from any user, this policy applies equally to all users regardless of age.

---

## Changes to This Policy

If this privacy policy is updated in the future, the changes will be reflected in this document with an updated "Last Updated" date. Since Acrylic collects no data, any future changes would only involve clarifying language or addressing new browser features.

---

## Contact

If you have any questions about this privacy policy, please open an issue on the [Acrylic GitHub repository](https://github.com/AcrylicTab/Acrylic).

---

**Built by Shreyash Gupta**
**Acrylic — Premium glassmorphism New Tab for Chrome.**
