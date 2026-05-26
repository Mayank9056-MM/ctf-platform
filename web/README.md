# CTF Platform Web App

Next.js frontend for the CTF platform.

## Responsibilities

- Public landing and onboarding flows.
- Authenticated player experience (challenges, submissions, events, team views, notifications).
- Admin-facing operational interfaces.
- Real-time UX updates through Socket.IO and API polling/query refresh.

## Tech stack

- Next.js 16 + React 19 + TypeScript
- TanStack Query + Axios
- Socket.IO client
- Component-driven UI primitives

## Development

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:3000`

## Build and run

```bash
npm run build
npm run start
```

## Quality checks

```bash
npm run lint
npm run build
```

## Notes

- Ensure backend API URL and auth cookie settings are aligned with the environment.
- For production, deploy behind HTTPS and configure proper CORS + secure cookie behavior on the API.
