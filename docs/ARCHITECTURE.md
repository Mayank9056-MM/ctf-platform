# Architecture Overview

## System context

The platform is designed as a two-application architecture:

1. **`web/`** — Next.js application for players and admins.
2. **`api/`** — Express-based backend providing REST APIs and real-time events.

Supporting services:
- **MongoDB** for persistent application data.
- **Redis** for caching, pub/sub, queues, and rate-limit support.

## High-level request flow

1. Browser loads Next.js frontend.
2. Frontend authenticates against API.
3. API sets secure HTTP-only cookies for auth tokens.
4. Frontend calls protected API routes with credentials.
5. API validates token and role, executes business logic, persists state to MongoDB.
6. API emits real-time events via Socket.IO where needed.

## Backend module architecture

The backend is organized by domain modules (auth, users, teams, challenges, submissions, events, leaderboard, notifications, announcements, stories, admin).

Each module generally follows:
- `*.routes.ts` for route mapping.
- `*.controller.ts` for request/response orchestration.
- `*.service.ts` for domain logic.
- `*.validate/validator.ts` for schema validation.
- `*.types.ts` for explicit contracts.

## Data ownership model

- **Users & auth**: identities, credentials, sessions, refresh-token chain state.
- **Competition state**: challenges, submissions, scoring artifacts.
- **Collaboration state**: teams, invites, team score rollups.
- **Operations state**: events, announcements, notifications, audit logs.

## Security architecture highlights

- HTTP-only cookie auth model for token transport.
- JWT access tokens + rotated refresh tokens.
- Middleware defenses (helmet, hpp, rate limits, CORS, payload limits).
- RBAC and privilege checks for admin/superadmin operations.
- Validation-first request processing with typed schemas.

## Scale considerations

- Horizontal API scaling with stateless app nodes.
- Redis adapter for multi-node Socket.IO.
- Cached/precomputed leaderboard snapshots.
- Queue-backed asynchronous workloads.
- Observability hooks for tracing, metrics, and structured logging.
