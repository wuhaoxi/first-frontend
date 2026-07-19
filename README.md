# User Management Frontend

React + Vite + TypeScript frontend for the User Management REST API.

## Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8080` (see `my-first-project-backend`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and produce production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## API Proxy

The Vite dev server proxies `/api/*` requests to `http://localhost:8080`, so no CORS configuration is needed during development. In production, you'll need to configure a reverse proxy or serve both frontend and backend from the same origin.

## Tech Stack

- **React 18** — UI library
- **React Router v6** — Client-side routing
- **TypeScript 5** — Type safety
- **Vite 5** — Build tool and dev server
- **Vitest 2** — Test runner
- **@testing-library/react** — Component testing
