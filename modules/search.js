import { Prefs, Store } from './storage.js';
import { sanitizeUrl, isValidUrl } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

const ENGINES = [
  { id: 'browser',    name: 'Browser default', url: 'https://www.google.com/search?q=',     icon: 'icons/icon16.png' },
  { id: 'google',     name: 'Google',     url: 'https://www.google.com/search?q=',     icon: 'https://www.google.com/favicon.ico' },
  { id: 'bing',       name: 'Bing',       url: 'https://www.bing.com/search?q=',       icon: 'https://www.bing.com/favicon.ico' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',           icon: 'https://duckduckgo.com/favicon.ico' },
  { id: 'brave',      name: 'Brave',      url: 'https://search.brave.com/search?q=',   icon: 'https://brave.com/favicon.ico' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=',  icon: 'https://www.perplexity.ai/favicon.ico' },
];

let currentEngine = ENGINES[0];
let highlightedIndex = 0;
let warnedSearchFallback = false;
let pickerOpenRaf = 0;
let pickerOpenRaf2 = 0;
let pickerFocusTimer = 0;
let searchHistoryEnabled = true;
let searchHistoryItems = [];

function getHistoryPanel() {
  return DOM.searchHistoryPanel;
}

function closeHistoryPanel() {
  const panel = getHistoryPanel();
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
}

function renderHistoryPanel(filterText = '') {
  const panel = getHistoryPanel();
  if (!panel) return false;

  const needle = filterText.trim().toLowerCase();
  const matches = searchHistoryItems
    .filter((item) => !needle || item.toLowerCase().includes(needle))
    .slice(0, 6);

  panel.innerHTML = '';
  if (!searchHistoryEnabled || !matches.length) {
    closeHistoryPanel();
    return false;
  }

  const header = document.createElement('div');
  header.className = 'search-history-header';
  header.innerHTML = `
    <span class="search-history-title">Recent Searches</span>
    <button type="button" class="search-history-clear">Clear</button>
  `;

  header.querySelector('.search-history-clear')?.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    searchHistoryItems = [];
    await Store.setSearchHistory([]);
    closeHistoryPanel();
  });

  panel.appendChild(header);

  matches.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-history-item';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.9');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 8v5l3 2');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    icon.append(path, circle);

    const copy = document.createElement('span');
    copy.className = 'search-history-copy';
    const query = document.createElement('span');
    query.className = 'search-history-query';
    query.textContent = item;
    const meta = document.createElement('span');
    meta.className = 'search-history-meta';
    meta.textContent = 'Search again';
    copy.append(query, meta);

    button.append(icon, copy);
    button.addEventListener('click', async () => {
      if (DOM.searchInput) DOM.searchInput.value = item;
      await performSearch(item);
    });
    panel.appendChild(button);
  });

  return true;
}

function openHistoryPanel(filterText = '') {
  const panel = getHistoryPanel();
  if (!panel) return;
  if (!renderHistoryPanel(filterText)) return;
  closePicker();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
}

async function rememberSearchQuery(query) {
  if (!searchHistoryEnabled) return;
  const clean = query.trim();
  if (!clean) return;
  if (isValidUrl(sanitizeUrl(clean))) return;

  searchHistoryItems = [
    clean,
    ...searchHistoryItems.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, 8);

  await Store.setSearchHistory(searchHistoryItems);
}

function getEngine(id) {
  return ENGINES.find((e) => e.id === id) || ENGINES[0];
}

function setEngine(engine) {
  currentEngine = engine;
  const icon = DOM.engineIcon;
  if (icon) { icon.src = engine.icon; icon.alt = engine.name; }
  Prefs.set('searchEngine', engine.id);
  updatePickerSelection();
}

function getEngineOptions() {
  const picker = DOM.enginePicker;
  if (!picker) return [];
  return Array.from(picker.children).filter((el) => el.classList?.contains('engine-option'));
}

function updatePickerSelection() {
  getEngineOptions().forEach((el, index) => {
    const isActive = el.dataset.engineId === currentEngine.id;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-selected', String(isActive));
    if (isActive) highlightedIndex = index;
  });
}

function focusOption(index) {
  const options = getEngineOptions();
  if (!options.length) return;
  highlightedIndex = (index + options.length) % options.length;
  options.forEach((el, i) => {
    el.classList.toggle('is-focused', i === highlightedIndex);
  });
  options[highlightedIndex].focus();
}

function isPickerOpen() {
  return DOM.enginePicker?.classList.contains('is-open') === true;
}

function openPicker(focusList = false) {
  const picker = DOM.enginePicker;
  if (!picker) return;
  closeHistoryPanel();
  if (pickerOpenRaf) {
    cancelAnimationFrame(pickerOpenRaf);
    pickerOpenRaf = 0;
  }
  if (pickerOpenRaf2) {
    cancelAnimationFrame(pickerOpenRaf2);
    pickerOpenRaf2 = 0;
  }
  if (pickerFocusTimer) {
    clearTimeout(pickerFocusTimer);
    pickerFocusTimer = 0;
  }
  picker.setAttribute('aria-hidden', 'false');
  DOM.engineBtn?.classList.add('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'true');
  const activeIdx = ENGINES.findIndex((engine) => engine.id === currentEngine.id);
  highlightedIndex = activeIdx >= 0 ? activeIdx : 0;

  pickerOpenRaf = requestAnimationFrame(() => {
    pickerOpenRaf = 0;
    pickerOpenRaf2 = requestAnimationFrame(() => {
      pickerOpenRaf2 = 0;
      picker.classList.add('is-open');
    });
  });

  if (focusList) {
    pickerFocusTimer = setTimeout(() => {
      pickerFocusTimer = 0;
      focusOption(highlightedIndex);
    }, 140);
  }
}

function closePicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  if (pickerOpenRaf) {
    cancelAnimationFrame(pickerOpenRaf);
    pickerOpenRaf = 0;
  }
  if (pickerOpenRaf2) {
    cancelAnimationFrame(pickerOpenRaf2);
    pickerOpenRaf2 = 0;
  }
  if (pickerFocusTimer) {
    clearTimeout(pickerFocusTimer);
    pickerFocusTimer = 0;
  }
  picker.classList.remove('is-open');
  picker.setAttribute('aria-hidden', 'true');
  DOM.engineBtn?.classList.remove('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'false');
  getEngineOptions().forEach((el) => el.classList.remove('is-focused'));
}

function togglePicker() {
  if (isPickerOpen()) closePicker();
  else openPicker();
}

function buildPicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.innerHTML = '';
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', 'Search engine');
  picker.setAttribute('aria-hidden', 'true');
  ENGINES.forEach((engine, index) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'engine-option';
    if (engine.id === currentEngine.id) opt.classList.add('active');
    opt.dataset.engineId = engine.id;
    opt.setAttribute('role', 'option');
    opt.setAttribute('aria-selected', String(engine.id === currentEngine.id));
    opt.tabIndex = -1;
    opt.innerHTML = `<img src="${engine.icon}" alt="${engine.name}" width="16" height="16"><span>${engine.name}</span>`;
    opt.addEventListener('mouseenter', () => {
      highlightedIndex = index;
      getEngineOptions().forEach((el, i) => el.classList.toggle('is-focused', i === highlightedIndex));
    });
    opt.addEventListener('focus', () => {
      highlightedIndex = index;
      getEngineOptions().forEach((el, i) => el.classList.toggle('is-focused', i === highlightedIndex));
    });
    opt.addEventListener('click', () => {
      setEngine(engine);
      closePicker();
      DOM.engineBtn?.focus();
    });
    picker.appendChild(opt);
  });
  updatePickerSelection();
}

function handlePickerKeydown(e) {
  if (!isPickerOpen()) return;
  const options = getEngineOptions();
  if (!options.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusOption(highlightedIndex + 1);
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusOption(highlightedIndex - 1);
    return;
  }

  if (e.key === 'Home') {
    e.preventDefault();
    focusOption(0);
    return;
  }

  if (e.key === 'End') {
    e.preventDefault();
    focusOption(options.length - 1);
    return;
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    options[highlightedIndex]?.click();
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    closePicker();
    DOM.engineBtn?.focus();
    return;
  }

  if (e.key === 'Tab') {
    closePicker();
  }
}

function queryBrowserDefault(text) {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.search?.query) {
      resolve(false);
      return;
    }
    try {
      chrome.search.query({ text, disposition: 'CURRENT_TAB' }, () => {
        resolve(!chrome.runtime?.lastError);
      });
    } catch {
      resolve(false);
    }
  });
}

async function performSearch(query) {
  const q = query.trim();
  if (!q) return;
  closeHistoryPanel();
  await rememberSearchQuery(q);
  if (isValidUrl(sanitizeUrl(q))) {
    window.location.href = sanitizeUrl(q);
  } else {
    if (currentEngine.id === 'browser') {
      const searched = await queryBrowserDefault(q);
      if (searched) return;
      if (!warnedSearchFallback) {
        warnedSearchFallback = true;
        toast.info('Browser search unavailable here. Falling back to Google.');
      }
    }
    window.location.href = currentEngine.url + encodeURIComponent(q);
  }
}

/** Initializes the search bar, engine picker, and all related event listeners. */
export async function initSearch() {
  const savedId = await Prefs.get('searchEngine');
  searchHistoryEnabled = await Prefs.get('searchHistory');
  searchHistoryItems = await Store.getSearchHistory();
  setEngine(getEngine(savedId));
  buildPicker();

  const input = DOM.searchInput;
  const submit = DOM.searchSubmit;
  const engineBtn = DOM.engineBtn;
  const searchWrapper = DOM.searchWrapper;

  if (engineBtn) {
    engineBtn.addEventListener('click', togglePicker);
    engineBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isPickerOpen()) closePicker();
        else openPicker(true);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isPickerOpen()) openPicker(true);
        else focusOption(highlightedIndex + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isPickerOpen()) openPicker(true);
        else focusOption(highlightedIndex - 1);
      }
    });
  }

  DOM.enginePicker?.addEventListener('keydown', handlePickerKeydown);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch(input.value);
      if (e.key === 'Escape') closeHistoryPanel();
      if (e.key === 'ArrowDown' && getHistoryPanel()?.classList.contains('is-open')) {
        const firstSuggestion = getHistoryPanel()?.querySelector('.search-history-item');
        if (firstSuggestion instanceof HTMLElement) {
          e.preventDefault();
          firstSuggestion.focus();
        }
      }
    });
    input.addEventListener('input', () => {
      input.placeholder = input.value.startsWith('http') ? 'Press Enter to navigate...' : 'Search anything...';
      if (!searchHistoryEnabled) return;
      if (!input.value.trim()) {
        openHistoryPanel('');
        return;
      }
      openHistoryPanel(input.value);
    });
    input.addEventListener('focus', () => {
      if (!searchHistoryEnabled) return;
      openHistoryPanel(input.value);
    });
    input.addEventListener('click', () => {
      if (!searchHistoryEnabled) return;
      openHistoryPanel(input.value);
    });
    setTimeout(() => input.focus(), 100);
  }

  if (submit) {
    submit.addEventListener('click', () => performSearch(input?.value || ''));
  }

  document.addEventListener('click', (e) => {
    if (!searchWrapper || searchWrapper.contains(e.target)) return;
    closePicker();
    closeHistoryPanel();
  });

  Prefs.onChange((changes) => {
    if ('searchEngine' in changes) setEngine(getEngine(changes.searchEngine));
    if ('searchHistory' in changes) {
      searchHistoryEnabled = changes.searchHistory !== false;
      if (!searchHistoryEnabled) closeHistoryPanel();
      else if (document.activeElement === input) openHistoryPanel(input?.value || '');
    }
  });

  bus.addEventListener('themeChanged', () => {
    closePicker();
    closeHistoryPanel();
  });
}
