/*
 * Acrylic - New Tab
 * Copyright (C) 2026 Shreyash Gupta
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { initBackground } from './modules/background.js';
import { initClock }      from './modules/clock.js';
import { initSearch }     from './modules/search.js';
import { initQuickLinks } from './modules/quicklinks.js';
import { initTasks }      from './modules/tasks.js';
import { Prefs }          from './modules/storage.js';
import { toast }          from './modules/toast.js';
import { DOM }            from './modules/dom.js';
import { bus }            from './modules/event-bus.js';
import { UI_CONFIG }      from './modules/ui-config.js';
import { initPreferences } from './modules/preferences.js';

let settingsOpen = false;

function armEntryAnimation() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body?.classList.add('acrylic-loaded');
    });
  });
}

async function initApp() {
  try {
    document.documentElement.style.setProperty('--clock-top', UI_CONFIG.clockTop);
    document.documentElement.style.setProperty('--center-top', UI_CONFIG.centerTop);
    document.documentElement.style.setProperty('--quicklinks-bottom', UI_CONFIG.quicklinksBottom);
    document.documentElement.style.setProperty('--sidebar-left', UI_CONFIG.sidebarLeft);

    // Step 0 — Let the CSS boot curtain establish on the GPU before painting the DOM.
    // Without this, JS injects the theme so fast it clashes with the fade animation.
    await new Promise((resolve) => setTimeout(resolve, 180));

    // Step 1 — Background first (theme/wallpaper before UI paints)
    await initBackground();

    // Step 2 — Apply persisted dashboard preferences before UI init
    await initPreferences();

    // Step 3 — Initialize UI modules in parallel
    await Promise.all([
      initClock(),
      initSearch(),
      initQuickLinks(),
      initTasks(),
    ]);

    // Step 3.5 — Trigger foreground entry cascade (background + UI are ready)
    armEntryAnimation();

    // Step 4 — Non-blocking welcome card (first install only, after UI is fully loaded)
    import('./onboarding/onboarding.js').then(m => m.initOnboarding()).catch(() => {});

    // Step 4.5 — Non-blocking update banner (after extension updates only)
    import('./modules/update-banner.js').then(m => m.initUpdateBanner()).catch(() => {});

    // Step 5 — Preferences button (lazy-loaded)
    DOM.settingsBtn?.addEventListener('click', async () => {
      if (settingsOpen) return;
      settingsOpen = true;
      const { initSettings } = await import('./settings/settings.js');
      await initSettings(() => { settingsOpen = false; });
    });

    // Step 6 — Quick Tools trigger (bottom-right grid button)
    const quickToolsBtn = DOM.quickToolsBtn;
    const syncToolsState = () => {
      const panelOpen = quickToolsBtn?.classList.contains('active') === true;
      quickToolsBtn?.setAttribute('aria-expanded', String(panelOpen));
      quickToolsBtn?.setAttribute('aria-label', panelOpen ? 'Close quick tools' : 'Open quick tools');
    };
    syncToolsState();

    quickToolsBtn?.addEventListener('click', async () => {
      const { toggleToolsPanel } = await import('./panels/toolspanel.js');
      const wasActive = quickToolsBtn.classList.contains('active');
      toggleToolsPanel(() => {
        quickToolsBtn.classList.remove('active');
        syncToolsState();
      });
      if (wasActive) {
        quickToolsBtn.classList.remove('active');
      } else {
        quickToolsBtn.classList.add('active');
      }
      syncToolsState();
    });

    // Step 7.5 — Zen Mode (flip clock)
    let zenTickTimer = 0;
    let zenClockEl = null;
    const zenDigitEls = [];
    let zenDateEl = null;
    let zenUse24 = false;
    let zenExitBtn = null;
    let zenEnterTimer = 0;
    let zenRemovalTimer = 0;
    const ZEN_ENTER_DELAY_MS = 130;

    function ensureZenExitButton() {
      if (zenExitBtn) return;
      zenExitBtn = document.createElement('button');
      zenExitBtn.type = 'button';
      zenExitBtn.className = 'zen-exit-btn';
      zenExitBtn.setAttribute('aria-label', 'Exit Zen Mode');
      zenExitBtn.setAttribute('title', 'Exit Zen Mode');
      zenExitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      zenExitBtn.addEventListener('click', exitZen);
      document.body.appendChild(zenExitBtn);
    }

    function zenTick() {
      const now = new Date();
      let h = now.getHours();
      if (!zenUse24) h = h % 12 || 12;
      const digits = [
        String(Math.floor(h / 10)),
        String(h % 10),
        String(Math.floor(now.getMinutes() / 10)),
        String(now.getMinutes() % 10),
      ];
      digits.forEach((d, i) => {
        if (zenDigitEls[i] && zenDigitEls[i].textContent !== d) {
          zenDigitEls[i].textContent = d;
        }
      });
      if (zenDateEl) {
        zenDateEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'long', month: 'long', day: 'numeric',
        });
      }
    }

    async function enterZen() {
      if (zenClockEl) return;
      clearTimeout(zenRemovalTimer);
      zenRemovalTimer = 0;
      document.querySelectorAll('.zen-flip-clock').forEach((el) => el.remove());
      zenUse24 = (await Prefs.get('clockFormat')) === '24h';
      ensureZenExitButton();
      zenExitBtn?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('zen-mode-entering');

      zenClockEl = document.createElement('div');
      zenClockEl.className = 'zen-flip-clock';

      const group = document.createElement('div');
      group.className = 'zen-flip-group';

      zenDigitEls.length = 0;
      for (let i = 0; i < 4; i++) {
        if (i === 2) {
          const spacer = document.createElement('div');
          spacer.className = 'zen-flip-colon-space';
          group.appendChild(spacer);
        }
        const card = document.createElement('div');
        card.className = 'zen-flip-card';
        const digit = document.createElement('span');
        digit.className = 'zen-flip-digit';
        digit.textContent = '0';
        card.appendChild(digit);
        group.appendChild(card);
        zenDigitEls.push(digit);
      }

      zenDateEl = document.createElement('div');
      zenDateEl.className = 'zen-flip-date';

      zenClockEl.append(group, zenDateEl);
      document.body.appendChild(zenClockEl);
      zenTick();
      zenTickTimer = setInterval(zenTick, 1000);

      clearTimeout(zenEnterTimer);
      zenEnterTimer = setTimeout(() => {
        if (!zenClockEl) return;
        document.body.classList.add('zen-mode-active');
        document.body.classList.remove('zen-mode-entering');
      }, ZEN_ENTER_DELAY_MS);
    }

    function exitZen() {
      document.body.classList.remove('zen-mode-active');
      document.body.classList.remove('zen-mode-entering');
      clearTimeout(zenEnterTimer);
      zenEnterTimer = 0;
      zenExitBtn?.setAttribute('aria-hidden', 'true');
      clearInterval(zenTickTimer);
      zenTickTimer = 0;
      if (zenClockEl) {
        const el = zenClockEl;
        zenClockEl = null;
        zenDigitEls.length = 0;
        zenDateEl = null;
        // Wait for fade-out transition to finish before removing DOM
        clearTimeout(zenRemovalTimer);
        zenRemovalTimer = setTimeout(() => {
          el.remove();
          zenRemovalTimer = 0;
        }, 800);
      }
    }

    const zenBtn = DOM.zenModeBtn;
    zenBtn?.addEventListener('click', () => {
      if (document.body.classList.contains('is-layout-editing')) return;
      if (zenClockEl || document.body.classList.contains('zen-mode-entering') || document.body.classList.contains('zen-mode-active')) {
        exitZen();
      } else {
        enterZen();
      }
    });

    // Step 8 — Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // / → Focus search (only when not typing)
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        DOM.searchInput?.focus();
      }

      // Ctrl+K / Cmd+K → Focus search (universal convention)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        DOM.searchInput?.focus();
      }

      // T → Toggle tasks panel (only when not typing)
      if (e.key === 't' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        DOM.tasksBtn?.click();
      }

      // Ctrl+, / Cmd+, → Open preferences
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        DOM.settingsBtn?.click();
      }

      // Escape → exit overlays / blur
      if (e.key === 'Escape') {
        if (zenClockEl || document.body.classList.contains('zen-mode-entering') || document.body.classList.contains('zen-mode-active')) {
          exitZen();
          return;
        }
        document.activeElement?.blur();
      }
    });

    bus.addEventListener('themeChanged', () => {
      if (document.activeElement === DOM.searchInput) DOM.searchInput?.focus();
    });

  } catch (err) {
    // Step 9 — Graceful error handling
    console.error('Acrylic init error:', err);
    toast.error('Something went wrong. Please refresh.');
    armEntryAnimation();
  }
}

initApp();
