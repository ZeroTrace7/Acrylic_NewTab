/* Acrylic — background.js (service worker) */

const TODAY = () => new Date().toISOString().split('T')[0];

const MODE_DURATION = {
  pomodoro:   25 * 60,
  shortBreak:  5 * 60,
  longBreak:  60 * 60,
};

const YOUTUBE_REFERER_RULE_ID = 4101;

async function syncYouTubeEmbedRefererRule() {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) return;

  // declarativeNetRequestWithHostAccess is an optional permission — skip if not granted
  try {
    const hasPermission = await chrome.permissions.contains({
      permissions: ['declarativeNetRequestWithHostAccess'],
      origins: [
        'https://youtube.com/*',
        'https://www.youtube.com/*',
        'https://youtube-nocookie.com/*',
        'https://www.youtube-nocookie.com/*',
      ],
    });
    if (!hasPermission) return;
  } catch { return; }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [YOUTUBE_REFERER_RULE_ID],
    addRules: [
      {
        id: YOUTUBE_REFERER_RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'referer',
              operation: 'set',
              value: 'https://www.youtube.com/',
            },
          ],
        },
        condition: {
          initiatorDomains: [chrome.runtime.id],
          requestDomains: ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'],
          resourceTypes: ['sub_frame'],
        },
      },
    ],
  });
}

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
    chrome.runtime.sendMessage({ type: 'PLAY_SOUND', source }).catch((err) => {
      console.warn('PLAY_SOUND message failed:', err);
    });
  } catch (err) { console.warn('playSound failed:', err); }
}

function respondWith(promise, respond, label) {
  promise
    .then((state) => respond({ status: 'ok', state }))
    .catch((error) => {
      console.error(`${label} failed:`, error);
      respond({
        status: 'error',
        message: error?.message || `${label} failed`,
      });
    });
}

async function startTimer(mode) {
  const duration = MODE_DURATION[mode];
  await chrome.alarms.clear('pomodoroTimer');
  await chrome.alarms.create('pomodoroTimer', { delayInMinutes: duration / 60 });
  const state = { mode, isRunning: true, timeLeft: duration, endTime: Date.now() + duration * 1000 };
  await chrome.storage.local.set({ timerState: state });
  await playSound('sounds/start.mp3');
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
  await playSound('sounds/start.mp3');
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
  if (msg.command === 'startTimer') {
    respondWith(startTimer(msg.mode), respond, 'startTimer');
    return true;
  }
  if (msg.command === 'pauseTimer') {
    respondWith(pauseTimer(msg.timerState), respond, 'pauseTimer');
    return true;
  }
  if (msg.command === 'resumeTimer') {
    respondWith(resumeTimer(msg.timerState), respond, 'resumeTimer');
    return true;
  }
  if (msg.command === 'resetTimer') {
    respondWith(resetTimer(msg.mode), respond, 'resetTimer');
    return true;
  }

  if (msg.command === 'syncYouTubeRule') {
    syncYouTubeEmbedRefererRule()
      .then(() => respond({ status: 'ok' }))
      .catch((error) => respond({ status: 'error', message: error?.message || 'syncYouTubeRule failed' }));
    return true;
  }
  return false;
});

// ── Notification button click ───────────────────────────────

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  if (btnIndex === 0 && notifId in MODE_DURATION) {
    startTimer(notifId).catch((err) => console.error('Notification startTimer failed:', err));
  }
  chrome.notifications.clear(notifId);
});

// ── Install handler ─────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await syncYouTubeEmbedRefererRule();
    await chrome.storage.local.set({
      timerState: { mode: 'pomodoro', isRunning: false, timeLeft: 1500, endTime: 0 },
      dailyStats: { date: TODAY(), count: 0 },
    });
    await chrome.alarms.create('dailyReset', { when: new Date().setHours(24, 0, 0, 0), periodInMinutes: 1440 });
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({ id: 'addToNotes', title: 'Save to Acrylic Notes', contexts: ['selection'] });
    // Uninstall feedback URL — will be added in v1.1 with a real feedback form
  } catch (err) { console.error('Install handler error:', err); }
});

chrome.runtime.onStartup.addListener(() => {
  syncYouTubeEmbedRefererRule().catch((err) => console.error('YouTube embed rule sync error:', err));
});

syncYouTubeEmbedRefererRule().catch((err) => console.error('Initial YouTube embed rule sync error:', err));

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
