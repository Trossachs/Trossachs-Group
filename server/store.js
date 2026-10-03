// Domain data layer built on the key-value drivers in kv.js. Everything is async.
import crypto from 'node:crypto';

export const SINGLETONS = ['site', 'hero', 'about', 'philosophy', 'ai', 'stack', 'contact', 'footer'];
export const COLLECTIONS = ['services', 'projects', 'process', 'nav', 'principles'];

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
export const SESSION_SECONDS = 8 * 60 * 60;

export function createStore(kv) {
  /* ---------- admin account + sessions ---------- */
  const getAdmin = () => kv.get('admin');
  const setAdmin = (a) => kv.set('admin', a);

  async function createSession() {
    const admin = await getAdmin();
    const token = crypto.randomBytes(32).toString('base64url');
    await kv.set(`sess:${sha(token)}`, { ver: admin?.ver || 1 }, { ex: SESSION_SECONDS });
    return token;
  }
  async function getSession(token) {
    if (!token) return null;
    const [s, admin] = await Promise.all([kv.get(`sess:${sha(token)}`), getAdmin()]);
    if (!s || !admin || s.ver !== (admin.ver || 1)) return null;
    return { email: admin.email };
  }
  const destroySession = (token) => (token ? kv.del(`sess:${sha(token)}`) : Promise.resolve());
  /** Invalidate every session (they all carry the old version). */
  async function bumpSessions() {
    const admin = await getAdmin();
    admin.ver = (admin.ver || 1) + 1;
    await setAdmin(admin);
  }

  /* ---------- rate limiting (shared across serverless instances) ---------- */
  async function allow(key, max, windowMs) {
    const n = await kv.incrWindow(`rl:${key}`, Math.ceil(windowMs / 1000));
    return n <= max;
  }

  /* ---------- content ---------- */
  const getSingleton = async (key) => (await kv.get(`c:${key}`)) || {};
  const setSingleton = (key, value) => kv.set(`c:${key}`, value);

  async function getCollectionDoc(collection) {
    return (await kv.get(`i:${collection}`)) || { next: 1, list: [] };
  }
  const listItems = async (collection) => (await getCollectionDoc(collection)).list;
  const getItem = async (collection, id) => (await listItems(collection)).find((i) => i.id === id) || null;

  async function addItem(collection, data) {
    const doc = await getCollectionDoc(collection);
    const id = doc.next;
    doc.next += 1;
    doc.list.push({ id, ...data });
    await kv.set(`i:${collection}`, doc);
    return id;
  }
  async function updateItem(collection, id, data) {
    const doc = await getCollectionDoc(collection);
    const i = doc.list.findIndex((x) => x.id === id);
    if (i < 0) return 0;
    doc.list[i] = { id, ...data };
    await kv.set(`i:${collection}`, doc);
    return 1;
  }
  async function deleteItem(collection, id) {
    const doc = await getCollectionDoc(collection);
    const before = doc.list.length;
    doc.list = doc.list.filter((x) => x.id !== id);
    if (doc.list.length === before) return 0;
    await kv.set(`i:${collection}`, doc);
    return 1;
  }
  async function reorderItems(collection, ids) {
    const doc = await getCollectionDoc(collection);
    const byId = new Map(doc.list.map((x) => [x.id, x]));
    if (ids.length !== byId.size || !ids.every((i) => byId.has(i)) || new Set(ids).size !== ids.length) return false;
    doc.list = ids.map((i) => byId.get(i));
    await kv.set(`i:${collection}`, doc);
    return true;
  }

  async function getAllContent({ admin = false } = {}) {
    const keys = [...SINGLETONS.map((k) => `c:${k}`), ...COLLECTIONS.map((k) => `i:${k}`)];
    const [vals, mediaRows] = await Promise.all([kv.mget(keys), listMedia()]);
    const out = {};
    SINGLETONS.forEach((k, i) => (out[k] = vals[i] || {}));
    COLLECTIONS.forEach((k, i) => (out[k] = vals[SINGLETONS.length + i]?.list || []));
    if (!admin) out.nav = out.nav.filter((n) => n.visible !== false);
    out.alts = Object.fromEntries(mediaRows.filter((m) => m.alt).map((m) => [m.url, m.alt]));
    return out;
  }

  /** Re-point (or clear, when `to` is '') every reference to an image URL across all content. */
  async function replaceReferences(from, to) {
    const walk = (v) => {
      if (typeof v === 'string') return v === from ? to : v;
      if (Array.isArray(v)) return v.map(walk).filter((x) => x !== '' || to !== '');
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
      return v;
    };
    const keys = [...SINGLETONS.map((k) => `c:${k}`), ...COLLECTIONS.map((k) => `i:${k}`)];
    const vals = await kv.mget(keys);
    for (let i = 0; i < keys.length; i += 1) {
      if (!vals[i] || !JSON.stringify(vals[i]).includes(from)) continue;
      await kv.set(keys[i], walk(vals[i]));
    }
  }
  async function countReferences(url) {
    const keys = [...SINGLETONS.map((k) => `c:${k}`), ...COLLECTIONS.map((k) => `i:${k}`)];
    return (await kv.mget(keys)).filter((v) => v && JSON.stringify(v).includes(url)).length;
  }

  /* ---------- media ---------- */
  async function listMedia() {
    return Object.values(await kv.hgetall('media')).filter(Boolean).sort((a, b) => b.id - a.id);
  }
  async function getMedia(id) {
    return (await listMedia()).find((m) => m.id === id) || null;
  }
  async function addMedia(rec) {
    const id = await kv.incr('media:id');
    const row = { id, created: Date.now(), alt: '', ...rec };
    await kv.hset('media', id, row);
    return row;
  }
  async function updateMedia(id, patch) {
    const cur = await getMedia(id);
    if (!cur) return null;
    const row = { ...cur, ...patch, id };
    await kv.hset('media', id, row);
    return row;
  }
  const deleteMedia = (id) => kv.hdel('media', id);

  /* ---------- messages ---------- */
  async function addMessage(m) {
    const id = await kv.incr('msgs:id');
    await kv.hset('msgs', id, { id, created: Date.now(), is_read: 0, ...m });
    return id;
  }
  async function listMessages() {
    return Object.values(await kv.hgetall('msgs')).filter(Boolean).sort((a, b) => b.id - a.id).slice(0, 500);
  }
  async function setMessageRead(id, read) {
    const all = await kv.hgetall('msgs');
    const m = all[id];
    if (!m) return;
    await kv.hset('msgs', id, { ...m, is_read: read ? 1 : 0 });
  }
  const deleteMessage = (id) => kv.hdel('msgs', id);
  async function unreadCount() {
    return (await listMessages()).filter((m) => !m.is_read).length;
  }

  return {
    kv,
    getAdmin, setAdmin, createSession, getSession, destroySession, bumpSessions, allow,
    getSingleton, setSingleton, listItems, getItem, addItem, updateItem, deleteItem, reorderItems,
    getAllContent, replaceReferences, countReferences,
    listMedia, getMedia, addMedia, updateMedia, deleteMedia,
    addMessage, listMessages, setMessageRead, deleteMessage, unreadCount,
  };
}
