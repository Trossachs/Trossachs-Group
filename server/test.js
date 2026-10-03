// End-to-end API tests. Run: npm test
// The same suite runs three times: local file storage, the real Upstash REST client against a mock
// Upstash server (what Vercel uses), and the Upstash client with a fake Vercel Blob image store.
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRuntime, rootDir } from './runtime.js';
import { createFileKv, createUpstashKv } from './kv.js';
import { createDiskBlob } from './blob.js';
import { startMockUpstash } from './test-support/mock-upstash.js';

process.env.ADMIN_EMAIL = 'owner@example.com';
process.env.ADMIN_PASSWORD = 'correct-horse-battery';
delete process.env.VERCEL;

// A stand-in for Vercel Blob: hands out https URLs on the real hostname pattern and remembers files.
function createFakeVercelBlob() {
  const files = new Map();
  return {
    kind: 'vercel', files,
    async put(buffer, filename) { const url = `https://abc123.public.blob.vercel-storage.com/trossachs/${filename}`; files.set(url, buffer); return url; },
    async del(url) { files.delete(url); },
  };
}

// A 1x1 PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let totalPassed = 0;
let failures = 0;

async function suite(label, setup) {
  console.log(`\n══ ${label}`);
  const ctx = await setup();
  const app = await createRuntime({ kv: ctx.kv, blob: ctx.blob, app: { log: { error() {} } } });
  await app.ready;
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const isDisk = ctx.blob?.kind === 'disk';

  let cookie = '';
  async function call(method, url, body, { headers = {}, raw = false, auth = true, csrf = true } = {}) {
    const h = { ...headers };
    if (csrf && method !== 'GET') h['X-Requested-With'] = 'tg';
    if (auth && cookie) h.Cookie = cookie;
    let payload = body;
    if (body && !raw && !(body instanceof Uint8Array)) { payload = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    const res = await fetch(base + url, { method, headers: h, body: payload, redirect: 'manual' });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
  function multipart(filename, bytes, mime = 'image/png') {
    const b = '----tgtest' + Math.random().toString(16).slice(2);
    const head = Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`);
    const tail = Buffer.from(`\r\n--${b}--\r\n`);
    return { body: Buffer.concat([head, bytes, tail]), headers: { 'Content-Type': `multipart/form-data; boundary=${b}` } };
  }
  async function test(name, fn) {
    try { await fn(); totalPassed += 1; console.log('  ✓', name); }
    catch (e) { failures += 1; process.exitCode = 1; console.error('  ✗', name, '\n   ', e.message); }
  }

  await test('home page renders with SEO tags and boot data', async () => {
    const r = await call('GET', '/');
    assert.equal(r.status, 200);
    assert.match(r.data, /<title>Trossachs Group — Web Development, AI &amp; Digital Experiences<\/title>/);
    assert.match(r.data, /property="og:title"/);
    assert.match(r.data, /id="boot"/);
    assert.match(r.data, /application\/ld\+json/);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
    assert.match(r.headers.get('content-security-policy'), /public\.blob\.vercel-storage\.com/);
  });
  await test('project route has its own title; unknown route is 404', async () => {
    const ok = await call('GET', '/work/mira');
    assert.equal(ok.status, 200);
    assert.match(ok.data, /<title>Mira — Trossachs Group<\/title>/);
    assert.equal((await call('GET', '/work/does-not-exist')).status, 404);
    assert.equal((await call('GET', '/nope')).status, 404);
  });
  await test('robots.txt and sitemap.xml', async () => {
    assert.match((await call('GET', '/robots.txt')).data, /Disallow: \/admin/);
    assert.match((await call('GET', '/sitemap.xml')).data, /\/work\/humara/);
  });
  await test('public content API exposes content but no credentials', async () => {
    const r = await call('GET', '/api/content');
    assert.equal(r.status, 200);
    assert.equal(r.data.projects.length, 5);
    assert.equal(r.data.services.length, 6);
    assert.equal(r.data.process.length, 6);
    assert.ok(!/hash|password|owner@example|scrypt/i.test(JSON.stringify(r.data)));
  });
  await test('starter content is seeded only once', async () => {
    const again = await createRuntime({ kv: ctx.kv, blob: ctx.blob, app: { log: { error() {} } } });
    await again.ready;
    assert.equal((await call('GET', '/api/content')).data.projects.length, 5);
  });

  await test('admin API requires authentication', async () => {
    for (const [m, u] of [['GET', '/api/admin/all'], ['PUT', '/api/admin/content/hero'], ['POST', '/api/admin/items/services'], ['POST', '/api/admin/media'], ['GET', '/api/admin/messages']]) {
      assert.equal((await call(m, u, m === 'GET' ? undefined : {}, { auth: false })).status, 401, `${m} ${u}`);
    }
  });
  await test('dashboard page and script redirect to login when signed out', async () => {
    for (const u of ['/admin/dashboard', '/admin/dashboard.js']) {
      const r = await call('GET', u, undefined, { auth: false });
      assert.equal(r.status, 302);
      assert.equal(r.headers.get('location'), '/admin/login');
    }
    assert.equal((await call('GET', '/admin/login', undefined, { auth: false })).status, 200);
  });
  await test('credentials never appear in public assets', async () => {
    for (const u of ['/assets/site.js', '/assets/site.css', '/admin/login.js']) {
      const r = await call('GET', u, undefined, { auth: false });
      if (r.status === 200) assert.ok(!/correct-horse|owner@example/.test(r.data));
    }
  });

  await test('wrong password and wrong email are rejected identically', async () => {
    const a = await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'wrong-password' });
    const b = await call('POST', '/api/admin/login', { email: 'nobody@example.com', password: 'correct-horse-battery' });
    assert.equal(a.status, 401); assert.equal(b.status, 401);
    assert.equal(a.data.error, b.data.error);
  });
  await test('login without CSRF header is blocked', async () => {
    assert.equal((await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'correct-horse-battery' }, { csrf: false })).status, 403);
  });
  await test('valid login sets an HttpOnly, SameSite=Strict cookie', async () => {
    const r = await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'correct-horse-battery' });
    assert.equal(r.status, 200);
    const sc = r.headers.get('set-cookie');
    assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Strict/);
    cookie = sc.split(';')[0];
  });
  await test('dashboard is served when signed in', async () => {
    const r = await call('GET', '/admin/dashboard');
    assert.equal(r.status, 200);
    assert.match(r.data, /Trossachs/);
    assert.equal((await call('GET', '/admin/dashboard.js')).status, 200);
  });

  await test('editing hero is reflected immediately on the public site', async () => {
    const hero = (await call('GET', '/api/admin/content/hero')).data;
    hero.headline = 'A brand new headline';
    assert.equal((await call('PUT', '/api/admin/content/hero', hero)).status, 200);
    assert.equal((await call('GET', '/api/content', undefined, { auth: false })).data.hero.headline, 'A brand new headline');
    assert.match((await call('GET', '/', undefined, { auth: false })).data, /A brand new headline/);
  });
  await test('HTML, script URLs and foreign image URLs are sanitised', async () => {
    const hero = (await call('GET', '/api/admin/content/hero')).data;
    hero.description = 'Hello <script>alert(1)</script><b>world</b>';
    hero.ctaPrimaryHref = 'javascript:alert(1)';
    hero.ctaSecondaryHref = 'https://example.com/x';
    hero.heroImage = 'https://evil.example/x.png';
    const r = (await call('PUT', '/api/admin/content/hero', hero)).data;
    assert.ok(!/[<>]/.test(r.description), r.description);
    assert.equal(r.ctaPrimaryHref, '');
    assert.equal(r.ctaSecondaryHref, 'https://example.com/x');
    assert.equal(r.heroImage, '');
    hero.heroImage = 'https://evil.public.blob.vercel-storage.com.attacker.example/x.png';
    assert.equal((await call('PUT', '/api/admin/content/hero', hero)).data.heroImage, '');
  });
  await test('unknown content sections are rejected', async () => {
    assert.equal((await call('PUT', '/api/admin/content/users', {})).status, 404);
    assert.equal((await call('PUT', '/api/admin/content/admin', {})).status, 404);
  });
  await test('services: create, edit, reorder, delete', async () => {
    const created = await call('POST', '/api/admin/items/services', { title: 'Test Service', description: 'd', icon: 'code' });
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.equal((await call('PUT', `/api/admin/items/services/${id}`, { title: 'Renamed', description: 'd2', icon: 'cube' })).data.title, 'Renamed');
    const ids = (await call('GET', '/api/admin/all')).data.content.services.map((s) => s.id);
    const reversed = [...ids].reverse();
    assert.deepEqual((await call('POST', '/api/admin/items/services/reorder', { ids: reversed })).data.map((s) => s.id), reversed);
    assert.equal((await call('POST', '/api/admin/items/services/reorder', { ids: [1, 2] })).status, 400);
    assert.equal((await call('POST', '/api/admin/items/services/reorder', { ids: [reversed[0], reversed[0], ...reversed.slice(2)] })).status, 400);
    assert.equal((await call('DELETE', `/api/admin/items/services/${id}`)).status, 200);
    assert.equal((await call('GET', '/api/content', undefined, { auth: false })).data.services.length, 6);
  });
  await test('projects: slug generation, uniqueness and featured flag', async () => {
    const a = await call('POST', '/api/admin/items/projects', { title: 'My New Project!', category: 'Website', featured: true, technologies: ['A', 'B'] });
    assert.equal(a.data.slug, 'my-new-project');
    const b = await call('POST', '/api/admin/items/projects', { title: 'My New Project!' });
    assert.equal(b.data.slug, 'my-new-project-2');
    assert.equal(a.data.featured, true);
    assert.equal((await call('GET', '/work/my-new-project', undefined, { auth: false })).status, 200);
    await call('DELETE', `/api/admin/items/projects/${a.data.id}`);
    await call('DELETE', `/api/admin/items/projects/${b.data.id}`);
    assert.equal((await call('GET', '/work/my-new-project', undefined, { auth: false })).status, 404);
  });
  await test('hidden navigation items are excluded from the public site only', async () => {
    const nav = (await call('GET', '/api/admin/all')).data.content.nav;
    const target = nav[1];
    await call('PUT', `/api/admin/items/nav/${target.id}`, { ...target, visible: false });
    assert.ok(!(await call('GET', '/api/content', undefined, { auth: false })).data.nav.some((n) => n.id === target.id));
    assert.ok((await call('GET', '/api/admin/all')).data.content.nav.some((n) => n.id === target.id));
    await call('PUT', `/api/admin/items/nav/${target.id}`, { ...target, visible: true });
  });

  let media;
  await test('upload a valid PNG', async () => {
    const mp = multipart('logo.png', PNG);
    const r = await call('POST', '/api/admin/media', mp.body, { headers: mp.headers, raw: true });
    assert.equal(r.status, 201); media = r.data;
    assert.ok(isDisk ? /^\/uploads\/[a-f0-9]+\.png$/.test(media.url) : /^https:\/\/abc123\.public\.blob\.vercel-storage\.com\//.test(media.url), media.url);
    if (isDisk) {
      const served = await fetch(base + media.url);
      assert.equal(served.status, 200);
      assert.equal(served.headers.get('content-type'), 'image/png');
      assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
    } else {
      assert.ok(ctx.blob.files.has(media.url));
    }
  });
  await test('reject SVG, executables and disguised files', async () => {
    for (const [name, bytes, mime] of [
      ['x.svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'image/svg+xml'],
      ['x.png', Buffer.from('<?php echo 1; ?> this is not an image at all'), 'image/png'],
      ['x.exe', Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff'), 'application/octet-stream'],
    ]) {
      const mp = multipart(name, bytes, mime);
      assert.equal((await call('POST', '/api/admin/media', mp.body, { headers: mp.headers, raw: true })).status, 415, name);
    }
  });
  await test('uploads over 4 MB are refused', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024 + 10)]);
    const mp = multipart('big.png', big);
    const r = await call('POST', '/api/admin/media', mp.body, { headers: mp.headers, raw: true });
    assert.ok([413, 400].includes(r.status), String(r.status));
  });
  await test('alt text is saved and exposed to the public site', async () => {
    assert.equal((await call('PATCH', `/api/admin/media/${media.id}`, { alt: 'A tiny test image' })).data.alt, 'A tiny test image');
    assert.equal((await call('GET', '/api/content', undefined, { auth: false })).data.alts[media.url], 'A tiny test image');
  });
  await test('assign an image, block deletion while used, replace re-points references', async () => {
    const hero = (await call('GET', '/api/admin/content/hero')).data;
    await call('PUT', '/api/admin/content/hero', { ...hero, heroImage: media.url });
    assert.equal((await call('GET', '/api/admin/content/hero')).data.heroImage, media.url);
    assert.equal((await call('DELETE', `/api/admin/media/${media.id}`)).status, 409);
    const old = media.url;
    const mp = multipart('new.png', PNG);
    const rep = await call('POST', `/api/admin/media/${media.id}/replace`, mp.body, { headers: mp.headers, raw: true });
    assert.equal(rep.status, 200);
    assert.notEqual(rep.data.url, old);
    assert.equal((await call('GET', '/api/admin/content/hero')).data.heroImage, rep.data.url);
    if (isDisk) assert.equal((await fetch(base + old)).status, 404); else assert.ok(!ctx.blob.files.has(old));
    media = rep.data;
  });
  await test('forced delete removes the file and clears references', async () => {
    assert.equal((await call('DELETE', `/api/admin/media/${media.id}?force=1`)).status, 200);
    assert.equal((await call('GET', '/api/admin/content/hero')).data.heroImage, '');
    if (isDisk) assert.equal((await fetch(base + media.url)).status, 404); else assert.ok(!ctx.blob.files.has(media.url));
    assert.equal((await call('GET', '/api/admin/all')).data.media.length, 0);
  });
  await test('path traversal is refused', async () => {
    assert.equal((await fetch(base + '/uploads/..%2f..%2fdata%2fstore.json')).status, 404);
    assert.equal((await fetch(base + '/assets/..%2fserver%2fapp.js')).status, 404);
    assert.equal((await fetch(base + '/admin/..%2fprivate%2fdashboard.js')).status, 404);
  });

  await test('contact form: validation, success, honeypot, inbox', async () => {
    const bad = await call('POST', '/api/contact', { name: 'A', email: 'nope', description: 'short' }, { auth: false });
    assert.equal(bad.status, 422); assert.ok(bad.data.fields.name && bad.data.fields.email && bad.data.fields.description);
    const ok = await call('POST', '/api/contact', { name: 'Ada Obi', email: 'ada@example.com', company: 'Acme', type: 'Business website', budget: '$500 – $1,500', description: 'I need a website for my clinic <b>please</b>' }, { auth: false });
    assert.equal(ok.status, 201);
    assert.equal((await call('POST', '/api/contact', { name: 'Bot Bot', email: 'bot@example.com', description: 'spam spam spam spam', website: 'http://spam' }, { auth: false })).status, 200);
    const msgs = (await call('GET', '/api/admin/messages')).data;
    assert.equal(msgs.length, 1);
    assert.ok(!/<b>/.test(msgs[0].body));
    assert.equal((await call('GET', '/api/admin/all')).data.unread, 1);
    await call('PATCH', `/api/admin/messages/${msgs[0].id}`, { read: true });
    assert.equal((await call('GET', '/api/admin/all')).data.unread, 0);
    await call('DELETE', `/api/admin/messages/${msgs[0].id}`);
    assert.equal((await call('GET', '/api/admin/messages')).data.length, 0);
  });
  await test('contact form can be disabled from the dashboard', async () => {
    const c = (await call('GET', '/api/admin/content/contact')).data;
    await call('PUT', '/api/admin/content/contact', { ...c, formEnabled: false });
    assert.equal((await call('POST', '/api/contact', { name: 'Ada Obi', email: 'ada@example.com', description: 'a long enough description' }, { auth: false })).status, 403);
    await call('PUT', '/api/admin/content/contact', { ...c, formEnabled: true });
  });

  await test('password change validates, signs out other sessions, keeps this one', async () => {
    const other = (await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'correct-horse-battery' }, { auth: false })).headers.get('set-cookie').split(';')[0];
    assert.equal((await call('POST', '/api/admin/password', { current: 'bad', next: 'a-long-new-password' })).status, 403);
    assert.equal((await call('POST', '/api/admin/password', { current: 'correct-horse-battery', next: 'short' })).status, 422);
    const r = await call('POST', '/api/admin/password', { current: 'correct-horse-battery', next: 'a-long-new-password' });
    assert.equal(r.status, 200);
    cookie = r.headers.get('set-cookie').split(';')[0];
    assert.equal((await call('GET', '/api/admin/me')).status, 200);
    assert.equal((await call('GET', '/api/admin/me', undefined, { auth: false, headers: { Cookie: other } })).status, 401);
    assert.equal((await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'correct-horse-battery' }, { auth: false })).status, 401);
    assert.equal((await call('POST', '/api/admin/login', { email: 'owner@example.com', password: 'a-long-new-password' }, { auth: false })).status, 200);
  });
  await test('logout invalidates the session', async () => {
    const old = cookie;
    assert.equal((await call('POST', '/api/admin/logout', {})).status, 200);
    cookie = old;
    assert.equal((await call('GET', '/api/admin/me')).status, 401);
    cookie = '';
  });
  await test('login is rate limited', async () => {
    let last;
    for (let i = 0; i < 10; i += 1) last = await call('POST', '/api/admin/login', { email: 'x@example.com', password: 'nope-nope-nope' });
    assert.equal(last.status, 429);
  });

  await app.close();
  return ctx;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-test-'));

await suite('Local files (development / single server)', async () => ({
  kv: createFileKv(path.join(tmp, 'a')),
  blob: createDiskBlob(path.join(tmp, 'a', 'uploads')),
}));

let mock = await startMockUpstash();
await suite('Upstash REST client against a mock Upstash server + disk images', async () => ({
  kv: createUpstashKv({ url: mock.url, token: mock.token }),
  blob: createDiskBlob(path.join(tmp, 'b', 'uploads')),
}));
console.log(`  (mock Upstash handled ${mock.stats.commands} commands in ${mock.stats.pipelines} pipelines)`);
await mock.close();

mock = await startMockUpstash();
const fakeBlob = createFakeVercelBlob();
await suite('Vercel shape: Upstash REST + Blob-style image URLs', async () => ({
  kv: createUpstashKv({ url: mock.url, token: mock.token }),
  blob: fakeBlob,
}));
await mock.close();

// A wrong token must fail closed, not serve or write anything.
{
  const bad = await startMockUpstash('right-token');
  const kv = createUpstashKv({ url: bad.url, token: 'wrong-token' });
  try {
    await createRuntime({ kv, blob: null, app: { log: { error() {} } } }).then((a) => a.ready);
    console.error('  ✗ wrong storage token should fail'); process.exitCode = 1; failures += 1;
  } catch (e) {
    console.log('  ✓ wrong storage token fails closed:', e.message); totalPassed += 1;
  }
  await bad.close();
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${totalPassed} passed${failures ? `, ${failures} FAILED` : ''}\n`);
