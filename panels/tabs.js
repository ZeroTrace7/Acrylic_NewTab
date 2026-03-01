import { Store } from '../modules/storage.js';
import { truncate, generateId } from '../modules/utils.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let openTabs = [];
let savedGroups = [];
let groupNameInput = '';

const GLOBE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`;

async function loadOpenTabs() {
  try {
    const tabs = await chrome.runtime.sendMessage({ type: 'GET_TABS' });
    return tabs || [];
  } catch { toast.error('Could not load tabs'); return []; }
}

function ibtn(svg, onclick, extra = '') {
  const b = document.createElement('button');
  b.innerHTML = svg;
  b.setAttribute('style', `width:28px;height:28px;border-radius:8px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 150ms ease;${extra}`);
  b.onclick = onclick;
  return b;
}

function faviconImg(src, size = 14) {
  if (!src || src.startsWith('chrome://') || src.startsWith('chrome-extension://')) {
    const span = document.createElement('span');
    span.innerHTML = GLOBE;
    span.style.cssText = `flex-shrink:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;`;
    return span;
  }
  const img = document.createElement('img');
  img.src = src; img.width = size; img.height = size;
  img.setAttribute('style', `border-radius:${size > 14 ? 4 : 3}px;object-fit:contain;flex-shrink:0;`);
  img.onerror = () => { img.style.display = 'none'; const s = document.createElement('span'); s.innerHTML = GLOBE; s.style.cssText = `flex-shrink:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;`; img.replaceWith(s); };
  return img;
}

function renderAll() {
  containerEl.innerHTML = '';

  // Section 1 — Current Tabs
  const h1 = document.createElement('h3');
  h1.innerHTML = `Open Tabs <span style="font-weight:400;color:var(--text-ghost);">(${openTabs.length})</span>`;
  h1.setAttribute('style', 'font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;');

  const saveRow = document.createElement('div');
  saveRow.setAttribute('style', 'display:flex;gap:8px;margin:10px 0;');
  const nameIn = document.createElement('input');
  nameIn.type = 'text'; nameIn.placeholder = 'Group name e.g. Work...'; nameIn.value = groupNameInput;
  nameIn.setAttribute('style', 'flex:1;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:10px;padding:7px 10px;font-size:0.8rem;color:var(--text-primary);outline:none;');
  nameIn.onfocus = () => nameIn.style.borderColor = 'var(--glass-border)';
  nameIn.onblur = () => nameIn.style.borderColor = 'var(--glass-border-soft)';
  nameIn.oninput = () => { groupNameInput = nameIn.value; saveBtn.disabled = !groupNameInput.trim(); saveBtn.style.opacity = groupNameInput.trim() ? '1' : '0.4'; };
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.setAttribute('style', `padding:7px 14px;border-radius:10px;background:var(--glass-subtle);border:1px solid var(--accent-blue);color:var(--accent-blue);font-size:0.8rem;font-weight:500;cursor:pointer;opacity:${groupNameInput.trim() ? '1' : '0.4'};`);
  saveBtn.disabled = !groupNameInput.trim();
  saveBtn.onclick = saveGroup;
  saveRow.append(nameIn, saveBtn);

  const tabList = document.createElement('div');
  tabList.setAttribute('style', 'max-height:160px;overflow-y:auto;');
  if (openTabs.length === 0) {
    tabList.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:20px 0;">No tabs open</div>`;
  } else {
    openTabs.forEach(t => tabList.appendChild(createTabRow(t)));
  }
  containerEl.append(h1, saveRow, tabList);

  // Divider
  const hr = document.createElement('div');
  hr.setAttribute('style', 'height:1px;background:var(--glass-border-soft);margin:16px 0;');
  containerEl.appendChild(hr);

  // Section 2 — Saved Groups
  const hdr2 = document.createElement('div');
  hdr2.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const h2 = document.createElement('h3');
  h2.textContent = 'Saved Groups';
  h2.setAttribute('style', 'font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;');
  hdr2.appendChild(h2);
  if (savedGroups.length > 0) {
    const clr = document.createElement('button');
    clr.textContent = 'Clear All';
    clr.setAttribute('style', 'font-size:0.65rem;color:var(--accent-red);background:none;border:none;cursor:pointer;');
    clr.onclick = clearAllGroups;
    hdr2.appendChild(clr);
  }
  containerEl.appendChild(hdr2);

  if (savedGroups.length === 0) {
    containerEl.insertAdjacentHTML('beforeend', `<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:24px 0;">No saved groups yet</div>`);
  } else {
    savedGroups.forEach(g => containerEl.appendChild(createGroupCard(g)));
  }
}

function createTabRow(tab) {
  const row = document.createElement('div');
  row.setAttribute('style', 'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;transition:background 150ms ease;');
  row.onmouseenter = () => row.style.background = 'var(--glass-subtle)';
  row.onmouseleave = () => row.style.background = 'transparent';
  const info = document.createElement('div');
  info.setAttribute('style', 'min-width:0;flex:1;');
  const p1 = document.createElement('p');
  p1.textContent = truncate(tab.title || 'Untitled', 30);
  p1.setAttribute('style', 'font-size:0.78rem;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;');
  const p2 = document.createElement('p');
  try { p2.textContent = new URL(tab.url).hostname; } catch { p2.textContent = tab.url; }
  p2.setAttribute('style', 'font-size:0.65rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;');
  info.append(p1, p2);
  row.append(faviconImg(tab.favIconUrl), info);
  return row;
}

function createGroupCard(group) {
  const card = document.createElement('div');
  card.setAttribute('style', 'padding:12px;border-radius:14px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);margin-bottom:10px;');
  const top = document.createElement('div');
  top.setAttribute('style', 'display:flex;justify-content:space-between;align-items:flex-start;');
  const left = document.createElement('div');
  left.innerHTML = `<div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${group.name}</div><div style="font-size:0.65rem;color:var(--text-muted);">${new Date(group.savedAt).toLocaleDateString()} · ${group.tabs.length} tabs</div>`;
  const right = document.createElement('div');
  right.setAttribute('style', 'display:flex;gap:4px;');
  right.append(
    ibtn(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2" stroke-linecap="round"><polygon points="5,3 19,12 5,21"/></svg>`, () => restoreGroup(group)),
    ibtn(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`, () => deleteGroup(group.id)),
  );
  top.append(left, right);
  card.appendChild(top);

  const strip = document.createElement('div');
  strip.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;');
  const show = group.tabs.slice(0, 10);
  show.forEach(t => strip.appendChild(faviconImg(t.favIconUrl, 18)));
  if (group.tabs.length > 10) { const badge = document.createElement('div'); badge.textContent = `+${group.tabs.length - 10}`; badge.setAttribute('style', 'font-size:0.6rem;color:var(--text-muted);background:var(--glass-subtle);border-radius:4px;padding:2px 6px;display:flex;align-items:center;'); strip.appendChild(badge); }
  card.appendChild(strip);
  return card;
}

function saveGroup() {
  if (!groupNameInput.trim()) return;
  if (openTabs.length === 0) { toast.error('No tabs to save'); return; }
  savedGroups.unshift({ id: generateId(), name: groupNameInput.trim(), tabs: openTabs.map(t => ({ title: t.title, url: t.url, favIconUrl: t.favIconUrl })), savedAt: new Date().toISOString() });
  Store.setTabGroups(savedGroups);
  groupNameInput = '';
  toast.success('Group saved!');
  renderAll();
}

function restoreGroup(group) {
  try {
    group.tabs.forEach(t => {
      if (t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://')) {
        chrome.runtime.sendMessage({ type: 'CREATE_TAB', url: t.url }).catch(() => {});
      }
    });
    toast.success('Tabs restored!');
  } catch { toast.error('Failed to restore tabs'); }
}

function deleteGroup(id) {
  savedGroups = savedGroups.filter(g => g.id !== id);
  Store.setTabGroups(savedGroups);
  toast.info('Group deleted');
  renderAll();
}

function clearAllGroups() {
  savedGroups = [];
  Store.setTabGroups([]);
  toast.info('All groups cleared');
  renderAll();
}

export async function initTabs(container) {
  containerEl = container;
  containerEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:32px 0;">Loading tabs...</div>`;
  [openTabs, savedGroups] = await Promise.all([loadOpenTabs(), Store.getTabGroups()]);
  renderAll();
}

