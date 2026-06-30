import { Store } from '../modules/storage.js';
import { copyToClipboard } from '../modules/utils.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let items = [];
let permissionGranted = false;
let autoCapture = false;

function getRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

async function checkPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'clipboard-read' });
    permissionGranted = result.state === 'granted';
    result.onchange = () => { permissionGranted = result.state === 'granted'; };
  } catch { permissionGranted = false; }
}

async function requestPermission() {
  try {
    await navigator.clipboard.readText();
    permissionGranted = true; autoCapture = true;
    toast.success('Clipboard access granted!');
  } catch { toast.error('Permission denied. Please allow clipboard access.'); }
  renderAll();
}

async function captureClipboard() {
  if (!permissionGranted || !autoCapture) return;
  try {
    const text = (await navigator.clipboard.readText()).trim();
    if (!text) return;
    if (items.some(i => i.content === text && Date.now() - i.timestamp < 2000)) return;
    items.unshift({ id: Date.now().toString(), content: text, timestamp: Date.now(), pinned: false });
    const pinned = items.filter(i => i.pinned);
    const unpinned = items.filter(i => !i.pinned);
    items = [...pinned, ...unpinned.slice(0, 20 - pinned.length)];
    Store.setClipboard(items);
    renderAll();
  } catch {}
}

let captureHandler = null;

function setupCaptureListeners() {
  if (captureHandler) {
    document.removeEventListener('copy', captureHandler);
    document.removeEventListener('cut', captureHandler);
  }
  captureHandler = () => setTimeout(captureClipboard, 100);
  document.addEventListener('copy', captureHandler);
  document.addEventListener('cut', captureHandler);
}

function removeCaptureListeners() {
  if (captureHandler) {
    document.removeEventListener('copy', captureHandler);
    document.removeEventListener('cut', captureHandler);
    captureHandler = null;
  }
}

function toggleBtn(on, onclick) {
  const b = document.createElement('div');
  b.className = `qt-toggle ${on ? 'on' : 'off'}`;
  const dot = document.createElement('div');
  dot.className = 'qt-toggle-dot';
  b.appendChild(dot);
  b.onclick = onclick;
  return b;
}

function renderAll() {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  if (!permissionGranted) {
    const card = document.createElement('div');
    card.className = 'qt-card qt-mb-md';
    const p = document.createElement('p');
    p.textContent = 'Clipboard history requires permission to read your clipboard. Enable auto-capture to get started.';
    p.className = 'qt-text qt-mb-md';
    const row = document.createElement('div');
    row.className = 'qt-flex-between';
    const lbl = document.createElement('span');
    lbl.textContent = 'Enable auto-capture';
    lbl.style.cssText = 'font-size:0.78rem;color:var(--text-primary);';
    row.append(lbl, toggleBtn(false, requestPermission));
    card.append(p, row);
    containerEl.appendChild(card);
  }

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'qt-flex-between qt-mb-md';
  const h3 = document.createElement('h3');
  h3.textContent = 'Clipboard History';
  h3.className = 'qt-title';
  hdr.appendChild(h3);
  if (items.length > 0 || permissionGranted) {
    const right = document.createElement('div');
    right.className = 'qt-flex qt-gap-sm qt-flex-center';
    if (permissionGranted) {
      right.appendChild(toggleBtn(autoCapture, () => {
        if (!autoCapture && !permissionGranted) { requestPermission(); return; }
        autoCapture = !autoCapture;
        renderAll();
      }));
    }
    if (items.length > 0) {
      const clr = document.createElement('button');
      clr.textContent = 'Clear';
      clr.className = 'qt-btn-ghost';
      clr.onclick = clearAll;
      right.appendChild(clr);
    }
    hdr.appendChild(right);
  }
  containerEl.appendChild(hdr);

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'qt-empty';
    empty.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg><div>Copy something to get started</div>`;
    containerEl.appendChild(empty);
    return;
  }

  const sorted = [...items.filter(i => i.pinned), ...items.filter(i => !i.pinned)];
  const list = document.createElement('div');
  sorted.forEach(i => list.appendChild(createItemCard(i)));
  containerEl.appendChild(list);
}

function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'qt-card interactive qt-mb-sm';
  card.style.minHeight = '52px';
  card.style.maxHeight = '80px';
  card.style.padding = '10px 12px';
  card.onclick = () => copyToClipboard(item.content).then(() => toast.info('Copied!'));

  const pre = document.createElement('pre');
  pre.textContent = item.content;
  pre.style.cssText = 'font-family:var(--font-ui),sans-serif;font-size:0.78rem;color:var(--text-primary);white-space:pre-wrap;word-break:break-word;overflow:hidden;line-height:1.5;margin:0;max-height:60px;';

  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:24px;background:linear-gradient(to top,var(--glass-subtle),transparent);pointer-events:none;transition:all 150ms ease;';

  const time = document.createElement('span');
  time.textContent = getRelativeTime(item.timestamp);
  time.className = 'qt-date';
  time.style.cssText = 'position:absolute;bottom:6px;right:8px;';

  const acts = document.createElement('div');
  acts.className = 'qt-card-actions';
  acts.style.top = '6px';
  acts.style.right = '6px';

  const pinBtn = document.createElement('button');
  pinBtn.innerHTML = item.pinned
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  pinBtn.className = 'qt-icon-btn';
  pinBtn.style.width = '24px';
  pinBtn.style.height = '24px';
  pinBtn.onclick = (e) => { e.stopPropagation(); item.pinned = !item.pinned; Store.setClipboard(items); renderAll(); };

  const delBtn = document.createElement('button');
  delBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  delBtn.className = 'qt-icon-btn';
  delBtn.style.width = '24px';
  delBtn.style.height = '24px';
  delBtn.onclick = (e) => { e.stopPropagation(); deleteItem(item.id); };

  acts.append(pinBtn, delBtn);
  card.append(pre, fade, time, acts);

  card.onmouseenter = () => { fade.style.background = 'linear-gradient(to top,var(--glass-bg),transparent)'; };
  card.onmouseleave = () => { fade.style.background = 'linear-gradient(to top,var(--glass-subtle),transparent)'; };
  return card;
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  Store.setClipboard(items);
  toast.info('Removed');
  renderAll();
}

function clearAll() {
  if (!items.length) return;
  items = [];
  Store.setClipboard([]);
  toast.info('Clipboard cleared');
  renderAll();
}

export async function initClipboard(container) {
  containerEl = container;
  items = await Store.getClipboard();
  await checkPermission();
  if (permissionGranted) { autoCapture = true; setupCaptureListeners(); }
  renderAll();

  return () => {
    removeCaptureListeners();
  };
}

