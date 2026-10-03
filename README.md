# Trossachs Group — portfolio + admin CMS

A portfolio site with a secure admin dashboard. Everything on the site (text, services, projects, images, links, navigation, footer) is edited from `/admin`, with no code changes.

It runs in two ways from the same code:

| | Where data lives | Where images live |
|---|---|---|
| **Vercel** (recommended) | Upstash Redis | Vercel Blob (public store) |
| **Local / any Node server** | `data/store.json` | `data/uploads/` |

Requires Node.js 22+. The only npm dependency is `@vercel/blob`, loaded only when a Blob store is connected.

---

## Deploy on Vercel (via GitHub)

### 1. Put the code on GitHub
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/trossachs-group.git
git push -u origin main
```
Keep the repository private if you prefer. Nothing secret is in the code.

### 2. Import into Vercel
1. vercel.com → **Add New… → Project** → pick the GitHub repository.
2. Leave every build setting as detected (there is no build step; `vercel.json` handles routing). Click **Deploy**.
3. The first deploy will show a message that storage is not connected. That is expected. Continue below.

### 3. Connect the database (Upstash Redis)
1. In the project: **Storage → Create / Connect Database → Upstash → Redis** (the free plan is enough).
2. Connect it to this project for **Production** and **Preview**.
3. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. If you chose a custom prefix during setup, the app also accepts `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 4. Connect image storage (Vercel Blob)
1. **Storage → Create → Blob**. Choose **Public** access (the images are shown on your website).
2. Connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.

### 5. Set your admin login
**Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ADMIN_EMAIL` | the email you will sign in with |
| `ADMIN_PASSWORD` | a long password (10+ characters) |
| `SITE_URL` | your final address, e.g. `https://trossachs-group.vercel.app` (used for sharing previews and the sitemap) |

### 6. Redeploy
**Deployments → ⋯ → Redeploy.** Then open your site, and go to `/admin`.

From now on, every `git push` to `main` redeploys automatically; your content and images stay in Redis and Blob.

### Good to know
- The first account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on the first request. After that the password lives (hashed) in the database, so changing the environment variable later has no effect. Change it in **Admin → Account**, or run:
  `vercel env pull .env.local` then `node --env-file=.env.local server/reset-admin.js you@example.com "new-password"`
- **Images are limited to 4 MB each** (Vercel functions reject larger request bodies). Export photos at about 1600px wide.
- Contact-form messages are stored in the database and shown in **Admin → Messages**. They are not emailed.
- If something is misconfigured, the site shows a plain message saying what to connect (for example "Storage is not connected").

---

## Run locally

```
npm start
```
Open http://localhost:3000 and http://localhost:3000/admin. On first run the admin password is printed once in the terminal. To choose your own:

```
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm start
```
Local data is stored in `./data` (change with `DATA_DIR`). Reset credentials: `npm run reset-admin -- you@example.com "new-password"`.

## Tests
```
npm test
```
Runs the API suite against local files, against the Upstash REST client (using a built-in mock Upstash server), and with Vercel-style image URLs.

## Layout
- `api/index.js` — the Vercel function (all dynamic routes)
- `server/` — app logic, storage drivers (`kv.js`, `blob.js`), data layer (`store.js`), security
- `public/` — static files served by the CDN (`assets/`, `admin/admin.css`, `admin/login.js`)
- `views/` — HTML templates filled in by the server (page, login)
- `private/` — the dashboard page and script, only sent to a signed-in admin
