import { Prefs } from './storage.js';
import { toast } from './toast.js';
import { bus } from './event-bus.js';
import { detectAndApplyBrightness, clearBrightnessAdaptation } from './brightness.js';

const THEMES = [
  { id: 'midnight',  label: 'Midnight'  },
  { id: 'deep-blue', label: 'Deep Blue' },
  { id: 'aurora',    label: 'Aurora'    },
  { id: 'rose-noir', label: 'Rose Noir' },
  { id: 'espresso',  label: 'Espresso'  },
  { id: 'forest',    label: 'Forest'    },
  { id: 'carbon',    label: 'Carbon'    },
  { id: 'synthwave', label: 'Synthwave' },
];
export { THEMES };

let currentTheme = 'midnight';
let currentWallpaperUrl = '';
let wallpaperRequestId = 0;
let currentBlobUrl = '';
let backgroundTransitionToken = 0;
let themeRevealTimer = 0;

const WALLPAPER_LOAD_TIMEOUT_MS = 15000;
const WALLPAPER_FADE_MS = 400;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const THEME_CROSSFADE_MS = 600;
const WALLPAPER_CROSSFADE_MS = 600;

function getBodyEl() { return document.body; }
function getWallpaperFadeDuration() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : WALLPAPER_FADE_MS;
}

function normalizeTheme(themeId) {
  return THEMES.some((t) => t.id === themeId) ? themeId : 'midnight';
}

function applyTheme(themeId) {
  const nextTheme = normalizeTheme(themeId);
  currentTheme = nextTheme;
  const body = getBodyEl();
  if (!body) return;
  [...body.classList]
    .filter((c) => c.startsWith('theme-'))
    .forEach((c) => body.classList.remove(c));
  body.classList.add(`theme-${nextTheme}`);
  if (!currentWallpaperUrl) body.classList.remove('has-wallpaper');
  bus.dispatchEvent(new CustomEvent('themeChanged'));
}

/**
 * Cinematic ghost-layer crossfade for palette-to-palette transitions.
 * Snapshots the current #theme-layer computed background, swaps the class
 * underneath, and fades the snapshot away to reveal the new theme.
 */
function crossfadeTheme(newThemeId) {
  const body = getBodyEl();
  const themeLayer = document.getElementById('theme-layer');
  if (!body || !themeLayer) {
    applyTheme(newThemeId);
    return;
  }

  // Skip cinematic if wallpaper is active (theme layer is opacity:0 anyway)
  if (body.classList.contains('has-wallpaper')) {
    applyTheme(newThemeId);
    return;
  }

  // Skip cinematic if reduced motion is preferred
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    applyTheme(newThemeId);
    return;
  }

  // Skip if the theme isn't actually changing
  if (currentTheme === normalizeTheme(newThemeId)) {
    return;
  }

  // 1. Snapshot the current computed background
  const computed = window.getComputedStyle(themeLayer);
  const oldBgImage = computed.backgroundImage;
  const oldBgColor = computed.backgroundColor;

  // 2. Create ghost element
  const ghost = document.createElement('div');
  ghost.id = 'theme-ghost';
  ghost.style.backgroundImage = oldBgImage;
  ghost.style.backgroundColor = oldBgColor;
  ghost.style.opacity = '1';

  // 3. Insert ghost AFTER #theme-layer (correct z-index stacking by DOM order)
  themeLayer.insertAdjacentElement('afterend', ghost);

  // 4. Swap the real theme class underneath (instant, hidden by ghost)
  applyTheme(newThemeId);

  // 5. Double-rAF ensures browser has painted the ghost and new theme
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghost.style.opacity = '0';

      // 6. Cleanup after transition completes
      setTimeout(() => {
        ghost.remove();
      }, THEME_CROSSFADE_MS);
    });
  });
}

function normalizeWallpaperUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Please enter an image or YouTube URL');

  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Please enter a valid image or YouTube URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Wallpaper links must start with http:// or https://');
  }

  return parsed.href;
}

function getYouTubeVideoId(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return '';
  }

  const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  let candidate = '';

  if (hostname === 'youtu.be') {
    candidate = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (hostname === 'youtube.com') {
    if (parsed.pathname === '/watch') {
      candidate = parsed.searchParams.get('v') || '';
    }
  }

  return YOUTUBE_ID_RE.test(candidate) ? candidate : '';
}

function buildYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    loop: '1',
    modestbranding: '1',
    playsinline: '1',
    playlist: videoId,
    rel: '0',
    showinfo: '0',
  });

  // Use youtube-nocookie.com for better privacy-browser compatibility (Brave, etc.)
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function getImageLoadError() {
  return new Error('That link did not load as an image');
}

/**
 * Blob Pre-Load Buffer — fetches the image as a binary blob, then creates
 * a local objectURL. The image is fully in memory before the DOM renders it,
 * eliminating the white flash and double-download of the old pipeline.
 * Falls back to direct Image() validation if CORS blocks fetch().
 */
async function fetchWallpaperBlob(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WALLPAPER_LOAD_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      referrerPolicy: 'no-referrer',
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error('HTTP error');

    const blob = await response.blob();
    if (blob.size === 0) throw getImageLoadError();

    const blobUrl = URL.createObjectURL(blob);

    // Verify the blob actually decodes as a real image
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => (img.naturalWidth > 0 && img.naturalHeight > 0) ? resolve() : reject();
      img.onerror = () => reject();
      img.src = blobUrl;
    });

    return { blobUrl, originalUrl: url };
  } catch {
    // CORS or network failure — fall back to direct validation (no blob buffer)
    await validateImageDirect(url);
    return { blobUrl: null, originalUrl: url };
  }
}

/** Fallback validator for CORS-blocked URLs (custom user URLs). */
function validateImageDirect(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      callback(value);
    };

    const confirmImage = () => {
      const decoded = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
      decoded
        .then(() => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) { finish(resolve, url); return; }
          finish(reject, getImageLoadError());
        })
        .catch(() => finish(reject, getImageLoadError()));
    };

    const timeoutId = setTimeout(() => {
      finish(reject, new Error('Wallpaper image took too long to load'));
    }, WALLPAPER_LOAD_TIMEOUT_MS);

    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = confirmImage;
    img.onerror = () => finish(reject, getImageLoadError());
    img.src = url;
    if (img.complete) confirmImage();
  });
}

async function resolveWallpaperSource(rawUrl, { requestPermission = false } = {}) {
  const url = normalizeWallpaperUrl(rawUrl);
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
    // Check or request YouTube permissions depending on context
    const youtubePerms = {
      permissions: ['declarativeNetRequestWithHostAccess'],
      origins: [
        'https://youtube.com/*',
        'https://www.youtube.com/*',
        'https://youtube-nocookie.com/*',
        'https://www.youtube-nocookie.com/*',
      ],
    };

    try {
      let hasPermission;
      if (requestPermission) {
        // Called from user gesture (Apply button) — prompt the user
        hasPermission = await chrome.permissions.request(youtubePerms);
      } else {
        // Called from page load — just check, don't prompt
        hasPermission = await chrome.permissions.contains(youtubePerms);
      }

      if (hasPermission) {
        // Tell background worker to install the referer header rule
        chrome.runtime.sendMessage({ command: 'syncYouTubeRule' }).catch(() => {});
      }
    } catch (err) {
      // Permission request failed (no user gesture or denied)
      if (requestPermission && err?.message?.includes('permissions')) throw err;
      // On page load, just continue without the DNR rule — embed may still work
    }

    return {
      type: 'youtube',
      url,
      embedUrl: buildYouTubeEmbedUrl(youtubeId),
    };
  }

  try {
    const { blobUrl, originalUrl } = await fetchWallpaperBlob(url);
    return { type: 'image', url: originalUrl, blobUrl };
  } catch {
    throw new Error('Use a direct image URL or a standard YouTube link');
  }
}

function applyWallpaperAppearance(blur = 0, darken = 0.3) {
  const root = document.documentElement.style;
  root.setProperty('--bg-blur-amount', `${Number.isFinite(blur) ? blur : 0}px`);
  root.setProperty('--bg-darken', Number.isFinite(darken) ? darken : 0.3);
}

function getWallpaperLayer() {
  return document.getElementById('bg-layer');
}

function getWallpaperOverlay() {
  return document.getElementById('bg-overlay');
}

function setWallpaperFadeOutState(isFading) {
  getWallpaperLayer()?.classList.toggle('wp-fade-out', isFading);
  getWallpaperOverlay()?.classList.toggle('wp-fade-out', isFading);
}

function clearThemeRevealHold() {
  if (themeRevealTimer) {
    clearTimeout(themeRevealTimer);
    themeRevealTimer = 0;
  }
  getBodyEl()?.classList.remove('theme-layer-hold');
}

function holdThemeReveal() {
  const fadeDuration = getWallpaperFadeDuration();
  clearThemeRevealHold();
  const body = getBodyEl();
  if (!body) return;
  body.classList.add('theme-layer-hold');
  themeRevealTimer = setTimeout(() => {
    themeRevealTimer = 0;
    body.classList.remove('theme-layer-hold');
  }, fadeDuration);
}

function clearWallpaperMedia() {
  getWallpaperLayer()?.querySelectorAll('[data-wallpaper-media="true"]').forEach((el) => el.remove());
}

function createWallpaperYouTubeShell(embedUrl) {
  const container = document.createElement('div');
  container.className = 'youtube-wallpaper-container';
  container.dataset.wallpaperMedia = 'true';

  const frame = document.createElement('iframe');
  frame.id = 'youtube-bg-iframe';
  frame.className = 'wallpaper-media wallpaper-media-youtube';
  frame.src = embedUrl;
  frame.title = 'YouTube wallpaper';
  frame.tabIndex = -1;
  frame.loading = 'eager';
  // Must include src origin for cross-origin autoplay permission policy
  frame.allow = 'autoplay; encrypted-media';
  frame.referrerPolicy = 'no-referrer';
  frame.allowFullscreen = false;
  frame.setAttribute('aria-hidden', 'true');

  const mask = document.createElement('div');
  mask.className = 'acrylic-video-mask';
  mask.setAttribute('aria-hidden', 'true');

  container.append(frame, mask);

  // Auto-detect embed failure (Brave Shields, network errors, etc.)
  // If YouTube's player can't initialize, it renders an error page inside the
  // iframe. We use two methods to confirm the embed loaded:
  //   1. postMessage events from the YouTube IFrame API
  //   2. iframe 'load' event (fires when embed page loads, even without API messages)
  // If neither confirms within 10 seconds, remove the embed gracefully
  // but preserve persisted storage so the user can retry on next tab load.
  const EMBED_TIMEOUT_MS = 10000;
  let videoConfirmed = false;

  const confirmEmbed = () => {
    if (videoConfirmed) return;
    videoConfirmed = true;
    window.removeEventListener('message', onYTMessage);
  };

  // Method 1: Listen for any postMessage from the YouTube embed
  const onYTMessage = (e) => {
    if (!e.data || typeof e.data !== 'string') return;
    try {
      const msg = JSON.parse(e.data);
      // Accept any YouTube API message as confirmation
      if (msg?.event || msg?.info || msg?.id) {
        confirmEmbed();
      }
    } catch { /* not a YouTube message — ignore */ }
  };
  window.addEventListener('message', onYTMessage);

  // Method 2: iframe load event — more reliable than postMessage on privacy browsers
  frame.addEventListener('load', confirmEmbed);

  setTimeout(() => {
    window.removeEventListener('message', onYTMessage);
    if (!videoConfirmed && container.isConnected) {
      // Embed failed — remove the YouTube shell and fall back to theme
      console.warn('Acrylic: YouTube embed did not respond — removing and restoring theme.');
      container.remove();
      currentWallpaperUrl = '';

      // Restore the theme background visually
      const body = getBodyEl();
      if (body) body.classList.remove('has-wallpaper');
      document.documentElement.style.setProperty('--bg-image', 'none');
      applyTheme(currentTheme);

      // NOTE: Do NOT clear persisted storage here — let the user retry on next
      // tab load. They can manually clear via the Clear Wallpaper button.
    }
  }, EMBED_TIMEOUT_MS);

  return container;
}

function applyWallpaperSourceToDom(source, blur = 0, darken = 0.3, { cinematic = false, holdThemeReveal: shouldHoldThemeReveal = false } = {}) {
  const root = document.documentElement.style;
  const body = getBodyEl();
  const previousBlobUrl = currentBlobUrl;
  const transitionToken = ++backgroundTransitionToken;
  const layer = getWallpaperLayer();

  clearThemeRevealHold();
  setWallpaperFadeOutState(false);

  if (!source) {
    const fadeDuration = getWallpaperFadeDuration();
    const wasWallpaperActive = body?.classList.contains('has-wallpaper');

    // Immediate state cleanup (non-visual)
    currentWallpaperUrl = '';
    clearBrightnessAdaptation();

    if (fadeDuration === 0 || !wasWallpaperActive) {
      // Reduced motion or no wallpaper to fade — instant cleanup
      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = ''; }
      clearWallpaperMedia();
      root.setProperty('--bg-image', 'none');
      if (body) body.classList.remove('has-wallpaper');
      applyTheme(currentTheme);
      return;
    }

    // ── Cinematic Clear: crossfade wallpaper out, theme in ──
    // 1. Wallpaper + overlay start fading to opacity 0 (0.4s CSS transition)
    setWallpaperFadeOutState(true);
    // 2. Theme-layer starts fading to opacity 1 simultaneously
    if (body) body.classList.remove('has-wallpaper');
    applyTheme(currentTheme);

    // 3. After fade completes, clean up DOM and revoke blob
    setTimeout(() => {
      if (transitionToken !== backgroundTransitionToken) return;
      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = ''; }
      clearWallpaperMedia();
      root.setProperty('--bg-image', 'none');
      setWallpaperFadeOutState(false);
    }, fadeDuration);

    return;
  }

  // Use blobUrl (in-memory) when available, fall back to remote URL
  const renderUrl = source.blobUrl || source.url;
  const bgImageValue = source.type === 'image' ? `url(${JSON.stringify(renderUrl)})` : 'none';

  const applySource = () => {
    if (transitionToken !== backgroundTransitionToken) return;

    // Revoke old blob now that we're swapping (old image no longer displayed)
    if (previousBlobUrl && previousBlobUrl !== source.blobUrl) {
      URL.revokeObjectURL(previousBlobUrl);
    }
    if (source.blobUrl) currentBlobUrl = source.blobUrl;

    clearWallpaperMedia();
    root.setProperty('--bg-image', bgImageValue);
    applyWallpaperAppearance(blur, darken);

    if (layer && source.type === 'youtube') {
      layer.appendChild(createWallpaperYouTubeShell(source.embedUrl));
    }

    if (body) body.classList.add('has-wallpaper');
    currentWallpaperUrl = source.url;

    // Brightness adaptation: analyze image wallpapers for text legibility.
    // blobUrl is same-origin so canvas reads always succeed (better than remote URLs).
    if (source.type === 'image') {
      detectAndApplyBrightness(renderUrl);
    } else {
      clearBrightnessAdaptation();
    }
  };

  // ── Cinematic Wallpaper Crossfade ─────────────────────────
  // Two paths depending on whether a wallpaper already exists:
  //   PATH A: No existing wallpaper → skip fade-out, apply + fade-in
  //   PATH B: Existing wallpaper → ghost snapshot crossfade (no black flash)
  if (cinematic && layer && source.type === 'image') {
    const hasExistingWallpaper = !!currentWallpaperUrl;
    const fadeDuration = getWallpaperFadeDuration();
    const isReducedMotion = fadeDuration === 0;

    if (!hasExistingWallpaper) {
      // ── PATH A: Palette → First Wallpaper ──────────────────
      if (isReducedMotion) {
        applySource();
      } else {
        setWallpaperFadeOutState(true);
        applySource();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (transitionToken !== backgroundTransitionToken) return;
            setWallpaperFadeOutState(false);
          });
        });
      }

    } else {
      // ── PATH B: Wallpaper → Wallpaper (Ghost Crossfade) ────
      const oldBgImage = root.getPropertyValue('--bg-image').trim();

      if (isReducedMotion) {
        applySource();
      } else {
        const ghost = document.createElement('div');
        ghost.id = 'wallpaper-ghost';
        ghost.style.backgroundImage = oldBgImage;
        ghost.style.opacity = '1';
        layer.appendChild(ghost);

        applySource();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // If interrupted by a rapid click, instantly kill this ghost
            // to prevent it staying at opacity:1 and blocking the real layer
            if (transitionToken !== backgroundTransitionToken) {
              ghost.remove();
              return;
            }
            ghost.style.opacity = '0';
            setTimeout(() => {
              ghost.remove();
            }, WALLPAPER_CROSSFADE_MS);
          });
        });
      }
    }

  } else {
    applySource();
  }
}

async function loadAndApplyWallpaper(rawUrl, blur = 0, darken = 0.3, { persist = false, silent = false, requestPermission = false, cinematic = false } = {}) {
  const requestId = ++wallpaperRequestId;
  let source;

  try {
    source = await resolveWallpaperSource(rawUrl, { requestPermission });
  } catch (err) {
    if (requestId === wallpaperRequestId && !silent) {
      toast.error(err?.message || 'Wallpaper failed to load');
    }
    throw err;
  }

  if (requestId !== wallpaperRequestId) {
    throw new Error('Wallpaper request was superseded');
  }

  applyWallpaperSourceToDom(source, blur, darken, { cinematic });

  if (persist) {
    await Prefs.setMany({ wallpaperUrl: source.url, wallpaperBlur: blur, wallpaperDarken: darken });
  }

  return source.url;
}

function applyGrain(opacity) {
  document.documentElement.style.setProperty('--bg-grain-opacity', opacity);
}

function applyBlur(blurPx) {
  document.documentElement.style.setProperty('--bg-blur-amount', `${blurPx}px`);
}

function applyDarken(amount) {
  document.documentElement.style.setProperty('--bg-darken', amount);
}

function reportBackgroundError(message, error) {
  console.warn(message, error);
}

export async function initBackground() {
  const prefs = await Prefs.getAll();
  applyTheme(prefs.theme);
  applyGrain(prefs.grainOpacity);
  if (prefs.wallpaperUrl) {
    loadAndApplyWallpaper(prefs.wallpaperUrl, prefs.wallpaperBlur, prefs.wallpaperDarken, { silent: true }).catch((error) => {
      reportBackgroundError('Initial wallpaper load failed:', error);
    });
  }

  Prefs.onChange((changes) => {
    if ('theme' in changes) crossfadeTheme(changes.theme);
    if ('wallpaperUrl' in changes) {
      if (changes.wallpaperUrl === currentWallpaperUrl) return;
      const root = document.documentElement.style;
      const blur = parseFloat(root.getPropertyValue('--bg-blur-amount')) || 0;
      const darken = parseFloat(root.getPropertyValue('--bg-darken')) || 0.3;
      if (changes.wallpaperUrl) {
        loadAndApplyWallpaper(changes.wallpaperUrl, blur, darken, { silent: false }).catch((error) => {
          reportBackgroundError('Wallpaper change apply failed:', error);
        });
      } else {
        applyWallpaperSourceToDom(null);
      }
    }
    if ('wallpaperBlur' in changes) applyBlur(changes.wallpaperBlur);
    if ('wallpaperDarken' in changes) applyDarken(changes.wallpaperDarken);
    if ('grainOpacity' in changes) applyGrain(changes.grainOpacity);
  });
}

export async function setTheme(themeId) {
  const nextTheme = normalizeTheme(themeId);
  crossfadeTheme(nextTheme);
  await Prefs.set('theme', nextTheme);
}

export async function setWallpaper(url, blur = 0, darken = 0.3) {
  return loadAndApplyWallpaper(url, blur, darken, { persist: true, silent: true, requestPermission: true, cinematic: true });
}

export function clearWallpaper() {
  wallpaperRequestId++;
  applyWallpaperSourceToDom(null, 0, 0.3, { holdThemeReveal: true });
  Prefs.setMany({ wallpaperUrl: '', wallpaperBlur: 0, wallpaperDarken: 0.3 }).catch((error) => {
    reportBackgroundError('Failed to persist wallpaper clear:', error);
  });
}

export function setWallpaperAppearance(blur = 0, darken = 0.3) {
  applyWallpaperAppearance(blur, darken);
}

export function setGrain(opacity) {
  applyGrain(opacity);
  Prefs.set('grainOpacity', opacity).catch((error) => {
    reportBackgroundError('Failed to persist grain opacity:', error);
  });
}

export function getCurrentTheme() { return currentTheme; }
export function getAvailableThemes() { return THEMES; }
