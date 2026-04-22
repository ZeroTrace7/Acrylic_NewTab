/* ============================================================
   ACRYLIC — modules/brightness.js
   Canvas-based luminosity detector for wallpaper brightness
   adaptation. Flips text to dark on bright backgrounds.
   ============================================================ */

/**
 * Downscaled canvas size for fast luminosity sampling.
 * 32×32 = 1024 pixels — fast enough to run on every wallpaper load
 * while producing an accurate whole-image average.
 */
const SAMPLE_SIZE = 32;

/**
 * Brightness threshold (0–255). Values above this trigger dark text mode.
 * 150 is calibrated to catch white/pastel/snow wallpapers while leaving
 * typical sunset/city/landscape images on the light-text path.
 *
 * IMPORTANT: This threshold is compared against the *effective* brightness,
 * which accounts for the darken overlay. Raw image brightness is multiplied
 * by (1 - darkenFactor) before comparison.
 */
const BRIGHTNESS_THRESHOLD = 150;

/** Debounce duration to avoid flicker during rapid wallpaper changes. */
const DEBOUNCE_MS = 400;

let debounceTimer = 0;
let currentBrightness = 0;

/**
 * Calculates the perceived brightness of an image using the ITU-R BT.709
 * luminosity formula: L = 0.2126·R + 0.7152·G + 0.0722·B
 *
 * @param {string} imageUrl — Direct URL to an image
 * @returns {Promise<number>} Average brightness 0–255
 */
function measureImageBrightness(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const data = imageData.data;
        const pixelCount = data.length / 4;
        let totalLuminance = 0;

        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        }

        resolve(Math.round(totalLuminance / pixelCount));
      } catch {
        // Canvas tainted by CORS — server didn't send Access-Control headers.
        // Fall back to "assume dark background" (0) so the default light text stays.
        resolve(0);
      }
    };

    img.onerror = () => resolve(0);
    img.src = imageUrl;
  });
}

/**
 * Reads the current wallpaper darken factor from the CSS custom property.
 * Returns a value between 0 (no darkening) and ~0.9 (nearly black).
 * Default is 0.3 if the property is missing or invalid.
 */
function getCurrentDarkenFactor() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--bg-darken');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.3;
}

/**
 * Applies or removes the `bg-bright` class on <body>, which flips the
 * CSS custom properties for text and glass tints to dark-on-light variants.
 *
 * @param {number} effectiveBrightness — 0–255 brightness AFTER darken overlay
 */
function applyBrightnessClass(effectiveBrightness) {
  currentBrightness = effectiveBrightness;
  const body = document.body;
  if (!body) return;

  if (effectiveBrightness > BRIGHTNESS_THRESHOLD) {
    body.classList.add('bg-bright');
  } else {
    body.classList.remove('bg-bright');
  }
}

/**
 * Public API — Analyze a wallpaper image and apply brightness adaptation.
 * Debounced to 400ms so rapid wallpaper changes don't cause text flicker.
 *
 * The raw image brightness is reduced by the darken overlay factor
 * (read from --bg-darken CSS variable) before comparison against the
 * threshold. This prevents the catastrophic bug where a bright image
 * (e.g. Unsplash flowers) triggers dark text mode even though the
 * darken overlay makes the actual perceived background dark.
 *
 * @param {string} imageUrl — Direct URL to the wallpaper image
 */
export function detectAndApplyBrightness(imageUrl) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const rawBrightness = await measureImageBrightness(imageUrl);
    const darkenFactor = getCurrentDarkenFactor();
    // Effective brightness = what the user actually sees after the darken overlay
    const effectiveBrightness = Math.round(rawBrightness * (1 - darkenFactor));
    applyBrightnessClass(effectiveBrightness);
  }, DEBOUNCE_MS);
}

/**
 * Public API — Clear brightness adaptation (e.g. when wallpaper is removed).
 * Reverts to default light text.
 */
export function clearBrightnessAdaptation() {
  clearTimeout(debounceTimer);
  currentBrightness = 0;
  document.body?.classList.remove('bg-bright');
}

/**
 * Public API — Returns the last measured brightness value (0–255).
 * This is the effective (post-darken) brightness, not the raw image value.
 */
export function getCurrentBrightness() {
  return currentBrightness;
}
