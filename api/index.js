// Vercel entry point: every request that is not a static file is rewritten here (see vercel.json).
import { createRuntime, ConfigError } from '../server/runtime.js';

let appPromise;
function getApp() {
  if (!appPromise) {
    appPromise = createRuntime().then((app) => {
      app.ready.catch(() => { appPromise = null; }); // retry on the next request if first-run setup failed
      return app;
    }).catch((err) => { appPromise = null; throw err; });
  }
  return appPromise;
}

export default async function handler(req, res) {
  let app;
  try {
    app = await getApp();
  } catch (err) {
    console.error(err);
    res.statusCode = err instanceof ConfigError ? 503 : 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(err instanceof ConfigError ? err.message : 'Service unavailable.');
    return;
  }
  return app.handler(req, res);
}
