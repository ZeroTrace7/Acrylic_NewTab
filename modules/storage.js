/*
 * Acrylic - New Tab
 * Copyright (C) 2026 Shreyash Gupta
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 */

/* ============================================================
   ACRYLIC — modules/storage.js
   Unified storage abstraction: Prefs (sync) + Store (local)
   ============================================================ */

// ─── PART 1 — Prefs (chrome.storage.sync) ───────────────────

export const Prefs = {
  defaults: {
    theme:           'carbon',
    wallpaperUrl:    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80',
    wallpaperBlur:   0,
    wallpaperDarken: 0.3,
    grainOpacity:    0.035,
    userName:        '',
    searchEngine:    'default',
    searchHistory:   false,
    clockFormat:     '12h',
    dashboardFont:   'gloria',
    textDepth:       true,
    editLayoutMode:  false,
    showClock:       true,
    showGreeting:    true,
    showSearchBar:   true,
    showQuickLinks:  true,
    showMostVisited: true,
    showToDoList:    true,
    showQuickTools:  true,
    showZenButton:   true,
    layoutOffsets: {
      clockX:      0,
      clockY:      0,
      centerX:     0,
      centerY:     0,
      quicklinksX: 0,
      quicklinksY: 0,
      sidebarX:    0,
      sidebarY:    0,
      tasksX:      0,
      tasksY:      0,
      zenX:        0,
      zenY:        0,
    },
    quickLinksMax:   6,
    onboardingDone:  false,
  },

  /** Gets a single preference by key, falling back to its default value. */
  async get(key) {
    const result = await chrome.storage.sync.get(key);
    return result[key] ?? this.defaults[key];
  },

  /** Gets all preferences, merging stored values over defaults. */
  async getAll() {
    const result = await chrome.storage.sync.get(null);
    const merged = { ...this.defaults, ...result };
    merged.clockFormat = normalizeClockFormat(merged.clockFormat);
    merged.dashboardFont = normalizeDashboardFont(merged.dashboardFont);
    merged.quickLinksMax = normalizeQuickLinksMax(merged.quickLinksMax);
    merged.searchEngine = normalizeSearchEngine(merged.searchEngine);
    return merged;
  },

  /** Sets a single preference by key. */
  async set(key, value) {
    if (key === 'clockFormat') {
      await chrome.storage.sync.set({ [key]: normalizeClockFormat(value) });
      return;
    }
    if (key === 'dashboardFont') {
      await chrome.storage.sync.set({ [key]: normalizeDashboardFont(value) });
      return;
    }
    if (key === 'quickLinksMax') {
      await chrome.storage.sync.set({ [key]: normalizeQuickLinksMax(value) });
      return;
    }
    if (key === 'searchEngine') {
      await chrome.storage.sync.set({ [key]: normalizeSearchEngine(value) });
      return;
    }
    await chrome.storage.sync.set({ [key]: value });
  },

  /** Sets multiple preferences at once. */
  async setMany(obj) {
    const next = { ...obj };
    if ('clockFormat' in next) next.clockFormat = normalizeClockFormat(next.clockFormat);
    if ('dashboardFont' in next) next.dashboardFont = normalizeDashboardFont(next.dashboardFont);
    if ('quickLinksMax' in next) next.quickLinksMax = normalizeQuickLinksMax(next.quickLinksMax);
    if ('searchEngine' in next) next.searchEngine = normalizeSearchEngine(next.searchEngine);
    await chrome.storage.sync.set(next);
  },

  /** Listens for sync storage changes and calls callback with flattened {key: newValue} pairs. */
  onChange(callback) {
    const handler = (changes) => {
      const flat = {};
      for (const key in changes) {
        flat[key] = changes[key].newValue;
      }
      callback(flat);
    };
    chrome.storage.sync.onChanged.addListener(handler);
    return () => chrome.storage.sync.onChanged.removeListener(handler);
  },
};

function normalizeClockFormat(value) {
  return value === '24h' ? '24h' : '12h';
}

function normalizeDashboardFont(value) {
  return ['system', 'poppins', 'gloria', 'silkscreen'].includes(value) ? value : 'gloria';
}

function normalizeQuickLinksMax(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 6;
  return Math.min(9, Math.max(4, Math.round(numeric)));
}

const VALID_ENGINE_IDS = ['default', 'chatgpt', 'gemini', 'claude', 'perplexity', 'grok', 'deepseek'];

function normalizeSearchEngine(value) {
  return typeof value === 'string' && VALID_ENGINE_IDS.includes(value) ? value : 'default';
}

export const MAX_POMODORO_HISTORY = 30;

function isValidDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Normalizes a pomodoroHistory array: filters valid { date, count } records,
 * deduplicates by date (keeping the highest count), sorts newest-first,
 * and caps at MAX_POMODORO_HISTORY (30) entries.
 */
export function normalizePomodoroHistory(history) {
  if (!Array.isArray(history)) return [];
  const byDate = new Map();
  for (const item of history) {
    if (!item || !isValidDateString(item.date)) continue;
    const count = Number(item.count);
    if (!Number.isFinite(count) || count <= 0) continue;
    const normalizedCount = Math.floor(count);
    if (normalizedCount <= 0) continue;
    const existing = byDate.get(item.date) || 0;
    if (normalizedCount > existing) {
      byDate.set(item.date, normalizedCount);
    }
  }
  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_POMODORO_HISTORY);
}

/**
 * Archives a dailyStats record ({ date, count }) into a pomodoroHistory array
 * without duplicating dates, keeping only the latest 30 days.
 */
export function archiveDailyStatsToHistory(history, dailyStats) {
  const base = Array.isArray(history) ? [...history] : [];
  if (dailyStats && isValidDateString(dailyStats.date) && Number(dailyStats.count) > 0) {
    base.unshift({
      date: dailyStats.date,
      count: Math.floor(Number(dailyStats.count)),
    });
  }
  return normalizePomodoroHistory(base);
}

/**
 * Computes updated dailyStats and pomodoroHistory when a focus session finishes.
 * Archives stale dailyStats if from a previous day before starting today's count at 1.
 */
export function completePomodoroDaySession(dailyStats, history, today = new Date().toISOString().split('T')[0]) {
  let pomodoroHistory = normalizePomodoroHistory(history);
  let nextStats;
  if (dailyStats && dailyStats.date === today) {
    const currentCount = Number.isFinite(Number(dailyStats.count)) ? Math.max(0, Math.floor(Number(dailyStats.count))) : 0;
    nextStats = { date: today, count: currentCount + 1 };
  } else {
    if (dailyStats && isValidDateString(dailyStats.date) && Number(dailyStats.count) > 0) {
      pomodoroHistory = archiveDailyStatsToHistory(pomodoroHistory, dailyStats);
    }
    nextStats = { date: today, count: 1 };
  }
  return { dailyStats: nextStats, pomodoroHistory };
}

/**
 * Computes updated dailyStats and pomodoroHistory for the midnight dailyReset alarm.
 */
export function resetPomodoroDayStats(dailyStats, history, today = new Date().toISOString().split('T')[0]) {
  const pomodoroHistory = archiveDailyStatsToHistory(history, dailyStats);
  return {
    dailyStats: { date: today, count: 0 },
    pomodoroHistory,
  };
}

/**
 * Resolves timerState, dailyStats, and pomodoroHistory on extension install or update.
 * Preserves today's count on update; archives stale dailyStats if from a previous day.
 */
export function resolveInstalledPomodoroState(timerState, dailyStats, history, today = new Date().toISOString().split('T')[0]) {
  let pomodoroHistory = normalizePomodoroHistory(history);
  let nextDailyStats;
  if (dailyStats && typeof dailyStats === 'object' && dailyStats.date === today) {
    const currentCount = Number.isFinite(Number(dailyStats.count)) ? Math.max(0, Math.floor(Number(dailyStats.count))) : 0;
    nextDailyStats = { date: today, count: currentCount };
  } else {
    if (dailyStats && isValidDateString(dailyStats.date) && Number(dailyStats.count) > 0) {
      pomodoroHistory = archiveDailyStatsToHistory(pomodoroHistory, dailyStats);
    }
    nextDailyStats = { date: today, count: 0 };
  }
  const nextTimerState =
    timerState && typeof timerState === 'object' && typeof timerState.mode === 'string'
      ? timerState
      : { mode: 'pomodoro', isRunning: false, timeLeft: 1500, endTime: 0 };
  return {
    timerState: nextTimerState,
    dailyStats: nextDailyStats,
    pomodoroHistory,
  };
}

// ─── PART 2 — Store (chrome.storage.local) ──────────────────

export const Store = {

  // ── Quick Links ──────────────────────────────────────────

  /** Gets the quick links array from local storage. */
  async getLinks() {
    const result = await chrome.storage.local.get('quickLinks');
    return result.quickLinks || [];
  },

  /** Saves the quick links array to local storage. */
  async setLinks(links) {
    await chrome.storage.local.set({ quickLinks: links });
  },

  // ── Tasks ────────────────────────────────────────────────

  /** Gets the tasks array from local storage. */
  async getTasks() {
    const result = await chrome.storage.local.get('tasks');
    return result.tasks || [];
  },

  /** Saves the tasks array to local storage. */
  async setTasks(tasks) {
    await chrome.storage.local.set({ tasks });
  },

  // ── Search History ───────────────────────────────────────

  /** Gets the recent search query list from local storage. */
  async getSearchHistory() {
    const result = await chrome.storage.local.get('searchHistoryItems');
    return Array.isArray(result.searchHistoryItems) ? result.searchHistoryItems : [];
  },

  /** Saves the recent search query list to local storage. */
  async setSearchHistory(items) {
    const next = Array.isArray(items) ? items.filter((item) => typeof item === 'string' && item.trim()) : [];
    await chrome.storage.local.set({ searchHistoryItems: next.slice(0, 8) });
  },

  // ── Notes ────────────────────────────────────────────────

  /** Gets the array of note IDs from local storage. */
  async getNoteIds() {
    const result = await chrome.storage.local.get('noteIds');
    return result.noteIds || [];
  },

  /** Gets a single note object by ID, or null if not found. */
  async getNote(id) {
    const key = `note_${id}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  },

  /** Gets all notes by fetching IDs then batch-loading all note keys at once. */
  async getAllNotes() {
    const ids = await this.getNoteIds();
    if (!ids.length) return [];
    const keys = ids.map((id) => `note_${id}`);
    const result = await chrome.storage.local.get(keys);
    return keys.map((k) => result[k]).filter(Boolean);
  },

  /** Saves a note — prepends its ID to the index if new, then stores the note object in one operation. */
  async saveNote(note) {
    const ids = await this.getNoteIds();
    const update = { [`note_${note.id}`]: note };
    if (!ids.includes(note.id)) {
      ids.unshift(note.id);
      update.noteIds = ids;
    }
    await chrome.storage.local.set(update);
  },

  /** Deletes a note by removing its ID from the index and its data key concurrently. */
  async deleteNote(id) {
    const ids = await this.getNoteIds();
    const updated = ids.filter((i) => i !== id);
    await Promise.all([
      chrome.storage.local.set({ noteIds: updated }),
      chrome.storage.local.remove(`note_${id}`),
    ]);
  },

  // ── Pomodoro Timer ───────────────────────────────────────

  /** Gets the persisted timer state, or a default idle pomodoro state. */
  async getTimerState() {
    const result = await chrome.storage.local.get('timerState');
    return result.timerState || { mode: 'pomodoro', isRunning: false, timeLeft: 1500, endTime: 0 };
  },

  /** Saves the current timer state to local storage. */
  async setTimerState(state) {
    await chrome.storage.local.set({ timerState: state });
  },

  /** Gets today's pomodoro stats, archiving and resetting if the stored date doesn't match today. */
  async getDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(['dailyStats', 'pomodoroHistory']);
    const stored = result.dailyStats;
    if (!stored || stored.date !== today) {
      const nextStats = { date: today, count: 0 };
      if (stored && isValidDateString(stored.date) && Number(stored.count) > 0) {
        const pomodoroHistory = archiveDailyStatsToHistory(result.pomodoroHistory, stored);
        await chrome.storage.local.set({ dailyStats: nextStats, pomodoroHistory });
      }
      return nextStats;
    }
    return stored;
  },

  /** Saves the daily pomodoro stats object. */
  async setDailyStats(stats) {
    await chrome.storage.local.set({ dailyStats: stats });
  },

  /** Gets the archived pomodoro history array (latest 30 days max). */
  async getPomodoroHistory() {
    const result = await chrome.storage.local.get('pomodoroHistory');
    return normalizePomodoroHistory(result.pomodoroHistory);
  },

  /** Saves the pomodoro history array, normalized and capped at 30 days. */
  async setPomodoroHistory(history) {
    await chrome.storage.local.set({
      pomodoroHistory: normalizePomodoroHistory(history),
    });
  },

  // ── Clipboard History ────────────────────────────────────

  /** Gets the clipboard history array from local storage. */
  async getClipboard() {
    const result = await chrome.storage.local.get('clipboardItems');
    return result.clipboardItems || [];
  },

  /** Saves the clipboard history, capping at 20 items max. */
  async setClipboard(items) {
    await chrome.storage.local.set({ clipboardItems: items.slice(0, 20) });
  },

  // ── Saved Tab Groups ─────────────────────────────────────

  /** Gets the saved tab groups array from local storage. */
  async getTabGroups() {
    const result = await chrome.storage.local.get('savedTabGroups');
    return result.savedTabGroups || [];
  },

  /** Saves the tab groups array to local storage. */
  async setTabGroups(groups) {
    await chrome.storage.local.set({ savedTabGroups: groups });
  },

  // ── Generic Helpers ──────────────────────────────────────

  /** Gets any key from local storage with an optional fallback value. */
  async get(key, fallback = null) {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? fallback;
  },

  /** Sets any key/value pair in local storage. */
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },

  /** Listens for local storage changes and calls callback with flattened {key: newValue} pairs. */
  onChange(callback) {
    const handler = (changes) => {
      const flat = {};
      for (const key in changes) {
        flat[key] = changes[key].newValue;
      }
      callback(flat);
    };
    chrome.storage.local.onChanged.addListener(handler);
    return () => chrome.storage.local.onChanged.removeListener(handler);
  },
};
