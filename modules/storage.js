/* ============================================================
   ACRYLIC — modules/storage.js
   Unified storage abstraction: Prefs (sync) + Store (local)
   ============================================================ */

// ─── PART 1 — Prefs (chrome.storage.sync) ───────────────────

export const Prefs = {
  defaults: {
    theme:           'midnight',
    wallpaperUrl:    '',
    wallpaperBlur:   0,
    wallpaperDarken: 0.45,
    grainOpacity:    0.035,
    userName:        '',
    searchEngine:    'browser',
    clockFormat:     '12h',
    quickLinksMax:   12,
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
    return merged;
  },

  /** Sets a single preference by key. */
  async set(key, value) {
    if (key === 'clockFormat') {
      await chrome.storage.sync.set({ [key]: normalizeClockFormat(value) });
      return;
    }
    await chrome.storage.sync.set({ [key]: value });
  },

  /** Sets multiple preferences at once. */
  async setMany(obj) {
    const next = { ...obj };
    if ('clockFormat' in next) next.clockFormat = normalizeClockFormat(next.clockFormat);
    await chrome.storage.sync.set(next);
  },

  /** Listens for sync storage changes and calls callback with flattened {key: newValue} pairs. */
  onChange(callback) {
    chrome.storage.sync.onChanged.addListener((changes) => {
      const flat = {};
      for (const key in changes) {
        flat[key] = changes[key].newValue;
      }
      callback(flat);
    });
  },
};

function normalizeClockFormat(value) {
  return value === '24h' ? '24h' : '12h';
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

  /** Saves a note — prepends its ID to the index if new, then stores the note object. */
  async saveNote(note) {
    const ids = await this.getNoteIds();
    if (!ids.includes(note.id)) {
      ids.unshift(note.id);
      await chrome.storage.local.set({ noteIds: ids });
    }
    await chrome.storage.local.set({ [`note_${note.id}`]: note });
  },

  /** Deletes a note by removing its ID from the index and its data key from storage. */
  async deleteNote(id) {
    const ids = await this.getNoteIds();
    const updated = ids.filter((i) => i !== id);
    await chrome.storage.local.set({ noteIds: updated });
    await chrome.storage.local.remove(`note_${id}`);
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

  /** Gets today's pomodoro stats, resetting if the stored date doesn't match today. */
  async getDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get('dailyStats');
    if (!result.dailyStats || result.dailyStats.date !== today) {
      return { date: today, count: 0 };
    }
    return result.dailyStats;
  },

  /** Saves the daily pomodoro stats object. */
  async setDailyStats(stats) {
    await chrome.storage.local.set({ dailyStats: stats });
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
    chrome.storage.local.onChanged.addListener((changes) => {
      const flat = {};
      for (const key in changes) {
        flat[key] = changes[key].newValue;
      }
      callback(flat);
    });
  },
};
