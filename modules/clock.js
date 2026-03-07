import { Prefs } from './storage.js';
import { getGreeting, formatDate } from './utils.js';

let tickInterval = null;
let use24 = false;
let userName = '';

function updateClock() {
  const el = document.getElementById('simple-clock');
  if (!el) return;

  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  if (use24) {
    el.textContent = `${String(h).padStart(2, '0')}:${m}:${s}`;
  } else {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    el.innerHTML = `${h}:${m} <span class="clock-period">${period}</span>`;
  }
}

function updateGreeting(date) {
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = getGreeting(date, userName);
}

function updateDate(date) {
  const el = document.getElementById('date-text');
  if (el) el.textContent = formatDate(date);
}

function tick() {
  const now = new Date();
  updateClock();
  updateGreeting(now);
  updateDate(now);
}

export async function initClock() {
  const prefs = await Prefs.getAll();
  use24 = prefs.clockFormat === '24';
  userName = prefs.userName || '';

  tick();
  tickInterval = setInterval(tick, 1000);

  Prefs.onChange((changes) => {
    if (changes.clockFormat !== undefined) use24 = changes.clockFormat === '24';
    if (changes.userName !== undefined) userName = changes.userName;
  });

  return () => clearInterval(tickInterval);
}
