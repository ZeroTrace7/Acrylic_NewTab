# Glassy Architecture & UX Reference (glassy.md)
1. Core Design Philosophy
Glassy operates on the principle that a browser new tab should be a premium, calming environment, not a cluttered billboard.

Visual Hierarchy: Relies on depth (glassmorphism) and negative space rather than heavy borders or solid colors.

Data Sovereignty: 100% local storage. No external servers. Features JSON export/import for user backups.

Frictionless UX: Interactions (like adding a bookmark) require minimal clicks and feature pre-curated choices rather than forcing the user to do the work.

2. The Glassmorphism Formula (Pixel-Perfect Math)
The biggest mistake in amateur glass UI is the \"milky\" effect (too much opacity, too little blur). Glassy uses a highly calibrated mathematical formula to achieve deep refraction.

The Container (Squircle):

Dimensions: 44px by 44px

Border Radius: 14px (creates the Apple-style squircle, not a harsh square or perfect circle).

Display: flex, perfectly centered (align-items: center, justify-content: center).

The Glass Shader:

Base Fill: background: rgba(255, 255, 255, 0.04) (Ultra-low 4% opacity).

Edge Definition: border: 1px solid rgba(255, 255, 255, 0.08) (Subtle 8% inner glow).

Refraction: backdrop-filter: blur(16px) (Heavy blur to distort the background).

Shadow: Soft ambient drop shadow to separate it from the wallpaper.

3. The High-Fidelity Icon System
Glassy explicitly avoids using generic, colorful web favicons because they break the monochrome theme and pixelate at different sizes.

The 65% Inset Rule: Icons never touch the container edges. They are strictly sized to width: 65%; height: 65%; object-fit: contain;. This creates premium \"negative space.\"

The SVG Dictionary (Primary): Uses a hardcoded JS object containing raw, pristine SVG paths for top apps (YouTube, Gmail, ChatGPT, Notion, etc.).

The evenodd Protocol: Complex logos (like ChatGPT) strictly use fill-rule=\"evenodd\" clip-rule=\"evenodd\" to prevent overlapping vector paths from merging into blobs.

The 128px Fallback (Secondary): If an app isn't in the SVG dictionary, it fetches a high-res Google favicon (sz=128) and forces it into the theme using CSS: filter: brightness(0) invert(1) opacity(0.95); image-rendering: -webkit-optimize-contrast;.

4. Motion & Interaction Design
Animations mimic physical weight and momentum, moving away from basic linear fades.

The Entry Curve: Modals and panels use the \"Ease-Out-Expo\" cubic bezier curve: cubic-bezier(0.16, 1, 0.3, 1).

The Scale-Fade: Elements don't just appear; they grow slightly into place.

0% { opacity: 0; transform: scale(0.96) translateY(12px); }

100% { opacity: 1; transform: scale(1) translateY(0); }

Hardware Acceleration: Heavily utilizes will-change: transform, opacity; and strictly animates transforms, never margins or padding.

5. Layout Architecture (The Grid Fix)
Glassy achieves perfect \"end-to-end\" alignment in its modals (like the Quick Add Library) by abandoning Flexbox in favor of CSS Grid.

The Dense Grid Layout: grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)) ensures tiles stretch perfectly to fill empty space without leaving ragged right edges.

Tile Anatomy: Library tiles are vertical rectangles, keeping icon and text tightly packed (flex-direction: column, gap: 6px) with highly legible micro-typography (font-size: 0.7rem, font-weight: 500).

6. Feature Ecosystem & Roadmap
Based on Glassy's evolution (v1.0.0 to v1.4.0), a premium dashboard must include these distinct modules:

Backgrounds 2.0: Support for high-res wallpapers, hover-to-play GIFs, and smooth crossfade transitions.

Productivity Suite: * Notes: Rich text formatting (Bold, Italic) and, critically, Note Persistence (auto-saving drafts to local storage).

Focus: Zen Mode (minimalist full-screen flip clock) and a Pomodoro timer.

Extensions Manager: In-tab UI to toggle or remove other Chrome extensions using chrome.management.

Smart Search: Central command bar querying Google, DuckDuckGo, and direct AI integrations (ChatGPT/Claude).

7. Preferences & Micro-Interactions
The settings menu is categorized and utilizes physical-feeling controls rather than default browser checkboxes.

Categorized Menus: Settings are split logically (Display, Search, Privacy, Data).

iOS-Style Toggles: Pure CSS sliding switches (width: 40px, height: 24px track) with a white circular thumb that translates along the X-axis upon checking.

Text Depth Implementation: A specific toggle that applies a text-shadow globally (text-shadow: 0 2px 4px rgba(0,0,0,0.5)) to ensure clock and widget text remains readable against very bright or white wallpapers.

Privacy Controls: Explicit toggles to enable/disable Search History.

🚀 The \"Acrylic\" Advantage (How to beat Glassy)
To make Acrylic superior, you must execute the above flawlessly, and then add features Glassy lacks:

Dynamic Theming: Allow the glass tint (the 4% fill) to adapt automatically to the dominant color of the current wallpaper.

Widget Fluidity: Implement a truly free-form drag-and-drop grid (like iOS home screens) rather than fixed zones.

Deeper AI Integration: Allow users to highlight text in their Notes and trigger an inline AI summarization or grammar check directly in the new tab.
