# Ephemeral — Backend

Go REST API for the Ephemeral photo social platform. Built with **Gin**, **Fx** (dependency injection), **PostgreSQL** (pgx/v5), and **JWT** authentication.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Code Structure](#code-structure)
3. [Configuration](#configuration)
4. [Database Migrations](#database-migrations)
5. [API Reference](#api-reference)
   - [Health](#health)
   - [Auth](#auth)
   - [Media](#media)
   - [Users](#users)
   - [Posts](#posts)
   - [Social](#social)
   - [Feed](#feed)
   - [Admin](#admin)

---

## Getting Started

**Prerequisites:** Go 1.23+, PostgreSQL 15+

```bash
# 1. Create and configure environment
cp config/.env.example config/.env
# Edit config/.env — set JWT_SECRET and DATABASE_URL

# 2. Run (migrations apply automatically on startup)
go run .
```

The server starts on `localhost:8080` by default.

---

## Code Structure

```
backend/
├── main.go                        # Fx wiring — wires config, repo, service, controller
├── config/
│   ├── config.go                  # Config struct, YAML + .env loading
│   ├── logger.go                  # Zap logger factory
│   ├── config.yaml                # App configuration
│   └── .env.example               # Required environment variables
├── database/
│   └── migrations/                # golang-migrate numbered SQL files (up + down)
│       ├── 000001_create_users.*
│       ├── 000002_create_user_profiles.*
│       ├── 000003_create_auth_identities.*
│       ├── 000004_create_password_credentials.*
│       ├── 000005_create_media_files.*
│       ├── 000006_create_posts.*
│       ├── 000007_create_post_media.*
│       ├── 000008_create_likes.*
│       └── 000009_create_follows.*
├── types/                         # Domain models and request/response DTOs
│   ├── user.go
│   ├── auth.go
│   ├── post.go
│   ├── media.go
│   ├── social.go
│   └── feed.go
└── internal/
    ├── repository/                # Data access layer
    │   ├── repository.go          # Repository interface (split into sub-interfaces by domain)
    │   ├── errors.go              # ErrNotFound, ErrConflict
    │   ├── postgres.go            # *Postgres struct, connection pool, migration runner
    │   ├── users.go               # User + UserProfile queries
    │   ├── auth.go                # AuthIdentity + PasswordCredentials queries
    │   ├── posts.go               # Post + PostMedia queries
    │   ├── media.go               # MediaFile queries
    │   ├── social.go              # Follow + Like queries
    │   ├── feed.go                # Feed query (CTE with priority ranking)
    │   └── admin.go               # Admin moderation queries
    ├── service/                   # Business logic layer
    │   ├── service.go             # *Service struct + Fx constructor
    │   ├── errors.go              # Service-level error sentinels
    │   ├── auth.go                # Register, Login, JWT issuance + parsing
    │   ├── users.go               # Profile read/update, follower/following lists
    │   ├── posts.go               # Create, get, delete posts; user post list
    │   ├── media.go               # Upload + serve media files
    │   ├── social.go              # Follow, unfollow, like, unlike
    │   ├── feed.go                # Paginated home feed with cursor
    │   └── admin.go               # User/post approval, trust flag management
    └── controller/                # HTTP layer (Gin handlers)
        ├── server.go              # *Controller struct, route registration, Fx lifecycle
        ├── middleware.go          # CORS, request logger, JWT auth, admin guard
        ├── helpers.go             # getClaims, parseUUIDParam, parsePageParams
        ├── auth.go                # POST /auth/register, POST /auth/login
        ├── users.go               # User profile handlers
        ├── posts.go               # Post CRUD + like handlers
        ├── media.go               # Media upload + serve handlers
        ├── social.go              # Follow/unfollow handlers
        ├── feed.go                # Feed handler
        └── admin.go               # Admin moderation handlers
```

### Layer responsibilities

| Layer | Package | Responsibility |
|-------|---------|---------------|
| Controller | `internal/controller` | Parse HTTP requests, validate input, map service errors to HTTP status codes |
| Service | `internal/service` | Business logic, orchestration, JWT, bcrypt |
| Repository | `internal/repository` | SQL queries against PostgreSQL; returns `ErrNotFound` / `ErrConflict` |

### Dependency injection (Fx)

`main.go` wires the app with `fx.Provide` and `fx.Invoke`:

```
ConfigPaths → Config → Logger
                           ↓
                      Repository (PostgreSQL — runs migrations on startup)
                           ↓
                        Service
                           ↓
                      controller.New (registers routes, starts HTTP server)
```

---

## Configuration

**`config/config.yaml`** — non-secret settings:

```yaml
name: Ephemeral API
development: true          # enables Gin debug mode and verbose logging

server:
  host: localhost
  port: 8080
  cors_origins:
    - "http://localhost:5173"

database:
  url: ""                  # overridden by DATABASE_URL env var
  max_conns: 20
  migrations_path: "database/migrations"

jwt:
  expiry_hours: 24
```

**`config/.env`** — secrets (never commit):

```
JWT_SECRET=<long random string>
DATABASE_URL=postgres://user:pass@localhost:5432/ephemeral?sslmode=disable
```

---

## Database Migrations

Migrations run automatically at startup via [golang-migrate](https://github.com/golang-migrate/migrate). Files live in `database/migrations/` and follow the `NNNNNN_<name>.(up|down).sql` naming convention.

To run migrations manually:

```bash
migrate -path database/migrations -database "$DATABASE_URL" up
migrate -path database/migrations -database "$DATABASE_URL" down
```

---

## API Reference

All authenticated endpoints require:
```
Authorization: Bearer <token>
```

Successful responses use `application/json`. Errors always return `{"error": "<message>"}`.

---

### Health

#### `GET /api/health`

No authentication required.

**Response `200`**
```json
{ "status": "ok" }
```

---

### Auth

#### `POST /api/auth/register`

Creates a new account in `pending` status. An admin must approve it before the user can log in.

**Request**
```json
{
  "username": "alice",
  "password": "s3cr3tpassword"
}
```

| Field | Rules |
|-------|-------|
| `username` | 3–30 chars, letters/digits/`_`/`-` only |
| `password` | minimum 8 characters |

**Response `201`**
```json
{
  "message": "registration successful, awaiting admin approval",
  "user": {
    "id": "uuid",
    "username": "alice",
    "status": "pending",
    "is_approved": false,
    "is_trusted": false,
    "is_admin": false,
    "created_at": "2026-04-21T10:00:00Z",
    "updated_at": "2026-04-21T10:00:00Z"
  }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| `400` | Validation failed |
| `409` | Username already taken |

---

#### `POST /api/auth/login`

**Request**
```json
{
  "username": "alice",
  "password": "s3cr3tpassword"
}
```

**Response `200`**
```json
{
  "token": "<jwt>",
  "user": { "id": "uuid", "username": "alice", "status": "active", ... }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| `400` | Validation failed |
| `401` | Invalid username or password |
| `403` | Account pending approval or disabled |

---

### Media

#### `GET /api/media/:id`

Serves a media file directly from the database. No authentication required so browsers can load images in `<img>` tags. Returns the raw bytes with the original `Content-Type` and a one-year `Cache-Control: immutable` header.

**Response `200`** — binary image data

**Errors**
| Status | Condition |
|--------|-----------|
| `400` | Invalid UUID |
| `404` | Media not found |

---

#### `POST /api/media` 🔒

Uploads an image. Use `multipart/form-data` with a field named `file`.

**Request** — `multipart/form-data`
```
file: <image file>
```

Accepted MIME types: any `image/*` (detected from file content if `Content-Type` header is absent). Maximum size: **20 MB**.

**Response `201`**
```json
{
  "id": "uuid",
  "url": "/api/media/uuid"
}
```

Use the returned `id` values when creating posts.

**Errors**
| Status | Condition |
|--------|-----------|
| `400` | No file provided |
| `415` | Not an image file |
| `500` | Storage failure |

---

### Users

#### `GET /api/users/me` 🔒

Returns the authenticated user's full profile.

**Response `200`**
```json
{
  "id": "uuid",
  "username": "alice",
  "display_name": "Alice",
  "bio": "Photography enthusiast",
  "profile_picture_url": "/api/media/uuid",
  "background_picture_url": "/api/media/uuid",
  "follower_count": 42,
  "following_count": 17,
  "post_count": 8,
  "created_at": "2026-04-21T10:00:00Z"
}
```

---

#### `PATCH /api/users/me` 🔒

Updates the authenticated user's profile. All fields are optional; omit fields you don't want to change.

**Request**
```json
{
  "display_name": "Alice",
  "bio": "Photography enthusiast",
  "profile_picture_url": "/api/media/uuid",
  "background_picture_url": "/api/media/uuid"
}
```

| Field | Rules |
|-------|-------|
| `display_name` | max 64 chars |
| `bio` | max 300 chars |
| `profile_picture_url` | URL returned by `POST /api/media` |
| `background_picture_url` | URL returned by `POST /api/media` |

**Response `200`** — updated profile (same shape as `GET /api/users/me`)

---

#### `GET /api/users/:username` 🔒

Returns a public profile. Includes `is_following` indicating whether the authenticated user follows this account.

**Response `200`**
```json
{
  "id": "uuid",
  "username": "bob",
  "display_name": "Bob",
  "bio": "...",
  "profile_picture_url": "/api/media/uuid",
  "background_picture_url": "/api/media/uuid",
  "follower_count": 10,
  "following_count": 5,
  "post_count": 3,
  "is_following": false,
  "created_at": "2026-04-21T10:00:00Z"
}
```

**Errors** — `404` if user not found

---

#### `GET /api/users/:username/followers` 🔒

**Query params:** `limit` (default 20, max 100), `offset` (default 0)

**Response `200`**
```json
{
  "users": [ { "id": "uuid", "username": "...", ... } ]
}
```

---

#### `GET /api/users/:username/following` 🔒

Same shape as `/followers`.

---

#### `GET /api/users/:username/posts` 🔒

Returns approved posts by the user, newest first.

**Query params:** `limit` (default 20, max 100)

**Response `200`**
```json
{
  "posts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "Golden Gate at dusk",
      "city": "San Francisco",
      "country": "United States",
      "latitude": 37.8199,
      "longitude": -122.4783,
      "status": "approved",
      "created_at": "2026-04-21T10:00:00Z",
      "updated_at": "2026-04-21T10:00:00Z",
      "media": [
        { "id": "uuid", "post_id": "uuid", "url": "/api/media/uuid", "position": 0, "created_at": "..." }
      ]
    }
  ]
}
```

---

### Posts

#### `POST /api/posts` 🔒

Creates a post. Posts from **trusted** accounts are published immediately (`approved`); all others enter a `pending` moderation queue.

**Request**
```json
{
  "city": "Paris",
  "country": "France",
  "description": "Quiet side street in Montmartre",
  "latitude": 48.8867,
  "longitude": 2.3431,
  "media_ids": ["uuid1", "uuid2"]
}
```

| Field | Rules |
|-------|-------|
| `city` | required |
| `country` | required |
| `description` | optional, free text |
| `latitude` | optional, −90 to 90 |
| `longitude` | optional, −180 to 180 |
| `media_ids` | required, 1–10 UUIDs returned by `POST /api/media` |

**Response `201`** — created post (same shape as in `/users/:username/posts`)

**Errors**
| Status | Condition |
|--------|-----------|
| `400` | Validation failed or invalid media UUID |

---

#### `GET /api/posts/:id` 🔒

**Response `200`** — single post with `media` array

**Errors** — `404` if not found

---

#### `DELETE /api/posts/:id` 🔒

Deletes the authenticated user's own post.

**Response `204`** — no content

**Errors**
| Status | Condition |
|--------|-----------|
| `403` | Post belongs to another user |
| `404` | Post not found |

---

#### `POST /api/posts/:id/like` 🔒

**Response `204`** — no content

**Errors** — `409` if already liked

---

#### `DELETE /api/posts/:id/like` 🔒

**Response `204`** — no content

**Errors** — `404` if like not found

---

### Social

#### `POST /api/users/:username/follow` 🔒

**Response `204`** — no content

**Errors**
| Status | Condition |
|--------|-----------|
| `404` | User not found |
| `409` | Already following |

---

#### `DELETE /api/users/:username/follow` 🔒

**Response `204`** — no content

**Errors** — `404` if not following

---

### Feed

#### `GET /api/feed` 🔒

Returns a paginated home feed. Posts from followed accounts appear first (priority 1), then posts from everyone else (priority 2). Within each group, newest first.

**Query params**

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 20 | Items per page (max 50) |
| `cursor` | — | Opaque cursor from previous response |

**Response `200`**
```json
{
  "posts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "...",
      "city": "Tokyo",
      "country": "Japan",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "status": "approved",
      "created_at": "2026-04-21T10:00:00Z",
      "updated_at": "2026-04-21T10:00:00Z",
      "media": [ { "url": "/api/media/uuid", "position": 0, ... } ],
      "author_username": "bob",
      "author_display_name": "Bob",
      "author_picture_url": "/api/media/uuid",
      "like_count": 14,
      "is_liked": false
    }
  ],
  "next_cursor": "<opaque base64 string>",
  "has_more": true
}
```

Pass `next_cursor` as the `cursor` query parameter to fetch the next page. When `has_more` is `false` there are no more results.

---

### Admin

All admin endpoints require the authenticated user to have `is_admin = true`. Returns `403` otherwise.

---

#### `GET /api/admin/users/pending` 🔒🛡

Lists users awaiting approval.

**Query params:** `limit` (default 20, max 100), `offset` (default 0)

**Response `200`**
```json
{ "users": [ { "id": "uuid", "username": "...", "status": "pending", ... } ] }
```

---

#### `POST /api/admin/users/:id/approve` 🔒🛡

Sets `status = active` and `is_approved = true`.

**Response `204`** — no content

**Errors** — `404` if user not found or not pending

---

#### `POST /api/admin/users/:id/reject` 🔒🛡

Sets `status = disabled`.

**Response `204`** — no content

**Errors** — `404` if user not found or not pending

---

#### `POST /api/admin/users/:id/trust` 🔒🛡

Grants the trusted flag — future posts from this account are published immediately without moderation.

**Response `204`** — no content

**Errors** — `404` if user not found

---

#### `DELETE /api/admin/users/:id/trust` 🔒🛡

Revokes the trusted flag.

**Response `204`** — no content

**Errors** — `404` if user not found

---

#### `GET /api/admin/posts/pending` 🔒🛡

Lists posts awaiting moderation.

**Query params:** `limit` (default 20, max 100), `offset` (default 0)

**Response `200`**
```json
{ "posts": [ { "id": "uuid", "status": "pending", "media": [...], ... } ] }
```

---

#### `POST /api/admin/posts/:id/approve` 🔒🛡

Sets `status = approved`, making the post visible in feeds and profiles.

**Response `204`** — no content

**Errors** — `404` if post not found or not pending

---

#### `POST /api/admin/posts/:id/reject` 🔒🛡

Sets `status = rejected`.

**Response `204`** — no content

**Errors** — `404` if post not found or not pending
