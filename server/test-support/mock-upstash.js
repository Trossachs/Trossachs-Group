// A small in-memory server that speaks the Upstash Redis REST protocol (single command at "/",
// batches at "/pipeline", bearer-token auth, flat HGETALL arrays). Used only by the tests, so the
// real REST client in kv.js is exercised without needing a network or an account.
import http from 'node:http';

export function startMockUpstash(token = 'test-token') {
  const strings = new Map();
  const expires = new Map();
  const hashes = new Map();
  const alive = (k) => {
    const e = expires.get(k);
    if (e && e < Date.now()) { strings.delete(k); expires.delete(k); }
    return strings.has(k);
  };
  const stats = { commands: 0, pipelines: 0 };

  function run([name, ...a]) {
    stats.commands += 1;
    switch (String(name).toUpperCase()) {
      case 'GET': return alive(a[0]) ? strings.get(a[0]) : null;
      case 'MGET': return a.map((k) => (alive(k) ? strings.get(k) : null));
      case 'SET': {
        const [k, v, ...opts] = a;
        const up = opts.map((o) => String(o).toUpperCase());
        if (up.includes('NX') && alive(k)) return null;
        strings.set(k, String(v));
        const ix = up.indexOf('EX');
        if (ix >= 0) expires.set(k, Date.now() + Number(opts[ix + 1]) * 1000); else expires.delete(k);
        return 'OK';
      }
      case 'DEL': { const had = alive(a[0]); strings.delete(a[0]); expires.delete(a[0]); return had ? 1 : 0; }
      case 'INCR': {
        const n = (alive(a[0]) ? Number(strings.get(a[0])) : 0) + 1;
        if (Number.isNaN(n)) throw new Error('ERR value is not an integer or out of range');
        strings.set(a[0], String(n));
        return n;
      }
      case 'EXPIRE': if (!alive(a[0])) return 0; expires.set(a[0], Date.now() + Number(a[1]) * 1000); return 1;
      case 'HSET': { const h = hashes.get(a[0]) || new Map(); const isNew = !h.has(a[1]); h.set(a[1], String(a[2])); hashes.set(a[0], h); return isNew ? 1 : 0; }
      case 'HDEL': { const h = hashes.get(a[0]); return h && h.delete(a[1]) ? 1 : 0; }
      case 'HGETALL': { const h = hashes.get(a[0]); return h ? [...h].flat() : []; }
      default: throw new Error(`ERR unknown command '${name}'`);
    }
  }
  const exec = (c) => { try { return { result: run(c) }; } catch (e) { return { error: e.message }; } };

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const send = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      if (req.headers.authorization !== `Bearer ${token}`) return send(401, { error: 'WRONGPASS invalid or missing token' });
      let parsed;
      try { parsed = JSON.parse(body); } catch { return send(400, { error: 'ERR invalid JSON' }); }
      if (req.url === '/pipeline') { stats.pipelines += 1; return send(200, parsed.map(exec)); }
      if (req.url === '/') { const r = exec(parsed); return send(r.error ? 400 : 200, r); }
      return send(404, { error: 'not found' });
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`, token, stats, strings,
    close: () => new Promise((r) => { server.close(r); server.closeAllConnections?.(); }),
  })));
}
