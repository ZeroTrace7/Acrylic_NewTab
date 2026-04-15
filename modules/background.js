import { Prefs } from './storage.js';
import { toast } from './toast.js';
import { bus } from './event-bus.js';

const THEMES = [
  { id: 'midnight',  label: 'Midnight'  },
  { id: 'deep-blue', label: 'Deep Blue' },
  { id: 'aurora',    label: 'Aurora'    },
  { id: 'rose-noir', label: 'Rose Noir' },
  { id: 'jet',       label: 'Jet Black' },
  { id: 'espresso',  label: 'Espresso'  },
  { id: 'slate',     label: 'Slate'     },
  { id: 'forest',    label: 'Forest'    },
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
  if (!raw) throw new Error('Please enter an image URL');

  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Please enter a valid image URL');
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
    loop: '1',
    playlist: videoId,
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
    origin: `chrome-extension://${chrome.runtime.id}`,
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
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

async function resolveWallpaperSource(rawUrl) {
  const url = normalizeWallpaperUrl(rawUrl);
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
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

function createWallpaperYouTubeFrame(embedUrl) {
  const frame = document.createElement('iframe');
  frame.className = 'wallpaper-media wallpaper-media-youtube';
  frame.dataset.wallpaperMedia = 'true';
  frame.src = embedUrl;
  frame.title = 'YouTube wallpaper';
  frame.tabIndex = -1;
  frame.loading = 'eager';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = false;
  frame.setAttribute('aria-hidden', 'true');
  return frame;
}

function applyWallpaperSourceToDom(source, blur = 0, darken = 0.45) {
  const root = document.documentElement.style;
  const body = getBodyEl();
  if (!source) {
    clearWallpaperMedia();
    root.setProperty('--bg-image', 'none');
    if (body) body.classList.remove('has-wallpaper');
    currentWallpaperUrl = '';
    applyTheme(currentTheme);
    return;
  }

  clearWallpaperMedia();
  root.setProperty('--bg-image', source.type === 'image' ? `url(${JSON.stringify(source.url)})` : 'none');
  applyWallpaperAppearance(blur, darken);

  const layer = getWallpaperLayer();
  if (layer && source.type === 'youtube') {
    layer.appendChild(createWallpaperYouTubeFrame(source.embedUrl));
  }

  if (body) body.classList.add('has-wallpaper');
  currentWallpaperUrl = source.url;
}

async function loadAndApplyWallpaper(rawUrl, blur = 0, darken = 0.45, { persist = false, silent = false } = {}) {
  const requestId = ++wallpaperRequestId;
  let source;

  try {
    source = await resolveWallpaperSource(rawUrl);
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
  return loadAndApplyWallpaper(url, blur, darken, { persist: true, silent: true });
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
