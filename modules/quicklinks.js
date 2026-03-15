import { Store, Prefs } from './storage.js';
import { generateId, getFaviconUrl, sanitizeUrl, getDomain } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

let links = [];
let maxLinks = 12;

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
    },
    {
      id: generateId(),
      title: 'GitHub',
      url: 'https://github.com',
      favicon: getFaviconUrl('https://github.com'),
      isApp: false
    },
    {
      id: generateId(),
      title: 'Twitter',
      url: 'https://twitter.com',
      favicon: getFaviconUrl('https://twitter.com'),
      isApp: false
    }
  ];
}

function ensureQuicklinksStructure() {
  return Boolean(DOM.sidebarGrid && DOM.bottomGrid);
}

function getLinkById(id) {
  return links.find((link) => link.id === id) || null;
}

function setTileIcon(iconWrap, link) {
  if (!iconWrap) return;

  if (link.favicon) {
    const img = document.createElement('img');
    img.className = 'quicklink-favicon';
    img.src = link.favicon;
    img.onerror = () => {
      const ph = document.createElement('div');
      ph.className = 'quicklink-favicon-placeholder';
      ph.textContent = (link.title[0] || '?').toUpperCase();
      iconWrap.replaceChildren(ph);
    };
    iconWrap.replaceChildren(img);
    return;
  }

  const ph = document.createElement('div');
  ph.className = 'quicklink-favicon-placeholder';
  ph.textContent = (link.title[0] || '?').toUpperCase();
  iconWrap.replaceChildren(ph);
}

function renderLinks() {
  if (!ensureQuicklinksStructure()) return;
  const sidebarGrid = DOM.sidebarGrid;
  const bottomGrid = DOM.bottomGrid;
  if (!sidebarGrid || !bottomGrid) return;

  sidebarGrid.innerHTML = '';
  bottomGrid.innerHTML = '';

  links.forEach((linkData) => {
    const tile = createTile(linkData);
    if (linkData.isApp) {
      sidebarGrid.appendChild(tile);
      const label = tile.querySelector('.quicklink-label');
      if (label) label.classList.add('quicklink-label-hidden');
      return;
    }
    bottomGrid.appendChild(tile);
  });

  if (DOM.addLinkBtn && DOM.bottomGrid?.parentElement) {
    DOM.bottomGrid.parentElement.appendChild(DOM.addLinkBtn);
  }

  const addBtn = DOM.addLinkBtn;
  if (addBtn) addBtn.style.display = links.length >= maxLinks ? 'none' : '';
}

function createTile(link) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quicklink-item';

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
  a.addEventListener('contextmenu', (e) => {
    const currentLink = getLinkById(a.dataset.id) || link;
    e.preventDefault();
    openContextMenu(e, currentLink);
  });

  const iconEl = document.createElement('div');
  iconEl.className = 'ql-icon-wrap';

  setTileIcon(iconEl, link);

  const labelEl = document.createElement('span');
  labelEl.className = 'quicklink-label';
  labelEl.textContent = link.title;

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
  editBtn.onclick = () => { removeContextMenu(); openLinkModal(link); };

  const delBtn = document.createElement('button');
  delBtn.className = 'engine-option';
  delBtn.textContent = 'Delete';
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
  cancelBtn.onclick = close;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) { toast.error('URL cannot be empty'); return; }
    const url = sanitizeUrl(rawUrl);
    const title = titleInput.value.trim() || getDomain(url) || 'Link';
    const isApp = document.getElementById('ql-pin-sidebar')?.checked || false;
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
  maxLinks = await Prefs.get('quickLinksMax') || 12;
  const stored = await Store.getLinks();
  if (stored.length === 0) {
    links = getDefaultLinks();
    await Store.setLinks(links);
  } else {
    links = stored;
  }
  renderLinks();
  DOM.addLinkBtn?.addEventListener('click', () => openLinkModal());
  bus.addEventListener('linksUpdated', (event) => {
    const incoming = event.detail?.links;
    if (!Array.isArray(incoming) || event.detail?.source === 'quicklinks') return;
    links = incoming;
    renderLinks();
  });
  Prefs.onChange((changes) => {
    if ('quickLinksMax' in changes) { maxLinks = changes.quickLinksMax; renderLinks(); }
  });
}
