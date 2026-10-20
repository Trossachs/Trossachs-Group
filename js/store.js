/* Content store shared by the site and the admin.
   Order of precedence: edits saved in this browser > js/content.js (published) > js/defaults.js. */
(function () {
  var LS_CONTENT = 'tg-content-v1', LS_MSG = 'tg-messages-v1';
  var D = window.TG_DEFAULTS || {}, P = window.TG_PUBLISHED || {};

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }
  function merge(a, b) {
    if (isObj(a) && isObj(b)) {
      var o = {}, k;
      for (k in a) o[k] = a[k];
      for (k in b) o[k] = (k in a) ? merge(a[k], b[k]) : b[k];
      return o;
    }
    return b === undefined ? a : b;
  }
  function getPath(o, path) {
    var p = path.split('.'), c = o, i;
    for (i = 0; i < p.length; i++) { if (c == null) return undefined; c = c[p[i]]; }
    return c;
  }
  function setPath(o, path, v) {
    var p = path.split('.'), c = o, i;
    for (i = 0; i < p.length - 1; i++) { if (!isObj(c[p[i]])) c[p[i]] = {}; c = c[p[i]]; }
    c[p[p.length - 1]] = v;
  }
  function delPath(o, path) {
    var p = path.split('.'), stack = [o], c = o, i;
    for (i = 0; i < p.length - 1; i++) { c = c && c[p[i]]; if (!isObj(c)) return; stack.push(c); }
    delete c[p[p.length - 1]];
    for (i = stack.length - 1; i > 0; i--) {
      if (Object.keys(stack[i]).length === 0) delete stack[i - 1][p[i - 1]]; else break;
    }
  }
  function read(key, fallback) {
    try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  var local = read(LS_CONTENT, {}); if (!isObj(local)) local = {};
  var base = merge(D, P), cache = null, subs = [], msubs = [];

  function content() { return cache || (cache = merge(base, local)); }
  function emit(src) { cache = null; subs.slice().forEach(function (f) { try { f(src); } catch (e) { console.error(e); } }); }
  function emitM(src) { msubs.slice().forEach(function (f) { try { f(src); } catch (e) { console.error(e); } }); }

  /* ---------- helpers used by both pages ---------- */
  var U = {
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    safeUrl: function (u) {
      u = String(u == null ? '' : u).trim();
      if (!u) return '';
      if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(u)) return u;
      if (/^(https?:)?\/\//i.test(u)) return u;
      if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
      return u;
    },
    safeHref: function (u) {
      u = String(u == null ? '' : u).trim();
      if (!u) return '';
      if (/^(https?:\/\/|mailto:|tel:|#|\/|\.\/)/i.test(u)) return u;
      if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
      return 'https://' + u;
    },
    telHref: function (p) {
      var d = String(p || '').replace(/[^\d+]/g, '');
      if (/^0\d{10}$/.test(d)) d = '+234' + d.slice(1);
      return d ? 'tel:' + d : '';
    },
    isEmail: function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); },
    isPhone: function (s) {
      var n = (String(s).match(/\d/g) || []).length;
      return /^[\d\s()+.\-]+$/.test(s) && n >= 7 && n <= 15;
    },
    clone: clone
  };

  /* ---------- content API ---------- */
  var TG = {
    defaults: D, published: P, util: U,
    get: function (path) { return getPath(content(), path); },
    baseValue: function (path) { return getPath(base, path); },
    isModified: function (path) { return getPath(local, path) !== undefined; },
    hasLocal: function () { return Object.keys(local).length > 0; },
    local: function () { return clone(local); },
    setLocal: function (path, val) {
      var next = clone(local); setPath(next, path, clone(val));
      if (!write(LS_CONTENT, next)) return false;
      local = next; emit('local'); return true;
    },
    resetPath: function (path) {
      var next = clone(local); delPath(next, path);
      write(LS_CONTENT, next); local = next; emit('local');
    },
    resetAll: function () { try { localStorage.removeItem(LS_CONTENT); } catch (e) {} local = {}; emit('local'); },
    replaceLocal: function (obj) {
      if (!isObj(obj)) return false;
      if (!write(LS_CONTENT, obj)) return false;
      local = clone(obj); emit('local'); return true;
    },
    /* everything that differs from the defaults: published file plus edits made here */
    exportPublished: function () { return merge(P, local); },
    storageBytes: function () {
      var n = 0;
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {}
      return n * 2;
    },
    on: function (fn) { subs.push(fn); }
  };

  /* ---------- contact messages (the admin inbox) ---------- */
  TG.messages = {
    list: function () { var l = read(LS_MSG, []); return Array.isArray(l) ? l : []; },
    add: function (m) {
      var l = this.list(); l.unshift(m); if (l.length > 500) l.length = 500;
      var ok = write(LS_MSG, l); if (ok) emitM('local'); return ok;
    },
    remove: function (id) {
      var l = this.list().filter(function (m) { return m.id !== id; });
      var ok = write(LS_MSG, l); if (ok) emitM('local'); return ok;
    },
    clear: function () { try { localStorage.removeItem(LS_MSG); } catch (e) {} emitM('local'); },
    setRead: function (id, flag) {
      var l = this.list(); l.forEach(function (m) { if (m.id === id) m.read = !!flag; });
      var ok = write(LS_MSG, l); if (ok) emitM('local'); return ok;
    },
    unread: function () { return this.list().filter(function (m) { return !m.read; }).length; },
    on: function (fn) { msubs.push(fn); }
  };

  /* edits made in another tab or in the admin preview frame */
  window.addEventListener('storage', function (e) {
    if (e.key === LS_CONTENT || e.key === null) { local = read(LS_CONTENT, {}); if (!isObj(local)) local = {}; emit('external'); }
    if (e.key === LS_MSG || e.key === null) emitM('external');
  });

  window.TG = TG;
})();
