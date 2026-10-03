import crypto from 'node:crypto';

/* ---------- passwords ---------- */
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`;
}

export function verifyPassword(pw, stored) {
  try {
    const [scheme, s, h] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(h, 'hex');
    const actual = crypto.scryptSync(pw, Buffer.from(s, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ---------- sessions (stored by store.js) ---------- */
export const SESSION_COOKIE = 'tg_session';
export const SESSION_MS = 8 * 60 * 60 * 1000;

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/* ---------- sanitising user-supplied content ---------- */
const MAX_STR = 6000;
const IMAGE_KEY = /(image|logo|favicon|cover|gallery)$/i;
const URL_KEY = /^(href|url|upwork|linkedin|github)$|(Href|Url)$/;
const COLOR_KEY = /(accent|color)$/i;

export function cleanText(s, max = MAX_STR) {
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, max)
    .trim();
}

export function safeUrl(u) {
  const v = cleanText(u, 500);
  if (!v) return '';
  if (v.startsWith('//')) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) && !/\s/.test(v)) return v;
  return '';
}

export function safeImagePath(p) {
  const v = cleanText(p, 300);
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(v)) return v; // local disk uploads
  if (/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[A-Za-z0-9._\/-]+$/i.test(v)) return v; // Vercel Blob
  return '';
}

export function sanitize(value, key = '', depth = 0) {
  if (depth > 6) return null;
  if (typeof value === 'string') {
    if (IMAGE_KEY.test(key)) return safeImagePath(value);
    if (URL_KEY.test(key)) return safeUrl(value);
    if (COLOR_KEY.test(key)) return /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : '';
    return cleanText(value);
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value
      .slice(0, 60)
      .map((v) => sanitize(v, key, depth + 1))
      .filter((v) => v !== null && v !== '');
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 60)) {
      if (!/^[A-Za-z0-9_]{1,40}$/.test(k)) continue;
      const s = sanitize(v, k, depth + 1);
      if (s !== null) out[k] = s;
    }
    return out;
  }
  return null;
}

export function slugify(s) {
  return cleanText(s, 80)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const isEmail = (s) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(s);
