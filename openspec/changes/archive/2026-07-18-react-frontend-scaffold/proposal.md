# Proposal: react-frontend-scaffold

## Summary

Re-initialize the `my-first-project` directory as a React 18 + Vite + TypeScript frontend application using the official Vite `react-ts` template. The app will consume the Spring Boot backend's REST API (`/api/users`) via a fetch-based API client, providing a User management UI with list, create, edit, and delete functionality.

## Motivation

The backend (`my-first-project-backend`) is complete with full User CRUD endpoints. A frontend is needed to provide a user-facing interface. The current `my-first-project` code contains only a trivial `greet()` function with no real value, making it safe to restructure entirely.

## Scope

### In Scope
- Re-initialize project using `npm create vite@latest . -- --template react-ts`
- Preserve `.qoder/` and `openspec/` directories during restructuring
- TypeScript interfaces matching backend User entity and DTOs
- API client module (`src/api/users.ts`) using `fetch` with typed responses
- `UserList` component — table of users with delete button
- `UserForm` component — create and edit user form
- React Router v6 for navigation between list and form views
- Vite proxy configuration: `/api` → `http://localhost:8080`
- Vitest configured for `jsdom` environment with React Testing Library
- Basic component tests (renders, API call mock)

### Out of Scope
- Authentication / protected routes (future change)
- State management library (Zustand/Redux — add when complexity grows)
- Tailwind CSS or UI component library (future change)
- End-to-end tests with Cypress or Playwright (future change)
- Internationalization (i18n)
- Production deployment configuration

## Impact

- **Breaking change to existing code**: The `greet()` function and its test will be removed/replaced (trivial, no production value)
- **Preserved**: `.qoder/`, `openspec/`, `AGENTS.md`, `README.md` (updated)
- **New dependencies**: react, react-dom, react-router-dom, @testing-library/react, @testing-library/jest-dom, jsdom
- **Backend dependency**: Frontend requires backend running at `localhost:8080` for full functionality; works standalone with mock data for dev

## Open Questions

- [ ] Should we keep `vitest.config.ts` as a separate file or merge it into `vite.config.ts`?
- [ ] Should the API client handle error responses globally (interceptor pattern) or per-call?
- [ ] Should we add a simple "loading" and "error" state pattern, or keep it minimal for now?
