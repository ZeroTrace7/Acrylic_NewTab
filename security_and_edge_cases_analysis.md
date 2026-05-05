# Security and Edge Cases Analysis for Acrylic New Tab

This report analyzes potential security risks (such as XSS, storage misuse, and permissions) and UI/Logic edge cases within the Acrylic New Tab extension.

## 1. Security Risks

### 1.1 Cross-Site Scripting (XSS) via `innerHTML`
- **Issue:** The codebase heavily uses `document.createElement()` and `textContent`, which is an excellent practice for preventing XSS. However, there are instances where `innerHTML` is used to render user-provided or externally sourced data.
- **Specific Instances:**
  - `modules/quicklinks.js`: `iconEl.innerHTML = iconData;` and `tile.innerHTML = iconData;`. While `iconData` often comes from a local static map (`MONO_ICONS`), if any link dynamically fetches or constructs `iconData` (e.g., from an external SVG or raw favicon fetch without sanitization), it could be a vector for XSS.
  - `panels/clipboard.js`: `pre.textContent = item.content;` is used safely, but other parts of the UI might inject dynamic strings into `innerHTML` for SVG rendering.
  - `panels/notes.js`, `panels/tabs.js`, `panels/pomodoro.js`, `panels/extensions.js`, `settings/settings.js`, `modules/search.js`, `modules/tasks.js`: `innerHTML` is largely used for inserting static SVG strings or controlled template literals.
- **Mitigation:**
  - Continue enforcing the rule to only use `textContent` and `createElement` for user-generated data (Notes, Tasks, Tab Names, Extension Names, Custom Link URLs/Titles).
  - When rendering SVGs or external icons (e.g., in Quick Links), ensure the source is strictly from trusted local JSON/objects. If an external SVG must be rendered, use `DOMParser` to parse the string into a document, sanitize it (e.g., remove `<script>`, `onload` attributes), and append the nodes rather than using `innerHTML`.

### 1.2 Storage Misuse & Quota Exhaustion
- **Issue:** The extension uses `chrome.storage.local` for Notes, Tasks, Clipboard History, and Tab Groups. `chrome.storage.sync` is used for user preferences.
  - `modules/storage.js` stores notes with keys like `note_{id}` and maintains a `noteIds` index. It intelligently limits the `searchHistoryItems` to 8 and `clipboardItems` to 20.
  - However, Notes (`getNote`, `saveNote`) do not appear to have a strict length or count limit enforced in the storage module. While Chrome's `storage.local` quota is large (5MB default, up to unlimited if requested, though `unlimitedStorage` is not in manifest), storing excessively large notes (e.g., pasting a 10MB string or thousands of notes) could exhaust the quota, leading to silent failures or extension crashes when saving.
- **Mitigation:**
  - Implement a maximum length restriction for note content on the UI side (e.g., max 50,000 characters per note) and potentially limit the total number of notes.
  - Add explicit error handling for `chrome.runtime.lastError` indicating quota exceeded during `chrome.storage.local.set` operations, and gracefully alert the user via a `toast`.

### 1.3 Permissions Review
- **Issue:** The `manifest.json` defines several permissions:
  - `"permissions": ["storage", "topSites", "notifications", "alarms", "contextMenus", "offscreen", "management"]`
  - `"optional_permissions": ["tabs", "declarativeNetRequestWithHostAccess"]`
  - `"optional_host_permissions": ["https://youtube.com/*", "https://www.youtube.com/*", "https://youtube-nocookie.com/*", "https://www.youtube-nocookie.com/*"]`
- **Analysis:**
  - The use of `optional_permissions` and `optional_host_permissions` for Tabs and YouTube wallpapers is an excellent application of the Principle of Least Privilege.
  - `topSites` is required for the Most Visited widget.
  - `management` is required for the Extensions panel.
  - `offscreen` might be used for audio (Pomodoro timer ticking) or advanced clipboard operations, which is appropriate for Manifest V3.
- **Mitigation:**
  - The permissions architecture is currently secure and optimal. Ensure that when requesting optional permissions (e.g., `chrome.permissions.request`), the failure states (user denies) are always handled gracefully, as is currently done in `tabs.js`.

## 2. UI and Logic Edge Cases

### 2.1 Notes & Tasks Overflow
- **Edge Case:** Very long single words (e.g., a URL without spaces) in a Note or Task could break the layout.
- **Mitigation:** Ensure CSS `word-wrap: break-word;` or `word-break: break-all;` is applied to note content elements (`.qt-note-card-body`, `.qt-note-content`) and task text elements.

### 2.2 Rapid Interaction (Race Conditions)
- **Edge Case:** The user might rapidly click the "Save" button in the Note editor or repeatedly toggle a Task's status before the storage promise resolves.
- **Mitigation:** Disable actionable buttons (e.g., Save, Delete) immediately upon click and re-enable them only after the asynchronous operation (storage read/write) completes.

### 2.3 Clipboard History - Permissions & Async Read
- **Edge Case:** The Clipboard panel (`panels/clipboard.js`) continuously monitors for `copy` and `cut` events. If the user copies something massive (e.g., copying a massive image blob or a 50MB log file), reading and storing it might fail or lag the extension.
- **Mitigation:** Implement a strict size limit on what text is captured from the clipboard before attempting to save it to storage. Ignore payloads over a certain threshold.

### 2.4 Wallpaper Image Loading & Brightness Calculation
- **Edge Case:** If a user provides an invalid URL or a massive image (e.g., an 8K 50MB uncompressed PNG) for the background, the timeout in `validateWallpaperImage` (`WALLPAPER_LOAD_TIMEOUT_MS`) might trigger unnecessarily, or the canvas rendering for brightness calculation (`brightness.js`) might stall the main thread, causing jank.
- **Mitigation:**
  - When drawing the image to the offscreen canvas for brightness sampling, heavily downscale the image (e.g., limit canvas dimensions to `50x50` pixels). This keeps the average brightness calculation instantaneous regardless of source image size.

### 2.5 Time Zone / Date Roll-Over
- **Edge Case:** The `dailyCount` for Pomodoro (`modules/storage.js` -> `getDailyStats`) checks `new Date().toISOString().split('T')[0]`. This relies on UTC date strings, which might mismatch the user's local date/time (e.g., it might be Tuesday in local time, but already Wednesday in UTC).
- **Mitigation:** Use local date string comparison instead of `toISOString()` for daily stats. For example:
  ```javascript
  const today = new Date();
  const localDateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  ```

## Conclusion
The Acrylic codebase demonstrates strong architectural decisions regarding privacy (local-first) and security (avoiding inline scripts, using optional permissions, primarily using `textContent`). Prioritizing strict storage quota handling, local timezone synchronization, and large-data truncation will further harden the extension.
