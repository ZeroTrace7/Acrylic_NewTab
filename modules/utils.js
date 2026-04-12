/** Returns a debounced version of fn that delays invocation until after delay ms since the last call. */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Returns a throttled version of fn that invokes at most once per limit ms. */
export function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (inThrottle) return;
    fn(...args);
    inThrottle = true;
    setTimeout(() => (inThrottle = false), limit);
  };
}

/** Returns a unique string ID based on timestamp and random characters. */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Formats a Date object into a human-readable string like "Monday, January 6". */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/** Formats a Date object into a zero-padded "HH:MM" string in 12-hour or 24-hour format. */
export function formatTime(date, use24 = false) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  if (!use24) {
    hours = hours % 12 || 12;
  }
  return hours.toString().padStart(2, '0') + ':' + minutes;
}

/** Returns a greeting string based on the hour of the given Date, optionally appending a name. */
export function getGreeting(date, name = '') {
  const hour = date.getHours();
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  if (name && name.trim()) greeting += `, ${name.trim()}`;
  return greeting;
}

/** Extracts and returns the hostname from a URL string, or empty string on failure. */
export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** Derives a user-friendly name from a URL. */
export function getFriendlyName(url) {
  const safeUrl = sanitizeUrl(url);
  const domain = getDomain(safeUrl).replace(/^www\./i, '');
  if (!domain) return '';
  const parts = domain.split('.');
  if (parts.length === 0) return '';
  let word = parts.length > 2 ? parts[1] : parts[0];
  if (parts.length > 2 && parts[0].length > parts[1].length) {
    word = parts[0];
  }
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Trims and prepends https:// to a URL string if it doesn't already have a protocol. */
export function sanitizeUrl(url) {
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return 'https://' + trimmed;
}

/** Returns an icon.horse favicon service URL for the given domain, or empty string if domain is invalid. */
export function getFaviconUrl(url) {
  let domain = getDomain(url);
  if (!domain) return '';
  domain = domain.replace(/^www\./, '');
  return `https://icon.horse/icon/${domain}`;
}

/** Returns a Google favicon service URL which guarantees an image response (either real icon or generic globe). */
export function getFaviconFallbackUrl(url) {
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(sanitizeUrl(url))}&size=128`;
}

/** Truncates a string to maxLength characters, appending "…" if it exceeds the limit. */
export function truncate(str, maxLength = 20) {
  const chars = [...str];
  if (chars.length <= maxLength) return str;
  return chars.slice(0, maxLength).join('') + '…';
}

/** Copies text to the clipboard, resolving to true on success or false on failure. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Downloads a text string as a file by creating a temporary Blob and anchor element. */
export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Polls for a DOM element by ID every 50ms, resolving when found or rejecting after timeout ms. */
export function waitForElement(id, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const el = document.getElementById(id);
    if (el) return resolve(el);
    const start = Date.now();
    const interval = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        clearInterval(interval);
        resolve(el);
      } else if (Date.now() - start >= timeout) {
        clearInterval(interval);
        reject(new Error(`Element #${id} not found within ${timeout}ms`));
      }
    }, 50);
  });
}

/** Clamps a numeric value between a minimum and maximum. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Returns true if the string is a valid http: or https: URL, false otherwise. */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
