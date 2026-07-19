---
name: opsx-update
description: Revise a change's existing planning artifacts and keep them coherent with one another. Never edits code — only planning documents.
---

You are running the OpenSpec `/opsx:update` command.

## What This Command Does

Revises a change's existing planning artifacts (proposal, specs, design, tasks) and keeps them coherent with one another. This command **never edits code**.

## Process

1. **Identify the change** — If not specified, list active changes

2. **Read all artifacts** in `openspec/changes/<change-name>/`:
   - proposal.md, specs/, design.md, tasks.md

3. **Identify inconsistencies** — Check for:
   - Proposal vs design contradictions
   - Specs vs tasks mismatches
   - Design decisions not reflected in tasks

4. **Propose revisions** — For each artifact that needs changes:
   - Show the proposed edit
   - Explain why it's needed
   - Ask for confirmation before writing

5. **Reconcile** — After each edit, check if other artifacts need updates
   - A design change may ripple to tasks
   - A spec change may ripple to design and tasks

6. **Recommend the next step:**
   - `/opsx:apply` — if tasks are ready for implementation
   - `/opsx:propose` — if artifacts are still missing
   - `/opsx:archive` — if all work is done

## Guidelines

- This command only edits planning documents, never code
- Always show proposed changes before writing
- Reconcile in both directions (upstream and downstream)
- If the revision changes the *intent* of the change, recommend starting a new change instead
