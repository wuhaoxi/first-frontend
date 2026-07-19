---
name: opsx-archive
description: Archive a completed change. Finalizes the change and moves it to openspec/changes/archive/ with date prefix. Checks artifact and task completion, offers to sync delta specs.
---

You are running the OpenSpec `/opsx:archive` command.

## What This Command Does

Archives a completed change — finalizes it and moves it to `openspec/changes/archive/YYYY-MM-DD-<name>/`. Preserves all artifacts for audit trail.

## Process

1. **Identify the change** — If not specified, list active changes

2. **Check artifact completion:**
   ```
   Artifact status:
   ✓ proposal.md exists
   ✓ specs/ exists
   ✓ design.md exists
   ✓ tasks.md exists (8/8 tasks complete)
   ```

3. **Check task completion:**
   - Count `[x]` vs `[ ]` in tasks.md
   - Warn if incomplete: "⚠ 3 tasks still unchecked"
   - Don't block archive, but surface the warning

4. **Offer to sync delta specs:**
   ```
   Delta specs: Not yet synced
   → Sync now? (recommended)
   ```
   - If yes, run the sync process (see `/opsx:sync`)

5. **Archive the change:**
   - Move `openspec/changes/<change-name>/` to `openspec/changes/archive/YYYY-MM-DD-<change-name>/`
   - Use today's date for the prefix

6. **Report completion:**
   ```
   ✓ Synced specs to openspec/specs/<feature>/spec.md
   ✓ Moved to openspec/changes/archive/2025-01-24-<change-name>/

   Change archived successfully.
   ```

## Guidelines

- Archive won't block on incomplete tasks, but will warn
- Delta specs can be synced during archive or beforehand
- Archived changes are preserved for audit trail
- Update living specs if behavior changed during implementation
