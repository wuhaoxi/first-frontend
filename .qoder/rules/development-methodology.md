---
description: Core development methodology rules that always apply to this project
globs:
alwaysApply: true
---

# Project Development Rules

This project follows the **Harness + OpenSpec + Superpowers** methodology.

## Specification-Driven Development (OpenSpec)

- **Agree before you build** — Align on specs before writing code
- Every feature starts with a proposal in `openspec/changes/<feature-name>/`
- Specs use plain Markdown with SHALL/MUST/SHOULD/MAY requirements and WHEN/THEN scenarios
- Living specs in `openspec/specs/` are the source of truth
- Completed changes are archived to `openspec/changes/archive/YYYY-MM-DD-<name>/`

## Skill-Driven Workflows (Superpowers)

- Check for relevant skills in `.qoder/skills/` before any task
- Skills are mandatory workflows, not suggestions
- Core sequence: brainstorming → writing-plans → test-driven-development → code-review → finishing

## Code Quality Rules

- **Tests first** — Write tests before implementation (RED-GREEN-REFACTOR)
- **Systematic debugging** — Use 4-phase root cause process, not guessing
- **Evidence over claims** — Prove it works with test output, not assertions
- **YAGNI** — Don't over-engineer; build only what's needed
- **DRY** — Don't repeat yourself; extract shared logic
- Keep tasks small (2-5 minutes each) with verification steps
