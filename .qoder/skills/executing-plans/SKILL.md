---
name: executing-plans
description: Executes implementation tasks in batches with human checkpoints between phases. Use when the user says go/implement/execute, after a plan has been reviewed, or when working through a tasks.md checklist.
---

# Executing Plans

Activates with an approved plan. Executes tasks in batches with human checkpoints between phases.

## When to Activate

- When the user says "go", "implement", or "execute the plan"
- After a plan has been written and reviewed
- When working through a tasks.md checklist

## Process

1. **Load the plan** — Read `openspec/changes/<name>/tasks.md`
2. **Batch by phase** — Execute one phase at a time
3. **Execute each task** — Follow the task description exactly
4. **Verify** — Run the verification step for each task
5. **Checkpoint** — After each phase, report progress and ask for confirmation
6. **Update** — Mark completed tasks in tasks.md

## Checkpoint Format

```
Phase 1: Foundation ✅
  1.1 ✅ Added user validation — test passes
  1.2 ✅ Added database schema — migration runs clean

Ready for Phase 2: Core Implementation. Continue?
```

## Guidelines

- Never skip verification steps
- Stop and report if a task fails verification
- Don't proceed to next phase without human confirmation
- Update tasks.md as you go
- If you discover the plan needs changes, stop and discuss
