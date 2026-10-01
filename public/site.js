// Dreamward site: one-click download for this computer, OS tabs, copy buttons,
// reveal-on-scroll, the life-wheel animation and the language suggestion.
// Plain JS, same-origin (the CSP allows nothing else). Everything works
// without it: links fall back to the download section.

const doc = document.documentElement;
doc.classList.add('js');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Which computer is this? ─────────────────────────────────────────── */
const ua = navigator.userAgent || '';
const uad = navigator.userAgentData;
const plat = (uad && uad.platform) || navigator.platform || '';
const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1) || !!(uad && uad.mobile);
let os = /Win/i.test(plat) || /Windows/i.test(ua) ? 'win'
  : /Mac/i.test(plat) || /Mac OS X/i.test(ua) ? 'mac'
  : /Linux|X11|CrOS/i.test(plat + ' ' + ua) ? 'linux' : null;
if (mobile) { doc.classList.add('is-mobile'); os = null; }

/* ── Download tabs ───────────────────────────────────────────────────── */
const tabs = [...document.querySelectorAll('.tab[data-os]')];
function select(which, focus) {
  tabs.forEach((t) => {
    const on = t.dataset.os === which;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById('panel-' + t.dataset.os);
    if (panel) panel.hidden = !on;
    if (on && focus) t.focus();
  });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(t.dataset.os));
  t.addEventListener('keydown', (e) => {
    const rtl = doc.dir === 'rtl';
    const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: -i, End: tabs.length - 1 - i }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(i + next + tabs.length) % tabs.length].dataset.os, true);
  });
});
if (tabs.length) select(os || 'win');

/* ── One click: the hero (and final) button downloads for this computer ── */
const hero = document.getElementById('hero-download');
const link = (key) => document.querySelector(`[data-download="${key}"]`)?.getAttribute('href');
function aim(key) {
  const href = link(key);
  if (!hero || !href) return;
  for (const a of [hero, document.querySelector('[data-final-download]')]) {
    if (!a) continue;
    a.setAttribute('href', href);
    // After the download starts, show the install steps.
    a.addEventListener('click', () => setTimeout(() => {
      document.getElementById('download')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }, 500));
  }
  const label = hero.dataset['label' + os.charAt(0).toUpperCase() + os.slice(1)];
  const span = hero.querySelector('span');
  if (label && span) span.textContent = label;
}
if (os === 'win') aim('win');
if (os === 'linux') aim('linux');
if (os === 'mac') {
  aim('mac-arm'); // most Macs sold since 2020
  uad?.getHighEntropyValues?.(['architecture']).then((v) => {
    if (v.architecture === 'x86') aim('mac-intel');
  }).catch(() => {});
}

/* ── Mobile: send the page to a computer ─────────────────────────────── */
const share = document.querySelector('[data-share]');
if (share && mobile && navigator.share) {
  share.hidden = false;
  share.addEventListener('click', () => navigator.share({ title: document.title, url: location.href.split('#')[0] }).catch(() => {}));
}

/* ── Copy buttons ────────────────────────────────────────────────────── */
document.querySelectorAll('[data-copy]').forEach((b) => {
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      const was = b.textContent;
      b.textContent = b.dataset.copied || '✓';
      setTimeout(() => { b.textContent = was; }, 1600);
    } catch { /* clipboard blocked: the command stays selectable */ }
  });
});

/* ── Reveal on scroll (+ the life wheel growing toward the vision) ───── */
function grow(el) {
  if (reduced) return;
  el.querySelectorAll('animate').forEach((a) => { try { a.beginElement(); } catch { /* no SMIL */ } });
}
const reveals = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      if (e.target.matches('[data-wheel]')) setTimeout(() => grow(e.target), 400);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

/* ── Onboarding loops: play while on screen; reduced motion keeps the poster ── */
const loops = [...document.querySelectorAll('video[data-loop]')];
if (loops.length && 'IntersectionObserver' in window && !reduced) {
  const lo = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { threshold: 0.25 });
  loops.forEach((v) => lo.observe(v));
}

/* ── "Prefer Hebrew?" — a suggestion, never a redirect ──────────────── */
const hint = document.getElementById('lang-hint');
const lang = document.body.dataset.lang;
const KEY = 'dw-lang-hint-dismissed';
let dismissed = false;
try { dismissed = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
const prefs = navigator.languages || [navigator.language || ''];
const wantsHe = prefs.some((l) => /^(he|iw)\b/i.test(l));
const first = (prefs[0] || '').toLowerCase();
if (hint && !dismissed && ((lang === 'en' && wantsHe) || (lang === 'he' && first && !/^(he|iw)/.test(first) && !wantsHe))) {
  hint.classList.add('show');
}
hint?.querySelector('[data-dismiss-lang]')?.addEventListener('click', () => {
  hint.classList.remove('show');
  try { localStorage.setItem(KEY, '1'); } catch { /* fine */ }
});
