# Clip Pad — Account-Backed Version (Vercel)

This version replaces the old per-browser IndexedDB saving with a real
account system, so logging in with the same username and password on a
different device shows the same uploaded sounds and pad setup.

I tested the full signup → login (second device) → save pads → upload file →
fetch from second device → delete → logout flow against mocked versions of
the storage APIs before handing this over, and the cross-device behavior
worked correctly. The real thing will behave the same way once the storage
integrations below are connected — I can't test against your actual Upstash/
Blob instances since that requires your live credentials.

## Why this needs a different deploy method

The previous versions were static files you could drag onto Vercel Drop.
This one has server-side code (in `api/`) and needs two storage integrations
connected, which requires a **Git-connected Vercel project**, not a drag-and-
drop deploy. This is a one-time setup.

## What's in this folder

- `index.html`, `manifest.json`, `service-worker.js`, `icons/` — the app itself
- `api/` — serverless functions: signup, login, logout, workspace, pads, files
- `lib/` — shared helpers (password hashing, session/user storage)
- `package.json` — the two dependencies this needs: `@upstash/redis` and `@vercel/blob`

## One-time setup

### 1. Push this folder to a GitHub repo

```bash
cd clip-pad-backend
git init
git add .
git commit -m "Clip Pad with accounts"
```

Create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/yourname/clip-pad.git
git branch -M main
git push -u origin main
```

### 2. Import the repo into Vercel

In the Vercel dashboard: **Add New → Project**, select this repo, and deploy
with default settings (no framework — it'll show as "Other", which is
correct; no build command is needed).

### 3. Add the two storage integrations

In your new project's dashboard, go to the **Storage** tab:

- **Add → Blob** — creates a Vercel Blob store and automatically adds a
  `BLOB_READ_WRITE_TOKEN` environment variable to your project.
- **Add → Marketplace Database Storage → Upstash** — creates a free Redis
  database and automatically adds `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL`/`KV_REST_API_TOKEN`,
  depending on integration version — the code handles either automatically).

Both are available on free tiers at this app's scale.

### 4. Redeploy

Environment variables only take effect on deployments created after they
were added. Go to **Deployments** → the three-dot menu on the latest one →
**Redeploy**.

### 5. Try it

Open your `https://your-project.vercel.app` URL, create an account, upload a
sound, assign it to a pad. Then open the same URL in a different browser (or
incognito window, or a different device) and log in with the same username
and password — your sounds and pads should be there.

## Updating the app later

Since this is Git-connected now (unlike the old zip-drop method), updating is
just:

```bash
git add .
git commit -m "describe the change"
git push
```

Vercel redeploys automatically on every push.

## Known limits

- **File size:** uploads are capped at about 3.5MB per clip. This is a hard
  platform limit on Vercel Serverless Functions' request body size (~4.5MB),
  and the client base64-encodes the file before sending it, which adds about
  33% overhead — so the real ceiling on raw audio is a bit under that. Trim
  clips short, or compress them, if you hit the error.
- **Passwords:** stored using salted scrypt hashing (a real, appropriate
  method — not plaintext), but there's no password reset flow, no email
  verification, and no rate-limiting on login attempts. Fine for personal/
  small-group use; I wouldn't consider it hardened for a public app with
  many strangers' accounts without adding those.
- **Sessions** last 30 days per login, stored server-side in Redis, and are
  independent per device — logging out on one device doesn't log you out
  elsewhere.

## Reinstalling on your iPhone

Since this is a different deployment (new URL, or same URL with new code),
re-do the "Add to Home Screen" step from Safari once it's live, same as
before.
