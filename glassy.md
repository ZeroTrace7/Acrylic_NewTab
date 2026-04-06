# Glassy

This document serves as the reverse-engineered knowledge base for "Glassy", the predecessor to the Acrylic Chrome Extension. The information here was extracted directly from the minified production React code of Glassy to ensure feature parity during the Vanilla JS rewrite.

## 🛠 Architecture & Tech Stack

The original Glassy project was built with a modern frontend framework toolchain:
- **Core Library:** React.js (using Hooks like `useState`, `useEffect`, `useRef`)
- **Bundler:** Vite (using standard `index.html` entry point mounting a `<div id="root"></div>` with ES module scripts).
- **Styling:** Tailwind CSS (utility-first CSS)
- **Environment:** Chrome Manifest V3

---

## 🎨 UI & Aesthetics

Glassy achieved a highly premium, modern aesthetic centered around **Glassmorphism**.
- **External Media Capabilities:** The HTML entry point explicitly preconnects to `images.unsplash.com`, `i.gifer.com`, and `media.giphy.com`, implying robust support for dynamically fetching high-resolution photographic wallpapers, live GIFs, or rich background assets.
- **Theming:** Custom linear and radial gradients used for backgrounds (`theme-dark`, `theme-blue`, `theme-espresso`, etc.), along with a text depth effect for readability against bright wallpapers.
- **Glass Effects:** Heavy use of Tailwind's `backdrop-blur-md` (12px to 40px blurs), semi-transparent white backgrounds (`bg-white/10`), and subtle white borders (`border-white/10`) to create floating "glass" cards.
- **Typography:** Relied on Google Fonts: *Poppins* (main interface), *Gloria Hallelujah* (handwritten styles), and *Silkscreen* (digital/mono aesthetics).
- **Animations:** A rich set of custom keyframe animations including `.animate-fadeIn`, `.animate-pop-in-down`, `.animate-slideInRight`, and `.animate-pulse-glow` for buttery-smooth interaction feedback.
- **Logo Design:** Features a vector "squircle" (rounded box) defined by a custom SVG `<path>`, filled with a `<pattern>` that utilizes a raw, high-resolution JPEG gradient/image embedded directly as a base64 string. This enforces the exact premium aesthetic inherently across all environments.

---

## 🧰 Quick Tools Suite

The crown jewel of Glassy was the **Quick Tools Panel**. This was an `absolute` positioned floating widget tray located at the bottom-right of the screen (`bottom-20 right-6`). It housed four interconnected mini-apps accessible via a horizontal tab bar.

### 1. Focus Timer (Pomodoro)
A productivity timer to keep users on task.
- **Modes:** Focus (25m), Short Break (5m), Long Break (15m).
- **Visuals:** A massive circular SVG progress indicator. The stroke dash offsets programmatically based on the percentage of time left. Turns red for Focus, green for breaks.
- **Tracking:** Tally system tracking the user's completed Pomodoro sessions.
- **Interactions:** Plays a local audio cue (`sounds/start.mp3`) when a timer starts.
- **Safety:** Includes a glass modal intercepting accidental timer resets.
- **Mini-Widget:** Ability to pop the timer down into a smaller, less intrusive widget representation.

### 2. NotePad
A built-in markdown/text note-taking tool.
- **Layout:** Displays notes in a masonry grid (`columnCount: 2`) to accommodate varying text lengths beautifully without gaps.
- **CRUD Operations:** Users can create, read, update, and completely delete notes.
- **Exporting:** Features highly requested export tooling. Users can encode a note into a Blob and trigger a download as a `.txt` file. There is also a "Download All" feature that collates every note into a single timestamped text dump.
- **Clipboard:** Quick-copy icon on hover for instantaneous text grabbing.

### 3. Tabs Manager
A session management tool to help declutter the browser.
- **Saving Sessions:** Grabs the array of currently open tabs by calling `chrome.runtime.sendMessage({type: "GET_TABS"})` to the background worker. Saves them locally as a named entity (e.g., "Work Group").
- **Restoration:** Allows users to bulk-open an entire saved collection of URLs at once using `chrome.tabs.create`.
- **Views:** 
  - *Grid View:* Renders up to 12 mini circular favicons of the saved sites in a tight grid.
  - *List View:* Renders a standard vertical list of site titles and domains.

### 4. Extensions Manager
An internal dashboard to police other installed chrome extensions.
- **API Setup:** Utilizes `chrome.management.getAll()` and `setEnabled()` (requires the `management` permission).
- **Views:** Tab-based filtering for "All", "Active", and "Off" extensions. Includes a live search bar.
- **Interactivity:** One-click toggles swap extensions between enabled and disabled states. Disabled extensions visually dim out using a `grayscale` CSS filter.
- **Safeguards:** 
  - Prevents the user from accidentally disabling the Glassy extension itself, displaying the warning: *"Wait, you are using me to disable me? 😒"*.
  - Detects if a user has more than 15 active extensions and throws a warning banner stating: *"Heavy extension load detected"*.

---

## ⚙️ Background Service Worker & APIs

The `background.js` (Manifest V3 Service Worker) reveals deep system integrations that power the frontend widgets:

- **Timer State & Alarms:** The Pomodoro timer does not run on the frontend. It uses `chrome.alarms` to track sessions reliably in the background, syncing progress to `chrome.storage.local`.
- **Offscreen Audio:** Since MV3 service workers cannot play audio, Glassy uses a dedicated `offscreen.html` document with the `AUDIO_PLAYBACK` reason to play the `sounds/end.mp3` chime when a timer alarm fires.
- **Rich Notifications:** It pushes native system notifications when a focus block finishes, complete with action buttons (e.g., "Start Short Break") that trigger the next alarm directly from the notification.
- **Context Menu Integration:** On installation, a "Save to Glassy Notes" option is injected into the browser's right-click context menu. Users can highlight any text on the web, right-click, and instantly save it as a new note in the NotePad widget.
- **Daily Resets:** A midnight chron-job alarm (`dailyReset`) clears the daily Pomodoro tally.
- **Manifest Permissions:** To achieve these integrations, the Manifest V3 requires `storage`, `tabs`, `topSites`, `notifications`, `alarms`, `contextMenus`, `management`, and `offscreen`.
- **Web Accessible Resources:** Crucially, the `sounds/start.mp3`, `sounds/end.mp3` files and the `offscreen.html` must be explicitly declared as web accessible resources to bypass Chrome sandbox blocks.

---

## 🚀 The Migration Goal (Glassy -> Acrylic)

The transition from Glassy to Acrylic is fundamentally a **de-bloating and optimization exercise**. The original `newtab.js` artifact is an enormous 300KB+ compiled bundle containing `react`, `react-dom`, and `scheduler` overhead. Acrylic aims to achieve 100% feature and visual parity with Glassy, but entirely through **Vanilla JavaScript**. 

This means stripping out the React engine, removing the massive 10,000+ line Tailwind CSS compilation stylesheet, and rewriting the Quick Tools logic using native DOM elements, `Object.assign` styling, and isolated CSS variables—all packaged in a pure zero-dependency Manifest V3 setup.
