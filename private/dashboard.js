import { icon, SERVICE_ICONS } from '/assets/icons.js';

/* ------------------------------------------------------------ helpers */
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
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

async function api(method, url, body) {
  const opts = { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'tg' } };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = '/admin/login'; throw new Error('Signed out'); }
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

function toast(msg, error = false) {
  const t = h('div', { class: `toast${error ? ' error' : ''}`, text: msg });
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), error ? 6000 : 3200);
}
const fail = (e) => toast(e.message || 'Something went wrong', true);

/* ------------------------------------------------------------ schema */
const T = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const TA = (key, label, extra = {}) => ({ key, label, type: 'textarea', ...extra });
const IMG = (key, label, extra = {}) => ({ key, label, type: 'image', ...extra });
const LINES = (key, label, extra = {}) => ({ key, label, type: 'lines', hint: 'One per line', ...extra });
const SEL = (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra });
const BOOL = (key, label, extra = {}) => ({ key, label, type: 'bool', ...extra });

const SECTIONS = [
  { group: 'Content' },
  { id: 'site', label: 'Site settings', icon: 'sliders', kind: 'single', desc: 'Name, branding, theme and the navigation button.', fields: [
    T('name', 'Company name'), T('tagline', 'Tagline'),
    T('title', 'Browser / search title', { span: 2 }), TA('description', 'Site description (search and sharing)', { span: 2 }),
    IMG('logo', 'Logo'), IMG('favicon', 'Favicon'), IMG('ogImage', 'Social sharing image'),
    { key: 'accentColor', label: 'Accent colour', type: 'color', fallback: '#8aa4c0' },
    SEL('defaultTheme', 'Default theme', [['system', 'Follow the visitor’s device'], ['light', 'Light'], ['dark', 'Dark']]),
    T('navCtaLabel', 'Navigation button label'), T('navCtaHref', 'Navigation button link'),
  ] },
  { id: 'hero', label: 'Hero', icon: 'home', kind: 'single', desc: 'The opening section, call-to-action buttons and 3D scene.', fields: [
    T('eyebrow', 'Small line above the name', { span: 2 }), T('headline', 'Headline', { span: 2 }), TA('description', 'Supporting text', { span: 2 }),
    T('ctaPrimaryLabel', 'Primary button label'), T('ctaPrimaryHref', 'Primary button link'),
    T('ctaSecondaryLabel', 'Secondary button label'), T('ctaSecondaryHref', 'Secondary button link'),
    IMG('heroImage', 'Background image (optional)'),
    SEL('scene3d', '3D scene', [['full', 'On'], ['off', 'Off']]),
    SEL('sceneIntensity', '3D detail level', [['normal', 'Normal'], ['low', 'Lighter (better for slow devices)']]),
  ] },
  { id: 'about', label: 'About & developer', icon: 'user', kind: 'single', desc: 'Company description, development flow and the developer profile.', fields: [
    T('headline', 'Headline', { span: 2 }), TA('body', 'Company description', { span: 2 }),
    LINES('capabilities', 'Capability chips'), LINES('flow', 'Development flow steps'),
    T('developerHeadline', 'Developer section label'), T('developerName', 'Developer name'), T('developerTitle', 'Developer title'),
    IMG('developerImage', 'Developer photo'), TA('developerBio', 'Developer bio', { span: 2 }), LINES('experience', 'Experience building', { span: 2 }),
  ] },
  { id: 'services', label: 'Services', icon: 'grid', kind: 'collection', desc: 'Add, edit, reorder and remove services.', itemName: 'service', fields: [
    T('title', 'Title', { span: 2 }), { key: 'icon', label: 'Icon', type: 'select', options: SERVICE_ICONS.map((i) => [i, i]) },
    TA('description', 'Short description', { span: 2 }), TA('details', 'Expandable details', { span: 2 }),
  ] },
  { id: 'projects', label: 'Projects', icon: 'briefcase', kind: 'collection', desc: 'Your portfolio. Featured projects get the large showcase treatment.', itemName: 'project', badge: (i) => (i.featured ? 'Featured' : ''), fields: [
    T('title', 'Title'), T('subtitle', 'Subtitle'), T('category', 'Category / project type'), T('status', 'Status (e.g. Concept, Website)'),
    T('slug', 'URL slug', { hint: 'Used in /work/your-slug. Generated from the title if left blank.' }), { key: 'accent', label: 'Accent colour', type: 'color', fallback: '#8aa4c0' },
    SEL('mockup', 'Illustration style (used when there is no cover image)', [['browser', 'Website'], ['phone', 'Phone app'], ['screens', 'Multiple screens']]), BOOL('featured', 'Featured project'),
    TA('summary', 'Summary', { span: 2 }), LINES('features', 'Features', { span: 2 }), LINES('technologies', 'Technologies', { span: 2 }),
    TA('challenge', 'Challenge', { span: 2 }), TA('solution', 'Solution', { span: 2 }), TA('approach', 'Technology / approach', { span: 2 }),
    TA('process', 'Development process', { span: 2 }), TA('outcome', 'Outcome', { span: 2, hint: 'Describe results honestly. Avoid numbers you cannot back up.' }),
    IMG('cover', 'Cover image / screenshot'), { key: 'gallery', label: 'Gallery images', type: 'images', span: 2 },
    T('videoUrl', 'Video link (optional)', { span: 2 }),
  ] },
  { id: 'ai', label: 'AI & technology', icon: 'spark', kind: 'single', desc: 'The “Building With Intelligence” section.', fields: [
    T('eyebrow', 'Label'), T('headline', 'Headline'), TA('intro', 'Introduction', { span: 2 }),
    { key: 'topics', label: 'Topics', type: 'list', span: 2, itemLabel: 'topic', fields: [T('title', 'Title'), TA('text', 'Description')] },
    TA('note', 'Closing note', { span: 2 }),
  ] },
  { id: 'philosophy', label: 'Philosophy', icon: 'eye', kind: 'single', desc: 'Heading for the philosophy section.', fields: [T('eyebrow', 'Label'), T('headline', 'Headline')] },
  { id: 'principles', label: 'Principles', icon: 'list', kind: 'collection', desc: 'The principles shown under the philosophy heading.', itemName: 'principle', fields: [T('title', 'Title', { span: 2 }), TA('description', 'Description', { span: 2 })] },
  { id: 'process', label: 'Process', icon: 'flow', kind: 'collection', desc: 'The stages of the process timeline.', itemName: 'stage', fields: [T('title', 'Stage name', { span: 2 }), TA('description', 'Description', { span: 2 })] },
  { id: 'stack', label: 'Technology stack', icon: 'code', kind: 'single', desc: 'Only list technologies you genuinely use.', fields: [
    T('eyebrow', 'Label'), T('headline', 'Headline'), TA('note', 'Note', { span: 2 }),
    { key: 'items', label: 'Technologies', type: 'list', span: 2, itemLabel: 'technology', fields: [T('name', 'Name'), T('group', 'Group')] },
  ] },
  { group: 'Site' },
  { id: 'nav', label: 'Navigation', icon: 'nav', kind: 'collection', desc: 'Menu labels, destinations and visibility.', itemName: 'menu item', badge: (i) => (i.visible === false ? 'Hidden' : ''), titleKey: 'label', subKey: 'href', fields: [T('label', 'Label'), T('href', 'Destination', { hint: 'Use #contact for a section, or a full https:// link.' }), BOOL('visible', 'Visible in the menu')] },
  { id: 'contact', label: 'Contact', icon: 'mail', kind: 'single', desc: 'Contact details, social links and form settings.', fields: [
    T('eyebrow', 'Label'), T('headline', 'Headline'), TA('intro', 'Introduction', { span: 2 }),
    T('email', 'Email'), T('phone', 'Phone'), T('upwork', 'Upwork profile URL'), T('linkedin', 'LinkedIn URL'), T('github', 'GitHub URL'),
    T('submitLabel', 'Form button label'), T('successMessage', 'Success message'),
    LINES('projectTypes', 'Project type options'), LINES('budgetRanges', 'Budget range options'), BOOL('formEnabled', 'Accept project briefs through the form'),
  ] },
  { id: 'footer', label: 'Footer', icon: 'footer', kind: 'single', desc: 'Every element of the footer.', fields: [
    TA('text', 'Footer text', { span: 2 }), T('copyright', 'Copyright line', { span: 2, hint: 'Use {year} for the current year.' }),
    { key: 'links', label: 'Footer links', type: 'list', span: 2, itemLabel: 'link', fields: [T('label', 'Label'), T('href', 'Link')] },
    BOOL('showBackToTop', 'Show “Back to top” button'),
  ] },
  { group: 'Manage' },
  { id: 'media', label: 'Images', icon: 'image', kind: 'media' },
  { id: 'messages', label: 'Messages', icon: 'inbox', kind: 'messages' },
  { id: 'account', label: 'Account', icon: 'lock', kind: 'account' },
];

/* ------------------------------------------------------------ state */
const state = { content: {}, media: [], unread: 0, me: {}, uploads: true, view: 'overview', editing: null };

async function refresh() {
  const d = await api('GET', '/api/admin/all');
  state.content = d.content; state.media = d.media; state.unread = d.unread; state.me = d.me; state.uploads = d.uploads !== false;
}

/* ------------------------------------------------------------ modal */
function modal(title, body) {
  const dlg = h('dialog', { class: 'modal', 'aria-label': title });
  dlg.append(h('div', { class: 'modal-head' }, h('h2', { text: title }), h('button', { class: 'ib', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, icon('close'))), h('div', { class: 'modal-body' }, body));
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

async function uploadFiles(files, { onDone } = {}) {
  let n = 0;
  for (const file of files) {
    if (!/^image\//.test(file.type)) { toast(`${file.name}: not an image`, true); continue; }
    if (file.size > 4 * 1024 * 1024) { toast(`${file.name}: larger than 4 MB`, true); continue; }
    const fd = new FormData(); fd.append('file', file, file.name);
    try { const row = await api('POST', '/api/admin/media', fd); state.media.unshift(row); n += 1; } catch (e) { fail(new Error(`${file.name}: ${e.message}`)); }
  }
  if (n) toast(`${n} image${n > 1 ? 's' : ''} uploaded`);
  onDone?.();
}

function pickMedia() {
  return new Promise((resolve) => {
    let chosen = null;
    const grid = h('div', { class: 'pick-grid' });
    const paint = () => {
      grid.replaceChildren(...(state.media.length
        ? state.media.map((m) => h('button', { type: 'button', title: m.original, onclick: () => { chosen = m.url; dlg.close(); } }, h('img', { src: m.url, alt: m.alt || m.original, loading: 'lazy' })))
        : [h('p', { class: 'empty', style: 'grid-column:1/-1', text: 'No images yet. Upload one to get started.' })]));
    };
    const input = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', multiple: true, hidden: true, onchange: () => uploadFiles([...input.files], { onDone: paint }) });
    const dlg = modal('Choose an image', [h('div', { class: 'actions' }, h('button', { class: 'btn small primary', type: 'button', onclick: () => input.click() }, icon('upload', { size: 16 }), 'Upload new'), input), grid]);
    dlg.addEventListener('close', () => resolve(chosen));
    paint();
  });
}

/* ------------------------------------------------------------ field builders: each returns { el, get } */
function buildField(f, value) {
  const id = `f-${f.key}-${Math.random().toString(36).slice(2, 7)}`;
  const wrap = (control, labelFor = true) => h('div', { class: `field${f.span === 2 ? ' span2' : ''}` }, h('label', { for: labelFor ? id : null, text: f.label }), control, f.hint ? h('p', { class: 'hint', text: f.hint }) : null);

  if (f.type === 'bool') {
    const input = h('input', { type: 'checkbox', id }); input.checked = value !== false && !!value;
    if (value === undefined) input.checked = f.key === 'visible' || f.key === 'formEnabled' || f.key === 'showBackToTop';
    return { el: h('div', { class: `field check${f.span === 2 ? ' span2' : ''}` }, input, h('label', { for: id, text: f.label })), get: () => input.checked };
  }
  if (f.type === 'select') {
    const input = h('select', { id }, f.options.map(([v, l]) => h('option', { value: v, text: l })));
    input.value = value ?? f.options[0][0];
    if (input.value !== (value ?? f.options[0][0])) input.value = f.options[0][0];
    return { el: wrap(input), get: () => input.value };
  }
  if (f.type === 'textarea' || f.type === 'lines') {
    const input = h('textarea', { id, maxlength: 6000 });
    input.value = f.type === 'lines' ? (value || []).join('\n') : value || '';
    if (f.type === 'lines') input.style.minHeight = '130px';
    return { el: wrap(input), get: () => (f.type === 'lines' ? input.value.split('\n').map((s) => s.trim()).filter(Boolean) : input.value) };
  }
  if (f.type === 'color') {
    const input = h('input', { type: 'color', id }); input.value = /^#[0-9a-f]{6}$/i.test(value || '') ? value : f.fallback || '#8aa4c0';
    return { el: wrap(input), get: () => input.value };
  }
  if (f.type === 'image') {
    let val = value || '';
    const prev = h('div', { class: 'img-prev' });
    const clear = h('button', { class: 'btn small', type: 'button', onclick: () => { val = ''; paint(); } }, 'Remove');
    const choose = h('button', { class: 'btn small', type: 'button', onclick: async () => { const p = await pickMedia(); if (p) { val = p; paint(); } } }, icon('image', { size: 16 }), 'Choose image');
    const paint = () => { prev.replaceChildren(val ? h('img', { src: val, alt: '' }) : h('span', { text: 'No image' })); clear.hidden = !val; };
    paint();
    return { el: h('div', { class: `field${f.span === 2 ? ' span2' : ''}` }, h('label', { text: f.label }), h('div', { class: 'img-field' }, prev, h('div', { class: 'actions' }, choose, clear))), get: () => val };
  }
  if (f.type === 'images') {
    let vals = [...(value || [])];
    const box = h('div', { class: 'gallery-edit' });
    const add = h('button', { class: 'btn small add-btn', type: 'button', onclick: async () => { const p = await pickMedia(); if (p) { vals.push(p); paint(); } } }, icon('plus', { size: 16 }), 'Add image');
    const paint = () => box.replaceChildren(...vals.map((src, i) => h('div', { class: 'media-card' }, h('img', { src, alt: '' }),
      h('div', { class: 'meta' }, h('div', { class: 'btns' },
        h('button', { class: 'ib', type: 'button', 'aria-label': 'Move earlier', disabled: i === 0, onclick: () => { [vals[i - 1], vals[i]] = [vals[i], vals[i - 1]]; paint(); } }, icon('back', { size: 16 })),
        h('button', { class: 'ib', type: 'button', 'aria-label': 'Move later', disabled: i === vals.length - 1, onclick: () => { [vals[i + 1], vals[i]] = [vals[i], vals[i + 1]]; paint(); } }, icon('arrow', { size: 16 })),
        h('button', { class: 'ib danger', type: 'button', 'aria-label': 'Remove image', onclick: () => { vals.splice(i, 1); paint(); } }, icon('trash', { size: 16 })))))));
    paint();
    return { el: h('div', { class: `field${f.span === 2 ? ' span2' : ''}` }, h('label', { text: f.label }), box, add), get: () => vals };
  }
  if (f.type === 'list') {
    const rows = [];
    const list = h('div', { class: 'sub-list' });
    const addRow = (v = {}) => {
      const sub = f.fields.map((sf) => ({ f: sf, b: buildField(sf, v[sf.key]) }));
      const row = { sub, orig: v, el: null };
      row.el = h('div', { class: 'sub-item' },
        h('div', { class: 'sub-head' },
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Move up', onclick: () => move(row, -1) }, icon('up', { size: 16 })),
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Move down', onclick: () => move(row, 1) }, icon('down', { size: 16 })),
          h('button', { class: 'ib danger', type: 'button', 'aria-label': `Remove ${f.itemLabel}`, onclick: () => { rows.splice(rows.indexOf(row), 1); row.el.remove(); } }, icon('trash', { size: 16 }))),
        h('div', { class: 'grid' }, sub.map((s) => s.b.el)));
      rows.push(row); list.append(row.el);
    };
    const move = (row, d) => {
      const i = rows.indexOf(row), j = i + d;
      if (j < 0 || j >= rows.length) return;
      rows.splice(i, 1); rows.splice(j, 0, row);
      list.replaceChildren(...rows.map((r) => r.el));
    };
    (value || []).forEach(addRow);
    return {
      el: h('div', { class: `field${f.span === 2 ? ' span2' : ''}` }, h('label', { text: f.label }), list, h('button', { class: 'btn small add-btn', type: 'button', onclick: () => addRow({}) }, icon('plus', { size: 16 }), `Add ${f.itemLabel}`)),
      get: () => rows.map((r) => Object.fromEntries(r.sub.map((s) => [s.f.key, s.b.get()]))).filter((o) => Object.values(o).some((v) => v !== '' && v != null)),
    };
  }
  const input = h('input', { id, type: 'text', maxlength: 500 });
  input.value = value ?? '';
  return { el: wrap(input), get: () => input.value.trim() };
}

function buildForm(fields, values) {
  const built = fields.map((f) => ({ f, b: buildField(f, values?.[f.key]) }));
  return {
    el: h('div', { class: 'grid two' }, built.map((x) => x.b.el)),
    get: (base = {}) => ({ ...base, ...Object.fromEntries(built.map((x) => [x.f.key, x.b.get()])) }),
  };
}

/* ------------------------------------------------------------ views */
const root = document.getElementById('root');
const sectionById = (id) => SECTIONS.find((s) => s.id === id);

function head(title, desc, actions) {
  return h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: title }), desc ? h('p', { text: desc }) : null), actions ? h('div', { class: 'actions' }, actions) : null);
}

function renderShell() {
  const nav = SECTIONS.map((s) => s.group
    ? h('div', { class: 'side-group', text: s.group })
    : h('button', { class: 'side-btn', type: 'button', 'aria-current': state.view === s.id ? 'page' : null, onclick: () => go(s.id) }, icon(s.icon, { size: 18 }), s.label, s.id === 'messages' && state.unread ? h('span', { class: 'badge', text: state.unread }) : null));
  const side = h('aside', { class: 'side' }, h('nav', { class: 'side-inner glass', 'aria-label': 'Dashboard' },
    h('span', { class: 'brand' }, 'TROSSACHS GROUP'),
    h('button', { class: 'side-btn', type: 'button', 'aria-current': state.view === 'overview' ? 'page' : null, onclick: () => go('overview') }, icon('grid', { size: 18 }), 'Overview'),
    nav, h('div', { class: 'side-spacer' }),
    h('a', { class: 'side-btn', href: '/', target: '_blank', rel: 'noopener' }, icon('external', { size: 18 }), 'View website'),
    h('button', { class: 'side-btn', type: 'button', onclick: logout }, icon('logout', { size: 18 }), 'Sign out')));
  const main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
  root.replaceChildren(h('div', { class: 'shell' }, side, main));
  return main;
}

function go(view, editing = null) {
  state.view = view; state.editing = editing;
  render();
  window.scrollTo({ top: 0 });
}

async function logout() {
  try { await api('POST', '/api/admin/logout', {}); } catch { /* ignore */ }
  location.href = '/admin/login';
}

function render() {
  const main = renderShell();
  const s = sectionById(state.view);
  if (state.view === 'overview') return main.append(...viewOverview());
  if (!s) return main.append(...viewOverview());
  if (s.kind === 'single') return main.append(...viewSingle(s));
  if (s.kind === 'collection') return main.append(...(state.editing ? viewItemEditor(s) : viewCollection(s)));
  if (s.kind === 'media') return main.append(...viewMedia());
  if (s.kind === 'messages') return main.append(...viewMessages());
  if (s.kind === 'account') return main.append(...viewAccount());
}

function viewOverview() {
  const c = state.content;
  const stat = (n, label, to) => h('button', { class: 'stat glass', type: 'button', style: 'text-align:left;cursor:pointer;color:inherit', onclick: () => go(to) }, h('b', { text: n }), h('span', { text: label }));
  return [
    head('Overview', `Signed in as ${state.me.email}. Changes you save here appear on the website straight away.`, [
      h('a', { class: 'btn small primary', href: '/', target: '_blank', rel: 'noopener' }, 'View website', icon('external', { size: 15 }))]),
    h('div', { class: 'stats' },
      stat(c.projects?.length ?? 0, 'Projects', 'projects'), stat(c.services?.length ?? 0, 'Services', 'services'),
      stat(state.media.length, 'Images', 'media'), stat(state.unread, 'Unread messages', 'messages')),
    h('div', { class: 'panel glass' }, h('h2', { text: 'Where to start' }),
      h('div', { class: 'rows' }, [
        ['contact', 'Add your email, Upwork, LinkedIn and GitHub links'], ['projects', 'Add screenshots and details to each project'],
        ['about', 'Add your photo and check the developer bio'], ['site', 'Upload a logo, favicon and social sharing image'],
      ].map(([to, text]) => h('button', { class: 'row-item', type: 'button', style: 'cursor:pointer;text-align:left;color:inherit', onclick: () => go(to) }, h('span', { class: 't' }, h('strong', { text }), h('small', { text: sectionById(to).label })), icon('arrow', { size: 18 }))))),
  ];
}

function viewSingle(s) {
  const form = buildForm(s.fields, state.content[s.id]);
  const save = h('button', { class: 'btn primary', type: 'button' }, icon('check', { size: 16 }), 'Save changes');
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      const saved = await api('PUT', `/api/admin/content/${s.id}`, form.get(state.content[s.id]));
      state.content[s.id] = saved; toast('Saved. The website is updated.');
      await refresh(); render();
    } catch (e) { fail(e); } finally { save.disabled = false; }
  });
  return [head(s.label, s.desc), h('div', { class: 'panel glass' }, form.el), h('div', { class: 'savebar glass' }, save)];
}

function viewCollection(s) {
  const items = state.content[s.id] || [];
  const titleOf = (i) => i[s.titleKey || 'title'] || '(untitled)';
  const reorder = async (idx, d) => {
    const ids = items.map((i) => i.id); const j = idx + d;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    try { await api('POST', `/api/admin/items/${s.id}/reorder`, { ids }); await refresh(); render(); } catch (e) { fail(e); }
  };
  const remove = async (item) => {
    if (!confirm(`Delete “${titleOf(item)}”? This cannot be undone.`)) return;
    try { await api('DELETE', `/api/admin/items/${s.id}/${item.id}`); toast('Deleted'); await refresh(); render(); } catch (e) { fail(e); }
  };
  return [
    head(s.label, s.desc, [h('button', { class: 'btn small primary', type: 'button', onclick: () => go(s.id, { isNew: true, item: {} }) }, icon('plus', { size: 16 }), `Add ${s.itemName}`)]),
    items.length
      ? h('div', { class: 'rows' }, items.map((it, i) => h('div', { class: `row-item${it.visible === false ? ' dim' : ''}` },
          h('div', { class: 't' }, h('strong', {}, titleOf(it), s.badge?.(it) ? h('span', { class: 'pill', text: s.badge(it) }) : null), h('small', { text: it[s.subKey || 'category'] || it.subtitle || it.description || '' })),
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => reorder(i, -1) }, icon('up', { size: 18 })),
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Move down', disabled: i === items.length - 1, onclick: () => reorder(i, 1) }, icon('down', { size: 18 })),
          h('button', { class: 'ib', type: 'button', 'aria-label': `Edit ${titleOf(it)}`, onclick: () => go(s.id, { item: it }) }, icon('edit', { size: 18 })),
          h('button', { class: 'ib danger', type: 'button', 'aria-label': `Delete ${titleOf(it)}`, onclick: () => remove(it) }, icon('trash', { size: 18 })))))
      : h('div', { class: 'empty', text: `No ${s.label.toLowerCase()} yet. Add the first one.` }),
  ];
}

function viewItemEditor(s) {
  const { item, isNew } = state.editing;
  const form = buildForm(s.fields, item);
  const save = h('button', { class: 'btn primary', type: 'button' }, icon('check', { size: 16 }), isNew ? `Create ${s.itemName}` : 'Save changes');
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      const data = form.get(item);
      const saved = isNew ? await api('POST', `/api/admin/items/${s.id}`, data) : await api('PUT', `/api/admin/items/${s.id}/${item.id}`, data);
      toast(isNew ? 'Created. The website is updated.' : 'Saved. The website is updated.');
      await refresh();
      state.editing = null; render(); window.scrollTo({ top: 0 });
      void saved;
    } catch (e) { fail(e); } finally { save.disabled = false; }
  });
  return [
    head(isNew ? `New ${s.itemName}` : `Edit ${s.itemName}`, null, [h('button', { class: 'btn small', type: 'button', onclick: () => go(s.id) }, icon('back', { size: 16 }), `All ${s.label.toLowerCase()}`)]),
    h('div', { class: 'panel glass' }, form.el),
    h('div', { class: 'savebar glass' }, h('button', { class: 'btn', type: 'button', onclick: () => go(s.id) }, 'Cancel'), save),
  ];
}

function viewMedia() {
  const grid = h('div', { class: 'media-grid' });
  const used = (m) => JSON.stringify(state.content).includes(m.url);
  const paint = () => grid.replaceChildren(...(state.media.length ? state.media.map((m) => {
    const alt = h('input', { type: 'text', value: m.alt || '', placeholder: 'Alt text (describe the image)', 'aria-label': `Alt text for ${m.original}`, maxlength: 250 });
    alt.addEventListener('change', async () => { try { Object.assign(m, await api('PATCH', `/api/admin/media/${m.id}`, { alt: alt.value })); toast('Alt text saved'); } catch (e) { fail(e); } });
    const replaceInput = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', hidden: true, onchange: async () => {
      const fd = new FormData(); fd.append('file', replaceInput.files[0]);
      try { await api('POST', `/api/admin/media/${m.id}/replace`, fd); toast('Image replaced everywhere it is used'); await refresh(); render(); } catch (e) { fail(e); }
    } });
    return h('div', { class: 'media-card' }, h('img', { src: m.url, alt: m.alt || m.original, loading: 'lazy' }),
      h('div', { class: 'meta' }, h('small', { text: `${m.original} · ${(m.size / 1024).toFixed(0)} KB${used(m) ? ' · in use' : ''}` }), alt,
        h('div', { class: 'btns' },
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Copy image path', title: 'Copy path', onclick: () => navigator.clipboard?.writeText(m.url).then(() => toast('Path copied')) }, icon('list', { size: 16 })),
          h('button', { class: 'ib', type: 'button', 'aria-label': 'Replace image', title: 'Replace', onclick: () => replaceInput.click() }, icon('upload', { size: 16 })), replaceInput,
          h('button', { class: 'ib danger', type: 'button', 'aria-label': 'Delete image', title: 'Delete', onclick: async () => {
            try { await api('DELETE', `/api/admin/media/${m.id}`); }
            catch (e) {
              if (e.status !== 409) return fail(e);
              if (!confirm('This image is used on the site. Delete it and remove it from every place it appears?')) return;
              try { await api('DELETE', `/api/admin/media/${m.id}?force=1`); } catch (e2) { return fail(e2); }
            }
            toast('Image deleted'); await refresh(); render();
          } }, icon('trash', { size: 16 })))));
  }) : [h('div', { class: 'empty', style: 'grid-column:1/-1', text: 'No images yet. Drop some above to get started.' })]));
  const input = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', multiple: true, hidden: true, onchange: () => uploadFiles([...input.files], { onDone: paint }) });
  const drop = h('div', { class: 'drop' }, icon('upload', { size: 28 }), h('div', {}, h('strong', { text: 'Drop images here' }), h('p', { style: 'color:var(--fg-3);font-size:13.5px', text: 'PNG, JPEG, WebP, GIF or AVIF, up to 4 MB each. Tip: export photos around 1600px wide for fast loading.' })), h('button', { class: 'btn small primary', type: 'button', onclick: () => input.click() }, 'Choose files'), input);
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); uploadFiles([...e.dataTransfer.files], { onDone: paint }); });
  paint();
  const notice = state.uploads ? null : h('div', { class: 'panel glass' }, h('h2', { text: 'Image uploads are not set up yet' }), h('p', { text: 'In Vercel, open your project, go to Storage, create a Public Blob store, connect it to this project, then redeploy.' }));
  return [head('Images', 'Upload once, then assign images to the hero, projects, gallery and profile from each section.'), notice, drop, h('div', { style: 'height:18px' }), grid];
}

function viewMessages() {
  const box = h('div');
  const load = async () => {
    try {
      const rows = await api('GET', '/api/admin/messages');
      box.replaceChildren(...(rows.length ? rows.map((m) => h('article', { class: `msg${m.is_read ? '' : ' unread'}` },
        h('div', { class: 'msg-head' }, h('strong', { text: m.name }), h('time', { datetime: new Date(m.created).toISOString(), text: new Date(m.created).toLocaleString() })),
        h('div', { class: 'meta-line' }, h('a', { href: `mailto:${m.email}`, text: m.email }), m.company ? h('span', { text: m.company }) : null, m.type ? h('span', { text: m.type }) : null, m.budget ? h('span', { text: m.budget }) : null),
        h('p', { text: m.body }),
        h('div', { class: 'actions' },
          h('a', { class: 'btn small primary', href: `mailto:${m.email}?subject=${encodeURIComponent('Re: your project brief')}` }, icon('mail', { size: 15 }), 'Reply'),
          h('button', { class: 'btn small', type: 'button', onclick: async () => { try { await api('PATCH', `/api/admin/messages/${m.id}`, { read: !m.is_read }); await refresh(); render(); } catch (e) { fail(e); } } }, m.is_read ? 'Mark unread' : 'Mark read'),
          h('button', { class: 'btn small', type: 'button', onclick: async () => { if (!confirm('Delete this message?')) return; try { await api('DELETE', `/api/admin/messages/${m.id}`); await refresh(); render(); } catch (e) { fail(e); } } }, 'Delete')))) : [h('div', { class: 'empty', text: 'No messages yet. Project briefs sent through the website form will appear here.' })]));
    } catch (e) { fail(e); }
  };
  load();
  return [head('Messages', 'Project briefs sent through the contact form.'), box];
}

function viewAccount() {
  const cur = h('input', { type: 'password', id: 'cur', autocomplete: 'current-password' });
  const nxt = h('input', { type: 'password', id: 'nxt', autocomplete: 'new-password', minlength: 10 });
  const btn = h('button', { class: 'btn primary', type: 'button' }, 'Change password');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try { await api('POST', '/api/admin/password', { current: cur.value, next: nxt.value }); toast('Password changed. Other sessions were signed out.'); cur.value = ''; nxt.value = ''; } catch (e) { fail(e); } finally { btn.disabled = false; }
  });
  return [head('Account', `Signed in as ${state.me.email}.`),
    h('div', { class: 'panel glass' }, h('h2', { text: 'Change password' }), h('div', { class: 'grid two' },
      h('div', { class: 'field' }, h('label', { for: 'cur', text: 'Current password' }), cur),
      h('div', { class: 'field' }, h('label', { for: 'nxt', text: 'New password' }), nxt, h('p', { class: 'hint', text: 'At least 10 characters.' }))), h('div', { style: 'margin-top:18px' }, btn)),
    h('div', { class: 'panel glass' }, h('h2', { text: 'Session' }), h('button', { class: 'btn', type: 'button', onclick: logout }, icon('logout', { size: 16 }), 'Sign out'))];
}

/* ------------------------------------------------------------ boot */
try {
  await refresh();
  render();
} catch (e) {
  root.replaceChildren(h('div', { class: 'login-wrap' }, h('div', { class: 'login-card glass' }, h('h1', { text: 'Could not load the dashboard' }), h('p', { class: 'sub', text: e.message }), h('a', { class: 'btn primary', href: '/admin/login', text: 'Back to sign in' }))));
}
