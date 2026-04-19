import { Prefs } from '../modules/storage.js';
import { setTheme, getAvailableThemes } from '../modules/background.js';
import { toast } from '../modules/toast.js';
import { DOM } from '../modules/dom.js';

let overlayEl = null;
let currentStep = 0;
let selections = { name: '', theme: 'midnight', searchEngine: 'google' };

const STEPS = [
  { id: 'welcome',     title: 'Welcome to Acrylic',  subtitle: "The most beautiful new tab for Chrome. Let's get you set up in 30 seconds." },
  { id: 'personalize', title: 'Make it yours',        subtitle: 'Choose a name and pick your favorite theme.' },
  { id: 'search',      title: 'Where should search go?', subtitle: 'Pick a default destination. You can switch between AI assistants and search engines any time.' },
];

const THEME_COLORS = { midnight:'#0f0f23','deep-blue':'#021b37',aurora:'#003840','rose-noir':'#2d0320',jet:'#000',espresso:'#1c0f0a',slate:'#0f172a',forest:'#0d1f0f' };

const ENGINE_GROUPS = [
  { id: 'assistants', label: 'AI Assistants' },
  { id: 'search', label: 'Search Engines' },
];

const ENGINES = [
  { id: 'perplexity', group: 'assistants', name: 'Perplexity', desc: 'Answer-first research with citations and web grounding' },
  { id: 'chatgpt', group: 'assistants', name: 'ChatGPT', desc: 'Use ChatGPT as your primary assistant for open-ended queries' },
  { id: 'claude', group: 'assistants', name: 'Claude', desc: 'Thoughtful long-form responses and deep writing support' },
  { id: 'grok', group: 'assistants', name: 'Grok', desc: 'Fast conversational search with a live-web leaning workflow' },
  { id: 'google', group: 'search', name: 'Google', desc: "The world's most popular search engine" },
  { id: 'duckduckgo', group: 'search', name: 'DuckDuckGo', desc: 'Privacy-first search with no tracking by default' },
  { id: 'brave', group: 'search', name: 'Brave', desc: 'Independent private search with a clean results page' },
  { id: 'youtube', group: 'search', name: 'YouTube', desc: 'Jump straight into video discovery and visual how-tos' },
];

let contentEl = null;
let dotsEls = [];
let backBtn = null;
let nextBtn = null;
let skipLink = null;

function buildOverlay() {
  const ov = document.createElement('div');
  ov.setAttribute('style', 'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);');

  const card = document.createElement('div');
  card.setAttribute('style', 'width:min(520px,92vw);background:rgba(255,255,255,0.10);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.18);border-radius:28px;box-shadow:0 32px 80px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.15);padding:48px;display:flex;flex-direction:column;gap:32px;animation:slide-in-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both;');

  // Dots
  const dots = document.createElement('div');
  dots.setAttribute('style', 'display:flex;justify-content:center;gap:8px;');
  dotsEls = STEPS.map((_, i) => {
    const d = document.createElement('div');
    const active = i === 0;
    d.setAttribute('style', `width:8px;height:8px;border-radius:50%;transition:all 300ms ease;background:rgba(255,255,255,${active ? '0.9' : '0.25'});${active ? 'transform:scale(1.3);' : ''}`);
    dots.appendChild(d);
    return d;
  });

  // Content
  contentEl = document.createElement('div');
  contentEl.id = 'onboarding-step-content';
  contentEl.setAttribute('style', 'transition:opacity 150ms ease;min-height:260px;');

  // Nav
  const nav = document.createElement('div');
  nav.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');

  backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.setAttribute('style', 'padding:10px 20px;border-radius:12px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);color:var(--text-secondary);font-size:0.9rem;cursor:pointer;visibility:hidden;');
  backBtn.onclick = () => goToStep(currentStep - 1);

  const mid = document.createElement('div');
  skipLink = document.createElement('span');
  skipLink.textContent = 'Skip setup';
  skipLink.setAttribute('style', 'font-size:0.8rem;color:var(--text-muted);cursor:pointer;text-decoration:underline;text-underline-offset:3px;display:none;');
  skipLink.onclick = finishOnboarding;
  mid.appendChild(skipLink);

  nextBtn = document.createElement('button');
  nextBtn.textContent = 'Get Started';
  nextBtn.setAttribute('style', 'padding:10px 28px;border-radius:12px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:var(--text-primary);font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 150ms ease;');
  nextBtn.onclick = () => { if (currentStep === STEPS.length - 1) finishOnboarding(); else goToStep(currentStep + 1); };

  nav.append(backBtn, mid, nextBtn);
  card.append(dots, contentEl, nav);
  ov.appendChild(card);
  return ov;
}

function goToStep(step) {
  currentStep = step;
  dotsEls.forEach((d, i) => {
    d.style.background = `rgba(255,255,255,${i === step ? '0.9' : '0.25'})`;
    d.style.transform = i === step ? 'scale(1.3)' : 'scale(1)';
  });
  backBtn.style.visibility = step === 0 ? 'hidden' : 'visible';
  skipLink.style.display = step > 0 ? 'inline' : 'none';
  nextBtn.textContent = step === 0 ? 'Get Started' : step === STEPS.length - 1 ? "Let's go! →" : 'Next →';
  contentEl.style.opacity = '0';
  setTimeout(() => { renderStep(); contentEl.style.opacity = '1'; }, 150);
}

function renderStep() {
  contentEl.innerHTML = '';
  const s = STEPS[currentStep];

  if (currentStep === 0) {
    const logo = document.createElement('div');
    logo.setAttribute('style', 'width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;');
    logo.innerHTML = `<span style="font-family:var(--font-mono),monospace;font-size:3rem;font-weight:700;color:var(--text-primary);">A</span>`;
    const h = document.createElement('h1');
    h.textContent = s.title;
    h.setAttribute('style', 'font-size:1.8rem;font-weight:800;color:var(--text-primary);text-align:center;font-family:var(--font-ui),sans-serif;line-height:1.2;margin:8px 0;');
    const sub = document.createElement('p');
    sub.textContent = s.subtitle;
    sub.setAttribute('style', 'font-size:0.95rem;color:var(--text-secondary);text-align:center;line-height:1.6;margin-bottom:16px;');
    const feats = document.createElement('div');
    feats.setAttribute('style', 'display:flex;flex-direction:column;gap:8px;align-items:center;');
    ['⚡ Flip clock with live time', '🔍 Multi-engine search bar', '📝 Notes, Pomodoro & Tab Manager'].forEach(f => {
      const row = document.createElement('div');
      row.setAttribute('style', 'display:flex;align-items:center;gap:10px;font-size:0.85rem;color:var(--text-secondary);');
      row.textContent = f;
      feats.appendChild(row);
    });
    contentEl.append(logo, h, sub, feats);
  }

  if (currentStep === 1) {
    const h = document.createElement('h2');
    h.textContent = s.title;
    h.setAttribute('style', 'font-size:1.4rem;font-weight:700;color:var(--text-primary);text-align:center;margin-bottom:4px;');
    const sub = document.createElement('p');
    sub.textContent = s.subtitle;
    sub.setAttribute('style', 'font-size:0.9rem;color:var(--text-secondary);text-align:center;margin-bottom:16px;');

    const lbl = document.createElement('label');
    lbl.textContent = 'What should we call you?';
    lbl.setAttribute('style', 'font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;display:block;');
    const nameIn = document.createElement('input');
    nameIn.type = 'text'; nameIn.placeholder = 'Your name (optional)'; nameIn.value = selections.name;
    nameIn.setAttribute('style', 'width:100%;padding:12px 16px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);border-radius:14px;font-size:1rem;color:var(--text-primary);font-family:var(--font-ui),sans-serif;outline:none;box-sizing:border-box;');
    nameIn.oninput = () => { selections.name = nameIn.value; };
    nameIn.onkeydown = (e) => { if (e.key === 'Enter') goToStep(2); };
    setTimeout(() => nameIn.focus(), 50);

    const tLbl = document.createElement('div');
    tLbl.textContent = 'Pick a theme';
    tLbl.setAttribute('style', 'font-size:0.8rem;color:var(--text-muted);margin-top:20px;margin-bottom:8px;');
    const grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;');
    getAvailableThemes().forEach(t => {
      const active = selections.theme === t.id;
      const btn = document.createElement('button');
      btn.setAttribute('style', `padding:6px 4px;border-radius:10px;cursor:pointer;transition:all 150ms ease;display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid ${active ? 'rgba(255,255,255,0.4)' : 'transparent'};background:${active ? 'var(--glass-subtle)' : 'transparent'};`);
      btn.innerHTML = `<div style="width:100%;height:28px;border-radius:7px;background:${THEME_COLORS[t.id] || '#111'};"></div><span style="font-size:0.65rem;color:var(--text-secondary);">${t.label}</span>`;
      btn.onclick = () => { selections.theme = t.id; setTheme(t.id); renderStep(); };
      grid.appendChild(btn);
    });
    contentEl.append(h, sub, lbl, nameIn, tLbl, grid);
  }

  if (currentStep === 2) {
    const h = document.createElement('h2');
    h.textContent = s.title;
    h.setAttribute('style', 'font-size:1.4rem;font-weight:700;color:var(--text-primary);text-align:center;margin-bottom:4px;');
    const sub = document.createElement('p');
    sub.textContent = s.subtitle;
    sub.setAttribute('style', 'font-size:0.9rem;color:var(--text-secondary);text-align:center;margin-bottom:16px;');
    const groups = document.createElement('div');
    groups.setAttribute('style', 'display:flex;flex-direction:column;gap:14px;');

    ENGINE_GROUPS.forEach((group) => {
      const section = document.createElement('section');
      section.setAttribute('style', 'display:flex;flex-direction:column;gap:8px;');

      const title = document.createElement('div');
      title.textContent = group.label.toUpperCase();
      title.setAttribute('style', 'padding:0 4px;font-size:0.7rem;font-weight:700;letter-spacing:0.14em;color:var(--text-muted);');

      const list = document.createElement('div');
      list.setAttribute('style', 'display:flex;flex-direction:column;gap:10px;');

      ENGINES.filter((eng) => eng.group === group.id).forEach((eng) => {
        const active = selections.searchEngine === eng.id;
        const row = document.createElement('div');
        row.setAttribute('style', `display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:14px;cursor:pointer;transition:all 150ms ease;background:${active ? 'var(--glass-bg)' : 'var(--glass-subtle)'};border:1px solid ${active ? 'var(--glass-border)' : 'transparent'};`);
        row.innerHTML = `<div><div style="font-weight:600;font-size:0.9rem;color:${active ? 'var(--text-primary)' : 'var(--text-secondary)'};">${eng.name}</div><div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${eng.desc}</div></div>`;
        const radio = document.createElement('div');
        radio.setAttribute('style', `width:18px;height:18px;border-radius:50%;border:2px solid ${active ? 'rgba(255,255,255,0.8)' : 'var(--glass-border)'};background:${active ? 'rgba(255,255,255,0.8)' : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;`);
        if (active) {
          const dot = document.createElement('div');
          dot.setAttribute('style', 'width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,0.6);');
          radio.appendChild(dot);
        }
        row.appendChild(radio);
        row.onclick = () => { selections.searchEngine = eng.id; renderStep(); };
        list.appendChild(row);
      });

      section.append(title, list);
      groups.appendChild(section);
    });

    contentEl.append(h, sub, groups);
  }
}

async function finishOnboarding() {
  await Prefs.setMany({
    userName: selections.name.trim(),
    theme: selections.theme,
    searchEngine: selections.searchEngine,
    onboardingDone: true,
  });
  await new Promise(r => setTimeout(r, 100));
  setTheme(selections.theme);
  if (overlayEl) {
    overlayEl.style.transition = 'opacity 300ms ease';
    overlayEl.style.opacity = '0';
    setTimeout(() => { overlayEl?.remove(); overlayEl = null; }, 300);
  }
  toast.success('Welcome to Acrylic! 🎉');
}

export async function initOnboarding() {
  const done = await Prefs.get('onboardingDone');
  if (done) return;
  currentStep = 0;
  selections = { name: '', theme: 'midnight', searchEngine: 'google' };
  overlayEl = buildOverlay();
  renderStep();
  (DOM.onboardingMount || document.body).appendChild(overlayEl);
}

