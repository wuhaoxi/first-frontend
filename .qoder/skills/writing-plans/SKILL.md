---
name: writing-plans
description: Breaks approved designs into bite-sized implementation tasks (2-5 min each) with exact file paths, complete code, and verification steps. Use after design approval, when asked to plan or break down work, or before starting multi-step feature implementation.
---

# Writing Plans

Activates with an approved design. Breaks work into bite-sized tasks (2-5 minutes each) with exact file paths, complete code, and verification steps.

## When to Activate

- After a design has been validated through brainstorming
- When the user says "let's plan this" or "break this down"
- Before starting implementation of any multi-step feature

## Process

1. **Review the design** — Understand all requirements and constraints
2. **Decompose** — Break into phases, then into individual tasks
3. **Specify** — Each task gets:
   - Exact file path(s) to create or modify
   - Clear description of what to implement
   - Verification step (test, assertion, or check)
4. **Order** — Dependencies first, then core logic, then integration
5. **Save** — Write plan to `openspec/changes/<name>/tasks.md`

## Task Format

```markdown
- [ ] **1.1** Add user validation function (`src/validators/user.ts`)
  - Verify: `npm test -- validators/user` passes
```

## Guidelines

- Tasks should be 2-5 minutes of work each
- Every task must be independently verifiable
- Include test-writing tasks alongside implementation tasks
- Order: foundation → core → integration → polish
- Be specific enough for "an enthusiastic junior engineer with poor taste" to follow
