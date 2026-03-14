import { Prefs } from './storage.js';
import { getGreeting } from './utils.js';

let tickInterval = null;
let tickTimeout = null;
let use24 = false;
let userName = '';

function is24HourFormat(format) {
  return format === '24' || format === '24h';
}

function updateClock() {
  const el = document.getElementById('simple-clock');
  if (!el) return;

  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');

  if (use24) {
    el.textContent = `${String(h).padStart(2, '0')}:${m}`;
  } else {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    el.innerHTML = `${h}:${m}<span class="clock-period" style="font-family:'Gloria Hallelujah',cursive;font-weight:700;font-size:0.45em;margin-left:0.2em;vertical-align:baseline;">${period}</span>`;
  }
}

function updateGreeting(date) {
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = getGreeting(date, userName);
}

function updateDate(date) {
  const el = document.getElementById('date-text');
  if (!el) return;

  el.textContent = date.toLocaleDateString('en-US', {
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
  const prefs = await Prefs.getAll();
  use24 = is24HourFormat(prefs.clockFormat);
  userName = prefs.userName || '';

  tick();
  startClockTimer();

  Prefs.onChange((changes) => {
    if (changes.clockFormat !== undefined) use24 = is24HourFormat(changes.clockFormat);
    if (changes.userName !== undefined) userName = changes.userName;
  });

  return () => {
    clearInterval(tickInterval);
    clearTimeout(tickTimeout);
  };
}
