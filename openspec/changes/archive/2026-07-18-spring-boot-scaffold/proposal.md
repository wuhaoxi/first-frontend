# Proposal: spring-boot-scaffold

## Summary

Scaffold a new Spring Boot 3.3.x backend project using Maven for version management. The project will be a separate sibling directory (`my-first-project-backend/`) and provide a REST API layer backed by Spring Data JPA and MySQL, following a standard layered architecture (controller → service → repository → entity).

## Motivation

The current project has only a minimal TypeScript frontend placeholder. To build a real full-stack application, we need a robust Java backend. Spring Boot is the de-facto standard for Java web services, and Maven provides reliable, convention-over-configuration dependency management. Starting with REST + JPA + MySQL gives us a solid foundation to layer on features (auth, docs, caching) later.

## Scope

### In Scope
- New Maven project at `../my-first-project-backend/`
- Spring Boot 3.3.6, Java 17
- Spring Web (REST controllers, JSON serialization via Jackson)
- Spring Data JPA with Hibernate
- MySQL 8.x connector
- Lombok for boilerplate reduction
- Spring Boot DevTools for hot reload
- Maven Wrapper (`mvnw`) for zero-install builds
- One example entity (`User`) with full CRUD to demonstrate the layered architecture
- Unit tests with JUnit 5 + Mockito (via `spring-boot-starter-test`)
- `application.yml` with dev profile for local MySQL

### Out of Scope
- Security / JWT authentication (future change)
- Swagger / OpenAPI documentation (future change)
- Docker / containerization (future change)
- CI/CD pipeline configuration (future change)
- Frontend project (separate change)
- Database migration tooling like Flyway/Liquibase (future change)

## Impact

- No impact on the existing `my-first-project` codebase
- Creates a new sibling project that will eventually be paired with a React + Vite frontend
- Requires Java 17 JDK installed on developer machines
- Requires a running MySQL 8.x instance for local development

## Open Questions

- [ ] Should we use H2 in-memory database as a fallback for tests (recommended) or require MySQL for tests too?
- [ ] Should the example `User` entity include fields like `email`, `createdAt`, etc., or stay minimal (`id`, `name`)?
- [ ] Should we add a global exception handler (`@ControllerAdvice`) from the start or add it when needed?
