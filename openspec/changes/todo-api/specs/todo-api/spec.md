# Specification: todo-api

## ADDED Requirements

### Requirement: Todo Persistence
The system SHALL persist Todo entities with the following fields: `id` (Long, auto-generated), `title` (String, 1–200 chars, required), `description` (String, 0–2000 chars, optional), `priority` (Enum: LOW/MEDIUM/HIGH, default MEDIUM), `completed` (Boolean, default false), `completedAt` (LocalDateTime, nullable), `dueDate` (LocalDateTime, nullable, must not be in the past), `tags` (List<String>, optional, max 10 items, each 1–50 chars), `createdAt` (LocalDateTime, auto-set), `updatedAt` (LocalDateTime, auto-refreshed). All field names SHALL use camelCase.

#### Scenario: Entity persisted with defaults
- **WHEN** a new Todo is saved to the database
- **THEN** `completed` is `false`, `priority` is `MEDIUM`, `completedAt` is `null`, `tags` is empty list, `createdAt` and `updatedAt` are set to current time

### Requirement: Create Todo
The system SHALL accept `POST /api/todos` with a JSON body and return `201 Created` with the full Todo object.

#### Scenario: Valid create request
- **WHEN** user submits POST with `title` = "Buy groceries" and `tags` = ["shopping"]
- **THEN** system returns 201 with Todo object containing generated `id`, `completed=false`, `tags=["shopping"]`

#### Scenario: Title is blank
- **WHEN** user submits POST with empty or whitespace-only `title`
- **THEN** system returns 400 with message "title must not be blank"

#### Scenario: Title exceeds max length
- **WHEN** user submits POST with `title` longer than 200 characters
- **THEN** system returns 400 with message "title must not exceed 200 characters"

#### Scenario: Invalid priority value
- **WHEN** user submits POST with `priority` not in {LOW, MEDIUM, HIGH}
- **THEN** system returns 400 with message "priority must be one of: LOW, MEDIUM, HIGH"

#### Scenario: Tag contains comma
- **WHEN** user submits POST with a tag containing a comma (e.g. "work,urgent")
- **THEN** system returns 400 with message "tags must not contain commas"

#### Scenario: Tags contain blank or whitespace-only elements
- **WHEN** user submits POST with tags like `["  ", "work", ""]`
- **THEN** system auto-trims and filters out blank elements, resulting in `["work"]`

#### Scenario: DueDate in the past
- **WHEN** user submits POST with `dueDate` earlier than current time
- **THEN** system returns 400 with message "dueDate must not be in the past"

#### Scenario: Tag exceeds max length
- **WHEN** user submits POST with a tag longer than 50 characters
- **THEN** system returns 400 with message "each tag must not exceed 50 characters"

#### Scenario: Too many tags
- **WHEN** user submits POST with more than 10 tags
- **THEN** system returns 400 with message "tags must not exceed 10 items"

### Requirement: List Todos
The system SHALL accept `GET /api/todos` with optional `?status=` query parameter and return `200 OK` with an array of Todos sorted by `createdAt` descending.

#### Scenario: List all todos
- **WHEN** user requests GET /api/todos without status parameter
- **THEN** system returns all Todos sorted by createdAt descending

#### Scenario: Filter active todos
- **WHEN** user requests GET /api/todos?status=active
- **THEN** system returns only Todos where `completed=false`

#### Scenario: Filter completed todos
- **WHEN** user requests GET /api/todos?status=completed
- **THEN** system returns only Todos where `completed=true`

#### Scenario: Invalid status parameter
- **WHEN** user requests GET with `status` not in {all, active, completed}
- **THEN** system returns 400 with message "status must be one of: all, active, completed"

### Requirement: Get Todo By Id
The system SHALL accept `GET /api/todos/{id}` and return the Todo object or 404.

#### Scenario: Todo exists
- **WHEN** user requests GET /api/todos/{id} for an existing Todo
- **THEN** system returns 200 with the Todo object

#### Scenario: Todo not found
- **WHEN** user requests GET /api/todos/{id} for a non-existing id
- **THEN** system returns 404 with message "Todo not found with id: {id}"

### Requirement: Update Todo
The system SHALL accept `PUT /api/todos/{id}` with partial JSON body, update only provided fields, refresh `updatedAt`, and return the updated Todo.

#### Scenario: Valid update
- **WHEN** user submits PUT with `title` = "Updated title" for existing Todo
- **THEN** system returns 200 with updated Todo and refreshed `updatedAt`

#### Scenario: Update non-existing Todo
- **WHEN** user submits PUT for a non-existing id
- **THEN** system returns 404 with message "Todo not found with id: {id}"

#### Scenario: Update with blank title
- **WHEN** user submits PUT with empty `title`
- **THEN** system returns 400 with message "title must not be blank"

#### Scenario: Update with title exceeding max length
- **WHEN** user submits PUT with `title` longer than 200 characters
- **THEN** system returns 400 with message "title must not exceed 200 characters"

#### Scenario: Update with invalid priority
- **WHEN** user submits PUT with `priority` not in {LOW, MEDIUM, HIGH}
- **THEN** system returns 400 with message "priority must be one of: LOW, MEDIUM, HIGH"

#### Scenario: Update with tag containing comma
- **WHEN** user submits PUT with a tag containing a comma
- **THEN** system returns 400 with message "tags must not contain commas"

#### Scenario: Update with blank/whitespace tags
- **WHEN** user submits PUT with tags like `["  ", "work", ""]`
- **THEN** system auto-trims and filters out blank elements

#### Scenario: Update with past dueDate
- **WHEN** user submits PUT with `dueDate` earlier than current time
- **THEN** system returns 400 with message "dueDate must not be in the past"

#### Scenario: Update with tag exceeding max length
- **WHEN** user submits PUT with a tag longer than 50 characters
- **THEN** system returns 400 with message "each tag must not exceed 50 characters"

#### Scenario: Update with too many tags
- **WHEN** user submits PUT with more than 10 tags
- **THEN** system returns 400 with message "tags must not exceed 10 items"

### Requirement: Toggle Todo Completion
The system SHALL accept `PATCH /api/todos/{id}/toggle`, flip the `completed` boolean, set `completedAt` accordingly, and return the updated Todo.

#### Scenario: Toggle incomplete to complete
- **WHEN** user submits PATCH toggle for a Todo with `completed=false`
- **THEN** system returns 200 with `completed=true` and `completedAt` set to current time

#### Scenario: Toggle complete to incomplete
- **WHEN** user submits PATCH toggle for a Todo with `completed=true`
- **THEN** system returns 200 with `completed=false` and `completedAt=null`

#### Scenario: Toggle non-existing Todo
- **WHEN** user submits PATCH toggle for a non-existing id
- **THEN** system returns 404 with message "Todo not found with id: {id}"

### Requirement: Delete Todo
The system SHALL accept `DELETE /api/todos/{id}` and return `204 No Content` after removing the entity.

#### Scenario: Delete existing Todo
- **WHEN** user submits DELETE for an existing Todo
- **THEN** system returns 204 and the Todo is removed from the database

#### Scenario: Delete non-existing Todo
- **WHEN** user submits DELETE for a non-existing id
- **THEN** system returns 404 with message "Todo not found with id: {id}"

## Non-Functional Requirements

- All JSON field names SHALL use camelCase naming convention
- All datetime fields SHALL be serialized as ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss`)
- Single-user private: no authentication or authorization logic
- Response Content-Type SHALL be `application/json`
- Error responses SHALL use unified `ErrorResponse` format: `message`, `status` (HTTP code), `timestamp` (ISO 8601)
- Field validation errors SHALL include additional `errors` array with `field` and `message` per entry
- Database error messages SHALL NOT leak internal details (table names, SQL, etc.)
- Non-numeric path parameters for `id` SHALL return 400 with "id must be a valid number"
- Tags SHALL be auto-trimmed and blank elements filtered out before validation
- Tags SHALL NOT contain commas (comma is the internal delimiter)
- The `todos` table SHALL have a composite index on `(completed, created_at)`
