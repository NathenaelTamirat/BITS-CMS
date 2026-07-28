# BITS College CMS — Quickstart

A News & Events CMS for BITS College. Public reading surface plus a Sanity-style admin studio for posting.

> Full architecture / API reference: see `README.md` in the same folder.
> Living project log: see `CLAUDE.md`.

---

## What you need

- **Node.js 18+**
- **Docker Desktop** (Postgres runs in a container)

---

## First-time setup

If you've never run this, do this once. Otherwise skip to "Start it up".

```powershell
# 1. Pull and start the Postgres container (port 5435 on host)
docker run -d --name bits-cms-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=school_cms `
  -p 5435:5432 `
  -v bits-cms-pgdata:/var/lib/postgresql/data `
  postgres:16-alpine

# 2. Install backend deps + run schema migration
cd "C:\Users\Lu\prog\bits cms\CMS\CMS"
npm install
Get-Content migrations.sql -Raw | docker exec -i bits-cms-postgres psql -U postgres -d school_cms

# 3. Seed the superadmin (creds come from src/.env)
npm run seed:admin

# 4. Install frontend deps
cd Client
npm install
```

---

## Start it up

Three things need to be running. Open three terminals (or use background tabs in your shell).

```powershell
# Terminal 1 — Postgres (only if it's stopped)
docker start bits-cms-postgres

# Terminal 2 — Backend (Node + Express, port 3000)
cd "C:\Users\Lu\prog\bits cms\CMS\CMS"
npm run dev

# Terminal 3 — Frontend (Vite, port 5173)
cd "C:\Users\Lu\prog\bits cms\CMS\CMS\Client"
npm run dev
```

Each command stays running. Stop with `Ctrl+C`.

---

## URLs

| Surface | URL | Auth |
|---|---|---|
| Public news listing | http://localhost:5173/news | none |
| Public news detail | http://localhost:5173/news/&lt;slug&gt; | none |
| Studio login | http://localhost:5173/studio/login | – |
| Studio posts | http://localhost:5173/studio/posts | admin |
| Studio admins (manage editors) | http://localhost:5173/studio/admins | superadmin only |
| Studio profile | http://localhost:5173/studio/profile | admin |
| Backend health | http://localhost:3000/api/health | none |

---

## Credentials

Configure the seeded superadmin through environment variables; never commit real
credentials:

```env
SEED_SUPERADMIN_EMAIL=<superadmin-email>
SEED_SUPERADMIN_PASSWORD=<strong-unique-password>
```

Run `npm run seed:admin`, then sign in with those configured values. The Studio
API creates new accounts with the regular `admin` role; only a `superadmin` can
manage other administrators. The database does not enforce that exactly one
superadmin exists, so production access must be managed operationally. Use the
**Reset password** action in `/studio/admins` if an editor forgets a password.

---

## What to try (5-minute tour)

1. **Sign in** as the superadmin → land on `/studio/posts`
2. **+ New post** → upload an image, type a title and content, hit **Publish**
3. **+ New post** → pick **YouTube**, paste any YouTube URL → publish
4. **+ New post** → toggle **Read More** on, fill the title + body, add 2–3 gallery items (mix images + YouTube), drag to reorder → publish
5. Open http://localhost:5173/news in another tab → cards render with all 3 media types
6. Click **Read More** on the read-more card → detail page with rich body + gallery
7. Back in studio → **Posts** → click the trash on one → confirm modal → it moves to **Deleted** filter
8. Switch to **Deleted** filter → **Restore** or **Delete forever** (the latter also removes the media files)
9. **Admins** → **+ Add admin** → email + password (always becomes a regular admin)
10. **Admins** → click **Reset password** on a row → set a new one
11. Sign out → sign in as the new admin → confirm the **Admins** link is hidden, and `/studio/admins` redirects to `/studio/posts`
12. **Profile** → change your own password → auto-signs you out

---

## Troubleshooting

**Backend logs `ECONNREFUSED ::1:5435`**
Postgres container isn't running. `docker start bits-cms-postgres`. If Docker Desktop is closed, start it first.

**Login returns 500 with `SASL: client password must be a string`**
`src/.env` has an empty `DB_PASSWORD`. Open it and confirm:
```
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=school_cms
```

**Login returns 401 "Invalid credentials"**
Either the password in `.env` for the seed (`SEED_SUPERADMIN_PASSWORD`) is different from what you're typing, or the seed never ran. Run `npm run seed:admin` once. Existing superadmin won't be overwritten.

**Frontend says "Couldn't load news right now. Request failed with 502"**
Backend isn't running. Start it in Terminal 2.

**Frontend port 5173 is in use**
Vite will fall back to 5174. Watch the terminal output for the actual port.

**Studio login screen flashes briefly even though I'm signed in**
That's the auth bootstrap calling `/api/auth/refresh`. Should resolve in &lt; 1 second. If it persists, your refresh-token cookie is stale — sign in again.

**bcrypt error on backend boot (`is not a valid Win32 application`)**
The native binding is from a different OS (typically a project archived on macOS). Fix:
```powershell
cd "C:\Users\Lu\prog\bits cms\CMS\CMS"
npm uninstall bcrypt
npm install bcrypt
```

---

## File map

```
CMS/CMS/
├── src/                 backend (Node + Express + TS + Postgres)
│   ├── Routes/          /api/auth, /api/posts, /api/media, /api/admin/*
│   ├── DB/              raw SQL via pg
│   ├── Middleware/      auth, validate, errorHandler, rateLimit
│   ├── Schemas/         input parsing/validation (no library)
│   └── Utils/           JWT, slug, youtube, errors
├── Client/              frontend (Vite + React + TS + Tailwind)
│   ├── src/pages/       NewsList, NewsDetail, studio/*
│   ├── src/components/  shared UI (NewsCard, MediaPicker, RichTextEditor, ...)
│   ├── src/api/         typed TanStack Query hooks
│   └── src/auth/        AuthContext + RequireAuth
├── migrations.sql       full schema (drops + recreates)
├── README.md            detailed architecture / API reference
├── CLAUDE.md            change log + decisions
└── QUICKSTART.md        this file
```

---

## Stopping everything

```powershell
# Stop frontend + backend with Ctrl+C in their terminals.
# Optionally stop the Postgres container too:
docker stop bits-cms-postgres
```

Data persists in the `bits-cms-pgdata` Docker volume.
