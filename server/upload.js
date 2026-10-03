import crypto from 'node:crypto';

export const MAX_UPLOAD = 4 * 1024 * 1024; // Vercel functions reject request bodies over 4.5 MB

export function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Minimal multipart/form-data parser. Returns { fields, files }. */
export function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) throw Object.assign(new Error('Missing multipart boundary'), { status: 400 });
  const boundary = Buffer.from('--' + (m[1] || m[2]));
  const fields = {};
  const files = [];
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    const start = pos + boundary.length;
    if (buf.slice(start, start + 2).toString() === '--') break;
    const headerStart = start + 2; // skip CRLF
    const headerEnd = buf.indexOf('\r\n\r\n', headerStart);
    if (headerEnd === -1) break;
    const headers = buf.slice(headerStart, headerEnd).toString('utf8');
    const next = buf.indexOf(boundary, headerEnd + 4);
    if (next === -1) break;
    const data = buf.slice(headerEnd + 4, next - 2); // strip trailing CRLF
    const name = /name="([^"]*)"/i.exec(headers)?.[1];
    const filename = /filename="([^"]*)"/i.exec(headers)?.[1];
    const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim();
    if (filename !== undefined) files.push({ name, filename, type, data });
    else if (name) fields[name] = data.toString('utf8');
    pos = next;
  }
  return { fields, files };
}

/** Identify allowed raster image types by magic bytes (never trust the client's content-type). SVG is refused on purpose. */
export function sniffImage(b) {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b.slice(0, 4).toString() === 'GIF8') return { ext: 'gif', mime: 'image/gif' };
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (b.slice(4, 8).toString() === 'ftyp' && /avif|avis/.test(b.slice(8, 16).toString())) return { ext: 'avif', mime: 'image/avif' };
  return null;
}

export const randomName = (ext) => `${crypto.randomBytes(9).toString('hex')}.${ext}`;
