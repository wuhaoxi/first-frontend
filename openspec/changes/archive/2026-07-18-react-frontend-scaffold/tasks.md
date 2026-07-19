# Tasks: react-frontend-scaffold

## Implementation Checklist

All paths are relative to the project root: `my-first-project/`

### Phase 1: Foundation

- [x] **1.1** Back up `.qoder/` and `openspec/` directories to a temp location (`/tmp/my-first-project-backup/`)
  - Verify: `ls /tmp/my-first-project-backup/` shows `.qoder` and `openspec`

- [x] **1.2** Run `npm create vite@latest . -- --template react-ts` to initialize the project in the current directory (overwrite existing files)
  - Verify: `index.html`, `vite.config.ts`, `package.json` with React deps exist

- [x] **1.3** Restore `.qoder/` and `openspec/` from backup
  - Verify: `ls .qoder/` and `ls openspec/` show original contents

- [x] **1.4** Run `npm install` to install all Vite template dependencies
  - Verify: `node_modules/` exists and `npm ls react` shows react 18.x

- [x] **1.5** Add React Router: `npm install react-router-dom`
  - Verify: `npm ls react-router-dom` shows version 6.x

- [x] **1.6** Add testing deps: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  - Verify: `npm ls vitest` shows version 2.x

- [x] **1.7** Verify dev server starts: `npm run dev`
  - Verify: Browser shows Vite + React welcome page at `http://localhost:5173`

### Phase 2: Core Implementation

- [x] **2.1** Create `src/types/user.ts` with `User`, `CreateUserRequest`, `UpdateUserRequest` interfaces
  - Verify: `npx tsc --noEmit` passes with no errors

- [x] **2.2** Create `src/api/users.ts` with `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser` functions using typed `fetch` calls with error handling
  - Verify: `npx tsc --noEmit` passes

- [x] **2.3** Write `tests/api/users.test.ts` — unit tests for API client: mock `globalThis.fetch`, test each function returns correct data, test error handling on non-OK response
  - Verify: `npx vitest run tests/api/users.test.ts` — all tests pass

- [x] **2.4** Configure Vite proxy in `vite.config.ts`: add `server.proxy` for `/api` → `http://localhost:8080`
  - Verify: Config is valid; dev server still starts

- [x] **2.5** Configure Vitest in `vite.config.ts`: add `test` block with `environment: 'jsdom'` and `setupFiles: ['./tests/setup.ts']`
  - Verify: `npx vitest run` runs in jsdom environment

- [x] **2.6** Create `tests/setup.ts` with `import '@testing-library/jest-dom'`
  - Verify: Setup file is loaded during test runs

### Phase 3: Components & Routing

- [x] **3.1** Create `src/components/UserList.tsx` — fetches users on mount, renders table (Name, Email, Actions columns), Delete button per row, Edit link per row, "New User" link at top
  - Verify: `npx tsc --noEmit` passes; component renders in dev server

- [x] **3.2** Create `src/components/UserList.css` with basic table styling
  - Verify: Table is visually styled when rendered in browser

- [x] **3.3** Create `src/components/UserForm.tsx` — accepts optional `userId` prop (edit mode vs create mode); renders Name + Email inputs with labels; submits to appropriate API endpoint; navigates back to `/` on success; displays API error messages
  - Verify: `npx tsc --noEmit` passes; form renders in browser

- [x] **3.4** Create `src/components/UserForm.css` with basic form styling
  - Verify: Form is visually styled when rendered in browser

- [x] **3.5** Update `src/App.tsx` — configure React Router with routes: `/` → UserList, `/users/new` → UserForm (create), `/users/:id/edit` → UserForm (edit)
  - Verify: Navigation between routes works in browser

- [x] **3.6** Update `src/main.tsx` — wrap App in `BrowserRouter`
  - Verify: App renders with routing enabled

- [x] **3.7** Clean up template boilerplate: remove `src/App.css` Vite logo styles, remove `src/assets/` if present
  - Verify: No Vite/React logo imagery remains

### Phase 4: Testing

- [x] **4.1** Write `tests/components/UserList.test.tsx` — test: renders loading state, renders user rows when API returns data, delete button calls API and refreshes
  - Verify: `npx vitest run tests/components/UserList.test.tsx` — all tests pass

- [x] **4.2** Write `tests/components/UserForm.test.tsx` — test: renders form fields, submits create request, displays error on API failure
  - Verify: `npx vitest run tests/components/UserForm.test.tsx` — all tests pass

- [x] **4.3** Run full test suite: `npx vitest run`
  - Verify: All tests pass, no failures

### Phase 5: Polish

- [x] **5.1** Update `README.md` with: project description (React frontend for User management), prerequisites (Node.js 18+, backend running), scripts (`npm run dev`, `npm run build`, `npm test`), API proxy explanation
  - Verify: README is accurate and all commands work

- [x] **5.2** Run production build: `npm run build`
  - Verify: `dist/` folder is produced with HTML, JS, and CSS assets
