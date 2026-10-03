import { icon } from './icons.js';
import { startScene } from './scene.js';

/* ------------------------------------------------------------------ helpers */
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  const add = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return el;
}

function hexToRgb(hex, fallback = '138,164,192') {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return fallback;
  let v = m[1];
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)).join(',');
}
const isExternal = (href) => /^https?:\/\//i.test(href || '') && new URL(href, location.href).origin !== location.origin;
function A(props, ...kids) {
  const ext = isExternal(props.href);
  return h('a', { ...props, target: ext ? '_blank' : props.target, rel: ext ? 'noopener noreferrer' : props.rel }, ...kids);
}
const reveal = (el, i = 0) => { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', i); return el; };
const alt = (src, fallback) => content.alts?.[src] || fallback;

/* ------------------------------------------------------------------ state */
let content = JSON.parse(document.getElementById('boot').textContent);
let route = parseRoute(location.pathname);
let cleanups = [];
let trackers = [];
let scene = null;
let els = {};
let lastFetch = Date.now();

function parseRoute(path) {
  if (path === '/' || path === '/index.html') return { name: 'home' };
  const m = /^\/work\/([a-z0-9-]+)\/?$/.exec(path);
  return m ? { name: 'project', slug: m[1] } : { name: 'notfound' };
}

/* ------------------------------------------------------------------ theme + branding */
function resolvedTheme() {
  const t = root.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
function syncTheme() {
  const t = resolvedTheme();
  root.setAttribute('data-resolved-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'light' ? '#eef0f3' : '#090b0e');
  scene?.refreshPalette();
  if (els.themeBtn) updateThemeButton();
}
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', syncTheme);
function updateThemeButton() {
  const light = resolvedTheme() === 'light';
  els.themeBtn.replaceChildren(icon(light ? 'moon' : 'sun'));
  els.themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
}
function toggleTheme() {
  const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  store.set('tg-theme', next);
  syncTheme();
}
function applyBranding() {
  const rgb = hexToRgb(content.site.accentColor);
  root.style.setProperty('--accent', content.site.accentColor && /^#/.test(content.site.accentColor) ? content.site.accentColor : '#8aa4c0');
  root.style.setProperty('--accent-rgb', rgb);
  syncTheme();
}
function updateMeta() {
  const { site } = content;
  const p = route.name === 'project' ? content.projects.find((x) => x.slug === route.slug) : null;
  document.title = p ? `${p.title} — ${site.name}` : route.name === 'notfound' ? `Page not found — ${site.name}` : site.title || site.name;
  const d = document.querySelector('meta[name="description"]');
  if (d) d.setAttribute('content', p ? p.summary || site.description : site.description);
}

/* ------------------------------------------------------------------ mockups (illustrations generated from project data) */
function stageStyle(p) {
  return { '--ac': hexToRgb(p.accent), '--ac-solid': /^#/.test(p.accent || '') ? p.accent : 'var(--accent)' };
}

function Mockup(p) {
  if (p.cover) {
    return h('div', { class: 'framed-img' }, h('img', { src: p.cover, alt: alt(p.cover, `${p.title} preview`), loading: 'lazy', decoding: 'async' }));
  }
  const f = p.features || [];
  const label = h('span', { class: 'mock-label', text: 'Illustrative interface' });
  if (p.mockup === 'phone') {
    return h('div', { style: { display: 'contents' } },
      h('div', { class: 'phone', role: 'img', 'aria-label': `Illustration of the ${p.title} app interface` },
        h('div', { class: 'phone-screen' },
          h('div', { class: 'phone-top' }, h('div', { class: 'avatar' }), h('div', {}, h('strong', { text: p.title }), h('small', { text: p.subtitle || 'Online' }))),
          h('div', { class: 'bubbles' },
            h('div', { class: 'bubble' }), h('div', { class: 'bubble me w2' }), h('div', { class: 'bubble w4' }),
            h('div', { class: 'bubble me w3' }), h('div', { class: 'typing' }, h('i'), h('i'), h('i'))),
          h('div', { class: 'phone-input' }, h('span', { text: f[0] || 'Message' }), h('i')))),
      label);
  }
  if (p.mockup === 'screens') {
    const t = [f[0] || 'Discover', f[4] || f[1] || 'Messages', f[3] || f[2] || 'Projects'];
    const rows = (n) => Array.from({ length: n }, () => h('div', { class: 's-row' }, h('i'), h('b'), h('b')));
    const screen = (title, body) => h('div', { class: 'phone', 'aria-hidden': 'true' }, h('div', { class: 'phone-screen', style: { 'grid-template-rows': '1fr' } }, h('div', {}, h('div', { class: 's-title', text: title }), h('div', { class: 's-body' }, body))));
    return h('div', { style: { display: 'contents' } },
      h('div', { class: 'screens', role: 'img', 'aria-label': `Illustration of several ${p.title} screens` },
        screen(t[0], [h('div', { class: 's-search' }), rows(4)]),
        screen(t[1], [h('div', { class: 's-search' }), rows(5)]),
        screen(t[2], [h('div', { class: 's-cols' }, h('div', {}, h('div', { class: 's-card a' }), h('div', { class: 's-card' }), h('div', { class: 's-card' })), h('div', {}, h('div', { class: 's-card' }), h('div', { class: 's-card a' }), h('div', { class: 's-card' }))), rows(2)])),
      label);
  }
  const navItems = f.slice(0, 3).map((x) => x.split(' ')[0]);
  return h('div', { style: { display: 'contents' } },
    h('div', { class: 'browser', role: 'img', 'aria-label': `Illustration of the ${p.title} website` },
      h('div', { class: 'browser-bar' }, h('i'), h('i'), h('i'), h('b', { text: p.title })),
      h('div', { class: 'site-nav' }, h('strong', { text: p.title }), navItems.map((x) => h('span', { text: x })), h('span', { text: 'Contact' })),
      h('div', { class: 'site-hero' }, h('h4', { text: p.subtitle || p.title }), h('p', { text: (p.summary || '').slice(0, 70) }), h('em', { text: f[2] ? f[2].split(' ').slice(0, 2).join(' ') : 'Learn more' })),
      h('div', { class: 'site-cards' }, (f.slice(3, 6).length ? f.slice(3, 6) : f.slice(0, 3)).map((x) => h('div', { text: x })))),
    label);
}

/* ------------------------------------------------------------------ chrome: nav, menu, footer */
function Brand() {
  const { site } = content;
  return A({ class: 'brand', href: '/', 'aria-label': `${site.name} — home` },
    site.logo
      ? h('img', { src: site.logo, alt: '', width: 26, height: 26 })
      : h('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linejoin': 'round' },
          ...[['path', { d: 'M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z' }], ['path', { d: 'M12 21.5V12M12 12L3.5 7.4M12 12l8.5-5.100', opacity: '.55' }]].map(([t, a]) => {
            const n = document.createElementNS('http://www.w3.org/2000/svg', t);
            Object.entries(a).forEach(([k, v]) => n.setAttribute(k, v));
            return n;
          })),
    h('span', { text: site.name.toUpperCase() }));
}

function Nav() {
  const { site, nav } = content;
  els.themeBtn = h('button', { class: 'icon-btn', type: 'button', onclick: toggleTheme });
  els.menuBtn = h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': 'menu', onclick: openMenu }, icon('menu', { size: 22 }));
  els.navLinks = h('nav', { class: 'nav-links', 'aria-label': 'Primary' }, nav.map((n) => A({ href: n.href, text: n.label })));
  els.nav = h('header', { class: 'nav', id: 'nav' },
    h('div', { class: 'nav-bar glass' },
      Brand(), els.navLinks,
      h('div', { class: 'nav-actions' },
        els.themeBtn,
        site.navCtaLabel ? A({ class: 'btn primary small nav-cta magnetic', href: site.navCtaHref || '#contact', text: site.navCtaLabel }) : null,
        els.menuBtn)));
  updateThemeButton();
  return els.nav;
}

function Menu() {
  const { site, nav } = content;
  els.menu = h('div', { class: 'menu-overlay glass', id: 'menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    h('button', { class: 'icon-btn menu-close', type: 'button', 'aria-label': 'Close menu', onclick: closeMenu }, icon('close', { size: 24 })),
    nav.map((n, i) => A({ class: 'm-link', href: n.href, text: n.label, style: { 'transition-delay': `${80 + i * 45}ms` } })),
    site.navCtaLabel ? A({ class: 'btn primary', href: site.navCtaHref || '#contact', text: site.navCtaLabel }) : null);
  els.menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  els.menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return closeMenu();
    if (e.key !== 'Tab') return;
    const f = [...els.menu.querySelectorAll('a, button')];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  return els.menu;
}
function openMenu() {
  els.menu.classList.add('open');
  document.body.classList.add('menu-open');
  els.menuBtn.setAttribute('aria-expanded', 'true');
  els.main?.setAttribute('inert', '');
  els.menu.querySelector('.menu-close').focus();
}
function closeMenu() {
  if (!els.menu?.classList.contains('open')) return;
  els.menu.classList.remove('open');
  document.body.classList.remove('menu-open');
  els.menuBtn.setAttribute('aria-expanded', 'false');
  els.main?.removeAttribute('inert');
  els.menuBtn.focus({ preventScroll: true });
}

function Footer() {
  const { site, footer } = content;
  const year = new Date().getFullYear();
  els.footer = h('footer', { class: 'footer' },
    h('div', { class: 'wrap' },
      h('div', { class: 'footer-grid' },
        h('div', {}, Brand(), footer.text ? h('p', { text: footer.text }) : null),
        h('nav', { 'aria-label': 'Footer' }, (footer.links || []).map((l) => A({ href: l.href, text: l.label }))),
        footer.showBackToTop !== false ? h('a', { class: 'btn small', href: '#top' }, icon('up', { size: 16 }), 'Back to top') : null),
      h('p', { class: 'copy', text: (footer.copyright || '© {year} ' + site.name).replace('{year}', year) })));
  return els.footer;
}

/* ------------------------------------------------------------------ home sections */
function Hero() {
  const { hero, site } = content;
  const words = site.name.toUpperCase().split(' ');
  const text = words.length > 1 ? `${words[0]}\n${words.slice(1).join(' ')}` : words[0];
  const layer = (cls) => h('span', { class: `layer ${cls}`, text });
  const wm = h('div', { class: 'wordmark', 'aria-hidden': 'true' }, ['b4', 'b3', 'b2', 'b1'].map((c) => h('span', { class: `layer back ${c}`, text })), layer('front'));
  els.wordmark = wm;
  const canvas = hero.scene3d !== 'off' && !navigator.connection?.saveData ? h('canvas', { class: 'hero-canvas', 'aria-hidden': 'true' }) : null;
  els.heroCanvas = canvas;
  return h('section', { id: 'top', class: 'hero' },
    hero.heroImage ? h('div', { class: 'hero-image' }, h('img', { src: hero.heroImage, alt: '', decoding: 'async' })) : null,
    canvas,
    h('div', { class: 'wrap hero-inner' },
      h('p', { class: 'eyebrow', style: { '--i': 0 }, text: hero.eyebrow || site.tagline }),
      h('div', { class: 'wordmark-stage reveal-line', style: { '--i': 1 } }, wm),
      h('h1', { class: 'reveal-line', style: { '--i': 2 }, text: hero.headline }),
      h('p', { class: 'lead reveal-line', style: { '--i': 3 }, text: hero.description }),
      h('div', { class: 'hero-cta reveal-line', style: { '--i': 4 } },
        hero.ctaPrimaryLabel ? A({ class: 'btn primary magnetic', href: hero.ctaPrimaryHref || '#work' }, hero.ctaPrimaryLabel, icon('arrow', { size: 18, cls: 'arrow' })) : null,
        hero.ctaSecondaryLabel ? A({ class: 'btn magnetic', href: hero.ctaSecondaryHref || '#contact', text: hero.ctaSecondaryLabel }) : null)),
    h('div', { class: 'scroll-hint', 'aria-hidden': 'true' }, h('span', { text: 'Scroll' }), h('i')));
}

function About() {
  const a = content.about;
  const items = (a.flow || []).map((t, i) => h('li', {}, h('b', { text: String(i + 1) }), h('span', { text: t })));
  const flow = h('div', { class: 'flow glass', 'aria-label': 'Development flow' }, h('div', { class: 'flow-line' }, h('i')), h('ol', {}, items));
  trackers.push(() => trackProgress(flow, items));
  return h('section', { id: 'about' },
    h('div', { class: 'wrap about-grid' },
      h('div', {},
        reveal(h('p', { class: 'eyebrow', text: 'About' })),
        reveal(h('h2', { class: 'h2', style: { 'margin-top': '18px' }, text: a.headline }), 1),
        reveal(h('p', { class: 'lead', style: { 'margin-top': '22px' }, text: a.body }), 2),
        reveal(h('ul', { class: 'chips', 'aria-label': 'What we combine' }, (a.capabilities || []).map((c) => h('li', { class: 'chip', text: c }))), 3)),
      reveal(flow, 2)));
}

function Services() {
  const items = content.services.map((s, i) => {
    const panelId = `svc-panel-${s.id}`;
    const panel = h('div', { class: 'more-panel', id: panelId }, h('div', {}, h('p', { text: s.details || '' })));
    const btn = h('button', { class: 'more', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId }, 'Details', icon('chevron', { size: 16 }));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      panel.classList.toggle('open', open);
    });
    return reveal(h('article', { class: 'service glass', 'data-tilt': '' },
      h('span', { class: 'icon-wrap' }, icon(s.icon || 'cube', { size: 22 })),
      h('h3', { text: s.title }), h('p', { text: s.description }),
      s.details ? [btn, panel] : null), i % 3);
  });
  return h('section', { id: 'services' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sec-head' }, reveal(h('p', { class: 'eyebrow', text: 'Services' })), reveal(h('h2', { class: 'h2', text: 'What we build' }), 1)),
      h('div', { class: 'services-grid' }, items)));
}

function projectHref(p) { return `/work/${p.slug}`; }

function Work() {
  const all = content.projects;
  const featured = all.filter((p) => p.featured);
  const rest = featured.length ? all.filter((p) => !p.featured) : all;
  const lead = featured.length ? featured : [];
  const stageOf = (p) => h('a', { class: 'stage glass', href: projectHref(p), 'aria-label': `Open ${p.title}`, tabindex: '-1', 'data-tilt': '', style: stageStyle(p) }, Mockup(p));
  return h('section', { id: 'work' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sec-head' },
        reveal(h('p', { class: 'eyebrow', text: 'Selected work' })),
        reveal(h('h2', { class: 'h2', text: 'Products, platforms and websites.' }), 1),
        reveal(h('p', { class: 'lead', text: 'A selection of what Trossachs Group has designed and built, from AI companions to business websites.' }), 2)),
      lead.map((p) => reveal(h('article', { class: 'pf' },
        h('div', { class: 'pf-copy' },
          h('p', { class: 'eyebrow', text: [p.status, p.category].filter(Boolean).join(' · ') }),
          h('h3', { text: p.title }),
          p.subtitle ? h('p', { class: 'sub', text: p.subtitle }) : null,
          h('p', { class: 'lead', text: p.summary }),
          h('ul', { class: 'tags', 'aria-label': 'Technology and approach' }, (p.technologies || []).slice(0, 5).map((t) => h('li', { class: 'tag', text: t }))),
          h('div', {}, A({ class: 'btn primary magnetic', href: projectHref(p) }, 'View project', icon('arrow', { size: 18, cls: 'arrow' })))),
        stageOf(p)))),
      rest.length ? h('div', { class: 'more-work' }, rest.map((p, i) => reveal(h('a', { class: 'pc glass', href: projectHref(p), 'aria-label': `${p.title} — ${p.category || 'project'}` },
        h('div', { class: 'stage', style: stageStyle(p), 'aria-hidden': 'true' }, Mockup(p)),
        h('div', { class: 'copy' }, h('p', { class: 'eyebrow', text: [p.status, p.category].filter(Boolean).join(' · ') }), h('h3', { text: p.title }), h('p', { text: p.summary }))), i % 2))) : null));
}

function AI() {
  const ai = content.ai;
  return h('section', { id: 'ai' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sec-head' },
        reveal(h('p', { class: 'eyebrow', text: ai.eyebrow || 'AI & Technology' })),
        reveal(h('h2', { class: 'h2', text: ai.headline }), 1),
        reveal(h('p', { class: 'lead', text: ai.intro }), 2)),
      h('div', { class: 'ai-grid' }, (ai.topics || []).map((t, i) => reveal(h('div', { class: 'ai-item' }, h('h3', {}, h('span', { text: String(i + 1).padStart(2, '0') }), t.title), h('p', { text: t.text })), i % 3))),
      ai.note ? reveal(h('p', { class: 'fine', text: ai.note })) : null));
}

function Philosophy() {
  const ph = content.philosophy;
  return h('section', { id: 'philosophy', class: 'phil' },
    h('div', { class: 'wrap' },
      reveal(h('p', { class: 'eyebrow', text: ph.eyebrow || 'Philosophy' })),
      reveal(h('h2', { class: 'h2', style: { 'margin-top': '18px', 'max-width': '16ch' }, text: ph.headline }), 1),
      h('div', { class: 'phil-grid' }, content.principles.map((p, i) => reveal(h('div', { class: 'principle' }, h('h3', { text: p.title }), h('p', { text: p.description })), i)))));
}

function Process() {
  const steps = content.process.map((s, i) => h('li', { class: 'step' }, h('span', { class: 'num', text: String(i + 1).padStart(2, '0') }), h('div', {}, h('h3', { text: s.title }), h('p', { text: s.description }))));
  const tl = h('ol', { class: 'timeline' }, h('div', { class: 'timeline-line', 'aria-hidden': 'true' }, h('i')), steps);
  trackers.push(() => trackProgress(tl, steps));
  return h('section', { id: 'process' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sec-head' }, reveal(h('p', { class: 'eyebrow', text: 'Process' })), reveal(h('h2', { class: 'h2', text: 'From first conversation to launch, and beyond.' }), 1)),
      tl));
}

function Stack() {
  const st = content.stack;
  const groups = new Map();
  (st.items || []).forEach((i) => { const g = i.group || 'Tools'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(i.name); });
  return h('section', { id: 'stack' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sec-head' },
        reveal(h('p', { class: 'eyebrow', text: st.eyebrow || 'Toolbox' })),
        reveal(h('h2', { class: 'h2', text: st.headline }), 1),
        st.note ? reveal(h('p', { class: 'lead', text: st.note }), 2) : null),
      h('div', { class: 'stack-groups' }, [...groups].map(([g, names], i) => reveal(h('div', {}, h('h3', { text: g }), h('ul', { class: 'chips', style: { 'margin-top': '0' } }, names.map((n) => h('li', { class: 'chip', text: n })))), i)))));
}

function Developer() {
  const a = content.about;
  const initials = (a.developerName || content.site.name).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return h('section', { id: 'developer' },
    h('div', { class: 'wrap' },
      reveal(h('div', { class: 'dev glass' },
        h('div', { class: 'portrait' }, a.developerImage ? h('img', { src: a.developerImage, alt: alt(a.developerImage, a.developerName), loading: 'lazy', decoding: 'async' }) : h('span', { 'aria-hidden': 'true', text: initials })),
        h('div', {},
          h('p', { class: 'eyebrow', text: a.developerHeadline || 'The developer' }),
          h('h3', { style: { 'margin-top': '14px' }, text: a.developerName }),
          h('p', { class: 'role', text: a.developerTitle }),
          h('p', { class: 'bio', text: a.developerBio }),
          (a.experience || []).length ? [h('h4', { text: 'Experience building' }), h('ul', { class: 'chips' }, a.experience.map((x) => h('li', { class: 'chip', text: x })))] : null)))));
}

/* ------------------------------------------------------------------ contact */
function Contact() {
  const c = content.contact;
  const links = [
    c.email && { icon: 'mail', label: c.email, href: `mailto:${c.email}` },
    c.phone && { icon: 'phone', label: c.phone, href: `tel:${c.phone.replace(/[^+\d]/g, '')}` },
    c.upwork && { icon: 'briefcase', label: 'Upwork', href: c.upwork },
    c.linkedin && { icon: 'linkedin', label: 'LinkedIn', href: c.linkedin },
    c.github && { icon: 'github', label: 'GitHub', href: c.github },
  ].filter(Boolean);
  return h('section', { id: 'contact' },
    h('div', { class: 'wrap contact-grid' },
      h('div', {},
        reveal(h('p', { class: 'eyebrow', text: c.eyebrow || 'Contact' })),
        reveal(h('h2', { class: 'h2', style: { 'margin-top': '18px' }, text: c.headline }), 1),
        c.intro ? reveal(h('p', { class: 'lead', style: { 'margin-top': '20px' }, text: c.intro }), 2) : null,
        links.length ? reveal(h('div', { class: 'contact-links' }, links.map((l) => A({ href: l.href }, icon(l.icon), h('span', { text: l.label })))), 3) : null),
      reveal(c.formEnabled === false ? h('div', { class: 'form glass' }, h('p', { class: 'lead', text: 'The project form is paused right now. Please use the contact details to get in touch.' })) : ContactForm(c), 2)));
}

function Field(id, label, control, opts = {}) {
  return h('div', { class: 'field' },
    h('label', { for: id }, label, opts.optional ? h('small', { text: ' (optional)' }) : null),
    control,
    h('p', { class: 'err', id: `${id}-err`, 'aria-live': 'polite' }));
}

function ContactForm(c) {
  const input = (id, type, extra = {}) => h('input', { id, name: id, type, autocomplete: extra.autocomplete, maxlength: extra.max || 200, required: extra.required, 'aria-describedby': `${id}-err` });
  const select = (id, options, placeholder) => h('select', { id, name: id }, h('option', { value: '', text: placeholder }), options.map((o) => h('option', { value: o, text: o })));
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn primary magnetic', type: 'submit' }, c.submitLabel || 'Send Project Brief', icon('arrow', { size: 18, cls: 'arrow' }));
  const form = h('form', { class: 'form glass', novalidate: '', 'aria-label': 'Project brief' },
    h('div', { class: 'row two' },
      Field('name', 'Name', input('name', 'text', { autocomplete: 'name', required: true, max: 120 })),
      Field('email', 'Email', input('email', 'email', { autocomplete: 'email', required: true }))),
    h('div', { class: 'row two' },
      Field('company', 'Company', input('company', 'text', { autocomplete: 'organization', max: 160 }), { optional: true }),
      Field('type', 'Project type', select('type', c.projectTypes || [], 'Select a type'), { optional: true })),
    Field('budget', 'Budget range', select('budget', c.budgetRanges || [], 'Select a range'), { optional: true }),
    Field('description', 'Project description', h('textarea', { id: 'description', name: 'description', required: true, maxlength: 5000, placeholder: 'What would you like to build, and who is it for?', 'aria-describedby': 'description-err' })),
    h('div', { class: 'hp', 'aria-hidden': 'true' }, h('label', { for: 'website', text: 'Leave this empty' }), h('input', { id: 'website', name: 'website', tabindex: '-1', autocomplete: 'off' })),
    h('div', {}, submit), status);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll('.err').forEach((n) => (n.textContent = ''));
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
    status.textContent = ''; status.classList.remove('error');
    const data = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!data.name || data.name.trim().length < 2) errors.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email || '')) errors.email = 'Please enter a valid email address.';
    if (!data.description || data.description.trim().length < 10) errors.description = 'Please describe your project in a few words.';
    const show = (errs) => {
      Object.entries(errs).forEach(([k, v]) => { const n = form.querySelector(`#${k}-err`); if (n) n.textContent = v; form.querySelector(`#${k}`)?.setAttribute('aria-invalid', 'true'); });
      form.querySelector('[aria-invalid="true"]')?.focus();
    };
    if (Object.keys(errors).length) return show(errors);
    submit.disabled = true;
    status.textContent = 'Sending…';
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tg' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const ok = h('div', { class: 'success glass', role: 'status', tabindex: '-1' },
          h('span', { class: 'tick' }, icon('check', { size: 26 })), h('h3', { text: 'Brief received' }), h('p', { class: 'lead', text: body.message || c.successMessage || 'Thank you.' }));
        form.replaceWith(ok); ok.focus();
        return;
      }
      if (res.status === 422 && body.fields) { status.textContent = body.error || ''; status.classList.add('error'); return show(body.fields); }
      throw new Error(body.error || 'Something went wrong.');
    } catch (err) {
      status.textContent = `${err.message} Please try again, or use the contact details instead.`;
      status.classList.add('error');
    } finally {
      submit.disabled = false;
    }
  });
  return form;
}

/* ------------------------------------------------------------------ project detail */
function ProjectView(p) {
  const list = content.projects;
  const i = list.findIndex((x) => x.id === p.id);
  const prev = list.length > 1 ? list[(i - 1 + list.length) % list.length] : null;
  const next = list.length > 1 ? list[(i + 1) % list.length] : null;
  const fact = (title, ...body) => (body.flat().filter(Boolean).length ? h('div', { class: 'fact' }, h('h2', { text: title }), h('div', {}, body)) : null);
  const dlg = h('dialog', { class: 'lightbox', 'aria-label': 'Image preview' });
  const dlgImg = h('img', { alt: '' });
  const closeBtn = h('button', { type: 'button', 'aria-label': 'Close preview', onclick: () => dlg.close() }, icon('close', { size: 28 }));
  dlg.append(closeBtn, dlgImg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  const openImg = (src) => { dlgImg.src = src; dlgImg.alt = alt(src, `${p.title} image`); dlg.showModal(); };

  return h('article', { class: 'detail' },
    h('div', { class: 'wrap' },
      h('div', { class: 'detail-top' },
        A({ class: 'back-link', href: '/#work' }, icon('back', { size: 18 }), 'All work'),
        h('p', { class: 'eyebrow', text: [p.status, p.category].filter(Boolean).join(' · ') })),
      h('h1', { text: p.title }),
      p.subtitle ? h('p', { class: 'eyebrow', style: { 'margin-bottom': '18px' }, text: p.subtitle }) : null,
      h('p', { class: 'lead', text: p.summary }),
      h('div', { class: 'stage glass', style: stageStyle(p), 'data-tilt': '' }, Mockup(p)),
      h('div', { class: 'facts' },
        fact('Project type', h('p', { text: [p.category, p.status].filter(Boolean).join(' — ') })),
        fact('Challenge', p.challenge && h('p', { text: p.challenge })),
        fact('Solution', p.solution && h('p', { text: p.solution })),
        fact('Technology / approach', (p.technologies || []).length ? h('ul', { class: 'tags', style: { 'margin-bottom': '16px' } }, p.technologies.map((t) => h('li', { class: 'tag', text: t }))) : null, p.approach && h('p', { text: p.approach })),
        fact('Features', (p.features || []).length ? h('ul', { class: 'feat' }, p.features.map((x) => h('li', {}, icon('check', { size: 16 }), h('span', { text: x })))) : null),
        fact('Development process', p.process && h('p', { text: p.process })),
        fact('Outcome', p.outcome && h('p', { text: p.outcome })),
        (p.gallery || []).length || p.videoUrl
          ? fact('Gallery',
              (p.gallery || []).length ? h('div', { class: 'gallery' }, p.gallery.map((src) => h('button', { type: 'button', 'aria-label': 'Enlarge image', onclick: () => openImg(src) }, h('img', { src, alt: alt(src, `${p.title} image`), loading: 'lazy', decoding: 'async' })))) : null,
              p.videoUrl ? h('p', { style: { 'margin-top': '16px' } }, A({ class: 'btn', href: p.videoUrl }, 'Watch the video', icon('external', { size: 16 }))) : null)
          : null),
      prev && next ? h('nav', { class: 'pn', 'aria-label': 'More projects' },
        A({ class: 'glass prev', href: projectHref(prev) }, h('small', {}, icon('back', { size: 14 }), 'Previous project'), h('strong', { text: prev.title })),
        A({ class: 'glass next', href: projectHref(next) }, h('small', {}, 'Next project', icon('arrow', { size: 14 })), h('strong', { text: next.title }))) : null,
      dlg));
}

function NotFound() {
  return h('div', { class: 'wrap nf' }, h('p', { class: 'eyebrow', text: '404' }), h('h1', { text: 'Page not found' }),
    h('p', { class: 'lead', text: 'That page does not exist, or the project has been removed.' }),
    h('div', {}, A({ class: 'btn primary', href: '/' }, icon('back', { size: 18 }), 'Back to home')));
}

/* ------------------------------------------------------------------ rendering + behaviour */
function renderMain() {
  teardownMain();
  const main = els.main;
  main.replaceChildren();
  if (route.name === 'home') {
    main.append(Hero(), About(), Services(), Work(), AI(), Philosophy(), Process(), Stack(), Developer(), Contact());
  } else if (route.name === 'project') {
    const p = content.projects.find((x) => x.slug === route.slug);
    main.append(p ? ProjectView(p) : NotFound());
  } else {
    main.append(NotFound());
  }
  setupMain();
}

function teardownMain() {
  scene?.stop(); scene = null;
  trackers = [];
  cleanups.splice(0).forEach((fn) => fn());
}

function setupMain() {
  const main = els.main;
  // reveal on scroll
  const items = main.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) items.forEach((n) => n.classList.add('in'));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((n) => io.observe(n));
    cleanups.push(() => io.disconnect());
  }
  // 3D scene
  if (route.name === 'home' && els.heroCanvas) {
    scene = startScene(els.heroCanvas, { intensity: content.hero.sceneIntensity === 'low' ? 'low' : 'normal', onFallback: () => {} });
  }
  // wordmark tilt follows the pointer
  if (els.wordmark && canHover && !reduceMotion) {
    let raf = 0;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        els.wordmark.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
        els.wordmark.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    cleanups.push(() => removeEventListener('pointermove', move));
  }
  // card tilt + magnetic buttons (fine pointers only)
  if (canHover && !reduceMotion) {
    main.querySelectorAll('[data-tilt]').forEach((n) => {
      n.addEventListener('pointermove', (e) => {
        const r = n.getBoundingClientRect();
        n.style.setProperty('--ty', `${(((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2)}deg`);
        n.style.setProperty('--tx', `${(-((e.clientY - r.top) / r.height - 0.5) * 7).toFixed(2)}deg`);
      });
      n.addEventListener('pointerleave', () => { n.style.setProperty('--tx', '0deg'); n.style.setProperty('--ty', '0deg'); });
    });
    document.querySelectorAll('.magnetic').forEach(attachMagnet);
  }
  // active nav link
  if (route.name === 'home' && 'IntersectionObserver' in window) {
    const links = [...els.navLinks.querySelectorAll('a')];
    const secs = main.querySelectorAll('section[id]');
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => (l.getAttribute('href') === `#${e.target.id}` ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  } else {
    els.navLinks?.querySelectorAll('a').forEach((l) => l.removeAttribute('aria-current'));
  }
  update();
}

function attachMagnet(el) {
  if (el.dataset.magnet) return;
  el.dataset.magnet = '1';
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${clamp((e.clientX - r.left - r.width / 2) * 0.18, -8, 8)}px, ${clamp((e.clientY - r.top - r.height / 2) * 0.28, -6, 6)}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

function trackProgress(container, items) {
  const r = container.getBoundingClientRect();
  const vh = innerHeight;
  const p = reduceMotion ? 1 : clamp((vh * 0.68 - r.top) / (r.height + vh * 0.05), 0, 1);
  container.style.setProperty('--p', p.toFixed(3));
  items.forEach((it) => it.classList.toggle('on', reduceMotion || it.getBoundingClientRect().top < vh * 0.7));
}

let ticking = false;
function update() {
  ticking = false;
  els.nav?.classList.toggle('compact', scrollY > 30);
  trackers.forEach((t) => t());
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener('resize', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } });

function renderApp({ keepScroll = false } = {}) {
  const y = scrollY;
  teardownMain();
  const app = document.getElementById('app');
  app.replaceChildren();
  applyBranding();
  els.main = h('main', { id: 'main', tabindex: '-1' });
  app.append(Nav(), Menu(), els.main, Footer());
  renderMain();
  updateMeta();
  syncTheme();
  if (keepScroll) window.scrollTo({ top: y, behavior: 'instant' });
}

/* ------------------------------------------------------------------ routing */
function scrollToHash(hash) {
  if (hash && hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); return; }
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function transition(fn) {
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(fn);
  else fn();
}

function go(to, { replace = false, popstate = false } = {}) {
  const url = new URL(to, location.origin);
  const next = parseRoute(url.pathname);
  const same = route.name === next.name && route.slug === next.slug;
  closeMenu();
  if (!popstate) history[replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search + url.hash);
  if (same) { scrollToHash(url.hash); return; }
  route = next;
  transition(() => {
    renderMain();
    updateMeta();
    scrollToHash(url.hash);
    els.main.focus({ preventScroll: true });
  });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target === '_blank' || a.hasAttribute('download')) return;
  const raw = a.getAttribute('href');
  if (raw.startsWith('#')) {
    if (route.name !== 'home') { e.preventDefault(); go('/' + raw); }
    else if (raw === '#top') { e.preventDefault(); scrollToHash(''); history.replaceState({}, '', location.pathname); }
    return;
  }
  let url;
  try { url = new URL(a.href, location.href); } catch { return; }
  if (url.origin !== location.origin || /^\/(admin|api|uploads)(\/|$)/.test(url.pathname)) return;
  if (!/^\/(work\/[a-z0-9-]+\/?)?$/.test(url.pathname) && url.pathname !== '/index.html') return;
  e.preventDefault();
  go(url.pathname + url.hash);
});
addEventListener('popstate', () => go(location.pathname + location.hash, { popstate: true }));

/* Keep the page current: when the tab regains focus, pick up anything saved in the dashboard. */
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || Date.now() - lastFetch < 15000) return;
  lastFetch = Date.now();
  try {
    const res = await fetch('/api/content', { cache: 'no-store' });
    if (!res.ok) return;
    const next = await res.json();
    if (JSON.stringify(next) !== JSON.stringify(content)) { content = next; renderApp({ keepScroll: true }); }
  } catch { /* offline: keep what is on screen */ }
});

/* ------------------------------------------------------------------ boot */
function finishIntro() {
  const loader = document.getElementById('loader');
  const done = () => { document.body.classList.add('ready'); loader?.classList.add('done'); setTimeout(() => loader?.remove(), 900); };
  if (reduceMotion || store.get('tg-intro') || route.name !== 'home') { loader?.remove(); document.body.classList.add('ready'); return; }
  setTimeout(() => { done(); store.set('tg-intro', '1'); }, 1100);
}

try {
  renderApp();
  if (location.hash && route.name === 'home') setTimeout(() => scrollToHash(location.hash), 60);
  finishIntro();
} catch (err) {
  console.error(err);
  document.getElementById('loader')?.remove();
  document.body.classList.add('ready');
}
