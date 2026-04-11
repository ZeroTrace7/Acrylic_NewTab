/* Acrylic — background.js (service worker) */

const TODAY = () => new Date().toISOString().split('T')[0];

const MODE_DURATION = {
  pomodoro:   25 * 60,
  shortBreak:  5 * 60,
  longBreak:  60 * 60,
};

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: 'Pomodoro timer sounds',
  });
}

async function playSound(source) {
  try {
    await ensureOffscreen();
    chrome.runtime.sendMessage({ type: 'PLAY_SOUND', source }).catch(() => {});
  } catch (err) { console.warn('playSound failed:', err); }
}

async function startTimer(mode) {
  const duration = MODE_DURATION[mode];
  await chrome.alarms.clear('pomodoroTimer');
  await chrome.alarms.create('pomodoroTimer', { delayInMinutes: duration / 60 });
  const state = { mode, isRunning: true, timeLeft: duration, endTime: Date.now() + duration * 1000 };
  await chrome.storage.local.set({ timerState: state });
  return state;
}

async function pauseTimer(timerState) {
  await chrome.alarms.clear('pomodoroTimer');
  const remaining = Math.max(0, Math.floor((timerState.endTime - Date.now()) / 1000));
  const state = { ...timerState, isRunning: false, timeLeft: remaining, endTime: 0 };
  await chrome.storage.local.set({ timerState: state });
  return state;
}

async function resumeTimer(timerState) {
  await chrome.alarms.create('pomodoroTimer', { delayInMinutes: timerState.timeLeft / 60 });
  const state = { ...timerState, isRunning: true, endTime: Date.now() + timerState.timeLeft * 1000 };
  await chrome.storage.local.set({ timerState: state });
  return state;
}

async function resetTimer(mode) {
  await chrome.alarms.clear('pomodoroTimer');
  const state = { mode, isRunning: false, timeLeft: MODE_DURATION[mode], endTime: 0 };
  await chrome.storage.local.set({ timerState: state });
  return state;
}

// ── Alarm listener ──────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'pomodoroTimer') {
      await playSound('sounds/end.mp3');
      const { timerState } = await chrome.storage.local.get('timerState');
      if (!timerState || !timerState.isRunning) return;

      let nextMode, title, message;

      if (timerState.mode === 'pomodoro') {
        const { dailyStats } = await chrome.storage.local.get('dailyStats');
        const stats = (dailyStats && dailyStats.date === TODAY()) ? dailyStats : { date: TODAY(), count: 0 };
        stats.count++;
        await chrome.storage.local.set({ dailyStats: stats });
        nextMode = stats.count % 4 === 0 ? 'longBreak' : 'shortBreak';
        title = 'Session Done!';
        message = 'Great focus. Time for a break!';
      } else {
        nextMode = 'pomodoro';
        title = "Break's Over!";
        message = 'Time to get back to focus!';
      }

      await chrome.storage.local.set({
        timerState: { mode: nextMode, isRunning: false, timeLeft: MODE_DURATION[nextMode], endTime: 0 },
      });

      chrome.notifications.create(nextMode, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title,
        message,
        buttons: [{ title: nextMode === 'pomodoro' ? 'Start Focus' : 'Start Break' }],
        priority: 2,
      });
    }

    if (alarm.name === 'dailyReset') {
      await chrome.storage.local.set({ dailyStats: { date: TODAY(), count: 0 } });
    }
  } catch (err) { console.error('Alarm handler error:', err); }
});

// ── Message listener ────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.command === 'startTimer')  { startTimer(msg.mode).then(s => respond({ status: 'ok', state: s })); return true; }
  if (msg.command === 'pauseTimer')  { pauseTimer(msg.timerState).then(s => respond({ status: 'ok', state: s })); return true; }
  if (msg.command === 'resumeTimer') { resumeTimer(msg.timerState).then(s => respond({ status: 'ok', state: s })); return true; }
  if (msg.command === 'resetTimer')  { resetTimer(msg.mode).then(s => respond({ status: 'ok', state: s })); return true; }
  if (msg.type === 'GET_TABS') { chrome.tabs.query({ currentWindow: true }, tabs => respond(tabs)); return true; }
  if (msg.type === 'CREATE_TAB') { chrome.tabs.create({ url: msg.url }); return false; }
  return false;
});

// ── Notification button click ───────────────────────────────

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  if (btnIndex === 0 && notifId in MODE_DURATION) startTimer(notifId);
  chrome.notifications.clear(notifId);
});

// ── Install handler ─────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    console.log('Acrylic extension installed');
    await chrome.storage.local.set({
      timerState: { mode: 'pomodoro', isRunning: false, timeLeft: 1500, endTime: 0 },
      dailyStats: { date: TODAY(), count: 0 },
    });
    await chrome.alarms.create('dailyReset', { when: new Date().setHours(24, 0, 0, 0), periodInMinutes: 1440 });
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({ id: 'addToNotes', title: 'Save to Acrylic Notes', contexts: ['selection'] });
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      chrome.runtime.setUninstallURL('https://example.com/uninstall');
    }
  } catch (err) { console.error('Install handler error:', err); }
});

// ── Context menu click ──────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'addToNotes' && info.selectionText) {
      const id = 'note_' + Date.now();
      const note = {
        id,
        title: (tab.title || info.selectionText).slice(0, 50),
        content: info.selectionText.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { noteIds = [] } = await chrome.storage.local.get('noteIds');
      noteIds.unshift(id);
      await chrome.storage.local.set({ noteIds, [`note_${id}`]: note });
    }
  } catch (err) { console.error('Context menu error:', err); }
});

