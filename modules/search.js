import { Prefs } from './storage.js';
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
  picker.classList.add('is-open');
  DOM.engineBtn?.classList.add('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'true');
  const activeIdx = ENGINES.findIndex((engine) => engine.id === currentEngine.id);
  highlightedIndex = activeIdx >= 0 ? activeIdx : 0;
  if (focusList) {
    requestAnimationFrame(() => focusOption(highlightedIndex));
  }
}

function closePicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.classList.remove('is-open');
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
    });
    input.addEventListener('input', () => {
      input.placeholder = input.value.startsWith('http') ? 'Press Enter to navigate...' : 'Search anything...';
    });
    setTimeout(() => input.focus(), 100);
  }

  if (submit) {
    submit.addEventListener('click', () => performSearch(input?.value || ''));
  }

  document.addEventListener('click', (e) => {
    if (!searchWrapper || searchWrapper.contains(e.target)) return;
    closePicker();
  });

  Prefs.onChange((changes) => {
    if ('searchEngine' in changes) setEngine(getEngine(changes.searchEngine));
  });

  bus.addEventListener('themeChanged', closePicker);
}
