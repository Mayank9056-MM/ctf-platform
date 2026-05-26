# CTF Platform

Production-grade, full-stack Capture The Flag platform built for startup-scale operation.

## What this platform provides

- **Competition core**: challenge lifecycle, dynamic scoring, first-blood tracking, submissions, and anti-abuse controls.
- **Event operations**: scheduled events, registration, event-specific leaderboards, freeze/unfreeze controls, and lifecycle transitions.
- **User ecosystem**: auth (email/password + OAuth), profile management, teams, invites, notifications, announcements, and story-mode progression.
- **Admin control plane**: moderation, score correction, audit logs, challenge/event management, and platform analytics.
- **Production reliability**: Redis-backed caching/queues, structured logging, rate limiting, secure cookie auth, and Dockerized local/production workflows.

## Monorepo structure

```text
ctf-platform/
├── api/                     # Node.js + Express + TypeScript backend
├── web/                     # Next.js frontend
├── docs/                    # Production operations and governance docs
├── docker-compose.yml       # Local full-stack orchestration
└── README.md
```

## Tech stack

### Backend (`api/`)
- Node.js + TypeScript + Express 5
- MongoDB (Mongoose)
- Redis (caching, pub/sub, queues, rate-limit support)
- Socket.IO (real-time updates)
- Zod validation
- JWT access/refresh auth with rotation

### Frontend (`web/`)
- Next.js 16 + React 19 + TypeScript
- TanStack Query + Axios
- Socket.IO client
- Component system with reusable UI primitives

## Quick start (local)

### 1) Prerequisites
- Node.js 20+
- Docker + Docker Compose (recommended)

### 2) Run full stack with Docker

```bash
docker compose up --build
```

This starts MongoDB, Redis, API, and web app according to `docker-compose.yml`.

### 3) Run services manually (optional)

Backend:
```bash
cd api
npm install
npm run dev
```

Frontend:
```bash
cd web
npm install
npm run dev
```

## Core documentation

- **Backend reference**: [`api/README.md`](api/README.md)
- **Frontend reference**: [`web/README.md`](web/README.md)
- **Architecture**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Deployment & operations**: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- **Security policy**: [`docs/SECURITY.md`](docs/SECURITY.md)
- **Contributing guide**: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

## Production readiness checklist (summary)

- [ ] Environment variables are set per environment (dev/stage/prod) with secure secret management.
- [ ] MongoDB and Redis are deployed in HA-ready managed services or hardened self-hosted clusters.
- [ ] TLS is terminated at ingress / load balancer.
- [ ] API and web observability are enabled (error tracking, metrics, log aggregation).
- [ ] Backups and restore drills are automated.
- [ ] CI gates lint, tests, type checks, and build artifacts before deployment.
- [ ] Security controls (rate limits, CORS, cookie config, RBAC) are verified in staging.

## Product maturity roadmap (suggested)

- Multi-tenant org workspaces
- Billing/subscription integration
- Public API keys + partner integrations
- Scenario-based blue-team training modules
- Advanced anti-cheat analytics and anomaly detection

