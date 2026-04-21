import { Prefs } from '../modules/storage.js';
import { setTheme, setWallpaper, clearWallpaper, setGrain, getAvailableThemes, setWallpaperAppearance } from '../modules/background.js';
import { toast } from '../modules/toast.js';
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
let widgetsExpanded = false;

const SETTINGS_OPEN_CLASS = 'is-settings-open';
const THEME_COLORS = { midnight:'#0f0f23', 'deep-blue':'#021b37', aurora:'#003840', 'rose-noir':'#2d0320', espresso:'#1c0f0a', forest:'#0d1f0f', carbon:'#0a0a0a', synthwave:'#1a0533' };
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

function compactToggleRow(label, on, onclick) {
  const row = document.createElement('div');
  row.className = 'settings-widget-compact-row';

  const title = document.createElement('div');
  title.className = 'settings-widget-compact-title';
  title.textContent = label;

  row.append(title, toggle(on, onclick, label));
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

// ── About & Support helpers ─────────────────────────────

const CHANGELOG = [
  { icon: '🎨', text: 'Glassmorphism 2.0 UI — 8 premium themes' },
  { icon: '⏱️', text: 'Pomodoro Timer with ambient sounds' },
  { icon: '📝', text: 'Notes panel with rich text support' },
  { icon: '🔗', text: 'Quick Links with drag-to-reorder' },
  { icon: '✅', text: 'Smart To-Do list with scribble strike' },
  { icon: '🗂️', text: 'Tabs manager with live sync' },
  { icon: '📋', text: 'Clipboard history — last 20 items' },
  { icon: '🔍', text: 'Search history with instant filter' },
  { icon: '🖼️', text: 'Wallpaper support — image URL + YouTube' },
  { icon: '🎛️', text: 'Layout editor — drag any widget' },
  { icon: '🧩', text: 'Extensions manager panel' },
  { icon: '✨', text: 'Onboarding flow for new users' },
];

function openWhatsNew() {
  const overlay = document.createElement('div');
  overlay.className = 'whats-new-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', "What's New in Acrylic");

  const box = document.createElement('div');
  box.className = 'whats-new-box';
  box.onclick = (e) => e.stopPropagation();

  const hdr = document.createElement('div');
  hdr.className = 'whats-new-header';

  const htitle = document.createElement('div');
  htitle.className = 'whats-new-title';
  htitle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px;flex-shrink:0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>What's New`;

  const hbadge = document.createElement('div');
  hbadge.className = 'whats-new-version';
  hbadge.textContent = 'v1.0.0 — Initial Release';

  const hclose = document.createElement('button');
  hclose.type = 'button';
  hclose.className = 'whats-new-close';
  hclose.setAttribute('aria-label', 'Close');
  hclose.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  hdr.append(htitle, hbadge, hclose);

  const list = document.createElement('div');
  list.className = 'whats-new-list';
  CHANGELOG.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'whats-new-item';
    const em = document.createElement('span');
    em.className = 'whats-new-item-icon';
    em.textContent = item.icon;
    em.setAttribute('aria-hidden', 'true');
    const txt = document.createElement('span');
    txt.className = 'whats-new-item-text';
    txt.textContent = item.text;
    row.append(em, txt);
    list.appendChild(row);
  });

  box.append(hdr, list);
  overlay.appendChild(box);

  const dismiss = () => {
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    document.removeEventListener('keydown', wnKeyHandler);
  };
  const wnKeyHandler = (e) => { if (e.key === 'Escape') dismiss(); };
  overlay.addEventListener('click', dismiss);
  hclose.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
  document.addEventListener('keydown', wnKeyHandler);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-open')));
}

async function exportData() {
  const [syncData, localData] = await Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get(null),
  ]);
  const payload = JSON.stringify({
    _meta: { app: 'Acrylic', version: '1.0.0', exportedAt: new Date().toISOString() },
    preferences: syncData,
    localData,
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acrylic-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function importData() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) { resolve(false); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data?._meta || data._meta.app !== 'Acrylic') {
          throw new Error('This file is not a valid Acrylic backup');
        }
        const confirmed = confirm(
          'This will replace ALL your current Acrylic data (preferences, tasks, notes, quick links, and more).\n\nThis action cannot be undone. Continue?'
        );
        if (!confirmed) { resolve(false); return; }
        if (data.preferences && typeof data.preferences === 'object') {
          await chrome.storage.sync.clear();
          await chrome.storage.sync.set(data.preferences);
        }
        if (data.localData && typeof data.localData === 'object') {
          await chrome.storage.local.clear();
          await chrome.storage.local.set(data.localData);
        }
        resolve(true);
      } catch (err) {
        reject(err);
      } finally {
        input.remove();
      }
    });
    document.body.appendChild(input);
    input.click();
  });
}

function mkAboutIcon(svgInner, colorClass) {
  const wrap = document.createElement('div');
  wrap.className = `about-card-icon ${colorClass}`;
  wrap.innerHTML = svgInner;
  wrap.setAttribute('aria-hidden', 'true');
  return wrap;
}

function buildAboutSection() {
  const sec = document.createElement('div');
  sec.className = 'settings-card';
  sec.appendChild(sectionLabel('About & Support'));

  const grid = document.createElement('div');
  grid.className = 'about-grid';

  // ── Rate Acrylic (feature card) ─────────────────────────
  const rateCard = document.createElement('button');
  rateCard.type = 'button';
  rateCard.className = 'about-card about-card-feature';
  rateCard.setAttribute('aria-label', 'Rate Acrylic on the Chrome Web Store');
  rateCard.onclick = () => {
    // TODO: replace EXTENSION_ID_HERE with actual CWS extension ID after publishing
    window.open('https://chromewebstore.google.com/detail/EXTENSION_ID_HERE/reviews', '_blank', 'noopener');
  };
  const rateIcon = document.createElement('div');
  rateIcon.className = 'about-card-feature-icon';
  rateIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const rateTitle = document.createElement('div');
  rateTitle.className = 'about-card-feature-title';
  rateTitle.textContent = 'Rate Acrylic';
  const rateDesc = document.createElement('div');
  rateDesc.className = 'about-card-feature-desc';
  rateDesc.textContent = 'Loving Acrylic? Leave a review!';
  rateCard.append(rateIcon, rateTitle, rateDesc);

  // ── Right column (What's New + Report Bug) ──────────────

  const wnCard = document.createElement('button');
  wnCard.type = 'button';
  wnCard.className = 'about-card about-card-sm';
  wnCard.setAttribute('aria-label', "See what's new in Acrylic");
  wnCard.onclick = openWhatsNew;
  const wnIcon = mkAboutIcon(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, 'about-icon-amber');
  const wnCopy = document.createElement('div');
  const wnTitle = document.createElement('div'); wnTitle.className = 'about-card-sm-title'; wnTitle.textContent = "What's New";
  const wnDesc = document.createElement('div'); wnDesc.className = 'about-card-sm-desc'; wnDesc.textContent = 'Latest features & fixes';
  wnCopy.append(wnTitle, wnDesc);
  wnCard.append(wnIcon, wnCopy);

  const bugCard = document.createElement('button');
  bugCard.type = 'button';
  bugCard.className = 'about-card about-card-sm';
  bugCard.setAttribute('aria-label', 'Report a bug on GitHub');
  bugCard.onclick = () => window.open('https://github.com/ZeroTrace7/Acrylic_NewTab/issues/new', '_blank', 'noopener');
  const bugIcon = mkAboutIcon(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`, 'about-icon-muted');
  const bugCopy = document.createElement('div');
  const bugTitle = document.createElement('div'); bugTitle.className = 'about-card-sm-title'; bugTitle.textContent = 'Report Bug';
  const bugDesc = document.createElement('div'); bugDesc.className = 'about-card-sm-desc'; bugDesc.textContent = 'Create a GitHub issue';
  bugCopy.append(bugTitle, bugDesc);
  bugCard.append(bugIcon, bugCopy);



  // ── Export Your Data (full width) ───────────────────────
  const exportCard = document.createElement('button');
  exportCard.type = 'button';
  exportCard.className = 'about-card about-card-full';
  exportCard.setAttribute('aria-label', 'Export your Acrylic data as JSON');
  const exportIcon = mkAboutIcon(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`, 'about-icon-blue');
  const exportCopy = document.createElement('div');
  const exportTitleEl = document.createElement('div'); exportTitleEl.className = 'about-card-sm-title'; exportTitleEl.textContent = 'Export Your Data';
  const exportDescEl = document.createElement('div'); exportDescEl.className = 'about-card-sm-desc'; exportDescEl.textContent = 'Download backup as JSON';
  exportCopy.append(exportTitleEl, exportDescEl);
  exportCard.append(exportIcon, exportCopy);
  exportCard.onclick = async () => {
    if (exportCard.disabled) return;
    exportCard.disabled = true;
    exportTitleEl.textContent = 'Exporting…';
    try {
      await exportData();
      exportTitleEl.textContent = 'Downloaded! ✓';
      setTimeout(() => { exportTitleEl.textContent = 'Export Your Data'; exportCard.disabled = false; }, 2200);
    } catch {
      exportTitleEl.textContent = 'Export Your Data';
      exportCard.disabled = false;
    }
  };

  // ── Import Your Data ────────────────────────────────────
  const importCard = document.createElement('button');
  importCard.type = 'button';
  importCard.className = 'about-card about-card-full';
  importCard.setAttribute('aria-label', 'Import Acrylic data from a JSON backup');
  const importIcon = mkAboutIcon(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`, 'about-icon-green');
  const importCopy = document.createElement('div');
  const importTitleEl = document.createElement('div'); importTitleEl.className = 'about-card-sm-title'; importTitleEl.textContent = 'Import Your Data';
  const importDescEl = document.createElement('div'); importDescEl.className = 'about-card-sm-desc'; importDescEl.textContent = 'Restore from a JSON backup';
  importCopy.append(importTitleEl, importDescEl);
  importCard.append(importIcon, importCopy);
  importCard.onclick = async () => {
    if (importCard.disabled) return;
    importCard.disabled = true;
    importTitleEl.textContent = 'Select file…';
    try {
      const imported = await importData();
      if (imported) {
        importTitleEl.textContent = 'Restored! ✓';
        toast.success('Data restored — refreshing…');
        setTimeout(() => location.reload(), 1200);
      } else {
        importTitleEl.textContent = 'Import Your Data';
        importCard.disabled = false;
      }
    } catch (err) {
      toast.error(err?.message || 'Import failed');
      importTitleEl.textContent = 'Import Your Data';
      importCard.disabled = false;
    }
  };

  grid.append(rateCard, wnCard, bugCard, exportCard, importCard);
  sec.appendChild(grid);
  return sec;
}

function buildAboutFooter() {
  const footer = document.createElement('div');
  footer.className = 'about-footer-strip';

  const meta = document.createElement('span');
  meta.className = 'about-footer-meta';
  meta.textContent = 'Acrylic v1.0.0 · Built by Shreyash Gupta';

  const socials = document.createElement('div');
  socials.className = 'about-footer-socials';

  const mkSocial = (href, label, svgInner) => {
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'about-social-btn';
    a.setAttribute('aria-label', label);
    a.innerHTML = svgInner;
    return a;
  };

  socials.append(
    mkSocial(
      'https://github.com/ZeroTrace7', 'Portfolio (coming soon)',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    ),
    mkSocial(
      'https://github.com/ZeroTrace7', 'GitHub profile',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    ),
    mkSocial(
      'https://www.linkedin.com/in/shreyashgupta55', 'LinkedIn profile',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    ),
  );

  footer.append(meta, socials);
  return footer;
}

function buildProfileSection() {
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
  return sec1;
}

function buildThemeSection() {
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
  return sec2;
}

function buildFontSection() {
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
  return secFont;
}

function buildDisplaySection() {
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
        'Edit layout',
        'Open a drag editor for widgets and corner controls',
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
  return sec3;
}

function buildWidgetsSection() {
  const sec4 = document.createElement('div');
  sec4.className = 'settings-card';
  sec4.appendChild(sectionLabel('Widgets'));
  const widgetRows = document.createElement('div');
  let expandedRows = null;
  let disclosure = null;
  const setWidgetsExpanded = (expanded) => {
    widgetsExpanded = expanded;
    if (!expandedRows || !disclosure) return;
    expandedRows.classList.toggle('is-open', widgetsExpanded);
    expandedRows.setAttribute('aria-hidden', String(!widgetsExpanded));
    disclosure.classList.toggle('is-open', widgetsExpanded);
    disclosure.setAttribute('aria-expanded', String(widgetsExpanded));
    const label = disclosure.querySelector('.settings-widget-disclosure-label');
    if (label) label.textContent = widgetsExpanded ? 'Fewer widgets' : 'More widgets';
  };
  const renderWidgets = () => {
    widgetRows.innerHTML = '';
    const primaryWidgetOptions = [
      ['showClock', 'Time', 'Show or hide the clock and date block'],
      ['showGreeting', 'Greeting', 'Show or hide the greeting above the search bar'],
    ];
    const secondaryWidgetOptions = [
      ['showSearchBar', 'Search Bar'],
      ['showQuickLinks', 'Quick Links'],
      ['showMostVisited', 'Most Visited'],
      ['showToDoList', 'To-Do List'],
      ['showQuickTools', 'Quick Tools'],
      ['showZenButton', 'Zen Mode Button'],
    ];
    const toggleWidget = async (key) => {
      prefs[key] = prefs[key] === false;
      await Prefs.set(key, prefs[key]);
      renderWidgets();
    };
    primaryWidgetOptions.forEach(([key, label, description]) => {
      widgetRows.appendChild(toggleRow(label, description, prefs[key] !== false, async () => {
        await toggleWidget(key);
      }));
    });
    widgetRows.lastElementChild?.classList.add('settings-widget-primary-last');
    disclosure = document.createElement('button');
    disclosure.type = 'button';
    disclosure.className = 'settings-widget-disclosure';
    disclosure.setAttribute('aria-expanded', 'false');
    disclosure.innerHTML = `
      <span class="settings-widget-disclosure-copy">
        <span class="settings-widget-disclosure-label">More widgets</span>
        <span class="settings-widget-disclosure-meta">${secondaryWidgetOptions.length} controls</span>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    disclosure.addEventListener('click', () => {
      setWidgetsExpanded(!widgetsExpanded);
    });
    widgetRows.appendChild(disclosure);
    expandedRows = document.createElement('div');
    expandedRows.className = 'settings-widget-expanded';
    expandedRows.setAttribute('aria-hidden', 'true');
    secondaryWidgetOptions.forEach(([key, label]) => {
      expandedRows.appendChild(compactToggleRow(label, prefs[key] !== false, async () => {
        await toggleWidget(key);
      }));
    });
    widgetRows.appendChild(expandedRows);
    setWidgetsExpanded(widgetsExpanded);
  };
  renderWidgets();
  sec4.appendChild(widgetRows);
  return sec4;
}

function buildWallpaperSection() {
  const sec5 = document.createElement('div');
  sec5.className = 'settings-card';
  sec5.appendChild(sectionLabel('Wallpaper'));
  const wpRow = document.createElement('div');
  wpRow.setAttribute('style', 'display:flex;gap:8px;');
  const wpIn = document.createElement('input');
  wpIn.type = 'text'; wpIn.placeholder = 'Paste image URL or YouTube link'; wpIn.value = prefs.wallpaperUrl || '';
  wpIn.setAttribute('style', 'flex:1;padding:10px 14px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:12px;font-size:0.9rem;color:var(--text-primary);outline:none;');
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.ariaLabel = 'Apply wallpaper URL';
  applyBtn.setAttribute('style', 'padding:10px 16px;border-radius:12px;background:var(--glass-subtle);border:1px solid var(--accent-blue);color:var(--accent-blue);font-size:0.85rem;font-weight:500;cursor:pointer;');
  applyBtn.onclick = async () => {
    const url = wpIn.value.trim();
    applyBtn.disabled = true;
    applyBtn.textContent = 'Checking...';
    applyBtn.style.cursor = 'progress';
    applyBtn.style.opacity = '0.72';
    try {
      const appliedUrl = await setWallpaper(url, prefs.wallpaperBlur, prefs.wallpaperDarken);
      prefs.wallpaperUrl = appliedUrl;
      wpIn.value = appliedUrl;
      rebuildWpControls();
      toast.success('Wallpaper applied');
    } catch (err) {
      if (err?.message !== 'Wallpaper request was superseded') {
        toast.error(err?.message || 'Wallpaper failed to load');
      }
    } finally {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply';
      applyBtn.style.cursor = 'pointer';
      applyBtn.style.opacity = '1';
    }
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
    wpControls.appendChild(slider('Blur', prefs.wallpaperBlur, 0, 20, 1, 'px', (v) => { prefs.wallpaperBlur = v; setWallpaperAppearance(v, prefs.wallpaperDarken); Prefs.set('wallpaperBlur', v); }));
    wpControls.appendChild(slider('Darken', prefs.wallpaperDarken, 0, 0.9, 0.05, '', (v) => { prefs.wallpaperDarken = v; setWallpaperAppearance(prefs.wallpaperBlur, v); Prefs.set('wallpaperDarken', v); }));
    wpControls.appendChild(slider('Grain', prefs.grainOpacity, 0, 0.1, 0.005, '', (v) => { prefs.grainOpacity = v; setGrain(v); }));
  };
  rebuildWpControls();
  sec5.appendChild(wpControls);
  return sec5;
}

function buildClockSection() {
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
  return sec6;
}

function buildQuickLinksSection() {
  const sec7 = document.createElement('div');
  sec7.className = 'settings-card';
  sec7.appendChild(sectionLabel('Quick Links'));
  const qlRow = document.createElement('div');
  qlRow.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;gap:12px;');
  const qlLbl = document.createElement('span');
  qlLbl.textContent = 'Top links';
  qlLbl.setAttribute('style', 'font-size:0.85rem;font-weight:600;color:var(--text-primary);flex-shrink:0;');
  const qlTrack = document.createElement('div');
  qlTrack.className = 'ql-segment-track';
  qlTrack.setAttribute('role', 'listbox');
  qlTrack.setAttribute('aria-label', 'Number of top quick links');
  const QL_VALUES = [4, 5, 6, 7, 8, 9];
  let qlSegments = [];
  const updateSegments = () => {
    const current = Number(prefs.quickLinksMax) || 6;
    qlSegments.forEach((seg) => {
      const isActive = Number(seg.dataset.value) === current;
      seg.classList.toggle('is-active', isActive);
      seg.setAttribute('aria-selected', String(isActive));
    });
  };
  QL_VALUES.forEach((val) => {
    const seg = document.createElement('button');
    seg.type = 'button';
    seg.className = 'ql-segment';
    seg.textContent = String(val);
    seg.dataset.value = String(val);
    seg.setAttribute('role', 'option');
    seg.setAttribute('aria-selected', 'false');
    seg.setAttribute('aria-label', `Show ${val} quick links`);
    seg.addEventListener('click', async () => {
      if (Number(prefs.quickLinksMax) === val) return;
      prefs.quickLinksMax = val;
      updateSegments();
      await Prefs.set('quickLinksMax', val);
    });
    qlTrack.appendChild(seg);
    qlSegments.push(seg);
  });
  updateSegments();
  qlRow.append(qlLbl, qlTrack);
  sec7.appendChild(qlRow);
  const qlHint = document.createElement('div');
  qlHint.textContent = 'Top browser sites shown in the bottom quick links row.';
  qlHint.setAttribute('style', 'font-size:0.75rem;color:var(--text-secondary);margin-top:2px;');
  sec7.appendChild(qlHint);
  return sec7;
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
  h2.textContent = 'Preferences';
  h2.setAttribute('style', 'font-size:1.2rem;font-weight:700;color:var(--text-primary);');
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.ariaLabel = 'Close preferences';
  closeBtn.setAttribute('style', 'width:32px;height:32px;border-radius:50%;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;');
  closeBtn.onclick = closeSettings;
  header.append(h2, closeBtn);

  const sec1 = buildProfileSection();
  const sec2 = buildThemeSection();
  const secFont = buildFontSection();
  const sec3 = buildDisplaySection();
  const sec4 = buildWidgetsSection();
  const sec5 = buildWallpaperSection();
  const sec6 = buildClockSection();
  const sec7 = buildQuickLinksSection();

  // Section 9 — About & Support
  const sec8 = buildAboutSection();

  // Footer
  const footer = buildAboutFooter();

  box.append(header, sec1, sec2, sec5, secFont, sec3, sec4, sec6, sec7, sec8, footer);
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

