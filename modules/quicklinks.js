import { Store, Prefs } from './storage.js';
import { generateId, getFaviconUrl, sanitizeUrl, truncate, getDomain } from './utils.js';
import { toast } from './toast.js';

let links = [];
let maxLinks = 12;

function getDefaultLinks() {
  return [
    { id: generateId(), title: 'YouTube',  url: 'https://youtube.com',  favicon: getFaviconUrl('https://youtube.com') },
    { id: generateId(), title: 'GitHub',   url: 'https://github.com',   favicon: getFaviconUrl('https://github.com') },
    { id: generateId(), title: 'Gmail',    url: 'https://gmail.com',    favicon: getFaviconUrl('https://gmail.com') },
    { id: generateId(), title: 'Twitter',  url: 'https://twitter.com',  favicon: getFaviconUrl('https://twitter.com') },
  ];
}

function renderLinks() {
  const container = document.getElementById('quicklinks-section');
  const grid = document.getElementById('quicklinks-grid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:8px;`;
  links.forEach(link => grid.appendChild(createTile(link)));
  const addBtn = document.getElementById('add-link-btn');
  if (addBtn) {
    addBtn.style.display = links.length >= maxLinks ? 'none' : '';
    addBtn.style.cssText = `width:36px;
height:36px;
border-radius:50%;
background:transparent;
border:1px dashed rgba(255,255,255,0.15);
color:rgba(255,255,255,0.25);
font-size:1rem;
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
margin-top:4px;
transition:all 150ms ease;`;
  }

  // Build glass pill wrapper once
  let pill = container?.querySelector('.ql-pill');
  if (container && !pill) {
    pill = document.createElement('div');
    pill.className = 'ql-pill';
    pill.style.cssText = `background:rgba(255,255,255,0.06);
border:1px solid rgba(255,255,255,0.10);
border-radius:20px;
padding:12px 8px;
display:flex;
flex-direction:column;
align-items:center;
gap:6px;
backdrop-filter:blur(12px);
-webkit-backdrop-filter:blur(12px);`;
    container.innerHTML = '';
    pill.appendChild(grid);
    if (addBtn) pill.appendChild(addBtn);
    container.appendChild(pill);
  }
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
  a.style.cssText = `display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 56px;`;

  a.addEventListener('click', (e) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    window.location.href = link.url;
  });
  a.addEventListener('contextmenu', (e) => { e.preventDefault(); openContextMenu(e, link); });

  const iconEl = document.createElement('div');
  iconEl.style.cssText = `width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease;`;

  if (link.favicon) {
    const img = document.createElement('img');
    img.className = 'quicklink-favicon';
    img.src = link.favicon;
    img.onerror = () => {
      const ph = document.createElement('div');
      ph.className = 'quicklink-favicon-placeholder';
      ph.textContent = (link.title[0] || '?').toUpperCase();
      iconEl.replaceChildren(ph);
    };
    iconEl.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'quicklink-favicon-placeholder';
    ph.textContent = (link.title[0] || '?').toUpperCase();
    iconEl.appendChild(ph);
  }

  const label = document.createElement('span');
  label.className = 'quicklink-label';
  label.style.cssText = `font-size: 0.72rem;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56px;`;
  label.textContent = truncate(link.title, 12);

  a.appendChild(iconEl);
  wrapper.appendChild(a);
  wrapper.appendChild(label);
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
  delBtn.onclick = () => { removeContextMenu(); deleteLink(link.id); };

  menu.append(editBtn, delBtn);
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('mousedown', (ev) => {
      if (!menu.contains(ev.target)) removeContextMenu();
    }, { once: true });
  }, 10);
}

function removeContextMenu() {
  document.getElementById('ql-context-menu')?.remove();
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
    if (existingLink) updateLink(existingLink.id, title, url);
    else saveLink(title, url);
    close();
  };

  box.append(heading, titleInput, urlInput, cancelBtn, saveBtn);
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.body.appendChild(overlay);
  setTimeout(() => titleInput.focus(), 50);
}

function saveLink(title, url) {
  links.push({ id: generateId(), title, url: sanitizeUrl(url), favicon: getFaviconUrl(url) });
  Store.setLinks(links);
  renderLinks();
  toast.success('Link added!');
}

function updateLink(id, title, url) {
  const link = links.find(l => l.id === id);
  if (!link) return;
  link.title = title;
  link.url = sanitizeUrl(url);
  link.favicon = getFaviconUrl(url);
  Store.setLinks(links);
  renderLinks();
  toast.success('Link updated!');
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  Store.setLinks(links);
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
  document.getElementById('add-link-btn')?.addEventListener('click', () => openLinkModal());
  Prefs.onChange((changes) => {
    if ('quickLinksMax' in changes) { maxLinks = changes.quickLinksMax; renderLinks(); }
  });
}
