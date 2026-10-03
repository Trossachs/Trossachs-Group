// Image storage drivers. Both return a public URL string that is saved in the content.
import fs from 'node:fs';
import path from 'node:path';

/** Local disk (development, or a single server with a persistent disk). Served from /uploads/. */
export function createDiskBlob(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return {
    kind: 'disk',
    dir,
    async put(buffer, filename) {
      fs.writeFileSync(path.join(dir, filename), buffer, { mode: 0o644 });
      return `/uploads/${filename}`;
    },
    async del(url) {
      const m = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(url || '');
      if (m) fs.rmSync(path.join(dir, m[1]), { force: true });
    },
  };
}

/** Vercel Blob. Needs a *Public* Blob store connected to the project. The SDK is loaded only when used. */
export function createVercelBlob() {
  return {
    kind: 'vercel',
    async put(buffer, filename, mime) {
      const { put } = await import('@vercel/blob');
      const res = await put(`trossachs/${filename}`, buffer, { access: 'public', addRandomSuffix: false, contentType: mime });
      return res.url;
    },
    async del(url) {
      if (!/^https:\/\//.test(url || '')) return;
      const { del } = await import('@vercel/blob');
      await del(url);
    },
  };
}
