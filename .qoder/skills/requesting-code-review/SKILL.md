---
name: requesting-code-review
description: Reviews implementation against the plan with a pre-review checklist. Use after completing a phase or significant task, before moving to the next major piece, or when validation is needed.
---

# Requesting Code Review

Activates between tasks. Reviews implementation against the plan with a pre-review checklist.

## When to Activate

- After completing a phase or significant task
- Before moving to the next major piece of work
- When you want validation that implementation is on track

## Pre-Review Checklist

Before requesting review, verify:

- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code follows project conventions
- [ ] New code has corresponding tests
- [ ] Changes match the spec in `openspec/changes/<name>/specs/`
- [ ] No TODO comments left unresolved
- [ ] Documentation updated if APIs changed

## Review Process

1. **Self-review** — Read through all changes before requesting review
2. **Context** — Provide the reviewer with:
   - Which task(s) this implements
   - Link to the spec/design docs
   - Any known concerns or trade-offs
3. **Request** — Ask for review with clear scope
4. **Wait** — Don't proceed until review is complete

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| Critical | Breaks spec or introduces bugs | Must fix before proceeding |
| Warning | Code quality issue, potential problem | Should fix, discuss if unclear |
| Info | Style preference, minor suggestion | Consider, don't block |
