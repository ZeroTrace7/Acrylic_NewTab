import { Store } from '../modules/storage.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let tickInterval = null;
let state = null;
let dailyCount = 0;

const MODES = { pomodoro: 1500, shortBreak: 300, longBreak: 3600 };
const CIRC = 263.9;

async function sendTimerCommand(message) {
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (response?.status === 'error') {
      console.warn('Pomodoro command rejected:', message?.command, response.message);
      toast.error('Timer sync failed. Please try again.');
    }
  } catch (error) {
    console.warn('Pomodoro command failed:', message?.command, error);
    toast.error('Timer sync failed. Please try again.');
  }
}

function normalizeTimerState(nextState) {
  if (!nextState || typeof nextState !== 'object') {
    return { mode: 'pomodoro', isRunning: false, timeLeft: MODES.pomodoro, endTime: 0 };
  }

  const mode = nextState.mode in MODES ? nextState.mode : 'pomodoro';
  const isRunning = nextState.isRunning === true;
  const endTime = Number.isFinite(nextState.endTime) ? nextState.endTime : 0;
  const fullDuration = MODES[mode];

  let timeLeft = Number.isFinite(nextState.timeLeft) ? nextState.timeLeft : fullDuration;
  if (!isRunning && endTime === 0 && timeLeft !== fullDuration) {
    timeLeft = fullDuration;
  }

  return { mode, isRunning, timeLeft, endTime };
}

async function syncNormalizedState() {
  const normalized = normalizeTimerState(state);
  const changed =
    normalized.mode !== state.mode ||
    normalized.isRunning !== state.isRunning ||
    normalized.timeLeft !== state.timeLeft ||
    normalized.endTime !== state.endTime;

  state = normalized;
  if (changed) {
    await Store.setTimerState(normalized);
  }
}

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

function createStatsSection() {
  const statsDiv = document.createElement('div');
  statsDiv.className = 'qt-title';
  statsDiv.style.textAlign = 'left';
  statsDiv.style.display = 'flex';
  statsDiv.style.alignItems = 'center';
  statsDiv.style.gap = '4px';
  statsDiv.style.flexShrink = '0';
  statsDiv.innerHTML = `<span style="font-size:1.0rem">🍅</span> <span style="font-size:1.0rem; font-weight:600; display:inline-block; transform:translateY(2px);">${dailyCount}</span>`;
  return statsDiv;
}

function createTimerWrapper() {
  const timerWrapper = document.createElement('div');
  timerWrapper.className = 'qt-flex-center';
  timerWrapper.style.position = 'relative'; 
  timerWrapper.style.width = '100%';
  timerWrapper.style.minHeight = '172px';
  timerWrapper.innerHTML = `
    <!-- The Ring -->
    <svg width="188" height="188" viewBox="0 0 100 100" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--glass-subtle)" stroke-width="4"/>
      <circle id="pomo-ring" cx="50" cy="50" r="44" fill="none" stroke="${getModeColor()}" stroke-width="4"
        stroke-linecap="round" transform="rotate(-90 50 50)"
        stroke-dasharray="${CIRC * (44 / 42)}" stroke-dashoffset="${(CIRC * (44 / 42)) - ((CIRC * (44 / 42)) * getProgress() / 100)}"
        style="transition:stroke-dashoffset 0.4s ease"/>
    </svg>
    <!-- Overlay Text (Fixes SVG clipping limits) -->
    <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <div id="pomo-time" style="font-family:var(--font-ui),sans-serif;font-size:3rem;font-weight:700;color:var(--text-primary);letter-spacing:1px;line-height:1.2;">${formatTime(state.timeLeft)}</div>
      <div class="qt-muted" style="text-transform:capitalize;margin-top:2px;font-size:0.75rem;">${state.isRunning ? 'Focusing...' : 'Ready For Focus'}</div>
    </div>
  `;
  return timerWrapper;
}

function createControlsRow() {
  const controlsRow = document.createElement('div');
  controlsRow.className = 'qt-flex-center qt-gap-md';

  const running = state.isRunning;
  const full = state.timeLeft === MODES[state.mode];

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'qt-icon-btn';
  toggleBtn.style.width = '40px';
  toggleBtn.style.height = '40px';
  toggleBtn.style.borderRadius = '50%';
  toggleBtn.style.background = 'var(--glass-bg)';
  toggleBtn.style.color = 'var(--text-primary)';
  toggleBtn.innerHTML = running
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
  toggleBtn.onclick = toggleTimer;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'qt-icon-btn';
  resetBtn.style.width = '36px';
  resetBtn.style.height = '36px';
  resetBtn.style.borderRadius = '50%';
  resetBtn.disabled = !running && full;
  resetBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
  resetBtn.onclick = resetTimer;

  controlsRow.append(toggleBtn, resetBtn);
  return controlsRow;
}

function createMiddleGroup() {
  const middleGroup = document.createElement('div');
  middleGroup.style.flex = '1 1 auto';
  middleGroup.style.minHeight = '0';
  middleGroup.style.display = 'flex';
  middleGroup.style.flexDirection = 'column';
  middleGroup.style.alignItems = 'center';
  middleGroup.style.justifyContent = 'center';
  middleGroup.style.gap = '16px';

  middleGroup.appendChild(createTimerWrapper());
  middleGroup.appendChild(createControlsRow());
  
  return middleGroup;
}

function createModeRow() {
  const modeRow = document.createElement('div');
  modeRow.className = 'qt-flex qt-gap-sm';
  modeRow.style.marginTop = '0';
  modeRow.style.paddingTop = '4px';
  modeRow.style.flexShrink = '0';
  ['pomodoro', 'shortBreak', 'longBreak'].forEach(m => {
    const active = state.mode === m;
    const label = m === 'pomodoro' ? 'Pomodoro' : m === 'shortBreak' ? 'Short Break' : 'Long Break';
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = `qt-btn ${active ? 'qt-btn-primary' : ''}`;
    btn.style.flex = '1';
    btn.style.padding = '8px 0';
    if (state.isRunning) btn.disabled = true;
    btn.onclick = () => changeMode(m);
    modeRow.appendChild(btn);
  });
  return modeRow;
}

function render() {
  if (!containerEl) return;

  containerEl.innerHTML = '';
  
  containerEl.style.display = 'flex';
  containerEl.style.flexDirection = 'column';
  containerEl.style.justifyContent = 'space-between';
  containerEl.style.minHeight = '100%';
  containerEl.style.boxSizing = 'border-box';
  containerEl.style.gap = '18px';

  containerEl.appendChild(createStatsSection());
  containerEl.appendChild(createMiddleGroup());
  containerEl.appendChild(createModeRow());
}

function updateDisplay() {
  const timeEl = containerEl?.querySelector('#pomo-time');
  const ring = containerEl?.querySelector('#pomo-ring');
  if (timeEl) timeEl.textContent = formatTime(state.timeLeft);
  if (ring) ring.setAttribute('stroke-dashoffset', String((CIRC * (44 / 42)) - ((CIRC * (44 / 42)) * getProgress() / 100)));
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
  void sendTimerCommand({ command: 'resetTimer', mode: modeId });
  state = { mode: modeId, isRunning: false, timeLeft: MODES[modeId], endTime: 0 };
  render();
}

function toggleTimer() {
  if (state.isRunning) {
    void sendTimerCommand({ command: 'pauseTimer', timerState: state });
    state.isRunning = false;
    clearInterval(tickInterval);
  } else {
    const cmd = state.timeLeft === MODES[state.mode]
      ? { command: 'startTimer', mode: state.mode }
      : { command: 'resumeTimer', timerState: state };
    void sendTimerCommand(cmd);
    state.isRunning = true;
    state.endTime = Date.now() + state.timeLeft * 1000;
    startLocalTick();
  }
  render();
}

function resetTimer() {
  if (!state.isRunning && state.timeLeft === MODES[state.mode]) return;
  clearInterval(tickInterval);
  void sendTimerCommand({ command: 'resetTimer', mode: state.mode });
  state.isRunning = false;
  state.timeLeft = MODES[state.mode];
  state.endTime = 0;
  render();
}

export async function initPomodoro(container) {
  containerEl = container;
  state = await Store.getTimerState();
  await syncNormalizedState();
  const stats = await Store.getDailyStats();
  dailyCount = stats.count || 0;

  if (state.isRunning) {
    state.timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
    startLocalTick();
  }
  render();

  const unsubStore = Store.onChange((changes) => {
    if ('timerState' in changes) {
      state = normalizeTimerState(changes.timerState);
      clearInterval(tickInterval);
      if (state.isRunning) {
        state.timeLeft = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
        startLocalTick();
      } else if (changes.timerState?.timeLeft !== state.timeLeft || changes.timerState?.mode !== state.mode) {
        Store.setTimerState(state).catch((error) => {
          console.warn('Failed to normalize timer state:', error);
        });
      }
      render();
    }
    if ('dailyStats' in changes) {
      dailyCount = changes.dailyStats?.count || 0;
      render();
    }
  });

  return () => {
    clearInterval(tickInterval);
    if (typeof unsubStore === 'function') unsubStore();
  };
}


