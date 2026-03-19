import { Store } from './storage.js';
import { generateId, getFaviconUrl, sanitizeUrl, getDomain } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

let links = [];
let topSiteLinks = [];
const TOP_SITE_LIMIT = 6;
const QUICK_LIBRARY = [
  { key: 'gmail', title: 'Gmail', url: 'https://mail.google.com' },
  { key: 'youtube', title: 'YouTube', url: 'https://youtube.com' },
  { key: 'chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com' },
  { key: 'whatsapp', title: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { key: 'x', title: 'X', url: 'https://x.com' },
  { key: 'notion', title: 'Notion', url: 'https://www.notion.so' },
  { key: 'notebooklm', title: 'NotebookLM', url: 'https://notebooklm.google.com' },
];

const MONO_ICONS = {
  gmail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.8 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8ZM10 15V9l5.2 3L10 15Z"/></svg>`,
  chatgpt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.98 2a4.64 4.64 0 0 0-3.97 2.25 4.64 4.64 0 0 0-4.64 8.04 4.64 4.64 0 0 0 4.64 8.04A4.64 4.64 0 0 0 16 19.75a4.64 4.64 0 0 0 4.64-8.04A4.64 4.64 0 0 0 16 3.67 4.62 4.62 0 0 0 11.98 2Zm0 2.22c.92 0 1.77.5 2.23 1.3l.27.46.53.03a2.42 2.42 0 0 1 2.16 3.45l-.22.48.34.4a2.42 2.42 0 0 1-1.84 3.99h-.53l-.28.45a2.42 2.42 0 0 1-4.33 0l-.28-.45h-.53A2.42 2.42 0 0 1 7.66 10l.34-.4-.22-.48A2.42 2.42 0 0 1 9.94 6l.53-.03.27-.46a2.57 2.57 0 0 1 2.24-1.3Z"/></svg>`,
  notion: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.5 4.3c.8.6 1.1.5 2.5.4l12.4-.7c.3 0 .1-.3 0-.3l-2-1.4c-.4-.3-1-.6-2-.6L3 2.5c-.5.1-.6.3-.4.5Zm.8 3V21c0 .7.4 1 1.2 1l14-.8c.8 0 1-.5 1-1.1V6.4c0-.6-.2-.9-.8-.9L5.9 6.4c-.4 0-.6.3-.6.9Zm12.7.7c.1.4 0 .8-.4.9l-.6.1v10c-.6.3-1.1.5-1.6.5-.7 0-.9-.2-1.5-.9L9.4 11.6v6.8l1.2.3s0 .8-1.2.8l-3.1.2c-.1-.2 0-.6.3-.7l.8-.2V9.9L6.2 9.8c-.1-.4.1-1 .8-1l3.3-.2 4.6 7.1V9.4l-1.2-.1c-.1-.5.2-.9.7-1Z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-4.71-6.23-5.4 6.23H2.74l7.73-8.84-7.22-9.51h6.83l4.25 5.62Zm-1.16 17.52h1.83L7.08 4.13H5.12Z"/></svg>`,
  notebooklm: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h9a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm1 3v12h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7Zm2 3h5v2H9V9Zm0 4h5v2H9v-2Z"/></svg>`,
};

const MONO_ICON_MATCHERS = [
  ['mail.google', 'gmail'],
  ['youtube', 'youtube'],
  ['youtu.be', 'youtube'],
  ['openai.com', 'chatgpt'],
  ['chatgpt', 'chatgpt'],
  ['notion', 'notion'],
  ['whatsapp', 'whatsapp'],
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['notebooklm', 'notebooklm'],
];

let managePanelEl = null;
let managePanelOpen = false;
let manageAddedGridEl = null;
let manageLibraryGridEl = null;
let manageUrlInputEl = null;
let manageNameInputEl = null;
let manageAddedEmptyEl = null;
const manageAddedTiles = new Map();
const manageLibraryTiles = new Map();

function getDefaultLinks() {
  return [
    {
      id: generateId(),
      title: 'YouTube',
      url: 'https://youtube.com',
      favicon: getFaviconUrl('https://youtube.com'),
      isApp: true
    },
    {
      id: generateId(),
      title: 'Gmail',
      url: 'https://mail.google.com',
      favicon: getFaviconUrl('https://mail.google.com'),
      isApp: true
    },
    {
      id: generateId(),
      title: 'ChatGPT',
      url: 'https://chat.openai.com',
      favicon: getFaviconUrl('https://chat.openai.com'),
      isApp: true
    }
  ];
}

function ensureQuicklinksStructure() {
  return Boolean(DOM.sidebarGrid && DOM.bottomGrid);
}

function getLinkById(id) {
  return links.find((link) => link.id === id)
    || topSiteLinks.find((link) => link.id === id)
    || null;
}

function isRenderableTopSite(site) {
  if (!site?.url) return false;
  try {
    const parsed = new URL(site.url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapTopSite(site) {
  const url = site.url;
  return {
    id: `topsite:${encodeURIComponent(url)}`,
    title: site.title?.trim() || getDomain(url) || 'Top Site',
    url,
    favicon: getFaviconUrl(url),
    isApp: false,
    isTopSite: true,
  };
}

async function loadTopSiteLinks() {
  const items = await new Promise((resolve) => {
    chrome.topSites.get((sites) => resolve(Array.isArray(sites) ? sites : []));
  });

  const seen = new Set();
  return items
    .filter(isRenderableTopSite)
    .filter((site) => {
      if (seen.has(site.url)) return false;
      seen.add(site.url);
      return true;
    })
    .map(mapTopSite);
}

function migrateStoredLinks(stored) {
  if (!Array.isArray(stored) || stored.length === 0) return getDefaultLinks();
  return stored.filter((link) => link?.isApp === true);
}

function setTileIcon(iconWrap, link) {
  if (!iconWrap) return;
  iconWrap.replaceChildren();

  const host = getDomain(link?.url || '').toLowerCase();
  const match = MONO_ICON_MATCHERS.find(([needle]) => host.includes(needle));
  const iconKey = match?.[1] || null;

  if (iconKey && MONO_ICONS[iconKey]) {
    const span = document.createElement('span');
    span.className = 'quicklink-mono-icon';
    span.innerHTML = MONO_ICONS[iconKey];
    iconWrap.appendChild(span);
    return;
  }

  const fallback = document.createElement('span');
  fallback.className = 'mono-text-fallback';
  fallback.textContent = (link?.title?.trim()?.[0] || 'L').toUpperCase();
  iconWrap.appendChild(fallback);
}

function getAppLinks() {
  return links.filter((link) => link.isApp);
}

function updateManageButtonState() {
  const manageBtn = DOM.manageQuicklinksBtn;
  if (!manageBtn) return;
  manageBtn.classList.toggle('is-manage-open', managePanelOpen);
  manageBtn.setAttribute('aria-expanded', String(managePanelOpen));
}

function createManageAddedTile(link) {
  const item = document.createElement('div');
  item.className = 'manage-link-item';
  item.dataset.linkId = link.id;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'manage-link-icon-wrap';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'manage-link-remove';
  removeBtn.type = 'button';
  removeBtn.textContent = '−';
  removeBtn.setAttribute('aria-label', 'Remove quick link');
  removeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeLink(item.dataset.linkId);
  });

  const name = document.createElement('span');
  name.className = 'manage-link-name';

  item.append(iconWrap, removeBtn, name);
  return item;
}

function updateManageAddedTile(item, link) {
  item.dataset.linkId = link.id;
  const iconWrap = item.querySelector('.manage-link-icon-wrap');
  const name = item.querySelector('.manage-link-name');
  if (iconWrap instanceof HTMLElement) {
    setTileIcon(iconWrap, link);
  }
  if (name instanceof HTMLElement) {
    name.textContent = link.title;
  }
}

function syncManageAddedGrid() {
  if (!manageAddedGridEl) return;
  const targetLinks = getAppLinks();
  manageAddedEmptyEl && (manageAddedEmptyEl.style.display = targetLinks.length === 0 ? 'block' : 'none');

  targetLinks.forEach((link, index) => {
    let node = manageAddedTiles.get(link.id);
    if (!node) {
      node = createManageAddedTile(link);
      manageAddedTiles.set(link.id, node);
    }
    updateManageAddedTile(node, link);
    const atIndex = manageAddedGridEl.children[index];
    if (atIndex !== node) {
      manageAddedGridEl.insertBefore(node, atIndex || null);
    }
  });

  const activeIds = new Set(targetLinks.map((link) => link.id));
  [...manageAddedTiles.entries()].forEach(([id, node]) => {
    if (activeIds.has(id)) return;
    node.remove();
    manageAddedTiles.delete(id);
  });
}

function createManageLibraryTile(entry) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'manage-library-item';
  item.dataset.libraryKey = entry.key;
  item.title = entry.title;
  item.setAttribute('aria-label', `Add ${entry.title}`);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'manage-library-icon-wrap';
  item.append(iconWrap);
  item.addEventListener('click', () => addLibraryLink(entry));
  return item;
}

function updateManageLibraryTile(item, entry) {
  const iconWrap = item.querySelector('.manage-library-icon-wrap');
  if (iconWrap instanceof HTMLElement) {
    setTileIcon(iconWrap, {
      title: entry.title,
      favicon: getFaviconUrl(entry.url),
    });
  }
}

function syncManageLibraryGrid() {
  if (!manageLibraryGridEl) return;
  QUICK_LIBRARY.forEach((entry, index) => {
    let node = manageLibraryTiles.get(entry.key);
    if (!node) {
      node = createManageLibraryTile(entry);
      manageLibraryTiles.set(entry.key, node);
    }
    updateManageLibraryTile(node, entry);
    const atIndex = manageLibraryGridEl.children[index];
    if (atIndex !== node) {
      manageLibraryGridEl.insertBefore(node, atIndex || null);
    }
  });
}

function renderManagePanel() {
  if (!managePanelEl) return;
  syncManageAddedGrid();
  syncManageLibraryGrid();
}

function addLibraryLink(entry) {
  const normalizedUrl = sanitizeUrl(entry.url);
  const exists = links.some((link) => link.isApp && sanitizeUrl(link.url) === normalizedUrl);
  if (exists) {
    toast.info(`${entry.title} is already added`);
    return;
  }
  links.unshift({
    id: generateId(),
    title: entry.title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  toast.success(`${entry.title} added`);
}

function addCustomLinkFromPanel() {
  if (!manageUrlInputEl || !manageNameInputEl) return;
  const rawUrl = manageUrlInputEl.value.trim();
  if (!rawUrl) {
    toast.error('URL cannot be empty');
    return;
  }

  const normalizedUrl = sanitizeUrl(rawUrl);
  const title = manageNameInputEl.value.trim() || getDomain(normalizedUrl) || 'Link';
  const exists = links.some((link) => link.isApp && sanitizeUrl(link.url) === normalizedUrl);
  if (exists) {
    toast.info('This link is already in Quick Links');
    return;
  }

  links.unshift({
    id: generateId(),
    title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  manageUrlInputEl.value = '';
  manageNameInputEl.value = '';
  manageUrlInputEl.focus();
  toast.success('Link added!');
}

function closeManagePanel() {
  managePanelOpen = false;
  if (managePanelEl) {
    managePanelEl.classList.remove('open');
    managePanelEl.setAttribute('aria-hidden', 'true');
  }
  updateManageButtonState();
}

function openManagePanel() {
  const panel = ensureManagePanel();
  managePanelOpen = true;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  renderManagePanel();
  updateManageButtonState();
  setTimeout(() => manageUrlInputEl?.focus(), 50);
}

function toggleManagePanel() {
  if (managePanelOpen) {
    closeManagePanel();
  } else {
    openManagePanel();
  }
}

function handleManageOutsideClick(event) {
  if (!managePanelOpen || !managePanelEl) return;
  const target = event.target;
  const manageBtn = DOM.manageQuicklinksBtn;
  if (managePanelEl.contains(target) || (manageBtn && manageBtn.contains(target))) return;
  closeManagePanel();
}

function handleManageEscape(event) {
  if (event.key === 'Escape') {
    closeManagePanel();
  }
}

function buildManagePanel() {
  const panel = document.createElement('aside');
  panel.id = 'manage-links-panel';
  panel.className = 'manage-links-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Manage quick links');
  panel.setAttribute('aria-hidden', 'true');

  const header = document.createElement('div');
  header.className = 'manage-links-header';

  const title = document.createElement('h3');
  title.className = 'manage-links-title';
  title.textContent = 'Quick Links';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'manage-links-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close quick links panel');
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="6" y1="18" x2="18" y2="6"></line>
    </svg>
  `;
  closeBtn.addEventListener('click', closeManagePanel);
  header.append(title, closeBtn);

  const addedSection = document.createElement('section');
  addedSection.className = 'manage-links-section';
  const addedTitle = document.createElement('p');
  addedTitle.className = 'manage-links-section-title';
  addedTitle.textContent = 'Active Links';
  manageAddedGridEl = document.createElement('div');
  manageAddedGridEl.className = 'manage-links-grid manage-links-added-grid';
  manageAddedEmptyEl = document.createElement('p');
  manageAddedEmptyEl.className = 'manage-links-empty';
  manageAddedEmptyEl.textContent = 'No links added yet.';
  addedSection.append(addedTitle, manageAddedGridEl, manageAddedEmptyEl);

  const divider = document.createElement('div');
  divider.className = 'manage-links-divider';

  const customSection = document.createElement('section');
  customSection.className = 'manage-links-section';
  const customTitle = document.createElement('p');
  customTitle.className = 'manage-links-section-title';
  customTitle.textContent = 'Add New Link';

  const form = document.createElement('form');
  form.className = 'manage-links-form';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addCustomLinkFromPanel();
  });

  manageUrlInputEl = document.createElement('input');
  manageUrlInputEl.type = 'url';
  manageUrlInputEl.className = 'manage-links-input';
  manageUrlInputEl.placeholder = 'https://example.com';
  manageUrlInputEl.autocomplete = 'off';
  const urlWrap = document.createElement('div');
  urlWrap.className = 'manage-input-wrap';
  const urlIcon = document.createElement('span');
  urlIcon.className = 'manage-input-icon';
  urlIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11.6 4.34"></path>
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.4 19.66"></path>
    </svg>
  `;
  urlWrap.append(urlIcon, manageUrlInputEl);

  manageNameInputEl = document.createElement('input');
  manageNameInputEl.type = 'text';
  manageNameInputEl.className = 'manage-links-input';
  manageNameInputEl.placeholder = 'Name';
  manageNameInputEl.autocomplete = 'off';
  const nameWrap = document.createElement('div');
  nameWrap.className = 'manage-input-wrap';
  const nameIcon = document.createElement('span');
  nameIcon.className = 'manage-input-icon';
  nameIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
    </svg>
  `;
  nameWrap.append(nameIcon, manageNameInputEl);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'manage-links-submit';
  submitBtn.textContent = 'Add Link';
  form.append(urlWrap, nameWrap, submitBtn);
  customSection.append(customTitle, form);

  const librarySection = document.createElement('section');
  librarySection.className = 'manage-links-section';
  const libraryTitle = document.createElement('p');
  libraryTitle.className = 'manage-links-section-title';
  libraryTitle.textContent = 'Quick Add';
  manageLibraryGridEl = document.createElement('div');
  manageLibraryGridEl.className = 'manage-links-grid manage-links-library-grid';
  librarySection.append(libraryTitle, manageLibraryGridEl);

  panel.append(header, addedSection, divider, customSection, librarySection);
  return panel;
}

function ensureManagePanel() {
  if (managePanelEl) return managePanelEl;
  managePanelEl = buildManagePanel();
  document.body.appendChild(managePanelEl);
  document.addEventListener('mousedown', handleManageOutsideClick);
  document.addEventListener('keydown', handleManageEscape);
  renderManagePanel();
  return managePanelEl;
}

function renderLinks() {
  if (!ensureQuicklinksStructure()) return;
  const sidebarGrid = DOM.sidebarGrid;
  const bottomGrid = DOM.bottomGrid;
  if (!sidebarGrid || !bottomGrid) return;
  document.getElementById('ql-more-btn')?.remove();

  const appLinks = links.filter((linkData) => linkData.isApp);
  const bottomLinks = topSiteLinks.slice(0, TOP_SITE_LIMIT);

  syncGrid(sidebarGrid, appLinks, true);
  syncGrid(bottomGrid, bottomLinks, false);
  renderManagePanel();
}

function syncGrid(grid, targetLinks, hideLabel = false) {
  const existingById = new Map();
  const allChildren = Array.from(grid.children);

  allChildren.forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const id = child.dataset.linkId;
    if (id) existingById.set(id, child);
  });

  targetLinks.forEach((linkData, index) => {
    let node = existingById.get(linkData.id);
    if (node) {
      existingById.delete(linkData.id);
      node = updateTile(node, linkData, hideLabel);
    } else {
      node = createTile(linkData, hideLabel);
    }

    const currentAtIndex = grid.children[index] || null;
    if (node !== currentAtIndex) {
      grid.insertBefore(node, currentAtIndex);
    }
  });

  existingById.forEach((node) => node.remove());
}

function updateTile(wrapper, link, hideLabel = false) {
  if (!(wrapper instanceof HTMLElement)) return createTile(link, hideLabel);
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;

  const tile = wrapper.querySelector('.quicklink-tile');
  const iconEl = wrapper.querySelector('.ql-icon-wrap');
  const labelEl = wrapper.querySelector('.quicklink-label');

  if (!(tile instanceof HTMLAnchorElement) || !(iconEl instanceof HTMLElement) || !(labelEl instanceof HTMLElement)) {
    const replacement = createTile(link, hideLabel);
    wrapper.replaceWith(replacement);
    return replacement;
  }

  tile.href = link.url;
  tile.title = link.title;
  tile.dataset.id = link.id;
  setTileIcon(iconEl, link);
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);

  return wrapper;
}

function createTile(link, hideLabel = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quicklink-item';
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;

  const a = document.createElement('a');
  a.className = 'quicklink-tile';
  a.href = link.url;
  a.title = link.title;
  a.dataset.id = link.id;
  a.setAttribute('role', 'listitem');

  a.addEventListener('click', (e) => {
    const currentLink = getLinkById(a.dataset.id) || link;
    if (e.button === 1 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    window.location.href = currentLink.url;
  });
  if (!link.isTopSite) {
    a.addEventListener('contextmenu', (e) => {
      const currentLink = getLinkById(a.dataset.id) || link;
      e.preventDefault();
      openContextMenu(e, currentLink);
    });
  }

  const iconEl = document.createElement('div');
  iconEl.className = 'ql-icon-wrap';

  setTileIcon(iconEl, link);

  const labelEl = document.createElement('span');
  labelEl.className = 'quicklink-label';
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);

  a.appendChild(iconEl);
  wrapper.append(a, labelEl);
  return wrapper;
}

function openContextMenu(e, link) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.id = 'ql-context-menu';
  menu.className = 'glass';
  Object.assign(menu.style, {
    position: 'fixed', zIndex: '999', padding: '8px',
    minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px',
    left: e.clientX + 'px', top: e.clientY + 'px',
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'engine-option';
  editBtn.textContent = 'Edit';
  editBtn.ariaLabel = 'Edit quick link';
  editBtn.onclick = () => { removeContextMenu(); openLinkModal(link); };

  const delBtn = document.createElement('button');
  delBtn.className = 'engine-option';
  delBtn.textContent = 'Delete';
  delBtn.ariaLabel = 'Delete quick link';
  delBtn.onclick = () => { removeContextMenu(); removeLink(link.id); };

  menu.append(editBtn, delBtn);
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('mousedown', (ev) => {
      if (!menu.contains(ev.target)) removeContextMenu();
    }, { once: true });
  }, 10);
}

function removeContextMenu() {
  document.querySelector('#ql-context-menu')?.remove();
}

function openLinkModal(existingLink = null) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box glass';

  const heading = document.createElement('h3');
  heading.textContent = existingLink ? 'Edit Quick Link' : 'Add Quick Link';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title e.g. GitHub';
  if (existingLink) titleInput.value = existingLink.title;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'https://...';
  if (existingLink) urlInput.value = existingLink.url;

  const sidebarToggleLabel = document.createElement('label');
  sidebarToggleLabel.className = 'ql-sidebar-toggle';
  const sidebarToggle = document.createElement('input');
  sidebarToggle.type = 'checkbox';
  sidebarToggle.id = 'ql-pin-sidebar';
  sidebarToggle.checked = existingLink?.isApp === true;
  sidebarToggleLabel.append(sidebarToggle, document.createTextNode(' Pin to Sidebar (App Icon)'));

  const close = () => overlay.remove();

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.ariaLabel = 'Cancel quick link edit';
  cancelBtn.onclick = close;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.ariaLabel = 'Save quick link';
  saveBtn.onclick = () => {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) { toast.error('URL cannot be empty'); return; }
    const url = sanitizeUrl(rawUrl);
    const title = titleInput.value.trim() || getDomain(url) || 'Link';
    const isApp = sidebarToggle.checked;
    if (existingLink) updateLink(existingLink.id, title, url, isApp);
    else addLink(title, url, isApp);
    close();
  };

  box.append(heading, titleInput, urlInput, sidebarToggleLabel, cancelBtn, saveBtn);
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.body.appendChild(overlay);
  setTimeout(() => titleInput.focus(), 50);
}

function emitLinksUpdated() {
  bus.dispatchEvent(new CustomEvent('linksUpdated', { detail: { links: [...links], source: 'quicklinks' } }));
}

function persistLinks() {
  Store.setLinks(links);
  emitLinksUpdated();
}

function addLink(title, url, isApp = false) {
  links.push({ id: generateId(), title, url: sanitizeUrl(url), favicon: getFaviconUrl(url), isApp });
  persistLinks();
  renderLinks();
  toast.success('Link added!');
}

function updateLink(id, title, url, isApp = false) {
  const link = links.find(l => l.id === id);
  if (!link) return;
  link.title = title;
  link.url = sanitizeUrl(url);
  link.favicon = getFaviconUrl(url);
  link.isApp = isApp;
  persistLinks();
  renderLinks();
  toast.success('Link updated!');
}

function removeLink(id) {
  links = links.filter(l => l.id !== id);
  persistLinks();
  renderLinks();
  toast.info('Link removed');
}

export async function initQuickLinks() {
  const stored = await Store.getLinks();
  links = migrateStoredLinks(stored);
  if (!Array.isArray(stored) || stored.length !== links.length) {
    await Store.setLinks(links);
  }
  topSiteLinks = await loadTopSiteLinks();
  renderLinks();

  const manageBtn = DOM.manageQuicklinksBtn;
  if (manageBtn) {
    manageBtn.setAttribute('aria-label', 'Manage quick links');
    manageBtn.setAttribute('aria-expanded', 'false');
    manageBtn.setAttribute('aria-controls', 'manage-links-panel');
    manageBtn.addEventListener('click', (event) => {
      event.preventDefault();
      toggleManagePanel();
    });
  }

  const refreshTopSites = async () => {
    topSiteLinks = await loadTopSiteLinks();
    renderLinks();
  };

  window.addEventListener('focus', () => {
    refreshTopSites();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshTopSites();
  });

  bus.addEventListener('linksUpdated', (event) => {
    const incoming = event.detail?.links;
    if (!Array.isArray(incoming) || event.detail?.source === 'quicklinks') return;
    links = incoming.filter((link) => link?.isApp === true);
    renderLinks();
  });
}
