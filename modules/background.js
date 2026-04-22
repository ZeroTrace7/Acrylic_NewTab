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

const WALLPAPER_LOAD_TIMEOUT_MS = 15000;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function getBodyEl() { return document.body; }
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
    playsinline: '1',
    playlist: videoId,
    rel: '0',
  });

  // Use youtube-nocookie.com for better privacy-browser compatibility (Brave, etc.)
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function getImageLoadError() {
  return new Error('That link did not load as an image');
}

function validateWallpaperImage(url) {
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
      const decoded = typeof img.decode === 'function'
        ? img.decode()
        : Promise.resolve();

      decoded
        .then(() => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            finish(resolve, url);
            return;
          }
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
    await validateWallpaperImage(url);
    return { type: 'image', url };
  } catch {
    throw new Error('Use a direct image URL or a standard YouTube link');
  }
}

function applyWallpaperAppearance(blur = 0, darken = 0.45) {
  const root = document.documentElement.style;
  root.setProperty('--bg-blur-amount', `${Number.isFinite(blur) ? blur : 0}px`);
  root.setProperty('--bg-darken', Number.isFinite(darken) ? darken : 0.45);
}

function getWallpaperLayer() {
  return document.getElementById('bg-layer');
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
  // iframe. We can't read cross-origin content, but we can listen for the
  // YouTube IFrame API's state message. If no 'playing' message arrives within
  // 8 seconds, assume failure and gracefully remove the embed.
  const EMBED_TIMEOUT_MS = 8000;
  let videoConfirmed = false;

  const onYTMessage = (e) => {
    if (!e.data || typeof e.data !== 'string') return;
    try {
      const msg = JSON.parse(e.data);
      // YouTube's IFrame API sends state changes via postMessage
      if (msg?.event === 'onStateChange' || msg?.event === 'initialDelivery' || msg?.info) {
        videoConfirmed = true;
        window.removeEventListener('message', onYTMessage);
      }
    } catch { /* not a YouTube message — ignore */ }
  };
  window.addEventListener('message', onYTMessage);

  setTimeout(() => {
    window.removeEventListener('message', onYTMessage);
    if (!videoConfirmed && container.isConnected) {
      // Embed failed — remove the YouTube shell and fall back to theme
      console.warn('Acrylic: YouTube embed did not respond in time — falling back to theme background.');
      container.remove();
      // If there's no image wallpaper either, remove has-wallpaper class
      const bgImage = getComputedStyle(document.documentElement).getPropertyValue('--bg-image').trim();
      if (!bgImage || bgImage === 'none') {
        document.body?.classList.remove('has-wallpaper');
      }
    }
  }, EMBED_TIMEOUT_MS);

  return container;
}

function applyWallpaperSourceToDom(source, blur = 0, darken = 0.45) {
  const root = document.documentElement.style;
  const body = getBodyEl();
  if (!source) {
    clearWallpaperMedia();
    root.setProperty('--bg-image', 'none');
    if (body) body.classList.remove('has-wallpaper');
    currentWallpaperUrl = '';
    clearBrightnessAdaptation();
    applyTheme(currentTheme);
    return;
  }

  clearWallpaperMedia();
  root.setProperty('--bg-image', source.type === 'image' ? `url(${JSON.stringify(source.url)})` : 'none');
  applyWallpaperAppearance(blur, darken);

  const layer = getWallpaperLayer();
  if (layer && source.type === 'youtube') {
    layer.appendChild(createWallpaperYouTubeShell(source.embedUrl));
  }

  if (body) body.classList.add('has-wallpaper');
  currentWallpaperUrl = source.url;

  // Brightness adaptation: analyze image wallpapers for text legibility.
  // YouTube embeds are cross-origin iframes — skip analysis, default to light text.
  if (source.type === 'image') {
    detectAndApplyBrightness(source.url);
  } else {
    clearBrightnessAdaptation();
  }
}

async function loadAndApplyWallpaper(rawUrl, blur = 0, darken = 0.45, { persist = false, silent = false, requestPermission = false } = {}) {
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

  applyWallpaperSourceToDom(source, blur, darken);

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
    if ('theme' in changes) applyTheme(changes.theme);
    if ('wallpaperUrl' in changes) {
      if (changes.wallpaperUrl === currentWallpaperUrl) return;
      const root = document.documentElement.style;
      const blur = parseFloat(root.getPropertyValue('--bg-blur-amount')) || 0;
      const darken = parseFloat(root.getPropertyValue('--bg-darken')) || 0.45;
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
  applyTheme(nextTheme);
  await Prefs.set('theme', nextTheme);
}

export async function setWallpaper(url, blur = 0, darken = 0.45) {
  return loadAndApplyWallpaper(url, blur, darken, { persist: true, silent: true, requestPermission: true });
}

export function clearWallpaper() {
  wallpaperRequestId++;
  applyWallpaperSourceToDom(null);
  Prefs.setMany({ wallpaperUrl: '', wallpaperBlur: 0, wallpaperDarken: 0.45 }).catch((error) => {
    reportBackgroundError('Failed to persist wallpaper clear:', error);
  });
}

export function setWallpaperAppearance(blur = 0, darken = 0.45) {
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
