// Tiny async key-value layer with two interchangeable drivers:
//   • Upstash Redis over its REST API (what runs on Vercel; needs no npm package, only fetch)
//   • A local JSON file (development, tests, or a single always-on server)
// Values are JSON-serialised here, so callers deal in plain objects.
import fs from 'node:fs';
import path from 'node:path';

const enc = (v) => JSON.stringify(v);
const dec = (s) => {
  if (s == null) return null;
  try { return JSON.parse(s); } catch { return null; }
};

/* ------------------------------------------------------------ Upstash REST */
export function createUpstashKv({ url, token, fetchImpl = fetch }) {
  const base = url.replace(/\/+$/, '');

  async function call(path_, body, attempt = 0) {
    let res;
    try {
      res = await fetchImpl(base + path_, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (attempt < 1) return call(path_, body, attempt + 1); // one retry on network failure
      throw new Error(`Storage unreachable: ${err.message}`);
    }
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || (data && !Array.isArray(data) && data.error)) {
      throw new Error(`Storage error: ${data?.error || res.status}`);
    }
    return data;
  }
  const cmd = async (...args) => (await call('/', args)).result;
  const pipeline = async (cmds) => {
    const out = await call('/pipeline', cmds);
    return out.map((o) => {
      if (o.error) throw new Error(`Storage error: ${o.error}`);
      return o.result;
    });
  };
  const pairs = (flat) => {
    if (!flat) return {};
    if (!Array.isArray(flat)) return flat; // object form (RESP3)
    const o = {};
    for (let i = 0; i < flat.length; i += 2) o[flat[i]] = flat[i + 1];
    return o;
  };

  return {
    kind: 'upstash',
    async get(key) { return dec(await cmd('GET', key)); },
    async mget(keys) {
      if (!keys.length) return [];
      return (await cmd('MGET', ...keys)).map(dec);
    },
    async set(key, value, { ex } = {}) { await (ex ? cmd('SET', key, enc(value), 'EX', String(ex)) : cmd('SET', key, enc(value))); },
    async setnx(key, value, { ex } = {}) {
      const r = await (ex ? cmd('SET', key, enc(value), 'NX', 'EX', String(ex)) : cmd('SET', key, enc(value), 'NX'));
      return r === 'OK';
    },
    async del(key) { await cmd('DEL', key); },
    async incr(key) { return Number(await cmd('INCR', key)); },
    async incrWindow(key, windowSec) {
      const [n] = await pipeline([['INCR', key], ['EXPIRE', key, String(windowSec)]]);
      return Number(n);
    },
    async hgetall(key) {
      const o = pairs(await cmd('HGETALL', key));
      return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, dec(v)]));
    },
    async hset(key, field, value) { await cmd('HSET', key, String(field), enc(value)); },
    async hdel(key, field) { await cmd('HDEL', key, String(field)); },
  };
}

/* ------------------------------------------------------------ local file */
export function createFileKv(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'store.json');
  let data = { strings: {}, hashes: {}, expires: {} };
  try { data = { strings: {}, hashes: {}, expires: {}, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { /* first run */ }
  let timer = null;

  function persist() {
    if (timer) return;
    timer = setTimeout(flush, 25);
  }
  function flush() {
    timer = null;
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, file);
  }
  const alive = (key) => {
    const exp = data.expires[key];
    if (exp && exp < Date.now()) { delete data.strings[key]; delete data.expires[key]; return false; }
    return key in data.strings;
  };
  process.on('exit', () => { if (timer) { clearTimeout(timer); try { flush(); } catch { /* ignore */ } } });

  return {
    kind: 'file',
    async get(key) { return alive(key) ? dec(data.strings[key]) : null; },
    async mget(keys) { return keys.map((k) => (alive(k) ? dec(data.strings[k]) : null)); },
    async set(key, value, { ex } = {}) {
      data.strings[key] = enc(value);
      if (ex) data.expires[key] = Date.now() + ex * 1000; else delete data.expires[key];
      persist();
    },
    async setnx(key, value, opts = {}) {
      if (alive(key)) return false;
      await this.set(key, value, opts);
      return true;
    },
    async del(key) { delete data.strings[key]; delete data.expires[key]; persist(); },
    async incr(key) {
      const n = (alive(key) ? Number(dec(data.strings[key])) : 0) + 1;
      data.strings[key] = enc(n); persist();
      return n;
    },
    async incrWindow(key, windowSec) {
      const n = (alive(key) ? Number(dec(data.strings[key])) : 0) + 1;
      data.strings[key] = enc(n);
      data.expires[key] = Date.now() + windowSec * 1000;
      persist();
      return n;
    },
    async hgetall(key) {
      return Object.fromEntries(Object.entries(data.hashes[key] || {}).map(([k, v]) => [k, dec(v)]));
    },
    async hset(key, field, value) { (data.hashes[key] ||= {})[String(field)] = enc(value); persist(); },
    async hdel(key, field) { if (data.hashes[key]) delete data.hashes[key][String(field)]; persist(); },
    flush,
  };
}
