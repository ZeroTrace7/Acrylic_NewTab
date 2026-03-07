import { toast } from '../modules/toast.js';

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
  panel.className = 'glass animate-slide-in-up';
  Object.assign(panel.style, {
    position: 'absolute', left: '110px', top: '50%', transform: 'translateY(-50%)',
    bottom: 'auto', right: 'auto',
    width: '26vw', minWidth: '320px',
    maxWidth: '480px', maxHeight: '70vh', minHeight: '320px', zIndex: '100',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  });

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';
  Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0 16px', flexShrink: '0' });
  const h2 = document.createElement('h2');
  h2.textContent = 'Quick Tools';
  Object.assign(h2.style, { fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' });
  const closeBtn = document.createElement('button');
  closeBtn.id = 'panel-close-btn';
  closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  Object.assign(closeBtn.style, {
    width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'var(--glass-subtle)', border: '1px solid var(--glass-border-soft)',
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 150ms ease',
  });
  closeBtn.onmouseenter = () => { closeBtn.style.color = 'var(--text-primary)'; closeBtn.style.background = 'var(--glass-bg)'; };
  closeBtn.onmouseleave = () => { closeBtn.style.color = 'var(--text-secondary)'; closeBtn.style.background = 'var(--glass-subtle)'; };
  header.append(h2, closeBtn);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'panel-tabs';
  Object.assign(tabBar.style, { display: 'flex', gap: '4px', padding: '12px 16px 0 16px', flexShrink: '0' });
  TABS.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'panel-tab-btn';
    btn.dataset.tabId = tab.id;
    btn.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-label">${tab.label}</span>`;
    Object.assign(btn.style, {
      flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '8px 4px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '500',
      color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 150ms ease', border: '1px solid transparent',
    });
    if (tab.id === activeTab) applyActiveStyle(btn);
    btn.onclick = () => switchTab(tab.id);
    tabBar.appendChild(btn);
  });

  // Content
  const content = document.createElement('div');
  content.id = 'panel-content';
  Object.assign(content.style, { flex: '1', overflowY: 'auto', padding: '16px', minHeight: '0' });

  panel.append(header, tabBar, content);
  return panel;
}

function applyActiveStyle(btn) {
  Object.assign(btn.style, { background: 'var(--glass-bg)', color: 'var(--text-primary)', borderColor: 'var(--glass-border-soft)' });
}

function resetTabStyle(btn) {
  Object.assign(btn.style, { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' });
}

function switchTab(tabId) {
  activeTab = tabId;
  panelEl?.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.dataset.tabId === tabId ? applyActiveStyle(btn) : resetTabStyle(btn);
  });
  const contentEl = document.getElementById('panel-content');
  if (!contentEl) return;
  contentEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:32px 0;font-size:0.875rem;">Loading...</div>`;

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
  panelEl = buildPanel();
  (document.getElementById('tools-panel-mount') || document.body).appendChild(panelEl);
  switchTab(activeTab);
  panelEl.querySelector('#panel-close-btn').onclick = closePanel;
  setTimeout(() => {
    document.addEventListener('mousedown', (e) => {
      const fab = document.getElementById('tools-fab');
      if (panelEl && !panelEl.contains(e.target) && (!fab || !fab.contains(e.target))) closePanel();
    }, { once: true });
  }, 10);
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  if (panelEl) {
    panelEl.classList.add('animate-fade-out');
    setTimeout(() => { panelEl?.remove(); panelEl = null; }, 200);
  }
  onCloseCallback?.();
  onCloseCallback = null;
}

export function toggleToolsPanel(onClose) {
  isOpen ? closePanel() : openPanel(onClose);
}

