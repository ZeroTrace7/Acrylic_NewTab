import { toast } from '../modules/toast.js';
import { DOM } from '../modules/dom.js';

let panelEl = null;
let isOpen = false;
let activeTab = 'productivity';
let onCloseCallback = null;
let openPanelRaf = 0;
let openPanelRaf2 = 0;
let closePanelTimer = 0;
let currentTabCleanup = null;
let hydratePanelRaf = 0;
let currentStageEl = null;
let tabSwitchToken = 0;

const TAB_STAGE_EXIT_MS = 320;

function handleOutsideClick(e) {
  const triggerBtn = DOM.quickToolsBtn;
  const rp = DOM.rightPanel;
  if (panelEl && rp && !rp.contains(e.target) && (!triggerBtn || !triggerBtn.contains(e.target))) {
    closePanel();
  }
}
let handleDocumentMouseDown = null;

const TABS = [
  { id: 'productivity', label: 'Productivity', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { id: 'notes', label: 'Notes', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
  { id: 'tabs', label: 'Tabs Manager', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
  { id: 'extensions', label: 'Extensions', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13v3a2 2 0 0 1-2 2h-3v-3a2 2 0 1 0-4 0v3H8a2 2 0 0 1-2-2v-3H3a2 2 0 1 1 0-4h3V8a2 2 0 0 1 2-2h3V3a2 2 0 1 1 4 0v3h3a2 2 0 0 1 2 2v3h-3a2 2 0 1 0 0 4z"/></svg>` },
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

function createContentStage(tabId) {
  const stage = document.createElement('div');
  stage.className = 'panel-content-stage';
  stage.dataset.tabId = tabId;

  const loading = document.createElement('div');
  loading.className = 'panel-stage-loading';
  loading.innerHTML = '<div class="panel-loading panel-loading-surface">Loading...</div>';

  const mount = document.createElement('div');
  mount.className = 'panel-stage-mount';

  stage.append(loading, mount);
  return { stage, mount };
}

function scheduleStageEnter(stage) {
  requestAnimationFrame(() => {
    if (!stage.isConnected) return;
    stage.classList.add('is-current');
  });
}

function removeStageAfterExit(stage) {
  window.setTimeout(() => {
    if (stage.parentNode) stage.remove();
  }, TAB_STAGE_EXIT_MS);
}

function switchTab(tabId) {
  if (tabId === activeTab && currentStageEl) return;

  activeTab = tabId;
  panelEl?.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.dataset.tabId === tabId ? btn.classList.add('is-active') : resetTabStyle(btn);
  });

  const contentEl = panelEl?.querySelector('#panel-content');
  if (!contentEl) return;

  const requestId = ++tabSwitchToken;
  const previousStage = currentStageEl;
  const { stage, mount } = createContentStage(tabId);
  contentEl.appendChild(stage);
  currentStageEl = stage;
  scheduleStageEnter(stage);

  if (previousStage) {
    previousStage.classList.remove('is-current');
    previousStage.classList.add('is-leaving');
    removeStageAfterExit(previousStage);
  }

  if (currentTabCleanup) {
    currentTabCleanup();
    currentTabCleanup = null;
  }

  const loaders = {
    productivity: () => import('../panels/pomodoro.js').then(m => m.initPomodoro),
    notes:        () => import('../panels/notes.js').then(m => m.initNotes),
    tabs:         () => import('../panels/tabs.js').then(m => m.initTabs),
    extensions:   () => import('../panels/extensions.js').then(m => m.initExtensions),
  };

  loaders[tabId]()
    .then(async (init) => {
      if (requestId !== tabSwitchToken || stage !== currentStageEl || !stage.isConnected) return;

      currentTabCleanup = await init(mount);

      if (requestId !== tabSwitchToken || stage !== currentStageEl || !stage.isConnected) {
        if (currentTabCleanup) {
          currentTabCleanup();
          currentTabCleanup = null;
        }
        return;
      }

      stage.classList.add('is-ready');
    })
    .catch(() => {
      if (requestId !== tabSwitchToken || !stage.isConnected) return;
      stage.classList.add('is-ready');
      mount.innerHTML = '<div class="panel-loading">Failed to load panel</div>';
      toast.error('Failed to load panel');
    });
}

function openPanel(callback) {
  if (isOpen) return;
  isOpen = true;
  onCloseCallback = callback;
  if (closePanelTimer) {
    clearTimeout(closePanelTimer);
    closePanelTimer = 0;
    panelEl?.remove();
    panelEl = null;
  }
  if (openPanelRaf) {
    cancelAnimationFrame(openPanelRaf);
    openPanelRaf = 0;
  }
  if (openPanelRaf2) {
    cancelAnimationFrame(openPanelRaf2);
    openPanelRaf2 = 0;
  }

  const mount = DOM.toolsPanelMount;
  const rightPanel = DOM.rightPanel;

  panelEl = buildPanel();
  (mount || document.body).appendChild(panelEl);
  panelEl.classList.remove('is-open');
  panelEl.querySelector('#panel-content').innerHTML = '';
  currentStageEl = null;
  tabSwitchToken++;

  // Ensure smooth interpolation by opening on the next paint frames.
  openPanelRaf = requestAnimationFrame(() => {
    openPanelRaf = 0;
    openPanelRaf2 = requestAnimationFrame(() => {
      openPanelRaf2 = 0;
      if (!isOpen) return;
      panelEl?.classList.add('is-open');
      rightPanel?.classList.add('open');
      hydratePanelRaf = requestAnimationFrame(() => {
        hydratePanelRaf = 0;
        if (!isOpen) return;
        switchTab(activeTab);
      });
    });
  });
  panelEl.querySelector('#panel-close-btn').onclick = closePanel;
  handleDocumentMouseDown = (e) => {
    const quickToolsBtn = DOM.quickToolsBtn;
    const fab = DOM.toolsFab;
    const rp = DOM.rightPanel;
    const target = e.target;

    if (!panelEl || !rp || rp.contains(target)) return;
    if (quickToolsBtn && quickToolsBtn.contains(target)) return;
    if (fab && fab.contains(target)) return;

    closePanel();
  };

  setTimeout(() => {
    if (!isOpen || !handleDocumentMouseDown) return;
    document.addEventListener('mousedown', handleDocumentMouseDown);
  }, 10);
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  if (openPanelRaf) {
    cancelAnimationFrame(openPanelRaf);
    openPanelRaf = 0;
  }
  if (openPanelRaf2) {
    cancelAnimationFrame(openPanelRaf2);
    openPanelRaf2 = 0;
  }
  if (hydratePanelRaf) {
    cancelAnimationFrame(hydratePanelRaf);
    hydratePanelRaf = 0;
  }
  if (handleDocumentMouseDown) {
    document.removeEventListener('mousedown', handleDocumentMouseDown);
    handleDocumentMouseDown = null;
  }

  if (currentTabCleanup) {
    currentTabCleanup();
    currentTabCleanup = null;
  }
  currentStageEl = null;
  tabSwitchToken++;

  const rightPanel = DOM.rightPanel;
  panelEl?.classList.remove('is-open');
  if (rightPanel) rightPanel.classList.remove('open');

  const closingPanel = panelEl;
  if (closingPanel) {
    // Wait for right-drawer and panel transition to finish before cleanup.
    closePanelTimer = setTimeout(() => {
      closePanelTimer = 0;
      if (panelEl === closingPanel) {
        closingPanel.remove();
        panelEl = null;
      }
    }, 1180);
  }
  onCloseCallback?.();
  onCloseCallback = null;
}

export function toggleToolsPanel(onClose) {
  isOpen ? closePanel() : openPanel(onClose);
}

