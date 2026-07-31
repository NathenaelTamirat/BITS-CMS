# BITS College CMS — Deployment Documentation

*Project B. This document is self-contained. Every claim in here was checked against the actual source code — including two real gaps in the current setup that I'm flagging explicitly rather than glossing over, per your instructions.*

---

## 1. Project Deployment Overview

### What this project is

This is the **News & Events content management system** for BITS College — an **Express 5 + TypeScript** REST API backed by **PostgreSQL**, plus a **React + Vite** admin single-page app ("Studio") that editors use to write and publish posts. It is responsible *only* for News & Events content; it has no other content types.

### Architecture, as it actually exists in the code

```
                     Internet
                        │
             ┌──────────┴───────────┐
             │                       │
   api.bitscollege.edu.et  studio.bitscollege.edu.et
             │                       │
             ▼                       ▼
         nginx (443)             nginx (443)
             │                       │
             └───────────┬───────────┘
                          ▼
              cms-api container, port 3000
              (Express, TypeScript, compiled to dist/)
                          │
                          ▼
              postgres container, port 5432
              (Docker-internal network only —
               never exposed to the internet)
```

Both public subdomains currently proxy to the **same** `cms-api` container — see the ⚠️ gap called out in Section 4 about what this means for the Studio UI specifically.

### How the pieces communicate

1. **Public read access (no login):** `GET /api/posts` (paginated list) and `GET /api/posts/:slug` (single post) — these are what the separate BITS Home Page project calls server-to-server to render `/college-news`.
2. **Media serving (no login):** `GET /api/media/:id` — images/video/PDF are stored as raw bytes (`BYTEA`) directly in Postgres, not on disk and not in S3. This route streams them back out, with HTTP `Range` support (so video scrubbing works) and a `Cache-Control` header.
3. **Authenticated admin routes** (`/api/admin/*`, `/api/auth/*`): editors log in via `POST /api/auth/login`, receive a short-lived (15 min) access token plus a longer-lived (7 day) refresh token stored in an `httpOnly` cookie. All post CRUD (`/api/admin/posts/*`) and admin-account management (`/api/admin/admins/*`, superadmin-only) require this token.
4. **Database:** a single PostgreSQL database, schema defined in `migrations.sql` — five tables (`admin`, `media`, `post`, `readmore`, `readmore_media`, plus `refresh_token`), with foreign keys and `CHECK` constraints enforcing data integrity at the database level (e.g. a post can't simultaneously have both an uploaded-image `mediaid` and a YouTube `mediaurl`).
5. **The Studio SPA talks to this same API** over HTTP, using `VITE_API_URL` at build time to know where the API lives (`Client/vite.config.ts` proxies `/api` to `localhost:3000` in local dev only).

### Production deployment flow (the short version)

1. The Express API is compiled (`tsc`) into a Docker image and run as the `cms-api` container.
2. PostgreSQL runs as its own container, on the same private Docker network as `cms-api`, **never** exposed to the public internet.
3. nginx terminates TLS for two subdomains (`api.` and `studio.`) and reverse-proxies both to `cms-api`.
4. certbot automatically renews the Let's Encrypt certificates for both subdomains.
5. All of this runs on **your own server** — a separate machine from the BITS Home Page's YegaraHost VPS.

---

## 2. Required Deployment Environment

### Server specification
This server runs a real database, unlike the homepage project, so give it more headroom:

| Tier | vCPU | RAM | Disk |
|---|---|---|---|
| Minimum | 2 | 2 GB | 20 GB + growth room for media |
| Recommended | 2–4 | 4 GB | 40 GB+, more if you expect large video uploads |

Disk sizing matters more here than on the homepage server: **all uploaded media is stored as bytes inside Postgres**, so disk usage grows directly with how much content editors upload, not just with code/logs.

### Operating system
**Ubuntu 22.04 LTS** or similar recent Debian/Ubuntu — the commands below assume `apt` and `ufw`.

### Runtime versions
- **Node.js 20** — the `Dockerfile` uses `node:20-alpine`. This is a hard requirement of the multi-stage Docker build; you don't need Node installed on the host itself if you're deploying via Docker (recommended), only inside the image, which happens automatically.
- **PostgreSQL 16** — `docker-compose.yml` uses the `postgres:16-alpine` image.
- **Docker Engine + Compose plugin.**

### Required dependencies (from `package.json`)
Runtime: `express` 5.x, `pg` (Postgres driver), `bcrypt` (password hashing), `multer` (file upload handling), `dompurify` + `jsdom` (server-side HTML sanitization — `jsdom` provides a fake browser DOM so DOMPurify, normally a browser library, can run in Node), `dotenv`.

**⚠️ Worth knowing before you build:** `bcrypt` is a **native module** — it compiles C++ code during `npm install`, not pure JavaScript. The current `Dockerfile` runs `npm ci` on `node:20-alpine` without first installing build tools (`python3`, `make`, `g++`). Alpine images often lack these by default. In practice `bcrypt` ships prebuilt binaries for common platforms and this frequently works fine on Alpine without extra steps — but if your build fails specifically during `npm ci` with errors mentioning `node-gyp`, `python`, or `make`, this is why. See the Troubleshooting section for the fix.

### Required external services
None beyond what you're deploying yourself — no third-party APIs, no external storage buckets (media lives in Postgres), no email service currently wired up. This is a self-contained system.

### Required environment variables

I'm listing every one of these because, as covered below, **the `.env.example` file the documentation references doesn't actually exist in this repository** — you can't just copy a template, you need this table.

| Variable | Required? | Purpose |
|---|---|---|
| `NODE_ENV` | Recommended, `production` | Controls whether cookies get the `secure` flag (production = HTTPS-only cookies) |
| `PORT` | No, defaults to `3000` | Port the Express server listens on |
| `DB_HOST` | **Yes** | Postgres hostname — `postgres` when using the provided `docker-compose.yml` (the Docker service name) |
| `DB_PORT` | No, defaults to `5432` | Postgres port |
| `DB_USER` | **Yes** | Postgres username |
| `DB_PASSWORD` | Yes (can technically be empty, but shouldn't be in production) | Postgres password |
| `DB_NAME` | **Yes** | Postgres database name |
| `JWT_ACCESS_SECRET` | **Yes** | Signs short-lived access tokens. Must be a long, random, secret string. **Must be different from `JWT_REFRESH_SECRET`** — the app will start with either missing, but using the same value for both weakens token separation. |
| `JWT_REFRESH_SECRET` | **Yes** | Signs refresh tokens. Same rules as above. |
| `CORS_ORIGIN` | **Yes** | Comma-separated list of origins allowed to make credentialed browser requests, e.g. `https://www.bitscollege.edu.et,https://studio.bitscollege.edu.et`. **Do not** set this to `*` — the CORS middleware in `src/app.ts` only adds `Access-Control-Allow-Origin` for origins present in this exact list; anything else is silently refused, which is correct and intentional. |
| `REFRESH_COOKIE_NAME` | No, defaults to `refreshToken` | Name of the refresh-token cookie |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` | Only needed once, when creating the first admin | Passed only at seed time (Section 4.7), never stored long-term in `.env` |

Generate strong secrets with:
```bash
openssl rand -base64 48
```
Run this twice — once for each JWT secret — and never reuse the output.

**⚠️ Gap I found and want to flag directly, per your instructions:** `DOCS/DEPLOY.md` in this repo instructs you to run `cp .env.example .env`, and `.gitignore` even has a `!.env.example` line meaning that file is *supposed* to be tracked in git — but I checked the actual repository contents you gave me and **no `.env.example` file exists anywhere**, not at the root and not in `Client/`. This looks like a step that was planned and documented but never actually committed. You cannot copy a file that isn't there — use the table above instead, and consider creating that file yourself (with placeholder values, no real secrets) so future deploys don't hit the same wall.

---

## 3. Server Preparation

### 3.1 Update the system and install basic tools
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

### 3.2 Install Docker Engine and Compose
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```
Log out and back in for the group change to apply.

**Verify:**
```bash
docker --version
docker compose version
```

### 3.3 Configure the firewall — this is more important here than on the homepage server
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
**Why this matters extra here:** this server runs a database. The provided `docker-compose.yml` correctly does **not** publish Postgres's port 5432 to the host (no `ports:` entry for the `postgres` service, only an internal Docker network) — but the firewall is still your second line of defense. After deployment, verify from *outside* the server:
```bash
nc -zv api.bitscollege.edu.et 5432   # should time out / fail — good
nc -zv api.bitscollege.edu.et 3000   # should also fail — only 80/443 should respond
```
If either of these succeeds, something is misconfigured and your database or raw API is directly exposed — stop and fix before going further.

### 3.4 Create the project directory
```bash
sudo mkdir -p /opt/bits-cms
sudo chown $USER:$USER /opt/bits-cms
```

### 3.5 Point DNS at this server
Create **two** A records (this project needs two subdomains, unlike the homepage's one):
```
api.bitscollege.edu.et      →  this server's IP
studio.bitscollege.edu.et   →  this server's IP
```
**Verify:**
```bash
dig +short api.bitscollege.edu.et
dig +short studio.bitscollege.edu.et
```

---

## 4. Application Deployment Steps

### 4.1 Get the source code
```bash
cd /opt/bits-cms
git clone <your-repo-url> .
```

### 4.2 How the Studio SPA gets deployed

The Express API and the Studio SPA are two separate artifacts, deployed as follows:

1. **The API** is built by the root `Dockerfile` (`src/` → `dist/`) and runs as the `cms-api` container.
2. **The Studio SPA** (`Client/`) is built with Vite into a static folder (`Client/dist`) that nginx serves directly. The deployment wiring for this is **already in the repository**:
   - `docker-compose.yml` bind-mounts `./Client/dist` into the nginx container at `/usr/share/nginx/html/studio` (read-only).
   - `nginx/conf.d/cms.conf`'s `studio.bitscollege.edu.et` server block uses that folder as its `root`, serves `index.html`, falls back to `/index.html` for SPA routes (`try_files $uri $uri/ /index.html` — React Router needs this), and only proxies `/api/` to the `cms-api` container.

**The one manual step remaining is building `Client/dist` before first deploy** (and after any Studio code change), since the Studio build is intentionally not part of the API image:

```bash
cd /opt/bits-cms/Client
npm ci
VITE_API_URL=https://api.bitscollege.edu.et npm run build
```

This produces `Client/dist/` — a folder of static HTML/CSS/JS. nginx picks it up on the next request (static files, no restart needed); re-run `docker compose restart nginx` only if you change the nginx config itself. If `Client/dist` is missing, `https://studio.bitscollege.edu.et/` serves an empty directory (403) instead of the login page — so build it before first boot.

### 4.3 Create the environment file
```bash
cd /opt/bits-cms
cat > .env << 'EOF'
NODE_ENV=production
POSTGRES_USER=cms_admin
POSTGRES_PASSWORD=REPLACE_WITH_A_REAL_RANDOM_PASSWORD
POSTGRES_DB=bits_cms
JWT_ACCESS_SECRET=REPLACE_WITH_OUTPUT_OF_openssl_rand
JWT_REFRESH_SECRET=REPLACE_WITH_A_DIFFERENT_openssl_rand_OUTPUT
CORS_ORIGIN=https://www.bitscollege.edu.et,https://studio.bitscollege.edu.et
REFRESH_COOKIE_NAME=refreshToken
EOF
```
Generate the two secrets and the Postgres password with `openssl rand -base64 48` (run separately for each — never reuse a value across variables). This file is read by `docker-compose.yml` automatically because it's in the same directory.

### 4.4 First boot — HTTP only (for the SSL challenge)
```bash
docker compose up -d postgres cms-api nginx
```
At this point `postgres` and `cms-api` come up fully, and `nginx` starts but HTTPS won't work yet (no certificate). That's expected.

### 4.5 Request SSL certificates for both subdomains
```bash
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d api.bitscollege.edu.et -d studio.bitscollege.edu.et \
  --email you@bitscollege.edu.et --agree-tos --no-eff-email
```
One certificate covers both subdomains since they're requested together (`-d ... -d ...`).

### 4.6 Restart nginx to load the certificates
```bash
docker compose restart nginx
```

### 4.7 Run database migrations
```bash
docker compose exec cms-api npm run migrate
```
**What this does:** runs `migrations.sql` against the database — it creates all five tables, the `media_type_enum` type, and all indexes. **Read this carefully before running it a second time, ever:** `migrations.sql` begins with `DROP TABLE IF EXISTS ... CASCADE` for every table. It is a full reset script, not an additive migration. Run it once, on a fresh database, and never again once real posts exist — running it later would silently delete all content. There is currently no separate "run once" guard in the code itself; this is a process discipline you need to maintain, not something the tooling protects you from. Consider renaming the file or adding your own guard once you have production data.

### 4.8 Create the first admin account (superadmin)
```bash
docker compose exec \
  -e SEED_SUPERADMIN_EMAIL=you@bitscollege.edu.et \
  -e SEED_SUPERADMIN_PASSWORD='choose-a-strong-password-here' \
  cms-api npm run seed:admin
```
**Why pass these as one-off `-e` flags instead of putting them in `.env`:** these credentials only need to exist for this single command. Leaving them permanently in `.env` means the plaintext password sits on disk indefinitely for no reason — pass it once, then forget it (store the actual login password in your password manager, not on the server).

The seed script checks if a superadmin with that email already exists and does nothing if so — it's safe to accidentally run twice.

### 4.9 Verify
```bash
curl -s https://api.bitscollege.edu.et/api/health
```
Expected: `{"data":{"status":"ok","uptime":...},"message":"OK"}`

### Background services and process management
There are no background workers or scheduled jobs in this project — the only long-running processes are `cms-api` (the API server) and `postgres` (the database), both managed by Docker's `restart: unless-stopped` policy, same as the homepage project. `certbot` is the one "background service" here, running its own renewal loop every 12 hours inside its container — nothing extra to configure.

---

## 5. Production Configuration

### Environment configuration
`NODE_ENV=production` primarily affects cookie security: `src/Routes/auth.ts` sets `secure: env.nodeEnv === "production"` on both the access and refresh token cookies, meaning cookies are only sent over HTTPS in production. **If you ever run this with `NODE_ENV` unset or `development` in production, login cookies would be sent over plain HTTP** — make sure this is always explicitly set to `production` on the real server.

### Database configuration
Connection pooling is configured in `src/DB/client.ts` with `max: 10` — up to 10 simultaneous connections to Postgres. This is a reasonable default for a small institutional CMS; if you ever see connection pool exhaustion under load (errors mentioning timeouts acquiring a client), this is the number to reconsider, but there's no reason to touch it before you have evidence you need to.

No SSL is configured on the database connection itself (`src/DB/client.ts` has no `ssl:` option) — this is fine and intentional as long as Postgres stays on the private Docker-internal network as set up in Section 4, never reachable from outside. If you ever move to a managed/external Postgres service reachable over the network, you would need to add SSL there — not needed for the setup in this document.

### API configuration
No separate config beyond the environment variables already covered — routes, rate limits, and body size limits (`express.json({ limit: "1mb" })`) are set directly in `src/app.ts`.

### CORS configuration
Already covered in Section 2 — `CORS_ORIGIN` must be an exact, comma-separated allowlist. The code (`src/app.ts`) checks `env.corsOrigins.includes(requestOrigin)` and only sets `Access-Control-Allow-Origin` when there's a match; otherwise no CORS headers are sent at all, and the browser blocks the request. This is correct, secure behavior — resist the temptation to "just use `*`" if something isn't working; find the real origin mismatch instead (check Section 7).

### Authentication configuration
JWT-based, hand-implemented (not a third-party auth library) in `src/Utils/tokens.ts` — HMAC-SHA256 signing, constant-time comparison on verification (`timingSafeEqual`, preventing timing-attack token forgery), 15-minute access tokens, 7-day refresh tokens with rotation (each refresh invalidates the previous refresh token and issues a new one, storing only a *hash* of the refresh token in the database, never the raw token). No configuration needed beyond the two JWT secret environment variables — don't change the token lifetimes in `env.ts` without a specific reason; they're reasonable defaults.

### File storage configuration
All media (images, video, PDFs — whatever gets uploaded through Studio) is stored as `BYTEA` directly in the `media` Postgres table, not on disk and not in an object store. This has real, practical implications for deployment:
- **Postgres backups (Section 9) are your only media backup** — there's no separate "uploads folder" to worry about, but also no way to back up media independently of the whole database.
- **Disk sizing on the Postgres volume must account for media growth**, not just row count.
- Allowed upload types are restricted in `src/Routes/media.ts` to JPEG, PNG, GIF, WebP, MP4, and PDF; SVG is explicitly banned (SVGs can contain embedded scripts). Max upload size is 10 MB per file (`multer`'s `fileSize` limit).

### External service configuration
None — no email provider, no SMS, no third-party auth, no CDN configured in the code as it stands.

### Production build configuration
`npm run build` runs `tsc`, compiling `src/` to `dist/` per `tsconfig.json` (target `ESNext`, module `NodeNext`, strict mode on). The Docker build runs this automatically (Section 4) — you don't run it manually except for local development.

---

## 6. Testing After Deployment

### Confirm the application is running
```bash
docker compose ps
```
`cms_postgres`, `cms_api`, `cms_nginx` should all show `Up`/`healthy`. `cms_certbot` will just show `Up` (no healthcheck defined for it — that's normal, it's a loop process, not a request-serving service).

### Test frontend functionality (Studio)
Once Section 4.2's fix is in place: open `https://studio.bitscollege.edu.et` in a browser, confirm the login page loads (not a 404), log in with the superadmin credentials from Section 4.8, confirm you land on `/studio/posts`.

### Test backend APIs
```bash
curl -s https://api.bitscollege.edu.et/api/health
curl -s "https://api.bitscollege.edu.et/api/posts?page=1&limit=5"
```
The second call should return real post data (empty array if no posts exist yet, which is fine on a fresh deploy).

**Test the CORS allowlist is actually working** (this confirms Section 5's CORS config, not just that the server responds):
```bash
curl -s -H "Origin: https://evil-example.com" -I https://api.bitscollege.edu.et/api/posts
```
The response should **not** contain an `Access-Control-Allow-Origin` header at all. Then:
```bash
curl -s -H "Origin: https://www.bitscollege.edu.et" -I https://api.bitscollege.edu.et/api/posts
```
This one **should** include `Access-Control-Allow-Origin: https://www.bitscollege.edu.et`.

### Test database connectivity
```bash
docker compose exec postgres psql -U <your DB_USER> -d <your DB_NAME> -c "SELECT count(*) FROM post;"
```
If this returns a row count without error, the API's own database connection is almost certainly fine too (same credentials, same network).

### Test authentication
```bash
curl -i -X POST https://api.bitscollege.edu.et/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@bitscollege.edu.et","password":"your-seeded-password"}'
```
Expect `200` with a JSON body containing an access token, and a `Set-Cookie` header for the refresh token. Then confirm a bad password is rejected:
```bash
curl -i -X POST https://api.bitscollege.edu.et/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@bitscollege.edu.et","password":"wrong"}'
```
Expect `401`, not `500` — a `500` here would indicate a bug, not just a wrong password.

### Test file uploads
Through the Studio UI (once Section 4.2 is resolved): create a post, upload an image, confirm it appears. Via `curl`, you'd need a valid access token first (from the login call above), then:
```bash
curl -i -X POST https://api.bitscollege.edu.et/api/media/upload \
  -H "Authorization: Bearer <access-token-from-login>" \
  -F "file=@/path/to/test-image.jpg"
```
Expect `201` with a `mediaId` and `url` in the response. Then confirm it's actually servable:
```bash
curl -I https://api.bitscollege.edu.et/api/media/<mediaId>
```
Expect `200`, correct `Content-Type`, and an `X-Content-Type-Options: nosniff` header.

### Check logs
```bash
docker compose logs cms-api -f --tail=100
docker compose logs postgres --tail=50
docker compose logs nginx --tail=50
```

### Check server health
```bash
curl -s https://api.bitscollege.edu.et/api/health   # app-level health
docker compose exec postgres pg_isready -U <DB_USER>   # db-level health
docker stats --no-stream                                # resource usage
```

---

## 7. Troubleshooting Guide

### Build failures

**Symptom:** `docker compose build` fails during `npm ci` for `cms-api`, with errors mentioning `node-gyp`, `python3 not found`, or `make: not found`.
**Cause:** `bcrypt` is a native module and Alpine's minimal base image doesn't include C++ build tools by default. Whether you hit this depends on whether `bcrypt`'s prebuilt binary matches your exact platform.
**Solution:** add build tools to the `deps`/`builder` stage in the `Dockerfile`:
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```
(add the same `apk add` line to the `builder` stage too, since it also runs `npm ci`). Alternative: swap `bcrypt` for `bcryptjs` (pure JavaScript, no native compilation, slightly slower but zero build-tool dependency) if you'd rather avoid this class of issue entirely — that would require a small code change in `adminseed.ts` and wherever else `bcrypt` is imported.

### Missing environment variables
**Symptom:** container exits immediately on startup with `Error: Missing environment variable: JWT_ACCESS_SECRET` (or similar).
**Cause:** `src/Utils/env.ts`'s `getRequired()` throws synchronously at startup if a required variable is absent — this is intentional fail-fast behavior, not a bug.
**Solution:** check `docker compose exec cms-api env` (if it's still running) or `docker compose logs cms-api` for the exact variable name in the error, and confirm it's in your `.env` file (Section 4.3).

### Database connection errors
**Symptom:** `cms-api` logs show `ECONNREFUSED` or `getaddrinfo ENOTFOUND postgres`.
**Cause:** either Postgres isn't up yet (race condition — though `depends_on: condition: service_healthy` in `docker-compose.yml` should prevent this) or `DB_HOST` is wrong.
**Solution:** confirm `DB_HOST=postgres` (the Docker service name, not `localhost` — inside Docker's network, containers reach each other by service name) and check `docker compose ps postgres` shows `healthy` before `cms-api` started.

### CORS errors
**Symptom:** browser console shows `No 'Access-Control-Allow-Origin' header is present`.
**Cause:** the request's `Origin` header doesn't exactly match an entry in `CORS_ORIGIN`. This is strict, exact-string matching — `https://bitscollege.edu.et` and `https://www.bitscollege.edu.et` are different origins and both need to be listed separately if both are used.
**Solution:** check the browser's Network tab for the exact `Origin` header sent, and make sure that exact string (protocol + host, no trailing slash) is in `CORS_ORIGIN`, then restart `cms-api` (env var changes require a container restart, not just a config reload).

### API connection failures
**Symptom:** the homepage project reports the CMS as unreachable, but `docker compose ps` shows everything healthy.
**Cause:** usually a firewall/DNS issue between the two servers, not the CMS itself.
**Solution:** from the homepage's server, run `curl -v https://api.bitscollege.edu.et/api/health` and read the actual error (DNS failure vs. connection refused vs. TLS error each point to a different fix).

### Port conflicts
Same pattern as the homepage project — `sudo lsof -i :80` / `:443` to find what's already bound, stop it, retry.

### Docker/container issues
**Symptom:** `cms-api` restarts in a loop.
**Cause:** check `docker compose logs cms-api` immediately — this is almost always a startup-time error (missing env var, DB unreachable, or occasionally a build issue that produced a broken `dist/`).
**Solution:** depends on the specific error; the log message is the starting point every time.

### Permission errors
Same as the homepage project: confirm your user is in the `docker` group and you've re-logged-in since adding it.

### SSL problems
**Symptom:** certbot fails for one of the two subdomains but not the other.
**Cause:** usually the failing subdomain's DNS record is missing or not yet propagated — remember this project needs **two** A records, and it's easy to set up `api.` and forget `studio.` (or vice versa).
**Solution:** `dig +short` both subdomains individually before retrying certbot.

### Domain issues
Covered under SSL above — for this project specifically, always double check you're troubleshooting the *right* subdomain (`api.` vs `studio.`), since they're separate nginx server blocks with separate certificates.

### Application crashes
`docker compose logs cms-api` first, always. Because of `restart: unless-stopped`, a crashing container keeps retrying rather than staying down — check logs before assuming it's fine just because `docker compose ps` shows it "Up" (it might be up because it *just* restarted after a crash a few seconds ago).

### Memory problems
**Symptom:** `cms-api` or `postgres` gets OOM-killed under load, especially during large media uploads (remember: files up to 10 MB are read fully into memory via `multer.memoryStorage()` before being written to the database — this is a real memory cost per concurrent upload, not a streaming operation).
**Solution:** upgrade to the "Recommended" tier from Section 2 if this happens regularly; if you expect many concurrent large uploads, consider that `multer.memoryStorage()` is a deliberate simplicity trade-off in the current code (versus streaming to disk first) and may need revisiting at higher scale — not something to fix reactively without evidence you need to.

---

## 8. Updating and Redeploying

### Deploying new changes
```bash
cd /opt/bits-cms
git pull
docker compose up -d --build cms-api
```
Scoping `--build` to just `cms-api` avoids unnecessarily rebuilding `postgres`/`nginx`/`certbot` when only your application code changed.

### Pulling updates safely
Same principle as the homepage project — check `git status` for unexpected local changes before pulling; production servers shouldn't have uncommitted edits.

### Handling database migrations on updates
If a future change modifies `migrations.sql`, **do not** just re-run `npm run migrate` — remember it's a destructive reset script (Section 4.7). Any future schema change needs to be written as a proper additive migration (a new `.sql` file with `ALTER TABLE` statements, run separately) rather than relying on the current reset-and-recreate script. This is a process you'll need to establish before your first post-launch schema change — the current tooling doesn't yet support incremental migrations.

### Rebuilding
```bash
docker compose build cms-api
docker compose up -d cms-api
```

### Restarting services
```bash
docker compose restart cms-api    # after an env var or code change
docker compose restart nginx      # after an nginx config change
```

### Avoiding downtime
Same caveat as the homepage project: this setup has a brief gap between the old container stopping and the new one becoming healthy during `--build` deploys. For a low-traffic CMS with a handful of editors, this is normally not disruptive — a login attempt during the few-second window would just need a retry. True zero-downtime would need a second `cms-api` instance and nginx load-balancing, not currently set up.

### Handling failed deployments
```bash
docker compose logs cms-api --tail=100
git log --oneline -5
git checkout <previous-working-commit>
docker compose up -d --build cms-api
```
If the failure involved a database migration you already ran, rolling back the *code* won't undo the *data* change — restore from a backup (Section 9) if a bad migration already ran against production data.

---

## 9. Production Maintenance

### Viewing logs
```bash
docker compose logs cms-api -f --tail=100
docker compose logs postgres --tail=50
```

### Restarting services
Covered in Section 8.

### Monitoring the application
```bash
curl -s https://api.bitscollege.edu.et/api/health   # set this up as an external uptime check
docker compose ps
docker stats --no-stream
```
As with the homepage project, there's no monitoring/alerting system built in — an external uptime pinger against `/api/health` is the simplest addition if you want to know about downtime before an editor tells you.

### Updating dependencies
```bash
npm update            # run locally, not on the server
git diff package-lock.json
npm run typecheck      # confirm nothing broke
npm run test:integration
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```
Then redeploy per Section 8.

### Backups — this is the most important maintenance task on this server
**Unlike the homepage project, this server holds real, irreplaceable data** — posts and all uploaded media (remember: media lives inside Postgres, not as separate files). Set up nightly automated backups:
```bash
# Add to crontab (crontab -e) on the host:
0 3 * * * docker compose -f /opt/bits-cms/docker-compose.yml exec -T postgres \
  pg_dump -U <DB_USER> <DB_NAME> | gzip > /opt/backups/cms-$(date +\%Y\%m\%d).sql.gz
```
Also **copy these backup files off the server** periodically (to another machine, or S3-compatible storage) — a backup that lives only on the same disk as the database doesn't protect you if the server itself fails. This automated backup job does **not** currently exist anywhere in the provided code or docs — you need to set it up yourself; it's not something you're missing from the repository, it just isn't part of what's been built yet.

**Test your restore process at least once**, before you need it for real:
```bash
gunzip -c /opt/backups/cms-20260101.sql.gz | docker compose exec -T postgres psql -U <DB_USER> -d <DB_NAME>
```

### Basic security maintenance
```bash
sudo apt update && sudo apt upgrade -y
docker compose pull      # updates postgres/nginx/certbot base images
docker compose up -d --build cms-api    # rebuild app image with latest node:20-alpine patches
```
Periodically re-verify the firewall (`sudo ufw status`) and the port-exposure check from Section 3.3 — confirming Postgres and the raw API port are still not internet-reachable is worth re-checking after any config change, not just on initial setup. Also periodically rotate `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` if you ever suspect they've been exposed (this will log out all currently-active sessions, which is expected and fine).