import { Prefs } from '../modules/storage.js';
import { setTheme, setWallpaper, clearWallpaper, setGrain, getAvailableThemes } from '../modules/background.js';
import { toast } from '../modules/toast.js';
import { isValidUrl } from '../modules/utils.js';
import { bus } from '../modules/event-bus.js';
import { UI_CONFIG } from '../modules/ui-config.js';
import { DOM } from '../modules/dom.js';

let modalEl = null;
let prefs = {};
let onCloseCallback = null;
let escHandler = null;
let themeChangedHandler = null;

const THEME_COLORS = { midnight:'#0f0f23', 'deep-blue':'#021b37', aurora:'#003840', 'rose-noir':'#2d0320', jet:'#000', espresso:'#1c0f0a', slate:'#0f172a', forest:'#0d1f0f' };

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function sectionLabel(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.setAttribute('style', 'font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;');
  return el;
}

function toggle(on, onclick, label = 'Toggle setting') {
  const wrap = document.createElement('div');
  wrap.setAttribute('style', `width:42px;height:24px;border-radius:12px;cursor:pointer;position:relative;transition:background 200ms ease;background:${on ? 'rgba(52,211,153,0.7)' : 'var(--glass-subtle)'};border:1px solid var(--glass-border-soft);`);
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('tabindex', '0');
  wrap.setAttribute('aria-pressed', String(on));
  wrap.setAttribute('aria-label', label);
  const knob = document.createElement('div');
  knob.setAttribute('style', `position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform 200ms ease;transform:translateX(${on ? '21px' : '3px'});`);
  wrap.appendChild(knob);
  wrap.onclick = onclick;
  wrap.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick();
    }
  };
  return wrap;
}

function toggleRow(label, on, onclick) {
  const row = document.createElement('div');
  row.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;');
  const lbl = document.createElement('span');
  lbl.textContent = label;
  lbl.setAttribute('style', 'font-size:0.85rem;color:var(--text-primary);');
  row.append(lbl, toggle(on, onclick, label));
  return row;
}

function slider(label, value, min, max, step, unit, oninput) {
  const wrap = document.createElement('div');
  wrap.setAttribute('style', 'margin-bottom:10px;');
  const top = document.createElement('div');
  top.setAttribute('style', 'display:flex;justify-content:space-between;margin-bottom:4px;');
  const lbl = document.createElement('span');
  lbl.textContent = label;
  lbl.setAttribute('style', 'font-size:0.78rem;color:var(--text-secondary);');
  const val = document.createElement('span');
  val.textContent = value + unit;
  val.setAttribute('style', 'font-size:0.78rem;color:var(--text-muted);');
  top.append(lbl, val);
  const input = document.createElement('input');
  input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = value;
  input.setAttribute('style', 'width:100%;accent-color:rgba(255,255,255,0.8);cursor:pointer;');
  input.oninput = () => { val.textContent = input.value + unit; oninput(parseFloat(input.value)); };
  wrap.append(top, input);
  return wrap;
}

function buildModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeSettings(); };

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.setAttribute('style', 'position:relative;display:flex;flex-direction:column;gap:24px;');
  box.onclick = (e) => e.stopPropagation();

  // Header
  const header = document.createElement('div');
  header.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  h2.setAttribute('style', 'font-size:1.2rem;font-weight:700;color:var(--text-primary);');
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.ariaLabel = 'Close settings';
  closeBtn.setAttribute('style', 'width:32px;height:32px;border-radius:50%;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;');
  closeBtn.onclick = closeSettings;
  header.append(h2, closeBtn);

  // Section 1 — Profile
  const sec1 = document.createElement('div');
  sec1.appendChild(sectionLabel('Profile'));
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Your name';
  nameLabel.setAttribute('style', 'font-size:0.78rem;color:var(--text-secondary);display:block;margin-bottom:6px;');
  const nameIn = document.createElement('input');
  nameIn.type = 'text'; nameIn.value = prefs.userName || '';
  nameIn.setAttribute('style', 'width:100%;padding:10px 14px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:12px;font-size:0.9rem;color:var(--text-primary);outline:none;box-sizing:border-box;');
  nameIn.onfocus = () => nameIn.style.borderColor = 'var(--glass-border)';
  nameIn.onblur = () => nameIn.style.borderColor = 'var(--glass-border-soft)';
  const saveName = debounce((v) => { Prefs.set('userName', v); toast.success('Name saved!'); }, 500);
  nameIn.oninput = () => saveName(nameIn.value);
  sec1.append(nameLabel, nameIn);

  // Section 2 — Theme
  const sec2 = document.createElement('div');
  sec2.appendChild(sectionLabel('Theme'));
  const grid = document.createElement('div');
  grid.setAttribute('style', 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;');
  const renderThemes = () => {
    grid.innerHTML = '';
    getAvailableThemes().forEach(t => {
      const btn = document.createElement('button');
      const active = prefs.theme === t.id;
      btn.ariaLabel = `Apply ${t.label} theme`;
      btn.setAttribute('style', `padding:8px 4px;border-radius:12px;font-size:0.72rem;font-weight:500;cursor:pointer;transition:all 150ms ease;border:1px solid ${active ? 'var(--glass-border)' : 'transparent'};background:${active ? 'var(--glass-subtle)' : 'transparent'};color:${active ? 'var(--text-primary)' : 'var(--text-secondary)'};text-align:center;`);
      const swatch = document.createElement('div');
      swatch.setAttribute('style', `height:24px;border-radius:8px;margin-bottom:4px;background:${THEME_COLORS[t.id] || '#111'};`);
      btn.append(swatch, document.createTextNode(t.label));
      btn.onclick = () => { setTheme(t.id); prefs.theme = t.id; renderThemes(); };
      grid.appendChild(btn);
    });
  };
  renderThemes();
  sec2.appendChild(grid);

  // Section 3 — Wallpaper
  const sec3 = document.createElement('div');
  sec3.appendChild(sectionLabel('Wallpaper'));
  const wpRow = document.createElement('div');
  wpRow.setAttribute('style', 'display:flex;gap:8px;');
  const wpIn = document.createElement('input');
  wpIn.type = 'text'; wpIn.placeholder = 'Paste an image URL (Unsplash, etc.)'; wpIn.value = prefs.wallpaperUrl || '';
  wpIn.setAttribute('style', 'flex:1;padding:10px 14px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:12px;font-size:0.9rem;color:var(--text-primary);outline:none;');
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.ariaLabel = 'Apply wallpaper URL';
  applyBtn.setAttribute('style', 'padding:10px 16px;border-radius:12px;background:var(--glass-subtle);border:1px solid var(--accent-blue);color:var(--accent-blue);font-size:0.85rem;font-weight:500;cursor:pointer;');
  applyBtn.onclick = () => {
    const url = wpIn.value.trim();
    if (!url || !isValidUrl(url)) { toast.error('Please enter a valid URL'); return; }
    setWallpaper(url, prefs.wallpaperBlur, prefs.wallpaperDarken);
    prefs.wallpaperUrl = url;
    rebuildWpControls();
  };
  wpRow.append(wpIn, applyBtn);
  sec3.appendChild(wpRow);

  const wpControls = document.createElement('div');
  const rebuildWpControls = () => {
    wpControls.innerHTML = '';
    if (!prefs.wallpaperUrl) return;
    const clrBtn = document.createElement('button');
    clrBtn.textContent = 'Clear wallpaper';
    clrBtn.ariaLabel = 'Clear wallpaper';
    clrBtn.setAttribute('style', 'font-size:0.75rem;color:var(--accent-red);background:none;border:none;cursor:pointer;margin:8px 0;');
    clrBtn.onclick = () => { clearWallpaper(); prefs.wallpaperUrl = ''; wpIn.value = ''; rebuildWpControls(); };
    wpControls.appendChild(clrBtn);
    wpControls.appendChild(slider('Blur', prefs.wallpaperBlur, 0, 20, 1, 'px', (v) => { prefs.wallpaperBlur = v; setWallpaper(prefs.wallpaperUrl, v, prefs.wallpaperDarken); Prefs.set('wallpaperBlur', v); }));
    wpControls.appendChild(slider('Darken', prefs.wallpaperDarken, 0, 0.9, 0.05, '', (v) => { prefs.wallpaperDarken = v; setWallpaper(prefs.wallpaperUrl, prefs.wallpaperBlur, v); Prefs.set('wallpaperDarken', v); }));
    wpControls.appendChild(slider('Grain', prefs.grainOpacity, 0, 0.1, 0.005, '', (v) => { prefs.grainOpacity = v; setGrain(v); }));
  };
  rebuildWpControls();
  sec3.appendChild(wpControls);

  // Section 4 — Clock
  const sec4 = document.createElement('div');
  sec4.appendChild(sectionLabel('Clock'));
  const renderClock = () => {
    const is24 = prefs.clockFormat === '24h';
    while (sec4.childNodes.length > 1) sec4.removeChild(sec4.lastChild);
    sec4.appendChild(toggleRow('24-hour format', is24, () => {
      prefs.clockFormat = is24 ? '12h' : '24h';
      Prefs.set('clockFormat', prefs.clockFormat); renderClock();
    }));
  };
  renderClock();

  // Section 5 — Quick Links
  const sec5 = document.createElement('div');
  sec5.appendChild(sectionLabel('Quick Links'));
  const qlRow = document.createElement('div');
  qlRow.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const qlLbl = document.createElement('span');
  qlLbl.textContent = 'Max links';
  qlLbl.setAttribute('style', 'font-size:0.85rem;color:var(--text-primary);');
  const qlIn = document.createElement('input');
  qlIn.type = 'number'; qlIn.min = 4; qlIn.max = 20; qlIn.step = 4; qlIn.value = prefs.quickLinksMax || 12;
  qlIn.setAttribute('style', 'width:70px;padding:6px 10px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:8px;color:var(--text-primary);font-size:0.9rem;text-align:center;outline:none;');
  qlIn.onchange = () => Prefs.set('quickLinksMax', parseInt(qlIn.value));
  qlRow.append(qlLbl, qlIn);
  sec5.appendChild(qlRow);

  // Footer
  const footer = document.createElement('div');
  footer.textContent = 'Acrylic v1.0.0 — Settings sync across devices';
  footer.setAttribute('style', 'font-size:0.7rem;color:var(--text-ghost);text-align:center;');

  box.append(header, sec1, sec2, sec3, sec4, sec5, footer);
  overlay.appendChild(box);
  return overlay;
}

async function openSettings(callback) {
  onCloseCallback = callback;
  prefs = await Prefs.getAll();
  document.documentElement.style.setProperty('--clock-top', UI_CONFIG.clockTop);
  document.documentElement.style.setProperty('--center-top', UI_CONFIG.centerTop);
  document.documentElement.style.setProperty('--quicklinks-bottom', UI_CONFIG.quicklinksBottom);
  document.documentElement.style.setProperty('--sidebar-left', UI_CONFIG.sidebarLeft);
  modalEl = buildModal();
  (DOM.settingsModalMount || document.body).appendChild(modalEl);
  escHandler = (e) => { if (e.key === 'Escape') closeSettings(); };
  document.addEventListener('keydown', escHandler);
  themeChangedHandler = async () => {
    prefs.theme = await Prefs.get('theme');
    Array.from(modalEl?.getElementsByTagName('button') || []).forEach((btn) => {
      if (!btn.textContent) return;
      const theme = getAvailableThemes().find((t) => t.label === btn.textContent.trim());
      if (!theme) return;
      const active = prefs.theme === theme.id;
      btn.style.borderColor = active ? 'var(--glass-border)' : 'transparent';
      btn.style.background = active ? 'var(--glass-subtle)' : 'transparent';
      btn.style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)';
    });
  };
  bus.addEventListener('themeChanged', themeChangedHandler);
}

function closeSettings() {
  if (modalEl) { modalEl.remove(); modalEl = null; }
  if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  if (themeChangedHandler) { bus.removeEventListener('themeChanged', themeChangedHandler); themeChangedHandler = null; }
  onCloseCallback?.();
  onCloseCallback = null;
}

export async function initSettings(onClose) {
  if (modalEl) return;
  await openSettings(onClose);
}

