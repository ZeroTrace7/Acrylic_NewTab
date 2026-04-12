import { Prefs } from '../modules/storage.js';
import { setTheme, setWallpaper, clearWallpaper, setGrain, getAvailableThemes } from '../modules/background.js';
import { toast } from '../modules/toast.js';
import { isValidUrl } from '../modules/utils.js';
import { bus } from '../modules/event-bus.js';
import { UI_CONFIG } from '../modules/ui-config.js';
import { DOM } from '../modules/dom.js';
import { resetLayoutOffsets, setLayoutEditMode, setTextDepth } from '../modules/preferences.js';

let modalEl = null;
let prefs = {};
let onCloseCallback = null;
let escHandler = null;
let themeChangedHandler = null;
let openModalRaf = 0;
let openModalRaf2 = 0;
let closeModalTimer = 0;

const SETTINGS_OPEN_CLASS = 'is-settings-open';
const THEME_COLORS = { midnight:'#0f0f23', 'deep-blue':'#021b37', aurora:'#003840', 'rose-noir':'#2d0320', jet:'#000', espresso:'#1c0f0a', slate:'#0f172a', forest:'#0d1f0f' };
const FONT_OPTIONS = [
  { id: 'system', label: 'System', family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif" },
  { id: 'gloria', label: 'Gloria Hallelujah', family: "'Gloria Hallelujah', cursive" },
  { id: 'silkscreen', label: 'Silkscreen', family: "'Silkscreen', monospace" },
];

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function sectionLabel(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'settings-section-label';
  return el;
}

function toggle(on, onclick, label = 'Toggle setting') {
  const wrap = document.createElement('button');
  wrap.type = 'button';
  wrap.className = `settings-toggle${on ? ' is-on' : ''}`;
  wrap.setAttribute('aria-pressed', String(on));
  wrap.setAttribute('aria-label', label);
  const knob = document.createElement('div');
  knob.className = 'settings-toggle-thumb';
  wrap.appendChild(knob);
  wrap.addEventListener('click', (e) => {
    e.preventDefault();
    onclick();
  });
  return wrap;
}

function toggleRow(label, description, on, onclick) {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const copy = document.createElement('div');
  copy.className = 'settings-row-copy';
  const title = document.createElement('div');
  title.className = 'settings-row-title';
  title.textContent = label;
  copy.appendChild(title);
  if (description) {
    const desc = document.createElement('div');
    desc.className = 'settings-row-description';
    desc.textContent = description;
    copy.appendChild(desc);
  }
  row.append(copy, toggle(on, onclick, label));
  return row;
}

function actionRow(label, description, actionLabel, onclick) {
  const row = document.createElement('div');
  row.className = 'settings-row settings-row-action';

  const copy = document.createElement('div');
  copy.className = 'settings-row-copy';
  const title = document.createElement('div');
  title.className = 'settings-row-title';
  title.textContent = label;
  copy.appendChild(title);

  if (description) {
    const desc = document.createElement('div');
    desc.className = 'settings-row-description';
    desc.textContent = description;
    copy.appendChild(desc);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'settings-inline-action';
  button.textContent = actionLabel;
  button.addEventListener('click', (e) => {
    e.preventDefault();
    onclick();
  });

  row.append(copy, button);
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
  overlay.className = 'modal-overlay settings-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.onclick = (e) => { if (e.target === overlay) closeSettings(); };

  const box = document.createElement('div');
  box.className = 'modal-box settings-box settings-panel';
  box.setAttribute('style', 'position:relative;display:flex;flex-direction:column;gap:24px;');
  box.onclick = (e) => e.stopPropagation();

  // Header
  const header = document.createElement('div');
  header.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const h2 = document.createElement('h2');
  h2.textContent = 'Preferances';
  h2.setAttribute('style', 'font-size:1.2rem;font-weight:700;color:var(--text-primary);');
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.ariaLabel = 'Close preferances';
  closeBtn.setAttribute('style', 'width:32px;height:32px;border-radius:50%;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;');
  closeBtn.onclick = closeSettings;
  header.append(h2, closeBtn);

  // Section 1 — Profile
  const sec1 = document.createElement('div');
  sec1.className = 'settings-card';
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
  sec2.className = 'settings-card';
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

  // Section 3 — Font
  const secFont = document.createElement('div');
  secFont.className = 'settings-card';
  secFont.appendChild(sectionLabel('Font'));
  const fontGrid = document.createElement('div');
  fontGrid.className = 'settings-font-grid';
  const renderFonts = () => {
    fontGrid.innerHTML = '';
    const activeFont = FONT_OPTIONS.some((font) => font.id === prefs.dashboardFont) ? prefs.dashboardFont : 'gloria';
    FONT_OPTIONS.forEach((font) => {
      const btn = document.createElement('button');
      const active = activeFont === font.id;
      btn.type = 'button';
      btn.className = `settings-font-option${active ? ' is-active' : ''}`;
      btn.textContent = font.label;
      btn.style.fontFamily = font.family;
      btn.setAttribute('aria-pressed', String(active));
      btn.setAttribute('aria-label', `Use ${font.label} for time, date, and greeting`);
      btn.onclick = async () => {
        prefs.dashboardFont = font.id;
        await Prefs.set('dashboardFont', font.id);
        renderFonts();
      };
      fontGrid.appendChild(btn);
    });
  };
  renderFonts();
  secFont.appendChild(fontGrid);

  // Section 4 — Display
  const sec3 = document.createElement('div');
  sec3.className = 'settings-card';
  sec3.appendChild(sectionLabel('Display'));
  const displayRows = document.createElement('div');
  const renderDisplay = () => {
    displayRows.innerHTML = '';
    displayRows.append(
      toggleRow(
        'Text depth effect',
        'Adds subtle shadow to make text readable on bright wallpapers',
        prefs.textDepth !== false,
        async () => {
          prefs.textDepth = prefs.textDepth === false;
          await setTextDepth(prefs.textDepth, { persist: true });
          renderDisplay();
        }
      ),
      toggleRow(
        'Search history',
        'Show recent searches below the search bar',
        prefs.searchHistory !== false,
        async () => {
          prefs.searchHistory = prefs.searchHistory === false;
          await Prefs.set('searchHistory', prefs.searchHistory);
          renderDisplay();
        }
      ),
      toggleRow(
        'Edit layout',
        'Open a drag editor for the dock, time, search, and quick links',
        prefs.editLayoutMode === true,
        async () => {
          const next = prefs.editLayoutMode !== true;
          prefs.editLayoutMode = next;
          await setLayoutEditMode(next, { persist: true, announce: false });
          renderDisplay();
          if (next) {
            setTimeout(closeSettings, 180);
          }
        }
      ),
      actionRow(
        'Reset layout',
        'Restore default dashboard positions',
        'Reset',
        async () => {
          await resetLayoutOffsets({ persist: true, announce: true });
        }
      )
    );
  };
  renderDisplay();
  sec3.appendChild(displayRows);

  // Section 5 — Widgets
  const sec4 = document.createElement('div');
  sec4.className = 'settings-card';
  sec4.appendChild(sectionLabel('Widgets'));
  const widgetRows = document.createElement('div');
  const renderWidgets = () => {
    widgetRows.innerHTML = '';
    widgetRows.append(
      toggleRow(
        'Time',
        'Show or hide the clock and date block',
        prefs.showClock !== false,
        async () => {
          prefs.showClock = prefs.showClock === false;
          await Prefs.set('showClock', prefs.showClock);
          renderWidgets();
        }
      ),
      toggleRow(
        'Greeting',
        'Show or hide the greeting above the search bar',
        prefs.showGreeting !== false,
        async () => {
          prefs.showGreeting = prefs.showGreeting === false;
          await Prefs.set('showGreeting', prefs.showGreeting);
          renderWidgets();
        }
      )
    );
  };
  renderWidgets();
  sec4.appendChild(widgetRows);

  // Section 6 — Wallpaper
  const sec5 = document.createElement('div');
  sec5.className = 'settings-card';
  sec5.appendChild(sectionLabel('Wallpaper'));
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
  sec5.appendChild(wpRow);

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
  sec5.appendChild(wpControls);

  // Section 7 — Clock
  const sec6 = document.createElement('div');
  sec6.className = 'settings-card';
  sec6.appendChild(sectionLabel('Clock'));
  const renderClock = () => {
    const is24 = prefs.clockFormat === '24h';
    while (sec6.childNodes.length > 1) sec6.removeChild(sec6.lastChild);
    sec6.appendChild(toggleRow('24-hour format', 'Switch between 12-hour and 24-hour time', is24, () => {
      prefs.clockFormat = is24 ? '12h' : '24h';
      Prefs.set('clockFormat', prefs.clockFormat); renderClock();
    }));
  };
  renderClock();

  // Section 8 — Quick Links
  const sec7 = document.createElement('div');
  sec7.className = 'settings-card';
  sec7.appendChild(sectionLabel('Quick Links'));
  const qlRow = document.createElement('div');
  qlRow.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const qlLbl = document.createElement('span');
  qlLbl.textContent = 'Top links';
  qlLbl.setAttribute('style', 'font-size:0.85rem;color:var(--text-primary);');
  const qlValue = document.createElement('span');
  qlValue.textContent = '6';
  qlValue.setAttribute('style', 'min-width:70px;padding:6px 10px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:8px;color:var(--text-primary);font-size:0.9rem;text-align:center;');
  qlRow.append(qlLbl, qlValue);
  sec7.appendChild(qlRow);
  const qlHint = document.createElement('div');
  qlHint.textContent = 'Shows your top 6 browser sites automatically.';
  qlHint.setAttribute('style', 'margin-top:8px;font-size:0.75rem;color:var(--text-secondary);');
  sec7.appendChild(qlHint);

  // Footer
  const footer = document.createElement('div');
  footer.textContent = 'Acrylic v1.0.0 — Preferances sync across devices';
  footer.className = 'settings-footer-note';

  box.append(header, sec1, sec2, secFont, sec3, sec4, sec5, sec6, sec7, footer);
  overlay.appendChild(box);
  return overlay;
}

async function openSettings(callback) {
  onCloseCallback = callback;
  if (closeModalTimer) {
    clearTimeout(closeModalTimer);
    closeModalTimer = 0;
  }
  prefs = await Prefs.getAll();
  document.documentElement.style.setProperty('--clock-top', UI_CONFIG.clockTop);
  document.documentElement.style.setProperty('--center-top', UI_CONFIG.centerTop);
  document.documentElement.style.setProperty('--quicklinks-bottom', UI_CONFIG.quicklinksBottom);
  document.documentElement.style.setProperty('--sidebar-left', UI_CONFIG.sidebarLeft);
  modalEl = buildModal();
  (DOM.settingsModalMount || document.body).appendChild(modalEl);
  if (openModalRaf) {
    cancelAnimationFrame(openModalRaf);
    openModalRaf = 0;
  }
  if (openModalRaf2) {
    cancelAnimationFrame(openModalRaf2);
    openModalRaf2 = 0;
  }
  openModalRaf = requestAnimationFrame(() => {
    openModalRaf = 0;
    openModalRaf2 = requestAnimationFrame(() => {
      openModalRaf2 = 0;
      if (!modalEl) return;
      document.body?.classList.add(SETTINGS_OPEN_CLASS);
      modalEl.classList.add('is-open');
      modalEl.setAttribute('aria-hidden', 'false');
    });
  });
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
  if (!modalEl) return;
  if (openModalRaf) {
    cancelAnimationFrame(openModalRaf);
    openModalRaf = 0;
  }
  if (openModalRaf2) {
    cancelAnimationFrame(openModalRaf2);
    openModalRaf2 = 0;
  }
  if (closeModalTimer) return;

  const closingModal = modalEl;
  document.body?.classList.remove(SETTINGS_OPEN_CLASS);
  closingModal.classList.remove('is-open');
  closingModal.setAttribute('aria-hidden', 'true');
  closeModalTimer = setTimeout(() => {
    closeModalTimer = 0;
    if (modalEl === closingModal) {
      closingModal.remove();
      modalEl = null;
    }
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    if (themeChangedHandler) { bus.removeEventListener('themeChanged', themeChangedHandler); themeChangedHandler = null; }
    onCloseCallback?.();
    onCloseCallback = null;
  }, 420);
}

export async function initSettings(onClose) {
  if (modalEl) return;
  await openSettings(onClose);
}

