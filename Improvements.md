# 🚀 Acrylic: Strategic Architecture & Roadmap

This document tracks the competitive positioning, implemented features, and future roadmap for **Acrylic**.

---

## 1. Competitive Landscape (Reference)

The new tab market is bifurcated into legacy conglomerates, modern aesthetic minimalists, and emerging glassmorphic dashboards. Acrylic occupies the precise intersection: **premium glassmorphism + full productivity suite + zero telemetry + zero paywalls.**

| Vector | Acrylic | Momentum | Tabliss | Bonjourr |
|---|---|---|---|---|
| **Performance** | Sub-100ms (native MV3 ESM) | 200–400ms (React+SW) | 150–300ms | 120–250ms |
| **Privacy** | Zero telemetry, local-only | Account required | Local-first | Local-first |
| **Productivity** | Tasks, Pomodoro, Notes, Tabs, Extensions | Paywalled | None | None |
| **Cost** | Free forever | ~$40/yr | Free | Free |

---

## 2. v1.0 — Shipped Features

All items below are implemented and validated in the current codebase.

- ✅ **MV3 Native Architecture** — Pure ES modules, no bundler, no transpiler, no service worker dependency
- ✅ **Aggressive DOM Lazy-Loading** — Pomodoro, Notes, Tabs, Extensions panels injected on demand
- ✅ **Glassmorphism 2.0** — Semi-opaque sub-layers, 1px delineation borders, grain texture, dark inner shadows
- ✅ **Micro-Animations** — Sub-800ms staggered entry animation, scribble-strike tasks, cubic-bezier panels
- ✅ **WCAG Focus Ring** — Glass-themed `:focus-visible` ring
- ✅ **Keyboard Shortcuts** — `Ctrl+K`, `T`, `Ctrl+,`, `/`, `Escape`
- ✅ **Quick Links** — 3 visual modes (sidebar dock, bottom row, manage panel), 50-app SVG preset library, drag reorder
- ✅ **Privacy Sovereignty** — Zero telemetry, `chrome.storage.sync/local` only, JSON export/import, least-privilege permissions
- ✅ **Dynamic Background Brightness Adaptation** — Canvas-based luminosity detector auto-flips text color on bright wallpapers
- ✅ **`prefers-reduced-transparency`** — Solid opaque panels for users with accessibility needs
- ✅ **`prefers-reduced-motion`** — Disables all entry animations

---

## 3. v2.0 — Future Roadmap

Items below are deferred to post-launch updates to maintain a razor-sharp v1.0 scope.

### v2.1 — i18n / Localization
- Scaffold `_locales/` directory with `chrome.i18n` API integration
- Target languages: English, Spanish, German, Brazilian Portuguese, Hindi
- RTL direction support for Arabic/Hebrew
- **Why deferred:** Managing 5+ language files and wrapping every string adds massive QA overhead. Launch in English first, validate the product, then push i18n for international CWS SEO growth.

### v2.2 — Time-of-Day Dynamic Themes
- Auto-blend themes based on local time (sunrise → deep-blue → espresso → rose-noir → midnight)
- New pref: `autoTheme` (boolean)
- **Why deferred:** Users can manually pick themes in v1. This is a premium differentiator for a marketing push in a later update.

### v2.3 — Pomodoro → Task Linking
- "Link to Task" dropdown in the Pomodoro panel
- Completed focus sessions increment `pomodorosLogged` on linked tasks
- `🍅×N` badge on tasks with logged Pomodoros
- **Why deferred:** Building gamification before having users to retain is premature. Ensure both tools are bug-free first as separate silos.

### v2.4 — Focus Streak Tracking
- Track daily focus activity: `currentStreak`, `longestStreak`, 7-day heat strip
- Non-punitive: missing a day stops growth but doesn't reset the streak
- **Why deferred:** Same rationale as Pomodoro linking — retention mechanics come after user acquisition.

### v2.5 — Share Your Setup (Snapshot Export)
- Canvas-based branded screenshot with "Made with Acrylic ✦" watermark
- Export as PNG or copy to clipboard for social sharing
- **Why deferred:** Building a full DOM-to-Canvas renderer in vanilla JS is a massive engineering task. Let users take native screenshots for v1.

    

## 4. Why Incumbents Can't Copy This

1. **Business Model Conflict:** Momentum generates revenue from $40/yr cloud subscriptions. Going offline kills their revenue stream.
2. **Telemetry Value:** Legacy extensions rely on behavioral data for marketing and funding. Zero-telemetry strips this away.
3. **Technical Debt:** Rewriting React/Vue + Webpack to pure Vanilla ESM is prohibitively expensive for millions of legacy users.
4. **Disruption Opportunity:** Acrylic carries zero technical debt and no legacy revenue streams. Built natively for MV3 from day one.
