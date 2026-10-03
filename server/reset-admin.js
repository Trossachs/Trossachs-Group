// Usage: npm run reset-admin -- you@example.com "a-new-password-10+chars"
// Works against whichever storage the environment points at (local files, or Upstash when its
// variables are set, e.g. after `vercel env pull .env.local` and `node --env-file=.env.local ...`).
import { pickKv } from './runtime.js';
import { createStore } from './store.js';
import { hashPassword } from './security.js';

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage: npm run reset-admin -- <email> <password (min 10 chars)>');
  process.exit(1);
}
const kv = pickKv({ ...process.env, VERCEL: '' });
const store = createStore(kv);
const current = await store.getAdmin();
await store.setAdmin({ email: email.toLowerCase(), hash: hashPassword(password), ver: (current?.ver || 1) + 1 });
kv.flush?.();
console.log(`Admin credentials updated for ${email.toLowerCase()}. All sessions were signed out.`);
