// Chooses storage drivers from the environment and builds the app. Used by the local server,
// the Vercel function and the admin-reset script.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createUpstashKv, createFileKv } from './kv.js';
import { createDiskBlob, createVercelBlob } from './blob.js';
import { createStore } from './store.js';
import { createApp } from './app.js';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class ConfigError extends Error {}

export function pickKv(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return createUpstashKv({ url, token });
  if (env.VERCEL) {
    throw new ConfigError(
      'Storage is not connected. In your Vercel project open Storage, add an Upstash Redis database, connect it to this project and redeploy.'
    );
  }
  return createFileKv(path.resolve(env.DATA_DIR || path.join(rootDir, 'data')));
}

export function pickBlob(env = process.env) {
  if (env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID) return createVercelBlob();
  if (env.VERCEL) return null; // uploads disabled until a Blob store is connected
  return createDiskBlob(path.join(path.resolve(env.DATA_DIR || path.join(rootDir, 'data')), 'uploads'));
}

export async function createRuntime(overrides = {}) {
  const kv = overrides.kv || pickKv();
  const blob = overrides.blob === undefined ? pickBlob() : overrides.blob;
  const store = createStore(kv);
  return createApp({ store, blob, rootDir, siteUrl: process.env.SITE_URL || '', log: console, ...overrides.app });
}
