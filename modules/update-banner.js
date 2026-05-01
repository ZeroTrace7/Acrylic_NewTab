/*
 * Acrylic - New Tab
 * Copyright (C) 2026 Shreyash Gupta
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 */

/* ============================================================
   ACRYLIC — modules/update-banner.js
   Non-blocking "What's New" banner shown once after an update.
   Architecture mirrors onboarding/onboarding.js:
     1. Read flag from chrome.storage.local (via Store)
     2. Inject scoped <style> + build DOM card
     3. Dismiss clears the flag — banner never shows again
   ============================================================ */

import { Store } from './storage.js';

// ─── Versioned Release Notes ────────────────────────────────
// Add a new key here whenever you push a version to the store.
// If a version has no entry, the banner is silently skipped.

const RELEASE_NOTES = {
  '1.0.1': {
    headline: 'Performance improvements & bug fixes',
    items: [
      { icon: '⚡', text: 'Faster, smoother boot sequence' },
      { icon: '🔧', text: 'Fixed wallpaper sync & theme transitions' },
      { icon: '🎨', text: 'Polished UI animations & micro-interactions' },
    ],
  },
  // '1.1.0': {
  //   headline: 'Brand new features & enhancements',
  //   items: [
  //     { icon: '🚀', text: 'New feature description' },
  //   ],
  // },
};

// ─── Public API ─────────────────────────────────────────────

export async function initUpdateBanner() {
  const updateData = await Store.get('acrylicUpdateReady');
  if (!updateData) return;

  const { version } = updateData;
  const notes = RELEASE_NOTES[version];
  if (!notes) {
    // Version exists but no release notes defined — clear silently
    await Store.set('acrylicUpdateReady', null);
    return;
  }

  // Wait for the boot stagger to complete (~2.4s) so banner doesn't fight curtain/entry
  await new Promise(r => setTimeout(r, 2400));

  injectStyles();
  const card = buildBannerCard(version, notes);
  document.body.appendChild(card);
}

// ─── Scoped Styles ──────────────────────────────────────────

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .update-banner {
      position: fixed;
      bottom: 28px;
      left: 28px;
      z-index: 900;
      width: min(400px, calc(100vw - 56px));
      padding: 24px 22px 20px;
      background: rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(40px) saturate(1.5);
      -webkit-backdrop-filter: blur(40px) saturate(1.5);
      border: 1px solid;
      border-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05) rgba(255, 255, 255, 0.05) rgba(255, 255, 255, 0.2);
      border-radius: 22px;
      box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.92);
      font-family: var(--font-ui), 'Poppins', sans-serif;

      /* Premium entry — same spring as onboarding */
      opacity: 0;
      transform: translateY(36px) scale(0.92);
      filter: blur(4px);
      animation: update-banner-in 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes update-banner-in {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0px);
      }
    }

    /* Dismiss — buttery melt-away */
    .update-banner.dismissing {
      animation: update-banner-out 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes update-banner-out {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0px);
      }
      100% {
        opacity: 0;
        transform: translateY(24px) scale(0.94);
        filter: blur(6px);
      }
    }

    /* ── Header row ─────────────────────────────────────── */
    .update-banner-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
      position: relative;
    }

    .update-banner-accent {
      width: 36px;
      height: 36px;
      border-radius: 11px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fbbf24;
    }

    .update-banner-accent svg {
      width: 18px;
      height: 18px;
    }

    .update-banner-title {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .update-banner-close {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.35);
      font-size: 1.1rem;
      cursor: pointer;
      border-radius: 50%;
      transition: all 200ms ease;
    }

    .update-banner-close:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.1);
    }

    /* ── Subtitle / headline ────────────────────────────── */
    .update-banner-subtitle {
      font-size: 0.76rem;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 14px;
    }

    /* ── Feature items ──────────────────────────────────── */
    .update-banner-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .update-banner-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid;
      border-color: rgba(255, 255, 255, 0.10) rgba(255, 255, 255, 0.03) rgba(255, 255, 255, 0.03) rgba(255, 255, 255, 0.10);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.82);

      /* Stagger entrance */
      opacity: 0;
      transform: translateY(8px);
      filter: blur(2px);
      animation: update-item-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .update-banner-item:nth-child(1) { animation-delay: 250ms; }
    .update-banner-item:nth-child(2) { animation-delay: 400ms; }
    .update-banner-item:nth-child(3) { animation-delay: 550ms; }
    .update-banner-item:nth-child(4) { animation-delay: 700ms; }

    @keyframes update-item-in {
      to {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0px);
      }
    }

    .update-banner-item-icon {
      font-size: 0.9rem;
      flex-shrink: 0;
      width: 22px;
      text-align: center;
    }

    /* ── CTA button ─────────────────────────────────────── */
    .update-banner-cta {
      width: 100%;
      padding: 11px 20px;
      border: none;
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 200ms ease, transform 200ms cubic-bezier(0.16, 1, 0.3, 1);

      /* Stagger after items */
      opacity: 0;
      filter: blur(2px);
      animation: update-item-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 700ms forwards;
    }

    .update-banner-cta:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .update-banner-cta:active {
      transform: scale(0.97);
    }

    @media (max-width: 640px) {
      .update-banner {
        bottom: 16px;
        left: 16px;
        right: 16px;
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── DOM Builder ────────────────────────────────────────────

function buildBannerCard(version, notes) {
  const card = document.createElement('div');
  card.className = 'update-banner';

  // Dismiss helper
  const dismiss = async () => {
    card.classList.add('dismissing');
    await Store.set('acrylicUpdateReady', null);
    setTimeout(() => card.remove(), 650);
  };

  // ── Header ────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'update-banner-header';

  const accent = document.createElement('div');
  accent.className = 'update-banner-accent';
  accent.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

  const titleWrap = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'update-banner-title';
  title.textContent = `Acrylic v${version} is here!`;
  titleWrap.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'update-banner-close';
  closeBtn.setAttribute('aria-label', 'Dismiss update banner');
  closeBtn.innerHTML = '\u00d7';
  closeBtn.addEventListener('click', dismiss);

  header.append(accent, titleWrap, closeBtn);

  // ── Subtitle ──────────────────────────────────────────
  const subtitle = document.createElement('div');
  subtitle.className = 'update-banner-subtitle';
  subtitle.textContent = notes.headline;

  // ── Feature items ─────────────────────────────────────
  const itemsWrap = document.createElement('div');
  itemsWrap.className = 'update-banner-items';

  notes.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'update-banner-item';

    const iconEl = document.createElement('span');
    iconEl.className = 'update-banner-item-icon';
    iconEl.textContent = item.icon;
    iconEl.setAttribute('aria-hidden', 'true');

    const textEl = document.createElement('span');
    textEl.textContent = item.text;

    row.append(iconEl, textEl);
    itemsWrap.appendChild(row);
  });

  // ── CTA button ────────────────────────────────────────
  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'update-banner-cta';
  cta.textContent = 'Awesome, got it!';
  cta.addEventListener('click', dismiss);

  // ── Assemble ──────────────────────────────────────────
  card.append(header, subtitle, itemsWrap, cta);
  return card;
}
