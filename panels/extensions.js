import { toast } from '../modules/toast.js';

let containerEl = null;
let extensions = [];
let filterMode = 'all';
let searchQuery = '';
const busyIds = new Set();

function getIconUrl(item) {
  if (!Array.isArray(item.icons) || item.icons.length === 0) return '';
  const sorted = [...item.icons].sort((a, b) => (b.size || 0) - (a.size || 0));
  return sorted[0]?.url || '';
}

function normalizeExtensions(items) {
  return items
    .filter((item) => item.type === 'extension')
    .map((item) => ({
      id: item.id,
      name: item.name || 'Unknown extension',
      enabled: item.enabled !== false,
      mayDisable: item.mayDisable !== false,
      installType: item.installType || 'normal',
      version: item.version || '',
      iconUrl: getIconUrl(item),
      isCurrent: item.id === chrome.runtime.id,
    }))
    .sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

async function loadExtensions() {
  const items = await chrome.management.getAll();
  extensions = normalizeExtensions(items);
}

function matchesFilter(item) {
  if (filterMode === 'active') return item.enabled;
  if (filterMode === 'off') return !item.enabled;
  return true;
}

function matchesSearch(item) {
  if (!searchQuery) return true;
  const haystack = `${item.name} ${item.version}`.toLowerCase();
  return haystack.includes(searchQuery);
}

function getVisibleExtensions() {
  return extensions.filter(matchesFilter).filter(matchesSearch);
}

function createIcon(item) {
  const iconWrap = document.createElement('div');
  iconWrap.className = 'qt-ext-icon';

  if (item.iconUrl) {
    const img = document.createElement('img');
    img.src = item.iconUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = () => {
      img.remove();
      iconWrap.appendChild(createFallbackIcon(item));
    };
    iconWrap.appendChild(img);
    return iconWrap;
  }

  iconWrap.appendChild(createFallbackIcon(item));
  return iconWrap;
}

function createFallbackIcon(item) {
  const fallback = document.createElement('span');
  fallback.className = 'qt-ext-fallback';
  fallback.textContent = (item.name || '?').trim().charAt(0).toUpperCase() || '?';
  return fallback;
}

function createFilterButton(id, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `qt-filter-chip${filterMode === id ? ' is-active' : ''}`;
  btn.textContent = label;
  btn.onclick = () => {
    if (filterMode === id) return;
    filterMode = id;
    renderAll();
  };
  return btn;
}

function createSearchRow() {
  const row = document.createElement('div');
  row.className = 'qt-ext-toolbar';

  const searchShell = document.createElement('label');
  searchShell.className = 'qt-search-shell';
  searchShell.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'qt-search-input';
  input.placeholder = 'Search...';
  input.value = searchQuery;
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.oninput = () => {
    searchQuery = input.value.trim().toLowerCase();
    renderAll({ focusSearch: true });
  };
  searchShell.appendChild(input);

  const filters = document.createElement('div');
  filters.className = 'qt-filter-group';
  filters.append(
    createFilterButton('all', 'All'),
    createFilterButton('active', 'Active'),
    createFilterButton('off', 'Off'),
  );

  row.append(searchShell, filters);
  return row;
}

function createWarningBanner() {
  const activeCount = extensions.filter((item) => item.enabled).length;
  if (activeCount <= 15) return null;

  const banner = document.createElement('div');
  banner.className = 'qt-warning-banner';
  banner.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    </svg>
    <span>Heavy extension load detected</span>
  `;
  return banner;
}

function getSubtitle(item) {
  if (item.isCurrent) return 'Current extension';
  return item.enabled ? `Active${item.version ? ` · v${item.version}` : ''}` : `Off${item.version ? ` · v${item.version}` : ''}`;
}

function createToggleButton(item) {
  const button = document.createElement('button');
  const isBusy = busyIds.has(item.id);
  const isLocked = item.isCurrent || !item.mayDisable;
  button.type = 'button';
  button.className = `qt-ext-toggle${item.enabled ? ' is-on' : ''}`;
  button.disabled = isBusy || isLocked;
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2v10"></path>
      <path d="M18.36 5.64a9 9 0 1 1-12.73 0"></path>
    </svg>
  `;

  if (item.isCurrent) {
    button.title = 'Acrylic cannot disable itself';
  } else if (!item.mayDisable) {
    button.title = 'This extension cannot be toggled';
  } else {
    button.title = item.enabled ? 'Turn off extension' : 'Turn on extension';
    button.onclick = () => toggleExtension(item);
  }

  return button;
}

function createExtensionRow(item) {
  const row = document.createElement('div');
  row.className = `qt-ext-row${item.enabled ? '' : ' is-disabled'}`;

  const left = document.createElement('div');
  left.className = 'qt-ext-main';
  left.appendChild(createIcon(item));

  const copy = document.createElement('div');
  copy.className = 'qt-ext-copy';

  const nameRow = document.createElement('div');
  nameRow.className = 'qt-ext-name-row';

  const name = document.createElement('div');
  name.className = 'qt-ext-name';
  name.textContent = item.name;
  nameRow.appendChild(name);

  if (item.isCurrent) {
    const badge = document.createElement('span');
    badge.className = 'qt-ext-badge';
    badge.textContent = 'Current';
    nameRow.appendChild(badge);
  }

  const sub = document.createElement('div');
  sub.className = 'qt-ext-sub';
  sub.textContent = getSubtitle(item);

  copy.append(nameRow, sub);
  left.appendChild(copy);

  row.append(left, createToggleButton(item));
  return row;
}

function renderAll(options = {}) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const warning = createWarningBanner();
  if (warning) containerEl.appendChild(warning);

  containerEl.appendChild(createSearchRow());

  const list = document.createElement('div');
  list.className = 'qt-ext-list';

  const visible = getVisibleExtensions();
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'qt-empty qt-ext-empty';
    empty.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 13v3a2 2 0 0 1-2 2h-3v-3a2 2 0 1 0-4 0v3H8a2 2 0 0 1-2-2v-3H3a2 2 0 1 1 0-4h3V8a2 2 0 0 1 2-2h3V3a2 2 0 1 1 4 0v3h3a2 2 0 0 1 2 2v3h-3a2 2 0 1 0 0 4z"></path>
      </svg>
      <div>No extensions match this view</div>
    `;
    list.appendChild(empty);
  } else {
    visible.forEach((item) => list.appendChild(createExtensionRow(item)));
  }

  containerEl.appendChild(list);

  if (options.focusSearch) {
    const nextInput = containerEl.querySelector('.qt-search-input');
    if (nextInput) {
      nextInput.focus({ preventScroll: true });
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    }
  }
}

async function toggleExtension(item) {
  if (item.isCurrent) {
    toast.info('Acrylic cannot disable itself');
    return;
  }

  if (!item.mayDisable) {
    toast.error('This extension cannot be toggled');
    return;
  }

  busyIds.add(item.id);
  renderAll();

  try {
    await chrome.management.setEnabled(item.id, !item.enabled);
    await loadExtensions();
    toast.success(item.enabled ? `${item.name} turned off` : `${item.name} turned on`);
  } catch (error) {
    console.error('Failed to toggle extension', error);
    toast.error('Failed to change extension state');
  } finally {
    busyIds.delete(item.id);
    renderAll();
  }
}

export async function initExtensions(container) {
  containerEl = container;

  try {
    await loadExtensions();
    renderAll();
  } catch (error) {
    console.error('Failed to load extensions', error);
    containerEl.innerHTML = `
      <div class="qt-card qt-ext-error">
        <p class="qt-text qt-mb-md">Extensions Manager needs the Chrome management permission to load installed extensions.</p>
      </div>
    `;
    toast.error('Could not load extensions');
  }
}
