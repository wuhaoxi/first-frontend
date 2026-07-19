# Specification: spring-boot-api

## ADDED Requirements

### Requirement: Maven Project Structure
The project SHALL be a valid Maven project with a `pom.xml` declaring Spring Boot 3.3.6 as the parent, Java 17 as the source/target version, and all required dependencies (spring-boot-starter-web, spring-boot-starter-data-jpa, mysql-connector-j, lombok, spring-boot-devtools, spring-boot-starter-test, h2). The project SHALL include a Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`) so builds work without a global Maven installation.

#### Scenario: Build succeeds with Maven Wrapper
- **WHEN** a developer runs `./mvnw clean package -DskipTests` from the project root
- **THEN** the build completes successfully and produces a JAR in `target/`

#### Scenario: Project compiles with Java 17
- **WHEN** the project is compiled
- **THEN** all source files compile without errors under Java 17 language features

---

### Requirement: Spring Boot Application Entry Point
The project SHALL have a `@SpringBootApplication` main class that bootstraps the application on port `8080` by default.

#### Scenario: Application starts successfully
- **WHEN** the application is started with a valid MySQL connection (or H2 test profile)
- **THEN** Spring Boot starts without errors and listens on port 8080

#### Scenario: Health endpoint responds
- **WHEN** a client sends `GET /actuator/health` (or the root context is reachable)
- **THEN** the server responds with HTTP 200

---

### Requirement: REST API with CRUD Endpoints
The system SHALL expose RESTful CRUD endpoints for a `User` resource at `/api/users`:
- `GET /api/users` — list all users
- `GET /api/users/{id}` — get user by ID
- `POST /api/users` — create a new user
- `PUT /api/users/{id}` — update an existing user
- `DELETE /api/users/{id}` — delete a user

All endpoints SHALL accept and return `application/json`.

#### Scenario: Create a user
- **WHEN** a client sends `POST /api/users` with body `{"name": "Alice", "email": "alice@example.com"}`
- **THEN** the server responds with HTTP 201 and returns the created user including a generated `id`

#### Scenario: List all users
- **WHEN** a client sends `GET /api/users`
- **THEN** the server responds with HTTP 200 and a JSON array of all users

#### Scenario: Get user by ID
- **WHEN** a client sends `GET /api/users/1` and a user with id=1 exists
- **THEN** the server responds with HTTP 200 and the user JSON

#### Scenario: Get non-existent user
- **WHEN** a client sends `GET /api/users/999` and no user with id=999 exists
- **THEN** the server responds with HTTP 404

#### Scenario: Update a user
- **WHEN** a client sends `PUT /api/users/1` with body `{"name": "Alice Updated"}` and user id=1 exists
- **THEN** the server responds with HTTP 200 and the updated user

#### Scenario: Delete a user
- **WHEN** a client sends `DELETE /api/users/1` and user id=1 exists
- **THEN** the server responds with HTTP 204 and the user is removed from the database

---

### Requirement: JPA Entity with MySQL Persistence
The system SHALL persist a `User` entity with fields: `id` (Long, auto-generated), `name` (String, required), `email` (String, required, unique). Data SHALL be stored in MySQL via Spring Data JPA / Hibernate.

#### Scenario: Entity is persisted to MySQL
- **WHEN** a new user is created via the REST API
- **THEN** the user row is inserted into the `users` table in MySQL with all fields populated

#### Scenario: Unique email constraint enforced
- **WHEN** a client creates a user with an email that already exists
- **THEN** the server responds with HTTP 409 (Conflict) and a descriptive error message

---

### Requirement: Layered Architecture
The codebase SHALL follow a layered architecture with clearly separated concerns:
- `entity` — JPA domain objects
- `repository` — Spring Data interfaces
- `service` — business logic
- `controller` — REST endpoint handlers
- `dto` — data transfer objects for API contracts

#### Scenario: No layer violates its boundary
- **WHEN** a code review inspects the `controller` package
- **THEN** no controller class directly imports or uses a `repository` interface (must go through `service`)

---

### Requirement: Application Configuration
The project SHALL provide `application.yml` with a `dev` profile configured for local MySQL (`localhost:3306`) and a `test` profile using H2 in-memory database.

#### Scenario: Dev profile connects to local MySQL
- **WHEN** the application starts with `--spring.profiles.active=dev`
- **THEN** it connects to `jdbc:mysql://localhost:3306/myapp` and Hibernate auto-creates tables

#### Scenario: Test profile uses H2
- **WHEN** tests are run (which activate the `test` profile)
- **THEN** the application uses an H2 in-memory database and all CRUD operations work without MySQL

---

### Requirement: Unit and Integration Tests
The project SHALL include tests for the service layer (unit tests with Mockito) and the controller layer (integration tests with `@WebMvcTest` or `@SpringBootTest`).

#### Scenario: Service unit tests pass
- **WHEN** `./mvnw test` is executed
- **THEN** all service-layer tests pass with mocked repository dependencies

#### Scenario: Controller integration tests pass
- **WHEN** `./mvnw test` is executed
- **THEN** all controller tests pass, verifying HTTP status codes and JSON response shapes

---

## MODIFIED Requirements

None. This is a new project.

## REMOVED Requirements

None.

## Non-Functional Requirements

- **Performance**: The scaffolded API SHALL respond to simple GET requests in under 100ms on a local machine (no N+1 queries).
- **Maintainability**: All Java source files SHALL be in the package `com.first.app` following Maven standard directory layout (`src/main/java/...`, `src/test/java/...`).
- **Build reproducibility**: The `pom.xml` SHALL pin all dependency versions explicitly or rely on the Spring Boot BOM for transitive dependency management.
