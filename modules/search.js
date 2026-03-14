import { Prefs } from './storage.js';
import { sanitizeUrl, isValidUrl } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

const ENGINES = [
  { id: 'google',     name: 'Google',     url: 'https://www.google.com/search?q=',     icon: 'https://www.google.com/favicon.ico' },
  { id: 'bing',       name: 'Bing',       url: 'https://www.bing.com/search?q=',       icon: 'https://www.bing.com/favicon.ico' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',           icon: 'https://duckduckgo.com/favicon.ico' },
  { id: 'brave',      name: 'Brave',      url: 'https://search.brave.com/search?q=',   icon: 'https://brave.com/favicon.ico' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=',  icon: 'https://www.perplexity.ai/favicon.ico' },
];

let currentEngine = ENGINES[0];

function getEngine(id) {
  return ENGINES.find((e) => e.id === id) || ENGINES[0];
}

function setEngine(engine) {
  currentEngine = engine;
  const icon = DOM.engineBtn?.querySelector('img') || document.querySelector('#engine-icon');
  if (icon) { icon.src = engine.icon; icon.alt = engine.name; }
  Prefs.set('searchEngine', engine.id);
  document.querySelectorAll('.engine-option').forEach((el) => {
    el.classList.toggle('active', el.dataset.engineId === engine.id);
  });
}

function isPickerOpen() {
  return DOM.enginePicker?.classList.contains('is-open') === true;
}

function openPicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.classList.add('is-open');
  DOM.engineBtn?.classList.add('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'true');
}

function closePicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.classList.remove('is-open');
  DOM.engineBtn?.classList.remove('is-open');
  DOM.engineBtn?.setAttribute('aria-expanded', 'false');
}

function togglePicker() {
  if (isPickerOpen()) closePicker();
  else openPicker();
}

function buildPicker() {
  const picker = DOM.enginePicker;
  if (!picker) return;
  picker.innerHTML = '';
  ENGINES.forEach((engine) => {
    const opt = document.createElement('div');
    opt.className = 'engine-option';
    if (engine.id === currentEngine.id) opt.classList.add('active');
    opt.dataset.engineId = engine.id;
    opt.innerHTML = `<img src="${engine.icon}" alt="${engine.name}" width="16" height="16"><span>${engine.name}</span>`;
    opt.addEventListener('click', () => { setEngine(engine); closePicker(); });
    picker.appendChild(opt);
  });
}

function performSearch(query) {
  const q = query.trim();
  if (!q) return;
  if (isValidUrl(sanitizeUrl(q))) {
    window.location.href = sanitizeUrl(q);
  } else {
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
  const searchWrapper = engineBtn?.closest('#search-wrapper');

  if (engineBtn) {
    engineBtn.addEventListener('click', togglePicker);
    engineBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePicker(); }
    });
  }

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
