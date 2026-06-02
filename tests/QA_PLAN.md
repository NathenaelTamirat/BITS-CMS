# CMS QA Plan

## Phase 1 - Analysis

### System Understanding

- The backend is a TypeScript Express API backed by PostgreSQL.
- Core entities: `admin`, `media`, `post`, `readmore`, `readmore_media`, `refresh_token`.
- `post` owns one primary media item and optionally one `readmore` record.
- `readmore` owns a gallery of up to 6 ordered `readmore_media` items.
- `media` stores uploaded binaries as PostgreSQL `BYTEA`.
- JWT access tokens protect admin routes; refresh tokens are stored as rotated hashed records.

### Core Business Rules

- Primary post media must be exactly one of `IMAGE`, `VIDEO`, or `YOUTUBE`.
- `IMAGE` and `VIDEO` require an uploaded `mediaId`; `YOUTUBE` requires an embed URL and no `mediaId`.
- Read-more content is optional.
- Read-more gallery accepts at most 6 items.
- Slugs must be unique.
- Soft-deleted posts remain in the database but disappear from public endpoints.
- Only authenticated admins may mutate posts and upload files.
- Only superadmins may manage admin accounts.

### Document / Code Gaps

- The older docs describe `shortContent`, `date`, `DOCUMENT`, and inline `moreTitle/moreContent` fields.
- The implemented backend follows the newer News & Events rule instead:
  one primary media item, richer `readMore`, ordered gallery records, and `YOUTUBE` support.
- The docs mention frontend/UI behavior, but no frontend project exists in this workspace.
- The local `.env` originally pointed to a nonexistent `postgres` role and blocked DB-backed runtime behavior.
- Manual duplicate slugs originally auto-suffixed instead of returning `409`; this was corrected during QA.

### Assumptions

- The single post slug is the public read-more URL identifier.
- The backend is the only executable surface in this repository.
- The test suite should use an isolated local test database and reset schema before each test.

## Phase 2 - Test Plan

### Priority Order

1. Database integration
2. Authentication
3. Post creation and validation
4. Public post listing
5. Fetch by slug / read-more payload
6. Update post
7. Soft delete
8. File upload handling
9. Extended content and security

### Coverage Map

- API tests: all public and protected backend endpoints
- Integration tests: Express + PostgreSQL + real migrations
- Authentication tests: login, access token use, refresh rotation, logout
- Post creation tests: valid image/video/youtube combinations, duplicate slug, read-more validation
- Media handling tests: upload success, retrieval, invalid type, oversized file
- Extended content tests: read-more gallery limit, slug fetch path
- Fetching tests: public pagination, hidden deleted posts
- Update tests: primary media swap, content change, read-more add/update
- Delete tests: soft delete visibility rules and repeated delete behavior
- Security tests: 401, 403, auth rate limit, CORS preflight

### UI / DOM Note

- Live DOM testing is not possible from this repository because no frontend application is present.
- API-contract validation is used as the practical proxy for frontend integration in this workspace.

## Phase 3 - Runnable Test Suite

### Files

- `tests/helpers/harness.ts`
- `tests/cms.integration.test.ts`

### Execution

```bash
npm run test:integration
```

### Test Environment

- Database: `school_cms_test`
- Schema reset source: `migrations.sql`
- Admin seed users:
  - `superadmin@bits.edu.et / Passw0rd!`
  - `admin@bits.edu.et / Passw0rd!`
