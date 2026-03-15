import { DOM } from './dom.js';

/** Shows a toast notification in #toast-container with optional type and duration. */
export function showToast(message, type = 'default', duration = 2500) {
  const container = DOM.toastContainer;
  if (!container) return null;

  const el = document.createElement('div');
  el.className = 'toast';
  if (type === 'success') el.classList.add('success');
  if (type === 'error') el.classList.add('error');
  el.textContent = message;

  container.appendChild(el);
  setTimeout(() => dismissToast(el), duration);
  return el;
}

/** Adds the dismissing class to trigger slide-out, then removes the element after 200ms. */
export function dismissToast(el) {
  el.classList.add('dismissing');
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 200);
}

/** Convenience object with success, error, and info shorthand methods. */
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error:   (message, duration) => showToast(message, 'error', duration),
  info:    (message, duration) => showToast(message, 'default', duration),
};
