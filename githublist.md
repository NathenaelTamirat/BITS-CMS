# GitHub Commit Plan: Full Ground-Up Granular Development

Copy and paste these commands sequentially to simulate the full development cycle of every single file in the repository.

```bash
# ==========================================
# PHASE 1: ROOT REPOSITORY & DOCS
# ==========================================

git add package.json package-lock.json
git commit -m "chore: init backend package" -m "Initialize npm for backend with express and typescript dependencies"
git push origin main

git add .gitignore
git commit -m "chore: root gitignore" -m "Add ignored files for root backend"
git push origin main

git add tsconfig.json
git commit -m "chore: typescript config" -m "Add root tsconfig for Node backend"
git push origin main


# git add QUICKSTART.md
# git commit -m "docs: quickstart guide" -m "Add rapid onboarding steps for developers"
# git push origin main

git add "CMS PROPOSAL.pdf"
git commit -m "docs: project proposal" -m "Upload original CMS project proposal document"
git push origin main

git add CLAUDE.md
git commit -m "docs: claude context" -m "Add AI context and system prompt documentation"
git push origin main

# ==========================================
# PHASE 2: BACKEND UTILS & SCHEMAS
# ==========================================

git add src/Types/express.d.ts
git commit -m "types: express extensions" -m "Add custom typing for Express Request to include user payload"
git push origin main



git add src/Utils/env.ts
git commit -m "feat(utils): env variables" -m "Create utility to parse environment variables"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Utils/errors.ts
git commit -m "feat(utils): error classes" -m "Create custom API error classes for HTTP responses"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Utils/asyncHandler.ts
git commit -m "feat(utils): async handler" -m "Create wrapper to handle rejected promises in express routes"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Utils/tokens.ts
git commit -m "feat(utils): jwt tokens" -m "Create utilities for generating and verifying JSON Web Tokens"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Utils/slug.ts
git commit -m "feat(utils): slug generator" -m "Create utility to generate URL-friendly slugs from strings"
git push origin main

git add src/Utils/youtube.ts
git commit -m "feat(utils): youtube helper" -m "Create utility to extract and format youtube video IDs"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Utils/queryParams.ts
git commit -m "feat(utils): query parameters" -m "Create SQL dynamic query builder for pagination and filtering"
git push origin main

git add src/Utils/newsMedia.ts
git commit -m "feat(utils): news media helper" -m "Create utility for parsing and structuring news media data"
git push origin main

git add src/Schemas/helpers.ts
git commit -m "feat(schema): validation helpers" -m "Add general validation schema helpers"
git push origin main
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Schemas/auth.ts
git commit -m "feat(schema): auth schemas" -m "Add Zod schemas for login and registration requests"
git push origin main

git add src/Schemas/admin.ts
git commit -m "feat(schema): admin schemas" -m "Add Zod schemas for admin user management"
git push origin main

git add src/Schemas/post.ts
git commit -m "feat(schema): post schemas" -m "Add Zod schemas for blog post validation"
git push origin main

# ==========================================
# PHASE 3: DATABASE & QUERIES
# ==========================================

git add migrations.sql
git commit -m "feat(db): sql migrations" -m "Define PostgreSQL table schemas for the CMS"
git push origin main

git add src/DB/client.ts
git commit -m "feat(db): pg client" -m "Establish PostgreSQL pool connection"
git push origin main

git add src/DB/admin.ts
git commit -m "feat(db): admin queries" -m "Add SQL queries for fetching and managing admin users"
git push origin main

git add src/DB/adminseed.ts
git commit -m "feat(db): admin seeder" -m "Add script to create the initial superadmin account"
git push origin main

git add src/DB/post.ts
git commit -m "feat(db): post queries" -m "Add SQL queries for creating, fetching, and updating posts"
git push origin main

git add src/DB/media.ts
git commit -m "feat(db): media queries" -m "Add SQL queries to manage uploaded media records"
git push origin main

git add src/DB/readmore.ts
commit -m "feat(db):git  readmore queries" -m "Add SQL queries for read-more link associations"
git push origin main

# ==========================================
# PHASE 4: BACKEND MIDDLEWARE & ROUTES
# ==========================================

git add src/Middleware/errorHandler.ts
git commit -m "feat(middleware): error handling" -m "Add global error catching and formatting middleware"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Middleware/validate.ts
git commit -m "feat(middleware): schema validation" -m "Add middleware to validate request bodies against Zod schemas"
git push origin main

git add src/Middleware/auth.ts
git commit -m "feat(middleware): auth protection" -m "Add JWT validation middleware to protect secure routes"
git push origin main

git add src/Middleware/rateLimit.ts
git commit -m "feat(middleware): rate limiter" -m "Add request throttling to prevent brute-force attacks"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/Routes/auth.ts
git commit -m "feat(routes): auth endpoints" -m "Implement login route and token issuance"
git push origin main

git add src/Routes/admins.ts
git commit -m "feat(routes): admin management" -m "Implement CRUD endpoints for administrator accounts"
git push origin main

git add src/Routes/posts.ts
git commit -m "feat(routes): posts api" -m "Implement API endpoints for blog post management"
git push origin main

git add src/Routes/media.ts
git commit -m "feat(routes): media upload" -m "Implement Multer-based media upload endpoints"
git push origin main
-----------------------------------------------------------------------------------------------------------
git add src/app.ts
git commit -m "feat(api): express app config" -m "Configure Express, mount middleware, and register route handlers"
git push origin main

git add src/server.ts
git commit -m "feat(api): server boot" -m "Initialize and start the Express HTTP server"
git push origin main

# ==========================================
# PHASE 5: BACKEND TESTS
# ==========================================

git add tests/QA_PLAN.md
git commit -m "test: qa plan" -m "Document the quality assurance and testing strategy"
git push origin main

git add tests/helpers/harness.ts
git commit -m "test: harness" -m "Create testing harness for isolated database setup and teardown"
git push origin main

git add tests/cms.integration.test.ts
git commit -m "test: integration tests" -m "Add integration test suite for CMS APIs using Node test runner"
git push origin main

# ==========================================
# PHASE 6: FRONTEND (CLIENT) INITIALIZATION
# ==========================================

git add Client/package.json Client/package-lock.json
git commit -m "chore(client): init react app" -m "Add Vite, React, Tailwind, and client-side dependencies"
git push origin main

git add Client/.gitignore
git commit -m "chore(client): gitignore" -m "Ignore dist, node_modules, and local env files for frontend"
git push origin main

git add Client/.env.example
git commit -m "chore(client): env example" -m "Provide template for frontend environment variables"
git push origin main

git add Client/tsconfig.json Client/tsconfig.app.json Client/tsconfig.node.json
git commit -m "chore(client): typescript" -m "Configure TypeScript specifically for React and Vite"
git push origin main

git add Client/vite.config.ts
git commit -m "chore(client): vite config" -m "Configure Vite bundler and dev server proxies"
git push origin main

git add Client/postcss.config.js Client/tailwind.config.js
git commit -m "chore(client): styling config" -m "Configure PostCSS and Tailwind themes/plugins"
git push origin main

git add Client/index.html
git commit -m "chore(client): html entry" -m "Create the root HTML file for the React SPA"
git push origin main

git add Client/src/vite-env.d.ts
git commit -m "chore(client): vite types" -m "Add Vite-specific global typings"
git push origin main

git add Client/src/index.css
git commit -m "style(client): global css" -m "Add Tailwind base layers and custom utility classes"
git push origin main

# ==========================================
# PHASE 7: FRONTEND CORE UTILS & API
# ==========================================

git add Client/src/lib/api.ts
git commit -m "feat(lib): api client" -m "Create base fetch utility with token injection"
git push origin main

git add Client/src/lib/format.ts
git commit -m "feat(lib): formatter" -m "Add utility to format dates and text"
git push origin main

git add Client/src/lib/jwt.ts
git commit -m "feat(lib): jwt parser" -m "Add utility to parse and decode JWT payloads on the client"
git push origin main

git add Client/src/lib/sanitize.ts
git commit -m "feat(lib): dom sanitization" -m "Add utility to clean HTML strings to prevent XSS"
git push origin main

git add Client/src/lib/slug.ts
git commit -m "feat(lib): client slug util" -m "Add slug generation utility for the frontend"
git push origin main

git add Client/src/lib/useDocumentTitle.ts
git commit -m "feat(lib): title hook" -m "Add React hook for dynamically updating page titles"
git push origin main

git add Client/src/lib/youtube.ts
git commit -m "feat(lib): youtube client util" -m "Add utility for client-side youtube embed handling"
git push origin main

git add Client/src/api/types.ts
git commit -m "types(api): api interfaces" -m "Define TypeScript interfaces for API requests and responses"
git push origin main

git add Client/src/api/auth.ts Client/src/api/admins.ts Client/src/api/posts.ts Client/src/api/media.ts Client/src/api/profile.ts
git commit -m "feat(api): api fetchers" -m "Implement React Query fetcher functions for all endpoints"
git push origin main

# ==========================================
# PHASE 8: UI SHARED COMPONENTS
# ==========================================

git add Client/src/ui/ConfirmDialog.tsx
git commit -m "feat(ui): confirm dialog" -m "Create reusable confirmation modal component"
git push origin main

git add Client/src/ui/Toast.tsx
git commit -m "feat(ui): toast notifications" -m "Create toast notification system for feedback"
git push origin main

git add Client/src/components/DatePicker.tsx
git commit -m "feat(components): date picker" -m "Create accessible date picker component"
git push origin main

git add Client/src/components/Pagination.tsx
git commit -m "feat(components): pagination" -m "Create pagination controls for list views"
git push origin main

git add Client/src/components/Skeleton.tsx
git commit -m "feat(components): loading skeleton" -m "Create skeleton loader for asynchronous content"
git push origin main

git add Client/src/components/MediaRender.tsx
git commit -m "feat(components): media renderer" -m "Create component to display uploaded images or videos"
git push origin main

# ==========================================
# PHASE 9: AUTH & ROUTING
# ==========================================

git add Client/src/auth/AuthContext.tsx
git commit -m "feat(auth): auth provider" -m "Create React Context to manage global authentication state"
git push origin main

git add Client/src/layouts/PublicLayout.tsx
git commit -m "feat(layouts): public layout" -m "Create wrapper layout for public-facing pages"
git push origin main

git add Client/src/layouts/StudioLayout.tsx
git commit -m "feat(layouts): studio layout" -m "Create wrapper layout and sidebar for admin dashboard"
git push origin main

# ==========================================
# PHASE 10: PUBLIC PORTAL PAGES
# ==========================================

git add Client/src/components/HeroBand.tsx
git commit -m "feat(components): hero section" -m "Create dynamic hero banner for landing page"
git push origin main

git add Client/src/components/NewsCard.tsx
git commit -m "feat(components): news card" -m "Create display card for post summaries"
git push origin main

git add Client/src/pages/NewsList.tsx
git commit -m "feat(pages): news feed" -m "Build public feed to list and filter news articles"
git push origin main

git add Client/src/pages/NewsDetail.tsx
git commit -m "feat(pages): news detail view" -m "Build dynamic page to render specific blog post content"
git push origin main

git add Client/src/pages/NotFound.tsx
git commit -m "feat(pages): 404 page" -m "Build fallback page for unmatched routes"
git push origin main

# ==========================================
# PHASE 11: ADMIN STUDIO COMPONENTS
# ==========================================

git add Client/src/components/studio/Field.tsx
git commit -m "feat(studio): form fields" -m "Create reusable input field wrappers for studio forms"
git push origin main

git add Client/src/components/studio/MediaPicker.tsx
git commit -m "feat(studio): media picker" -m "Create modal component to select media from gallery"
git push origin main

git add Client/src/components/studio/GalleryEditor.tsx
git commit -m "feat(studio): gallery manager" -m "Create drag-and-drop interface for managing uploaded assets"
git push origin main

git add Client/src/components/studio/RichTextEditor.tsx
git commit -m "feat(studio): rich text editor" -m "Integrate TipTap for WYSIWYG content editing"
git push origin main

# ==========================================
# PHASE 12: ADMIN STUDIO PAGES
# ==========================================

git add Client/src/pages/studio/Login.tsx
git commit -m "feat(studio): login page" -m "Build admin login form and handle authentication"
git push origin main

git add Client/src/pages/studio/Profile.tsx
git commit -m "feat(studio): profile page" -m "Build user profile management page"
git push origin main

git add Client/src/pages/studio/Admins.tsx
git commit -m "feat(studio): admins dashboard" -m "Build page to manage and invite other administrators"
git push origin main

git add Client/src/pages/studio/PostsList.tsx
git commit -m "feat(studio): posts table" -m "Build data table to list, edit, and delete existing posts"
git push origin main

git add Client/src/pages/studio/PostEditor.tsx
git commit -m "feat(studio): post editor page" -m "Build the complete page for creating and editing articles"
git push origin main

# ==========================================
# PHASE 13: REACT MOUNTING & FINALIZE
# ==========================================

git add Client/src/App.tsx
git commit -m "feat(client): routing configuration" -m "Assemble all pages into React Router definitions"
git push origin main

git add Client/src/main.tsx
git commit -m "feat(client): react root mount" -m "Mount React DOM with QueryClient and AuthProvider"
git push origin main

git add README.md
git commit -m "docs: main readme" -m "Add project description and setup instructions"
git push origin main
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```
