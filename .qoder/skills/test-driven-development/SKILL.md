---
name: test-driven-development
description: Enforces the RED-GREEN-REFACTOR TDD cycle. Write failing test, watch it fail, write minimal code, watch it pass, commit. Use before writing any implementation code, during every task in a plan, or when adding any new functionality.
---

# Test-Driven Development

Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit.

## When to Activate

- Before writing any implementation code
- During every task in an implementation plan
- When adding any new functionality

## The Cycle

### 1. RED — Write a Failing Test
- Write a test that describes the desired behavior
- Run it and confirm it FAILS
- If the test passes before writing code, the test is wrong

### 2. GREEN — Write Minimal Code
- Write the simplest code that makes the test pass
- Don't add features beyond what the test requires
- Run the test and confirm it PASSES

### 3. REFACTOR — Clean Up
- Remove duplication, improve naming, simplify
- Run ALL tests to ensure nothing breaks
- Commit with a clear message

## Rules

- **Tests first, always** — Code written before tests gets deleted
- **One test at a time** — Don't batch test writing
- **Watch it fail** — Confirm the test actually catches the missing behavior
- **Minimal implementation** — Only write code to pass the current test
- **Run all tests** — Every change must not break existing tests

## Testing Anti-Patterns (Avoid)

- Testing implementation details instead of behavior
- Tests that always pass regardless of code correctness
- Skipping the RED step (not confirming the test fails first)
- Writing tests after implementation
- Over-mocking (testing your mocks, not your code)
