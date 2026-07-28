# 🎓 BITS College CMS

> A lightweight, secure Content Management System built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL**.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.2+-000000?style=flat&logo=express&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Installation](#Installation)
- [Features](#features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#project-structure)
- [Data Pipeline](#data-pipeline)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Environment Setup](#environment-setup)
- [Scripts](#Scripts)
- [Password Management](#password-management)
- [Dependency Graph](#dependency-graph)
- [License](#license)
<a name="Installation"></a>
---
---
# Installation

To run this project locally, follow these steps.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

---

## 2. Install Dependencies

This project requires dependencies for both the backend API and the frontend client.

### Backend

```bash
npm install
```

### Frontend

```bash
cd Client
npm install
cd ..
```

---

## 3. Environment Variable Setup

Create a `.env` file in the root directory for backend configuration.

### Backend `.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_NAME=<database-name>
JWT_ACCESS_SECRET=<strong-access-token-secret>
JWT_REFRESH_SECRET=<strong-refresh-token-secret>
CORS_ORIGIN=http://localhost:5173
SEED_SUPERADMIN_EMAIL=<superadmin-email>
SEED_SUPERADMIN_PASSWORD=<strong-unique-password>
```

Create a `.env.local` file inside the `Client` directory for frontend environment variables.

### Frontend `Client/.env.local`

```env
VITE_API_URL=http://localhost:3000
```

---

## 4. Database Setup

Ensure PostgreSQL is running locally and that the database specified by
`DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_NAME` already exists.

Run the database migrations and seed the initial admin account.

```bash
# Create tables and initial schema
psql -d <dbname> -f migrations.sql

# Seed the initial admin user
npm run seed:admin
```

---

# Running the Project

## Development Mode

Run both the backend and frontend in separate terminal windows.

### Start Backend

Runs the backend server using `tsx watch`.

```bash
npm run dev
```

### Start Frontend

Runs the Vite development server.

```bash
cd Client
npm run dev
```

---

## Production Mode

### Build and Run Backend

```bash
npm run build
npm start
```

### Build and Preview Frontend

```bash
cd Client
npm run build
npm run preview
```

---

# Usage

This project acts as a Headless CMS (Content Management System) providing both a public-facing portal and a secure admin studio.

## Public Portal

Users can view:

- Latest posts
- News updates
- Dynamic media content

## Admin Studio (`/studio`)

A protected React SPA where administrators can:

- Manage posts
- Upload media
- Control site content
- Manage administrators

---

# Authentication Flow

1. Navigate to the studio login route.
2. Enter the admin credentials created using:

```bash
npm run seed:admin
```

3. After successful authentication, a JWT token is issued.
4. Protected API routes require the JWT token for authorization.

Protected routes include:

- `/api/admin/*`
- `POST /api/media/upload`
- `POST /api/auth/logout`

Public routes include `GET /api/posts`, `GET /api/posts/:slug`, and
`GET /api/media/:id`.

---

# Important API Routes

| Route             | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `/api/health`     | Server health check and uptime monitoring             |
| `/api/auth/*`     | Authentication, login, logout, token validation       |
| `/api/posts/*`    | Public post listing and slug detail reads              |
| `/api/media/*`    | Public media reads plus authenticated upload           |
| `/api/admin/*`    | Protected administrator management endpoints          |

---

# Available Scripts

## Backend (`package.json`)

| Script                        | Description |
| ----------------------------- | ----------- |
| `npm run dev`                 | Starts backend in watch mode using `tsx` |
| `npm run build`               | Compiles TypeScript into the `dist` directory |
| `npm start`                   | Runs the compiled production server |
| `npm run seed:admin`          | Seeds the initial admin user |
| `npm run typecheck`           | Runs TypeScript type checking |
| `npm run test:integration`    | Runs integration tests using Node.js test runner |

---

## Frontend (`Client/package.json`)

| Script                 | Description |
| ---------------------- | ----------- |
| `npm run dev`          | Starts the Vite development server |
| `npm run build`        | Builds the React frontend for production |
| `npm run preview`      | Previews the production build locally |
| `npm run typecheck`    | Runs TypeScript checks for the frontend |

<a name="features"></a>

---


## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Custom JWT implementation with access & refresh tokens |
| 👥 **Role-Based Access** | Admin & Superadmin roles with permission enforcement |
| 📝 **Post Management** | Create, update, soft-delete posts with rich media support |
| 🖼️ **Media Upload** | Store images, videos, PDFs in PostgreSQL (BYTEA) |
| 📺 **YouTube Embed** | Normalize and embed YouTube videos via URL |
| 📄 **Extended Content** | "Read More" sections with gallery support (up to 6 items) |
| 🛡️ **Rate Limiting** | In-memory fixed window counter for auth routes |
| ✅ **Input Validation** | Custom schema validation (no external libraries) |
| 🔄 **Token Rotation** | Refresh tokens are rotated and tracked in database |

---
<a name="-tech-stack"></a>

## 🛠️ Tech Stack

### External Dependencies
```
express      ^5.2.1   # Web framework
pg           ^8.20.0  # PostgreSQL client
bcrypt       ^5.1.1   # Password hashing
multer       ^2.1.1   # File upload handling
dotenv       ^16.0.0  # Environment variables
```

### Custom Implementations (No External Libraries)
- 🔄 **CORS Handling** - Manual middleware
- 🔑 **JWT Authentication** - Custom HMAC-SHA256 implementation using `node:crypto`
- ⏱️ **Rate Limiting** - In-memory fixed window counter algorithm
- ✅ **Input Validation** - Pure TypeScript validation functions
- ❌ **Error Handling** - Custom error classes and formatting
<a name="project-structure"></a>

---

## 📁 Project Structure

<details>
<summary><b>🔶 Click to expand full folder structure</b></summary>

```
CMS/
├── 📂 dist/                   # Compiled JavaScript (auto-generated)
├── 📂 src/                    # Source Code (TypeScript)
│   ├── 📂 DB/                 # Data Access Layer
│   │   ├── admin.ts           # Admin & refresh token CRUD
│   │   ├── adminseed.ts       # Initial superadmin creation
│   │   ├── client.ts          # PostgreSQL connection pool
│   │   ├── media.ts           # Media file storage
│   │   ├── post.ts            # Post CRUD + business logic
│   │   └── readmore.ts        # Extended content & gallery
│   ├── 📂 Middleware/         # Express Middleware
│   │   ├── auth.ts            # JWT verification + RBAC
│   │   ├── errorHandler.ts    # Centralized error handling
│   │   ├── rateLimit.ts       # Request throttling
│   │   └── validate.ts        # Body validation wrapper
│   ├── 📂 Routes/             # API Endpoint Handlers
│   │   ├── admins.ts          # Admin management & post CRUD
│   │   ├── auth.ts            # Login, refresh, logout
│   │   ├── media.ts           # File upload & serving
│   │   └── posts.ts           # Public post listing
│   ├── 📂 Schemas/            # Input Validation
│   │   ├── admin.ts           # Admin creation validation
│   │   ├── auth.ts            # Login validation
│   │   ├── helpers.ts         # Validation utilities
│   │   └── post.ts            # Post mutation validation
│   ├── 📂 Types/              # TypeScript Declarations
│   │   └── express.d.ts       # Express Request extension
│   ├── 📂 Utils/              # Utility Functions
│   │   ├── asyncHandler.ts    # Async error wrapper
│   │   ├── env.ts             # Environment loader
│   │   ├── errors.ts          # Error classes
│   │   ├── newsMedia.ts       # Media type constants
│   │   ├── slug.ts            # URL slug generation
│   │   ├── tokens.ts          # JWT signing/verification
│   │   └── youtube.ts         # YouTube URL normalization
│   ├── app.ts                 # Express configuration
│   └── server.ts              # Application entry point
├── 📂 tests/                  # Test Suite
├── migrations.sql             # Database Schema (DDL)
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript config
```

</details>
<a name="data-pipeline"></a>

---

## 🔄 Data Pipeline

### 🔐 1. Authentication Flow (Login Example)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REQUEST: POST /api/auth/login                       │
│                         Body: { email, password }                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣  EXPRESS RECEIVES REQUEST                                                │
│     File: src/server.ts → src/app.ts                                        │
│     • Node.js HTTP server accepts connection                                │
│     • Express app processes request                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2️⃣  GLOBAL MIDDLEWARE LAYER                                                 │
│     File: src/app.ts:12-32                                                  │
│     • CORS headers set (lines 12-28)                                        │
│     • JSON body parsed (line 32)                                            │
│     • Rate limiter applied (lines 47-54)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3️⃣  ROUTE-SPECIFIC MIDDLEWARE                                               │
│     File: src/Routes/auth.ts:80-82                                         │
│     • validateBody(parseLoginBody) called                                   │
│       File: src/Middleware/validate.ts:3-12                                 │
│       • Tries: req.body = parser(req.body)                                  │
│       • Catches validation errors → next(error)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4️⃣  INPUT VALIDATION (Schema Layer)                                         │
│     File: src/Schemas/auth.ts:14-30                                         │
│     Line 15: const body = asObject(input)                                   │
│       File: src/Schemas/helpers.ts:6-15                                     │
│       • Validates input is object, not array                                │
│     Line 17: const email = readRequiredString(body, "email", ...)           │
│       File: src/Schemas/helpers.ts:30-65                                    │
│       • Validates string, not empty, max 255 chars                          │
│     Line 21: ensureEmail(email, "email", errors)                            │
│       File: src/Schemas/helpers.ts:183-187                                  │
│       • Validates email regex pattern                                       │
│     Line 24: throwIfValidationFailed(errors)                                │
│       File: src/Schemas/helpers.ts:198-202                                  │
│       • Throws AppError if any validation errors                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5️⃣  ROUTE HANDLER EXECUTION                                                 │
│     File: src/Routes/auth.ts:83-127                                         │
│     Wrapped in: asyncHandler (src/Utils/asyncHandler.ts:9-12)               │
│                                                                             │
│     Line 85: const admin = await findAdminByEmail(email)                    │
│       File: src/DB/admin.ts:30-52                                           │
│       • SQL: SELECT ... FROM admin WHERE LOWER(email) = LOWER($1)           │
│       • Returns admin record with password hash                             │
│                                                                             │
│     Line 91: const isValidPassword = await bcrypt.compare(...)              │
│       • Compares plaintext password with bcrypt hash                        │
│                                                                             │
│     Line 97-106: signAccessToken() & signRefreshToken()                     │
│       File: src/Utils/tokens.ts:92-106                                      │
│       • Creates JWT with HMAC-SHA256 signature                              │
│       • Access token: 15 min expiry                                         │
│       • Refresh token: 7 days expiry + unique JTI                           │
│                                                                             │
│     Line 108-112: storeRefreshToken()                                       │
│       File: src/DB/admin.ts:162-177                                         │
│       • Hashes token with SHA-256                                           │
│       • SQL: INSERT INTO refresh_token (...)                                │
│                                                                             │
│     Line 114: setRefreshCookie(res, refreshToken)                           │
│       File: src/Routes/auth.ts:61-69                                        │
│       • Sets HttpOnly, Secure, SameSite=Strict cookie                       │
│                                                                             │
│     Line 116-126: res.json({ data: { accessToken, user }, message: "OK" })  │
│       • Returns JSON response with access token                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6️⃣  ERROR HANDLING (if anything failed)                                     │
│     File: src/Middleware/errorHandler.ts:5-55                               │
│     • Catches AppError → returns structured JSON                            │
│     • Catches MulterError → maps to HTTP 413                                │
│     • Catches DB errors (code 23505) → HTTP 409                             │
│     • Unhandled → logs to console, returns 500                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 📝 2. Post Creation Flow (Protected Route Example)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REQUEST: POST /api/admin/posts                           │
│                    Headers: Authorization: Bearer <token>                   │
│                    Body: { title, content, primaryMedia, ... }              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣  AUTHENTICATION MIDDLEWARE                                               │
│     File: src/Routes/admins.ts:104                                          │
│     • Uses: authenticate (src/Middleware/auth.ts:5-28)                      │
│                                                                             │
│     Line 8: const authorization = req.headers.authorization                 │
│     Line 14: const payload = verifyAccessToken(token)                       │
│       File: src/Utils/tokens.ts:108-116                                     │
│       • Splits token by "." (header.payload.signature)                      │
│       • Verifies HMAC signature with timingSafeEqual                        │
│       • Checks expiration (payload.exp > now)                               │
│       • Returns decoded payload                                             │
│                                                                             │
│     Line 15-19: req.user = { sub, email, role }                             │
│       • Attaches user to request for downstream use                         │
│       File: src/Types/express.d.ts:4-9 (type definition)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2️⃣  VALIDATION MIDDLEWARE                                                   │
│     File: src/Routes/admins.ts:104                                          │
│     • Uses: validateBody(parsePostBody)                                     │
│       File: src/Schemas/post.ts:132-179                                     │
│                                                                             │
│     Complex validation includes:                                            │
│     • Line 140: parseMediaInput() for primary media                         │
│     • Line 141: parseReadMore() for extended content                        │
│     • Lines 147-159: Conditional validation                                 │
│       • If readMoreEnabled=true → readMore required                         │
│       • If readMoreEnabled=false → readMore must be omitted                 │
│     • Lines 161-166: primaryMedia required                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3️⃣  BUSINESS LOGIC (Database Transaction)                                   │
│     File: src/Routes/admins.ts:106-114                                      │
│     Calls: createPost(input)                                                │
│       File: src/DB/post.ts:262-334                                          │
│                                                                             │
│     Line 263: withTransaction(async (client) => {                           │
│       File: src/DB/client.ts:27-43                                          │
│       • Gets client from pool                                               │
│       • BEGIN transaction                                                   │
│       • Execute callback                                                    │
│       • COMMIT on success / ROLLBACK on error                               │
│       • Release client back to pool                                         │
│                                                                             │
│     Inside transaction:                                                     │
│     • Line 264-268: normalizeMediaReference()                               │
│       • If IMAGE/VIDEO: verify mediaId exists in DB                         │
│       • If YOUTUBE: pass through (already normalized)                       │
│                                                                             │
│     • Line 269-275: Slug handling                                           │
│       • If slug provided: check uniqueness                                  │
│       • If not: generate from title with auto-suffix                        │
│       File: src/DB/post.ts:129-157 (getUniqueSlug)                          │
│                                                                             │
│     • Line 277-304: INSERT INTO post                                        │
│       • Uses COALESCE for default publishedDate                             │
│                                                                             │
│     • Line 308-324: If readMoreEnabled                                      │
│       • normalizeMediaCollection() for gallery                              │
│       • upsertReadMoreForPost()                                             │
│         File: src/DB/readmore.ts:55-89                                      │
│         • INSERT ... ON CONFLICT (postid) DO UPDATE                         │
│         • DELETE existing gallery items                                     │
│         • INSERT new gallery items (max 6)                                  │
│                                                                             │
│     • Line 326: getPostById() to return created post                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🖼️ 3. Media Upload & Retrieval Flow

```
UPLOAD FLOW:
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/media/upload                                                      │
│ Content-Type: multipart/form-data                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ File: src/Routes/media.ts:34-58                                             │
│                                                                             │
│ Line 36: authenticate middleware                                            │
│ Line 37: upload.single("file")                                              │
│    File: src/Routes/media.ts:19-32                                          │
│    • multer with memoryStorage()                                            │
│    • limits: { fileSize: 10 * 1024 * 1024 } (10MB)                          │
│    • fileFilter: checks allowedMimeTypes                                    │
│      • image/jpeg, image/png, image/gif, image/webp                         │
│      • video/mp4, application/pdf                                           │
│                                                                             │
│ Line 43-47: insertMedia()                                                   │
│    File: src/DB/media.ts:15-37                                              │
│    • SQL: INSERT INTO media (mimetype, filedata, uploadedby)                │
│    • fileData stored as BYTEA (binary)                                      │
│                                                                             │
│ Line 49-56: Returns { mediaId, url, mimeType }                              │
└─────────────────────────────────────────────────────────────────────────────┘

RETRIEVAL FLOW:
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/media/:id                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ File: src/Routes/media.ts:60-78                                             │
│                                                                             │
│ Line 69: getMediaById(mediaId)                                              │
│    File: src/DB/media.ts:39-59                                              │
│    • SQL: SELECT ... FROM media WHERE mediaid = $1                          │
│    • Returns full record including filedata (Buffer)                        │
│                                                                             │
│ Line 75-77: Send binary response                                            │
│    res.set("Content-Type", media.mimeType)                                  │
│    res.set("Cache-Control", "public, max-age=86400")                        │
│    res.send(media.fileData)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 File Reference Guide

### 🔷 Entry Points

| File | Purpose | Data Flow |
|------|---------|-----------|
| `src/server.ts` | Application bootstrap | Imports app → starts HTTP server on configured port |
| `src/app.ts` | Express configuration | Creates instance → configures middleware → mounts routes |

### 🔷 Routes (API Endpoints)

| File | Base Path | Purpose |
|------|-----------|---------|
| `src/Routes/auth.ts` | `/api/auth/*` | Authentication: login, refresh, logout |
| `src/Routes/posts.ts` | `/api/posts/*` | Public post access: list, get by slug |
| `src/Routes/media.ts` | `/api/media/*` | File upload & retrieval |
| `src/Routes/admins.ts` | `/api/admin/*` | Admin operations: post CRUD, user management |

### 🔷 Middleware (Request Processing)

| File | Exports | Purpose |
|------|---------|---------|
| `src/Middleware/auth.ts` | `authenticate`, `requireRole` | JWT verification & role-based access |
| `src/Middleware/errorHandler.ts` | `errorHandler` | Centralized error formatting |
| `src/Middleware/rateLimit.ts` | `createRateLimiter` | In-memory request throttling |
| `src/Middleware/validate.ts` | `validateBody` | Request body validation wrapper |

### 🔷 Schemas (Input Validation)

| File | Exports | Purpose |
|------|---------|---------|
| `src/Schemas/helpers.ts` | Validation utilities | Core validation functions |
| `src/Schemas/auth.ts` | `parseLoginBody` | Login validation |
| `src/Schemas/admin.ts` | `parseCreateAdminBody`, `parseChangePasswordBody` | Admin management validation |
| `src/Schemas/post.ts` | `parsePostBody` | Post creation/update validation |

### 🔷 Database Layer

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/DB/client.ts` | Database connection | `query()`, `withTransaction()`, `closePool()` |
| `src/DB/admin.ts` | Admin & token CRUD | `findAdminByEmail()`, `storeRefreshToken()`, `revokeRefreshToken()` |
| `src/DB/media.ts` | File storage | `insertMedia()`, `getMediaById()` |
| `src/DB/readmore.ts` | Extended content | `upsertReadMoreForPost()`, `getReadMoreByPostId()` |
| `src/DB/post.ts` | Post operations | `createPost()`, `updatePost()`, `softDeletePost()`, `getPublicPostBySlug()` |
| `src/DB/adminseed.ts` | CLI script | Creates initial superadmin account |

### 🔷 Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `src/Utils/env.ts` | `env` object | Environment variable loader with validation |
| `src/Utils/tokens.ts` | JWT functions | `signAccessToken()`, `verifyAccessToken()`, `hashToken()` |
| `src/Utils/errors.ts` | Error classes | `AppError`, `badRequest()`, `unauthorized()`, etc. |
| `src/Utils/asyncHandler.ts` | `asyncHandler` | Async route handler wrapper |
| `src/Utils/slug.ts` | `slugify` | URL-friendly slug generation |
| `src/Utils/newsMedia.ts` | Media types | `NEWS_MEDIA_TYPES`, `isNewsMediaType()` |
| `src/Utils/youtube.ts` | `normalizeYouTubeInput` | YouTube URL normalization |

<a name="api-endpoints"></a>
---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login with email/password |
| `POST` | `/api/auth/refresh` | ❌ | Refresh access token (uses cookie) |
| `POST` | `/api/auth/logout` | ✅ | Revoke refresh token |

### Public Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/posts` | ❌ | List public posts (paginated) |
| `GET` | `/api/posts/:slug` | ❌ | Get single post by slug |

### Media

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/media/upload` | ✅ | Upload file (max 10MB) |
| `GET` | `/api/media/:id` | ❌ | Retrieve file by ID |
| `GET` | `/api/health` | ❌ | Health check (uptime, status) |

### Admin (Protected)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/posts` | Admin | List all posts (with deleted filter) |
| `POST` | `/api/admin/posts` | Admin | Create new post |
| `GET` | `/api/admin/posts/:id` | Admin | Get post details |
| `PUT` | `/api/admin/posts/:id` | Admin | Update post |
| `DELETE` | `/api/admin/posts/:id` | Admin | Soft delete post |
| `POST` | `/api/admin/admins` | Superadmin | Create admin account |
| `GET` | `/api/admin/admins` | Superadmin | List all admins |
| `PATCH` | `/api/admin/admins/:id/deactivate` | Superadmin | Deactivate admin |
| `PATCH` | `/api/admin/me/password` | Admin | Change own password |

---

## � Detailed API Documentation

### 🔐 Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "admin@bits.edu.et",
  "password": "Passw0rd!"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "adminId": 1,
      "email": "admin@bits.edu.et",
      "role": "admin"
    }
  },
  "message": "OK"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Validation failed (email format, password length)
- `429 Too Many Requests` - Rate limit exceeded

**Notes:**
- Sets HTTP-only refresh token cookie automatically
- Access token expires in 15 minutes
- Refresh token expires in 7 days

---

#### POST `/api/auth/refresh`
Obtain new access token using refresh token cookie.

**Request:**
- Requires `refreshToken` HTTP-only cookie (sent automatically by browser)
- No body required

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "OK"
}
```

**Error Responses:**
- `401 Unauthorized` - No refresh token, invalid token, or token revoked

**Notes:**
- Implements token rotation: old refresh token is revoked, new one issued
- Updates `lastUsedAt` timestamp in database

---

#### POST `/api/auth/logout`
Revoke refresh token and clear cookie.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):**
- No content

**Notes:**
- Revokes refresh token in database
- Clears HTTP-only cookie
- Requires valid access token

---

### 📝 Public Post Endpoints

#### GET `/api/posts`
List all public (non-deleted) posts with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 10 | Items per page (max: 50) |

**Response (200):**
```json
{
  "data": [
    {
      "postId": 1,
      "adminId": 1,
      "title": "Welcome to BITS College",
      "content": "Short preview content...",
      "publishedDate": "2024-01-15",
      "slug": "welcome-to-bits",
      "hasReadMore": true,
      "isDeleted": false,
      "media": {
        "type": "IMAGE",
        "mediaId": 5,
        "url": "/api/media/5",
        "embedUrl": null,
        "mimeType": "image/jpeg"
      },
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  },
  "message": "OK"
}
```

---

#### GET `/api/posts/:slug`
Get single public post by slug.

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `slug` | URL-friendly post identifier (e.g., "welcome-to-bits") |

**Response (200):**
```json
{
  "data": {
    "postId": 1,
    "adminId": 1,
    "title": "Welcome to BITS College",
    "content": "Short preview content...",
    "publishedDate": "2024-01-15",
    "slug": "welcome-to-bits",
    "hasReadMore": true,
    "isDeleted": false,
    "media": {
      "type": "IMAGE",
      "mediaId": 5,
      "url": "/api/media/5",
      "embedUrl": null,
      "mimeType": "image/jpeg"
    },
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z",
    "readMore": {
      "title": "Full Article",
      "content": "Extended content here...",
      "media": [
        {
          "position": 1,
          "type": "IMAGE",
          "mediaId": 6,
          "url": "/api/media/6",
          "embedUrl": null,
          "mimeType": "image/jpeg"
        }
      ],
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    }
  },
  "message": "OK"
}
```

**Error Responses:**
- `404 Not Found` - Post not found or deleted

---

### 🖼️ Media Endpoints

#### POST `/api/media/upload`
Upload image, video, or PDF file.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image (jpeg, png, gif, webp), Video (mp4), or PDF |

**Constraints:**
- Max file size: 10MB
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `application/pdf`

**Response (201):**
```json
{
  "data": {
    "mediaId": 5,
    "url": "/api/media/5",
    "mimeType": "image/jpeg"
  },
  "message": "OK"
}
```

**Error Responses:**
- `400 Bad Request` - No file, unsupported type, or file too large
- `401 Unauthorized` - Invalid or missing access token

---

#### GET `/api/media/:id`
Retrieve uploaded file by ID.

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `id` | Media ID (positive integer) |

**Response (200):**
- Returns raw binary file data
- Content-Type header set to stored MIME type
- Cache-Control: `public, max-age=86400` (24 hours)

**Error Responses:**
- `400 Bad Request` - Invalid media ID format
- `404 Not Found` - Media not found

---

### 🏥 Health Endpoint

#### GET `/api/health`
Check API status and uptime.

**Response (200):**
```json
{
  "data": {
    "status": "ok",
    "uptime": 3600.123,
    "timestamp": "2024-01-20T10:30:00.000Z"
  },
  "message": "OK"
}
```

**Notes:**
- `uptime` is in seconds (Node.js process uptime)
- `timestamp` is ISO 8601 format of current server time
- Response wrapped in standard API envelope (`data` + `message`)
- Returns immediately without database checks
- Useful for load balancer health checks and monitoring

---

### 👨‍💼 Admin Endpoints (Require Authentication)

#### GET `/api/admin/posts`
List all posts with deleted filter.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max: 50) |
| `deleted` | enum | "false" | Filter: "true", "false", or "all" |

**Response (200):**
```json
{
  "data": [
    {
      "postId": 1,
      "adminId": 1,
      "title": "Welcome to BITS",
      "content": "Content...",
      "publishedDate": "2024-01-15",
      "slug": "welcome-to-bits",
      "hasReadMore": true,
      "isDeleted": false,
      "media": { ... },
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  },
  "message": "OK"
}
```

---

#### POST `/api/admin/posts`
Create new post.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Article",
  "content": "Short preview content",
  "slug": "new-article",
  "publishedDate": "2024-01-20",
  "primaryMedia": {
    "type": "IMAGE",
    "mediaId": 5
  },
  "readMoreEnabled": true,
  "readMore": {
    "title": "Full Article",
    "content": "Extended content here...",
    "media": [
      {
        "type": "YOUTUBE",
        "embedUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      {
        "type": "IMAGE",
        "mediaId": 6
      }
    ]
  }
}
```

**Field Constraints:**
| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `title` | ✅ | string | Max 255 chars |
| `content` | ✅ | string | No limit |
| `slug` | ❌ | string | Max 160, lowercase-hyphens-only |
| `publishedDate` | ❌ | string | YYYY-MM-DD format |
| `primaryMedia` | ✅ | object | IMAGE/VIDEO require mediaId, YOUTUBE requires embedUrl |
| `readMoreEnabled` | ✅ | boolean | Must match readMore presence |
| `readMore` | Conditional | object | Required if readMoreEnabled=true, omitted if false |
| `readMore.title` | ✅ | string | Max 255 |
| `readMore.content` | ✅ | string | No limit |
| `readMore.media` | ❌ | array | Max 6 items |

**Response (201):**
```json
{
  "data": {
    "postId": 2,
    "adminId": 1,
    "title": "New Article",
    "content": "Short preview content",
    "publishedDate": "2024-01-20",
    "slug": "new-article",
    "hasReadMore": true,
    "isDeleted": false,
    "media": { ... },
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z",
    "readMore": { ... }
  },
  "message": "OK"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (detailed field errors returned)
- `401 Unauthorized` - Invalid or missing token
- `409 Conflict` - Slug already exists

---

#### GET `/api/admin/posts/:id`
Get post details by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `id` | Post ID (positive integer) |

**Response (200):** Same as POST response with full post data

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Post not found

---

#### PUT `/api/admin/posts/:id`
Update existing post.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `id` | Post ID (positive integer) |

**Request Body:** Same as POST `/api/admin/posts`

**Response (200):** Same as POST response with updated post data

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Post not found or deleted
- `409 Conflict` - Slug already exists

---

#### DELETE `/api/admin/posts/:id`
Soft delete post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `id` | Post ID (positive integer) |

**Response (204):**
- No content

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Post not found or already deleted

**Notes:**
- Sets `isDeleted` to TRUE in database
- Post remains in database but excluded from public listings

---

### 👤 Admin Account Management (Superadmin Only)

#### POST `/api/admin/admins`
Create new admin account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** `superadmin`

**Request Body:**
```json
{
  "email": "newadmin@bits.edu.et",
  "password": "SecurePass123!",
  "role": "admin"
}
```

**Field Constraints:**
| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `email` | ✅ | string | Valid email, max 255 chars |
| `password` | ✅ | string | 6-255 chars |
| `role` | ❌ | enum | "admin" or "superadmin" (default: "admin") |

**Response (201):**
```json
{
  "data": {
    "adminId": 2,
    "email": "newadmin@bits.edu.et",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "message": "OK"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient role (requires superadmin)
- `409 Conflict` - Email already exists

---

#### GET `/api/admin/admins`
List all admin accounts.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** `superadmin`

**Response (200):**
```json
{
  "data": [
    {
      "adminId": 1,
      "email": "superadmin@bits.edu.et",
      "role": "superadmin",
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    },
    {
      "adminId": 2,
      "email": "admin@bits.edu.et",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "message": "OK"
}
```

---

#### PATCH `/api/admin/admins/:id/deactivate`
Deactivate admin account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** `superadmin`

**URL Parameters:**
| Param | Description |
|-------|-------------|
| `id` | Admin ID (positive integer) |

**Response (200):**
```json
{
  "data": {
    "adminId": 2,
    "isActive": false
  },
  "message": "OK"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID or attempting self-deactivation
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient role
- `404 Not Found` - Admin not found

**Notes:**
- Cannot deactivate own account
- All refresh tokens for the admin are revoked

<a name="password-management"></a>

---

### 🔑 Password Management

#### PATCH `/api/admin/me/password`
Change own password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Field Constraints:**
| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `currentPassword` | ✅ | string | 6-255 chars |
| `newPassword` | ✅ | string | 6-255 chars, must differ from current |

**Response (200):**
```json
{
  "data": {
    "adminId": 1
  },
  "message": "Password updated. Please log in again."
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or new password matches current
- `401 Unauthorized` - Current password incorrect or invalid token

**Notes:**
- All refresh tokens for the user are revoked after password change
- User must re-authenticate with new password

---

## ❌ Error Response Format

All errors follow this standardized format:

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| `400` | `VALIDATION_ERROR` | Input validation failed |
| `400` | `BAD_REQUEST` | General bad request |
| `401` | `UNAUTHORIZED` | Missing/invalid token or credentials |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `CONFLICT` | Resource already exists (unique constraint) |
| `413` | `PAYLOAD_TOO_LARGE` | File upload exceeds 10MB |
| `429` | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| `500` | `INTERNAL_ERROR` | Server error |

<a name="database-schema"></a>

---

## ��️ Database Schema

### Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `admin` | User accounts | email, passwordhashed, role, isactive |
| `media` | File storage | mimetype, filedata (BYTEA), uploadedby |
| `post` | Content posts | title, content, slug, mediatype, isdeleted |
| `readmore` | Extended content | title, content (linked to post) |
| `readmore_media` | Gallery items | position (1-6), mediatype, mediaid |
| `refresh_token` | Token storage | tokenhash, expiresat, revokedat |

### Media Type Enum

```sql
CREATE TYPE media_type_enum AS ENUM ('IMAGE', 'VIDEO', 'YOUTUBE');
```

### Constraints

- **Post media**: IMAGE/VIDEO require `mediaid` (DB file), YOUTUBE requires `mediaurl` (external URL)
- **Readmore gallery**: Max 6 items per post, positions 1-6 must be unique
- **Slug**: Unique across all posts

<a name="environment-setup"></a>
---

## ⚙️ Environment Setup

### Required Variables

Create `src/.env` file:

```env
# Server
PORT=3000
CORS_ORIGIN=*

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cms_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (generate strong random strings)
# Option A: Separate secrets (recommended for production)
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Option B: Single secret (fallback mode)
# JWT_SECRET=your_single_secret

# Optional
REFRESH_COOKIE_NAME=refreshToken

# Superadmin (for seeding)
SEED_SUPERADMIN_EMAIL=<superadmin-email>
SEED_SUPERADMIN_PASSWORD=<strong-unique-password>
```

### Token Configuration (Hardcoded)

| Token Type | TTL | Notes |
|------------|-----|-------|
| Access Token | 15 minutes | Hardcoded in `src/Utils/env.ts` |
| Refresh Token | 7 days | Hardcoded in `src/Utils/env.ts` |

**Note:** Token TTLs are currently hardcoded and cannot be overridden via environment variables. To change TTLs, modify `src/Utils/env.ts` lines 57-58.

<a name="Scripts"></a>

---

## 🚀 Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` folder |
| `npm run start` | Run compiled production server |
| `npm run test:integration` | Run integration tests |
| `npm run typecheck` | Type-check TypeScript without emitting files |
| `npm run seed:admin` | Create initial superadmin account |

<a name="dependency-graph"></a>

---

## 🔗 Dependency Graph

```
server.ts
    └── app.ts
        ├── express (external)
        ├── Routes/auth.ts
        │   ├── DB/client.ts (withTransaction)
        │   ├── DB/admin.ts (findAdminByEmail, storeRefreshToken)
        │   ├── Middleware/auth.ts (authenticate)
        │   ├── Middleware/validate.ts (validateBody)
        │   ├── Schemas/auth.ts (parseLoginBody)
        │   ├── Utils/tokens.ts (signAccessToken, verifyRefreshToken)
        │   └── bcrypt (external)
        ├── Routes/posts.ts
        │   ├── DB/post.ts (listPublicPosts, getPublicPostBySlug)
        │   └── Utils/asyncHandler.ts
        ├── Routes/media.ts
        │   ├── multer (external)
        │   ├── Middleware/auth.ts
        │   └── DB/media.ts
        ├── Routes/admins.ts
        │   ├── bcrypt (external)
        │   ├── DB/admin.ts
        │   ├── DB/post.ts
        │   ├── Middleware/auth.ts (authenticate, requireRole)
        │   └── Schemas/post.ts
        ├── Middleware/errorHandler.ts
        └── Middleware/rateLimit.ts
```

---

## 📝 Key Data Transformations

### Database Column Naming

| SQL (snake_case) | TypeScript (camelCase) |
|------------------|------------------------|
| `adminid` | `adminId` |
| `passwordhashed` | `passwordHashed` |
| `isactive` | `isActive` |
| `createdat` | `createdAt` |

### Media Reference Normalization

| Input (API) | Output (Database) |
|-------------|-------------------|
| `{ type: "IMAGE", mediaId: 5 }` | `{ type: "IMAGE", mediaId: 5, mediaUrl: null }` |
| `{ type: "YOUTUBE", embedUrl: "..." }` | `{ type: "YOUTUBE", mediaId: null, mediaUrl: "..." }` |

### JWT Token Lifecycle

1. **Creation**: `signRefreshToken()` → `{ sub, email, role, type: "refresh", jti, iat, exp }`
2. **Storage**: `hashToken()` → SHA-256 hash stored in `refresh_token.tokenhash`
3. **Verification**: `verifyRefreshToken()` → Verify HMAC → Hash lookup → Check revocation
<a name="license"></a>

---

<p align="center">
  <b>BITS College CMS</b> — Built with ❤️ for educational purposes
  # School News CMS

`Copyright (c) 2026 Nathenael Tamirat and BITS College: School of Systems and Technology
 All rights reserved.`
 
 This software and associated documentation files are proprietary and confidential.
Unauthorized copying of this file, via any medium, is strictly prohibited and illegal.

</p>
