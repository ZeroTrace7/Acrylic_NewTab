import { Store } from '../modules/storage.js';
import { truncate, generateId, getDomain, debounce } from '../modules/utils.js';
import { toast } from '../modules/toast.js';
import { hasTabsPermission, requestTabsPermission } from '../modules/permissions.js';

let containerEl = null;
let openTabs = [];
let savedGroups = [];
let groupNameInput = '';
let searchQuery = '';
let liveSyncCleanup = null;

const GLOBE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

async function loadOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return [...tabs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  } catch {
    toast.error('Could not load tabs');
    return [];
  }
}

function stopLiveSync() {
  if (typeof liveSyncCleanup === 'function') {
    liveSyncCleanup();
    liveSyncCleanup = null;
  }
}

function ibtn(svg, onclick, extraClass = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = svg;
  b.className = `qt-icon-btn ${extraClass}`.trim();
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
  img.src = src;
  img.width = size;
  img.height = size;
  img.style.cssText = `border-radius:${size > 14 ? 4 : 3}px;object-fit:contain;flex-shrink:0;background:var(--glass-bg);`;
  img.onerror = () => {
    img.style.display = 'none';
    const fallback = document.createElement('span');
    fallback.innerHTML = GLOBE;
    fallback.style.cssText = `flex-shrink:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;`;
    img.replaceWith(fallback);
  };
  return img;
}

function getTabUrl(tab) {
  return tab.url || tab.pendingUrl || '';
}

function getTabDomain(tab) {
  return getDomain(getTabUrl(tab)) || getTabUrl(tab);
}

function isRestorableUrl(url) {
  return Boolean(url)
    && !url.startsWith('chrome://')
    && !url.startsWith('chrome-extension://');
}

function matchesSearch(tab) {
  if (!searchQuery) return true;

  const tabUrl = getTabUrl(tab);
  const haystack = `${tab.title || ''} ${getTabDomain(tab)} ${tabUrl}`.toLowerCase();
  return haystack.includes(searchQuery);
}

function getVisibleOpenTabs() {
  return openTabs.filter(matchesSearch);
}

function updateOpenTabs(nextTabs, options = {}) {
  openTabs = nextTabs;
  renderAll(options);
}

async function refreshOpenTabs(options = {}) {
  const nextTabs = await loadOpenTabs();
  if (!containerEl) return;
  updateOpenTabs(nextTabs, options);
}

function startLiveSync() {
  stopLiveSync();

  const refresh = debounce(() => {
    refreshOpenTabs({
      preserveSearchFocus: document.activeElement?.classList.contains('qt-search-input') === true,
    });
  }, 120);

  const handleTabChange = () => refresh();
  const handleTabUpdate = (_tabId, changeInfo) => {
    if (
      'status' in changeInfo
      || 'title' in changeInfo
      || 'url' in changeInfo
      || 'favIconUrl' in changeInfo
      || 'pinned' in changeInfo
      || 'audible' in changeInfo
      || 'discarded' in changeInfo
      || 'groupId' in changeInfo
    ) {
      refresh();
    }
  };

  chrome.tabs.onCreated.addListener(handleTabChange);
  chrome.tabs.onRemoved.addListener(handleTabChange);
  chrome.tabs.onActivated.addListener(handleTabChange);
  chrome.tabs.onMoved.addListener(handleTabChange);
  chrome.tabs.onAttached.addListener(handleTabChange);
  chrome.tabs.onDetached.addListener(handleTabChange);
  chrome.tabs.onReplaced.addListener(handleTabChange);
  chrome.tabs.onUpdated.addListener(handleTabUpdate);

  liveSyncCleanup = () => {
    chrome.tabs.onCreated.removeListener(handleTabChange);
    chrome.tabs.onRemoved.removeListener(handleTabChange);
    chrome.tabs.onActivated.removeListener(handleTabChange);
    chrome.tabs.onMoved.removeListener(handleTabChange);
    chrome.tabs.onAttached.removeListener(handleTabChange);
    chrome.tabs.onDetached.removeListener(handleTabChange);
    chrome.tabs.onReplaced.removeListener(handleTabChange);
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  };
}

function focusSearchInput() {
  const nextInput = containerEl?.querySelector('.qt-search-input');
  if (!nextInput) return;

  nextInput.focus({ preventScroll: true });
  nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
}

function renderAll(options = {}) {
  if (!containerEl) return;

  containerEl.innerHTML = '';

  const visibleOpenTabs = getVisibleOpenTabs();
  const visibleCount = visibleOpenTabs.length;
  const totalCount = openTabs.length;

  const h1 = document.createElement('h3');
  h1.innerHTML = `Open Tabs <span style="font-weight:400;color:var(--text-ghost);">(${visibleCount === totalCount ? totalCount : `${visibleCount}/${totalCount}`})</span>`;
  h1.className = 'qt-title';

  const saveRow = document.createElement('div');
  saveRow.className = 'qt-flex qt-gap-sm qt-my-md';

  const nameIn = document.createElement('input');
  nameIn.type = 'text';
  nameIn.placeholder = 'e.g., Work, Assignments, Side Hustle...';
  nameIn.value = groupNameInput;
  nameIn.className = 'qt-input';
  nameIn.oninput = () => {
    groupNameInput = nameIn.value;
    saveBtn.disabled = !groupNameInput.trim();
  };

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = 'Save';
  saveBtn.className = 'qt-btn qt-btn-primary';
  saveBtn.disabled = !groupNameInput.trim();
  saveBtn.onclick = saveGroup;
  saveRow.append(nameIn, saveBtn);

  const searchRow = document.createElement('div');
  searchRow.className = 'qt-tab-toolbar';

  const searchShell = document.createElement('label');
  searchShell.className = 'qt-search-shell';
  searchShell.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'qt-search-input';
  searchInput.placeholder = 'Search open tabs...';
  searchInput.value = searchQuery;
  searchInput.autocomplete = 'off';
  searchInput.spellcheck = false;
  searchInput.oninput = () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderAll({ preserveSearchFocus: true });
  };

  searchShell.appendChild(searchInput);
  searchRow.appendChild(searchShell);

  const tabList = document.createElement('div');
  tabList.className = 'qt-tab-list';
  if (totalCount === 0) {
    tabList.innerHTML = `<div class="qt-empty">No tabs open</div>`;
  } else if (visibleCount === 0) {
    tabList.innerHTML = `<div class="qt-empty">No tabs match your search</div>`;
  } else {
    visibleOpenTabs.forEach((tab) => tabList.appendChild(createTabRow(tab)));
  }

  containerEl.append(h1, saveRow, searchRow, tabList);

  const hr = document.createElement('div');
  hr.className = 'qt-divider';
  containerEl.appendChild(hr);

  const hdr2 = document.createElement('div');
  hdr2.className = 'qt-flex-between qt-mb-md';

  const h2 = document.createElement('h3');
  h2.textContent = 'Saved Groups';
  h2.className = 'qt-title';
  hdr2.appendChild(h2);

  if (savedGroups.length > 0) {
    const clr = document.createElement('button');
    clr.type = 'button';
    clr.textContent = 'Clear All';
    clr.className = 'qt-btn qt-btn-ghost';
    clr.onclick = clearAllGroups;
    hdr2.appendChild(clr);
  }
  containerEl.appendChild(hdr2);

  if (savedGroups.length === 0) {
    containerEl.insertAdjacentHTML('beforeend', `<div class="qt-empty">No saved groups yet</div>`);
  } else {
    savedGroups.forEach((group) => containerEl.appendChild(createGroupCard(group)));
  }

  if (options.preserveSearchFocus) focusSearchInput();
}

function createTabRow(tab) {
  const row = document.createElement('div');
  row.className = `qt-list-row qt-tab-row${tab.active ? ' is-active' : ''}`;
  row.tabIndex = 0;
  row.setAttribute('role', 'button');
  row.setAttribute('aria-label', `Switch to ${tab.title || 'Untitled tab'}`);
  row.onclick = () => focusTab(tab.id);
  row.onkeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      focusTab(tab.id);
    }
  };

  const main = document.createElement('div');
  main.className = 'qt-tab-main';

  const info = document.createElement('div');
  info.className = 'qt-tab-copy';

  const titleRow = document.createElement('div');
  titleRow.className = 'qt-tab-title-row';

  const title = document.createElement('p');
  title.textContent = truncate(tab.title || 'Untitled', 52);
  title.className = 'qt-tab-title';

  titleRow.appendChild(title);

  if (tab.active) {
    const active = document.createElement('span');
    active.className = 'qt-tab-state';
    active.textContent = 'Current';
    titleRow.appendChild(active);
  }

  if (tab.pinned) {
    const pinned = document.createElement('span');
    pinned.className = 'qt-tab-badge';
    pinned.textContent = 'Pinned';
    titleRow.appendChild(pinned);
  }

  const metaRow = document.createElement('div');
  metaRow.className = 'qt-tab-meta-row';

  const domain = document.createElement('p');
  domain.textContent = getTabDomain(tab);
  domain.className = 'qt-muted qt-tab-meta';
  metaRow.appendChild(domain);

  info.append(titleRow, metaRow);
  main.append(faviconImg(tab.favIconUrl), info);

  const actions = document.createElement('div');
  actions.className = 'qt-tab-actions';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'qt-tab-close';
  closeBtn.ariaLabel = `Close ${tab.title || 'tab'}`;
  closeBtn.title = 'Close tab';
  closeBtn.innerHTML = CLOSE_ICON;
  closeBtn.onclick = async (event) => {
    event.stopPropagation();
    await closeTab(tab.id);
  };
  closeBtn.onkeydown = (event) => event.stopPropagation();
  actions.appendChild(closeBtn);

  row.append(main, actions);
  return row;
}

function createGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'qt-card qt-mb-sm';

  const top = document.createElement('div');
  top.className = 'qt-flex-between';
  top.style.alignItems = 'flex-start';

  const left = document.createElement('div');
  const title = document.createElement('div');
  title.style.cssText = 'font-size:0.85rem;font-weight:600;color:var(--text-primary);font-family:var(--font-ui),sans-serif;';
  title.textContent = group.name;
  const meta = document.createElement('div');
  meta.className = 'qt-muted qt-mt-sm';
  meta.textContent = `${new Date(group.savedAt).toLocaleDateString()} · ${group.tabs.length} tabs`;
  left.append(title, meta);

  const right = document.createElement('div');
  right.className = 'qt-flex qt-gap-sm';
  right.append(
    ibtn(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2" stroke-linecap="round"><polygon points="5,3 19,12 5,21"/></svg>`, () => restoreGroup(group)),
    ibtn(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`, () => deleteGroup(group.id)),
  );

  top.append(left, right);
  card.appendChild(top);

  const strip = document.createElement('div');
  strip.className = 'qt-flex qt-gap-sm qt-mt-sm';
  strip.style.flexWrap = 'wrap';

  const show = group.tabs.slice(0, 10);
  show.forEach((tab) => strip.appendChild(faviconImg(tab.favIconUrl, 18)));

  if (group.tabs.length > 10) {
    const badge = document.createElement('div');
    badge.textContent = `+${group.tabs.length - 10}`;
    badge.style.cssText = 'font-size:0.6rem;color:var(--text-muted);background:var(--glass-bg);border:1px solid var(--glass-border-soft);border-radius:6px;padding:2px 6px;display:flex;align-items:center;';
    strip.appendChild(badge);
  }

  card.appendChild(strip);
  return card;
}

async function focusTab(tabId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
  } catch {
    toast.error('Could not switch tab');
  }
}

async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
    openTabs = openTabs.filter((tab) => tab.id !== tabId);
    renderAll({
      preserveSearchFocus: document.activeElement?.classList.contains('qt-search-input') === true,
    });
  } catch {
    await refreshOpenTabs({
      preserveSearchFocus: document.activeElement?.classList.contains('qt-search-input') === true,
    });
    toast.error('Could not close tab');
  }
}

async function saveGroup() {
  if (!groupNameInput.trim()) return;
  const savableTabs = openTabs.filter((tab) => isRestorableUrl(getTabUrl(tab)));

  if (savableTabs.length === 0) {
    toast.error('No tabs to save');
    return;
  }

  savedGroups.unshift({
    id: generateId(),
    name: groupNameInput.trim(),
    tabs: savableTabs.map((tab) => ({
      title: tab.title,
      url: getTabUrl(tab),
      favIconUrl: tab.favIconUrl,
    })),
    savedAt: new Date().toISOString(),
  });

  try {
    await Store.setTabGroups(savedGroups);
    groupNameInput = '';
    toast.success('Group saved!');
    renderAll();
  } catch {
    savedGroups.shift();
    toast.error('Failed to save group');
  }
}

async function restoreGroup(group) {
  const urls = group.tabs
    .map((tab) => tab.url)
    .filter((url) => isRestorableUrl(url));

  if (urls.length === 0) {
    toast.error('No restorable tabs in this group');
    return;
  }

  const results = await Promise.allSettled(
    urls.map((url) => chrome.tabs.create({ url })),
  );
  const failed = results.filter((result) => result.status === 'rejected').length;

  if (failed === 0) {
    toast.success('Tabs restored!');
    return;
  }

  if (failed === urls.length) {
    toast.error('Failed to restore tabs');
    return;
  }

  toast.info(`Restored ${urls.length - failed}/${urls.length} tabs`);
}

async function deleteGroup(id) {
  const previousGroups = savedGroups;
  savedGroups = savedGroups.filter((group) => group.id !== id);
  try {
    await Store.setTabGroups(savedGroups);
    toast.info('Group deleted');
    renderAll();
  } catch {
    savedGroups = previousGroups;
    toast.error('Failed to delete group');
  }
}

async function clearAllGroups() {
  const previousGroups = savedGroups;
  savedGroups = [];
  try {
    await Store.setTabGroups([]);
    toast.info('All groups cleared');
    renderAll();
  } catch {
    savedGroups = previousGroups;
    toast.error('Failed to clear groups');
  }
}

/**
 * Renders the glassmorphism permission-gate UI when 'tabs' permission
 * has not yet been granted. The button must be wired to a direct click
 * event to satisfy Chrome's user-gesture requirement for runtime requests.
 */
function renderPermissionGate(container, onGranted) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'qt-empty';
  wrapper.style.padding = '48px 24px';

  // Lock icon
  wrapper.insertAdjacentHTML('beforeend', `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
         stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
         style="margin-bottom:16px;opacity:0.5;">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `);

  const title = document.createElement('p');
  title.textContent = 'Tab Manager';
  title.style.cssText = 'font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:8px;font-family:var(--font-ui),sans-serif;';
  wrapper.appendChild(title);

  const desc = document.createElement('p');
  desc.textContent = 'Acrylic needs permission to manage your open tabs. This data is stored 100% locally and is never transmitted.';
  desc.style.cssText = 'font-size:0.78rem;color:var(--text-muted);line-height:1.5;max-width:280px;margin-bottom:20px;';
  wrapper.appendChild(desc);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Grant Permission';
  btn.className = 'qt-btn qt-btn-primary';
  btn.style.cssText = 'padding:8px 20px;font-size:0.82rem;';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Requesting...';
    const granted = await requestTabsPermission();
    if (granted) {
      onGranted();
    } else {
      btn.disabled = false;
      btn.textContent = 'Grant Permission';
      toast.info('Permission not granted. You can try again anytime.');
    }
  };
  wrapper.appendChild(btn);

  container.appendChild(wrapper);
}

export async function initTabs(container) {
  containerEl = container;
  groupNameInput = '';
  searchQuery = '';
  stopLiveSync();

  // Permission gatekeeper — check before touching chrome.tabs
  const permitted = await hasTabsPermission();
  if (!permitted) {
    renderPermissionGate(container, () => initTabs(container));
    return () => {
      if (containerEl === container) containerEl = null;
    };
  }

  containerEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:32px 0;">Loading tabs...</div>`;

  [openTabs, savedGroups] = await Promise.all([
    loadOpenTabs(),
    Store.getTabGroups(),
  ]);

  if (!containerEl || containerEl !== container) return () => { stopLiveSync(); };

  renderAll();
  startLiveSync();

  return () => {
    stopLiveSync();
    if (containerEl === container) {
      containerEl = null;
    }
  };
}
