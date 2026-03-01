import { Store } from '../modules/storage.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let tickInterval = null;
let state = null;
let dailyCount = 0;

const MODES = { pomodoro: 1500, shortBreak: 300, longBreak: 900 };
const CIRC = 263.9;

function formatTime(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function getProgress() {
  return ((MODES[state.mode] - state.timeLeft) / MODES[state.mode]) * 100;
}

function getModeColor() {
  if (state.mode === 'pomodoro') return 'rgba(248, 113, 113, 0.9)';
  if (state.mode === 'shortBreak') return 'rgba(52, 211, 153, 0.9)';
  return 'rgba(96, 165, 250, 0.9)';
}

function render() {
  if (!containerEl) return;
  const running = state.isRunning;
  const full = state.timeLeft === MODES[state.mode];

  containerEl.innerHTML = `
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      ${['pomodoro','shortBreak','longBreak'].map(m => {
        const active = state.mode === m;
        const label = m === 'pomodoro' ? 'Pomodoro' : m === 'shortBreak' ? 'Short Break' : 'Long Break';
        return `<button data-mode="${m}" style="padding:6px 0;border-radius:10px;font-size:0.75rem;font-weight:500;flex:1;cursor:${running?'not-allowed':'pointer'};transition:all 150ms ease;
          background:${active?'var(--glass-bg)':'transparent'};color:${active?'var(--text-primary)':'var(--text-muted)'};
          border:1px solid ${active?'var(--glass-border-soft)':'transparent'};${running?'opacity:0.4;':''}"
          ${running?'disabled':''}>${label}</button>`;
      }).join('')}
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;">
      <svg width="180" height="180" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
        <circle id="pomo-ring" cx="50" cy="50" r="42" fill="none" stroke="${getModeColor()}" stroke-width="4"
          stroke-linecap="round" transform="rotate(-90 50 50)"
          stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC - (CIRC * getProgress() / 100)}"
          style="transition:stroke-dashoffset 0.4s ease"/>
        <foreignObject x="10" y="25" width="80" height="50">
          <div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;">
            <div id="pomo-time" style="font-family:var(--font-mono),monospace;font-size:2rem;font-weight:700;color:var(--text-primary);">${formatTime(state.timeLeft)}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:capitalize;">${state.mode.replace(/([A-Z])/g,' $1')}</div>
          </div>
        </foreignObject>
      </svg>
    </div>
    <div style="display:flex;justify-content:center;gap:12px;">
      <button id="pomo-toggle" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        background:var(--glass-bg);border:1px solid var(--glass-border-soft);color:var(--text-primary);cursor:pointer;transition:all 150ms ease;">
        ${running
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>'}
      </button>
      <button id="pomo-reset" style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        background:var(--glass-subtle);border:1px solid var(--glass-border-soft);color:var(--text-secondary);cursor:pointer;transition:all 150ms ease;
        ${!running && full ? 'opacity:0.3;cursor:not-allowed;' : ''}"
        ${!running && full ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
    </div>
    <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:8px;">🍅 ${dailyCount} today</div>`;

  containerEl.querySelectorAll('[data-mode]').forEach(btn => {
    btn.onclick = () => changeMode(btn.dataset.mode);
  });
  containerEl.querySelector('#pomo-toggle').onclick = toggleTimer;
  containerEl.querySelector('#pomo-reset').onclick = resetTimer;
}

function updateDisplay() {
  const timeEl = containerEl?.querySelector('#pomo-time');
  const ring = containerEl?.querySelector('#pomo-ring');
  if (timeEl) timeEl.textContent = formatTime(state.timeLeft);
  if (ring) ring.setAttribute('stroke-dashoffset', String(CIRC - (CIRC * getProgress() / 100)));
}

function startLocalTick() {
  clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    if (state.isRunning && state.timeLeft > 0) {
      state.timeLeft--;
      updateDisplay();
    } else if (state.timeLeft <= 0) {
      clearInterval(tickInterval);
      state.isRunning = false;
    }
  }, 1000);
}

function changeMode(modeId) {
  if (state.isRunning) return;
  try { chrome.runtime.sendMessage({ command: 'resetTimer', mode: modeId }); } catch {}
  state = { mode: modeId, isRunning: false, timeLeft: MODES[modeId], endTime: 0 };
  render();
}

function toggleTimer() {
  if (state.isRunning) {
    try { chrome.runtime.sendMessage({ command: 'pauseTimer', timerState: state }); } catch {}
    state.isRunning = false;
    clearInterval(tickInterval);
  } else {
    const cmd = state.timeLeft === MODES[state.mode]
      ? { command: 'startTimer', mode: state.mode }
      : { command: 'resumeTimer', timerState: state };
    try { chrome.runtime.sendMessage(cmd); } catch {}
    state.isRunning = true;
    state.endTime = Date.now() + state.timeLeft * 1000;
    startLocalTick();
  }
  render();
}

function resetTimer() {
  if (!state.isRunning && state.timeLeft === MODES[state.mode]) return;
  clearInterval(tickInterval);
  try { chrome.runtime.sendMessage({ command: 'resetTimer', mode: state.mode }); } catch {}
  state.isRunning = false;
  state.timeLeft = MODES[state.mode];
  state.endTime = 0;
  render();
}

export async function initPomodoro(container) {
  containerEl = container;
  state = await Store.getTimerState();
  const stats = await Store.getDailyStats();
  dailyCount = stats.count || 0;

  if (state.isRunning) {
    state.timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
    startLocalTick();
  }
  render();

  Store.onChange((changes) => {
    if ('timerState' in changes) {
      state = changes.timerState;
      clearInterval(tickInterval);
      if (state.isRunning) {
        state.timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
        startLocalTick();
      }
      render();
    }
    if ('dailyStats' in changes) {
      dailyCount = changes.dailyStats?.count || 0;
      render();
    }
  });

  return () => clearInterval(tickInterval);
}


