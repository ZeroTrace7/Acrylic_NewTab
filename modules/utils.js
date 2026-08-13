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

/** Formats a Date object into a locale-aware human-readable date string. */
export function formatDate(date) {
  return date.toLocaleDateString(undefined, {
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

/** Locale-aware greeting lookup table — reads navigator.language, falls back to English. */
const GREETINGS = {
  en: ['Good morning', 'Good afternoon', 'Good evening'],
  es: ['Buenos dias', 'Buenas tardes', 'Buenas noches'],
  fr: ['Bonjour', 'Bon apres-midi', 'Bonsoir'],
  de: ['Guten Morgen', 'Guten Tag', 'Guten Abend'],
  pt: ['Bom dia', 'Boa tarde', 'Boa noite'],
  ja: ["\u304a\u306f\u3088\u3046\u3054\u3056\u3044\u307e\u3059", "\u3053\u3093\u306b\u3061\u306f", "\u3053\u3093\u3070\u3093\u306f"],
  zh: ["\u65e9\u4e0a\u597d", "\u4e0b\u5348\u597d", "\u665a\u4e0a\u597d"],
  ko: ["\uc880\uc740 \uc544\uce68\uc774\uc5d0\uc694", "\uc548\ub155\ud558\uc138\uc694", "\uc548\ub155\ud558\uc138\uc694"],
  ar: ["\u0635\u0628\u0627\u062d \u0627\u0644\u062e\u064a\u0631", "\u0645\u0633\u0627\u0621 \u0627\u0644\u062e\u064a\u0631", "\u0645\u0633\u0627\u0621 \u0627\u0644\u0646\u0648\u0631"],
  hi: ["\u0938\u0941\u092a\u094d\u0930\u092d\u093e\u0924", "\u0928\u092e\u0938\u094d\u0924\u0947", "\u0936\u0941\u092d \u0938\u0902\u0927\u094d\u092f\u093e"],
};

/** Returns a locale-aware greeting string based on the hour, optionally appending a name. */
export function getGreeting(date, name = '') {
  const hour = date.getHours();
  const lang = navigator.language?.slice(0, 2) || 'en';
  const set = GREETINGS[lang] || GREETINGS['en'];
  const greeting = hour < 12 ? set[0] : hour < 17 ? set[1] : set[2];
  if (name && name.trim()) return `${greeting}, ${name.trim()}`;
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

/** Returns a high-resolution Google favicon URL for the given domain, or empty string if domain is invalid. */
export function getFaviconUrl(url) {
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(sanitizeUrl(url))}&size=128`;
}

/** Returns an alternate favicon service URL for the given domain. */
export function getFaviconFallbackUrl(url) {
  let domain = getDomain(url);
  if (!domain) return '';
  domain = domain.replace(/^www\./, '');
  return `https://icon.horse/icon/${domain}`;
}

/** Truncates a string to maxLength characters, appending "..." if it exceeds the limit. */
export function truncate(str, maxLength = 20) {
  const chars = [...str];
  if (chars.length <= maxLength) return str;
  return chars.slice(0, maxLength).join('') + '\u2026';
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

/**
 * Returns true if the string is a plausible http/https URL with a real domain.
 * Requires at least one dot in hostname (e.g. google.com, example.org).
 * Used by search.js ONLY to distinguish URL navigation from keyword searches.
 * Do NOT use for Quick Links validation - use isValidUrl() instead.
 */
export function isValidSearchUrl(url) {
  if (!url || /\s/.test(url)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    /* A real domain must have at least one dot (e.g. google.com, example.org) */
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Returns true if the string is a valid http/https URL - permissive version.
 * No dot requirement - accepts localhost, IPs, short domains, and all common formats.
 * Only http: and https: protocols are allowed; javascript: and others are blocked (XSS guard).
 * Used exclusively for Quick Links URL validation.
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely injects SVG or HTML strings into an element.
 * Uses the <template> API which correctly preserves both HTML and SVG
 * namespaces - unlike DOMParser('text/html') which strips SVG namespace
 * and renders all SVG elements as dead HTMLUnknownElement text nodes.
 * @param {HTMLElement} targetElement - The element to inject content into.
 * @param {string} htmlString - The HTML or SVG raw string.
 */
export function safeInject(targetElement, htmlString) {
  targetElement.textContent = '';
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  targetElement.appendChild(template.content.cloneNode(true));
}
