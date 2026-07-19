# Specification: react-frontend

## ADDED Requirements

### Requirement: Vite + React + TypeScript Project
The project SHALL be initialized with Vite, React 18, and TypeScript using the official `react-ts` template. It SHALL include a valid `index.html` entry point, `vite.config.ts`, and `tsconfig.json` configured for JSX/React.

#### Scenario: Dev server starts
- **WHEN** a developer runs `npm run dev`
- **THEN** Vite starts the dev server on port 5173 and renders the React app in the browser

#### Scenario: Production build succeeds
- **WHEN** a developer runs `npm run build`
- **THEN** Vite produces a `dist/` folder with optimized static assets

---

### Requirement: TypeScript Interfaces Matching Backend DTOs
The project SHALL define TypeScript interfaces in `src/types/user.ts` that mirror the backend's `User` entity and request DTOs:
- `User` — `{ id: number; name: string; email: string }`
- `CreateUserRequest` — `{ name: string; email: string }`
- `UpdateUserRequest` — `{ name?: string; email?: string }`

#### Scenario: Interfaces compile without errors
- **WHEN** `tsc --noEmit` is run
- **THEN** all type definitions compile with no errors

---

### Requirement: API Client Module
The project SHALL provide `src/api/users.ts` with typed functions that call the backend REST API:
- `getUsers(): Promise<User[]>`
- `getUserById(id: number): Promise<User>`
- `createUser(data: CreateUserRequest): Promise<User>`
- `updateUser(id: number, data: UpdateUserRequest): Promise<User>`
- `deleteUser(id: number): Promise<void>`

All functions SHALL use `fetch` and return parsed JSON responses. Non-OK responses SHALL throw an error with the status code and message.

#### Scenario: getUsers returns user list
- **WHEN** `getUsers()` is called and the backend returns `200` with a JSON array
- **THEN** the function resolves with a typed `User[]`

#### Scenario: createUser sends POST with JSON body
- **WHEN** `createUser({ name: "Alice", email: "alice@example.com" })` is called
- **THEN** the function sends `POST /api/users` with `Content-Type: application/json` and the request body

#### Scenario: API error throws with message
- **WHEN** any API function receives a non-OK response (e.g. 404, 409)
- **THEN** the function rejects with an Error containing the status code and response message

---

### Requirement: Vite Proxy for Backend API
The `vite.config.ts` SHALL configure a dev server proxy that forwards `/api` requests to `http://localhost:8080`.

#### Scenario: API request proxied in dev mode
- **WHEN** the browser sends `GET /api/users` to the Vite dev server
- **THEN** Vite proxies the request to `http://localhost:8080/api/users` and returns the backend response

---

### Requirement: UserList Component
The project SHALL include a `UserList` component that:
- Fetches and displays all users in a table (columns: Name, Email, Actions)
- Provides a "Delete" button per row that calls `deleteUser` and refreshes the list
- Provides a "New User" link/button that navigates to the create form
- Provides an "Edit" link/button per row that navigates to the edit form

#### Scenario: UserList renders users from API
- **WHEN** the UserList component mounts and the API returns 2 users
- **THEN** the table displays 2 rows with each user's name and email

#### Scenario: Delete removes user and refreshes
- **WHEN** the user clicks "Delete" on a row
- **THEN** the API `DELETE /api/users/:id` is called and the list refreshes without that user

---

### Requirement: UserForm Component
The project SHALL include a `UserForm` component that:
- Renders a form with "Name" and "Email" fields
- In create mode: submits `POST /api/users` and navigates back to the list on success
- In edit mode: pre-fills fields with existing user data, submits `PUT /api/users/:id`, and navigates back
- Displays validation errors returned from the API

#### Scenario: Create new user
- **WHEN** the user fills in name and email and submits the form in create mode
- **THEN** `POST /api/users` is called with the form data and the browser navigates to the user list

#### Scenario: Edit existing user
- **WHEN** the form is opened in edit mode for user id=1
- **THEN** the form pre-fills with the user's current name and email, and submitting sends `PUT /api/users/1`

#### Scenario: API validation error displayed
- **WHEN** the API returns a 400 or 409 response
- **THEN** the form displays the error message to the user

---

### Requirement: Routing with React Router
The project SHALL use React Router v6 with the following routes:
- `/` — UserList page
- `/users/new` — UserForm in create mode
- `/users/:id/edit` — UserForm in edit mode

#### Scenario: Navigation between pages
- **WHEN** the user clicks "New User" on the list page
- **THEN** the browser navigates to `/users/new` and the UserForm renders in create mode

#### Scenario: Edit route includes user ID
- **WHEN** the browser navigates to `/users/5/edit`
- **THEN** the UserForm renders in edit mode and fetches user with id=5

---

### Requirement: Vitest with jsdom and React Testing Library
The project SHALL configure Vitest with `jsdom` environment and include `@testing-library/react` and `@testing-library/jest-dom`. A setup file SHALL configure global test matchers.

#### Scenario: Component test runs
- **WHEN** `npm test` is executed
- **THEN** all component tests pass using jsdom environment with RTL render/queries

---

## MODIFIED Requirements

None. This is a new frontend project (restructuring from plain TypeScript to React).

## REMOVED Requirements

### Requirement: greet() function
The existing `greet()` function in `src/index.ts` and its test in `tests/index.test.ts` SHALL be removed as part of the project restructuring.

## Non-Functional Requirements

- **Performance**: The initial page load (production build) SHALL be under 200KB gzipped.
- **Accessibility**: Form inputs SHALL have associated `<label>` elements.
- **Developer experience**: Hot module replacement (HMR) SHALL work during development via Vite's built-in HMR.
