# Agent Instructions

This file provides instructions for AI coding agents working on this project.

## Project Overview

This is a **full-stack AIWorkSpace** using the **Harness + OpenSpec + Superpowers** methodology.

The workspace is structured as two independent git repositories:
- **This repo** (`origin: first-frontend`) — the workspace root, which is also the React frontend application
- **`backend/`** — a separate git repo (`origin: first-backend`) linked as a submodule, containing the Spring Boot REST API

The workspace-level config (`.qoder/`, `openspec/`, `AGENTS.md`) lives in the frontend repo root.

## Repository Layout

```
my-first-project/                ← Git repo: first-frontend (workspace root)
├── .qoder/                      ← AI agent config (skills, rules, commands)
├── openspec/                    ← Spec-driven development artifacts
├── app/                         ← Next.js App Router pages + layout
├── components/                  ← React components (TypeScript)
├── lib/api/                     ← Typed fetch-based API clients
├── types/                       ← TypeScript interfaces
├── tests/                       ← Frontend tests (Vitest)
├── backend/                     ← Git submodule → first-backend
│   ├── src/main/java/           ← Backend source (Java 17, Spring Boot 3.3.6)
│   ├── src/test/java/           ← Backend tests (JUnit 5 + Mockito)
│   ├── pom.xml                  ← Maven build config
│   └── mvnw                     ← Maven Wrapper
├── .gitmodules                  ← Submodule config
└── AGENTS.md                    ← This file
```

> **Important**: `backend/` is an independent git repo. Changes inside it must be committed in `backend/` first, then the updated commit pointer is committed in the root repo.

## Frontend (this repo — workspace root)

The workspace root **is** the frontend application. All files at the top level belong to the frontend unless they are workspace-level config (`.qoder/`, `openspec/`, `AGENTS.md`).

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Test Runner | Vitest + @testing-library/react |
| Router | Next.js App Router (file-system routing) |
| Package Manager | npm |
| Dev Server | `npm run dev` → `http://localhost:3000` |
| Build | `npm run build` |
| Test | `npx vitest run` |

### Frontend Key Paths

| Path | Purpose |
|------|---------|
| `components/` | React components (UserList, UserForm, TodoList, TodoForm) |
| `lib/api/` | Typed fetch-based API clients (users.ts, todos.ts) |
| `types/` | TypeScript interfaces (user.ts, todo.ts) |
| `app/` | App Router pages + root layout (replaces src/App.tsx routing) |
| `tests/` | Frontend test files (mirrors lib/components structure) |
| `next.config.mjs` | Next.js config with `/api` proxy → `localhost:8080` |

### Frontend Conventions

- Field names use **camelCase** (aligned with backend)
- API client throws `Error` with `${status}: ${message}` format on non-OK responses
- Components use functional style with hooks (`useState`, `useEffect`), `useRouter` from `next/navigation`, `Link` from `next/link`
- Every page and component module that uses hooks MUST include the `'use client'` directive

## Backend Submodule (`backend/`)

The backend is a **separate git repository** (`first-backend`) linked into the workspace as a submodule at `backend/`. It has its own commit history, branches, and remote.

| Attribute | Value |
|-----------|-------|
| Framework | Spring Boot 3.3.6 |
| Language | Java 17 |
| Build Tool | Maven (via `./mvnw` wrapper) |
| Database | H2 in-memory (dev profile), MySQL 8.x (mysql profile) |
| ORM | Spring Data JPA + Hibernate |
| Test Framework | JUnit 5 + Mockito + @WebMvcTest |
| Dev Server | `./mvnw spring-boot:run` → `http://localhost:8080` |
| Test | `./mvnw test` |

### Backend Key Paths

| Path | Purpose |
|------|---------|
| `backend/src/main/java/com/first/app/` | Base package |
| `backend/src/main/java/com/first/app/controller/` | REST controllers (UserController, TodoController) |
| `backend/src/main/java/com/first/app/service/` | Business logic (UserService, TodoService) |
| `backend/src/main/java/com/first/app/entity/` | JPA entities (User, Todo) |
| `backend/src/main/java/com/first/app/repository/` | Spring Data repositories |
| `backend/src/main/java/com/first/app/dto/` | Request DTOs + ErrorResponse |
| `backend/src/main/java/com/first/app/exception/` | Domain exceptions + GlobalExceptionHandler |
| `backend/src/main/java/com/first/app/converter/` | JPA converters (StringListConverter) |
| `backend/src/main/resources/application-dev.yml` | Dev profile config (H2) |
| `backend/src/test/java/` | Test files (mirrors main/ structure) |

### Backend Conventions

- Base package: `com.first.app`
- Field names use **camelCase** (aligned with frontend)
- REST endpoints prefixed with `/api/`
- Error responses use unified `ErrorResponse` format: `{ message, status, timestamp }`
- Domain exceptions: `ResourceNotFoundException` (404), `InvalidRequestException` (400), `DuplicateEmailException` (409)
- JPA entities use `@PrePersist`/`@PreUpdate` for timestamp management

### Working with the Backend Submodule

```bash
# Enter the backend directory
cd backend

# Run backend commands normally
./mvnw spring-boot:run     # Start dev server
./mvnw test                # Run tests
./mvnw compile             # Compile

# Update submodule to latest commit
cd .. && git submodule update --remote backend

# After making changes in backend/, commit in backend first, then in root
cd backend && git add . && git commit -m "..."
cd .. && git add backend && git commit -m "Update backend submodule"
```

## Before Starting Any Task

1. **Check for relevant skills** — Read `.qoder/skills/*/SKILL.md` to find applicable workflows
2. **Check for active changes** — Look at `openspec/changes/` for in-flight work
3. **Read the specs** — Consult `openspec/specs/` for project requirements
4. **Check rules** — Review `.qoder/rules/` for project-specific standards

## OpenSpec Workflow Commands

These commands live in `.qoder/commands/opsx/` and implement the specification-driven development cycle:

| Command | Purpose |
|---------|--------|
| `/opsx:explore` | Think through ideas before committing to a change |
| `/opsx:propose <name>` | Create a change with proposal, specs, design, tasks |
| `/opsx:apply` | Implement tasks from the change (TDD enforced) |
| `/opsx:update` | Revise planning artifacts, keep them coherent |
| `/opsx:sync` | Merge delta specs into main specs |
| `/opsx:archive` | Archive a completed change |

**Typical flow:** `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`

## Development Workflow

### Starting New Features
1. `/opsx:explore` — Investigate and clarify requirements
2. `/opsx:propose <name>` — Create change with all planning artifacts
3. Review proposal, specs, design, and tasks
4. `/opsx:apply` — Implement following test-driven-development

### During Implementation
- Follow TDD: RED → GREEN → REFACTOR
- Use **systematic-debugging** when bugs appear
- Use `/opsx:update` if the plan needs revision
- Request code review between phases
- Verify before declaring completion
- **Frontend changes** → work in `app/`, `components/`, `lib/`, `types/` and `tests/`
- **Backend changes** → work in `backend/src/` and `backend/src/test/`

### Finishing Work
- Run full test suite (both frontend and backend)
- `/opsx:sync` — Merge delta specs into living specs (if needed)
- `/opsx:archive` — Archive completed change with date prefix
- Commit backend submodule first, then update root

## Key Directories

| Directory | Purpose |
|-----------|--------|
| `.qoder/commands/` | Explicit slash commands (e.g., `/opsx:propose`) |
| `.qoder/skills/` | Auto-invoked Superpowers workflow skills |
| `.qoder/rules/` | Project rules and coding standards |
| `.qoder/agents/` | Custom subagent definitions |
| `.qoder/hooks/` | Hook scripts for lifecycle automation |
| `openspec/specs/` | Living specifications — source of truth |
| `openspec/changes/` | In-flight changes with proposals, specs, designs, tasks |
| `openspec/templates/` | Reusable templates for change artifacts |
| `app/` | Frontend pages + layout (App Router) |
| `components/` | Frontend React components |
| `lib/` | Frontend API clients |
| `types/` | Frontend TypeScript interfaces |
| `tests/` | Frontend test files |
| `backend/` | Backend submodule (Spring Boot) |

## Rules

- Write tests before implementation code
- Every change needs a spec with concrete scenarios
- Tasks should be 2-5 minutes each with verification steps
- Don't skip code review between phases
- Evidence over claims — prove it works
