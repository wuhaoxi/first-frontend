# Design: todo-api

## Approach

Follow the existing layered architecture pattern established by the User module: `controller → service → repository → entity`. Add a `Priority` enum for type-safe priority handling. Implement status filtering via query parameter in the repository layer. The frontend mirrors the User module pattern with types, API client, and components.

## Architecture

### Backend (Spring Boot)

```
controller/TodoController.java     → REST endpoints, delegates to service
service/TodoService.java           → business logic, validation, orchestration
repository/TodoRepository.java     → Spring Data JPA with custom queries
entity/Todo.java                   → JPA entity with lifecycle callbacks
dto/TodoPriority.java              → enum: LOW, MEDIUM, HIGH
dto/CreateTodoRequest.java         → validated request DTO for POST
dto/UpdateTodoRequest.java         → partial update DTO for PUT
exception/InvalidRequestException.java → custom exception for business validation (e.g., past dueDate)
converter/StringListConverter.java   → JPA AttributeConverter: List<String> ↔ comma-separated String
```

### Frontend (React + Vite)

```
src/types/todo.ts                  → TypeScript interfaces matching backend DTOs
src/api/todos.ts                   → typed fetch-based API client
src/components/TodoList.tsx         → list with status filter + toggle + delete
src/components/TodoForm.tsx         → create/edit form
src/App.tsx                        → add /todos, /todos/new, /todos/:id/edit routes
```

## Data Model

### Todo Entity → `todos` table

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, auto-increment |
| title | VARCHAR(200) | NOT NULL |
| description | VARCHAR(2000) | nullable |
| priority | VARCHAR(10) | NOT NULL, default 'MEDIUM' |
| completed | BOOLEAN | NOT NULL, default false |
| completed_at | TIMESTAMP | nullable |
| due_date | TIMESTAMP | nullable |
| tags | VARCHAR(255) | nullable, stored as comma-separated string |
| created_at | TIMESTAMP | NOT NULL, auto-set |
| updated_at | TIMESTAMP | NOT NULL, auto-refreshed |

JPA entity uses `@PrePersist` and `@PreUpdate` lifecycle callbacks to manage `createdAt` and `updatedAt`. Tags are stored as a comma-separated string in a single column using a JPA `@Convert` attribute converter (`StringListConverter`).

## API Changes

### New Endpoints

| Method | Path | Handler | Status |
|--------|------|---------|--------|
| POST | /api/todos | `createTodo()` | 201 |
| GET | /api/todos | `findAll(status?)` | 200 |
| GET | /api/todos/{id} | `findById(id)` | 200 |
| PUT | /api/todos/{id} | `updateTodo(id)` | 200 |
| PATCH | /api/todos/{id}/toggle | `toggleComplete(id)` | 200 |
| DELETE | /api/todos/{id} | `deleteTodo(id)` | 204 |

### Validation Rules

| Rule | Layer | Mechanism |
|------|-------|-----------|
| title not blank | DTO | `@NotBlank` |
| title max 200 chars | DTO | `@Size(max=200)` |
| priority in enum | DTO | Jackson enum deserialization (auto 400 on invalid) |
| dueDate not in past | Service | Custom check → throws `InvalidRequestException` |
| description max 2000 | DTO | `@Size(max=2000)` |
| tags max 10 items | Service | Custom check → throws `InvalidRequestException` |
| each tag max 50 chars | Service | Custom check → throws `InvalidRequestException` |

### GlobalExceptionHandler Additions

Add handler for `InvalidRequestException` → 400 Bad Request with `{ message, status, timestamp }` format.

### Jackson Configuration

Spring Boot serializes Java `LocalDateTime` as ISO 8601 by default with `spring.jackson.serialization.write-dates-as-timestamps=false` (already the default in Spring Boot 3.x). Enum fields serialize as uppercase string names automatically.

## Dependencies

| Dependency | Scope | Already Present? |
|-----------|-------|-----------------|
| spring-boot-starter-web | compile | Yes |
| spring-boot-starter-data-jpa | compile | Yes |
| spring-boot-starter-validation | compile | Yes |
| h2 | runtime | Yes |
| lombok | compile | Yes |
| react-router-dom | frontend | Yes |
| vitest + @testing-library/* | frontend devDeps | Yes |

No new dependencies needed.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `dueDate` past-check is time-sensitive (clock skew) | Low — single-user local dev | Use `LocalDateTime.now()` on server side; acceptable for scaffold |
| Jackson enum deserialization returns generic 400 instead of custom message | Medium — error message may not match spec exactly | Add custom `@JsonCreator` on enum or `HttpMessageNotReadableException` handler in GlobalExceptionHandler to return "priority must be one of: LOW, MEDIUM, HIGH" |
| H2 in-memory DB loses data on restart | Low — dev only | Already documented; `mysql` profile available for persistence |
| `@PreUpdate` doesn't fire on toggle if only boolean changes | Low — JPA dirty checking handles it | Verify with test; use `@DynamicUpdate` if needed |

## Alternatives Considered

1. **Separate `status` field instead of `completed` boolean** — Rejected. Boolean is simpler for the toggle use case; status filtering is just a derived view.
2. **POST /api/todos/{id}/complete + POST /api/todos/{id}/uncomplete** — Rejected. A single PATCH toggle endpoint is simpler for single-user and avoids idempotency complexity.
3. **Soft delete** — Rejected. No requirement for trash/recovery in single-user private mode.
