---
name: finishing-a-development-branch
description: Verifies tests, presents merge/PR/keep/discard options, and cleans up after task completion. Use when all tasks in a plan are done, after verification passes, or when wrapping up a feature.
---

# Finishing a Development Branch

Activates when tasks are complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up.

## When to Activate

- When all tasks in a plan are marked complete
- After verification has passed
- When the user is ready to wrap up a feature

## Process

1. **Final verification**
   - Run full test suite
   - Run linting
   - Review all changed files

2. **Present options**
   - **Merge** — Merge into main/develop branch
   - **Pull Request** — Create a PR for team review
   - **Keep** — Keep the branch for further work
   - **Discard** — Throw away experimental work

3. **Clean up**
   - Remove temporary files
   - Update `openspec/changes/` status
   - Archive completed changes: move to `openspec/changes/archive/YYYY-MM-DD-<name>/`
   - Update living specs if requirements changed

## Archive Checklist

- [ ] All tasks completed and verified
- [ ] Tests pass
- [ ] Specs updated to reflect new behavior
- [ ] Change archived with date prefix
- [ ] Branch merged or PR created
