(function () {
  /* ---- sign-in details: change them here. This is a convenience gate in the page, not real security. ---- */
  var ADMIN_USER = 'trossachs.int@gmail.com', ADMIN_PASS = 'BEST';

  var TG = window.TG, U = TG.util, esc = U.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var uid = 0, memAuth = false;

  /* ================= sign in ================= */
  function authed() { try { return sessionStorage.getItem('tg-admin') === '1'; } catch (e) { return memAuth; } }
  function setAuth(v) { memAuth = v; try { if (v) sessionStorage.setItem('tg-admin', '1'); else sessionStorage.removeItem('tg-admin'); } catch (e) {} }
  var fails = 0, lockUntil = 0;
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#loginMsg'), now = Date.now();
    if (now < lockUntil) { msg.textContent = 'Too many attempts. Try again in ' + Math.ceil((lockUntil - now) / 1000) + ' seconds.'; return; }
    var u = $('#lu').value.trim().toLowerCase(), p = $('#lp').value;
    if (u === ADMIN_USER.toLowerCase() && p === ADMIN_PASS) { fails = 0; msg.textContent = ''; setAuth(true); $('#lp').value = ''; show(); }
    else { fails++; msg.textContent = 'Incorrect username or password.'; if (fails >= 5) { lockUntil = now + 30000; fails = 0; } $('#lp').select(); }
  });
  $('#logoutBtn').addEventListener('click', function () { flush(); setAuth(false); show(); });
  function show() {
    var ok = authed();
    $('#login').hidden = ok; $('#app').hidden = !ok;
    if (ok) { buildSide(); openSection(location.hash.slice(1) || 'site'); } else { $('#lu').focus(); }
  }

  /* ================= theme ================= */
  $('#themeBtn').addEventListener('click', function () {
    var r = document.documentElement, cur = r.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    r.dataset.theme = cur === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('tg-theme', r.dataset.theme); } catch (e) {}
  });

  /* ================= autosave ================= */
  var timers = {}, pending = {};
  var statusEl = $('#status'), statusText = $('#statusText');
  function setStatus(kind, text) { statusEl.className = 'status ' + (kind || ''); statusText.textContent = text; }
  function clock() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  function queue(key, fn, immediate) {
    pending[key] = fn; clearTimeout(timers[key]); setStatus('saving', 'Saving…');
    if (immediate) run(key); else timers[key] = setTimeout(function () { run(key); }, 300);
  }
  function run(key) {
    var fn = pending[key]; if (!fn) return; delete pending[key]; clearTimeout(timers[key]);
    var ok = fn();
    if (ok === false) setStatus('error', 'Not saved: browser storage is full. Use image links instead of uploads, or export a backup.');
    else if (!Object.keys(pending).length) { setStatus('', 'All changes saved · ' + clock()); markDots(); }
  }
  function flush() { Object.keys(pending).forEach(run); }
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });

  /* ================= schema ================= */
  var ICONS = [['web', 'Web / code'], ['ai', 'AI network'], ['ux', 'UI / UX'], ['gfx', 'Graphics'], ['brand', 'Brand'], ['chart', 'Analytics'], ['prod', 'Product'], ['tech', 'Technology']];
  function T(p, label, hint) { return { kind: 'text', path: p, key: p, label: label, hint: hint }; }
  function TA(p, label, hint, rows) { return { kind: 'textarea', path: p, key: p, label: label, hint: hint, rows: rows || 3 }; }
  function IMG(p, label, hint, o) { return { kind: 'image', path: p, key: p, label: label, hint: hint, opt: o || {} }; }
  function K(kind, key, label, hint, extra) { var f = { kind: kind, key: key, label: label, hint: hint }; for (var k in (extra || {})) f[k] = extra[k]; return f; }

  var LINKHINT = 'Full link starting with https://. Leave empty to hide this icon.';
  var SECTIONS = [
    { id: 'site', title: 'Site & footer', roots: ['site', 'footer'], desc: 'Header button, logo and footer. Everything you change here saves by itself and shows on the site straight away.',
      fields: [
        T('site.navCta', 'Header button text', 'Also used on the "Get Started" buttons on service pages.'),
        IMG('site.logoUrl', 'Logo (header and footer)', 'Paste a link or upload a file. Leave empty to use the built-in Trossachs logo. The 3D hero logo is not changed by this.', { png: true, max: 480, logo: true }),
        T('footer.copyright', 'Copyright text', 'The year is added automatically.'),
        T('footer.github', 'GitHub link', LINKHINT), T('footer.linkedin', 'LinkedIn link', LINKHINT), T('footer.x', 'X link', LINKHINT), T('footer.instagram', 'Instagram link', LINKHINT)
      ] },
    { id: 'hero', title: 'Hero', roots: ['hero'], desc: 'The first screen visitors see.',
      fields: [
        T('hero.eyebrow', 'Small line above the heading'),
        T('hero.line1', 'Heading, line 1'), T('hero.line2', 'Heading, line 2 (accent colour)'), T('hero.accent', 'Heading, line 3 accent word'), T('hero.line3', 'Heading, line 3 rest'),
        TA('hero.lead', 'Intro paragraph', '', 4), T('hero.btnPrimary', 'Main button text'), T('hero.btnSecondary', 'Second button text')
      ] },
    { id: 'services', title: 'Services', roots: ['services'], desc: 'Section wording, and each service with its own full page.',
      fields: [
        T('services.eyebrow', 'Small label'), T('services.headA', 'Heading, first part'), T('services.headAccent', 'Heading, accent word'), T('services.headB', 'Heading, last part'),
        TA('services.sub', 'Short paragraph', '', 3), T('services.btn', 'Button text'), TA('services.allLead', 'Intro on the "All services" page', '', 3)
      ],
      lists: [{
        path: 'services.items', title: 'Services', noun: 'service', titleKey: 'name',
        blank: function (n) { return { slug: 'new-service-' + n, icon: 'tech', name: 'New service', tag: 'One line describing it.', lead: 'Describe what this service includes.', deliver: [['Deliverable', 'What the client gets.']], steps: [['Plan', 'First step.'], ['Build', 'Second step.']], stack: ['Tool one'], projects: [], faq: [['A common question?', 'The answer.']] }; },
        fields: [
          K('text', 'name', 'Service name'),
          K('text', 'slug', 'Page link name', 'Lowercase letters, numbers and hyphens. It becomes the page address, e.g. #svc-web-development. The three hero shortcut chips point to web-development, ai-intelligent-systems and brand-identity, so keep those if you keep those chips.', { slug: true }),
          K('select', 'icon', 'Icon', '', { options: ICONS }),
          K('text', 'tag', 'Card line', 'Shown on the service card.'),
          K('textarea', 'lead', 'Page introduction', '', { rows: 4 }),
          K('pairs', 'deliver', 'What we deliver', 'One per line: Title | Description', { rows: 6 }),
          K('pairs', 'steps', 'How it works (steps)', 'One per line: Step | Description', { rows: 5 }),
          K('lines', 'stack', 'Tools we work with', 'One per line.', { rows: 5 }),
          K('lines', 'projects', 'Related projects', 'One project name per line, exactly as written in Portfolio.', { rows: 3 }),
          K('pairs', 'faq', 'Questions and answers', 'One per line: Question | Answer', { rows: 5 })
        ]
      }] },
    { id: 'portfolio', title: 'Portfolio', roots: ['portfolio'], desc: 'The featured projects carousel.',
      fields: [T('portfolio.eyebrow', 'Small label'), T('portfolio.heading', 'Heading'), TA('portfolio.sub', 'Short paragraph', '', 3), T('portfolio.btn', 'Button text')],
      lists: [{
        path: 'portfolio.items', title: 'Projects', noun: 'project', titleKey: 'name',
        blank: function () { return { name: 'New project', category: 'Website', tags: ['Web Dev'], image: '', art: '' }; },
        fields: [
          K('text', 'name', 'Project name'), K('text', 'category', 'Category'),
          K('tags', 'tags', 'Tags', 'Separate with commas, e.g. Web Dev, UI/UX, Branding.'),
          K('image', 'image', 'Cover image', 'Paste a link or upload a screenshot. Leave empty to show the built-in illustration.', { opt: { max: 1100 } })
        ]
      }] },
    { id: 'about', title: 'About', roots: ['about'], desc: 'About text and the four highlights beside it.',
      fields: [T('about.eyebrow', 'Small label'), TA('about.heading', 'Heading', '', 2), TA('about.text', 'Paragraph', '', 5), T('about.btn', 'Button text')],
      lists: [{
        path: 'about.features', title: 'Highlights', noun: 'highlight', titleKey: 'title',
        blank: function () { return { title: 'New highlight', text: 'One short line.' }; },
        fields: [K('text', 'title', 'Title'), K('text', 'text', 'Line')]
      }] },
    { id: 'launch', title: 'Launching soon', roots: ['launch'], desc: 'The slideshow after About. Each card is one product. It auto-plays about every five seconds and pauses on hover.',
      fields: [T('launch.eyebrow', 'Small label'), T('launch.heading', 'Heading'), TA('launch.sub', 'Short paragraph', '', 2)],
      lists: [{
        path: 'launch.items', title: 'Slides', noun: 'slide', titleKey: 'title',
        blank: function () { return { badge: 'Launching soon', title: 'New product', text: 'What it is and who it is for.', meta: 'Category', image: '', btn: 'Get notified', art: '' }; },
        fields: [
          K('text', 'title', 'Name'), K('text', 'badge', 'Badge', 'For example: Launching soon.'), K('text', 'meta', 'Small label', 'For example: AI companion.'),
          K('textarea', 'text', 'Description', '', { rows: 3 }),
          K('text', 'btn', 'Button text', 'The button opens the contact form with a message ready. Leave empty to hide it.'),
          K('image', 'image', 'Design image', 'Paste a link or upload the design. Wide images about 16:9 look best. Leave empty to show the built-in mockup.', { opt: { max: 1200 } })
        ]
      }] },
    { id: 'numbers', title: 'Numbers & process', roots: ['stats', 'process'], desc: 'The four numbers and the four-step process strip.',
      lists: [
        { path: 'stats.items', title: 'Numbers', noun: 'number', titleKey: 'label', blank: function () { return { value: '10+', label: 'New number' }; },
          fields: [K('text', 'value', 'Value', 'A number with an optional ending, like 50+ or 99%. Plain numbers count up when scrolled into view.'), K('text', 'label', 'Label')] },
        { path: 'process.items', title: 'Process steps', noun: 'step', titleKey: 'title', blank: function () { return { title: 'New step', text: 'One short line.' }; },
          fields: [K('text', 'title', 'Step name'), K('text', 'text', 'Line')] }
      ] },
    { id: 'testimonial', title: 'Testimonial', roots: ['testimonial'], desc: 'The client quote next to the contact section.',
      fields: [
        T('testimonial.eyebrow', 'Small label'), T('testimonial.heading', 'Heading'), TA('testimonial.quote', 'Quote', 'Quote marks are added for you.', 4),
        T('testimonial.name', 'Name'), T('testimonial.role', 'Role and company'), T('testimonial.initials', 'Initials', 'Shown when there is no photo.'),
        IMG('testimonial.avatar', 'Photo', 'Optional. Paste a link or upload a small square photo.', { max: 320 })
      ] },
    { id: 'contact', title: 'Contact', roots: ['contact'], desc: 'Contact details and the wording of the message form.',
      fields: [
        T('contact.eyebrow', 'Small label'), T('contact.heading', 'Heading'), TA('contact.text', 'Paragraph', '', 3),
        T('contact.email', 'Email address'), T('contact.phone', 'Phone number'),
        T('contact.formTitle', 'Form title'), T('contact.nameLabel', 'Name field label'), T('contact.contactLabel', 'Email or phone field label'), T('contact.messageLabel', 'Message field label'),
        T('contact.button', 'Send button text'), TA('contact.success', 'Message shown after sending', '', 2),
        T('contact.forwardUrl', 'Forward messages to an endpoint (optional)', 'A static site cannot email visitor messages by itself. Messages are saved in the browser the visitor used. To also receive them by email from every visitor, paste a form endpoint here, for example a Formspree URL like https://formspree.io/f/xxxxxxx. Each message is then sent there as well.')
      ] }
  ];
  var MSG_SECTION = { id: 'messages', title: 'Messages' }, BACKUP_SECTION = { id: 'backup', title: 'Backup & publish' };

  /* ================= side nav ================= */
  function buildSide() {
    var h = SECTIONS.map(function (s) { return '<button type="button" data-sec="' + s.id + '">' + esc(s.title) + '<span class="dot" hidden></span></button>'; }).join('') +
      '<hr><button type="button" data-sec="messages">Messages<span class="badge" id="unread" hidden></span></button>' +
      '<button type="button" data-sec="backup">Backup &amp; publish</button>';
    $('#side').innerHTML = h; markDots(); unreadBadge();
  }
  $('#side').addEventListener('click', function (e) { var b = e.target.closest('[data-sec]'); if (b) openSection(b.dataset.sec); });
  function markDots() {
    $$('#side [data-sec]').forEach(function (b) {
      var s = SECTIONS.filter(function (x) { return x.id === b.dataset.sec; })[0], d = $('.dot', b); if (!s || !d) return;
      d.hidden = !s.roots.some(function (r) { return TG.isModified(r); });
    });
  }
  function unreadBadge() { var n = TG.messages.unread(), b = $('#unread'); if (b) { b.hidden = !n; b.textContent = n; } }
  addEventListener('hashchange', function () { if (authed()) openSection(location.hash.slice(1) || 'site', true); });

  var current = null, openItems = {};
  function openSection(id, fromHash) {
    flush();
    if (!SECTIONS.some(function (s) { return s.id === id; }) && id !== 'messages' && id !== 'backup') id = 'site';
    current = id;
    $$('#side [data-sec]').forEach(function (b) { if (b.dataset.sec === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (!fromHash && location.hash.slice(1) !== id) { try { history.replaceState(null, '', '#' + id); } catch (e) { location.hash = id; } }
    render();
    if (!fromHash) { window.scrollTo(0, 0); }
  }
  function render() {
    var pane = $('#pane');
    if (current === 'messages') pane.innerHTML = messagesHTML();
    else if (current === 'backup') pane.innerHTML = backupHTML();
    else pane.innerHTML = sectionHTML(SECTIONS.filter(function (s) { return s.id === current; })[0]);
    $$('.img-prev', pane).forEach(function (p) { refreshPreview(p.closest('.img-f')); });
  }

  /* ================= field rendering ================= */
  function pairsText(a) { return (Array.isArray(a) ? a : []).map(function (p) { p = Array.isArray(p) ? p : [String(p), '']; return p[0] + ' | ' + (p[1] || ''); }).join('\n'); }
  function parsePairs(t) { return t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }); }
  function parseLines(t) { return t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); }
  function parseTags(t) { return t.split(',').map(function (l) { return l.trim(); }).filter(Boolean); }

  function fieldHTML(f, val, ctx) {
    var id = 'f' + (uid++), a = ' id="' + id + '" data-f data-kind="' + f.kind + '"' + (ctx ? ' data-list="' + ctx.list + '" data-idx="' + ctx.idx + '" data-key="' + f.key + '"' : ' data-path="' + f.path + '"') + (f.slug ? ' data-slug' : '') + (ctx && f.key === ctx.titleKey ? ' data-title' : '');
    var h = '<div class="f"><label for="' + id + '">' + esc(f.label) + '</label>', k = f.kind;
    if (k === 'text') h += '<input type="text"' + a + ' value="' + esc(val == null ? '' : val) + '">';
    else if (k === 'textarea') h += '<textarea' + a + ' rows="' + (f.rows || 3) + '">' + esc(val == null ? '' : val) + '</textarea>';
    else if (k === 'select') h += '<select' + a + '>' + f.options.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (k === 'pairs') h += '<textarea' + a + ' class="mono" rows="' + (f.rows || 4) + '" spellcheck="false">' + esc(pairsText(val)) + '</textarea>';
    else if (k === 'lines') h += '<textarea' + a + ' class="mono" rows="' + (f.rows || 4) + '" spellcheck="false">' + esc((Array.isArray(val) ? val : []).join('\n')) + '</textarea>';
    else if (k === 'tags') h += '<input type="text"' + a + ' value="' + esc((Array.isArray(val) ? val : []).join(', ')) + '">';
    else if (k === 'image') {
      var up = typeof val === 'string' && val.indexOf('data:') === 0, o = f.opt || {};
      h += '<div class="img-f" data-max="' + (o.max || 1100) + '" data-png="' + (o.png ? 1 : 0) + '"><div class="img-row">' +
        '<input type="text"' + a + (up ? ' data-full="' + esc(val) + '"' : '') + ' placeholder="https://… or upload a file" value="' + esc(up ? 'Uploaded image · ' + Math.round(val.length * .75 / 1024) + ' KB' : (val || '')) + '">' +
        '<button type="button" class="btn sm" data-act="pick">Upload</button><button type="button" class="btn sm ghost" data-act="clearimg">Clear</button></div>' +
        '<input type="file" accept="image/*" hidden data-file>' +
        '<div class="img-prev' + (o.logo ? ' logo' : '') + '"><img alt=""><span class="bad" hidden>This image could not be loaded.</span></div></div>';
    }
    if (f.hint) h += '<div class="hint">' + esc(f.hint) + '</div>';
    return h + '</div>';
  }
  function sectionHTML(s) {
    var h = '<div class="pane-head"><h1>' + esc(s.title) + '</h1><p>' + esc(s.desc) + '</p></div>';
    if (s.fields) h += '<div class="card"><div class="grid2">' + s.fields.map(function (f) { var wide = f.kind === 'textarea' || f.kind === 'image' || f.hint && f.hint.length > 90; return (wide ? '<div style="grid-column:1/-1">' : '<div>') + fieldHTML(f, TG.get(f.path)) + '</div>'; }).join('') + '</div></div>';
    (s.lists || []).forEach(function (L) { h += listHTML(L); });
    h += '<div class="sec-actions"><button type="button" class="btn danger sm" data-act="resetsec">Reset this section to its original wording</button></div>';
    return h;
  }
  function listHTML(L) {
    var arr = TG.get(L.path); arr = Array.isArray(arr) ? arr : [];
    var h = '<div class="card" data-listwrap="' + L.path + '"><h2>' + esc(L.title) + ' <span class="muted">(' + arr.length + ')</span></h2><div class="hint">Open an item to edit it. Use the arrows to reorder.</div><div class="items">';
    if (!arr.length) h += '<div class="empty">No ' + esc(L.noun) + 's yet.</div>';
    arr.forEach(function (it, i) {
      var key = L.path + ':' + i, ctx = { list: L.path, idx: i, titleKey: L.titleKey };
      h += '<details class="item" data-key="' + key + '"' + (openItems[key] ? ' open' : '') + '><summary><span class="n">' + (i + 1) + '</span><span class="t">' + esc(it[L.titleKey] || 'Untitled') + '</span>' +
        '<span class="acts"><button type="button" data-act="up" data-list="' + L.path + '" data-idx="' + i + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" data-act="down" data-list="' + L.path + '" data-idx="' + i + '" aria-label="Move down"' + (i === arr.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="opt" data-act="dup" data-list="' + L.path + '" data-idx="' + i + '">Copy</button>' +
        '<button type="button" class="del" data-act="del" data-list="' + L.path + '" data-idx="' + i + '">Delete</button></span></summary>' +
        '<div class="item-body">' + L.fields.map(function (f) { return fieldHTML(f, it[f.key], ctx); }).join('') + '</div></details>';
    });
    return h + '</div><button type="button" class="btn sm list-add" data-act="add" data-list="' + L.path + '">+ Add ' + esc(L.noun) + '</button></div>';
  }
  function findList(path) { var out = null; SECTIONS.forEach(function (s) { (s.lists || []).forEach(function (L) { if (L.path === path) out = L; }); }); return out; }

  /* ================= editing ================= */
  function readValue(el) {
    var k = el.dataset.kind;
    if (k === 'pairs') return parsePairs(el.value);
    if (k === 'lines') return parseLines(el.value);
    if (k === 'tags') return parseTags(el.value);
    if (k === 'image') return (el.dataset.full || el.value).trim();
    return el.value;
  }
  function commit(el, immediate) {
    var val = readValue(el);
    if (el.dataset.list) {
      var list = el.dataset.list, idx = +el.dataset.idx, key = el.dataset.key;
      queue(list + ':' + idx + ':' + key, function () {
        var arr = U.clone(TG.get(list)); if (!Array.isArray(arr) || !arr[idx]) return true;
        arr[idx][key] = val; return TG.setLocal(list, arr);
      }, immediate);
      if (el.hasAttribute('data-title')) { var t = $('.t', el.closest('.item')); if (t) t.textContent = val || 'Untitled'; }
    } else {
      var path = el.dataset.path; queue(path, function () { return TG.setLocal(path, val); }, immediate);
    }
  }
  var pane = $('#pane');
  pane.addEventListener('input', function (e) {
    var el = e.target.closest('[data-f]'); if (!el) return;
    if (el.dataset.kind === 'image') { delete el.dataset.full; refreshPreview(el.closest('.img-f')); }
    if (el.hasAttribute('data-slug')) return; /* committed on change, after cleaning */
    commit(el);
  });
  pane.addEventListener('change', function (e) {
    var el = e.target.closest('[data-f]'); if (!el) return;
    if (el.hasAttribute('data-slug')) {
      var v = el.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service';
      var arr = TG.get(el.dataset.list) || [], idx = +el.dataset.idx, base = v, n = 2;
      while (arr.some(function (x, i) { return i !== idx && x.slug === v; })) v = base + '-' + (n++);
      el.value = v;
    }
    commit(el, true);
  });
  pane.addEventListener('toggle', function (e) { var d = e.target; if (d.classList && d.classList.contains('item')) openItems[d.dataset.key] = d.open; }, true);

  /* images */
  function refreshPreview(wrap) {
    if (!wrap) return;
    var inp = $('[data-f]', wrap), prev = $('.img-prev', wrap), img = $('img', prev), bad = $('.bad', prev);
    var src = U.safeUrl(inp.dataset.full || inp.value);
    bad.hidden = true; img.hidden = false;
    if (!src) { prev.classList.remove('on'); return; }
    prev.classList.add('on'); if (img.getAttribute('src') !== src) img.src = src;
  }
  pane.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.img-prev')) { e.target.hidden = true; $('.bad', e.target.parentNode).hidden = false; }
  }, true);
  function fileToDataUrl(file, max, png) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error('Please choose an image file.'));
      var rd = new FileReader();
      rd.onerror = function () { rej(new Error('That file could not be read.')); };
      rd.onload = function () {
        if (file.type === 'image/svg+xml') { return rd.result.length < 400000 ? res(rd.result) : rej(new Error('That SVG is too large.')); }
        var im = new Image();
        im.onerror = function () { rej(new Error('That image could not be opened.')); };
        im.onload = function () {
          var sc = Math.min(1, max / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * sc)), h = Math.max(1, Math.round(im.height * sc));
          var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
          if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
          x.drawImage(im, 0, 0, w, h); res(c.toDataURL(png ? 'image/png' : 'image/jpeg', .84));
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  pane.addEventListener('change', function (e) {
    var fi = e.target.closest('[data-file]'); if (!fi || !fi.files[0]) return;
    var wrap = fi.closest('.img-f'), inp = $('[data-f]', wrap), file = fi.files[0]; fi.value = '';
    fileToDataUrl(file, +wrap.dataset.max, wrap.dataset.png === '1').then(function (d) {
      inp.dataset.full = d; inp.value = 'Uploaded image · ' + Math.round(d.length * .75 / 1024) + ' KB';
      refreshPreview(wrap); commit(inp, true);
    }, function (err) { setStatus('error', err.message); });
  });

  /* clicks: list actions, image buttons, resets */
  var armTimers = {};
  function arm(btn, label) {
    if (btn.classList.contains('armed')) return true;
    var orig = btn.textContent; btn.classList.add('armed'); btn.textContent = label;
    clearTimeout(armTimers[btn.dataset.act]); armTimers[btn.dataset.act] = setTimeout(function () { btn.classList.remove('armed'); btn.textContent = orig; }, 3000);
    return false;
  }
  pane.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, list = b.dataset.list, idx = +b.dataset.idx;
    if (b.closest('summary')) e.preventDefault();
    if (act === 'pick') { $('[data-file]', b.closest('.img-f')).click(); return; }
    if (act === 'clearimg') { var wrap = b.closest('.img-f'), inp = $('[data-f]', wrap); delete inp.dataset.full; inp.value = ''; refreshPreview(wrap); commit(inp, true); return; }
    if (act === 'resetsec') {
      if (!arm(b, 'Click again to reset')) return;
      var s = SECTIONS.filter(function (x) { return x.id === current; })[0]; flush();
      s.roots.forEach(function (r) { TG.resetPath(r); }); openItems = {}; markDots(); setStatus('', 'Section reset · ' + clock()); render(); return;
    }
    if (act === 'exportjs') { download('content.js', publishedText(), 'text/javascript'); return; }
    if (act === 'copyjs') { copyText(publishedText(), b); return; }
    if (act === 'exportjson') { download('trossachs-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ content: TG.local(), messages: TG.messages.list() }, null, 2), 'application/json'); return; }
    if (act === 'importpick') { $('#importFile').click(); return; }
    if (act === 'resetall') {
      if (!arm(b, 'Click again to erase all edits')) return;
      flush(); TG.resetAll(); openItems = {}; markDots(); setStatus('', 'All edits cleared · ' + clock()); render(); return;
    }
    if (act === 'csv') { download('trossachs-messages.csv', messagesCsv(), 'text/csv'); return; }
    if (act === 'delall') { if (!arm(b, 'Click again to delete all')) return; TG.messages.clear(); return; }
    if (act === 'mdel') { if (!arm(b, 'Confirm delete')) return; TG.messages.remove(b.dataset.id); return; }
    if (act === 'mread') { var m = TG.messages.list().filter(function (x) { return x.id === b.dataset.id; })[0]; TG.messages.setRead(b.dataset.id, !(m && m.read)); return; }
    if (act === 'mcopy') { copyText(b.dataset.text, b); return; }
    if (!list) return;
    var L = findList(list); if (!L) return;
    if (act === 'del' && !arm(b, 'Sure?')) return;
    flush();
    var arr = U.clone(TG.get(list)) || [];
    if (act === 'add') { arr.push(L.blank(arr.length + 1)); openItems[list + ':' + (arr.length - 1)] = true; }
    else if (act === 'del') { arr.splice(idx, 1); shiftOpen(list, idx, -1); }
    else if (act === 'dup') { var c = U.clone(arr[idx]); if (c.slug) c.slug = c.slug + '-copy'; arr.splice(idx + 1, 0, c); shiftOpen(list, idx + 1, 1); openItems[list + ':' + (idx + 1)] = true; }
    else if (act === 'up' && idx > 0) { var t = arr[idx - 1]; arr[idx - 1] = arr[idx]; arr[idx] = t; swapOpen(list, idx, idx - 1); }
    else if (act === 'down' && idx < arr.length - 1) { var t2 = arr[idx + 1]; arr[idx + 1] = arr[idx]; arr[idx] = t2; swapOpen(list, idx, idx + 1); }
    var y = window.scrollY;
    if (TG.setLocal(list, arr) === false) setStatus('error', 'Not saved: browser storage is full.'); else setStatus('', 'All changes saved · ' + clock());
    markDots(); render(); window.scrollTo(0, y);
  });
  function shiftOpen(list, from, d) {
    var next = {}; Object.keys(openItems).forEach(function (k) {
      var p = k.lastIndexOf(':'), l = k.slice(0, p), i = +k.slice(p + 1);
      if (l !== list) { next[k] = openItems[k]; return; }
      if (d < 0) { if (i === from) return; next[l + ':' + (i > from ? i - 1 : i)] = openItems[k]; }
      else next[l + ':' + (i >= from ? i + 1 : i)] = openItems[k];
    }); openItems = next;
  }
  function swapOpen(list, a, b) { var ka = list + ':' + a, kb = list + ':' + b, t = openItems[ka]; openItems[ka] = openItems[kb]; openItems[kb] = t; }

  /* ================= messages ================= */
  function fmtTime(ts) { try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ts; } }
  function waLink(p) { var d = String(p).replace(/[^\d+]/g, ''); if (/^0\d{10}$/.test(d)) d = '234' + d.slice(1); else d = d.replace(/^\+/, ''); return 'https://wa.me/' + d; }
  function messagesHTML() {
    var list = TG.messages.list(), unread = list.filter(function (m) { return !m.read; }).length;
    var h = '<div class="pane-head"><h1>Messages</h1><p>Messages sent from the Contact form land here. Open one to read it, reply, or delete it.</p></div>' +
      '<div class="note"><b>Where messages come from.</b> This site has no server, so a message is stored in the browser the visitor used, and this inbox shows the messages stored in <b>this browser</b>. Open the admin on the same device and browser where the site is viewed (for example while testing), or add a form endpoint under Contact → "Forward messages" to receive every visitor\'s message by email.</div>' +
      '<div class="msg-bar"><span class="count">' + list.length + ' message' + (list.length === 1 ? '' : 's') + (unread ? ' · ' + unread + ' unread' : '') + '</span>' +
      '<button type="button" class="btn sm" data-act="csv"' + (list.length ? '' : ' disabled') + '>Export CSV</button>' +
      '<button type="button" class="btn danger sm" data-act="delall"' + (list.length ? '' : ' disabled') + '>Delete all</button></div>';
    if (!list.length) return h + '<div class="empty">No messages yet. Send one from the Contact form on the site and it will appear here.</div>';
    return h + list.map(function (m) {
      var reply = m.kind === 'email' ? '<a class="btn sm primary" href="mailto:' + esc(m.contact) + '?subject=' + encodeURIComponent('Re: your message to Trossachs Group') + '">Reply by email</a>'
        : '<a class="btn sm primary" href="' + esc(U.telHref(m.contact)) + '">Call</a><a class="btn sm" href="' + esc(waLink(m.contact)) + '" target="_blank" rel="noopener">WhatsApp</a>';
      return '<article class="msg' + (m.read ? '' : ' unread') + '"><div class="msg-top"><span class="msg-name">' + esc(m.name) + '</span><span class="msg-time">' + esc(fmtTime(m.ts)) + '</span></div>' +
        '<div class="msg-contact">' + esc(m.contact) + '</div><div class="msg-text">' + esc(m.message) + '</div>' +
        '<div class="msg-acts">' + reply + '<button type="button" class="btn sm" data-act="mcopy" data-text="' + esc(m.contact) + '">Copy contact</button>' +
        '<button type="button" class="btn sm ghost" data-act="mread" data-id="' + esc(m.id) + '">' + (m.read ? 'Mark unread' : 'Mark read') + '</button>' +
        '<button type="button" class="btn danger sm" data-act="mdel" data-id="' + esc(m.id) + '">Delete</button></div></article>';
    }).join('');
  }
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function messagesCsv() {
    return 'Date,Name,Contact,Type,Message\r\n' + TG.messages.list().map(function (m) { return [m.ts, m.name, m.contact, m.kind, m.message].map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  TG.messages.on(function () { unreadBadge(); if (current === 'messages') { var y = window.scrollY; render(); window.scrollTo(0, y); } });
  TG.on(function (src) { if (src === 'external' && authed() && current !== 'messages' && !document.activeElement.matches('[data-f]')) { render(); markDots(); } });

  /* ================= backup & publish ================= */
  function publishedText() {
    return '/* Exported from the Trossachs admin on ' + new Date().toISOString().slice(0, 10) + '. Replace js/content.js with this file to publish these edits for every visitor. */\nwindow.TG_PUBLISHED = ' + JSON.stringify(TG.exportPublished(), null, 2) + ';\n';
  }
  function backupHTML() {
    var used = TG.storageBytes(), pct = Math.min(100, Math.round(used / (5 * 1024 * 1024) * 100));
    return '<div class="pane-head"><h1>Backup &amp; publish</h1><p>Your edits save automatically in this browser. Use this page to publish them for everyone and to keep a backup.</p></div>' +
      '<div class="card"><h2>Publish your edits to the live site</h2><div class="hint">Edits are stored in this browser, so other visitors do not see them until you publish.</div>' +
      '<ol class="steps"><li>Press <b>Download content.js</b> (or copy it).</li><li>Replace the file <code>js/content.js</code> in the site folder with it.</li><li>Upload the site folder again to your host.</li></ol>' +
      '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn primary" data-act="exportjs">Download content.js</button><button type="button" class="btn" data-act="copyjs">Copy content.js</button></div></div>' +
      '<div class="card"><h2>Backup</h2><div class="hint">A backup holds your edits and your messages. Restore it on another browser or computer.</div><div class="btn-row">' +
      '<button type="button" class="btn" data-act="exportjson">Download backup</button><button type="button" class="btn" data-act="importpick">Restore from backup</button></div>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden></div>' +
      '<div class="card"><h2>Browser storage</h2><div class="meter" aria-hidden="true"><i style="width:' + pct + '%"></i></div><div class="hint">Using about ' + (used / 1048576).toFixed(2) + ' MB of roughly 5 MB. Uploaded images count here; image links do not.</div></div>' +
      '<div class="card"><h2>Start over</h2><div class="hint">Removes every edit made in this browser and returns the site to its published wording. Messages are not touched.</div><button type="button" class="btn danger" data-act="resetall">Erase all edits</button></div>' +
      '<div class="note"><b>About the sign-in.</b> The username and password only keep casual visitors out of this page. Anyone who inspects the site files can find them, so do not rely on them for anything private. To change them, edit the first line of <code>js/admin.js</code>.</div>';
  }
  pane.addEventListener('change', function (e) {
    if (e.target.id !== 'importFile' || !e.target.files[0]) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var o = JSON.parse(rd.result); if (!o || typeof o.content !== 'object') throw 0;
        if (!TG.replaceLocal(o.content)) throw 1;
        if (Array.isArray(o.messages)) { try { localStorage.setItem('tg-messages-v1', JSON.stringify(o.messages)); } catch (x) {} }
        buildSide(); setStatus('', 'Backup restored · ' + clock()); render();
      } catch (err) { setStatus('error', 'That file is not a valid Trossachs backup.'); }
    };
    rd.readAsText(e.target.files[0]);
  });
  function download(name, text, type) {
    try {
      var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
      a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
    } catch (e) { setStatus('error', 'Downloads are blocked here. Use Copy instead.'); }
  }
  function copyText(text, btn) {
    var orig = btn.textContent;
    function done(ok) { btn.textContent = ok ? 'Copied' : 'Copy failed'; setTimeout(function () { btn.textContent = orig; }, 1600); }
    function fb() { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); done(ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fb); else fb();
  }

  show();
})();
