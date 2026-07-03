# Future Backend Infrastructure Tasks — CTF Platform

## Current Architecture

Current stack:

- Next.js frontend
- Node.js modular monolith backend
- MongoDB Atlas
- Redis Cloud
- Socket.IO + Redis Adapter
- Realtime notifications
- Realtime announcements
- Realtime leaderboard updates

Current focus:

- Build frontend
- Stabilize realtime flows
- Improve UX
- Validate APIs and websocket architecture

Avoid premature overengineering.

---

# Current System Design

```text
Frontend (Next.js)
        ↓
Socket.IO Client + REST API
        ↓
Node.js Modular Monolith Backend
        ↓
 ├── MongoDB Atlas
 ├── Redis Cloud
 ├── Socket.IO Redis Adapter
 └── Future BullMQ Workers
```

---

# Modular Monolith Architecture Notes

Current architecture is a Modular Monolith.

Meaning:

- Single backend deployment
- Single Node.js application
- Multiple separated business modules

Current modules:

```text
services/
 ├── submission/
 ├── leaderboard/
 ├── notification/
 ├── announcement/
 ├── team/
 ├── auth/
 ├── story/
 └── socket/
```

Benefits:

- simpler deployment
- easier debugging
- transactional consistency
- faster development
- easier refactoring
- shared infrastructure

Important:

DO NOT prematurely move to:

- microservices
- Kubernetes
- Kafka
- distributed orchestration
- service mesh architecture

Current architecture is already scalable for MVP and medium-scale growth.

---

# Socket.IO Architecture Notes

## What Socket.IO Is

Socket.IO provides:

```text
Persistent bidirectional realtime communication
```

between:

```text
Browser ⇄ Server
```

Unlike HTTP request-response cycles, sockets remain connected continuously.

Used for:

- notifications
- announcements
- first blood events
- leaderboard updates
- team events
- realtime event updates

---

# Current Socket Room Architecture

```text
GLOBAL_ROOM
 └── all connected users

user:{userId}
 └── personal notifications/events

team:{teamId}
 └── team-specific events

event:{eventId}
 └── event-specific realtime updates
```

---

# Redis Adapter Architecture

Current implementation uses:

```ts
@socket.io/redis-adapter
```

Purpose:

Allows Socket.IO events to synchronize across multiple backend servers.

Flow:

```text
Server A
   ↓ publish
Redis Pub/Sub
   ↓ subscribe
Server B
```

Without Redis adapter:

- sockets only work on one server
- horizontal scaling breaks

Current setup is production-grade.

---

# Current Redis Responsibilities

Redis currently handles:

- Socket.IO pub/sub
- rate limiting
- temporary cache
- leaderboard invalidation
- future queue infrastructure

---

# Planned Redis Improvements

## Replace In-Memory Structures

Current:

```ts
const _flagShareMap = new Map()
```

Problem:

- resets on restart
- not shared across servers
- not horizontally scalable

Future replacement:

- Redis Sets
- Redis Sorted Sets
- Redis TTL keys

---

# Planned Redis Usage Expansion

## Redis Sorted Sets (ZSET)

Use for:

- realtime leaderboard ranking
- score ordering
- fast top-N retrieval

---

## Redis Streams (Optional)

Possible future use:

- audit pipelines
- realtime event feeds
- event sourcing

Only if real scale requires it.

---

# Queue / Job System (Future Work)

Planned technology:

```text
BullMQ + Redis
```

Purpose:

Move expensive operations out of HTTP request lifecycle.

---

# Why Jobs Are Needed

Current issue:

Some expensive operations still happen during requests.

Bad pattern:

```text
HTTP Request
    ↓
heavy computation
    ↓
slow response
```

Target architecture:

```text
HTTP Request
    ↓
enqueue job
    ↓
instant response
```

Worker handles heavy processing asynchronously.

Benefits:

- lower latency
- retry handling
- scalability
- better fault isolation
- background processing
- horizontal scaling

---

# Planned Job Types

## 1. Leaderboard Recompute Queue

Priority: HIGH

Current flow:

```text
Submission
    ↓
mark leaderboard stale
```

Future flow:

```text
Submission
    ↓
enqueue leaderboard recompute job
    ↓
worker recomputes leaderboard
    ↓
update cache
    ↓
emit websocket update
```

Tasks:

- debounce recomputation
- deduplicate jobs
- cache snapshots
- invalidate stale views
- emit realtime updates

---

## 2. Email Queue

Priority: HIGH

Use for:

- verification emails
- password reset emails
- invite emails
- event reminders

Requirements:

- retry support
- exponential backoff
- dead-letter handling

---

## 3. Notification Queue

Priority: HIGH

Use for:

- bulk notification fanout
- delayed notifications
- digest notifications
- async notification processing

Future delivery channels:

- in-app
- email
- Discord
- webhook

---

## 4. Announcement Fanout Queue

Priority: MEDIUM

Current issue:

Large broadcasts may become expensive.

Future flow:

```text
Admin publishes announcement
        ↓
enqueue fanout job
        ↓
worker distributes notifications
        ↓
socket broadcast
```

---

## 5. Anti-Cheat Queue

Priority: MEDIUM

Move heavy anti-cheat analysis out of request lifecycle.

Future detections:

- suspicious solve velocity
- flag sharing
- IP correlation
- impossible solve chains
- VPN/proxy heuristics

---

## 6. Analytics Queue

Priority: LOW

Use for:

- solve analytics
- challenge heatmaps
- event metrics
- user activity aggregation

---

# Current Leaderboard Architecture

Current design:

```text
Submission
    ↓
mark leaderboard stale
    ↓
recompute later
    ↓
store snapshot
    ↓
emit socket event
```

This is GOOD architecture.

Benefits:

- avoids recomputing on every request
- reduces DB load
- scalable snapshot-based design

Future improvement:

Move recomputation fully to background workers.

---

# Notification Architecture

Current design:

```text
Persist notification to MongoDB
        ↓
Emit realtime socket event
```

Benefits:

- notifications survive socket failures
- realtime UX
- durable persistence

This is production-grade design.

---

# Announcement Architecture

Current design:

```text
MongoDB
    = source of truth

Socket.IO
    = realtime delivery layer
```

Correct architecture.

---

# Socket.IO Future Improvements

## Presence Tracking

Track:

- online users
- active teams
- event participants

Use Redis-backed distributed presence.

---

## Reconnection Recovery

Add:

- missed event replay
- connection recovery
- event versioning

---

## Socket Rate Limiting

Add Redis-backed socket rate limiting.

---

# Future Worker Architecture

Planned architecture:

```text
Frontend
    ↓
API Server
    ↓
Redis Queue
    ↓
BullMQ Worker
    ↓
MongoDB + Redis Cache
    ↓
Socket.IO Emit
```

---

# Frontend Priority (CURRENT FOCUS)

Current main priority:

- challenge UI
- challenge detail pages
- leaderboard UI
- notification center
- announcement feed
- team dashboard
- realtime UX

Frontend development will naturally reveal:

- API bottlenecks
- websocket gaps
- caching problems
- invalidation issues
- missing abstractions

Do not overbuild backend infrastructure before frontend validates flows.

---

# Current Backend Strengths

## Already Good

- modular architecture
- Redis integration
- realtime sockets
- Socket.IO room design
- leaderboard invalidation
- notification persistence
- Redis rate limiting
- graceful shutdown
- logging infrastructure
- Redis pub/sub scaling
- room-based event routing

---

# Current Weaknesses / Future Refactors

## Still Needed

- proper job system
- Redis-backed anti-cheat state
- distributed event architecture
- queue workers
- cache warming
- socket presence tracking
- event replay/recovery
- worker observability
- metrics dashboards

---

# Long-Term Architecture Goal

```text
Frontend (Next.js)
        ↓
Node.js Modular Monolith API
        ↓
 ├── MongoDB Atlas
 ├── Redis Cloud
 ├── BullMQ Workers
 ├── Socket.IO Redis Adapter
 ├── Background Job Processors
 └── Realtime Event Infrastructure
```

---

# Core Principle

Build product first.

Scale architecture only after:

- real bottlenecks
- real traffic
- real operational pain
- real scaling requirements

Avoid premature infrastructure complexity.