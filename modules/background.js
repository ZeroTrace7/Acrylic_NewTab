import { Prefs } from './storage.js';
import { toast } from './toast.js';

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

function getBodyEl() { return document.getElementById('app-body'); }

function applyTheme(themeId) {
  currentTheme = themeId;
  const body = getBodyEl();
  if (!body) return;
  THEMES.forEach(t => body.classList.remove(`theme-${t.id}`));
  body.classList.add(`theme-${themeId}`);
  if (!currentWallpaperUrl) body.classList.remove('has-wallpaper');
}

function applyWallpaper(url, blur = 0, darken = 0.45) {
  const root = document.documentElement.style;
  const body = getBodyEl();
  if (!url) {
    root.setProperty('--bg-image', 'none');
    if (body) body.classList.remove('has-wallpaper');
    currentWallpaperUrl = '';
    applyTheme(currentTheme);
    return;
  }
  const img = new Image();
  img.onload = () => {
    root.setProperty('--bg-image', `url("${url}")`);
    root.setProperty('--bg-blur-amount', `${blur}px`);
    root.setProperty('--bg-darken', darken);
    if (body) body.classList.add('has-wallpaper');
    currentWallpaperUrl = url;
  };
  img.onerror = () => {
    toast.error('Wallpaper failed to load');
    currentWallpaperUrl = '';
  };
  img.src = url;
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

export async function initBackground() {
  const prefs = await Prefs.getAll();
  applyTheme(prefs.theme);
  applyGrain(prefs.grainOpacity);
  if (prefs.wallpaperUrl) applyWallpaper(prefs.wallpaperUrl, prefs.wallpaperBlur, prefs.wallpaperDarken);

  Prefs.onChange((changes) => {
    if ('theme' in changes) applyTheme(changes.theme);
    if ('wallpaperUrl' in changes) {
      const root = document.documentElement.style;
      const blur = parseFloat(root.getPropertyValue('--bg-blur-amount')) || 0;
      const darken = parseFloat(root.getPropertyValue('--bg-darken')) || 0.45;
      applyWallpaper(changes.wallpaperUrl, blur, darken);
    }
    if ('wallpaperBlur' in changes) applyBlur(changes.wallpaperBlur);
    if ('wallpaperDarken' in changes) applyDarken(changes.wallpaperDarken);
    if ('grainOpacity' in changes) applyGrain(changes.grainOpacity);
  });
}

export function setTheme(themeId) {
  applyTheme(themeId);
  Prefs.set('theme', themeId);
}

export function setWallpaper(url, blur = 0, darken = 0.45) {
  applyWallpaper(url, blur, darken);
  Prefs.setMany({ wallpaperUrl: url, wallpaperBlur: blur, wallpaperDarken: darken });
}

export function clearWallpaper() {
  applyWallpaper('');
  Prefs.setMany({ wallpaperUrl: '', wallpaperBlur: 0, wallpaperDarken: 0.45 });
}

export function setGrain(opacity) {
  applyGrain(opacity);
  Prefs.set('grainOpacity', opacity);
}

export function getCurrentTheme() { return currentTheme; }
export function getAvailableThemes() { return THEMES; }

