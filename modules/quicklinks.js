import { Prefs, Store } from './storage.js';
import { generateId, getFaviconUrl, getFaviconFallbackUrl, sanitizeUrl, getDomain, getFriendlyName } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

let links = [];
let topSiteLinks = [];
let topSiteLimit = 6;
const QUICK_LIBRARY = [
  { key: 'gmail', label: 'Gmail', url: 'https://mail.google.com' },
  { key: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
  { key: 'chatgpt', label: 'ChatGPT', url: 'https://chat.openai.com' },
  { key: 'github', label: 'GitHub', url: 'https://github.com' },
  { key: 'twitter', label: 'X', url: 'https://x.com' },
  { key: 'notion', label: 'Notion', url: 'https://notion.so' },
  { key: 'whatsapp', label: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { key: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
  { key: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
  { key: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
  { key: 'discord', label: 'Discord', url: 'https://discord.com' },
  { key: 'slack', label: 'Slack', url: 'https://slack.com' },
  { key: 'spotify', label: 'Spotify', url: 'https://open.spotify.com' },
  { key: 'reddit', label: 'Reddit', url: 'https://reddit.com' },
  { key: 'tiktok', label: 'TikTok', url: 'https://tiktok.com' },
  { key: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
  { key: 'telegram', label: 'Telegram', url: 'https://web.telegram.org' },
  { key: 'drive', label: 'Drive', url: 'https://drive.google.com' },
  { key: 'calendar', label: 'Calendar', url: 'https://calendar.google.com' },
  { key: 'figma', label: 'Figma', url: 'https://figma.com' },
  { key: 'vscode', label: 'VS Code', url: 'https://vscode.dev' },
  { key: 'linear', label: 'Linear', url: 'https://linear.app' },
  { key: 'vercel', label: 'Vercel', url: 'https://vercel.com' },
  { key: 'openai', label: 'OpenAI', url: 'https://openai.com' },
  { key: 'amazon', label: 'Amazon', url: 'https://amazon.com' },
  { key: 'claude', label: 'Claude', url: 'https://claude.ai' },
  { key: 'gemini', label: 'Gemini', url: 'https://gemini.google.com' },
  { key: 'notebooklm', label: 'NotebookLM', url: 'https://notebooklm.google.com' },
  { key: 'perplexity', label: 'Perplexity', url: 'https://perplexity.ai' },
  { key: 'netflix', label: 'Netflix', url: 'https://netflix.com' },
  { key: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { key: 'leetcode', label: 'LeetCode', url: 'https://leetcode.com' },
  { key: 'codepen', label: 'CodePen', url: 'https://codepen.io' },
  { key: 'replit', label: 'Replit', url: 'https://replit.com' },
  { key: 'huggingface', label: 'HuggingFace', url: 'https://huggingface.co' },
  { key: 'medium', label: 'Medium', url: 'https://medium.com' },
  { key: 'hashnode', label: 'Hashnode', url: 'https://hashnode.com' },
  { key: 'devto', label: 'Dev.to', url: 'https://dev.to' },
  { key: 'producthunt', label: 'Product Hunt', url: 'https://producthunt.com' },
  { key: 'anthropic', label: 'Anthropic', url: 'https://anthropic.com' },
  { key: 'excalidraw', label: 'Excalidraw', url: 'https://excalidraw.com' },
  { key: 'netlify', label: 'Netlify', url: 'https://netlify.com' },
  { key: 'supabase', label: 'Supabase', url: 'https://supabase.com' },
  { key: 'railway', label: 'Railway', url: 'https://railway.app' },
  { key: 'npm', label: 'npm', url: 'https://npmjs.com' },
  { key: 'mdn', label: 'MDN', url: 'https://developer.mozilla.org' },
  { key: 'cloudflare', label: 'Cloudflare', url: 'https://cloudflare.com' },
  { key: 'twitch', label: 'Twitch', url: 'https://twitch.tv' },
  { key: 'maps', label: 'Maps', url: 'https://maps.google.com' },
  { key: 'translate', label: 'Translate', url: 'https://translate.google.com' },
];

let MONO_ICONS = {};

let managePanelEl = null;
let managePanelOpen = false;
let manageAddedGridEl = null;
let manageLibraryGridEl = null;
let manageUrlInputEl = null;
let manageNameInputEl = null;
let manageAddedEmptyEl = null;
let managePanelCloseTimer = null;
const manageAddedTiles = new Map();
const manageLibraryTiles = new Map();

const ICON_KEY_ALIASES = {
  twitter: ['x.com', 'twitter.com'],
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  openai: ['openai.com'],
  devto: ['dev.to'],
  mdn: ['developer.mozilla.org', 'developer.mozilla'],
  maps: ['maps.google'],
  translate: ['translate.google'],
  gmail: ['mail.google.com', 'gmail.com'],
  drive: ['drive.google.com'],
  calendar: ['calendar.google.com'],
  notion: ['notion.so', 'notion.site'],
  npm: ['npmjs.com'],
  vscode: ['vscode.dev', 'code.visualstudio.com'],
  netlify: ['netlify.com', 'netlify.app'],
  railway: ['railway.app'],
  huggingface: ['huggingface.co'],
  stackoverflow: ['stackoverflow.com'],
  notebooklm: ['notebooklm.google.com', 'notebooklm.google'],
  perplexity: ['perplexity.ai'],
  whatsapp: ['web.whatsapp.com', 'whatsapp.com'],
  claude: ['claude.ai'],
};

const QUICKLINK_LABEL_FONT_FAMILY = "'Geist', 'Inter', system-ui, sans-serif";
const QUICKLINK_LABEL_FONT_WEIGHT = '300';
const SIDEBAR_REORDER_ANIM_MS = 700;
const SIDEBAR_DRAG_START_THRESHOLD_PX = 5;

let draggingSidebarLinkId = null;
let sidebarReorderDirty = false;
let sidebarDragSignature = '';
let sidebarDragPreviewEl = null;
let sidebarGlobalDragBound = false;
let sidebarSuppressClickUntil = 0;
let sidebarDraggedItemEl = null;
let sidebarDragPointerId = null;
let sidebarDragOffsetX = 0;
let sidebarDragOffsetY = 0;
let sidebarPendingLinkId = '';
let sidebarPointerStartX = 0;
let sidebarPointerStartY = 0;

function getDefaultLinks() {
  return [
    {
      id: generateId(),
      key: 'gmail',
      title: 'Gmail',
      url: 'https://mail.google.com',
      favicon: getFaviconUrl('https://mail.google.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'youtube',
      title: 'YouTube',
      url: 'https://youtube.com',
      favicon: getFaviconUrl('https://youtube.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'whatsapp',
      title: 'WhatsApp',
      url: 'https://web.whatsapp.com',
      favicon: getFaviconUrl('https://web.whatsapp.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'chatgpt',
      title: 'ChatGPT',
      url: 'https://chat.openai.com',
      favicon: getFaviconUrl('https://chat.openai.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'claude',
      title: 'Claude',
      url: 'https://claude.ai',
      favicon: getFaviconUrl('https://claude.ai'),
      isApp: true
    }
  ];
}

function ensureQuicklinksStructure() {
  return Boolean(DOM.sidebarGrid && DOM.bottomGrid);
}

function ensureQuicklinksStyles() {
  if (document.querySelector('link[data-quicklinks-css="true"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime?.getURL ? chrome.runtime.getURL('modules/quicklinks.css') : 'modules/quicklinks.css';
  link.dataset.quicklinksCss = 'true';
  document.head.appendChild(link);
}

function normalizeIconKey(key) {
  if (!key) return '';
  const lowered = String(key).toLowerCase();
  if (lowered === 'x') return 'twitter';
  return lowered;
}

function getNormalizedDomain(url) {
  try {
    return new URL(sanitizeUrl(url)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function resolveIconKey(link) {
  const explicitKey = normalizeIconKey(link?.key);
  if (explicitKey && MONO_ICONS[explicitKey]) return explicitKey;

  const url = String(link?.url || '').toLowerCase();
  const domain = getNormalizedDomain(url);
  if (!domain) return null;

  for (const [iconKey, patterns] of Object.entries(ICON_KEY_ALIASES)) {
    if (patterns.some((pattern) => domain.includes(pattern) || url.includes(pattern))) {
      return iconKey;
    }
  }

  for (const iconKey of Object.keys(MONO_ICONS)) {
    if (domain.includes(iconKey) || url.includes(iconKey)) {
      return iconKey;
    }
  }

  return null;
}

function getLinkById(id) {
  return links.find((link) => link.id === id)
    || topSiteLinks.find((link) => link.id === id)
    || null;
}

function renderFallbackIcon(iconEl, link) {
  if (!iconEl) return;
  iconEl.innerHTML = '';

  const iconKey = resolveIconKey(link);
  if (iconKey && MONO_ICONS[iconKey]) {
    const iconData = MONO_ICONS[iconKey];
    if (typeof iconData === 'string') {
      iconEl.innerHTML = iconData;
    } else if (iconData && iconData.path) {
      const vb = iconData.viewBox || '0 0 24 24';
      iconEl.innerHTML = `<svg viewBox="${vb}" fill="white" fill-rule="evenodd" clip-rule="evenodd"><path d="${iconData.path}"/></svg>`;
    }
    const svgEl = iconEl.querySelector('svg');
    if (svgEl) svgEl.style.cssText = 'width:22px;height:22px;opacity:0.9;';
    return;
  }

  const domain = getNormalizedDomain(link?.url || '');
  const letter = (link?.title || domain || '?').charAt(0).toUpperCase();
  const fallbackSpan = document.createElement('span');
  fallbackSpan.className = 'mono-text-fallback';
  fallbackSpan.textContent = letter;
  iconEl.appendChild(fallbackSpan);
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

function setTileIcon(iconEl, link, useRawFavicon = false) {
  if (!iconEl) return;
  iconEl.innerHTML = '';
  if (useRawFavicon) {
    const primaryUrl = link?.favicon || getFaviconUrl(link?.url || '');
    const fallbackUrl = getFaviconFallbackUrl(link?.url || '');
    if (!primaryUrl) return;
    const img = document.createElement('img');
    img.className = 'quicklink-native-favicon';
    img.src = primaryUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.draggable = false;
    let triedFallback = false;
    img.onerror = () => {
      if (!triedFallback && fallbackUrl) {
        triedFallback = true;
        img.src = fallbackUrl;
      } else {
        renderFallbackIcon(iconEl, link);
      }
    };
    iconEl.appendChild(img);
    return;
  }
  const iconKey = resolveIconKey(link);

  if (iconKey && MONO_ICONS[iconKey]) {
    const iconData = MONO_ICONS[iconKey];
    if (typeof iconData === 'string') {
      iconEl.innerHTML = iconData;
    } else if (iconData && iconData.path) {
      const vb = iconData.viewBox || '0 0 24 24';
      iconEl.innerHTML = `<svg viewBox="${vb}" fill="white" fill-rule="evenodd" clip-rule="evenodd"><path d="${iconData.path}"/></svg>`;
    }
    const svgEl = iconEl.querySelector('svg');
    if (svgEl) svgEl.style.cssText = 'width:22px;height:22px;opacity:0.9;';
    return;
  }

  const domain = getNormalizedDomain(link?.url || '');
  if (!domain) return;

  const primaryUrl = getFaviconUrl(link?.url || '');
  const fallbackUrl = getFaviconFallbackUrl(link?.url || '');

  const img = document.createElement('img');
  img.className = 'quicklink-color-favicon fallback-icon';
  img.src = primaryUrl;
  img.alt = '';
  img.loading = 'lazy';
  img.draggable = false;
  
  let triedFallback = false;
  img.onerror = () => {
    if (!triedFallback && fallbackUrl) {
      triedFallback = true;
      img.src = fallbackUrl;
    } else {
      renderFallbackIcon(iconEl, link);
    }
  };
  iconEl.appendChild(img);
}

function inferLinkKey(url) {
  return resolveIconKey({ url }) || undefined;
}

function getAppLinks() {
  return links.filter((link) => link.isApp);
}

function isSidebarGrid(grid) {
  return grid?.id === 'sidebar-apps-grid';
}

function cleanupSidebarDragPreview() {
  if (!sidebarDragPreviewEl) return;
  sidebarDragPreviewEl.remove();
  sidebarDragPreviewEl = null;
}

function createSidebarDragPreview(item) {
  cleanupSidebarDragPreview();
  const tile = item.querySelector('.quicklink-tile');
  if (!(tile instanceof HTMLElement)) return null;

  const preview = tile.cloneNode(true);
  if (!(preview instanceof HTMLElement)) return null;

  preview.removeAttribute('href');
  preview.setAttribute('aria-hidden', 'true');
  preview.style.pointerEvents = 'none';
  preview.style.position = 'fixed';
  preview.style.top = '0';
  preview.style.left = '0';
  preview.style.margin = '0';
  preview.style.transform = 'translate3d(-9999px, -9999px, 0)';
  preview.style.transition = 'none';
  preview.style.opacity = '0.98';
  preview.style.zIndex = '10000';
  preview.style.cursor = 'grabbing';
  preview.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)';
  preview.style.backdropFilter = 'blur(12px)';
  preview.style.WebkitBackdropFilter = 'blur(12px)';

  document.body.appendChild(preview);
  sidebarDragPreviewEl = preview;
  return preview;
}

function clearDraggingClassFromSidebar() {
  const grid = DOM.sidebarGrid;
  if (!grid) return;
  Array.from(grid.children).forEach((child) => {
    if (child instanceof HTMLElement) child.classList.remove('is-dragging');
  });
}

function resetSidebarDragState({ persist = false } = {}) {
  clearDraggingClassFromSidebar();
  cleanupSidebarDragPreview();
  document.body.classList.remove('is-sidebar-reordering');

  if (persist && sidebarReorderDirty) {
    persistSidebarOrderFromDom();
  }

  draggingSidebarLinkId = null;
  sidebarReorderDirty = false;
  sidebarDragSignature = '';
  sidebarDraggedItemEl = null;
  sidebarDragPointerId = null;
  sidebarDragOffsetX = 0;
  sidebarDragOffsetY = 0;
  sidebarPendingLinkId = '';
  sidebarPointerStartX = 0;
  sidebarPointerStartY = 0;
}

function positionSidebarDragPreview(clientX, clientY) {
  if (!sidebarDragPreviewEl) return;
  const left = clientX - sidebarDragOffsetX;
  const top = clientY - sidebarDragOffsetY;
  sidebarDragPreviewEl.style.top = '0';
  sidebarDragPreviewEl.style.left = '0';
  sidebarDragPreviewEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}

function activateSidebarPointerDrag(clientX, clientY) {
  if (draggingSidebarLinkId || !(sidebarDraggedItemEl instanceof HTMLElement) || !sidebarPendingLinkId) return;
  draggingSidebarLinkId = sidebarPendingLinkId;
  sidebarDraggedItemEl.classList.add('is-dragging');
  document.body.classList.add('is-sidebar-reordering');
  const preview = createSidebarDragPreview(sidebarDraggedItemEl);
  if (preview) {
    positionSidebarDragPreview(clientX, clientY);
  }
}

function reorderSidebarFromPointer(clientX, clientY) {
  if (!draggingSidebarLinkId || !(sidebarDraggedItemEl instanceof HTMLElement)) return;
  const grid = DOM.sidebarGrid;
  if (!(grid instanceof HTMLElement) || !grid.contains(sidebarDraggedItemEl)) return;

  let target = document.elementFromPoint(clientX, clientY)?.closest('.quicklink-item') || null;
  let insertAfter = false;

  if (!(target instanceof HTMLElement) || target === sidebarDraggedItemEl || !grid.contains(target)) {
    const candidates = Array.from(grid.children).filter((child) => (
      child instanceof HTMLElement && child !== sidebarDraggedItemEl
    ));
    if (candidates.length === 0) return;

    const nextTarget = candidates.find((child) => {
      const rect = child.getBoundingClientRect();
      return clientY < rect.top + (rect.height / 2);
    });

    if (nextTarget) {
      target = nextTarget;
      insertAfter = false;
    } else {
      target = candidates[candidates.length - 1];
      insertAfter = true;
    }
  } else {
    const rect = target.getBoundingClientRect();
    insertAfter = clientY > rect.top + (rect.height / 2);
  }

  if (!(target instanceof HTMLElement)) return;

  const signature = `${target.dataset.linkId || ''}:${insertAfter ? 'after' : 'before'}`;
  if (signature === sidebarDragSignature) return;

  sidebarDragSignature = signature;
  animateSidebarReflow(grid, () => {
    if (insertAfter) {
      grid.insertBefore(sidebarDraggedItemEl, target.nextSibling);
    } else {
      grid.insertBefore(sidebarDraggedItemEl, target);
    }
  });
  sidebarReorderDirty = true;
}

function handleGlobalSidebarPointerMove(event) {
  if (sidebarDragPointerId === null || event.pointerId !== sidebarDragPointerId) return;

  if (!draggingSidebarLinkId) {
    const dx = event.clientX - sidebarPointerStartX;
    const dy = event.clientY - sidebarPointerStartY;
    if (Math.hypot(dx, dy) < SIDEBAR_DRAG_START_THRESHOLD_PX) return;
    event.preventDefault();
    activateSidebarPointerDrag(event.clientX, event.clientY);
  }

  if (!draggingSidebarLinkId) return;
  event.preventDefault();
  positionSidebarDragPreview(event.clientX, event.clientY);
  reorderSidebarFromPointer(event.clientX, event.clientY);
}

function handleGlobalSidebarMouseMove(event) {
  if (sidebarDragPointerId !== -1) return;

  if (!draggingSidebarLinkId) {
    const dx = event.clientX - sidebarPointerStartX;
    const dy = event.clientY - sidebarPointerStartY;
    if (Math.hypot(dx, dy) < SIDEBAR_DRAG_START_THRESHOLD_PX) return;
    event.preventDefault();
    activateSidebarPointerDrag(event.clientX, event.clientY);
  }

  if (!draggingSidebarLinkId) return;
  event.preventDefault();
  positionSidebarDragPreview(event.clientX, event.clientY);
  reorderSidebarFromPointer(event.clientX, event.clientY);
}

function handleGlobalSidebarPointerUp(event) {
  if (sidebarDragPointerId === null || event.pointerId !== sidebarDragPointerId) return;
  if (!draggingSidebarLinkId) {
    resetSidebarDragState({ persist: false });
    return;
  }
  event.preventDefault();
  sidebarSuppressClickUntil = Date.now() + 260;
  resetSidebarDragState({ persist: sidebarReorderDirty });
}

function handleGlobalSidebarMouseUp(event) {
  if (sidebarDragPointerId !== -1) return;
  if (!draggingSidebarLinkId) {
    resetSidebarDragState({ persist: false });
    return;
  }
  event.preventDefault();
  sidebarSuppressClickUntil = Date.now() + 260;
  resetSidebarDragState({ persist: sidebarReorderDirty });
}

function handleGlobalSidebarDragFinalize() {
  if (!draggingSidebarLinkId && !sidebarReorderDirty && sidebarDragPointerId === null) return;
  if (draggingSidebarLinkId) {
    sidebarSuppressClickUntil = Date.now() + 260;
  }
  resetSidebarDragState({ persist: sidebarReorderDirty });
}

function handleSidebarNativeDragStart(event) {
  event.preventDefault();
}

function ensureSidebarGlobalDragBindings() {
  if (sidebarGlobalDragBound) return;
  sidebarGlobalDragBound = true;
  document.addEventListener('pointermove', handleGlobalSidebarPointerMove, true);
  document.addEventListener('pointerup', handleGlobalSidebarPointerUp, true);
  document.addEventListener('pointercancel', handleGlobalSidebarPointerUp, true);
  document.addEventListener('mousemove', handleGlobalSidebarMouseMove, true);
  document.addEventListener('mouseup', handleGlobalSidebarMouseUp, true);
  window.addEventListener('blur', handleGlobalSidebarDragFinalize, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') handleGlobalSidebarDragFinalize();
  });
}

function animateSidebarReflow(grid, mutateDom) {
  const children = Array.from(grid.children).filter((child) => child instanceof HTMLElement);
  const before = new Map(children.map((child) => [child, child.getBoundingClientRect()]));
  mutateDom();
  const afterChildren = Array.from(grid.children).filter((child) => child instanceof HTMLElement);

  afterChildren.forEach((child) => {
    const prev = before.get(child);
    if (!prev) return;
    const next = child.getBoundingClientRect();
    const deltaY = prev.top - next.top;
    if (Math.abs(deltaY) < 0.5) return;

    child.style.transition = 'none';
    child.style.transform = `translateY(${deltaY}px)`;
    requestAnimationFrame(() => {
      child.style.transition = `transform ${SIDEBAR_REORDER_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      child.style.transform = '';
      window.setTimeout(() => {
        if (!child.classList.contains('is-dragging')) {
          child.style.transition = '';
        }
      }, SIDEBAR_REORDER_ANIM_MS + 20);
    });
  });
}

function persistSidebarOrderFromDom() {
  const grid = DOM.sidebarGrid;
  if (!grid) return;

  const orderedIds = Array.from(grid.children)
    .map((child) => (child instanceof HTMLElement ? child.dataset.linkId : ''))
    .filter(Boolean);

  if (orderedIds.length < 2) return;

  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  const appLinks = links.filter((link) => link.isApp);

  const sortedApps = [...appLinks].sort((a, b) => {
    const rankA = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });

  const changed = sortedApps.some((link, index) => appLinks[index]?.id !== link.id);
  if (!changed) return;

  const nonAppLinks = links.filter((link) => !link.isApp);
  links = [...sortedApps, ...nonAppLinks];
  persistLinks();
  renderLinks();
}

function beginSidebarDrag(item, event) {
  event.preventDefault();
  event.stopPropagation();

  const grid = DOM.sidebarGrid;
  if (!(item instanceof HTMLElement) || !(grid instanceof HTMLElement) || !grid.contains(item)) return;
  const linkId = item.dataset.linkId;
  if (!linkId) return;

  sidebarPendingLinkId = linkId;
  sidebarDraggedItemEl = item;
  sidebarDragPointerId = event instanceof PointerEvent ? event.pointerId : -1;
  sidebarReorderDirty = false;
  sidebarDragSignature = '';
  sidebarPointerStartX = event.clientX;
  sidebarPointerStartY = event.clientY;

  const rect = item.getBoundingClientRect();
  sidebarDragOffsetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  sidebarDragOffsetY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
}

function handleSidebarDragStart(event) {
  if (!(event instanceof MouseEvent)) return;
  if (event.button !== 0) return;
  if (event instanceof PointerEvent && event.isPrimary === false) return;
  if (draggingSidebarLinkId || sidebarDragPointerId !== null) return;
  if (document.body.classList.contains('is-layout-editing')) return;

  const source = event.target instanceof Element
    ? event.target.closest('.quicklink-item')
    : null;
  if (!(source instanceof HTMLElement)) return;
  beginSidebarDrag(source, event);
}

function bindSidebarDragNode(item) {
  if (!(item instanceof HTMLElement)) return;
  item.setAttribute('draggable', 'false');
  item.classList.add('is-sidebar-draggable');

  const tile = item.querySelector('.quicklink-tile');
  if (tile instanceof HTMLElement) {
    tile.setAttribute('draggable', 'false');
    tile.style.webkitUserDrag = 'none';
  }
  item.style.touchAction = 'none';
  item.style.webkitUserDrag = 'none';
}

function setSidebarDragBindings(grid) {
  if (!isSidebarGrid(grid)) return;
  ensureSidebarGlobalDragBindings();

  if (grid.dataset.dragStartBound !== '1') {
    grid.dataset.dragStartBound = '1';
    grid.addEventListener('mousedown', handleSidebarDragStart, true);
    grid.addEventListener('dragstart', handleSidebarNativeDragStart, true);
  }

  Array.from(grid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    bindSidebarDragNode(child);
  });
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
  removeBtn.setAttribute('aria-label', 'Remove quick link');
  const removeGlyph = document.createElement('span');
  removeGlyph.style.cssText = `
    width: 6px;
    height: 1.4px;
    border-radius: 999px;
    background: #fff;
    display: block;
    pointer-events: none;
    opacity: 0.95;
  `;
  removeBtn.appendChild(removeGlyph);
  removeBtn.style.cssText = `
    all: unset;
    position: absolute;
    top: -1px;
    right: 6px;
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
    border-radius: 50%;
    background: #ef4444;
    border: 1px solid rgba(255,255,255,0.55);
    color: white;
    font-size: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-weight: 700;
    box-shadow: none;
    flex-shrink: 0;
    z-index: 10;
  `;
  removeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeLink(item.dataset.linkId);
  });

  const name = document.createElement('span');
  name.className = 'manage-link-name';
  name.style.cssText = `
    font-family: ${QUICKLINK_LABEL_FONT_FAMILY};
    font-size: 0.72rem;
    font-weight: ${QUICKLINK_LABEL_FONT_WEIGHT};
    color: var(--text-primary);
    text-align: center;
    max-width: 72px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.01em;
    margin-top: 2px;
  `;

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

function addQuickLink(entry) {
  const label = entry.label || entry.title || entry.key;
  const normalizedUrl = sanitizeUrl(entry.url);
  const exists = links.some((link) => link.isApp && sanitizeUrl(link.url) === normalizedUrl);
  if (exists) {
    toast.info(`${label} is already added`);
    return false;
  }
  links.unshift({
    id: generateId(),
    key: normalizeIconKey(entry.key),
    title: label,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  toast.success(`${label} added`);
  return true;
}

function createManageLibraryTile(entry) {
  const tile = document.createElement('div');
  tile.className = 'manage-library-item';
  tile.dataset.libraryKey = entry.key;
  tile.dataset.tooltip = entry.label;
  tile.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: calc(100% - 8px);
    height: 30px;
    padding: 0;
    border-radius: 9px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    transition: background 150ms ease, transform 150ms ease;
    min-width: 0;
    justify-self: center;
  `;
  const iconData = MONO_ICONS[normalizeIconKey(entry.key)];
  if (typeof iconData === 'string') {
    tile.innerHTML = iconData;
  } else if (iconData && iconData.path) {
    const vb = iconData.viewBox || '0 0 24 24';
    tile.innerHTML = `<svg viewBox="${vb}" fill="white" fill-rule="evenodd" clip-rule="evenodd"><path d="${iconData.path}"/></svg>`;
  }
  const svg = tile.querySelector('svg');
  if (svg) svg.style.cssText = 'width:17px;height:17px;opacity:0.85;display:block;';
  tile.addEventListener('mouseenter', () => {
    tile.style.background = 'var(--glass-bg-hover)';
    tile.style.transform = 'scale(1.02)';
  });
  tile.addEventListener('mouseleave', () => {
    tile.style.background = 'var(--glass-bg)';
    tile.style.transform = 'scale(1)';
  });
  tile.addEventListener('click', () => {
    const added = addQuickLink(entry);
    if (!added) return;
    const orig = tile.innerHTML;
    tile.innerHTML = `<svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    tile.style.background = 'rgba(52,211,153,0.2)';
    setTimeout(() => {
      tile.innerHTML = orig;
      tile.style.background = 'var(--glass-bg)';
    }, 800);
  });
  return tile;
}

function syncManageLibraryGrid() {
  if (!manageLibraryGridEl) return;
  QUICK_LIBRARY.forEach((entry, index) => {
    let node = manageLibraryTiles.get(entry.key);
    if (!node) {
      node = createManageLibraryTile(entry);
      manageLibraryTiles.set(entry.key, node);
    }
    const atIndex = manageLibraryGridEl.children[index];
    if (atIndex !== node) {
      manageLibraryGridEl.insertBefore(node, atIndex || null);
    }
  });

  const activeKeys = new Set(QUICK_LIBRARY.map((entry) => entry.key));
  [...manageLibraryTiles.entries()].forEach(([key, node]) => {
    if (activeKeys.has(key)) return;
    node.remove();
    manageLibraryTiles.delete(key);
  });
}

function renderManagePanel() {
  if (!managePanelEl) return;
  syncManageAddedGrid();
  syncManageLibraryGrid();
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
    key: inferLinkKey(normalizedUrl),
    title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  manageUrlInputEl.value = '';
  manageNameInputEl.value = '';
  manageUrlInputEl.dataset.autoName = '';
  manageUrlInputEl.focus();
  toast.success('Link added!');
}

function closeManagePanel() {
  managePanelOpen = false;
  hideTooltip();
  if (managePanelEl) {
    managePanelEl.classList.remove('animate-premium-panel');
    managePanelEl.classList.remove('open');
    managePanelEl.setAttribute('aria-hidden', 'true');
    managePanelEl.style.transformOrigin = 'left center';
    managePanelEl.style.transition = 'opacity 260ms cubic-bezier(0.4,0,1,1), transform 280ms cubic-bezier(0.4,0,1,1), filter 260ms ease';
    managePanelEl.style.opacity = '0';
    managePanelEl.style.transform = 'translateX(-12px) scale(0.97)';
    managePanelEl.style.filter = 'blur(3px)';
    if (managePanelCloseTimer) clearTimeout(managePanelCloseTimer);
    managePanelCloseTimer = setTimeout(() => {
      if (!managePanelOpen && managePanelEl) {
        managePanelEl.style.display = 'none';
        managePanelEl.style.filter = '';
      }
      managePanelCloseTimer = null;
    }, 280);
  }
  updateManageButtonState();
}

function openManagePanel() {
  const panel = ensureManagePanel();
  if (managePanelCloseTimer) {
    clearTimeout(managePanelCloseTimer);
    managePanelCloseTimer = null;
  }
  // Get sidebar pill element
  const sidebarEl = document.getElementById('quicklinks-section');
  const sidebarRect = sidebarEl
    ? sidebarEl.getBoundingClientRect()
    : { right: 88, top: 0, bottom: window.innerHeight };

  // Panel dimensions
  const panelW = 360;
  const panelH = Math.min(580, window.innerHeight - 32);

  // Left: immediately to the right of sidebar pill + gap
  const leftPos = sidebarRect.right + 12;

  // Top: vertically centered in viewport
  const topPos = Math.max(16, (window.innerHeight - panelH) / 2);

  // Apply — do NOT use cssText += as it appends and conflicts
  // Set each property individually
  panel.style.position = 'fixed';
  panel.style.left = `${leftPos}px`;
  panel.style.top = `${topPos}px`;
  panel.style.bottom = 'auto';
  panel.style.right = 'auto';
  panel.style.width = `${panelW}px`;
  panel.style.maxHeight = `${panelH}px`;
  panel.style.overflowY = 'auto';
  panel.style.zIndex = '9999';
  managePanelOpen = true;
  renderManagePanel();
  panel.style.display = 'flex';
  panel.style.transition = '';
  panel.style.opacity = '';
  panel.style.transform = '';
  panel.style.filter = '';
  panel.style.willChange = '';
  panel.classList.remove('animate-fadeIn', 'fade-in', 'fadeIn');
  panel.classList.remove('animate-premium-panel');
  void panel.offsetHeight;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('animate-premium-panel');
  updateManageButtonState();
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
  if (!(target instanceof Node)) return;
  const manageBtn = DOM.manageQuicklinksBtn;
  if (managePanelEl.contains(target) || (manageBtn && manageBtn.contains(target))) return;
  closeManagePanel();
}

function handleManageEscape(event) {
  if (event.key === 'Escape') {
    closeManagePanel();
  }
}

function buildManagePanelHeader() {
  const header = document.createElement('div');
  header.className = 'manage-links-header';

  const title = document.createElement('h3');
  title.className = 'manage-links-title';
  title.textContent = 'Quick Links';
  title.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 1.24rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.1;
    margin: 0;
    color: var(--text-primary);
    text-transform: none;
  `;

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
  return header;
}

function buildManagePanelAddedSection() {
  const fragment = document.createDocumentFragment();
  
  manageAddedGridEl = document.createElement('div');
  manageAddedGridEl.className = 'manage-links-grid manage-links-added-grid';
  manageAddedGridEl.style.marginBottom = '0';
  manageAddedGridEl.style.paddingBottom = '0';
  
  manageAddedEmptyEl = document.createElement('p');
  manageAddedEmptyEl.className = 'manage-links-empty';
  manageAddedEmptyEl.textContent = 'No links added yet.';
  manageAddedEmptyEl.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 0.74rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--text-secondary);
    margin: 2px 0 0 0;
    text-align: center;
  `;
  
  const divider1 = document.createElement('div');
  divider1.className = 'manage-links-divider';
  divider1.style.cssText = `
    width: 100%;
    height: 1px;
    background: var(--glass-border);
    margin: 8px 0 8px 0;
    display: block;
    flex-shrink: 0;
  `;

  fragment.append(manageAddedGridEl, manageAddedEmptyEl, divider1);
  return fragment;
}

function buildManagePanelAddForm() {
  const fragment = document.createDocumentFragment();
  
  const addLabel = document.createElement('p');
  addLabel.className = 'manage-links-section-title';
  addLabel.textContent = 'Add New Link';
  addLabel.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
    color: var(--text-secondary);
    text-transform: none;
    margin-bottom: 6px;
    margin-top: 0;
  `;

  manageUrlInputEl = document.createElement('input');
  manageUrlInputEl.type = 'url';
  manageUrlInputEl.className = 'manage-links-input';
  manageUrlInputEl.placeholder = 'https://example.com';
  manageUrlInputEl.autocomplete = 'off';
  manageUrlInputEl.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 0.79rem;
    font-weight: 400;
    color: var(--text-secondary);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    padding: 8px 12px 8px 38px;
    width: 100%;
    min-height: 42px;
    outline: none;
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  `;
  manageUrlInputEl.addEventListener('focus', () => {
    manageUrlInputEl.style.border = '1px solid var(--glass-border-panel)';
    manageUrlInputEl.style.boxShadow = '0 0 0 3px rgba(125,211,252,0.10)';
  });
  manageUrlInputEl.addEventListener('blur', () => {
    manageUrlInputEl.style.border = '1px solid var(--glass-border)';
    manageUrlInputEl.style.boxShadow = '';
  });
  manageUrlInputEl.addEventListener('input', () => {
    if (!manageUrlInputEl.value.trim() && manageNameInputEl && manageNameInputEl.value.trim() === manageUrlInputEl.dataset.autoName) {
      manageNameInputEl.value = '';
      manageUrlInputEl.dataset.autoName = '';
      return;
    }
    const derived = getFriendlyName(manageUrlInputEl.value.trim());
    const currentName = manageNameInputEl ? manageNameInputEl.value.trim() : '';
    if (derived && (!currentName || currentName === manageUrlInputEl.dataset.autoName)) {
      if (manageNameInputEl) manageNameInputEl.value = derived;
      manageUrlInputEl.dataset.autoName = derived;
    }
  });

  const urlWrap = document.createElement('div');
  urlWrap.className = 'manage-input-wrap';
  urlWrap.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 42px;
    margin-bottom: 8px;
  `;
  const urlIcon = document.createElement('span');
  urlIcon.className = 'manage-input-icon';
  urlIcon.style.cssText = `
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-ghost);
    pointer-events: none;
    z-index: 1;
  `;
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
  manageNameInputEl.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 0.79rem;
    font-weight: 400;
    color: var(--text-secondary);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    padding: 8px 12px 8px 38px;
    width: 100%;
    min-height: 42px;
    outline: none;
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  `;
  manageNameInputEl.addEventListener('focus', () => {
    manageNameInputEl.style.border = '1px solid var(--glass-border-panel)';
    manageNameInputEl.style.boxShadow = '0 0 0 3px rgba(125,211,252,0.10)';
  });
  manageNameInputEl.addEventListener('blur', () => {
    manageNameInputEl.style.border = '1px solid var(--glass-border)';
    manageNameInputEl.style.boxShadow = '';
  });

  const nameWrap = document.createElement('div');
  nameWrap.className = 'manage-input-wrap';
  nameWrap.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 42px;
    margin-bottom: 8px;
  `;
  const nameIcon = document.createElement('span');
  nameIcon.className = 'manage-input-icon';
  nameIcon.style.cssText = `
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-ghost);
    pointer-events: none;
    z-index: 1;
  `;
  nameIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
    </svg>
  `;
  nameWrap.append(nameIcon, manageNameInputEl);

  fragment.append(addLabel, urlWrap, nameWrap);
  return fragment;
}

function buildManagePanelLibrary() {
  manageLibraryGridEl = document.createElement('div');
  manageLibraryGridEl.className = 'manage-links-grid manage-links-library-grid';
  manageLibraryGridEl.style.cssText = `
    max-height: 204px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2px 4px 6px 0;
  `;
  return manageLibraryGridEl;
}

function buildManagePanelSubmitButton() {
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'manage-links-submit';
  addBtn.textContent = 'Add Link';
  addBtn.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: rgba(59,130,246,0.85);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 11px;
    width: 100%;
    cursor: pointer;
    transition: background 180ms ease, transform 180ms cubic-bezier(0.22,1,0.36,1);
  `;
  addBtn.addEventListener('mouseenter', () => {
    addBtn.style.background = 'rgba(59,130,246,1)';
  });
  addBtn.addEventListener('mouseleave', () => {
    addBtn.style.background = 'rgba(59,130,246,0.85)';
  });
  addBtn.addEventListener('click', () => addCustomLinkFromPanel());
  return addBtn;
}

function buildManagePanel() {
  const panel = document.createElement('aside');
  panel.id = 'manage-links-panel';
  panel.className = 'manage-links-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Manage quick links');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";

  // Build sections with stagger data-attributes for cascading entry
  const header = buildManagePanelHeader();
  header.classList.add('manage-panel-stagger');
  header.dataset.stagger = '0';

  const addedSection = buildManagePanelAddedSection();
  // addedSection is a DocumentFragment — wrap children with stagger
  const addedWrapper = document.createElement('div');
  addedWrapper.classList.add('manage-panel-stagger');
  addedWrapper.dataset.stagger = '1';
  addedWrapper.appendChild(addedSection);

  const addForm = buildManagePanelAddForm();
  const addFormWrapper = document.createElement('div');
  addFormWrapper.classList.add('manage-panel-stagger');
  addFormWrapper.dataset.stagger = '3';
  addFormWrapper.appendChild(addForm);

  const library = buildManagePanelLibrary();
  library.classList.add('manage-panel-stagger');
  library.dataset.stagger = '5';

  const submitBtn = buildManagePanelSubmitButton();
  const submitWrapper = document.createElement('div');
  submitWrapper.classList.add('manage-panel-stagger');
  submitWrapper.dataset.stagger = '7';
  submitWrapper.appendChild(submitBtn);

  panel.appendChild(header);
  panel.appendChild(addedWrapper);
  panel.appendChild(addFormWrapper);
  panel.appendChild(library);
  panel.appendChild(submitWrapper);

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
  const bottomLinks = topSiteLinks.slice(0, topSiteLimit);

  syncGrid(sidebarGrid, appLinks, true, false);
  syncGrid(bottomGrid, bottomLinks, false, true);
  renderManagePanel();
}

function syncGrid(grid, targetLinks, hideLabel = false, useRawFavicon = false) {
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
      node = updateTile(node, linkData, hideLabel, useRawFavicon);
    } else {
      node = createTile(linkData, hideLabel, useRawFavicon);
    }

    const currentAtIndex = grid.children[index] || null;
    if (node !== currentAtIndex) {
      grid.insertBefore(node, currentAtIndex);
    }
  });

  existingById.forEach((node) => node.remove());

  if (isSidebarGrid(grid)) {
    setSidebarDragBindings(grid);
  }
}

function applyTileStyles(wrapper, tile, iconEl, labelEl, hideLabel, useRawFavicon) {
  if (useRawFavicon) {
    Object.assign(wrapper.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '6px', background: 'transparent', border: 'none',
    });
    Object.assign(tile.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '6px', background: 'transparent', border: 'none',
      backdropFilter: 'none', WebkitBackdropFilter: 'none',
      boxShadow: 'none', borderRadius: '0',
    });
    Object.assign(iconEl.style, {
      width: '52px', height: '52px', background: 'var(--glass-bg-hover)',
      border: '1px solid var(--glass-border)', borderRadius: '18px',
      overflow: 'hidden', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    });
    const rawFavicon = iconEl.querySelector('.quicklink-native-favicon');
    if (rawFavicon instanceof HTMLImageElement) {
      rawFavicon.style.cssText = 'width:34px;height:34px;border-radius:12px;object-fit:cover;filter:none;';
    }
  } else {
    wrapper.style.background = ''; wrapper.style.border = ''; wrapper.style.gap = '';
    tile.style.cssText = ''; iconEl.style.cssText = '';
  }

  Object.assign(labelEl.style, {
    fontFamily: QUICKLINK_LABEL_FONT_FAMILY,
    fontSize: useRawFavicon ? '0.76rem' : '0.72rem',
    fontWeight: QUICKLINK_LABEL_FONT_WEIGHT,
    color: 'var(--text-primary)',
    lineHeight: useRawFavicon ? '1.2' : '1.15',
    letterSpacing: useRawFavicon ? '0' : '0.01em',
    textAlign: 'center', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
    textShadow: useRawFavicon ? '0 1px 1px rgba(0,0,0,0.18)' : 'none',
    maxWidth: useRawFavicon ? '78px' : '58px',
    display: hideLabel ? 'none' : '',
  });
}

function updateTile(wrapper, link, hideLabel = false, useRawFavicon = false) {
  if (!(wrapper instanceof HTMLElement)) return createTile(link, hideLabel, useRawFavicon);
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;
  wrapper.classList.toggle('quicklink-item-bottom', useRawFavicon);

  const tile = wrapper.querySelector('.quicklink-tile');
  const iconEl = wrapper.querySelector('.ql-icon-wrap');
  const labelEl = wrapper.querySelector('.quicklink-label');

  if (!(tile instanceof HTMLAnchorElement) || !(iconEl instanceof HTMLElement) || !(labelEl instanceof HTMLElement)) {
    const replacement = createTile(link, hideLabel, useRawFavicon);
    wrapper.replaceWith(replacement);
    return replacement;
  }

  tile.classList.toggle('quicklink-tile-bottom', useRawFavicon);
  tile.href = link.url;
  tile.removeAttribute('title');
  tile.dataset.id = link.id;
  if (hideLabel && !useRawFavicon) {
    wrapper.dataset.tooltip = link.title;
    bindSidebarDragNode(wrapper);
  } else {
    delete wrapper.dataset.tooltip;
    wrapper.setAttribute('draggable', 'false');
    wrapper.classList.remove('is-sidebar-draggable');
    tile.setAttribute('draggable', 'false');
  }
  setTileIcon(iconEl, link, useRawFavicon);
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);
  applyTileStyles(wrapper, tile, iconEl, labelEl, hideLabel, useRawFavicon);

  return wrapper;
}

function createTile(link, hideLabel = false, useRawFavicon = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quicklink-item';
  wrapper.classList.toggle('quicklink-item-bottom', useRawFavicon);
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;
  if (hideLabel && !useRawFavicon) wrapper.dataset.tooltip = link.title;

  const a = document.createElement('a');
  a.className = 'quicklink-tile';
  a.classList.toggle('quicklink-tile-bottom', useRawFavicon);
  a.href = link.url;
  a.dataset.id = link.id;
  a.setAttribute('role', 'listitem');
  a.setAttribute('draggable', 'false');

  a.addEventListener('click', (e) => {
    if (draggingSidebarLinkId || Date.now() < sidebarSuppressClickUntil) {
      e.preventDefault();
      return;
    }
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
  iconEl.className = 'ql-icon-wrap quicklink-icon';
  iconEl.setAttribute('draggable', 'false');

  const labelEl = document.createElement('span');
  labelEl.className = 'quicklink-label';
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);
  
  setTileIcon(iconEl, link, useRawFavicon);
  applyTileStyles(wrapper, a, iconEl, labelEl, hideLabel, useRawFavicon);

  a.appendChild(iconEl);
  wrapper.append(a, labelEl);
  if (hideLabel && !useRawFavicon) {
    bindSidebarDragNode(wrapper);
  }
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
  editBtn.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  editBtn.style.fontWeight = '500';
  editBtn.onclick = () => { removeContextMenu(); openLinkModal(link); };

  const delBtn = document.createElement('button');
  delBtn.className = 'engine-option';
  delBtn.textContent = 'Delete';
  delBtn.ariaLabel = 'Delete quick link';
  delBtn.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  delBtn.style.fontWeight = '500';
  delBtn.onclick = () => { removeContextMenu(); removeLink(link.id); };

  menu.append(editBtn, delBtn);
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('mousedown', (ev) => {
      const target = ev.target;
      if (!(target instanceof Node) || !menu.contains(target)) removeContextMenu();
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
  heading.style.cssText = `
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0.01em;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  `;

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title e.g. GitHub';
  if (existingLink) titleInput.value = existingLink.title;
  titleInput.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  titleInput.style.fontSize = '0.84rem';
  titleInput.style.fontWeight = '500';
  titleInput.style.color = 'var(--text-primary)';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'https://...';
  if (existingLink) urlInput.value = existingLink.url;
  urlInput.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  urlInput.style.fontSize = '0.84rem';
  urlInput.style.fontWeight = '500';
  urlInput.style.color = 'var(--text-primary)';

  urlInput.addEventListener('input', () => {
    if (!urlInput.value.trim() && titleInput.value.trim() === urlInput.dataset.autoName) {
      titleInput.value = '';
      urlInput.dataset.autoName = '';
      return;
    }
    const derived = getFriendlyName(urlInput.value.trim());
    if (derived && (!titleInput.value.trim() || titleInput.value.trim() === urlInput.dataset.autoName)) {
      titleInput.value = derived;
      urlInput.dataset.autoName = derived;
    }
  });

  const sidebarToggleLabel = document.createElement('label');
  sidebarToggleLabel.className = 'ql-sidebar-toggle';
  sidebarToggleLabel.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  sidebarToggleLabel.style.fontSize = '0.82rem';
  sidebarToggleLabel.style.fontWeight = '500';
  sidebarToggleLabel.style.color = 'var(--text-primary)';
  const sidebarToggle = document.createElement('input');
  sidebarToggle.type = 'checkbox';
  sidebarToggle.id = 'ql-pin-sidebar';
  sidebarToggle.checked = existingLink?.isApp === true;
  sidebarToggleLabel.append(sidebarToggle, document.createTextNode(' Pin to Sidebar (App Icon)'));

  const close = () => overlay.remove();

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.ariaLabel = 'Cancel quick link edit';
  cancelBtn.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  cancelBtn.style.fontWeight = '500';
  cancelBtn.onclick = close;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.ariaLabel = 'Save quick link';
  saveBtn.style.fontFamily = "'Geist', 'Inter', system-ui, sans-serif";
  saveBtn.style.fontWeight = '600';
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
  Store.setLinks(links).catch((error) => {
    console.warn('Failed to persist quick links:', error);
  });
  emitLinksUpdated();
}

function addLink(title, url, isApp = false) {
  const normalizedUrl = sanitizeUrl(url);
  links.push({
    id: generateId(),
    key: inferLinkKey(normalizedUrl),
    title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp,
  });
  persistLinks();
  renderLinks();
  toast.success('Link added!');
}

function updateLink(id, title, url, isApp = false) {
  const link = links.find(l => l.id === id);
  if (!link) return;
  const normalizedUrl = sanitizeUrl(url);
  link.title = title;
  link.url = normalizedUrl;
  link.favicon = getFaviconUrl(normalizedUrl);
  link.key = inferLinkKey(normalizedUrl);
  link.isApp = isApp;
  persistLinks();
  renderLinks();
  toast.success('Link updated!');
}

function removeLink(id) {
  // Animate tile exit in manage panel before DOM removal
  const manageTile = manageAddedTiles.get(id);
  if (manageTile && manageTile.parentElement) {
    // FLIP: capture positions of siblings before removal
    const grid = manageTile.parentElement;
    const siblings = Array.from(grid.children).filter(
      (child) => child instanceof HTMLElement && child !== manageTile
    );
    const beforeRects = new Map(siblings.map((s) => [s, s.getBoundingClientRect()]));

    // Animate the tile out
    manageTile.style.transition = 'opacity 250ms ease, transform 280ms cubic-bezier(0.4,0,1,1), filter 250ms ease';
    manageTile.style.opacity = '0';
    manageTile.style.transform = 'scale(0.7)';
    manageTile.style.filter = 'blur(4px)';
    manageTile.style.pointerEvents = 'none';

    setTimeout(() => {
      links = links.filter(l => l.id !== id);
      persistLinks();
      renderLinks();

      // FLIP: animate siblings to new positions
      siblings.forEach((sibling) => {
        if (!sibling.parentElement) return;
        const prev = beforeRects.get(sibling);
        if (!prev) return;
        const next = sibling.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        sibling.style.transition = 'none';
        sibling.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          sibling.style.transition = 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)';
          sibling.style.transform = '';
          setTimeout(() => { sibling.style.transition = ''; }, 400);
        });
      });
    }, 260);
  } else {
    links = links.filter(l => l.id !== id);
    persistLinks();
    renderLinks();
  }
  toast.info('Link removed');
}

/* ── Premium Glassmorphism Tooltip Engine ── */
let tooltipEl = null;
let tooltipShowTimer = null;
const TOOLTIP_DELAY_MS = 600;

function ensureTooltipNode() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'acrylic-tooltip';
  tooltipEl.setAttribute('role', 'tooltip');
  tooltipEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function showTooltip(targetEl) {
  if (draggingSidebarLinkId) return;
  if (document.body.classList.contains('is-sidebar-reordering')) return;
  // Suppress sidebar tooltips when manage panel is open, but allow in-panel tooltips
  const isInsideManagePanel = managePanelEl && managePanelEl.contains(targetEl);
  if (managePanelOpen && !isInsideManagePanel) return;

  const text = targetEl.dataset.tooltip;
  if (!text) return;

  const tip = ensureTooltipNode();
  tip.textContent = text;

  const rect = targetEl.getBoundingClientRect();
  let left = rect.right + 12;
  let top = rect.top + (rect.height / 2);

  // Viewport clamping — prevent overflow
  tip.style.left = '0px';
  tip.style.top = '0px';
  tip.classList.remove('visible');
  void tip.offsetWidth;
  const tipRect = tip.getBoundingClientRect();
  const tipW = tipRect.width;
  const tipH = tipRect.height;

  if (left + tipW > window.innerWidth - 8) {
    left = rect.left - tipW - 12;
  }
  top = Math.max(tipH / 2 + 8, Math.min(top, window.innerHeight - tipH / 2 - 8));

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  tip.classList.add('visible');
  tip.setAttribute('aria-hidden', 'false');
}

function hideTooltip() {
  if (tooltipShowTimer) {
    clearTimeout(tooltipShowTimer);
    tooltipShowTimer = null;
  }
  if (tooltipEl) {
    tooltipEl.classList.remove('visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
  }
}

function scheduleTooltip(targetEl, delay = TOOLTIP_DELAY_MS) {
  hideTooltip();
  tooltipShowTimer = setTimeout(() => {
    tooltipShowTimer = null;
    showTooltip(targetEl);
  }, delay);
}

function initSidebarTooltips() {
  ensureTooltipNode();

  // Event delegation on the sidebar grid — handles dynamic tile lifecycle
  const sidebarGrid = DOM.sidebarGrid;
  if (sidebarGrid) {
    sidebarGrid.addEventListener('pointerenter', (e) => {
      const item = e.target instanceof Element ? e.target.closest('.quicklink-item') : null;
      if (item instanceof HTMLElement && item.dataset.tooltip) {
        scheduleTooltip(item);
      }
    }, true);

    sidebarGrid.addEventListener('pointerleave', (e) => {
      const item = e.target instanceof Element ? e.target.closest('.quicklink-item') : null;
      if (item) hideTooltip();
    }, true);
  }

  // Static tooltip on the ... button
  const toolsFab = DOM.toolsFab;
  if (toolsFab) {
    toolsFab.dataset.tooltip = 'Quick Links';
    toolsFab.removeAttribute('title');
    toolsFab.addEventListener('pointerenter', () => scheduleTooltip(toolsFab));
    toolsFab.addEventListener('pointerleave', () => hideTooltip());
  }

  // Event delegation on the library grid inside manage panel
  const attachLibraryTooltips = () => {
    if (!manageLibraryGridEl) return;
    manageLibraryGridEl.addEventListener('pointerenter', (e) => {
      const item = e.target instanceof Element ? e.target.closest('.manage-library-item') : null;
      if (item instanceof HTMLElement && item.dataset.tooltip) {
        scheduleTooltip(item, 300);
      }
    }, true);
    manageLibraryGridEl.addEventListener('pointerleave', (e) => {
      const item = e.target instanceof Element ? e.target.closest('.manage-library-item') : null;
      if (item) hideTooltip();
    }, true);
  };
  // Library grid may not exist yet (lazy-built), so also observe
  if (manageLibraryGridEl) {
    attachLibraryTooltips();
  } else {
    const observer = new MutationObserver(() => {
      if (manageLibraryGridEl) {
        attachLibraryTooltips();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export async function initQuickLinks() {
  ensureQuicklinksStyles();
  try {
    const res = await fetch(chrome.runtime.getURL('icon-paths.json'));
    MONO_ICONS = await res.json();
  } catch(e) {
    console.error('Failed to load icons', e);
  }
  const stored = await Store.getLinks();
  links = migrateStoredLinks(stored);
  topSiteLimit = await Prefs.get('quickLinksMax');
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
    refreshTopSites().catch((error) => {
      console.warn('Failed to refresh top sites on focus:', error);
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshTopSites().catch((error) => {
        console.warn('Failed to refresh top sites on visibilitychange:', error);
      });
    }
  });

  bus.addEventListener('linksUpdated', (event) => {
    const incoming = event.detail?.links;
    if (!Array.isArray(incoming) || event.detail?.source === 'quicklinks') return;
    links = incoming.filter((link) => link?.isApp === true);
    renderLinks();
  });

  Prefs.onChange((changes) => {
    if (changes.quickLinksMax === undefined) return;
    topSiteLimit = Number.isFinite(changes.quickLinksMax) ? changes.quickLinksMax : 6;
    renderLinks();
  });

  initSidebarTooltips();
}
