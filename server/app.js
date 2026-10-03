import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { SINGLETONS, COLLECTIONS } from './store.js';
import { seedIfEmpty } from './seed.js';
import {
  hashPassword, verifyPassword, parseCookies, sanitize, cleanText, slugify, escapeHtml, isEmail, SESSION_COOKIE, SESSION_MS,
} from './security.js';
import { readBody, parseMultipart, sniffImage, randomName, MAX_UPLOAD } from './upload.js';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml)|image\/svg)/;
const ON_VERCEL = Boolean(process.env.VERCEL);

export function createApp({ store, blob, rootDir, log = console, siteUrl = '' } = {}) {
  const publicDir = path.join(rootDir, 'public');
  const privateDir = path.join(rootDir, 'private');
  const viewsDir = path.join(rootDir, 'views');
  const view = (name) => fs.readFileSync(path.join(viewsDir, name), 'utf8');

  /* ---------- one-time setup: starter content + first admin account ---------- */
  async function ensureAdmin() {
    if (await store.getAdmin()) return null;
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    let password = process.env.ADMIN_PASSWORD || '';
    let generated = false;
    if (!email || !password) {
      if (ON_VERCEL) return null; // login explains what to configure
      generated = true;
      password = crypto.randomBytes(12).toString('base64url');
    }
    const admin = { email: email || 'admin@trossachs.local', hash: hashPassword(password), ver: 1 };
    await store.setAdmin(admin);
    return { email: admin.email, password: generated ? password : null };
  }
  const ready = (async () => {
    await seedIfEmpty(store);
    return ensureAdmin();
  })();
  ready.catch(() => {}); // surfaced per request below

  /* ---------- response helpers ---------- */
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  const CSP =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

  function send(req, res, status, body, headers = {}) {
    const h = { ...baseHeaders, ...headers };
    const type = h['Content-Type'] || '';
    let payload = body;
    if (typeof payload === 'string') payload = Buffer.from(payload);
    if (!ON_VERCEL && payload && payload.length > 1024 && COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      payload = zlib.gzipSync(payload);
      h['Content-Encoding'] = 'gzip';
      h['Vary'] = 'Accept-Encoding';
    }
    h['Content-Length'] = payload ? payload.length : 0;
    res.writeHead(status, h);
    res.end(req.method === 'HEAD' ? undefined : payload);
  }
  const json = (req, res, status, obj, extra = {}) =>
    send(req, res, status, JSON.stringify(obj), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store', ...extra });
  const fail = (req, res, status, message, extra = {}) => json(req, res, status, { error: message, ...extra });

  const isSecure = (req) => req.socket?.encrypted || req.headers['x-forwarded-proto'] === 'https';
  function sessionCookie(req, token, maxAgeSec) {
    return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}${isSecure(req) ? '; Secure' : ''}`;
  }
  const tokenOf = (req) => parseCookies(req.headers.cookie)[SESSION_COOKIE] || '';
  const sessionOf = (req) => store.getSession(tokenOf(req));
  const clientIp = (req) => (req.headers['x-forwarded-for']?.split(',')[0].trim()) || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';

  async function readJson(req, limit = 512 * 1024) {
    const buf = await readBody(req, limit);
    if (!buf.length) return {};
    try {
      return JSON.parse(buf.toString('utf8'));
    } catch {
      throw Object.assign(new Error('Invalid JSON'), { status: 400 });
    }
  }

  /* ---------- static files (local server only; on Vercel the CDN serves /public) ---------- */
  function serveFile(req, res, file, { cache = 'no-cache' } = {}) {
    let stat;
    try {
      stat = fs.statSync(file);
      if (!stat.isFile()) return false;
    } catch {
      return false;
    }
    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', ETag: etag, 'Cache-Control': cache };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ...baseHeaders, ETag: etag, 'Cache-Control': cache });
      res.end();
      return true;
    }
    send(req, res, 200, fs.readFileSync(file), headers);
    return true;
  }
  function safeJoin(dir, rel) {
    const target = path.normalize(path.join(dir, rel));
    return target.startsWith(dir + path.sep) ? target : null;
  }

  /* ---------- public pages with SEO ---------- */
  const origin = (req) => siteUrl || `${isSecure(req) ? 'https' : 'http'}://${req.headers.host}`;

  async function renderIndex(req, res, status, route) {
    const content = await store.getAllContent();
    const { site, hero } = content;
    let title = site.title || site.name;
    let description = site.description || hero.description || '';
    let image = site.ogImage || '';
    let canonicalPath = '/';
    if (route?.project) {
      const p = route.project;
      title = `${p.title} — ${site.name}`;
      description = p.summary || description;
      image = p.cover || image;
      canonicalPath = `/work/${p.slug}`;
    }
    const base = origin(req);
    const absImg = image ? (image.startsWith('http') ? image : base + image) : '';
    const sameAs = [content.contact.upwork, content.contact.linkedin, content.contact.github].filter(Boolean);
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: base + '/',
      description: site.description,
      ...(sameAs.length ? { sameAs } : {}),
      ...(content.about.developerName ? { founder: { '@type': 'Person', name: content.about.developerName } } : {}),
    };
    const head = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}">`,
      `<link rel="canonical" href="${escapeHtml(base + canonicalPath)}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${escapeHtml(site.name)}">`,
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:description" content="${escapeHtml(description)}">`,
      `<meta property="og:url" content="${escapeHtml(base + canonicalPath)}">`,
      absImg ? `<meta property="og:image" content="${escapeHtml(absImg)}">` : '',
      `<meta name="twitter:card" content="${absImg ? 'summary_large_image' : 'summary'}">`,
      `<meta name="twitter:title" content="${escapeHtml(title)}">`,
      `<meta name="twitter:description" content="${escapeHtml(description)}">`,
      site.favicon ? `<link rel="icon" href="${escapeHtml(site.favicon)}">` : `<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">`,
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    ].filter(Boolean).join('\n');

    const boot = `<script type="application/json" id="boot">${JSON.stringify(content).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')}</script>`;
    const noscript = `<noscript><main><h1>${escapeHtml(hero.headline)}</h1><p>${escapeHtml(hero.description)}</p>` +
      `<h2>Services</h2><ul>${content.services.map((s) => `<li>${escapeHtml(s.title)}: ${escapeHtml(s.description)}</li>`).join('')}</ul>` +
      `<h2>Work</h2><ul>${content.projects.map((p) => `<li><a href="/work/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a>: ${escapeHtml(p.summary)}</li>`).join('')}</ul>` +
      `</main></noscript>`;
    const theme = ['light', 'dark'].includes(site.defaultTheme) ? site.defaultTheme : 'system';
    const html = view('index.html').replace('data-theme="system"', `data-theme="${theme}"`).replace('<!--HEAD-->', head).replace('<!--BOOT-->', boot).replace('<!--NOSCRIPT-->', noscript);
    send(req, res, status, html, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache', 'Content-Security-Policy': CSP });
  }

  /* ---------- public API ---------- */
  async function handlePublicApi(req, res, url) {
    if (req.method === 'GET' && url.pathname === '/api/content') return json(req, res, 200, await store.getAllContent());

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      if (!(await store.allow('contact:' + clientIp(req), 5, 60 * 60 * 1000))) return fail(req, res, 429, 'Too many messages. Please try again later.');
      const contact = await store.getSingleton('contact');
      if (contact.formEnabled === false) return fail(req, res, 403, 'The contact form is currently disabled.');
      const b = await readJson(req, 64 * 1024);
      if (b.website) return json(req, res, 200, { ok: true }); // honeypot: pretend success
      const msg = {
        name: cleanText(b.name || '', 120), email: cleanText(b.email || '', 200), company: cleanText(b.company || '', 160),
        type: cleanText(b.type || '', 120), budget: cleanText(b.budget || '', 120), body: cleanText(b.description || '', 5000),
      };
      const errors = {};
      if (msg.name.length < 2) errors.name = 'Please enter your name.';
      if (!isEmail(msg.email)) errors.email = 'Please enter a valid email address.';
      if (msg.body.length < 10) errors.description = 'Please describe your project in a few words.';
      if (Object.keys(errors).length) return fail(req, res, 422, 'Please check the highlighted fields.', { fields: errors });
      await store.addMessage(msg);
      return json(req, res, 201, { ok: true, message: contact.successMessage || 'Thank you.' });
    }
    return fail(req, res, 404, 'Not found');
  }

  /* ---------- admin API ---------- */
  async function prepareItem(collection, raw, existingId) {
    const data = sanitize(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Invalid data'), { status: 400 });
    delete data.id;
    if (collection === 'projects') {
      data.title = data.title || 'Untitled project';
      const slug = slugify(data.slug || data.title) || 'project';
      const taken = new Set((await store.listItems('projects')).filter((p) => p.id !== existingId).map((p) => p.slug));
      let candidate = slug;
      for (let n = 2; taken.has(candidate); n += 1) candidate = `${slug}-${n}`;
      data.slug = candidate;
    } else if (!data.title && collection !== 'nav') {
      throw Object.assign(new Error('A title is required.'), { status: 422 });
    } else if (collection === 'nav' && !data.label) {
      throw Object.assign(new Error('A label is required.'), { status: 422 });
    }
    return data;
  }

  async function handleAdminApi(req, res, url) {
    const ip = clientIp(req);
    const p = url.pathname;

    if (req.method === 'POST' && p === '/api/admin/login') {
      if (!(await store.allow('login:' + ip, 8, 15 * 60 * 1000))) return fail(req, res, 429, 'Too many attempts. Try again in 15 minutes.');
      const b = await readJson(req, 8 * 1024);
      const admin = await store.getAdmin();
      if (!admin) return fail(req, res, 503, 'The admin account has not been set up. Add ADMIN_EMAIL and ADMIN_PASSWORD in the project settings, then redeploy.');
      const email = String(b.email || '').trim().toLowerCase();
      // Always run a hash comparison so timing doesn't reveal whether the email matched.
      const ok = verifyPassword(String(b.password || ''), admin.hash);
      if (email !== admin.email || !ok) return fail(req, res, 401, 'Incorrect email or password.');
      const token = await store.createSession();
      return json(req, res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, token, SESSION_MS / 1000) });
    }

    const me = await sessionOf(req);
    if (!me) return fail(req, res, 401, 'Authentication required.');

    if (req.method === 'POST' && p === '/api/admin/logout') {
      await store.destroySession(tokenOf(req));
      return json(req, res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
    }
    if (req.method === 'GET' && p === '/api/admin/me') return json(req, res, 200, { email: me.email });

    if (req.method === 'GET' && p === '/api/admin/all') {
      const [content, media, unread] = await Promise.all([store.getAllContent({ admin: true }), store.listMedia(), store.unreadCount()]);
      return json(req, res, 200, { me: { email: me.email }, content, media, unread, uploads: Boolean(blob) });
    }

    if (req.method === 'POST' && p === '/api/admin/password') {
      if (!(await store.allow('pw:' + ip, 6, 15 * 60 * 1000))) return fail(req, res, 429, 'Too many attempts.');
      const b = await readJson(req, 8 * 1024);
      const admin = await store.getAdmin();
      if (!verifyPassword(String(b.current || ''), admin.hash)) return fail(req, res, 403, 'Current password is incorrect.');
      const next = String(b.next || '');
      if (next.length < 10) return fail(req, res, 422, 'Use at least 10 characters.');
      admin.hash = hashPassword(next);
      await store.setAdmin(admin);
      await store.bumpSessions(); // signs out every other session
      const token = await store.createSession(); // keep this one signed in
      return json(req, res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, token, SESSION_MS / 1000) });
    }

    let m;
    /* singleton content */
    if ((m = /^\/api\/admin\/content\/([a-z]+)$/.exec(p))) {
      const key = m[1];
      if (!SINGLETONS.includes(key)) return fail(req, res, 404, 'Unknown section');
      if (req.method === 'GET') return json(req, res, 200, await store.getSingleton(key));
      if (req.method === 'PUT') {
        const value = sanitize(await readJson(req));
        if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(req, res, 400, 'Invalid data');
        await store.setSingleton(key, value);
        return json(req, res, 200, value);
      }
    }

    /* collections */
    if ((m = /^\/api\/admin\/items\/([a-z]+)(?:\/(\d+|reorder))?$/.exec(p))) {
      const [, collection, rest] = m;
      if (!COLLECTIONS.includes(collection)) return fail(req, res, 404, 'Unknown collection');
      if (req.method === 'POST' && rest === 'reorder') {
        const b = await readJson(req, 16 * 1024);
        const ids = Array.isArray(b.ids) ? b.ids.map(Number) : [];
        if (!(await store.reorderItems(collection, ids))) return fail(req, res, 400, 'Order does not match the current items.');
        return json(req, res, 200, await store.listItems(collection));
      }
      if (req.method === 'POST' && !rest) {
        const id = await store.addItem(collection, await prepareItem(collection, await readJson(req)));
        return json(req, res, 201, await store.getItem(collection, id));
      }
      if (rest && /^\d+$/.test(rest)) {
        const id = Number(rest);
        if (!(await store.getItem(collection, id))) return fail(req, res, 404, 'Item not found');
        if (req.method === 'PUT') {
          await store.updateItem(collection, id, await prepareItem(collection, await readJson(req), id));
          return json(req, res, 200, await store.getItem(collection, id));
        }
        if (req.method === 'DELETE') {
          await store.deleteItem(collection, id);
          return json(req, res, 200, { ok: true });
        }
      }
    }

    /* media */
    if (p === '/api/admin/media' && req.method === 'POST') return handleUpload(req, res, null);
    if ((m = /^\/api\/admin\/media\/(\d+)(?:\/(replace))?$/.exec(p))) {
      const id = Number(m[1]);
      const row = await store.getMedia(id);
      if (!row) return fail(req, res, 404, 'Image not found');
      if (m[2] === 'replace' && req.method === 'POST') return handleUpload(req, res, row);
      if (req.method === 'PATCH') {
        const b = await readJson(req, 8 * 1024);
        return json(req, res, 200, await store.updateMedia(id, { alt: cleanText(b.alt || '', 250) }));
      }
      if (req.method === 'DELETE') {
        const uses = await store.countReferences(row.url);
        if (uses && url.searchParams.get('force') !== '1') {
          return fail(req, res, 409, 'This image is used on the site.', { used: uses });
        }
        if (uses) await store.replaceReferences(row.url, '');
        await store.deleteMedia(id);
        try { await blob?.del(row.url); } catch (e) { log.error?.('Could not delete stored file:', e.message); }
        return json(req, res, 200, { ok: true });
      }
    }

    /* messages */
    if (p === '/api/admin/messages' && req.method === 'GET') return json(req, res, 200, await store.listMessages());
    if ((m = /^\/api\/admin\/messages\/(\d+)$/.exec(p))) {
      const id = Number(m[1]);
      if (req.method === 'PATCH') {
        const b = await readJson(req, 4 * 1024);
        await store.setMessageRead(id, Boolean(b.read));
        return json(req, res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        await store.deleteMessage(id);
        return json(req, res, 200, { ok: true });
      }
    }
    return fail(req, res, 404, 'Not found');
  }

  async function handleUpload(req, res, replacing) {
    if (!blob) {
      return fail(req, res, 501, 'Image uploads are not set up yet. In Vercel, open Storage, create a Public Blob store, connect it to this project and redeploy.');
    }
    const buf = await readBody(req, MAX_UPLOAD + 64 * 1024);
    const { fields, files } = parseMultipart(buf, req.headers['content-type']);
    const file = files.find((f) => f.name === 'file') || files[0];
    if (!file || !file.data.length) return fail(req, res, 400, 'No file received.');
    if (file.data.length > MAX_UPLOAD) return fail(req, res, 413, 'Image is larger than 4 MB.');
    const kind = sniffImage(file.data);
    if (!kind) return fail(req, res, 415, 'Only PNG, JPEG, WebP, GIF and AVIF images are accepted.');
    const filename = randomName(kind.ext);
    const fileUrl = await blob.put(file.data, filename, kind.mime);
    const original = cleanText(file.filename || 'image', 120);
    if (replacing) {
      // A new URL keeps long-lived caching safe; every reference is re-pointed to it.
      await store.replaceReferences(replacing.url, fileUrl);
      const row = await store.updateMedia(replacing.id, { url: fileUrl, filename, original, mime: kind.mime, size: file.data.length, created: Date.now() });
      try { await blob.del(replacing.url); } catch (e) { log.error?.('Could not delete old file:', e.message); }
      return json(req, res, 200, row);
    }
    const row = await store.addMedia({ url: fileUrl, filename, original, mime: kind.mime, size: file.data.length, alt: cleanText(fields.alt || '', 250) });
    return json(req, res, 201, row);
  }

  /* ---------- main handler ---------- */
  async function handler(req, res) {
    try {
      try {
        await ready;
      } catch (err) {
        log.error?.('Startup failed:', err);
        return send(req, res, 503, 'The site is starting up or storage is unavailable. Please try again in a moment.', { 'Content-Type': MIME['.txt'], 'Cache-Control': 'no-store' });
      }
      const url = new URL(req.url, 'http://localhost');
      const p = url.pathname;
      const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);

      if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return send(req, res, 405, 'Method not allowed');

      if (p.startsWith('/api/')) {
        if (mutating) {
          // CSRF: custom header (cannot be set cross-site without CORS) + same-origin check.
          const reqOrigin = req.headers.origin;
          if (req.headers['x-requested-with'] !== 'tg' || (reqOrigin && new URL(reqOrigin).host !== req.headers.host)) {
            return fail(req, res, 403, 'Request blocked.');
          }
        }
        if (p.startsWith('/api/admin/')) return await handleAdminApi(req, res, url);
        return await handlePublicApi(req, res, url);
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, 'Method not allowed');

      /* admin pages: login is public, the dashboard page and its script need a valid session */
      if (p === '/admin' || p === '/admin/') {
        res.writeHead(302, { Location: (await sessionOf(req)) ? '/admin/dashboard' : '/admin/login', ...baseHeaders });
        return res.end();
      }
      if (p === '/admin/login') {
        if (await sessionOf(req)) { res.writeHead(302, { Location: '/admin/dashboard', ...baseHeaders }); return res.end(); }
        return sendPage(req, res, path.join(viewsDir, 'login.html'));
      }
      if (p === '/admin/dashboard' || p === '/admin/dashboard.js') {
        if (!(await sessionOf(req))) { res.writeHead(302, { Location: '/admin/login', ...baseHeaders, 'Cache-Control': 'no-store' }); return res.end(); }
        const file = path.join(privateDir, p === '/admin/dashboard' ? 'dashboard.html' : 'dashboard.js');
        return p.endsWith('.js') ? (serveFile(req, res, file, { cache: 'no-store' }) || notFound(req, res)) : sendPage(req, res, file, 'no-store');
      }

      if (p.startsWith('/uploads/') && blob?.kind === 'disk') {
        const file = safeJoin(blob.dir, decodeURIComponent(p.slice('/uploads/'.length)));
        return (file && serveFile(req, res, file, { cache: 'public, max-age=31536000, immutable' })) || notFound(req, res);
      }

      if (p === '/robots.txt') {
        return send(req, res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin(req)}/sitemap.xml\n`, { 'Content-Type': MIME['.txt'], 'Cache-Control': 'no-cache' });
      }
      if (p === '/sitemap.xml') {
        const base = origin(req);
        const urls = ['/', ...(await store.listItems('projects')).map((x) => `/work/${x.slug}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${escapeHtml(base + u)}</loc></url>`).join('\n')}\n</urlset>\n`;
        return send(req, res, 200, xml, { 'Content-Type': MIME['.xml'], 'Cache-Control': 'no-cache' });
      }

      if (p.startsWith('/assets/') || p.startsWith('/admin/')) {
        const file = safeJoin(publicDir, decodeURIComponent(p));
        if (file && !file.endsWith('.html') && serveFile(req, res, file)) return;
        return notFound(req, res);
      }

      if (p === '/' || p === '/index.html') return await renderIndex(req, res, 200, null);
      const wm = /^\/work\/([a-z0-9-]+)\/?$/.exec(p);
      if (wm) {
        const project = (await store.listItems('projects')).find((x) => x.slug === wm[1]);
        return project ? await renderIndex(req, res, 200, { project }) : await renderIndex(req, res, 404, null);
      }
      return await renderIndex(req, res, 404, null);
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) log.error?.('Server error:', err);
      if (!res.headersSent) fail(req, res, status, status >= 500 ? 'Something went wrong.' : err.message);
      else res.end();
    }
  }

  function sendPage(req, res, file, cache = 'no-cache') {
    if (!fs.existsSync(file)) return notFound(req, res);
    send(req, res, 200, fs.readFileSync(file), { 'Content-Type': MIME['.html'], 'Cache-Control': cache, 'Content-Security-Policy': CSP });
  }
  function notFound(req, res) {
    send(req, res, 404, 'Not found', { 'Content-Type': MIME['.txt'] });
  }

  const server = http.createServer(handler);
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  return {
    handler, server, store, ready,
    close: () => new Promise((r) => { server.close(() => r()); server.closeAllConnections?.(); }),
  };
}
