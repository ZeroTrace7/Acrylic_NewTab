import { Prefs } from '../modules/storage.js';

/**
 * Non-blocking welcome card — slides in over the loaded dashboard
 * on first install only. The full UI remains interactive behind it.
 */
export async function initOnboarding() {
  const done = await Prefs.get('onboardingDone');
  if (done) return;

  /* Mark done immediately so it never shows again, even on crash */
  await Prefs.set('onboardingDone', true);

  /* Wait for the entry animation stagger to complete (~1.6s) */
  await new Promise(r => setTimeout(r, 2000));

  /* ── Inject scoped styles ───────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .welcome-card {
      position: fixed;
      bottom: 28px;
      left: 28px;
      z-index: 900;
      width: min(370px, calc(100vw - 56px));
      padding: 28px 26px 22px;
      background: rgba(0, 0, 0, 0.15); /* highly transparent for glassmorphism */
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

      /* Entry animation */
      opacity: 0;
      transform: translateY(30px) scale(0.96);
      animation: welcome-slide-in 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes welcome-slide-in {
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .welcome-card.dismissing {
      animation: welcome-slide-out 400ms cubic-bezier(0.55, 0, 1, 0.45) forwards;
    }

    @keyframes welcome-slide-out {
      to {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
    }

    .welcome-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      position: relative;
    }

    .welcome-close {
      position: absolute;
      top: -12px;
      right: -12px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
      font-size: 1.1rem;
      cursor: pointer;
      border-radius: 50%;
      transition: all 150ms ease;
    }

    .welcome-close:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.1);
    }

    .welcome-logo {
      width: 36px;
      height: 36px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono), monospace;
      font-size: 1.2rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      flex-shrink: 0;
    }

    .welcome-title {
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .welcome-subtitle {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.55);
      margin-bottom: 18px;
    }

    .welcome-tips {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .welcome-tip {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 11px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid;
      border-color: rgba(255, 255, 255, 0.12) rgba(255, 255, 255, 0.03) rgba(255, 255, 255, 0.03) rgba(255, 255, 255, 0.12);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      opacity: 0;
      transform: translateY(8px);
      animation: welcome-tip-in 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .welcome-tip:nth-child(1) { animation-delay: 200ms; }
    .welcome-tip:nth-child(2) { animation-delay: 350ms; }
    .welcome-tip:nth-child(3) { animation-delay: 500ms; }

    @keyframes welcome-tip-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .welcome-tip-icon {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.9rem;
    }

    .welcome-tip-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .welcome-tip-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.88);
    }

    .welcome-tip-desc {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.45;
    }

    .welcome-tip-kbd {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      font-size: 0.66rem;
      font-family: var(--font-ui), sans-serif;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 5px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }

    .welcome-badge-important {
      display: inline-block;
      padding: 2px 8px;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(239, 68, 68, 0.22);
      color: rgba(252, 165, 165, 0.95);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 6px;
      margin-inline-start: 6px;
      vertical-align: middle;
    }

    .welcome-dismiss {
      width: 100%;
      padding: 11px 20px;
      border: none;
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 180ms ease, transform 120ms ease;
      opacity: 0;
      animation: welcome-tip-in 500ms cubic-bezier(0.16, 1, 0.3, 1) 650ms forwards;
    }

    .welcome-dismiss:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .welcome-dismiss:active {
      transform: scale(0.97);
    }

    @media (max-width: 640px) {
      .welcome-card {
        bottom: 16px;
        left: 16px;
        right: 16px;
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);

  /* ── Build the card ─────────────────────────────────────── */
  const card = document.createElement('div');
  card.className = 'welcome-card';

  const header = document.createElement('div');
  header.className = 'welcome-header';
  header.innerHTML = '<div class="welcome-logo">A</div><div><div class="welcome-title">Welcome to Acrylic! ✨</div><div class="welcome-subtitle">Let\u2019s clean up your browser for the best experience.</div></div><button class="welcome-close">&times;</button>';

  const tips = document.createElement('div');
  tips.className = 'welcome-tips';

  const tipData = [
    {
      icon: '🖥️',
      label: 'Hide the footer <span class="welcome-badge-important">Important</span>',
      desc: '<strong>Right click</strong> on the footer (bottom bar) and select <strong>\u201cHide footer on New tab page\u2026\u201d</strong>'
    },
    {
      icon: '📑',
      label: 'Hide Bookmarks Bar',
      desc: 'Press <span class="welcome-tip-kbd">Ctrl</span> + <span class="welcome-tip-kbd">Shift</span> + <span class="welcome-tip-kbd">B</span> to toggle visibility.'
    },
    {
      icon: '🔎',
      label: 'Adjust UI Scale',
      desc: 'If the layout feels too big or cramped, press <span class="welcome-tip-kbd">Ctrl</span> + <span class="welcome-tip-kbd">\u2212</span> or <span class="welcome-tip-kbd">+</span> to zoom.'
    }
  ];

  tipData.forEach(t => {
    const tip = document.createElement('div');
    tip.className = 'welcome-tip';
    tip.innerHTML = '<div class="welcome-tip-icon">' + t.icon + '</div><div class="welcome-tip-text"><div class="welcome-tip-label">' + t.label + '</div><div class="welcome-tip-desc">' + t.desc + '</div></div>';
    tips.appendChild(tip);
  });

  const btn = document.createElement('button');
  btn.className = 'welcome-dismiss';
  btn.textContent = 'Got it, looks clean!';
  const dismissFn = () => {
    card.classList.add('dismissing');
    setTimeout(() => card.remove(), 400);
  };

  btn.addEventListener('click', dismissFn);
  header.querySelector('.welcome-close').addEventListener('click', dismissFn);

  card.append(header, tips, btn);
  document.body.appendChild(card);
}
