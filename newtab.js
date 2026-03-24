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
  console.log('Loaded stylesheets:', loadedStylesheets);

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

  console.info('[Acrylic] DevTools Network: enable "Disable cache" while debugging CSS.');
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
    debugStylesheetBinding();

    document.documentElement.style.setProperty('--clock-top', UI_CONFIG.clockTop);
    document.documentElement.style.setProperty('--center-top', UI_CONFIG.centerTop);
    document.documentElement.style.setProperty('--quicklinks-bottom', UI_CONFIG.quicklinksBottom);
    document.documentElement.style.setProperty('--sidebar-left', UI_CONFIG.sidebarLeft);

    // Step 1 — Background first (theme/wallpaper before UI paints)
    await initBackground();

    // Step 2 — Onboarding check
    const onboardingDone = await Prefs.get('onboardingDone');
    console.log('[Acrylic] onboardingDone:', onboardingDone);
    if (!onboardingDone) {
      const { initOnboarding } = await import('./onboarding/onboarding.js');
      console.log('[Acrylic] Launching onboarding...');
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

    // Step 7 — Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        DOM.searchInput?.focus();
      }
      if (e.key === 'Escape') {
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

