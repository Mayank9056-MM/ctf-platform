# CTF Platform — Backend Documentation

> Production-grade Node.js + TypeScript + MongoDB backend for a Capture The Flag competition platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Variables](#5-environment-variables)
6. [API Reference](#6-api-reference)
   - [Auth](#61-auth)
   - [Users](#62-users)
   - [Teams](#63-teams)
   - [Challenges](#64-challenges)
   - [Submissions](#65-submissions)
   - [Events](#66-events)
   - [Leaderboard](#67-leaderboard)
   - [Notifications](#68-notifications)
   - [Announcements](#69-announcements)
   - [Stories](#610-stories)
   - [Refresh Tokens / Sessions](#611-refresh-tokens--sessions)
   - [Admin](#612-admin)
7. [Authentication Flow](#7-authentication-flow)
8. [Module Architecture](#8-module-architecture)
9. [Database Models](#9-database-models)
10. [Security](#10-security)
11. [Error Handling](#11-error-handling)
12. [Real-time (Socket.io + Redis)](#12-real-time-socketio--redis)
13. [Deployment](#13-deployment)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js Frontend  →  axios (httpOnly cookies)                   │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼────────────────────────────────────┐
│                    Express.js Server                             │
│                                                                  │
│  Global Middleware                                               │
│   helmet · cors · hpp · rate-limiter · compression · morgan      │
│                                                                  │
│  /api/v1/*  ──────────────────────────────────────────────────   │
│   auth · users · teams · challenges · submissions · events       │
│   leaderboard · notifications · announcements · stories          │
│   refreshToken · admin                                           │
│                                                                  │
│  Per-Route Middleware                                            │
│   verifyAuth · requireRole · requiredVerified                    │
│   optionalAuth · zodValidation · avatarUpload                    │
└──────┬───────────────────────────────┬────────────────────────┬──┘
       │                               │                        │
┌──────▼──────┐              ┌─────────▼──────┐      ┌─────────▼──┐
│  MongoDB    │              │  Redis          │      │  Socket.io  │
│             │              │  • Rate limit   │      │  • Rooms    │
│  Mongoose   │              │  • Session      │      │  • Events   │
│  Models     │              │  • Leaderboard  │      │  (optional) │
└─────────────┘              └─────────────────┘      └────────────┘
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express.js 5 |
| Database | MongoDB 7 + Mongoose 8 |
| Cache / Pub-Sub | Redis 7 |
| Authentication | JWT (access + refresh token rotation) |
| Password hashing | bcryptjs |
| Validation | Zod |
| File upload | Multer + Cloudinary |
| Email | Nodemailer / SMTP |
| Logging | Winston + Morgan |
| Real-time | Socket.io + @socket.io/redis-adapter |
| Security | Helmet, HPP, express-rate-limit |

---

## 3. Project Structure

```
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── jest.config.mjs
├── package.json
├── package-lock.json
├── public
│   ├── temp
│   └── uploads
├── README.md
├── scripts
│   └── createSuperAdmin.ts
├── src
│   ├── config
│   │   ├── config.ts      typed env config
│   │   ├── imageFlag.ts
│   │   ├── r2.upload.ts
│   │   └── redis.ts       Redis client singleton
│   ├── db
│   │   └── index.ts       MongoDB connect + status
│   ├── index.ts
│   ├── jobs
│   ├── middlewares
│   │   ├── attachmentUpload.middleware.ts
│   │   ├── avatarUpload.middleware.ts    multer (memory storage)
│   │   ├── ratelimit.middleware.ts       global rate limiter
│   │   └── verifyAuth.middleware.ts      JWT guard + role guard
│   ├── models
│   │   ├── anouncement.model.ts
│   │   ├── auditlog.model.ts
│   │   ├── challenge.model.ts
│   │   ├── event.model.ts
│   │   ├── leaderboard.model.ts
│   │   ├── notification.model.ts
│   │   ├── refreshToken.model.ts
│   │   ├── story.model.ts
│   │   ├── submission.model.ts
│   │   ├── team.model.ts
│   │   ├── user.model.ts
│   │   └── userProgressStory.model.ts
│   ├── modules
│   │   ├── admin
│   │   │   ├── admin.controllers.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.types.ts
│   │   │   └── admin.validators.ts
│   │   ├── announcement/        (same structure per module)
│   │   ├── auth/
│   │   ├── challenges/
│   │   ├── events/
│   │   ├── leaderboard/
│   │   ├── notification/
│   │   ├── oauth
│   │   │   ├── github.verify.ts
│   │   │   └── google.verify.ts
│   │   ├── refreshToken/
│   │   ├── story/
│   │   ├── submissions/
│   │   ├── teams/
│   │   └── users/
│   ├── server.ts
│   ├── services
│   │   ├── cacheService.ts
│   │   ├── emailService.ts
│   │   └── socketService.ts
│   ├── tests
│   │   ├── integration
│   │   │   └── auth.api.test.ts
│   │   ├── setup.ts
│   │   └── unit
│   │       └── auth.service.test.ts
│   ├── types
│   │   ├── api.ts
│   │   └── express.d.ts
│   └── utils
│       ├── ApiError.ts
│       ├── ApiResponse.ts
│       ├── asyncHandler.ts
│       ├── cloudinary.ts
│       ├── constants.ts
│       ├── helpers.ts
│       ├── logger.ts
│       └── validations.ts
└── tsconfig.json
```

---

## 4. Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7 (replica set — required for transactions)
- Redis 7

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

### Run (production)

```bash
npm run build
npm start
```

### MongoDB replica set (local development)

Transactions require a replica set. Convert your local mongod:

```bash
# mongod.conf
replication:
  replSetName: "rs0"
```

```js
// Once started in mongosh:
rs.initiate()
```

---

## 5. Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Cors
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ctf?replicaSet=rs0

# JWT
ACCESS_TOKEN_SECRET =superlongaccesstokensecretkeythatismorethan32characters
ACCESS_TOKEN_EXPIRY =15m
REFRESH_TOKEN_SECRET =superlongrefreshtokensecretkeythatismorethan32characters
REFRESH_TOKEN_EXPIRY =7d

# Redis
REDIS_URL=redis://localhost:6379

# Bcrypt
BCRYPT_ROUNDS=12

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Cloudinary
CLOUDINARY_CLOUD_NAME =
CLOUDINARY_API_KEY =
CLOUDINARY_API_SECRET =

# Email (SMTP)
SMTP_PORT =587
SMTP_HOST =
SMTP_USER =""
SMTP_PASS =""

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/dashboard

# AWS S2
AWS_REGION =ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_S3_PUBLIC_DOMAIN=

# Super Admin
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

---

## 6. API Reference

**Base URL:** `http://localhost:4000/api/v1`

**Auth:** All protected routes require an `accessToken` httpOnly cookie. Cookies are set automatically by the auth endpoints. The frontend sends them via `withCredentials: true` on every axios request.

**Response envelope:**
```json
{
  "statusCode": 200,
  "data": { },
  "message": "Success"
}
```

**Error envelope:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

### 6.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register with email + password |
| `POST` | `/auth/login` | ❌ | Login — sets `accessToken` + `refreshToken` cookies |
| `POST` | `/auth/logout` | ✅ | Logout — clears cookies, revokes refresh token |
| `POST` | `/auth/forgot-password` | ❌ | Send reset email |
| `POST` | `/auth/reset-password/:token` | ❌ | Reset password with token |
| `GET` | `/auth/verify-email/:token` | ❌ | Verify email address |
| `POST` | `/auth/resend-verification` | ✅ | Resend verification email |
| `GET` | `/auth/google` | ❌ | Google OAuth initiation |
| `GET` | `/auth/google/callback` | ❌ | Google OAuth callback |
| `GET` | `/auth/github` | ❌ | GitHub OAuth initiation |
| `GET` | `/auth/github/callback` | ❌ | GitHub OAuth callback |

**POST `/auth/register`**
```json
{
  "email": "player@example.com",
  "password": "SecurePass123!",
  "username": "h4cker"          // optional — auto-generated if omitted
}
```

**POST `/auth/login`**
```json
{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```
Response sets two httpOnly cookies: `accessToken` (15 min) and `refreshToken` (7 days).

---

### 6.2 Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/user/current-user` | ✅ | Get own profile |
| `PATCH` | `/user/update-account` | ✅ | Update name, bio, country, username |
| `PATCH` | `/user/update-avatar` | ✅ | Upload new avatar (multipart) |

**PATCH `/user/update-account`**
```json
{
  "username": "new_handle",
  "fullName": "Alice Smith",
  "bio": "CTF enthusiast",
  "country": "IN"
}
```

**PATCH `/user/update-avatar`** — `multipart/form-data`, field name: `avatar`

---

### 6.3 Teams

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/team/get-team/:id` | ❌ | Public team profile |
| `GET` | `/team/search` | ❌ | Search public teams |
| `POST` | `/team/search` | ❌ | Search (body variant) |
| `POST` | `/team/` | ✅ | Create team |
| `GET` | `/team/my` | ✅ | Get my team (includes invites + join code) |
| `PATCH` | `/team/:id` | ✅ Owner | Update team settings |
| `POST` | `/team/join` | ✅ | Join by join code |
| `POST` | `/team/leave` | ✅ | Leave current team |
| `POST` | `/team/:id/join-code` | ✅ Owner | Generate/refresh join code |
| `POST` | `/team/:id/invite` | ✅ Owner | Invite user by username |
| `POST` | `/team/:id/accept-invite` | ✅ | Accept pending invite |
| `POST` | `/team/:id/decline-invite` | ✅ | Decline pending invite |
| `DELETE` | `/team/:id/members/:userId` | ✅ Owner | Kick member |
| `DELETE` | `/team/:id/disband` | ✅ Admin | Disband team |

**POST `/team/`**
```json
{
  "name": "ByteBandits",
  "description": "We pwn things",
  "isPrivate": false,
  "country": "US"
}
```

**GET `/team/search`** — Query params: `q`, `country`, `page`, `limit`, `sortBy` (score|memberCount|createdAt), `sortOrder` (asc|desc)

> **Note:** All multi-document team operations (create, join, accept invite, leave, kick, disband) use MongoDB `session.withTransaction()` to guarantee atomicity.

---

### 6.4 Challenges

#### Player routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/challenges/` | ✅ | List visible challenges (filtered + paginated) |
| `GET` | `/challenges/:idOrSlug` | ✅ | Challenge detail (hints masked unless purchased) |
| `POST` | `/challenges/:id/hints` | ✅ Verified | Purchase a hint |
| `GET` | `/challenges/:id/solves` | ❌ | Public solve leaderboard |

**GET `/challenges/`** — Query params: `category`, `difficulty`, `tags` (comma-separated), `search`, `page`, `limit`, `sortBy`, `sortOrder`

**POST `/challenges/:id/hints`**
```json
{ "hintIndex": 0 }
```

#### Admin routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/challenges/admin` | ✅ Admin | All challenges (including drafts) |
| `POST` | `/challenges/admin` | ✅ Admin | Create challenge |
| `GET` | `/challenges/admin/stats` | ✅ Admin | Stats by category + totals |
| `PATCH` | `/challenges/admin/:id` | ✅ Admin | Update challenge |
| `DELETE` | `/challenges/admin/:id` | ✅ Admin | Delete challenge |
| `PATCH` | `/challenges/admin/:id/publish` | ✅ Admin | Publish (make visible) |
| `PATCH` | `/challenges/admin/:id/unpublish` | ✅ Admin | Hide from players |
| `POST` | `/challenges/admin/:id/hints` | ✅ Admin | Add hint |
| `DELETE` | `/challenges/admin/:id/hints/:hintIndex` | ✅ Admin | Remove hint |
| `POST` | `/challenges/admin/:id/attachments` | ✅ Admin | Upload file attachment |
| `DELETE` | `/challenges/admin/:id/attachments/:attachmentId` | ✅ Admin | Remove attachment |
| `GET` | `/challenges/admin/:id/submissions` | ✅ Admin | Submission log for challenge |

**POST `/challenges/admin`**
```json
{
  "title": "SQL Injection 101",
  "description": "Find the flag in the database...",
  "category": "web",
  "difficulty": "easy",
  "points": 500,
  "flag": "CTF{s0m3_fl4g}",
  "scoringType": "dynamic",
  "minPoints": 100,
  "isCaseSensitive": true,
  "tags": ["sqli", "web"],
  "isHosted": false
}
```

---

### 6.5 Submissions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/submission/challenges/:challengeId/submit` | ✅ Verified | Submit a flag |
| `GET` | `/submission/submissions/me` | ✅ | Own submission history |
| `GET` | `/submission/submissions/me/stats` | ✅ | Own stats (rank, streak, score…) |
| `GET` | `/submission/challenges/:challengeId/history` | ✅ | Own attempts for one challenge |
| `GET` | `/submission/challenges/:challengeId/solves` | ❌ | Public solve board |
| `GET` | `/submission/admin/submissions` | ✅ Admin | Platform-wide log |
| `GET` | `/submission/admin/submissions/stats` | ✅ Admin | Aggregate analytics |
| `GET` | `/submission/admin/submissions/:submissionId` | ✅ Admin | Single submission detail |
| `DELETE` | `/submission/admin/submissions/:submissionId` | ✅ Superadmin | Delete + reverse points |
| `GET` | `/submission/admin/users/:userId/submissions` | ✅ Admin | All submissions for a user |

**POST `/submission/challenges/:challengeId/submit`**
```json
{ "flag": "CTF{your_flag_here}" }
```

Returns `200` on correct, `400` on incorrect.

```json
{
  "isCorrect": true,
  "pointsAwarded": 347,
  "isFirstBlood": false,
  "newScore": 1250,
  "message": "Correct flag! +347 points"
}
```

**Rate limit:** 5 wrong attempts per challenge per minute. Enforced at service layer via Redis (falls back to MongoDB count if Redis unavailable).

**GET `/submission/submissions/me/stats`** response:
```json
{
  "total": 42,
  "correct": 18,
  "incorrect": 24,
  "firstBloods": 3,
  "totalPointsEarned": 4800,
  "averageAttemptsPerSolve": 1.8,
  "solveRate": 42.86,
  "recentActivity": [{ "date": "2025-03-30", "count": 7 }],
  "rank": 14,
  "streak": 5,
  "challengesSolved": 18
}
```

---

### 6.6 Events

#### Player routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/event/` | Optional | Public event list |
| `GET` | `/event/:idOrSlug` | Optional | Event detail (isRegistered annotated) |
| `POST` | `/event/:id/register` | ✅ | Register for event |
| `GET` | `/event/:id/leaderboard` | ❌ | Event leaderboard (respects freeze) |
| `GET` | `/event/:id/stats` | ❌ | Event aggregate stats |

#### Admin routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/event/admin` | ✅ Admin | All events (including drafts) |
| `POST` | `/event/admin` | ✅ Admin | Create event |
| `POST` | `/event/admin/auto-transition` | ✅ Superadmin | Manually trigger cron |
| `PATCH` | `/event/admin/:id` | ✅ Admin | Update event |
| `DELETE` | `/event/admin/:id` | ✅ Superadmin | Hard delete |
| `POST` | `/event/admin/:id/transition` | ✅ Admin | Transition status |
| `POST` | `/event/admin/:id/scoreboard/freeze` | ✅ Admin | Freeze/unfreeze scoreboard |
| `POST` | `/event/admin/:id/challenges` | ✅ Admin | Add challenges |
| `DELETE` | `/event/admin/:id/challenges` | ✅ Admin | Remove challenges |

**Event status machine:**
```
draft → scheduled → active → paused → ended → archived
         └──────────────────────────────────────┘ (archived from any)
```

**POST `/event/admin/:id/transition`**
```json
{ "status": "active" }
```

**POST `/event/admin/:id/scoreboard/freeze`**
```json
{ "frozen": true }
```

---

### 6.7 Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/leaderboard/leaderboard` | Optional | Pre-computed snapshot |
| `GET` | `/leaderboard/leaderboard/me` | ✅ | Own rank (even if outside top-500) |
| `POST` | `/leaderboard/admin/leaderboard/recompute` | ✅ Superadmin | Force recompute |

**GET `/leaderboard/leaderboard`** — Query params:

| Param | Values | Default |
|---|---|---|
| `scope` | `global_user`, `global_team`, `event_user`, `event_team` | `global_user` |
| `eventId` | ObjectId | — (required for event scopes) |
| `page` | integer ≥ 1 | `1` |
| `limit` | 1–200 | `50` |

Response:
```json
{
  "scope": "global_user",
  "isFrozen": false,
  "isStale": false,
  "computedAt": "2025-04-01T14:22:00.000Z",
  "ageSeconds": 37,
  "entries": [
    {
      "rank": 1,
      "entityId": "...",
      "username": "h4cker",
      "score": 9800,
      "solveCount": 32,
      "firstBloods": 7
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 1240, "totalPages": 25 },
  "myEntry": { "rank": 14, "score": 4800 }
}
```

> Leaderboard reads are **O(1)** — served from a pre-computed MongoDB snapshot. Scores are recomputed by a cron job every 5 minutes, or immediately on admin trigger. `isStale: true` means new solves have landed since the last compute.

---

### 6.8 Notifications

#### Player routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notification/summary` | ✅ | Bell badge (unread count + last 5 previews) |
| `GET` | `/notification/` | ✅ | Full inbox (personal + broadcasts) |
| `PATCH` | `/notification/read` | ✅ | Mark specific or all as read |
| `DELETE` | `/notification/` | ✅ | Clear inbox (personal only) |
| `GET` | `/notification/:id` | ✅ | Single notification |
| `POST` | `/notification/:id/dismiss` | ✅ | Dismiss a broadcast |
| `DELETE` | `/notification/:id` | ✅ | Soft-delete personal notification |

#### Admin routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/notification/admin/dispatch` | ✅ Admin | Send notification |
| `GET` | `/notification/admin` | ✅ Admin | All notifications log |
| `GET` | `/notification/admin/stats` | ✅ Admin | Aggregate stats |
| `GET` | `/notification/admin/:id` | ✅ Admin | Single notification (admin view) |
| `PATCH` | `/notification/admin/:id/read` | ✅ Admin | Mark read on behalf of user |
| `DELETE` | `/notification/admin/:id` | ✅ Superadmin | Hard delete |

**PATCH `/notification/read`**
```json
{ "notificationIds": ["id1", "id2"] }   // omit to mark ALL as read
```

**Notification types:** `submission_correct`, `submission_first_blood`, `team_invite_received`, `team_invite_accepted`, `team_invite_declined`, `team_member_left`, `team_challenge_solved`, `account_score_updated`, `account_banned`, `account_unbanned`, `account_email_verified`, `admin_announcement`, `event_starting_soon`, `event_ended`

---

### 6.9 Announcements

#### Player routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/announcement/` | Optional | Feed (filtered by audience, expiry, dismissal) |
| `GET` | `/announcement/challenge/:challengeId` | ❌ | Challenge-scoped announcements |
| `POST` | `/announcement/:id/dismiss` | ✅ | Dismiss from feed |

#### Admin routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/announcement/admin` | ✅ Admin | All announcements |
| `GET` | `/announcement/admin/stats` | ✅ Admin | Aggregate stats |
| `POST` | `/announcement/admin` | ✅ Admin | Create announcement |
| `POST` | `/announcement/admin/dispatch-queue` | ✅ Superadmin | Process missed dispatches |
| `GET` | `/announcement/admin/:id` | ✅ Admin | Single announcement (admin view) |
| `PATCH` | `/announcement/admin/:id` | ✅ Admin | Update draft |
| `POST` | `/announcement/admin/:id/publish` | ✅ Admin | Publish + dispatch notifications |
| `POST` | `/announcement/admin/:id/retract` | ✅ Admin | Retract (hide without deleting) |
| `DELETE` | `/announcement/admin/:id` | ✅ Superadmin | Hard delete |

**POST `/announcement/admin`**
```json
{
  "title": "Scoreboard frozen for final hour",
  "body": "The scoreboard is now frozen...",
  "severity": "warning",
  "audience": "all",
  "publishImmediately": true,
  "expiresAt": "2025-04-01T20:00:00.000Z"
}
```

**Severity levels:** `info`, `success`, `warning`, `critical`
**Audience values:** `all`, `teams`, `solo`, `specific`

---

### 6.10 Stories

#### Player routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/story/` | Optional | List published stories |
| `GET` | `/story/:idOrSlug` | Optional | Story detail |
| `POST` | `/story/:id/start` | ✅ | Begin a story |
| `GET` | `/story/:id/progress` | ✅ | Own progress |
| `GET` | `/story/:id/leaderboard` | ❌ | Story completion board |
| `POST` | `/story/:id/chapters/:chapterId/nodes/:nodeId/advance` | ✅ | Advance cutscene/briefing node |
| `POST` | `/story/:id/chapters/:chapterId/nodes/:nodeId/choose` | ✅ | Make a choice at a choice node |

#### Admin routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/story/admin` | ✅ Admin | Create story |
| `PATCH` | `/story/admin/:id` | ✅ Admin | Update story |
| `PATCH` | `/story/admin/:id/status` | ✅ Admin | Set status (draft/published/archived) |
| `DELETE` | `/story/admin/:id` | ✅ Admin | Delete story |
| `POST` | `/story/admin/:id/chapters` | ✅ Admin | Create chapter |
| `PATCH` | `/story/admin/:id/chapters/:chapterId` | ✅ Admin | Update chapter |
| `DELETE` | `/story/admin/:id/chapters/:chapterId` | ✅ Admin | Delete chapter |
| `GET` | `/story/admin/:id/chapters/:chapterId/validate` | ✅ Admin | Dry-run graph validation |
| `POST` | `/story/admin/:id/chapters/:chapterId/publish` | ✅ Admin | Validate + publish chapter |
| `POST` | `/story/admin/:id/chapters/:chapterId/nodes` | ✅ Admin | Create node |
| `PATCH` | `/story/admin/:id/chapters/:chapterId/nodes/:nodeId` | ✅ Admin | Update node |
| `DELETE` | `/story/admin/:id/chapters/:chapterId/nodes/:nodeId` | ✅ Admin | Delete node |

Stories are **graph-based**. Each chapter is a directed graph of nodes connected by choices. The graph validator enforces 9 rules (no orphaned nodes, valid entry point, no circular mandatory paths, etc.) before publish.

---

### 6.11 Refresh Tokens / Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/refresh-token/auth/refresh` | ❌ (cookie) | Rotate refresh token → new access token |
| `GET` | `/refresh-token/auth/sessions` | ✅ | List all active sessions |
| `DELETE` | `/refresh-token/auth/sessions` | ✅ | Revoke ALL sessions (logout everywhere) |
| `DELETE` | `/refresh-token/auth/sessions/:sessionId` | ✅ | Revoke one session by `_id` |

**POST `/refresh-token/auth/refresh`** — No body. The `refreshToken` httpOnly cookie is sent automatically. Returns a new `accessToken` cookie and response body:
```json
{ "accessToken": "eyJ..." }
```

**Token family security:** Every token chain shares a `family` UUID. If an already-rotated token is presented (replay attack / stolen token), the entire family is revoked immediately and a `401` is returned. All the user's sessions are invalidated.

**GET `/refresh-token/auth/sessions`** response:
```json
{
  "sessions": [
    {
      "_id": "...",
      "userAgent": "Mozilla/5.0 (Macintosh...)",
      "ipAddress": "1.2.3.4",
      "createdAt": "2025-03-28T10:00:00.000Z",
      "expiresAt": "2025-04-04T10:00:00.000Z",
      "isCurrent": true
    }
  ],
  "count": 3
}
```

---

### 6.12 Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | ✅ Admin | Aggregate dashboard stats (19 parallel queries) |
| `GET` | `/admin/users` | ✅ Admin | Paginated user list |
| `GET` | `/admin/users/:id` | ✅ Admin | User detail |
| `PATCH` | `/admin/users/:id/ban` | ✅ Admin | Ban user |
| `PATCH` | `/admin/users/:id/unban` | ✅ Admin | Unban user |
| `PATCH` | `/admin/users/:id/role` | ✅ Superadmin | Change role |
| `DELETE` | `/admin/users/:id` | ✅ Superadmin | Soft delete (PII anonymised) |
| `PATCH` | `/admin/users/:id/score` | ✅ Admin | Manual score adjustment |
| `POST` | `/admin/scores/recalculate` | ✅ Superadmin | Recalculate all scores |
| `GET` | `/admin/audit-log` | ✅ Admin | Audit log viewer |

---

## 7. Authentication Flow

```
Login
  │
  ▼ POST /auth/login
  ├─► Validate credentials
  ├─► Generate accessToken (JWT, 15 min)
  ├─► Create RefreshToken document (SHA-256 hash stored, raw token sent)
  ├─► Set httpOnly cookies: accessToken + refreshToken
  └─► Return user object

Normal request (token valid)
  │
  ▼ verifyAuth middleware reads accessToken cookie
  └─► Attach req.user → proceed

Normal request (token expired)
  │
  ▼ Backend returns 401
  │
  ▼ axios interceptor catches 401
  ├─► POST /refresh-token/auth/refresh (queues concurrent requests)
  ├─► Token rotated → new refreshToken cookie set
  └─► Original request retried automatically

Refresh token reused (stolen / replay)
  │
  ▼ refreshTokenService.rotate() detects isRevoked = true
  ├─► Revoke entire token family (revokeFamily())
  └─► Return 401 → user redirected to login

Logout
  │
  ▼ POST /auth/logout
  ├─► revokeByRaw(rawToken) — marks token revoked in DB
  ├─► Clear cookies
  └─► User state cleared on frontend
```

---

## 8. Module Architecture

Every module follows the same pattern:

```
module/
  ├── module.routes.ts    ← express.Router() — routes only, no logic
  ├── module.controller.ts← asyncHandler wrappers — call service, return response
  ├── module.service.ts   ← all business logic, DB operations, transactions
  ├── module.validators.ts← Zod schemas for request validation
  └── module.type.ts      ← TypeScript types for the module
```

**Controller responsibility:** Parse + validate input → call service → format response. Never contains business logic.

**Service responsibility:** All business logic, database operations, cross-module calls. All multi-document writes use `session.withTransaction()`.

**Validator responsibility:** Zod schemas. The `parseBody(schema, data)` helper from `utils/helpers.ts` throws a `400 ApiError` on validation failure with field-level errors.

---

## 9. Database Models

| Model | Key fields | Notes |
|---|---|---|
| `User` | username, email, password(select:false), role, score, teamId, solvedChallenges | Password hashed with bcrypt pre-save. Tokens generated via methods. |
| `Team` | name, owner, members[], invites[], score, joinCode, isActive | All member mutations use MongoDB transactions |
| `Challenge` | title, flag(SHA-256), points, scoringType, hints[], attachments[], firstBlood | Dynamic scoring: exponential decay. Flag never stored plaintext. |
| `Submission` | user, challenge, flagHash(select:false), isCorrect, pointsAwarded, isFirstBlood | Unique partial index prevents double-solve per user + per team |
| `Event` | name, status, format, scoring, registration, challenges[], organizers[] | Forward-only status machine enforced by model |
| `Notification` | recipient(null=broadcast), type, channels[], dismissedBy[], expiresAt(TTL) | TTL index auto-deletes expired documents |
| `Announcement` | title, body, severity, audience, isPublished, isRetracted | Draft → Published → Retracted lifecycle |
| `RefreshToken` | userId, tokenHash(select:false), family, isRevoked, expiresAt(TTL) | TTL auto-deletes. Family enables reuse detection. |
| `Leaderboard` | scope, eventId, entries[], totalCount, isFrozen, isStale, computedAt | Pre-computed snapshot for O(1) reads |
| `AuditLog` | action, outcome, actor, target, diff, metadata, expiresAt(TTL 90 days) | Immutable. Never updated, only created. |

---

## 10. Security

### Middleware stack (applied globally)

| Middleware | Purpose |
|---|---|
| `helmet()` | Sets security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `hpp()` | HTTP Parameter Pollution prevention |
| `rateLimiter` | Global rate limit (configurable, applied to all routes) |
| `cors()` | Origin whitelist via `CORS_ORIGIN` env variable |
| `express.json({ limit: "16kb" })` | Payload size cap |
| `cookieParser()` | Parse httpOnly cookies |
| `compression()` | gzip response compression |

### Auth guards

| Middleware | What it does |
|---|---|
| `verifyAuth` | Validates `accessToken` JWT. Sets `req.user`. |
| `requireRole("admin", "superadmin")` | Checks `req.user.role`. 403 if insufficient. |
| `requiredVerified` | Checks `req.user.isVerified`. Blocks flag submission for unverified accounts. |
| `optionalAuth` | Attaches `req.user` if cookie present, passes through without error if absent. |

### Token security

- Access tokens: short-lived (15 min), stored in httpOnly cookie
- Refresh tokens: SHA-256 hash only stored in DB, raw token only in httpOnly cookie
- Token rotation on every refresh: old token revoked, new token issued
- Token families: reuse of a revoked token revokes the entire family
- TTL index on `RefreshToken` collection: expired documents auto-deleted by MongoDB

### Flag security

- Flags stored as SHA-256 hashes — never plaintext
- `select: false` on all hash fields — excluded from queries by default
- Case sensitivity configurable per challenge
- Anti-cheat: IP-based flag sharing detection across correct solvers

---

## 11. Error Handling

### `ApiError` class

```typescript
throw new ApiError(404, "Challenge not found");
throw new ApiError(400, "Validation failed", [
  { field: "email", message: "Invalid email" }
]);
```

### `asyncHandler` wrapper

All controllers are wrapped to catch thrown `ApiError` instances and forward them to the global error handler.

### Global error handler

```typescript
app.use((err, req, res, next) => {
  // Logs full stack via Winston
  // Returns ApiError shape if it's an ApiError
  // Returns generic 500 otherwise
  // Includes stack trace in development only
});
```

### `parseBody` helper

Validates request body/query against a Zod schema and throws `ApiError(400)` with field-level errors on failure:

```typescript
const data = parseBody(createTeamSchema, req.body);
// data is fully typed — throws before service is called if invalid
```

---

## 12. Real-time (Socket.io + Redis)

### Setup

```typescript
// server.ts — after httpServer is created
await initSocket(httpServer); // attaches Socket.io with Redis adapter
```

### Room structure

| Room name | Who's in it | Events |
|---|---|---|
| `global` | All connected users | First blood, event transitions, announcements |
| `user:{userId}` | One user (all their tabs) | Correct solve, personal notifications |
| `team:{teamId}` | All team members | Team challenge solved, member joined |
| `event:{eventId}` | Users on event detail page | Live leaderboard, scoreboard freeze |

### Emitting from services

```typescript
import { socketEmit } from "../socket/socket.emitters";

// After a correct solve
socketEmit.correctSolve(userId, { challengeId, pointsAwarded, newScore, rank });
socketEmit.firstBlood({ challengeId, challengeTitle, username, pointsAwarded });
socketEmit.leaderboardUpdated("global_user");
```

All emitters are fire-and-forget — they never throw and never block the response.

### Redis adapter

Required when running multiple Node.js processes (PM2 cluster, Docker replicas). The adapter bridges Socket.io emit calls across all processes via Redis pub/sub. From application code, emitting to a room works identically regardless of which process the target client is connected to.

---

## 13. Deployment

### Docker (recommended)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
CMD ["node", "dist/server.js"]
```

### Checklist before production

- [ ] `NODE_ENV=production`
- [ ] MongoDB Atlas (or self-hosted replica set with auth)
- [ ] Redis Cluster or Redis Cloud
- [ ] `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are strong random strings (≥ 64 chars)
- [ ] `CORS_ORIGIN` locked to your frontend domain
- [ ] Cloudinary configured for avatar + attachment storage
- [ ] SMTP configured for email verification and password reset
- [ ] Process manager (PM2 or Kubernetes) with `SIGTERM` graceful shutdown
- [ ] Reverse proxy (nginx) terminating TLS before Express
- [ ] Log aggregation (Datadog, Logtail, etc.) consuming Winston JSON output
- [ ] MongoDB indexes reviewed with `db.collection.getIndexes()`
- [ ] Rate limiter values tuned for expected traffic
- [ ] `mongoSanitize` uncommented if user input reaches MongoDB query fields directly

### Graceful shutdown

The server handles `SIGTERM` and `SIGINT`. It gives in-flight requests 5 seconds to complete before exiting. MongoDB and Redis connections close cleanly on exit.
