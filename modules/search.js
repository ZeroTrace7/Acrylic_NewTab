/*
 * Acrylic - New Tab
 * Copyright (C) 2026 Shreyash Gupta
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { Prefs, Store } from './storage.js';
import { sanitizeUrl, isValidUrl } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

const DEFAULT_ENGINE_ID = 'default';
const FALLBACK_ENGINE_ICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
);
const SEARCH_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
const SEND_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

const ENGINE_GROUPS = [
  { id: 'destinations', label: 'Search & AI' },
];

const ENGINES = [
  { id: 'default', name: 'Web Search', group: 'destinations', type: 'search', url: '', icon: 'icons/google-classic.svg' },
  { id: 'chatgpt', name: 'ChatGPT', group: 'destinations', type: 'ai', url: 'https://chatgpt.com/?q=', icon: 'icons/chatgpt.svg' },
  { id: 'gemini', name: 'Gemini', group: 'destinations', type: 'ai', url: 'https://gemini.google.com/app?q=', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', iconSize: 22 },
  { id: 'claude', name: 'Claude', group: 'destinations', type: 'ai', url: 'https://claude.ai/new?q=', icon: 'https://cdn.simpleicons.org/claude/D97757' },
  { id: 'perplexity', name: 'Perplexity', group: 'destinations', type: 'ai', url: 'https://www.perplexity.ai/search?q=', icon: 'icons/perplexity-mark.png' },
  { id: 'grok', name: 'Grok', group: 'destinations', type: 'ai', url: 'https://grok.com/?q=', icon: 'icons/grok.png' },
  { id: 'deepseek', name: 'DeepSeek', group: 'destinations', type: 'ai', url: 'https://chat.deepseek.com/', icon: 'icons/deepseek.png' },
];

let currentEngine = ENGINES.find((engine) => engine.id === DEFAULT_ENGINE_ID) || ENGINES[0];
let highlightedIndex = 0;
let pickerOpenRaf = 0;
let pickerOpenRaf2 = 0;
let pickerFocusTimer = 0;
let searchHistoryEnabled = false;
let searchHistoryItems = [];
let engineIconSwapTimer = 0;
let engineIconResetTimer = 0;
let engineIconSwapToken = 0;

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
  DOM.engineBtn?.setAttribute('aria-label', `Choose search destination. Current: ${engine.name}`);
  DOM.engineBtn?.setAttribute('title', engine.name);
  const icon = DOM.engineIcon;
  if (icon) {
    clearTimeout(engineIconSwapTimer);
    clearTimeout(engineIconResetTimer);
    const iconSwapToken = ++engineIconSwapToken;
    /* Premium icon-swap micro-animation: shrink → swap → spring back */
    icon.style.transition = 'transform 120ms ease';
    icon.style.transform = 'scale(0.7)';
    engineIconSwapTimer = setTimeout(() => {
      if (iconSwapToken !== engineIconSwapToken) return;
      icon.onerror = () => {
        icon.onerror = null;
        icon.src = FALLBACK_ENGINE_ICON;
      };
      icon.src = engine.icon;
      icon.alt = engine.name;
      icon.width = engine.iconSize || 18;
      icon.height = engine.iconSize || 18;
      icon.style.transform = 'scale(1.1)';
      engineIconResetTimer = setTimeout(() => {
        if (iconSwapToken !== engineIconSwapToken) return;
        icon.style.transform = '';
      }, 120);
    }, 100);
  }
  Prefs.set('searchEngine', engine.id);
  updatePickerSelection();
  syncAssistantMode();
}

function isAssistantEngine(engine) {
  return engine?.type === 'ai';
}

function syncAssistantMode() {
  const input = DOM.searchInput;
  const submit = DOM.searchSubmit;
  const isAssistant = isAssistantEngine(currentEngine);
  if (submit) {
    submit.innerHTML = isAssistant ? SEND_ICON_SVG : SEARCH_ICON_SVG;
    submit.setAttribute('aria-label', isAssistant ? `Send to ${currentEngine.name}` : 'Search the web');
    submit.setAttribute('title', currentEngine.name);
  }
  if (input && !input.value.startsWith('http')) {
    input.placeholder = isAssistant ? `Message ${currentEngine.name}...` : 'Search anything...';
  }
  syncPromptExpansion();
}

let _promptExpansionTimer = 0;
let _promptExpansionToken = 0;
let _promptExpansionTarget = null;

function syncPromptExpansion() {
  const isAssistant = isAssistantEngine(currentEngine);
  const hasText = DOM.searchInput?.value.trim().length > 0;
  const shouldExpand = isAssistant && hasText;
  const isExpanded = document.body.classList.contains('ai-prompt-active');
  const wrapper = DOM.searchWrapper;

  if (_promptExpansionTarget !== null && _promptExpansionTarget !== shouldExpand) {
    clearTimeout(_promptExpansionTimer);
    _promptExpansionTimer = 0;
    _promptExpansionToken += 1;
    _promptExpansionTarget = null;
    wrapper?.classList.remove('mode-transitioning');
  }

  /* No change needed */
  if (shouldExpand === isExpanded) {
    if (_promptExpansionTarget === null) wrapper?.classList.remove('mode-transitioning');
    return;
  }

  if (!wrapper) {
    _promptExpansionTarget = null;
    document.body.classList.toggle('ai-prompt-active', shouldExpand);
    return;
  }

  /* Cancel any in-flight transition */
  clearTimeout(_promptExpansionTimer);
  const promptExpansionToken = ++_promptExpansionToken;
  _promptExpansionTarget = shouldExpand;

  /* Phase 1 — fade out the inner content (140ms) */
  wrapper.classList.add('mode-transitioning');

  _promptExpansionTimer = setTimeout(() => {
    if (promptExpansionToken !== _promptExpansionToken) return;
    /* Phase 2 — apply layout change while invisible */
    document.body.classList.toggle('ai-prompt-active', shouldExpand);
    _promptExpansionTarget = null;
    _promptExpansionTimer = 0;

    /* Phase 3 — fade back in (180ms via CSS) */
    requestAnimationFrame(() => {
      if (promptExpansionToken !== _promptExpansionToken) return;
      wrapper.classList.remove('mode-transitioning');
    });
  }, 150);
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
        img.width = engine.iconSize || 18;
        img.height = engine.iconSize || 18;

        const span = document.createElement('span');
        span.textContent = engine.name;

        opt.append(img, span);
        opt.addEventListener('focus', () => setOptionHighlight(currentOptionIndex));
        opt.addEventListener('click', () => {
          setEngine(engine);
          closePicker();
          DOM.searchInput?.focus();
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
  } else if (!isAssistantEngine(currentEngine)) {
    chrome.search.query({ text: q, disposition: 'CURRENT_TAB' });
  } else {
    /* AI assistants use direct destination URLs. */
    window.location.href = currentEngine.url + encodeURIComponent(q);
  }
}

/** Initializes the search bar, engine picker, and all related event listeners. */
export async function initSearch() {
  let savedId = await Prefs.get('searchEngine');
  searchHistoryEnabled = false;          /* Search history permanently disabled */
  searchHistoryItems = [];

  /* Ghost-data migration: removed ids like 'youtube' should fall back to
     the neutral web-search option instead of breaking picker state. */
  const resolved = getEngine(savedId);
  if (resolved.id !== savedId) {
    Prefs.set('searchEngine', resolved.id);
  }
  setEngine(resolved);
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
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearch(input.value);
      }
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
      input.placeholder = input.value.startsWith('http')
        ? 'Press Enter to navigate...'
        : (isAssistantEngine(currentEngine) ? `Message ${currentEngine.name}...` : 'Search anything...');
      syncPromptExpansion();
      closeHistoryPanel();
    });
    input.addEventListener('focus', () => {
      syncPromptExpansion();
      closeHistoryPanel();
    });
    input.addEventListener('click', () => {
      closeHistoryPanel();
    });
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

  /* Enable smooth expansion transitions after entry animation completes */
  setTimeout(() => searchWrapper?.classList.add('transitions-ready'), 1600);
}
