import { Prefs } from './storage.js';
import { getGreeting, formatDate } from './utils.js';

let prevDigits = ['', '', '', '', '', ''];
let use24 = false;
let showSeconds = true;
let userName = '';
let tickInterval = null;

const ids = [
  ['fh1-top', 'fh1-bot'],
  ['fh2-top', 'fh2-bot'],
  ['fm1-top', 'fm1-bot'],
  ['fm2-top', 'fm2-bot'],
  ['fs1-top', 'fs1-bot'],
  ['fs2-top', 'fs2-bot'],
];

function getDigits(date) {
  let h = use24 ? date.getHours() : (date.getHours() % 12 || 12);
  const hh = h.toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return [hh[0], hh[1], mm[0], mm[1], ss[0], ss[1]];
}

function animateDigit(index, newVal) {
  const topEl = document.getElementById(ids[index][0]);
  const botEl = document.getElementById(ids[index][1]);
  if (!topEl || !botEl) return;

  botEl.textContent = newVal;
  topEl.classList.add('flipping');
  botEl.classList.add('flipping');

  setTimeout(() => {
    topEl.classList.remove('flipping');
    botEl.classList.remove('flipping');
    topEl.textContent = newVal;
  }, 480);
}

function tick() {
  const now = new Date();
  const digits = getDigits(now);
  for (let i = 0; i < 6; i++) {
    if (digits[i] !== prevDigits[i]) animateDigit(i, digits[i]);
  }
  prevDigits = digits;
  updateGreeting(now);
  updateDate(now);
}

function updateGreeting(date) {
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = getGreeting(date, userName);
}

function updateDate(date) {
  const el = document.getElementById('date-text');
  if (el) el.textContent = formatDate(date);
}

function setShowSeconds(show) {
  const s1 = document.getElementById('flip-s1');
  const s2 = document.getElementById('flip-s2');
  const dividers = document.querySelectorAll('.flip-divider');

  const display = show ? '' : 'none';
  if (s1) s1.style.display = display;
  if (s2) s2.style.display = display;
  if (dividers[1]) dividers[1].style.display = display;
}

/** Initializes the flip clock, greeting, and date — returns a cleanup function. */
export async function initClock() {
  const prefs = await Prefs.getAll();
  use24 = prefs.clockFormat === '24';
  showSeconds = prefs.showSeconds;
  userName = prefs.userName;

  setShowSeconds(showSeconds);
  tick();
  tickInterval = setInterval(tick, 1000);

  Prefs.onChange((changes) => {
    if ('clockFormat' in changes) use24 = changes.clockFormat === '24';
    if ('userName' in changes) userName = changes.userName;
    if ('showSeconds' in changes) {
      showSeconds = changes.showSeconds;
      setShowSeconds(showSeconds);
    }
  });

  return () => clearInterval(tickInterval);
}
