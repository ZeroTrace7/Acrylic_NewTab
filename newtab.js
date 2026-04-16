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

function debugStylesheetBinding() {
  const loadedStylesheets = [...document.styleSheets].map((s) => s.href);

  const hasNewtabCss = loadedStylesheets.some(
    (href) => typeof href === 'string' && href.includes('newtab.css')
  );

  if (!hasNewtabCss) {
    const style = document.createElement('style');
    style.textContent = `
body.test-force-bg {
  background: red !important;
}
`;
    document.head.appendChild(style);
    document.body.classList.add('test-force-bg');
  }
}

function armEntryAnimation() {
  const apply = () => {
    requestAnimationFrame(() => {
      document.body?.classList.add('acrylic-loaded');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
    return;
  }

  apply();
}

async function initApp() {
  try {
    document.documentElement.style.setProperty('--clock-top', UI_CONFIG.clockTop);
    document.documentElement.style.setProperty('--center-top', UI_CONFIG.centerTop);
    document.documentElement.style.setProperty('--quicklinks-bottom', UI_CONFIG.quicklinksBottom);
    document.documentElement.style.setProperty('--sidebar-left', UI_CONFIG.sidebarLeft);

    // Step 1 — Background first (theme/wallpaper before UI paints)
    await initBackground();

    // Step 2 — Onboarding check
    const onboardingDone = await Prefs.get('onboardingDone');
    if (!onboardingDone) {
      const { initOnboarding } = await import('./onboarding/onboarding.js');
      await initOnboarding();
    }

    // Step 3 — Apply persisted dashboard preferences before UI init
    await initPreferences();

    // Step 4 — Initialize UI modules in parallel
    await Promise.all([
      initClock(),
      initSearch(),
      initQuickLinks(),
      initTasks(),
    ]);

    // Step 5 — Preferances button (lazy-loaded)
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
        zenDateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
        }).toUpperCase();
      }
    }

    async function enterZen() {
      if (zenClockEl) return;
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
        setTimeout(() => el.remove(), 800);
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
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        DOM.searchInput?.focus();
      }
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
    // Step 8 — Graceful error handling
    console.error('Acrylic init error:', err);
    toast.error('Something went wrong. Please refresh.');
  }
}

armEntryAnimation();
initApp();

