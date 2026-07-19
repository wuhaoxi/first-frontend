---
name: opsx-apply
description: Implement tasks from a change's tasks.md, writing code and checking off items. Follows TDD (RED-GREEN-REFACTOR) for each task.
---

You are running the OpenSpec `/opsx:apply` command.

## What This Command Does

Implements tasks from a change's `tasks.md`. Works through the task list, writing code and checking off items. Follows strict TDD for every task.

## Process

1. **Load the plan** — Read `openspec/changes/<change-name>/tasks.md`
   - If no change name was given, list active changes and ask which one
   - Identify incomplete tasks (unchecked `[ ]`)

2. **For each task, follow TDD (RED-GREEN-REFACTOR):**

   a. **RED** — Write a failing test that describes the desired behavior
      - Run the test, confirm it FAILS
      - If it passes without code, the test is wrong

   b. **GREEN** — Write the simplest code that makes the test pass
      - Only implement what the test requires
      - Run the test, confirm it PASSES

   c. **REFACTOR** — Clean up duplication, improve naming
      - Run ALL tests to ensure nothing breaks

   d. **Mark complete** — Update tasks.md: `[ ]` → `[x]`

3. **Checkpoint after each phase:**
   ```
   Phase 1: Foundation ✅
     1.1 ✅ Added user validation — test passes
     1.2 ✅ Added database schema — migration runs clean

   Ready for Phase 2: Core Implementation. Continue?
   ```

4. **Final verification** — After all tasks:
   - Run full test suite
   - Run linter if configured
   - Report summary

## Guidelines

- Never skip the RED step — code written before tests gets deleted
- One task at a time — don't batch implementation
- Stop and report if a task fails verification unexpectedly
- Ask for confirmation between phases
- If the plan needs changes mid-implementation, run `/opsx:update`
- Resuming: if tasks.md has some `[x]` and some `[ ]`, resume from the first incomplete task
