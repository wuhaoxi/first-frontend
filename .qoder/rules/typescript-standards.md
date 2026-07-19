---
description: TypeScript coding standards for this project
globs: ["src/**/*.ts", "tests/**/*.ts"]
alwaysApply: false
---

# TypeScript Standards

## General

- Use ES2022+ features with ESM modules
- Strict mode enabled in tsconfig.json
- Prefer `const` over `let`; avoid `var`
- Use explicit return types for exported functions

## Naming

- `camelCase` for variables and functions
- `PascalCase` for types, interfaces, and classes
- `kebab-case` for file names

## Testing

- Test files mirror source structure: `tests/` mirrors `src/`
- Use Vitest with `describe`/`it`/`expect`
- Every exported function must have tests
- Test behavior, not implementation details

## Error Handling

- Use typed errors; avoid generic `Error` for domain-specific failures
- Always handle promise rejections
- Log meaningful context with errors
