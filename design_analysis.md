# Acrylic Glassmorphism Design System Analysis

The Acrylic project utilizes a highly calibrated "premium glassmorphism" design system. The goal of this system is to create a frictionless, locally-stored, visually calming environment emphasizing negative space, specific animation physics, and careful transparency, rather than relying on heavy borders or solid backgrounds.

Based on the core reference documents (`glassy.md`, `README.md`) and the CSS architecture (`components.css`, `panels.css`, `quicktools.css`), future UI elements must adhere to the following rules:

## 1. Container & Shape (The Squircle)

Acrylic specifically avoids sharp squares or perfect circles in favor of a squircle geometry.

* **Border Radius**: Containers (especially icons and app tiles) use a `border-radius: 14px;` for 44x44px elements. Larger panels use `20px` or `22px`.
* **Standard Dimensions**: Icon containers are frequently `44px` by `44px`.

## 2. The Glass Shader Formula (Pixel-Perfect Math)

To avoid a "milky" UI (too much opacity, too little blur), the design strictly defines refraction math.

* **Base Fill (Subtle/Low Opacity)**: `background: rgba(255, 255, 255, 0.04)` to `0.08`.
* **Edge Definition (Inner Glow)**: `border: 1px solid rgba(255, 255, 255, 0.08)` to `0.14`.
* **Refraction (Heavy Blur)**: `backdrop-filter: blur(16px)` to `blur(20px)`.
* **Shadows**: Soft ambient drop shadows. For instance, panels use `box-shadow: 0 24px 64px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08)`. The inset white shadow gives an upper highlight.

## 3. High-Fidelity Icons & Negative Space

Icons are meant to look premium, monochromatic, and cleanly vectored.

* **The 65% Inset Rule**: Icons within a container must not touch the edges. They are sized to `width: 65%; height: 65%; object-fit: contain;` to provide substantial negative space.
* **SVG Guidelines**: Complex SVGs use `fill-rule="evenodd" clip-rule="evenodd"` to prevent overlaps from turning into solid blobs.
* **Fallback Icon Filter**: Generic 128px fallback favicons are forced to fit the theme using CSS filters: `filter: brightness(0) invert(1) opacity(0.95); image-rendering: -webkit-optimize-contrast;`.

## 4. Motion & Animations (Physical Momentum)

Animations are driven by specific mathematical curves that mimic physical weight, avoiding linear fades.

* **The Entry Curve (Ease-Out-Expo)**: All major transitions and panels use `cubic-bezier(0.16, 1, 0.3, 1)`.
* **Scale-Fade Effect**: Modals do not instantly appear; they grow slightly into place.
  * Start: `opacity: 0; transform: scale(0.96) translateY(12px);`
  * End: `opacity: 1; transform: scale(1) translateY(0);`
* **Hover Interactions**: Elements usually scale up (`transform: scale(1.035)` or `scale(1.05)`) on hover and shrink on active (`transform: scale(0.96)`).
* **Hardware Acceleration**: Elements meant to animate use `will-change: transform, opacity;`.

## 5. Typography

Typography utilizes strict legibility variables to offset the glass transparency.

* **Geist Font**: Quick Tools and other major panels strictly scope their text to `--font-ui: 'Geist', sans-serif;`.
* **Text Shadows**: Text uses depth shadows (`text-shadow: var(--dashboard-text-depth-soft)`) to remain readable against very bright wallpapers.
* **Visual Hierarchy**: Titles are typically uppercase with letter spacing (`letter-spacing: 0.08em` to `0.12em`), while descriptions use muted semi-transparent colors (`rgba(226, 232, 240, 0.55)` or `var(--text-muted)`).

## 6. Layout Architecture (The Grid Fix)

For dense arrangements (like quick links), CSS Grid is heavily favored over Flexbox to ensure clean right edges and mathematically aligned spacing.

* **Dense Grids**: Uses structures like `grid-template-columns: repeat(auto-fit, minmax(76px, 1fr))`.
* **Micro-Typography**: List elements usually have small, tightly packed fonts (`font-size: 0.65rem` to `0.7rem`, `font-weight: 500`).

## Summary

When suggesting or creating new UI components for Acrylic, you must reference this document. Ensure that opacities stay low (`~4-8%`), blurs stay high (`~16px`), transitions use `cubic-bezier(0.16, 1, 0.3, 1)`, components use `Geist` typography, and the layout adheres to the squircle `14px/20px` border-radius standards.