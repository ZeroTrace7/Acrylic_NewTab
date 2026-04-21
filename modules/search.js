import { Prefs, Store } from './storage.js';
import { sanitizeUrl, isValidUrl } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

const DEFAULT_ENGINE_ID = 'google';
const FALLBACK_ENGINE_ICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
);

const ENGINE_GROUPS = [
  { id: 'assistants', label: 'AI Assistants' },
  { id: 'search', label: 'Search Engines' },
];

const ENGINES = [
  { id: 'perplexity', name: 'Perplexity', group: 'assistants', url: 'https://www.perplexity.ai/search?q=', icon: 'icons/perplexity-mark.png' },
  { id: 'chatgpt', name: 'ChatGPT', group: 'assistants', url: 'https://chatgpt.com/?q=', icon: 'icons/chatgpt.svg' },
  { id: 'claude', name: 'Claude', group: 'assistants', url: 'https://claude.ai/new?q=', icon: 'https://cdn.simpleicons.org/claude/D97757' },
  { id: 'grok', name: 'Grok', group: 'assistants', url: 'https://grok.com/?q=', icon: 'icons/grok.png' },
  { id: 'deepseek', name: 'DeepSeek', group: 'assistants', url: 'https://chat.deepseek.com/search?q=', icon: 'icons/deepseek.png' },
  { id: 'google', name: 'Google', group: 'search', url: 'https://www.google.com/search?q=', icon: 'https://api.iconify.design/logos:google-icon.svg' },
  { id: 'bing', name: 'Bing', group: 'search', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
  { id: 'duckduckgo', name: 'DuckDuckGo', group: 'search', url: 'https://duckduckgo.com/?q=', icon: 'icons/duckduckgo_color.png' },
  { id: 'brave', name: 'Brave', group: 'search', url: 'https://search.brave.com/search?q=', icon: 'icons/brave_color.png' },
  { id: 'youtube', name: 'YouTube', group: 'search', url: 'https://www.youtube.com/results?search_query=', icon: 'icons/youtube_color.png' },
];

let currentEngine = ENGINES.find((engine) => engine.id === DEFAULT_ENGINE_ID) || ENGINES[0];
let highlightedIndex = 0;
let pickerOpenRaf = 0;
let pickerOpenRaf2 = 0;
let pickerFocusTimer = 0;
let searchHistoryEnabled = true;
let searchHistoryItems = [];

function setSearchPickerUiState(isOpen) {
  document.body.classList.toggle('search-picker-open', isOpen);
}

function handleSearchError(error) {
  console.error('Search failed:', error);
  toast.error('Search failed. Please try again.');
}

function triggerSearch(query) {
  void performSearch(query).catch(handleSearchError);
}

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
    try {
      searchHistoryItems = [];
      await Store.setSearchHistory([]);
      closeHistoryPanel();
    } catch (error) {
      handleSearchError(error);
    }
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
    button.addEventListener('click', () => {
      if (DOM.searchInput) DOM.searchInput.value = item;
      triggerSearch(item);
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
  return ENGINES.find((engine) => engine.id === id)
    || ENGINES.find((engine) => engine.id === DEFAULT_ENGINE_ID)
    || ENGINES[0];
}

function setEngine(engine) {
  currentEngine = engine;
  const icon = DOM.engineIcon;
  if (icon) {
    icon.onerror = () => {
      icon.onerror = null;
      icon.src = FALLBACK_ENGINE_ICON;
    };
    icon.src = engine.icon;
    icon.alt = engine.name;
  }
  Prefs.set('searchEngine', engine.id);
  updatePickerSelection();
}

function clearOptionHighlight() {
  getEngineOptions().forEach((el) => el.classList.remove('is-focused'));
}

function getEngineOptions() {
  const picker = DOM.enginePicker;
  if (!picker) return [];
  return Array.from(picker.querySelectorAll('.engine-option'));
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
  setSearchPickerUiState(true);
  DOM.engineBtn?.classList.add('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'true');
  const activeIdx = getEngineOptions().findIndex((el) => el.dataset.engineId === currentEngine.id);
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
  setSearchPickerUiState(false);
  DOM.engineBtn?.classList.remove('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'false');
  clearOptionHighlight();
}

function togglePicker() {
  if (isPickerOpen()) closePicker();
  else openPicker();
}

function setOptionHighlight(index) {
  highlightedIndex = index;
  getEngineOptions().forEach((el, optionIndex) => {
    el.classList.toggle('is-focused', optionIndex === highlightedIndex);
  });
}

function buildPicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.innerHTML = '';
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', 'Search destination');
  picker.setAttribute('aria-hidden', 'true');

  const grid = document.createElement('div');
  grid.className = 'engine-picker-grid';

  let optionIndex = 0;
  ENGINE_GROUPS.forEach((group) => {
    const section = document.createElement('section');
    section.className = 'engine-picker-section';
    section.setAttribute('aria-label', group.label);

    const title = document.createElement('div');
    title.className = 'engine-picker-title';
    title.textContent = group.label;

    const list = document.createElement('div');
    list.className = 'engine-picker-list';

    ENGINES
      .filter((engine) => engine.group === group.id)
      .forEach((engine) => {
        const currentOptionIndex = optionIndex;
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'engine-option';
        if (engine.id === currentEngine.id) opt.classList.add('active');
        opt.dataset.engineId = engine.id;
        opt.setAttribute('role', 'option');
        opt.setAttribute('aria-selected', String(engine.id === currentEngine.id));
        opt.style.setProperty('--engine-option-delay', `${40 + (currentOptionIndex * 24)}ms`);
        opt.tabIndex = -1;

        const img = document.createElement('img');
        img.src = engine.icon;
        img.alt = engine.name;
        img.width = 18;
        img.height = 18;

        const span = document.createElement('span');
        span.textContent = engine.name;

        opt.append(img, span);
        opt.addEventListener('focus', () => setOptionHighlight(currentOptionIndex));
        opt.addEventListener('click', () => {
          setEngine(engine);
          closePicker();
          DOM.engineBtn?.focus();
        });

        list.appendChild(opt);
        optionIndex += 1;
      });

    section.append(title, list);
    grid.appendChild(section);
  });

  picker.appendChild(grid);
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

async function performSearch(query) {
  const q = query.trim();
  if (!q) return;
  closeHistoryPanel();
  await rememberSearchQuery(q);
  if (isValidUrl(sanitizeUrl(q))) {
    window.location.href = sanitizeUrl(q);
  } else {
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
      if (e.key === 'Enter') triggerSearch(input.value);
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
    submit.addEventListener('click', () => triggerSearch(input?.value || ''));
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
