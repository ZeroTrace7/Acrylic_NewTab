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

let settingsOpen = false;

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
    console.log('[Acrylic] onboardingDone:', onboardingDone);
    if (!onboardingDone) {
      const { initOnboarding } = await import('./onboarding/onboarding.js');
      console.log('[Acrylic] Launching onboarding...');
      await initOnboarding();
    }

    // Step 3 — Initialize UI modules in parallel
    await Promise.all([
      initClock(),
      initSearch(),
      initQuickLinks(),
      initTasks(),
    ]);

    // Step 4 — Settings button (lazy-loaded)
    DOM.settingsBtn?.addEventListener('click', async () => {
      if (settingsOpen) return;
      settingsOpen = true;
      const { initSettings } = await import('./settings/settings.js');
      await initSettings(() => { settingsOpen = false; });
    });

    // Step 5 — Tools FAB (lazy-loaded)
    const toolsFab = DOM.toolsFab;
    const syncToolsState = () => {
      const panelOpen = toolsFab?.classList.contains('active') === true;
      toolsFab?.setAttribute('aria-expanded', String(panelOpen));
      toolsFab?.setAttribute('aria-label', panelOpen ? 'Close quick tools' : 'Open quick tools');
    };
    syncToolsState();

    toolsFab?.addEventListener('click', async () => {
      const { toggleToolsPanel } = await import('./panels/toolspanel.js');
      const wasActive = toolsFab.classList.contains('active');
      toggleToolsPanel(() => {
        toolsFab.classList.remove('active');
        syncToolsState();
      });
      if (wasActive) {
        toolsFab.classList.remove('active');
      } else {
        toolsFab.classList.add('active');
      }
      syncToolsState();
    });

    // Step 6 — Keyboard shortcuts
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
    // Step 7 — Graceful error handling
    console.error('Acrylic init error:', err);
    toast.error('Something went wrong. Please refresh.');
  }
}

initApp();

