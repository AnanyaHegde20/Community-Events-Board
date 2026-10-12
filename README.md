# Community Events Board

A full-stack Next.js application where communities can browse local events and
signed-in users can personalise the experience with favourite categories, a
personalised feed, saved "Remind me" toggles, and a per-user event card
designer. Admins manage the event catalogue through a protected dashboard.

Built for the FyerX hiring assignment (steps 1–8).

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19, TypeScript)
- **Tailwind CSS 4** for styling
- **MongoDB** via **Mongoose 9**
- **Zod 4** for request validation
- **jose** for stateless JWT sessions, **bcryptjs** for password hashing

## Features

**Public**
- Browse active, upcoming events sorted nearest-first
- Combine text search, category filter, and city filter with pagination
- Loading skeletons, empty states, and error states with retry

**Signed-in users**
- Sign up / log in with secure HttpOnly session cookies
- Favourite event categories (`/preferences`)
- Personalised My Feed (`/feed`) limited to favourite categories
- "Remind me" toggle saved per event (survives refresh, safe under
  concurrent clicks)
- Event Card Designer: 3 themes (classic, vibrant, minimal), 5 stickers
  (star, heart, music, sparkles, party), max 3 stickers, with a live preview
  in a dialog opened from the "Customize card" action

**Admin**
- Separate admin login and protected dashboard (`/admin`)
- Create, edit, activate/deactivate events (inactive events are preserved,
  never deleted)
- Filter and search the catalogue, with pagination and summary counts

## Prerequisites

- Node.js 20+ and npm
- A MongoDB database (local `mongod` or MongoDB Atlas)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/community-events` |
| `JWT_SECRET` | Long random string used to sign session JWTs (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Email for the single admin account |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (see below) |

`.env.local` is gitignored — never commit it. `.env.example` is a safe template.

### 3. Create the admin password hash

Generate a bcrypt hash locally; the script escapes `$` characters as `\$`
because Next.js would otherwise treat them as variable references:

```bash
npm run hash:password -- "your-admin-password"
```

Copy the escaped hash it prints into `ADMIN_PASSWORD_HASH` in `.env.local`.
The plain password is never stored or committed.

### 4. Seed sample data

```bash
npm run db:seed
```

Seeds **15 sample events** across all 5 categories (Music, Workshop, Food,
Sports, Kids) and 15 Indian cities, with a deliberate mix of free and paid
prices, active and inactive statuses, and past and future dates so the
filtering behaviour is visible. The seed is idempotent (safe to re-run);
re-running it also refreshes the relative "upcoming" dates.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000. Sign in at `/admin/login` with the admin
credentials you configured.

Production build: `npm run build && npm start`. Lint with `npm run lint`.

## Demo Admin Login

There is deliberately **no published demo password** in this README. The single
admin account is configured entirely through environment variables in your
local `.env.local`, which is gitignored and never committed.

To configure the admin account for evaluation:

1. Pick the admin email in `.env.local`:
   `ADMIN_EMAIL=admin@example.com` (or your preferred address).
2. Generate a bcrypt hash of your own password (step 3 above):
   ```bash
   npm run hash:password -- "choose-a-strong-password"
   ```
3. Copy the escaped hash it prints into `ADMIN_PASSWORD_HASH` in `.env.local`.
4. Restart `npm run dev` and sign in at `/admin/login`.

The plaintext password is never stored, logged, or committed; only the bcrypt
hash lives in your local environment file.

## Pages

| Path | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Event listing with search, filters, pagination |
| `/signup`, `/login` | Public | User account creation and sign-in |
| `/preferences` | User | Favourite category selection |
| `/feed` | User | Personalised upcoming events |
| `/admin/login` | Public | Admin sign-in |
| `/admin` | Admin | Event management dashboard |

## API endpoints

All responses are JSON. Errors use `{ "error": string }` (validation errors
add `field` and `issues`).

### Public

| Method & path | Auth | Notes |
| --- | --- | --- |
| `GET /api/events` | None | Active + upcoming only, nearest first. Query: `category`, `city`, `search`, `page`, `limit` (max 24) |

### User (requires `ceb_user_session` cookie; otherwise 401)

| Method & path | Notes |
| --- | --- |
| `POST /api/auth/signup` | Create account `{ name, email, password }` |
| `POST /api/auth/login` | Sign in `{ email, password }` |
| `POST /api/auth/logout` | Clear session |
| `GET /api/auth/me` | Current user |
| `GET /api/favourites` | `{ favouriteCategories }` |
| `PUT /api/favourites` | Replace favourites `{ favouriteCategories: [...] }` |
| `GET /api/feed` | Personalised feed (empty list when no favourites) |
| `GET /api/events/[id]/reminder` | `{ enabled }` |
| `PUT /api/events/[id]/reminder` | `{ enabled: boolean }`, idempotent |
| `GET /api/events/[id]/design` | Saved design or default; viewing never creates a record |
| `PUT /api/events/[id]/design` | `{ theme, stickers[] }`, idempotent upsert |

### Admin (requires `ceb_admin_session` cookie; 401 without, 403 for users)

| Method & path | Notes |
| --- | --- |
| `POST /api/admin/login` | `{ email, password }` |
| `POST /api/admin/logout` | Clear admin session |
| `GET /api/admin/events` | List with summary; includes inactive |
| `POST /api/admin/events` | Create event |
| `PATCH /api/admin/events/[id]` | Update event |
| `PATCH /api/admin/events/[id]/status` | Activate / deactivate |

## Database

| Collection | Fields | Indexes |
| --- | --- | --- |
| `users` | name, email, passwordHash (bcrypt, `select: false`), favouriteCategories[] | unique `email` |
| `events` | title, category, city, dateTime, price, description, imageUrl, isActive, seedId | `category`, `city`, `isActive`, `dateTime`, compound `{isActive, dateTime}`; unique sparse `seedId` |
| `reminders` | userId, eventId | **unique compound `{userId, eventId}`** |
| `carddesigns` | userId, eventId, theme, stickers[] | **unique compound `{userId, eventId}`** |

**Filtering strategy.** Every public listing query is anchored on
`isActive: true` and `dateTime > now`, then narrowed by optional exact
category, an escaped case-insensitive regex on city, and an escaped
case-insensitive regex across title/description/city for text search.
Results sort by `dateTime` ascending with `_id` as a tiebreaker for stable
pagination. User input is regex-escaped to prevent ReDoS-style injection.

## Security

- Passwords hashed with bcrypt; plaintext never stored or logged.
- Sessions are stateless JWTs in cookies: `HttpOnly`, `SameSite=Lax`,
  `Secure` in production, 7-day user / 8-hour admin lifetimes.
- Admin routes derive the admin identity from the verified JWT only —
  role and user id are never trusted from the request body.
- Favourites, reminders, and card designs are keyed by the session user's
  id; one user can never read or modify another user's data.
- Unique compound indexes plus atomic upserts make reminder and design
  saves idempotent under concurrent requests.
- Deactivating an event sets `isActive: false`; the record is preserved.

## Technical Questions

**1. How is the database structured?**

Four collections: `users` (unique email, bcrypt hash, favouriteCategories),
`events` (title, category, city, dateTime, price, description, imageUrl,
isActive, seedId), plus `reminders` and `carddesigns` each holding
userId + eventId under a unique compound index. Per-user data lives in its own
collections keyed by userId — never on the event document — so users cannot
see or overwrite each other's reminders/designs, and atomic upserts keep saves
idempotent under concurrent clicks.

**2. How do filtering, sorting, pagination, and indexes work?**

Every public query is anchored on `isActive: true` and `dateTime > now`, then
narrowed by optional exact `category` and escaped case-insensitive regexes on
`city` and on title/description/city for text search — all combined with `$and`
so the filters compose. Results sort by `dateTime` ascending with `_id` as a
tiebreaker for stable pages; `page`/`limit` paginate (limit capped at 24).
Indexes: compound `{isActive, dateTime}` for the main listing, plus
single-field `category`, `city`, and `dateTime`.

**3. How are passwords and admin routes secured?**

Passwords are bcrypt-hashed; plaintext is never stored or returned. Sessions
are stateless HS256 JWTs (jose) in `HttpOnly`, `SameSite=Lax` cookies — 7-day
user lifetime, 8-hour admin lifetime. Every admin API calls `requireAdmin`,
which verifies the admin JWT's role claim server-side and returns 401/403; the
admin identity is never read from the request body, and the dashboard page
re-checks the cookie on the server before rendering.

## Known limitations

- **Reminders and designs are saved toggles only** — no emails, SMS, push
  notifications, or scheduled jobs (out of scope for the assignment).
- **No event detail pages**; cards show a "Details coming soon" placeholder.
- **Search is regex-based**, which is appropriate for the sample dataset
  scale but would need a text index for very large collections.
- **Dialogs** close via Escape, backdrop click, and explicit buttons, but
  do not trap Tab focus.
- **Visual QA was code-level only** — no browser automation was available in
  the build environment, so layouts were reviewed by inspecting the
  responsive Tailwind classes rather than by screenshots. All API behaviour
  was exercised over HTTP against a live server and real MongoDB.
- The seed uses relative dates (`now + N days`); re-run `npm run db:seed`
  if the sample events have aged past their dates.

## AI usage disclosure

This project was developed with AI assistance (OpenCode) across all steps:
scaffolding, feature implementation, test authoring, and documentation.
All code was written, reviewed, and verified by the developer with the AI;
tests were executed against a live local server and MongoDB instance.
