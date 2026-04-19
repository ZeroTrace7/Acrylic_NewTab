import { Prefs } from './storage.js';
import { getGreeting } from './utils.js';
import { DOM } from './dom.js';

let tickInterval = null;
let tickTimeout = null;
let use24 = false;
let userName = '';

function is24HourFormat(format) {
  return format === '24h';
}

function updateClock() {
  const el = DOM.clock;
  if (!el) return;

  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');

  if (use24) {
    el.textContent = `${String(h).padStart(2, '0')}:${m}`;
  } else {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    el.innerHTML = `${h}:${m}<span class="clock-period">${period}</span>`;
  }
}

function updateGreeting(date) {
  const el = DOM.greeting;
  if (el) el.textContent = getGreeting(date, userName);
}

function updateDate(date) {
  const el = DOM.date;
  if (!el) return;

  el.textContent = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function tick() {
  const now = new Date();
  updateClock();
  updateGreeting(now);
  updateDate(now);
}

function startClockTimer() {
  const now = new Date();
  const delayToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  tickTimeout = setTimeout(() => {
    tick();
    tickInterval = setInterval(tick, 60000);
  }, delayToNextMinute);
}

export async function initClock() {
  let currentFormat = await Prefs.get('clockFormat');

  /* silent migration for legacy users */
  if (currentFormat === '24') {
    currentFormat = '24h';
    await Prefs.set('clockFormat', '24h');
  }

  use24 = is24HourFormat(currentFormat);
  userName = (await Prefs.get('userName')) || '';

  tick();
  startClockTimer();

  Prefs.onChange((changes) => {
    let needsTick = false;

    if (changes.clockFormat !== undefined) {
      use24 = is24HourFormat(changes.clockFormat);
      needsTick = true;
    }

    if (changes.userName !== undefined) {
      userName = changes.userName || '';
      needsTick = true;
    }

    if (needsTick) tick();
  });

  return () => {
    clearInterval(tickInterval);
    clearTimeout(tickTimeout);
  };
}
