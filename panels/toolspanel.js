import { toast } from '../modules/toast.js';
import { DOM } from '../modules/dom.js';

let panelEl = null;
let isOpen = false;
let activeTab = 'productivity';
let onCloseCallback = null;

const TABS = [
  { id: 'productivity', label: 'Productivity', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { id: 'notes', label: 'Notes', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
  { id: 'tabs', label: 'Tabs Manager', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
];

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'tools-panel';
  panel.className = 'glass tools-drawer';

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';
  const h2 = document.createElement('h2');
  h2.className = 'panel-title';
  h2.textContent = 'Quick Tools';
  const closeBtn = document.createElement('button');
  closeBtn.id = 'panel-close-btn';
  closeBtn.className = 'panel-close-btn';
  closeBtn.ariaLabel = 'Close tools panel';
  closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  header.append(h2, closeBtn);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'panel-tabs';
  TABS.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'panel-tab-btn';
    btn.ariaLabel = `Open ${tab.label} tab`;
    btn.dataset.tabId = tab.id;
    btn.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-label">${tab.label}</span>`;
    if (tab.id === activeTab) btn.classList.add('is-active');
    btn.onclick = () => switchTab(tab.id);
    tabBar.appendChild(btn);
  });

  // Content
  const content = document.createElement('div');
  content.id = 'panel-content';
  content.className = 'panel-content';

  panel.append(header, tabBar, content);
  return panel;
}

function resetTabStyle(btn) {
  btn.classList.remove('is-active');
}

function switchTab(tabId) {
  activeTab = tabId;
  panelEl?.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.dataset.tabId === tabId ? btn.classList.add('is-active') : resetTabStyle(btn);
  });
  const contentEl = panelEl?.querySelector('#panel-content');
  if (!contentEl) return;
  contentEl.innerHTML = '<div class="panel-loading">Loading...</div>';

  const loaders = {
    productivity: () => import('../panels/pomodoro.js').then(m => m.initPomodoro),
    notes:        () => import('../panels/notes.js').then(m => m.initNotes),
    tabs:         () => import('../panels/tabs.js').then(m => m.initTabs),
  };
  loaders[tabId]()
    .then(init => { contentEl.innerHTML = ''; init(contentEl); })
    .catch(() => toast.error('Failed to load panel'));
}

function openPanel(callback) {
  if (isOpen) return;
  isOpen = true;
  onCloseCallback = callback;

  const mount = DOM.toolsPanelMount;
  const rightPanel = DOM.rightPanel;

  panelEl = buildPanel();
  (mount || document.body).appendChild(panelEl);

  // Slide in the right panel container
  if (rightPanel) rightPanel.classList.add('open');

  switchTab(activeTab);
  panelEl.querySelector('#panel-close-btn').onclick = closePanel;
  setTimeout(() => {
    document.addEventListener('mousedown', (e) => {
      const fab = DOM.toolsFab;
      const rp = DOM.rightPanel;
      if (panelEl && rp && !rp.contains(e.target) && (!fab || !fab.contains(e.target))) closePanel();
    }, { once: true });
  }, 10);
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;

  const rightPanel = DOM.rightPanel;
  if (rightPanel) rightPanel.classList.remove('open');

  if (panelEl) {
    // Wait for slide-out transition before removing DOM
    setTimeout(() => { panelEl?.remove(); panelEl = null; }, 310);
  }
  onCloseCallback?.();
  onCloseCallback = null;
}

export function toggleToolsPanel(onClose) {
  isOpen ? closePanel() : openPanel(onClose);
}

