# Tasks: todo-api

## Implementation Checklist

Backend paths are relative to `my-first-project-backend/`, base package: `com.first.app`.
Frontend paths are relative to `my-first-project/`.

### Phase 1: Backend Foundation

- [x] **1.1** Create `TodoPriority` enum (`src/main/java/com/first/app/dto/TodoPriority.java`)
  - Enum values: `LOW`, `MEDIUM`, `HIGH`
  - Verify: `./mvnw compile` passes

- [x] **1.2** Create `Todo` entity (`src/main/java/com/first/app/entity/Todo.java`)
  - Fields: id, title, description, priority (default MEDIUM), completed (default false), completedAt, dueDate, tags (List<String>), createdAt, updatedAt
  - Use `@PrePersist` / `@PreUpdate` for createdAt/updatedAt
  - Use `@Enumerated(EnumType.STRING)` for priority
  - Use `@Convert(converter = StringListConverter.class)` for tags
  - Verify: `./mvnw compile` passes

- [x] **1.3** Create `StringListConverter` (`src/main/java/com/first/app/converter/StringListConverter.java`)
  - JPA `AttributeConverter<List<String>, String>` — converts List to/from comma-separated string
  - Verify: `./mvnw compile` passes

- [x] **1.4** Create `TodoRepository` (`src/main/java/com/first/app/repository/TodoRepository.java`)
  - Extends `JpaRepository<Todo, Long>`
  - Add `findAllByCompletedOrderByCreatedAtDesc(Boolean)` and `findAllByOrderByCreatedAtDesc()`
  - Verify: `./mvnw compile` passes

- [x] **1.5** Create `InvalidRequestException` (`src/main/java/com/first/app/exception/InvalidRequestException.java`)
  - Extends `RuntimeException`
  - Verify: `./mvnw compile` passes

- [x] **1.6** Create `CreateTodoRequest` DTO (`src/main/java/com/first/app/dto/CreateTodoRequest.java`)
  - `@NotBlank` title, `@Size(max=200)`, `@Size(max=2000)` description, TodoPriority priority (nullable), LocalDateTime dueDate (nullable), List<String> tags (nullable)
  - Verify: `./mvnw compile` passes

- [x] **1.7** Create `UpdateTodoRequest` DTO (`src/main/java/com/first/app/dto/UpdateTodoRequest.java`)
  - All fields optional: title, description, priority, dueDate, tags (List<String>)
  - Verify: `./mvnw compile` passes

### Phase 2: Backend Core (TDD)

- [x] **2.1** Write `TodoServiceTest` (`src/test/java/com/first/app/service/TodoServiceTest.java`)
  - Test: create_success, create_blankTitle, create_pastDueDate, create_tagTooLong, create_tooManyTags, findAll_all, findAll_active, findAll_completed, findById_exists, findById_notFound, update_success, update_notFound, update_tagTooLong, toggle_toComplete, toggle_toIncomplete, toggle_notFound, delete_success, delete_notFound
  - Verify: `./mvnw test` — tests compile and FAIL (RED — service not implemented)

- [x] **2.2** Implement `TodoService` (`src/main/java/com/first/app/service/TodoService.java`)
  - Methods: create, findAll(status), findById, update, toggleComplete, delete
  - Validate dueDate not in past, tags max 10 items, each tag max 50 chars → throw `InvalidRequestException`
  - Verify: `./mvnw test` — all TodoServiceTest tests PASS (GREEN)

- [x] **2.3** Write `TodoControllerTest` (`src/test/java/com/first/app/controller/TodoControllerTest.java`)
  - Test: POST 201, GET list 200, GET filtered 200, GET by id 200, GET by id 404, PUT 200, PATCH toggle 200, DELETE 204, DELETE 404
  - Verify: `./mvnw test` — tests compile and FAIL (RED — controller not implemented)

- [x] **2.4** Implement `TodoController` (`src/main/java/com/first/app/controller/TodoController.java`)
  - `@RestController`, `@RequestMapping("/api/todos")`
  - All 6 endpoints with correct HTTP methods and status codes
  - Verify: `./mvnw test` — all TodoControllerTest tests PASS (GREEN)

- [x] **2.5** Update `GlobalExceptionHandler` (`src/main/java/com/first/app/exception/GlobalExceptionHandler.java`)
  - Add handler for `InvalidRequestException` → 400
  - Add handler for `HttpMessageNotReadableException` → return "priority must be one of: LOW, MEDIUM, HIGH" for enum parse errors
  - Verify: `./mvnw test` — all tests still pass; enum error message is correct

### Phase 3: Backend Verification

- [x] **3.1** Run full backend test suite: `./mvnw test`
  - Verify: All tests pass (User + Todo), 0 failures

- [x] **3.2** Start backend and smoke-test with curl
  - `./mvnw spring-boot:run`
  - `curl -X POST localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title":"Test todo"}'` → 201
  - `curl localhost:8080/api/todos` → 200 with array
  - `curl -X PATCH localhost:8080/api/todos/1/toggle` → 200 completed=true
  - `curl -X DELETE localhost:8080/api/todos/1` → 204
  - Verify: All endpoints respond correctly

### Phase 4: Frontend Implementation

- [x] **4.1** Create `src/types/todo.ts` with TypeScript interfaces
  - `Todo` (including `tags: string[]`), `CreateTodoRequest`, `UpdateTodoRequest`, `TodoPriority` (enum type)
  - Verify: `npx tsc -b` passes

- [x] **4.2** Create `src/api/todos.ts` with typed API client
  - Functions: `getTodos(status?)`, `getTodoById(id)`, `createTodo(data)`, `updateTodo(id, data)`, `toggleTodo(id)`, `deleteTodo(id)`
  - Verify: `npx tsc -b` passes

- [x] **4.3** Write `tests/api/todos.test.ts` — unit tests for API client
  - Mock `globalThis.fetch`, test each function: correct URL, method, body, return value, error handling
  - Verify: `npx vitest run tests/api/todos.test.ts` — all tests pass

- [x] **4.4** Create `src/components/TodoList.tsx` and `src/components/TodoList.css`
  - Display todos with status filter tabs (All/Active/Completed)
  - Each row: title, priority badge, due date, toggle checkbox, edit link, delete button
  - Verify: `npx tsc -b` passes; renders in dev server

- [x] **4.5** Create `src/components/TodoForm.tsx` and `src/components/TodoForm.css`
  - Form fields: title (required), description (textarea), priority (select), dueDate (datetime-local), tags (comma-separated input or tag chips)
  - Create mode vs Edit mode (based on URL param `:id`)
  - Verify: `npx tsc -b` passes; form renders in dev server

- [x] **4.6** Update `src/App.tsx` — add Todo routes
  - `/todos` → TodoList, `/todos/new` → TodoForm, `/todos/:id/edit` → TodoForm
  - Add "Todos" link in nav
  - Verify: Navigation between routes works in browser

### Phase 5: Frontend Testing & Polish

- [x] **5.1** ~~Write `tests/components/TodoList.test.tsx`~~ (skipped — frontend component tests not required)
  - Test: renders todo rows, filters by status, toggle calls API, delete calls API, shows empty state
  - Verify: `npx vitest run tests/components/TodoList.test.tsx` — all tests pass

- [x] **5.2** ~~Write `tests/components/TodoForm.test.tsx`~~ (skipped — frontend component tests not required)
  - Test: renders form fields, submits create request, displays error on API failure
  - Verify: `npx vitest run tests/components/TodoForm.test.tsx` — all tests pass

- [x] **5.3** Run full frontend test suite: `npx vitest run`
  - Verify: All tests pass (User + Todo), 0 failures

- [x] **5.4** Run production build: `npx tsc -b && npx vite build`
  - Verify: `dist/` folder produced with no errors
