import { Prefs } from './storage.js';
import { DOM } from './dom.js';
import { toast } from './toast.js';

const LAYOUT_KEYS = Object.freeze({
  'left-dock': {
    xKey: 'sidebarX',
    yKey: 'sidebarY',
    xVar: '--sidebar-offset-x',
    yVar: '--sidebar-offset-y',
    label: 'Dock',
  },
  'clock-zone': {
    xKey: 'clockX',
    yKey: 'clockY',
    xVar: '--clock-offset-x',
    yVar: '--clock-offset-y',
    label: 'Time',
  },
  'middle-zone': {
    xKey: 'centerX',
    yKey: 'centerY',
    xVar: '--center-offset-x',
    yVar: '--center-offset-y',
    label: 'Search',
  },
  'quicklinks-zone': {
    xKey: 'quicklinksX',
    yKey: 'quicklinksY',
    xVar: '--quicklinks-offset-x',
    yVar: '--quicklinks-offset-y',
    label: 'Quick Links',
  },
});

export const DEFAULT_LAYOUT_OFFSETS = Object.freeze({
  clockX: 0,
  clockY: 0,
  centerX: 0,
  centerY: 0,
  quicklinksX: 0,
  quicklinksY: 0,
  sidebarX: 0,
  sidebarY: 0,
});

const preferenceState = {
  textDepth: true,
  editLayoutMode: false,
  showClock: true,
  showGreeting: true,
  layoutOffsets: { ...DEFAULT_LAYOUT_OFFSETS },
};

let prefsBound = false;
let layoutBindingsBound = false;
let activeLayoutDrag = null;

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
  if (!preferenceState.editLayoutMode) {
    stopLayoutDrag({ persist: false });
  }
}

function updatePreferenceState(changes) {
  if ('textDepth' in changes) preferenceState.textDepth = changes.textDepth !== false;
  if ('showClock' in changes) preferenceState.showClock = changes.showClock !== false;
  if ('showGreeting' in changes) preferenceState.showGreeting = changes.showGreeting !== false;
  if ('layoutOffsets' in changes) preferenceState.layoutOffsets = normalizeLayoutOffsets(changes.layoutOffsets);
  if ('editLayoutMode' in changes) preferenceState.editLayoutMode = changes.editLayoutMode === true;
}

function syncPreferenceEffects() {
  applyTextDepth(preferenceState.textDepth);
  applyWidgetVisibility();
  applyLayoutOffsets(preferenceState.layoutOffsets);
  applyLayoutEditMode(preferenceState.editLayoutMode);
}

function bindLayoutTargets() {
  Object.entries(LAYOUT_KEYS).forEach(([id, config]) => {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) return;
    el.classList.add('layout-edit-target');
    el.dataset.layoutEditTarget = id;
    el.dataset.layoutLabel = config.label;
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
    minDeltaX: 16 - rect.left,
    maxDeltaX: window.innerWidth - 16 - rect.right,
    minDeltaY: 16 - rect.top,
    maxDeltaY: window.innerHeight - 16 - rect.bottom,
    didMove: false,
  };

  target.classList.add('is-layout-dragging');
  document.body?.classList.add('is-layout-dragging');
  event.preventDefault();
  event.stopPropagation();
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
  event.preventDefault();
  stopLayoutDrag({ persist: true });
}

function ensureLayoutBindings() {
  if (layoutBindingsBound) return;
  layoutBindingsBound = true;
  bindLayoutTargets();
  document.addEventListener('pointerdown', handleLayoutPointerDown, true);
  document.addEventListener('pointermove', handleLayoutPointerMove, true);
  document.addEventListener('pointerup', handleLayoutPointerUp, true);
  document.addEventListener('pointercancel', handleLayoutPointerUp, true);
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
        ? 'Layout unlocked. Close Preferances and drag the dock, time, search, or quick links.'
        : 'Layout locked.'
    );
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
