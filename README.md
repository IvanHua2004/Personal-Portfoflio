# Portfolio

A portfolio site split into two deployables:

| Folder | What it is | Where it deploys | Cost |
| --- | --- | --- | --- |
| `client/` | Angular 20 SPA — pages, components, services | GitHub Pages | Free |
| `server/` | Express + TypeScript REST API | Render | Free |

The client fetches projects from the API and posts contact messages to it. If the API is unreachable, the client falls back to bundled project data so the site never renders empty.

---

## Run it locally

Two terminals:

```bash
# Terminal 1 — API on http://localhost:3000
cd server
cp .env.example .env
npm install
npm run dev

# Terminal 2 — client on http://localhost:4200
cd client
npm install
npm start
```

`ng serve` uses `src/environments/environment.development.ts`, which points at `http://localhost:3000/api`.

---

## API

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | Status + whether email is configured. Render pings this. |
| `GET` | `/api/projects` | Supports `?tag=Angular` and `?featured=true` |
| `GET` | `/api/projects/:slug` | 404 if no match |
| `POST` | `/api/contact` | Validated with zod; 5 requests per IP per 15 min |

`POST /api/contact` expects `{ name, email, message }` and returns `202 { ok: true }`. Validation failures return `400` with a `details` array naming each bad field.

---

## Deploying

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

### 2. Deploy the API to Render

1. Sign up at [render.com](https://render.com) with your GitHub account — no card needed for the free tier.
2. **New +** → **Blueprint** → pick this repo. Render reads `render.yaml` and creates the `portfolio-api` service with the right build and start commands.
   *(Prefer clicking through it? **New +** → **Web Service**, set Root Directory to `server`, Build Command to `npm ci && npm run build`, Start Command to `npm start`.)*
3. Once it deploys, copy the service URL — something like `https://portfolio-api-a1b2.onrender.com`.
4. Check it works: open `https://<your-service>.onrender.com/api/health` in a browser. You should see `{"status":"ok",...}`.

### 3. Point the client at your API

In `client/src/environments/environment.ts`, replace the placeholder:

```ts
apiUrl: 'https://portfolio-api-a1b2.onrender.com/api',   // note the /api suffix
```

### 4. Let the API accept requests from your site

In Render → your service → **Environment**, set:

```
CORS_ORIGINS = https://<your-username>.github.io
```

No trailing slash, no path. Without this the browser blocks every request from your live site — the classic "works locally, broken in production" bug.

### 5. Turn on GitHub Pages

Repo → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**. Push to `main` and `.github/workflows/deploy.yml` builds `client/` and publishes it.

Your site: `https://<your-username>.github.io/<repo>/`

> Using a user site (repo named `<your-username>.github.io`)? Change the build step in the workflow to `npx ng build --base-href "/"`.

### 6. Switch on the contact emails

1. Sign up at [resend.com](https://resend.com) — free tier is 3,000 emails/month.
2. Create an API key.
3. In Render → **Environment**, add:

```
RESEND_API_KEY = re_xxxxxxxxxx
CONTACT_TO     = ivanhua631@gmail.com
CONTACT_FROM   = onboarding@resend.dev
```

`onboarding@resend.dev` works immediately for testing. To send from your own domain, verify it in Resend first and set `CONTACT_FROM` to something like `contact@yourdomain.com`.

Until `RESEND_API_KEY` and `CONTACT_TO` are both set, the server logs submissions instead of emailing them — visible in Render's **Logs** tab. `/api/health` reports `emailConfigured` so you can confirm which mode you're in.

---

## The free-tier catch

Render free services **spin down after 15 minutes of inactivity**. The next request wakes them, which takes 30–60 seconds. You get 750 instance-hours per month.

The client already handles this:

- Projects fall back to bundled data if the API doesn't answer, so pages render instantly regardless.
- The contact form shows *"Could not reach the server. It may be waking up — try again in a moment."* instead of a generic error.

If the wake-up delay bothers you later, Render's Starter plan (~$7/month) stays warm. Pinging your own service to keep it alive is against Render's free-tier terms and burns your 750 hours.

---

## Where to edit things

| I want to… | File |
| --- | --- |
| Add or edit a project | `server/src/data/projects.json` (and `client/src/app/data/projects.data.ts` for the offline fallback) |
| Change name, bio, socials, skills, experience | `client/src/app/data/profile.data.ts` |
| Change colours, spacing, fonts | `client/src/styles/_tokens.scss` |
| Add a page | `client/src/app/pages/…` + register in `client/src/app/app.routes.ts` |
| Change nav links | `client/src/app/shared/components/header/header.component.ts` |
| Add an API endpoint | `server/src/routes/` + mount it in `server/src/app.ts` |
| Change the API URL | `client/src/environments/environment.ts` |

---

## Structure

```
.
├─ render.yaml                  Render Blueprint for the API
├─ .github/workflows/
│  ├─ deploy.yml                builds client/ → GitHub Pages
│  └─ server-ci.yml             typechecks + builds server/ on push
│
├─ client/
│  └─ src/
│     ├─ environments/          apiUrl per build configuration
│     ├─ styles/                design tokens + mixins
│     └─ app/
│        ├─ core/
│        │  ├─ models/          Project, SkillGroup
│        │  └─ services/        ProjectService, ContactService, SeoService
│        ├─ data/               profile content + offline project fallback
│        ├─ shared/components/  header, footer, project-card
│        └─ pages/              home, projects, project-detail, about, contact, 404
│
└─ server/
   └─ src/
      ├─ index.ts               listen + graceful shutdown
      ├─ app.ts                 middleware wiring, CORS, health check
      ├─ config.ts              all env var reads live here
      ├─ routes/                projects.route.ts, contact.route.ts
      ├─ middleware/            error handler, async wrapper
      ├─ lib/                   project store, Resend mailer
      └─ data/projects.json     project content
```

---

## Security notes

- `.env` is gitignored. Real keys go in Render's Environment tab, never in the repo.
- CORS is an allowlist — only origins in `CORS_ORIGINS` get past the browser.
- The contact endpoint is rate-limited to 5 requests per IP per 15 minutes and carries a hidden honeypot field that silently drops bot submissions.
- Request bodies are capped at 100 kB and validated with zod before anything touches them.

---

## Troubleshooting

**CORS error in the browser console** — `CORS_ORIGINS` on Render doesn't exactly match your site's origin. It must be `https://username.github.io` with no trailing slash and no repo path.

**Contact form says the server is unreachable** — free-tier spin-up. Wait ~45 seconds and resend.

**Projects show but never update** — you edited `client/src/app/data/projects.data.ts` (the fallback) instead of `server/src/data/projects.json` (the live source), or the API is asleep and you're seeing the fallback.

**`Inlining of fonts failed … 403`** — the production build fetches the Google Font at build time and your network blocks it. Build with `--configuration development`, or set `"optimization": { "scripts": true, "styles": true, "fonts": { "inline": false } }` in the production config in `client/angular.json`.

**Render build fails on `npm ci`** — commit `server/package-lock.json`. `npm ci` requires it.

## Before you publish

- [ ] Replace placeholder content in `server/src/data/projects.json` and `client/src/app/data/profile.data.ts`
- [ ] Set `apiUrl` in `client/src/environments/environment.ts` to your Render URL
- [ ] Set `CORS_ORIGINS` on Render to your Pages URL
- [ ] Add `RESEND_API_KEY` and `CONTACT_TO` on Render
- [ ] Update the `<title>` and description in `client/src/index.html`
- [ ] Swap `client/public/favicon.svg` for your own
