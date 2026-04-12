import { Prefs } from './storage.js';
import { DOM } from './dom.js';
import { toast } from './toast.js';

const LAYOUT_KEYS = Object.freeze({
  dock: {
    selector: '#left-dock .ql-pill',
    xKey: 'sidebarX',
    yKey: 'sidebarY',
    xVar: '--sidebar-offset-x',
    yVar: '--sidebar-offset-y',
    label: 'Dock',
  },
  clock: {
    selector: '#clock-zone .clock-wrapper',
    xKey: 'clockX',
    yKey: 'clockY',
    xVar: '--clock-offset-x',
    yVar: '--clock-offset-y',
    label: 'Time',
  },
  center: {
    selector: '#center-stack',
    xKey: 'centerX',
    yKey: 'centerY',
    xVar: '--center-offset-x',
    yVar: '--center-offset-y',
    label: 'Search',
  },
  quicklinks: {
    selector: '#bottom-links-grid',
    xKey: 'quicklinksX',
    yKey: 'quicklinksY',
    xVar: '--quicklinks-offset-x',
    yVar: '--quicklinks-offset-y',
    label: 'Quick Links',
  },
  tasks: {
    selector: '#tasks-btn',
    xKey: 'tasksX',
    yKey: 'tasksY',
    xVar: '--tasks-offset-x',
    yVar: '--tasks-offset-y',
    label: 'Tasks',
  },
  zen: {
    selector: '#focus-btn',
    xKey: 'zenX',
    yKey: 'zenY',
    xVar: '--zen-offset-x',
    yVar: '--zen-offset-y',
    label: 'Zen',
  },
});

const DASHBOARD_FONTS = Object.freeze({
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  poppins: "'Poppins', sans-serif",
  gloria: "'Gloria Hallelujah', cursive",
  silkscreen: "'Silkscreen', monospace",
});

const LAYOUT_EDGE_PADDING = 12;

export const DEFAULT_LAYOUT_OFFSETS = Object.freeze({
  clockX: 0,
  clockY: 0,
  centerX: 0,
  centerY: 0,
  quicklinksX: 0,
  quicklinksY: 0,
  sidebarX: 0,
  sidebarY: 0,
  tasksX: 0,
  tasksY: 0,
  zenX: 0,
  zenY: 0,
});

const preferenceState = {
  textDepth: true,
  editLayoutMode: false,
  showClock: true,
  showGreeting: true,
  dashboardFont: 'gloria',
  layoutOffsets: { ...DEFAULT_LAYOUT_OFFSETS },
};

let prefsBound = false;
let layoutBindingsBound = false;
let activeLayoutDrag = null;
let layoutEditorHud = null;
let layoutEditorHudTimer = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLayoutOffsets(value) {
  const next = { ...DEFAULT_LAYOUT_OFFSETS };
  if (!value || typeof value !== 'object') return next;

  Object.keys(next).forEach((key) => {
    const candidate = value[key];
    next[key] = Number.isFinite(candidate) ? candidate : next[key];
  });

  return next;
}

function applyLayoutOffsets(offsets) {
  const next = normalizeLayoutOffsets(offsets);
  preferenceState.layoutOffsets = next;

  const root = document.documentElement.style;
  Object.values(LAYOUT_KEYS).forEach((config) => {
    root.setProperty(config.xVar, `${Math.round(next[config.xKey])}px`);
    root.setProperty(config.yVar, `${Math.round(next[config.yKey])}px`);
  });
}

function applyTextDepth(enabled) {
  document.body?.classList.toggle('text-depth-disabled', !enabled);
}

function applyWidgetVisibility() {
  if (DOM.clockZone) DOM.clockZone.hidden = !preferenceState.showClock;
  if (DOM.greeting) DOM.greeting.hidden = !preferenceState.showGreeting;
}

function announceLayoutEditor(message) {
  const live = layoutEditorHud?.querySelector('[data-layout-editor-live]');
  if (live) live.textContent = message;
}

function createLayoutEditorButton(label, className, onclick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onclick);
  return button;
}

function ensureLayoutEditorHud() {
  if (layoutEditorHud) return;
  if (layoutEditorHudTimer) {
    clearTimeout(layoutEditorHudTimer);
    layoutEditorHudTimer = 0;
  }

  const hud = document.createElement('div');
  hud.className = 'layout-editor-hud';
  hud.setAttribute('role', 'toolbar');
  hud.setAttribute('aria-label', 'Layout editor');

  const copy = document.createElement('div');
  copy.className = 'layout-editor-copy';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'layout-editor-eyebrow';
  eyebrow.textContent = 'Layout editor';

  const title = document.createElement('strong');
  title.textContent = 'Drag highlighted controls';

  const hint = document.createElement('span');
  hint.className = 'layout-editor-hint';
  hint.textContent = 'Esc exits. Reset restores defaults.';

  const live = document.createElement('span');
  live.className = 'layout-editor-live';
  live.dataset.layoutEditorLive = 'true';
  live.setAttribute('aria-live', 'polite');

  copy.append(eyebrow, title, hint, live);

  const actions = document.createElement('div');
  actions.className = 'layout-editor-actions';
  actions.append(
    createLayoutEditorButton('Reset', 'layout-editor-action', async () => {
      await resetLayoutOffsets({ persist: true, announce: false });
      announceLayoutEditor('Layout reset.');
    }),
    createLayoutEditorButton('Done', 'layout-editor-action layout-editor-action-primary', async () => {
      await setLayoutEditMode(false, { persist: true, announce: false });
      toast.success('Layout saved.');
    })
  );

  hud.append(copy, actions);
  document.body.appendChild(hud);
  layoutEditorHud = hud;
  requestAnimationFrame(() => hud.classList.add('is-visible'));
}

function removeLayoutEditorHud() {
  if (!layoutEditorHud) return;
  if (layoutEditorHudTimer) {
    clearTimeout(layoutEditorHudTimer);
    layoutEditorHudTimer = 0;
  }

  const hud = layoutEditorHud;
  layoutEditorHud = null;
  hud.classList.remove('is-visible');
  layoutEditorHudTimer = setTimeout(() => {
    layoutEditorHudTimer = 0;
    hud.remove();
  }, 260);
}

function applyDashboardFont(fontId) {
  const next = DASHBOARD_FONTS[fontId] ? fontId : 'gloria';
  preferenceState.dashboardFont = next;
  document.documentElement.style.setProperty('--dashboard-font-family', DASHBOARD_FONTS[next]);
}

function stopLayoutDrag({ persist = false } = {}) {
  if (!activeLayoutDrag) return;

  activeLayoutDrag.target.classList.remove('is-layout-dragging');
  document.body?.classList.remove('is-layout-dragging');

  const nextOffsets = { ...preferenceState.layoutOffsets };
  const shouldPersist = persist && activeLayoutDrag.didMove;
  activeLayoutDrag = null;

  if (shouldPersist) {
    Prefs.set('layoutOffsets', nextOffsets);
  }
}

function applyLayoutEditMode(enabled) {
  preferenceState.editLayoutMode = Boolean(enabled);
  document.body?.classList.toggle('is-layout-editing', preferenceState.editLayoutMode);
  if (preferenceState.editLayoutMode) {
    ensureLayoutEditorHud();
  } else {
    removeLayoutEditorHud();
  }
  if (!preferenceState.editLayoutMode) {
    stopLayoutDrag({ persist: false });
  }
}

function updatePreferenceState(changes) {
  if ('textDepth' in changes) preferenceState.textDepth = changes.textDepth !== false;
  if ('showClock' in changes) preferenceState.showClock = changes.showClock !== false;
  if ('showGreeting' in changes) preferenceState.showGreeting = changes.showGreeting !== false;
  if ('dashboardFont' in changes) preferenceState.dashboardFont = DASHBOARD_FONTS[changes.dashboardFont] ? changes.dashboardFont : 'gloria';
  if ('layoutOffsets' in changes) preferenceState.layoutOffsets = normalizeLayoutOffsets(changes.layoutOffsets);
  if ('editLayoutMode' in changes) preferenceState.editLayoutMode = changes.editLayoutMode === true;
}

function syncPreferenceEffects() {
  applyTextDepth(preferenceState.textDepth);
  applyWidgetVisibility();
  applyDashboardFont(preferenceState.dashboardFont);
  applyLayoutOffsets(preferenceState.layoutOffsets);
  applyLayoutEditMode(preferenceState.editLayoutMode);
}

function bindLayoutTargets() {
  document.querySelectorAll('.layout-edit-target[data-layout-edit-target]').forEach((el) => {
    el.classList.remove('layout-edit-target');
    el.removeAttribute('data-layout-edit-target');
    el.removeAttribute('data-layout-label');
    el.removeAttribute('title');
  });

  Object.entries(LAYOUT_KEYS).forEach(([key, config]) => {
    const el = document.querySelector(config.selector);
    if (!(el instanceof HTMLElement)) return;
    el.classList.add('layout-edit-target');
    el.dataset.layoutEditTarget = key;
    el.dataset.layoutLabel = `Drag ${config.label}`;
    el.title = `Drag ${config.label} to reposition`;
  });
}

function handleLayoutPointerDown(event) {
  if (!preferenceState.editLayoutMode) return;
  if (!(event instanceof PointerEvent)) return;
  if (event.button !== 0 || event.isPrimary === false) return;

  const target = event.target instanceof Element
    ? event.target.closest('.layout-edit-target')
    : null;
  if (!(target instanceof HTMLElement)) return;

  const config = LAYOUT_KEYS[target.dataset.layoutEditTarget];
  if (!config) return;

  const rect = target.getBoundingClientRect();
  activeLayoutDrag = {
    pointerId: event.pointerId,
    target,
    config,
    startX: event.clientX,
    startY: event.clientY,
    startOffsetX: preferenceState.layoutOffsets[config.xKey],
    startOffsetY: preferenceState.layoutOffsets[config.yKey],
    minDeltaX: LAYOUT_EDGE_PADDING - rect.left,
    maxDeltaX: window.innerWidth - LAYOUT_EDGE_PADDING - rect.right,
    minDeltaY: LAYOUT_EDGE_PADDING - rect.top,
    maxDeltaY: window.innerHeight - LAYOUT_EDGE_PADDING - rect.bottom,
    didMove: false,
  };

  try {
    target.setPointerCapture(event.pointerId);
  } catch {
    // Some non-primary/browser-generated pointer events cannot be captured.
  }

  target.classList.add('is-layout-dragging');
  document.body?.classList.add('is-layout-dragging');
  event.preventDefault();
  event.stopPropagation();
  announceLayoutEditor(`Moving ${config.label}.`);
}

function handleLayoutPointerMove(event) {
  if (!activeLayoutDrag) return;
  if (!(event instanceof PointerEvent)) return;
  if (event.pointerId !== activeLayoutDrag.pointerId) return;

  const deltaX = clamp(event.clientX - activeLayoutDrag.startX, activeLayoutDrag.minDeltaX, activeLayoutDrag.maxDeltaX);
  const deltaY = clamp(event.clientY - activeLayoutDrag.startY, activeLayoutDrag.minDeltaY, activeLayoutDrag.maxDeltaY);

  activeLayoutDrag.didMove = activeLayoutDrag.didMove || Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1;

  preferenceState.layoutOffsets = {
    ...preferenceState.layoutOffsets,
    [activeLayoutDrag.config.xKey]: Math.round(activeLayoutDrag.startOffsetX + deltaX),
    [activeLayoutDrag.config.yKey]: Math.round(activeLayoutDrag.startOffsetY + deltaY),
  };

  applyLayoutOffsets(preferenceState.layoutOffsets);
  event.preventDefault();
}

function handleLayoutPointerUp(event) {
  if (!activeLayoutDrag) return;
  if (!(event instanceof PointerEvent)) return;
  if (event.pointerId !== activeLayoutDrag.pointerId) return;
  try {
    activeLayoutDrag.target.releasePointerCapture(event.pointerId);
  } catch {}
  event.preventDefault();
  stopLayoutDrag({ persist: true });
  announceLayoutEditor('Position saved.');
}

function handleLayoutEditorKeydown(event) {
  if (!preferenceState.editLayoutMode || event.key !== 'Escape') return;
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
  event.preventDefault();
  setLayoutEditMode(false, { persist: true, announce: false });
}

function ensureLayoutBindings() {
  if (layoutBindingsBound) return;
  layoutBindingsBound = true;
  bindLayoutTargets();
  document.addEventListener('pointerdown', handleLayoutPointerDown, true);
  document.addEventListener('pointermove', handleLayoutPointerMove, true);
  document.addEventListener('pointerup', handleLayoutPointerUp, true);
  document.addEventListener('pointercancel', handleLayoutPointerUp, true);
  document.addEventListener('keydown', handleLayoutEditorKeydown, true);
}

export async function setLayoutEditMode(enabled, { persist = true, announce = false } = {}) {
  const next = Boolean(enabled);
  preferenceState.editLayoutMode = next;
  applyLayoutEditMode(next);

  if (persist) {
    await Prefs.set('editLayoutMode', next);
  }

  if (announce) {
    toast.info(
      next
        ? 'Layout editor ready. Drag highlighted areas, then press Done.'
        : 'Layout saved.'
    );
  }
}

export async function setTextDepth(enabled, { persist = true } = {}) {
  const next = enabled !== false;
  preferenceState.textDepth = next;
  applyTextDepth(next);

  if (persist) {
    await Prefs.set('textDepth', next);
  }
}

export async function resetLayoutOffsets({ persist = true, announce = true } = {}) {
  preferenceState.layoutOffsets = { ...DEFAULT_LAYOUT_OFFSETS };
  applyLayoutOffsets(preferenceState.layoutOffsets);

  if (persist) {
    await Prefs.set('layoutOffsets', preferenceState.layoutOffsets);
  }

  if (announce) {
    toast.info('Layout reset to default positions.');
  }
}

export async function initPreferences() {
  const prefs = await Prefs.getAll();
  updatePreferenceState(prefs);
  syncPreferenceEffects();
  ensureLayoutBindings();

  if (prefsBound) return;
  prefsBound = true;
  Prefs.onChange((changes) => {
    updatePreferenceState(changes);
    syncPreferenceEffects();
  });
}
