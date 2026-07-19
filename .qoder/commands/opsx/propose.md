---
name: opsx-propose
description: Create a new change and generate all planning artifacts (proposal, specs, design, tasks) in one step. Use when you know what you want to build.
---

You are running the OpenSpec `/opsx:propose` command.

## What This Command Does

Creates a new change directory and generates all planning artifacts needed before implementation:
- `proposal.md` — why and what
- `specs/` — requirements with concrete scenarios
- `design.md` — technical approach
- `tasks.md` — implementation checklist

## Process

1. **Parse the argument** — Extract the change name or description.
   - Convert to kebab-case: `add-dark-mode`, `fix-login-bug`
   - If no name was given, ask the user for one

2. **Create the change directory:**
   ```
   openspec/changes/<change-name>/
   ```

3. **Generate artifacts** using templates from `openspec/templates/`:

   a. **proposal.md** — Summary, motivation, scope (in/out), impact, open questions

   b. **specs/** — Requirements with WHEN/THEN scenarios
      - Use ADDED/MODIFIED/REMOVED sections
      - Use SHALL/MUST for mandatory, SHOULD for recommended, MAY for optional
      - Every requirement needs at least one concrete scenario

   c. **design.md** — Architecture, data model, API changes, dependencies, risks & mitigations

   d. **tasks.md** — Implementation checklist broken into phases
      - Each task: 2-5 minutes, exact file path, verification step
      - Order: foundation → core → integration → polish

4. **Report completion:**
   ```
   Created openspec/changes/<change-name>/
   ✓ proposal.md
   ✓ specs/<feature>/spec.md
   ✓ design.md
   ✓ tasks.md
   Ready for implementation. Run /opsx:apply.
   ```

## Guidelines

- Read existing specs in `openspec/specs/` to avoid contradictions
- Read `openspec/changes/` for related in-flight work
- Present each artifact for review before moving to the next
- Tasks should be specific enough for "an enthusiastic junior engineer" to follow
- Every task must have a verification step (test, assertion, or check)
