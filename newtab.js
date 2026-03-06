import { initBackground } from './modules/background.js';
import { initClock }      from './modules/clock.js';
import { initSearch }     from './modules/search.js';
import { initQuickLinks } from './modules/quicklinks.js';
import { Prefs }          from './modules/storage.js';
import { toast }          from './modules/toast.js';

let settingsOpen = false;

async function initApp() {
  try {
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
    ]);

    // Step 4 — Settings button (lazy-loaded)
    document.getElementById('settings-btn')?.addEventListener('click', async () => {
      if (settingsOpen) return;
      settingsOpen = true;
      const { initSettings } = await import('./settings/settings.js');
      await initSettings(() => { settingsOpen = false; });
    });

    // Step 5 — Tools FAB (lazy-loaded)
    const toolsFab = document.getElementById('tools-fab');
    toolsFab?.addEventListener('click', async () => {
      const { toggleToolsPanel } = await import('./panels/toolspanel.js');
      const wasActive = toolsFab.classList.contains('active');
      toggleToolsPanel(() => toolsFab.classList.remove('active'));
      if (wasActive) {
        toolsFab.classList.remove('active');
      } else {
        toolsFab.classList.add('active');
      }
    });

    // Step 6 — Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'Escape') document.activeElement?.blur();
    });

  } catch (err) {
    // Step 7 — Graceful error handling
    console.error('Acrylic init error:', err);
    toast.error('Something went wrong. Please refresh.');
  }
}

initApp();

