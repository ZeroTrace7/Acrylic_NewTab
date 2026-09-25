import test from 'node:test';
import assert from 'node:assert';
import {
  MAX_POMODORO_HISTORY,
  normalizePomodoroHistory,
  archiveDailyStatsToHistory,
  completePomodoroDaySession,
  resetPomodoroDayStats,
  resolveInstalledPomodoroState,
  Store,
} from '../modules/storage.js';

test('pomodoroHistory - completion increments today count', () => {
  const today = '2026-09-25';
  const step1 = completePomodoroDaySession({ date: today, count: 0 }, [], today);
  assert.deepStrictEqual(step1.dailyStats, { date: today, count: 1 });
  assert.deepStrictEqual(step1.pomodoroHistory, []);

  const step2 = completePomodoroDaySession(step1.dailyStats, step1.pomodoroHistory, today);
  assert.deepStrictEqual(step2.dailyStats, { date: today, count: 2 });
  assert.deepStrictEqual(step2.pomodoroHistory, []);
});

test('pomodoroHistory - midnight reset archives yesterday and resets today', () => {
  const yesterdayStats = { date: '2026-09-25', count: 5 };
  const existingHistory = [{ date: '2026-09-24', count: 3 }];
  const result = resetPomodoroDayStats(yesterdayStats, existingHistory, '2026-09-26');

  assert.deepStrictEqual(result.dailyStats, { date: '2026-09-26', count: 0 });
  assert.deepStrictEqual(result.pomodoroHistory, [
    { date: '2026-09-25', count: 5 },
    { date: '2026-09-24', count: 3 },
  ]);
});

test('pomodoroHistory - never exceeds 30 entries and keeps latest 30 days', () => {
  assert.strictEqual(MAX_POMODORO_HISTORY, 30);

  let history = [];
  for (let day = 1; day <= 35; day++) {
    const mm = day <= 30 ? '09' : '10';
    const dd = String(day <= 30 ? day : day - 30).padStart(2, '0');
    const date = `2026-${mm}-${dd}`;
    history = archiveDailyStatsToHistory(history, { date, count: day });
  }

  assert.strictEqual(history.length, 30);
  assert.deepStrictEqual(history[0], { date: '2026-10-05', count: 35 });
  assert.deepStrictEqual(history[29], { date: '2026-09-06', count: 6 });
});

test('pomodoroHistory - repeated reset cannot duplicate a date', () => {
  const yesterdayStats = { date: '2026-09-25', count: 4 };
  const firstReset = resetPomodoroDayStats(yesterdayStats, [], '2026-09-26');
  const secondReset = resetPomodoroDayStats(firstReset.dailyStats, firstReset.pomodoroHistory, '2026-09-26');
  const duplicateInputReset = resetPomodoroDayStats(yesterdayStats, secondReset.pomodoroHistory, '2026-09-26');

  assert.deepStrictEqual(duplicateInputReset.pomodoroHistory, [
    { date: '2026-09-25', count: 4 },
  ]);

  // Higher count on same date updates in place without duplicating
  const updatedSameDay = archiveDailyStatsToHistory(duplicateInputReset.pomodoroHistory, {
    date: '2026-09-25',
    count: 7,
  });
  assert.deepStrictEqual(updatedSameDay, [{ date: '2026-09-25', count: 7 }]);
});

test('pomodoroHistory - extension reload/update preserves today count and active timer', () => {
  const today = '2026-09-25';
  const activeTimer = { mode: 'pomodoro', isRunning: true, timeLeft: 900, endTime: 1700000000000 };
  const todayStats = { date: today, count: 6 };
  const history = [{ date: '2026-09-24', count: 3 }];

  const resolved = resolveInstalledPomodoroState(activeTimer, todayStats, history, today);
  assert.deepStrictEqual(resolved.timerState, activeTimer);
  assert.deepStrictEqual(resolved.dailyStats, { date: today, count: 6 });
  assert.deepStrictEqual(resolved.pomodoroHistory, [{ date: '2026-09-24', count: 3 }]);
});

test('pomodoroHistory - stale dailyStats is archived rather than silently discarded', () => {
  const today = '2026-09-26';
  const staleStats = { date: '2026-09-24', count: 8 };

  // 1. Stale record encountered on session completion
  const onComplete = completePomodoroDaySession(staleStats, [], today);
  assert.deepStrictEqual(onComplete.dailyStats, { date: today, count: 1 });
  assert.deepStrictEqual(onComplete.pomodoroHistory, [{ date: '2026-09-24', count: 8 }]);

  // 2. Stale record encountered on extension update/install
  const onInstall = resolveInstalledPomodoroState(null, staleStats, [], today);
  assert.deepStrictEqual(onInstall.dailyStats, { date: today, count: 0 });
  assert.deepStrictEqual(onInstall.pomodoroHistory, [{ date: '2026-09-24', count: 8 }]);
});

test('pomodoroHistory - Store.getDailyStats archives stale record and preserves UI contract', async () => {
  const today = new Date().toISOString().split('T')[0];
  const mockStore = {
    dailyStats: { date: '2026-01-15', count: 5 },
    pomodoroHistory: [{ date: '2026-01-14', count: 2 }],
  };

  const prevChrome = globalThis.chrome;
  globalThis.chrome = {
    storage: {
      local: {
        async get(keys) {
          if (typeof keys === 'string') return { [keys]: mockStore[keys] };
          if (Array.isArray(keys)) {
            const out = {};
            for (const k of keys) out[k] = mockStore[k];
            return out;
          }
          return { ...mockStore };
        },
        async set(obj) {
          Object.assign(mockStore, obj);
        },
      },
    },
  };

  try {
    const stats = await Store.getDailyStats();
    assert.deepStrictEqual(stats, { date: today, count: 0 });
    assert.deepStrictEqual(mockStore.dailyStats, { date: today, count: 0 });

    const history = await Store.getPomodoroHistory();
    assert.deepStrictEqual(history, [
      { date: '2026-01-15', count: 5 },
      { date: '2026-01-14', count: 2 },
    ]);
  } finally {
    globalThis.chrome = prevChrome;
  }
});
