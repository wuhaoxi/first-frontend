# Proposal: todo-api

## Summary

Add a Todo (待办清单) CRUD module to the existing Spring Boot backend and React frontend. The module provides full lifecycle management for personal todos: create, read, update, toggle completion, and delete — with input validation and status filtering.

## Motivation

The existing backend only has a User entity as a scaffold. The Todo module is the first real feature that delivers user-facing value — a private task tracker. It also validates the full-stack architecture (backend REST API + frontend components + Vite proxy) end-to-end.

## Scope

### In Scope
- Backend: Todo entity, repository, service, controller, DTOs, validation
- Backend: `PATCH /api/todos/{id}/toggle` for quick completion toggling
- Backend: `GET /api/todos?status=active|completed` for filtered listing
- Frontend: TypeScript types, API client, TodoList component, TodoForm component
- Frontend: Filtering by status (all/active/completed)
- Frontend: Toggle completion inline
- Frontend: Routing for list, create, edit views
- Input validation: title required/maxLength, priority enum, dueDate not in past
- camelCase field naming aligned between frontend and backend
- Tags: each todo has a `tags` string array (e.g., `["work", "urgent"]`), users type freely, no separate Tag entity

### Out of Scope
- Multi-user, authentication, authorization
- Collaboration, sharing, comments, attachments
- Sub-tasks, recurring todos
- Notifications, reminders
- Batch operations, drag-and-drop reordering
- Pagination (expected data volume is small for single-user)

## Impact

- **Backend**: New files in `com.first.app` packages — `entity/Todo.java`, `repository/TodoRepository.java`, `service/TodoService.java`, `controller/TodoController.java`, `dto/CreateTodoRequest.java`, `dto/UpdateTodoRequest.java`, `dto/TodoPriority.java` (enum). `GlobalExceptionHandler` extended to handle new validation errors.
- **Frontend**: New files in `src/types/todo.ts`, `src/api/todos.ts`, `src/components/TodoList.tsx`, `src/components/TodoForm.tsx`, plus routing updates in `App.tsx`.
- **Breaking changes**: None — purely additive.

## Open Questions
- [ ] None currently — scope is clear and spec is complete
