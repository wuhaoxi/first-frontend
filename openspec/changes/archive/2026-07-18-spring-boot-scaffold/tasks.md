# Tasks: spring-boot-scaffold

## Implementation Checklist

All paths below are relative to the new project root: `../my-first-project-backend/`

### Phase 1: Foundation

- [x] **1.1** Create project directory and Maven Wrapper (`my-first-project-backend/`, `.mvn/wrapper/maven-wrapper.properties`, `mvnw`, `mvnw.cmd`)
  - Verify: `./mvnw --version` prints Maven version without requiring a global Maven install

- [x] **1.2** Create `pom.xml` with Spring Boot 3.3.6 parent, Java 17, and all dependencies (spring-boot-starter-web, spring-boot-starter-data-jpa, spring-boot-starter-validation, mysql-connector-j, lombok, spring-boot-devtools, spring-boot-starter-test, h2)
  - Verify: `./mvnw dependency:resolve` downloads all dependencies without errors

- [x] **1.3** Create `.gitignore` with standard Java/Maven ignores (`target/`, `*.class`, `.idea/`, `*.iml`, `.DS_Store`)
  - Verify: `git status` shows `.gitignore` is tracked and `target/` is excluded

- [x] **1.4** Create Maven standard directory structure (`src/main/java/`, `src/main/resources/`, `src/test/java/`, `src/test/resources/`)
  - Verify: `find src -type d` shows the four standard directories

- [x] **1.5** Create `MyApplication.java` with `@SpringBootApplication` main class in package `com.first.app`
  - Verify: `./mvnw compile` compiles without errors

### Phase 2: Core Implementation

- [x] **2.1** Create `entity/User.java` — JPA entity with `@Entity @Table(name = "users")`, fields: `id` (Long, `@Id @GeneratedValue`), `name` (String, `@NotBlank @Column(length=100)`), `email` (String, `@NotBlank @Column(unique=true)`), using Lombok `@Data @NoArgsConstructor @AllArgsConstructor @Builder`
  - Verify: `./mvnw compile` succeeds; entity class has getters/setters/builder

- [x] **2.2** Create `repository/UserRepository.java` — interface extending `JpaRepository<User, Long>` with method `Optional<User> findByEmail(String email)`
  - Verify: `./mvnw compile` succeeds; repository interface is valid

- [x] **2.3** Create `dto/CreateUserRequest.java` and `dto/UpdateUserRequest.java` — Lombok `@Data` classes with `@NotBlank` validation on name and email (CreateUserRequest); optional fields on UpdateUserRequest
  - Verify: `./mvnw compile` succeeds

- [x] **2.4** Create `exception/ResourceNotFoundException.java` (extends `RuntimeException`) and `exception/DuplicateEmailException.java` (extends `RuntimeException`)
  - Verify: `./mvnw compile` succeeds

- [x] **2.5** Create `service/UserService.java` with methods: `findAll()`, `findById(Long id)`, `create(CreateUserRequest req)`, `update(Long id, UpdateUserRequest req)`, `delete(Long id)`. Inject `UserRepository`. Throw `ResourceNotFoundException` when user missing; check email uniqueness on create and throw `DuplicateEmailException` if exists.
  - Verify: `./mvnw compile` succeeds; service methods have correct signatures

- [x] **2.6** Create `controller/UserController.java` with `@RestController @RequestMapping("/api/users")`. Map: `GET /` → list all, `GET /{id}` → get by id, `POST /` → create (return 201), `PUT /{id}` → update, `DELETE /{id}` → delete (return 204). Use `@Valid` on request bodies. Inject only `UserService`, never `UserRepository`.
  - Verify: `./mvnw compile` succeeds; controller has no import of `UserRepository`

- [x] **2.7** Create `exception/GlobalExceptionHandler.java` with `@RestControllerAdvice`. Handle `ResourceNotFoundException` → 404, `DuplicateEmailException` → 409, `MethodArgumentNotValidException` → 400, `DataIntegrityViolationException` → 409. Return `{ "message": "..." }` JSON body.
  - Verify: `./mvnw compile` succeeds

### Phase 3: Configuration

- [x] **3.1** Create `src/main/resources/application.yml` with default profile set to `dev`, server port 8080, and `spring.jpa.hibernate.ddl-auto: update`
  - Verify: Application starts with `./mvnw spring-boot:run` (requires MySQL or switch to test profile)

- [x] **3.2** Create `src/main/resources/application-dev.yml` with MySQL connection: `jdbc:mysql://localhost:3306/myapp`, username `root`, empty password, `com.mysql.cj.jdbc.Driver`
  - Verify: Config file is valid YAML and contains correct JDBC URL

- [x] **3.3** Create `src/main/resources/application-test.yml` with H2 config: `spring.datasource.url: jdbc:h2:mem:testdb`, `spring.datasource.driver-class-name: org.h2.Driver`, `spring.jpa.database-platform: org.hibernate.dialect.H2Dialect`
  - Verify: Running tests with test profile uses H2 (no MySQL needed)

### Phase 4: Testing

- [x] **4.1** Create `src/test/resources/application-test.yml` (same H2 config as 3.3) and add `@ActiveProfiles("test")` annotation support
  - Verify: Test context loads with H2 database

- [x] **4.2** Create `service/UserServiceTest.java` — unit tests with `@ExtendWith(MockitoExtension.class)`, `@Mock UserRepository`, `@InjectMocks UserService`. Test: `create_success`, `create_duplicateEmail_throwsException`, `findById_exists_returnsUser`, `findById_notExists_throwsNotFoundException`, `findAll_returnsList`, `update_success`, `delete_success`
  - Verify: `./mvnw test -Dtest=UserServiceTest` — all 7 tests pass

- [x] **4.3** Create `controller/UserControllerTest.java` — integration tests with `@WebMvcTest(UserController.class)`, `@MockBean UserService`. Test each endpoint returns correct HTTP status and JSON shape: `GET /api/users` → 200, `GET /api/users/1` → 200, `GET /api/users/999` → 404, `POST /api/users` with valid body → 201, `POST /api/users` with blank name → 400, `PUT /api/users/1` → 200, `DELETE /api/users/1` → 204
  - Verify: `./mvnw test -Dtest=UserControllerTest` — all 7 tests pass

- [x] **4.4** Run full test suite: `./mvnw clean test`
  - Verify: All tests pass (BUILD SUCCESS), no compilation errors, no test failures

### Phase 5: Polish

- [x] **5.1** Add `README.md` at project root with: project description, prerequisites (Java 17, MySQL 8), how to run (`./mvnw spring-boot:run`), how to test (`./mvnw test`), API endpoint summary table
  - Verify: README renders correctly and all commands are accurate

- [x] **5.2** Run `./mvnw clean package` to produce the final JAR
  - Verify: `target/my-first-project-backend-0.0.1-SNAPSHOT.jar` exists and `java -jar target/*.jar` starts the application (with test or dev profile)
